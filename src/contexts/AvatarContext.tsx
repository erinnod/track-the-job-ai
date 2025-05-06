import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useCallback,
	useEffect,
	useRef,
} from 'react'

// Constants for storage and caching
const AVATAR_UPDATE_KEY = 'avatar_last_update'
const AVATAR_CACHE_DURATION = 1000 * 60 * 60 // 1 hour in milliseconds

interface AvatarContextType {
	lastUpdate: number
	triggerAvatarUpdate: () => void
	clearAvatarCache: () => void
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function useAvatar() {
	const context = useContext(AvatarContext)
	if (context === undefined) {
		throw new Error('useAvatar must be used within an AvatarProvider')
	}
	return context
}

interface AvatarProviderProps {
	children: ReactNode
}

function AvatarProvider({ children }: AvatarProviderProps) {
	const [lastUpdate, setLastUpdate] = useState(() => {
		// Try to get last update from localStorage first for consistency across page loads
		const storedLastUpdate = localStorage.getItem(AVATAR_UPDATE_KEY)

		if (storedLastUpdate) {
			const timestamp = parseInt(storedLastUpdate, 10)
			const now = Date.now()

			// Only use stored timestamp if it's valid and not too old
			if (!isNaN(timestamp) && now - timestamp < AVATAR_CACHE_DURATION) {
				return timestamp
			}
		}

		// Default to current time if no valid stored timestamp
		return Date.now()
	})

	// Listen for storage events from other tabs/windows
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === AVATAR_UPDATE_KEY && e.newValue) {
				const timestamp = parseInt(e.newValue, 10)
				if (!isNaN(timestamp)) {
					setLastUpdate(timestamp)
				}
			}
		}

		window.addEventListener('storage', handleStorageChange)
		return () => {
			window.removeEventListener('storage', handleStorageChange)
		}
	}, [])

	// Keep track of the last update time to avoid spamming
	const lastUpdateRef = useRef<number>(0)

	// Trigger an avatar update, forcing components to refetch the avatar
	const triggerAvatarUpdate = useCallback(() => {
		const now = Date.now()

		// Rate limit updates to once per second
		if (now - lastUpdateRef.current < 1000) {
			console.log('AvatarContext: Rate limiting update, skipping')
			return
		}

		lastUpdateRef.current = now
		console.log('AvatarContext: Triggering avatar update')

		// Update state
		setLastUpdate(now)

		// Add timestamp to localStorage to sync across tabs/windows
		localStorage.setItem(AVATAR_UPDATE_KEY, now.toString())

		// Dispatch custom event to ensure all components are notified
		try {
			const avatarUpdateEvent = new CustomEvent('avatar-updated', {
				detail: { timestamp: now },
			})
			window.dispatchEvent(avatarUpdateEvent)
			console.log('AvatarContext: Dispatched avatar-updated event')
		} catch (error) {
			console.error('Error dispatching avatar update event:', error)
		}
	}, [])

	// Clear avatar cache completely
	const clearAvatarCache = useCallback(() => {
		// Force a stronger cache invalidation
		const timestamp = Date.now()
		setLastUpdate(timestamp)
		localStorage.setItem(AVATAR_UPDATE_KEY, timestamp.toString())

		// Try to clear any image from browser cache by adding a dummy URL param
		console.log('Forcing avatar refresh at:', timestamp)
	}, [])

	const value = {
		lastUpdate,
		triggerAvatarUpdate,
		clearAvatarCache,
	}

	return (
		<AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
	)
}

export default AvatarProvider
