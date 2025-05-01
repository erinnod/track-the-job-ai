import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveContainerProps {
	children: ReactNode
	className?: string
	fluid?: boolean
}

/**
 * A container component that provides consistent responsive behavior.
 * - On mobile: full width with standard padding
 * - On larger screens: constrained width with centered alignment
 *
 * @param children The content to display inside the container
 * @param className Optional additional classes
 * @param fluid Whether the container should be full width on all screen sizes
 */
export function ResponsiveContainer({
	children,
	className,
	fluid = false,
}: ResponsiveContainerProps) {
	return (
		<div
			className={cn(
				'w-full px-4 sm:px-6 md:px-8 mx-auto',
				fluid ? 'max-w-none' : 'max-w-7xl',
				className
			)}
		>
			{children}
		</div>
	)
}

/**
 * A grid component that adapts from 1 column on mobile to multiple columns on larger screens
 */
interface ResponsiveGridProps {
	children: ReactNode
	className?: string
	columns?: {
		sm?: number
		md?: number
		lg?: number
		xl?: number
	}
	gap?: 'none' | 'small' | 'medium' | 'large'
}

export function ResponsiveGrid({
	children,
	className,
	columns = { sm: 1, md: 2, lg: 3, xl: 4 },
	gap = 'medium',
}: ResponsiveGridProps) {
	// Calculate grid template columns based on breakpoints
	const getGridCols = () => {
		const { sm = 1, md = 2, lg = 3, xl = 4 } = columns
		return [
			`grid-cols-${sm}`,
			`sm:grid-cols-${sm}`,
			`md:grid-cols-${md}`,
			`lg:grid-cols-${lg}`,
			`xl:grid-cols-${xl}`,
		].join(' ')
	}

	// Get gap class based on size
	const getGapClass = () => {
		switch (gap) {
			case 'none':
				return 'gap-0'
			case 'small':
				return 'gap-2 sm:gap-3'
			case 'large':
				return 'gap-6 sm:gap-8'
			case 'medium':
			default:
				return 'gap-4 sm:gap-6'
		}
	}

	return (
		<div
			className={cn('grid', getGridCols(), getGapClass(), 'w-full', className)}
		>
			{children}
		</div>
	)
}

/**
 * A stack component that vertically stacks items with consistent spacing
 */
interface ResponsiveStackProps {
	children: ReactNode
	className?: string
	spacing?: 'none' | 'small' | 'medium' | 'large'
}

export function ResponsiveStack({
	children,
	className,
	spacing = 'medium',
}: ResponsiveStackProps) {
	// Get spacing class based on size
	const getSpacingClass = () => {
		switch (spacing) {
			case 'none':
				return 'space-y-0'
			case 'small':
				return 'space-y-2 sm:space-y-3'
			case 'large':
				return 'space-y-6 sm:space-y-8'
			case 'medium':
			default:
				return 'space-y-4 sm:space-y-6'
		}
	}

	return (
		<div className={cn('flex flex-col', getSpacingClass(), className)}>
			{children}
		</div>
	)
}
