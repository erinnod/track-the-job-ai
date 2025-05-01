import { Bell, Search, PlusCircle, Menu, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAvatar } from '@/contexts/AvatarContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useToast } from '@/components/ui/use-toast'
import AddJobModal from '@/components/jobs/AddJobModal'
import { JobApplication } from '@/data/mockJobs'
import { supabase } from '@/lib/supabase'
import { useJobs } from '@/contexts/JobContext'

// Set to false to disable verbose logging in production
const DEBUG = false

// Debug logger that only logs in development mode
const debugLog = (...args: any[]) => {
	if (DEBUG) {
		console.log(...args)
	}
}

interface NavbarProps {
	onMenuClick?: () => void
}

const Navbar = ({ onMenuClick }: NavbarProps = {}) => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
	const [avatarLoading, setAvatarLoading] = useState(true)
	const [avatarFadeIn, setAvatarFadeIn] = useState(false)
	const [notificationsOpen, setNotificationsOpen] = useState(false)
	const previousUserId = useRef<string | null>(null)
	const navigate = useNavigate()
	const { user, logout, isAuthenticated } = useAuth()
	const { lastUpdate } = useAvatar()
	const { toast } = useToast()
	const { notifications, unreadCount, markAsRead, markAllAsRead } =
		useNotifications()
	const isMounted = useRef(true)
	const [addJobModalOpen, setAddJobModalOpen] = useState(false)
	const { addJob } = useJobs()

	// Get the 3 most recent notifications - memoize to prevent recalculation
	const recentNotifications = useMemo(() => {
		return notifications.slice(0, 3)
	}, [notifications])

	// Memoize the time ago function to only re-create when needed
	const getTimeAgo = useCallback((date: Date) => {
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

		let interval = seconds / 31536000
		if (interval > 1) return Math.floor(interval) + ' years ago'

		interval = seconds / 2592000
		if (interval > 1) return Math.floor(interval) + ' months ago'

		interval = seconds / 86400
		if (interval > 1) return Math.floor(interval) + ' days ago'

		interval = seconds / 3600
		if (interval > 1) return Math.floor(interval) + ' hours ago'

		interval = seconds / 60
		if (interval > 1) return Math.floor(interval) + ' minutes ago'

		return Math.floor(seconds) + ' seconds ago'
	}, [])

	// Fetch user's avatar when component mounts or when avatar is updated
	useEffect(() => {
		let isActive = true // Track if the component is still mounted
		let fetchTimeout: number | null = null

		const fetchUserAvatar = async () => {
			// Prevent multiple simultaneous fetches
			if (!isActive) return

			try {
				// Skip if no user or same user (unless it's an explicit avatar update)
				if (!user?.id) {
					setAvatarUrl(null)
					setAvatarLoading(false)
					setAvatarFadeIn(false)
					return
				}

				// Create a unique reference for this fetch operation
				const fetchId = Date.now()
				debugLog(`[${fetchId}] Starting avatar fetch for user ${user.id}`)

				// Avoid duplicate fetches for same data
				const isAvatarUpdateTrigger =
					previousUserId.current === user.id && lastUpdate
				const isFreshUser = previousUserId.current !== user.id

				// Use sessionStorage to cache avatar URL to minimize refetches
				const cachedAvatarUrl = sessionStorage.getItem(`avatar_${user.id}`)
				const cachedTimestamp = sessionStorage.getItem(
					`avatar_timestamp_${user.id}`
				)
				const cacheAge = cachedTimestamp
					? Date.now() - parseInt(cachedTimestamp, 10)
					: null

				// If we have a cached URL, use it unless it's stale (older than 15 minutes) or an update was triggered
				// Increased cache time from 5 minutes to 15 minutes
				if (
					cachedAvatarUrl &&
					cacheAge &&
					cacheAge < 15 * 60 * 1000 && // 15 minutes
					!isAvatarUpdateTrigger
				) {
					debugLog(`[${fetchId}] Using cached avatar URL from sessionStorage`)
					setAvatarUrl(cachedAvatarUrl)
					setAvatarLoading(false)
					return
				}

				// Skip fetching if already have the avatar and no explicit update was triggered
				if (
					previousUserId.current === user.id &&
					!isAvatarUpdateTrigger &&
					avatarUrl &&
					!avatarLoading
				) {
					debugLog(`[${fetchId}] Using cached avatar, skipping fetch`)
					return
				}

				if (!isActive) return // Check again before setting loading state

				// Store user ID to avoid unnecessary fetches
				previousUserId.current = user.id

				// If the avatar is explicitly being updated, do the full fetch
				// Otherwise, if we already have a cached avatar URL but it's stale, use it for now
				// and schedule a background refresh
				if (!isAvatarUpdateTrigger && cachedAvatarUrl) {
					// Use existing cached avatar but queue background refresh
					setAvatarUrl(cachedAvatarUrl)
					setAvatarLoading(false)

					// Schedule background refresh
					setTimeout(() => {
						if (isActive) {
							refreshAvatarInBackground(user.id)
						}
					}, 5000) // Delay the background refresh by 5 seconds
					return
				}

				setAvatarLoading(true)
				setAvatarFadeIn(false)

				// Get the user's profile - only fetch the avatar_url field
				const { data, error } = await supabase
					.from('profiles')
					.select('avatar_url')
					.eq('id', user.id)
					.single()

				if (!isActive) return // Check if still mounted

				if (error) {
					console.error(`[${fetchId}] Error fetching profile:`, error)
					setAvatarLoading(false)
					return
				}

				if (!data?.avatar_url) {
					debugLog(`[${fetchId}] No avatar URL found in profile`)
					setAvatarUrl(null)
					setAvatarLoading(false)
					return
				}

				// Get the public URL for the avatar
				const { data: urlData } = await supabase.storage
					.from('avatars')
					.getPublicUrl(data.avatar_url)

				if (!isActive) return // Check if still mounted

				// If we don't have a URL, bail out
				if (!urlData?.publicUrl) {
					debugLog(`[${fetchId}] No public URL returned from storage`)
					setAvatarUrl(null)
					setAvatarLoading(false)
					return
				}

				// Add cache busting query parameter to force refresh
				const cacheBustUrl = `${urlData.publicUrl}?t=${
					isAvatarUpdateTrigger ? lastUpdate : Date.now()
				}`
				debugLog(`[${fetchId}] Setting navbar avatar URL:`, cacheBustUrl)

				// Store in sessionStorage
				sessionStorage.setItem(`avatar_${user.id}`, cacheBustUrl)
				sessionStorage.setItem(
					`avatar_timestamp_${user.id}`,
					Date.now().toString()
				)

				// Set the URL and let the image handle loading
				setAvatarUrl(cacheBustUrl)
				setAvatarLoading(false)
				setAvatarFadeIn(true)
			} catch (error) {
				console.error('Exception fetching avatar:', error)
				if (isActive) {
					setAvatarLoading(false)
					setAvatarFadeIn(false)
				}
			}
		}

		// Function to refresh avatar in background without blocking UI
		const refreshAvatarInBackground = async (userId: string) => {
			try {
				const { data, error } = await supabase
					.from('profiles')
					.select('avatar_url')
					.eq('id', userId)
					.single()

				if (error || !data?.avatar_url || !isActive) return

				const { data: urlData } = await supabase.storage
					.from('avatars')
					.getPublicUrl(data.avatar_url)

				if (!urlData?.publicUrl || !isActive) return

				const cacheBustUrl = `${urlData.publicUrl}?t=${Date.now()}`

				// Silently update cache
				sessionStorage.setItem(`avatar_${userId}`, cacheBustUrl)
				sessionStorage.setItem(
					`avatar_timestamp_${userId}`,
					Date.now().toString()
				)

				// Don't update UI if this was a background refresh
				debugLog(`Background refresh of avatar completed for ${userId}`)
			} catch (error) {
				console.error('Background avatar refresh error:', error)
			}
		}

		// Debounce the fetch to prevent multiple simultaneous requests
		if (fetchTimeout) {
			window.clearTimeout(fetchTimeout)
		}

		// Use a short timeout to debounce rapid auth state changes
		fetchTimeout = window.setTimeout(fetchUserAvatar, 200)

		// Cleanup function
		return () => {
			isActive = false // Mark component as unmounted
			isMounted.current = false
			if (fetchTimeout) {
				window.clearTimeout(fetchTimeout)
			}
		}
	}, [user?.id, lastUpdate]) // Only depend on user ID and lastUpdate, not the entire user object

	// Listen for avatar update events
	useEffect(() => {
		const handleAvatarUpdate = (event: CustomEvent) => {
			debugLog('Navbar: Received avatar-updated event')
			// We don't need to manually set avatar loading state here
			// The effect with lastUpdate dependency will automatically trigger
			// and handle the refresh properly
		}

		// Add event listener
		window.addEventListener(
			'avatar-updated',
			handleAvatarUpdate as EventListener
		)

		// Clean up
		return () => {
			window.removeEventListener(
				'avatar-updated',
				handleAvatarUpdate as EventListener
			)
		}
	}, [])

	// Memoize user initials calculation to prevent recalculation on every render
	const initials = useMemo(() => {
		if (!user) return 'U'

		const userMeta = user.user_metadata

		if (userMeta && userMeta.first_name && userMeta.last_name) {
			return `${userMeta.first_name.charAt(0)}${userMeta.last_name.charAt(
				0
			)}`.toUpperCase()
		}

		if (user.email) {
			return user.email.charAt(0).toUpperCase()
		}

		return 'U'
	}, [user])

	// Memoize user display name calculation to prevent recalculation on every render
	const userDisplayName = useMemo(() => {
		if (!user) return 'User'

		const userMeta = user.user_metadata

		if (userMeta && userMeta.first_name && userMeta.last_name) {
			return `${userMeta.first_name} ${userMeta.last_name}`
		}

		return user.email?.split('@')[0] || 'User'
	}, [user])

	const handleLogout = async () => {
		try {
			await logout()
			toast({
				title: 'Logged out',
				description: 'You have been successfully logged out',
			})
			navigate('/login')
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to log out. Please try again.',
				variant: 'destructive',
			})
		}
	}

	const handleAddJob = useCallback(
		(job: JobApplication) => {
			console.log('Navbar handleAddJob called, navigating to /applications')

			// The job is already being added by the AddJobModal component
			// through the JobContext, so we don't need to do anything else here
			// except navigate to applications

			// Add a small delay before navigating to ensure the job is added first
			setTimeout(() => {
				navigate('/applications')
			}, 300)
		},
		[navigate]
	)

	const handleMobileMenuToggle = () => {
		if (onMenuClick) {
			onMenuClick()
		}
	}

	// Different UI based on authentication status
	return (
		<header className='bg-white border-b border-gray-200 fixed w-full z-40'>
			<div className='px-4 sm:px-6 h-16 flex justify-between items-center'>
				{/* Logo and menu toggle */}
				<div className='flex items-center space-x-4'>
					{isAuthenticated && (
						<button
							onClick={handleMobileMenuToggle}
							className='text-gray-600 focus:outline-none md:hidden'
							aria-label='Toggle menu'
						>
							<Menu className='h-6 w-6' />
						</button>
					)}
					<Link
						to={isAuthenticated ? '/dashboard' : '/'}
						className='flex items-center space-x-1.5'
					>
						<span className='text-xl font-bold text-blue-600'>JobTrakr</span>
					</Link>
				</div>

				{/* Search bar - only visible on desktop */}
				{isAuthenticated && (
					<div className='hidden'>
						<div className='relative w-full'>
							<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
								<Search className='h-5 w-5 text-gray-400' />
							</div>
							<input
								type='text'
								placeholder='Search jobs, companies...'
								className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
							/>
						</div>
					</div>
				)}

				{/* Right side menu - conditionally show based on auth */}
				<div className='flex items-center space-x-1 sm:space-x-3'>
					{isAuthenticated ? (
						<>
							{/* Remove mobile search button */}

							{/* Add job button - collapsed on mobile */}
							<div className='hidden sm:block'>
								<AddJobModal />
							</div>
							<Button
								onClick={() =>
									document.getElementById('mobile-add-job-trigger')?.click()
								}
								size='sm'
								className='sm:hidden flex items-center px-1.5 py-0.5 rounded-lg text-xs'
								variant='default'
							>
								<PlusCircle className='h-3.5 w-3.5 mr-1' />
								<span>Add Job</span>
							</Button>
							<div className='hidden'>
								<AddJobModal buttonId='mobile-add-job-trigger' />
							</div>

							{/* Notifications dropdown */}
							<DropdownMenu
								open={notificationsOpen}
								onOpenChange={setNotificationsOpen}
							>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='relative'
										onClick={() => setNotificationsOpen(true)}
									>
										<Bell className='h-5 w-5' />
										{unreadCount > 0 && (
											<span className='absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white' />
										)}
									</Button>
								</DropdownMenuTrigger>
								{/* Notification dropdown content */}
								<DropdownMenuContent
									align='end'
									className='w-80 overflow-hidden p-0'
								>
									<div className='flex items-center justify-between p-4 border-b'>
										<h3 className='font-medium'>Notifications</h3>
										{unreadCount > 0 && (
											<button
												onClick={() => markAllAsRead()}
												className='text-xs text-blue-600 hover:underline'
											>
												Mark all as read
											</button>
										)}
									</div>

									<div className='max-h-80 overflow-y-auto'>
										{recentNotifications.length > 0 ? (
											recentNotifications.map((notification) => (
												<div
													key={notification.id}
													className={`p-4 border-b ${
														!notification.read
															? 'bg-blue-50'
															: 'hover:bg-gray-50'
													}`}
													onClick={() => markAsRead(notification.id)}
												>
													<div className='flex items-start space-x-3'>
														<div
															className={`mt-0.5 rounded-full p-1.5 ${
																notification.read
																	? 'bg-gray-100'
																	: 'bg-blue-100'
															}`}
														>
															{/* Display appropriate icon based on notification type */}
															<Calendar className='h-4 w-4 text-blue-600' />
														</div>
														<div className='flex-1 space-y-1 min-w-0'>
															<p className='text-sm font-medium text-gray-900 truncate'>
																{notification.title}
															</p>
															<p className='text-xs text-gray-500 truncate'>
																{notification.description}
															</p>
															<p className='text-xs text-gray-400'>
																{getTimeAgo(notification.date)}
															</p>
														</div>
													</div>
												</div>
											))
										) : (
											<div className='p-6 text-center text-gray-500'>
												<p className='text-sm'>No notifications yet</p>
											</div>
										)}
									</div>

									<div className='p-3 bg-gray-50 border-t text-center'>
										<Link
											to='/notifications'
											className='text-xs text-blue-600 hover:underline'
											onClick={() => setNotificationsOpen(false)}
										>
											View all notifications
										</Link>
									</div>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* User menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										className='rounded-full w-8 h-8 overflow-hidden p-0'
									>
										<div
											className={`rounded-full overflow-hidden transition-opacity duration-300 ${
												avatarLoading ? 'opacity-0' : 'opacity-100'
											} ${avatarFadeIn ? 'animation-fade-in' : ''}`}
										>
											<Avatar className='border border-gray-200'>
												<AvatarImage
													src={avatarUrl || ''}
													alt={user?.email || 'User avatar'}
													onLoad={() => {
														setAvatarLoading(false)
														setAvatarFadeIn(true)
													}}
												/>
												<AvatarFallback>
													{user?.email?.charAt(0).toUpperCase() || 'U'}
												</AvatarFallback>
											</Avatar>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='end'
									className='w-56'
								>
									<div className='p-3 border-b'>
										<p className='font-medium truncate'>
											{user?.email || 'User'}
										</p>
										<p className='text-xs text-gray-500 mt-0.5 truncate'>
											{user?.email || ''}
										</p>
									</div>
									<DropdownMenuItem
										onClick={() => {
											navigate('/settings/profile')
										}}
									>
										Profile Settings
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											navigate('/settings')
										}}
									>
										Preferences
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout}>
										Logout
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<>
							{/* Public navigation for non-authenticated users */}
							<div className='hidden sm:flex space-x-2'>
								<Link
									to='/'
									className='px-3 py-2 text-sm text-gray-700 hover:text-blue-600'
								>
									Home
								</Link>
								<Link
									to='/login'
									className='px-3 py-2 text-sm text-gray-700 hover:text-blue-600'
								>
									Log in
								</Link>
								<Button
									asChild
									size='sm'
								>
									<Link to='/signup'>Sign up</Link>
								</Button>
							</div>
							{/* Mobile menu toggle - for non-authenticated */}
							<div className='sm:hidden'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
										>
											<Menu className='h-5 w-5' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end'>
										<DropdownMenuItem asChild>
											<Link to='/'>Home</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link to='/login'>Log in</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link to='/signup'>Sign up</Link>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</>
					)}
				</div>
			</div>
		</header>
	)
}

export default Navbar
