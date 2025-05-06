import { Link } from 'react-router-dom'

const Footer = () => {
	const currentYear = new Date().getFullYear()

	const handleClearStorage = () => {
		try {
			localStorage.clear()
			sessionStorage.clear()
			alert(
				'Local storage and session storage cleared successfully. Please refresh the page.'
			)
		} catch (error) {
			console.error('Error clearing storage:', error)
			alert('Error clearing storage. See console for details.')
		}
	}

	return (
		<footer className='bg-gray-800 text-white py-4 sm:py-6 mt-auto'>
			<div className='container mx-auto px-4'>
				<div className='flex flex-col md:flex-row justify-between items-center gap-4'>
					<div className='mb-2 md:mb-0 text-center md:text-left'>
						<h3 className='text-lg font-semibold'>JobTrakr</h3>
						<p className='text-gray-400 text-xs sm:text-sm'>
							Track your job applications with ease
						</p>
					</div>

					<div className='grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm'>
						<Link
							to='/'
							className='text-gray-300 hover:text-white transition-colors text-center sm:text-left'
						>
							Home
						</Link>
						<Link
							to='/privacy-policy'
							className='text-gray-300 hover:text-white transition-colors text-center sm:text-left'
						>
							Privacy
						</Link>
						<Link
							to='/terms'
							className='text-gray-300 hover:text-white transition-colors text-center sm:text-left'
						>
							Terms
						</Link>
						<Link
							to='/contact'
							className='text-gray-300 hover:text-white transition-colors text-center sm:text-left'
						>
							Contact
						</Link>
						<button
							onClick={handleClearStorage}
							className='text-gray-300 hover:text-white transition-colors text-center sm:text-left col-span-2 sm:col-span-1 mt-1 sm:mt-0'
						>
							Clear Storage
						</button>
					</div>
				</div>

				<div className='mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700 text-center text-gray-400 text-xs sm:text-sm'>
					<p>© {currentYear} JobTrakr. All rights reserved.</p>
				</div>
			</div>
		</footer>
	)
}

export default Footer
