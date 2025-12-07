import { ReactNode, useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'

interface LayoutProps {
	children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [isMobile, setIsMobile] = useState(false)

	// Check if we're on mobile and update state
	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth < 768)
		}

		// Initial check
		checkIfMobile()

		// Set up listener for window resize
		window.addEventListener('resize', checkIfMobile)

		// Cleanup
		return () => window.removeEventListener('resize', checkIfMobile)
	}, [])

	// Close sidebar when navigating on mobile
	useEffect(() => {
		if (isMobile) {
			setSidebarOpen(false)
		}
	}, [isMobile])

	// Create backdrop to close sidebar when clicked outside
	const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
	const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed)

	return (
		<div className='min-h-screen bg-white flex flex-col'>
			<Navbar onMenuClick={toggleSidebar} />
			<div className='flex flex-col md:flex-row pt-16 flex-grow relative'>
				{/* Mobile sidebar overlay */}
				{sidebarOpen && isMobile && (
					<div
						className='fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden'
						onClick={toggleSidebar}
						aria-hidden='true'
					/>
				)}

				{/* Sidebar - hidden on mobile by default, shown when sidebarOpen=true */}
				<div
					className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 fixed md:static top-16 left-0 z-30 h-[calc(100vh-4rem)] 
          transition-all duration-300 ease-in-out md:transition-none
          ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 overflow-y-auto scrollbar-hide
        `}
				>
					{/* Sidebar collapse toggle button - only visible on desktop */}
					<div className='hidden md:flex justify-end p-2 border-b border-gray-100'>
						<button
							onClick={toggleSidebarCollapse}
							className='p-1 rounded-md hover:bg-gray-100 transition-colors'
							aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						>
							{sidebarCollapsed ? (
								<ChevronRight className='h-4 w-4 text-gray-600' />
							) : (
								<ChevronLeft className='h-4 w-4 text-gray-600' />
							)}
						</button>
					</div>
					
					<Sidebar 
						onLinkClick={() => isMobile && setSidebarOpen(false)} 
						collapsed={sidebarCollapsed}
					/>
				</div>

				{/* Mobile menu toggle button - visible only on small screens */}
				<button
					onClick={toggleSidebar}
					className='fixed bottom-4 right-4 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg z-30'
					aria-label='Toggle sidebar menu'
				>
					<Menu size={24} />
				</button>

				{/* Main content area with responsive padding */}
				<main
					className={`
          flex-1 p-3 sm:p-6 overflow-auto bg-white md:rounded-tl-xl shadow-sm
          ${sidebarOpen ? 'md:ml-0' : 'ml-0'}
          md:ml-0 transition-all duration-300
        `}
				>
					{children}
				</main>
			</div>
			<Footer />
		</div>
	)
}

export default Layout
