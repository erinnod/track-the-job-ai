import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useMobileToast } from '@/components/ui/mobile-toast'

type ToastOptions = {
	title: string
	description?: string
	variant?: 'default' | 'destructive'
}

/**
 * A responsive toast hook that uses the mobile toast on small screens
 * and the desktop toast on larger screens.
 *
 * @returns A toast function that automatically picks the right toast implementation
 */
export function useResponsiveToast() {
	const { toast } = useToast()
	const { showToast: showMobileToast } = useMobileToast()
	const [isMobile, setIsMobile] = useState(false)

	// Check if we're on mobile
	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth < 768) // Matches the md breakpoint in Tailwind
		}

		// Initial check
		checkIfMobile()

		// Set up listener for window resize
		window.addEventListener('resize', checkIfMobile)

		// Cleanup
		return () => window.removeEventListener('resize', checkIfMobile)
	}, [])

	// Return a function that chooses the right toast based on screen size
	const responsiveToast = (options: ToastOptions) => {
		if (isMobile) {
			// Map variants between the two systems
			let mobileVariant: 'default' | 'success' | 'error' | 'warning' | 'info' =
				'default'

			if (options.variant === 'destructive') {
				mobileVariant = 'error'
			} else if (options.variant === 'default') {
				mobileVariant = 'success'
			}

			return showMobileToast({
				title: options.title,
				message: options.description,
				variant: mobileVariant,
				duration: 5000, // 5 seconds
			})
		} else {
			// Use the desktop toast on larger screens
			return toast({
				title: options.title,
				description: options.description,
				variant: options.variant,
			})
		}
	}

	return { toast: responsiveToast }
}
