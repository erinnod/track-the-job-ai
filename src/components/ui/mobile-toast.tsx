import { ReactNode, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface MobileToastProps {
	title: string
	message?: string
	variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
	duration?: number
	onClose?: () => void
	isOpen: boolean
}

export function MobileToast({
	title,
	message,
	variant = 'default',
	duration = 5000,
	onClose,
	isOpen,
}: MobileToastProps) {
	useEffect(() => {
		if (isOpen && duration > 0) {
			const timer = setTimeout(() => {
				if (onClose) onClose()
			}, duration)

			return () => clearTimeout(timer)
		}
	}, [isOpen, duration, onClose])

	// Map variant to background color
	const getVariantClasses = () => {
		switch (variant) {
			case 'success':
				return 'bg-green-100 border-green-200 text-green-800'
			case 'error':
				return 'bg-red-100 border-red-200 text-red-800'
			case 'warning':
				return 'bg-yellow-100 border-yellow-200 text-yellow-800'
			case 'info':
				return 'bg-blue-100 border-blue-200 text-blue-800'
			default:
				return 'bg-white border-gray-200 text-gray-800'
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className='fixed bottom-4 left-0 right-0 z-50 mx-auto px-4 max-w-md'
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 50 }}
					transition={{ duration: 0.3 }}
				>
					<div
						className={cn(
							'rounded-lg shadow-lg border p-4 flex items-start',
							getVariantClasses()
						)}
					>
						<div className='flex-1'>
							<h4 className='font-medium text-sm'>{title}</h4>
							{message && <p className='text-xs mt-1 opacity-80'>{message}</p>}
						</div>
						<button
							onClick={onClose}
							className='ml-2 p-1 rounded-full hover:bg-black/5'
						>
							<X size={16} />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

// Provider and hook for using the mobile toast
import { createContext, useContext } from 'react'

interface MobileToastContextType {
	showToast: (props: Omit<MobileToastProps, 'isOpen' | 'onClose'>) => void
	hideToast: () => void
}

const MobileToastContext = createContext<MobileToastContextType | undefined>(
	undefined
)

export function MobileToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<Omit<
		MobileToastProps,
		'isOpen' | 'onClose'
	> | null>(null)
	const [isVisible, setIsVisible] = useState(false)

	const showToast = (props: Omit<MobileToastProps, 'isOpen' | 'onClose'>) => {
		setToast(props)
		setIsVisible(true)
	}

	const hideToast = () => {
		setIsVisible(false)
	}

	return (
		<MobileToastContext.Provider value={{ showToast, hideToast }}>
			{children}
			{toast && (
				<MobileToast
					{...toast}
					isOpen={isVisible}
					onClose={hideToast}
				/>
			)}
		</MobileToastContext.Provider>
	)
}

export function useMobileToast() {
	const context = useContext(MobileToastContext)
	if (!context) {
		throw new Error('useMobileToast must be used within a MobileToastProvider')
	}
	return context
}
