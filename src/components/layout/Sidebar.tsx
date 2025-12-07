import {
	LayoutDashboard,
	Briefcase,
	Kanban,
	FileText,
	Calendar,
	Settings,
	Coffee,
	HeartHandshake,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface SidebarLinkProps {
	icon: React.ElementType
	label: string
	to: string
	active?: boolean
	isExternal?: boolean
	highlight?: boolean
	onClick?: () => void
	collapsed?: boolean
}

const SidebarLink = ({
	icon: Icon,
	label,
	to,
	active,
	isExternal,
	highlight,
	onClick,
	collapsed = false,
}: SidebarLinkProps) => {
	// Handle click to ensure scroll resets
	const handleClick = () => {
		if (onClick) {
			onClick()
		}

		if (isExternal) return // Skip scroll handling for external links

		// Add a small delay to ensure the DOM has updated
		setTimeout(() => {
			// Specifically target the main element from Layout component
			const mainElement = document.querySelector('main')
			if (mainElement) {
				mainElement.scrollTop = 0
			}

			// Also scroll window to top as a fallback
			window.scrollTo(0, 0)
		}, 10)
	}

	// For external links, use an anchor tag instead of React Router Link
	if (isExternal) {
		return (
			<a
				href={to}
				target='_blank'
				rel='noopener noreferrer'
				className={cn(
					'flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors',
					collapsed ? 'justify-center px-2' : 'px-4',
					highlight
						? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200 shadow-sm hover:from-amber-200 hover:to-yellow-200 hover:text-amber-800 hover:shadow'
						: active
						? 'bg-blue-50 text-blue-700'
						: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
				)}
				onClick={handleClick}
				title={collapsed ? label : undefined}
			>
				<Icon className={cn('h-5 w-5', highlight && 'text-amber-500')} />
				{!collapsed && (
					<>
						<span className={highlight ? 'font-medium' : ''}>{label}</span>
						{highlight && (
							<span className='animate-pulse flex h-2 w-2 ml-1'>
								<span className='relative inline-flex rounded-full h-2 w-2 bg-amber-400'></span>
							</span>
						)}
					</>
				)}
			</a>
		)
	}

	return (
		<Link
			to={to}
			onClick={handleClick}
			className={cn(
				'flex items-center space-x-3 py-2 rounded-md transition-colors',
				collapsed ? 'justify-center px-2' : 'px-4',
				active
					? 'bg-blue-50 text-blue-700'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
			)}
			title={collapsed ? label : undefined}
		>
			<Icon className='h-5 w-5' />
			{!collapsed && <span>{label}</span>}
		</Link>
	)
}

interface SidebarProps {
	onLinkClick?: () => void
	collapsed?: boolean
}

const Sidebar = ({ onLinkClick, collapsed = false }: SidebarProps = {}) => {
	const location = useLocation()
	const currentPath = location.pathname
	const [showAnimation, setShowAnimation] = useState(false)

	// Add animation effect that triggers periodically
	useEffect(() => {
		const timer = setInterval(() => {
			setShowAnimation(true)
			const hideTimer = setTimeout(() => {
				setShowAnimation(false)
			}, 2000)

			return () => clearTimeout(hideTimer)
		}, 30000) // Show animation every 30 seconds

		// Initial animation after 3 seconds
		const initialTimer = setTimeout(() => {
			setShowAnimation(true)
			setTimeout(() => setShowAnimation(false), 2000)
		}, 3000)

		return () => {
			clearInterval(timer)
			clearTimeout(initialTimer)
		}
	}, [])

	return (
		<div className='h-full w-full overflow-y-auto py-4 bg-white scrollbar-hide'>
			{!collapsed && (
				<div className='px-4 mb-6'>
					<h2 className='text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2'>
						Main
					</h2>
					<nav className='space-y-1'>
						<SidebarLink
							icon={LayoutDashboard}
							label='Dashboard'
							to='/dashboard'
							active={currentPath === '/dashboard'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Briefcase}
							label='My Applications'
							to='/applications'
							active={currentPath === '/applications'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Kanban}
							label='Kanban Board'
							to='/kanban'
							active={currentPath === '/kanban'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
					</nav>
				</div>
			)}

			{!collapsed && (
				<div className='px-4 mb-6'>
					<h2 className='text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2'>
						Tools
					</h2>
					<nav className='space-y-1'>
						<SidebarLink
							icon={FileText}
							label='Documents'
							to='/documents'
							active={currentPath === '/documents'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Calendar}
							label='Calendar'
							to='/calendar'
							active={currentPath === '/calendar'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
					</nav>
				</div>
			)}

			{!collapsed && (
				<div className='px-4 mb-6'>
					<h2 className='text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2'>
						Settings
					</h2>
					<nav className='space-y-1'>
						<SidebarLink
							icon={Settings}
							label='Settings'
							to='/settings'
							active={currentPath === '/settings'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Briefcase}
							label='Integrations'
							to='/settings/integrations'
							active={currentPath.startsWith('/settings/integrations')}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
					</nav>
				</div>
			)}

			{/* Collapsed sidebar shows only icons */}
			{collapsed && (
				<div className='px-2 space-y-2'>
					<nav className='space-y-1'>
						<SidebarLink
							icon={LayoutDashboard}
							label='Dashboard'
							to='/dashboard'
							active={currentPath === '/dashboard'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Briefcase}
							label='My Applications'
							to='/applications'
							active={currentPath === '/applications'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Kanban}
							label='Kanban Board'
							to='/kanban'
							active={currentPath === '/kanban'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={FileText}
							label='Documents'
							to='/documents'
							active={currentPath === '/documents'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Calendar}
							label='Calendar'
							to='/calendar'
							active={currentPath === '/calendar'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						<SidebarLink
							icon={Settings}
							label='Settings'
							to='/settings'
							active={currentPath === '/settings'}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
					</nav>
				</div>
			)}

			{!collapsed && (
				<div className='px-4 mb-6'>
					<h2
						className={cn(
							'text-xs font-semibold uppercase tracking-wider px-4 mb-2',
							showAnimation ? 'text-amber-500' : 'text-gray-400'
						)}
					>
						Support
					</h2>
					<nav className='space-y-1 relative'>
						<div
							className={cn(
								'absolute inset-0 pointer-events-none transition-opacity duration-300',
								showAnimation ? 'opacity-100' : 'opacity-0'
							)}
						>
							<div className='absolute right-0 top-0 flex space-x-1'>
								<span className='relative flex h-2 w-2'>
									<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75'></span>
									<span className='relative inline-flex rounded-full h-2 w-2 bg-amber-500'></span>
								</span>
							</div>
						</div>
						<SidebarLink
							icon={Coffee}
							label='Buy me a coffee'
							to='https://ko-fi.com/jobtrakr'
							isExternal
							highlight={true}
							onClick={onLinkClick}
							collapsed={collapsed}
						/>
						{/* Temporarily hidden - can be re-enabled later
						<SidebarLink
							icon={HeartHandshake}
							label='Help & Documentation'
							to='/help/browser-extension'
							active={currentPath.startsWith('/help')}
							onClick={onLinkClick}
						/>
						*/}
					</nav>
				</div>
			)}

			{/* Support section for collapsed sidebar */}
			{collapsed && (
				<div className='px-2 mt-4'>
					<SidebarLink
						icon={Coffee}
						label='Buy me a coffee'
						to='https://ko-fi.com/jobtrakr'
						isExternal
						highlight={true}
						onClick={onLinkClick}
						collapsed={collapsed}
					/>
				</div>
			)}
		</div>
	)
}

export default Sidebar
