import { ReactNode, useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { Menu } from 'lucide-react'

interface LayoutProps {
	children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
	const [sidebarOpen, setSidebarOpen] = useState(false)
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

	return (
		<div className='min-h-screen bg-gray-100 flex flex-col'>
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
          transition-transform duration-300 ease-in-out md:transition-none
          w-64 bg-white border-r border-gray-200 overflow-y-auto
        `}
				>
					<Sidebar onLinkClick={() => isMobile && setSidebarOpen(false)} />
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
