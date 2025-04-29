import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
	useRef,
} from 'react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import {
	supabase,
	preloadUserProfileData,
	clearUserCache,
} from '@/lib/supabase'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000
// Set to true for verbose logging, false for production
const DEBUG = false

// Debug logger that only logs in development mode
const debugLog = (...args: any[]) => {
	if (DEBUG) {
		console.log(...args)
	}
}

// Minimum time between user refresh calls (30 seconds instead of 10)
const MIN_REFRESH_INTERVAL = 30 * 1000

interface AuthContextType {
	user: User | null
	isLoading: boolean
	isAuthenticated: boolean
	logout: () => Promise<void>
	refreshUser: () => Promise<{ success: boolean; user: User | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Use function declaration for better HMR compatibility
export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

interface AuthProviderProps {
	children: ReactNode
}

// Use function declaration for better HMR compatibility
function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [sessionTimeoutId, setSessionTimeoutId] = useState<number | null>(null)
	const [lastRefreshTime, setLastRefreshTime] = useState<number>(0)
	const isRefreshingRef = useRef(false)

	const refreshUser = async () => {
		// Prevent concurrent refreshes with a ref
		if (isRefreshingRef.current) {
			debugLog('Skipping refresh - already in progress')
			return { success: !!user, user: user }
		}

		// Implement rate limiting for refreshUser calls
		const now = Date.now()
		if (now - lastRefreshTime < MIN_REFRESH_INTERVAL && user) {
			debugLog('Skipping refresh - too soon since last refresh')
			return { success: true, user: user }
		}

		try {
			isRefreshingRef.current = true
			setLastRefreshTime(now)

			// Don't set loading state if we already have a user
			// This prevents unnecessary loading flashes
			if (!user) {
				setIsLoading(true)
			}

			const { success, user: currentUser } = await getCurrentUser()

			if (!success) {
				debugLog('User session invalid or expired')

				// Try one more refresh
				try {
					const { data, error } = await supabase.auth.refreshSession()
					if (!error && data?.user) {
						setUser(data.user)
						// Preload profile data after successful refresh
						if (data.user.id) {
							preloadUserProfileData(data.user.id)
						}
						setIsLoading(false)
						return { success: true, user: data.user }
					}
				} catch (refreshError) {
					console.error('Session refresh failed:', refreshError)
				}
			}

			setUser(success ? currentUser : null)

			// Preload profile data when user is set
			if (success && currentUser) {
				preloadUserProfileData(currentUser.id)
			}

			return { success, user: currentUser }
		} catch (error) {
			console.error('Error fetching user:', error)
			// Check if we need to force logout due to authentication failure
			if (
				error &&
				typeof error === 'object' &&
				'status' in error &&
				error.status === 403
			) {
				setUser(null)
				// Clear any stored sessions/tokens to ensure clean state
				try {
					await supabase.auth.signOut({ scope: 'local' })
				} catch (signOutErr) {
					console.error('Error during forced sign-out:', signOutErr)
				}
			} else {
				setUser(null)
			}

			return { success: false, user: null }
		} finally {
			isRefreshingRef.current = false
			// Add a short timeout before setting isLoading false to prevent flashing
			setTimeout(() => {
				setIsLoading(false)
			}, 100)
		}
	}

	useEffect(() => {
		refreshUser()
	}, [])

	// Use useCallback to memoize the logout function
	const logout = useCallback(async () => {
		try {
			if (user) {
				clearUserCache(user.id)
			}
			await signOut()
			setUser(null)
			setSessionTimeoutId((prevTimeoutId) => {
				if (prevTimeoutId) {
					window.clearTimeout(prevTimeoutId)
				}
				return null
			})
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}, [user])

	// Reset session timeout when user is active - use the memoized logout
	const resetSessionTimeout = useCallback(() => {
		// Use functional update to avoid dependency on sessionTimeoutId
		setSessionTimeoutId((prevTimeoutId) => {
			// Clear existing timeout if it exists
			if (prevTimeoutId) {
				window.clearTimeout(prevTimeoutId)
			}

			// Only set new timeout if user is logged in
			if (user) {
				const timeoutId = window.setTimeout(() => {
					debugLog('Session expired due to inactivity')
					logout()
				}, SESSION_TIMEOUT)

				return timeoutId
			}

			return null
		})
	}, [user, logout])

	// Set up activity listeners to reset session timeout
	useEffect(() => {
		if (!user) return

		// Reset session timeout on initial login and user activity
		resetSessionTimeout()

		// Monitor user activity
		const activityEvents = [
			'mousedown',
			'keydown',
			'touchstart',
			'click',
			'scroll',
		]

		const handleActivity = () => {
			resetSessionTimeout()
		}

		// Add event listeners for user activity
		activityEvents.forEach((event) => {
			window.addEventListener(event, handleActivity)
		})

		// Clean up event listeners when component unmounts
		return () => {
			activityEvents.forEach((event) => {
				window.removeEventListener(event, handleActivity)
			})
			setSessionTimeoutId((prevTimeoutId) => {
				if (prevTimeoutId) {
					window.clearTimeout(prevTimeoutId)
				}
				return null
			})
		}
	}, [user, resetSessionTimeout])

	// Add auth state change listener for more reliable session tracking
	useEffect(() => {
		debugLog('Setting up auth state change listener...')
		const { data } = supabase.auth.onAuthStateChange((event, session) => {
			debugLog('Auth state changed:', event, 'Session user:', session?.user?.id)

			if (event === 'SIGNED_IN') {
				debugLog('User signed in:', session?.user?.email)
				setUser(session?.user || null)
				// Preload user data immediately on sign in
				if (session?.user?.id) {
					preloadUserProfileData(session.user.id)
				}
			} else if (event === 'SIGNED_OUT') {
				debugLog('User signed out')
				setUser(null)
			} else if (event === 'USER_UPDATED') {
				debugLog('User updated:', session?.user?.id)
				setUser(session?.user || null)
				// Refresh user data on user update
				if (session?.user?.id) {
					preloadUserProfileData(session.user.id)
				}
			} else if (event === 'TOKEN_REFRESHED') {
				debugLog('Token refreshed for user:', session?.user?.id)
				setUser(session?.user || null)
			}
		})

		return () => {
			debugLog('Cleaning up auth state listener')
			data.subscription.unsubscribe()
		}
	}, [])

	const value = {
		user,
		isLoading,
		isAuthenticated: !!user,
		logout,
		refreshUser,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
