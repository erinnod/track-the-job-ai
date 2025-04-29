import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/utils/security'

interface SecurityEvent {
	type: string
	timestamp: string
	details: Record<string, any>
}

// Maximum login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5
// Lockout duration in milliseconds (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000

// Global flag to disable admin checking after repeated issues
// This prevents unnecessary API calls if the feature is clearly not working
let globalAdminCheckDisabled = false

/**
 * SecurityMonitor - Invisible component that monitors for security events
 * This component doesn't render anything visible but adds security monitoring
 */
export const SecurityMonitor = () => {
	const { user } = useAuth()
	const { toast } = useToast()
	const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
	const failedLoginAttempts = useRef<Record<string, number>>({})
	const lockedIPs = useRef<Record<string, number>>({})

	// Log security events to console in development and to secure endpoint in production
	const logSecurityEvent = (type: string, details: Record<string, any>) => {
		// Skip excessive logging to reduce console clutter
		if (type === 'admin-check' || type === 'admin-check-error') {
			return
		}

		const event: SecurityEvent = {
			type,
			timestamp: new Date().toISOString(),
			details,
		}

		// Add to local state
		setSecurityEvents((prev) => [...prev, event])

		// Log to console in development - but only for important events
		if (process.env.NODE_ENV === 'development') {
			// Only log certain events to avoid spamming the console
			if (['login-failure', 'account-lockout', 'xss-attempt'].includes(type)) {
				console.warn('Security Event:', event)
			}
		}

		// In production, log directly to Supabase
		if (process.env.NODE_ENV === 'production') {
			import('@/lib/supabase')
				.then(({ supabase }) => {
					supabase
						.from('security_logs')
						.insert({
							type: event.type,
							details: event.details,
							timestamp: event.timestamp,
							ip: 'client-side',
						})
						.then(({ error }) => {
							if (error) {
								console.error(
									'Failed to log security event to Supabase:',
									error
								)
							}
						})
				})
				.catch((err) => {
					console.error('Failed to import Supabase client:', err)
				})
		}
	}

	// Monitor for failed login attempts
	useEffect(() => {
		const handleLoginFailure = (event: CustomEvent) => {
			const ip = event.detail?.ip || 'unknown'

			// Check if IP is locked
			if (lockedIPs.current[ip] && lockedIPs.current[ip] > Date.now()) {
				toast({
					title: 'Account Locked',
					description: 'Too many failed attempts. Please try again later.',
					variant: 'destructive',
				})

				logSecurityEvent('login-during-lockout', { ip })
				return
			}

			// Increment failed attempts
			failedLoginAttempts.current[ip] =
				(failedLoginAttempts.current[ip] || 0) + 1

			logSecurityEvent('failed-login', {
				ip,
				email: event.detail?.email || 'unknown',
				attempts: failedLoginAttempts.current[ip],
			})

			// Check for lockout threshold
			if (failedLoginAttempts.current[ip] >= MAX_LOGIN_ATTEMPTS) {
				lockedIPs.current[ip] = Date.now() + LOCKOUT_DURATION

				// Reset counter
				failedLoginAttempts.current[ip] = 0

				logSecurityEvent('account-lockout', { ip })

				toast({
					title: 'Account Temporarily Locked',
					description:
						'Too many failed login attempts. Please try again later.',
					variant: 'destructive',
				})
			}
		}

		// Listen for custom login failure events
		window.addEventListener('login-failure' as any, handleLoginFailure)

		return () => {
			window.removeEventListener('login-failure' as any, handleLoginFailure)
		}
	}, [])

	// Monitor for suspicious activities when user is logged in
	useEffect(() => {
		if (!user) return

		// Only continue if we have a user ID
		const userId = user.id
		if (!userId) return

		// Skip admin checking completely - it's not necessary for normal operation
		// and was causing excessive API calls
		// All admin checking code has been removed as it's not critical for security monitoring

		// Example: detect rapid navigation, which could indicate bot activity
		let navigationCount = 0
		let lastNavigationTime = Date.now()

		const handleNavigation = () => {
			const now = Date.now()
			const timeDiff = now - lastNavigationTime

			// If navigating too quickly (less than 500ms between navigations)
			if (timeDiff < 500) {
				navigationCount++

				// If too many rapid navigations, log as suspicious
				if (navigationCount > 5) {
					logSecurityEvent('rapid-navigation', {
						userId: userId,
						count: navigationCount,
						timeWindow: '500ms',
					})

					// Reset counter
					navigationCount = 0
				}
			} else {
				// Reset counter for normal navigation
				navigationCount = 0
			}

			lastNavigationTime = now
		}

		window.addEventListener('popstate', handleNavigation)

		return () => {
			window.removeEventListener('popstate', handleNavigation)
		}
	}, [user?.id]) // Only depend on user ID, not the full user object

	// Monitor for XSS attempts in URL
	useEffect(() => {
		const checkUrl = () => {
			const url = window.location.href
			const suspiciousPatterns = [
				/<script>/i,
				/javascript:/i,
				/on\w+=/i, // onclick=, onload=, etc.
				/alert\(/i,
				/eval\(/i,
			]

			for (const pattern of suspiciousPatterns) {
				if (pattern.test(url)) {
					logSecurityEvent('xss-attempt', {
						url,
						pattern: pattern.toString(),
					})

					// Optionally redirect to a safe page
					// window.location.href = '/';
					break
				}
			}
		}

		// Check on component mount and URL changes
		checkUrl()
		window.addEventListener('popstate', checkUrl)

		return () => {
			window.removeEventListener('popstate', checkUrl)
		}
	}, [])

	return null // This component doesn't render anything
}
