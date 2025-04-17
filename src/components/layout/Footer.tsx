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
		<footer className='bg-gray-800 text-white py-6 mt-auto'>
			<div className='container mx-auto px-4'>
				<div className='flex flex-col md:flex-row justify-between items-center'>
					<div className='mb-4 md:mb-0'>
						<h3 className='text-lg font-semibold'>JobTrakr</h3>
						<p className='text-gray-400 text-sm'>
							Track your job applications with ease
						</p>
					</div>

					<div className='flex flex-wrap justify-center gap-4 md:gap-6 text-sm'>
						<Link
							to='/'
							className='text-gray-300 hover:text-white transition-colors'
						>
							Home
						</Link>
						<Link
							to='/privacy-policy'
							className='text-gray-300 hover:text-white transition-colors'
						>
							Privacy Policy
						</Link>
						<Link
							to='/terms'
							className='text-gray-300 hover:text-white transition-colors'
						>
							Terms of Service
						</Link>
						<Link
							to='/contact'
							className='text-gray-300 hover:text-white transition-colors'
						>
							Contact Us
						</Link>
						<button
							onClick={handleClearStorage}
							className='text-gray-300 hover:text-white transition-colors'
						>
							Clear Storage
						</button>
					</div>
				</div>

				<div className='mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm'>
					<p>© {currentYear} JobTrakr. All rights reserved.</p>
				</div>
			</div>
		</footer>
	)
}

export default Footer
