import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
	Check,
	BarChart,
	Calendar as CalendarIcon,
	LayoutDashboard,
	FileText,
	Briefcase,
	Kanban,
	ArrowRight,
	Bell,
	Chrome,
} from 'lucide-react'

const LandingPage = () => {
	return (
		<div className='min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white'>
			{/* Header/Navbar */}
			<header className='border-b bg-white/90 backdrop-blur-sm sticky top-0 z-10'>
				<div className='container mx-auto px-4 py-4 flex justify-between items-center'>
					<div className='flex items-center gap-2'>
						<img
							src='/images/jobtrakr-logo.png'
							alt='JobTrakr Logo'
							className='h-8'
						/>
					</div>
					<div className='flex items-center gap-4'>
						<Link
							to='/login'
							className='text-gray-600 hover:text-blue-600 font-medium'
						>
							Log in
						</Link>
						<Link to='/signup'>
							<Button className='bg-blue-600 hover:bg-blue-700'>
								Sign Up Free
							</Button>
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className='py-20 px-4'>
				<div className='container mx-auto max-w-6xl'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-12 items-center'>
						<div className='space-y-8'>
							<h1 className='text-4xl md:text-5xl font-bold text-gray-900 leading-tight'>
								Track Your Job Applications{' '}
								<span className='text-blue-600'>All in One Place</span>
							</h1>
							<p className='text-lg text-gray-600'>
								Stop using spreadsheets and sticky notes. JobTrakr helps you
								organise your job search, track applications, and land your
								dream job faster.
							</p>
							<div className='flex flex-col sm:flex-row gap-4'>
								<Link to='/signup'>
									<Button
										size='lg'
										className='bg-blue-600 hover:bg-blue-700 w-full sm:w-auto'
									>
										Sign Up for Free
										<ArrowRight className='ml-2 h-4 w-4' />
									</Button>
								</Link>
								<Link to='/login'>
									<Button
										variant='outline'
										size='lg'
										className='w-full sm:w-auto'
									>
										Log In
									</Button>
								</Link>
							</div>
						</div>
						<div className='rounded-lg shadow-2xl bg-white p-2 border border-gray-200'>
							<img
								src='/images/dash.png'
								alt='JobTrakr Dashboard'
								className='rounded w-full'
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='py-20 bg-gray-50 px-4'>
				<div className='container mx-auto max-w-6xl'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>
							Everything You Need to Organise Your Job Search
						</h2>
						<p className='text-lg text-gray-600 max-w-3xl mx-auto'>
							JobTrakr provides all the tools you need to stay on top of your
							applications, interviews, and offers.
						</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{/* Feature 1 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
								<LayoutDashboard className='h-6 w-6 text-blue-600' />
							</div>
							<h3 className='font-bold text-xl mb-2'>Dashboard Overview</h3>
							<p className='text-gray-600'>
								Get a bird's-eye view of your entire job search with statistics,
								timelines, and insights.
							</p>
						</div>

						{/* Feature 2 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
								<Kanban className='h-6 w-6 text-blue-600' />
							</div>
							<h3 className='font-bold text-xl mb-2'>Kanban Board</h3>
							<p className='text-gray-600'>
								Visualise your application pipeline with a customisable kanban
								board for every stage of your job search.
							</p>
						</div>

						{/* Feature 3 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
								<CalendarIcon className='h-6 w-6 text-blue-600' />
							</div>
							<h3 className='font-bold text-xl mb-2'>Calendar Integration</h3>
							<p className='text-gray-600'>
								Keep track of all your interviews, deadlines, and follow-ups in
								one calendar view.
							</p>
						</div>

						{/* Feature 4 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
								<Bell className='h-6 w-6 text-blue-600' />
							</div>
							<h3 className='font-bold text-xl mb-2'>Smart Notifications</h3>
							<p className='text-gray-600'>
								Never miss an opportunity with timely reminders for follow-ups,
								interviews, and application deadlines.
							</p>
						</div>

						{/* Feature 5 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
								<FileText className='h-6 w-6 text-blue-600' />
							</div>
							<h3 className='font-bold text-xl mb-2'>Document Storage</h3>
							<p className='text-gray-600'>
								Store resumes, cover letters, and job descriptions for easy
								access during your job search.
							</p>
						</div>

						{/* Feature 6 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
								<Chrome className='h-6 w-6 text-blue-600' />
							</div>
							<h3 className='font-bold text-xl mb-2'>Browser Extension</h3>
							<p className='text-gray-600'>
								Coming soon! Save job listings directly from LinkedIn, Indeed,
								and other sites with one click.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className='py-20 px-4'>
				<div className='container mx-auto max-w-6xl'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>
							How JobTrakr Works
						</h2>
						<p className='text-lg text-gray-600 max-w-3xl mx-auto'>
							Getting started is simple and takes less than 2 minutes
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						{/* Step 1 */}
						<div className='text-center'>
							<div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<span className='text-blue-600 font-bold text-xl'>1</span>
							</div>
							<h3 className='font-bold text-xl mb-2'>Create Your Account</h3>
							<p className='text-gray-600'>
								Sign up for free with your email or Google account. No credit
								card required.
							</p>
						</div>

						{/* Step 2 */}
						<div className='text-center'>
							<div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<span className='text-blue-600 font-bold text-xl'>2</span>
							</div>
							<h3 className='font-bold text-xl mb-2'>Add Your Applications</h3>
							<p className='text-gray-600'>
								Manually add existing applications or add new ones as you apply
								to jobs.
							</p>
						</div>

						{/* Step 3 */}
						<div className='text-center'>
							<div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<span className='text-blue-600 font-bold text-xl'>3</span>
							</div>
							<h3 className='font-bold text-xl mb-2'>Stay Organised</h3>
							<p className='text-gray-600'>
								Track progress, set reminders, and visualise your entire job
								search journey.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className='py-20 bg-gray-50 px-4'>
				<div className='container mx-auto max-w-6xl'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>
							What Our Users Say
						</h2>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{/* Testimonial 1 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='flex items-center mb-4'>
								<div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4'>
									<span className='font-bold text-blue-600'>JD</span>
								</div>
								<div>
									<h4 className='font-bold'>Jennifer D.</h4>
									<p className='text-gray-500 text-sm'>Software Engineer</p>
								</div>
							</div>
							<p className='text-gray-600'>
								"JobTrakr helped me land my dream job! I was applying to dozens
								of positions and losing track until I found this app. The
								dashboard made it easy to see where I stood with each company."
							</p>
						</div>

						{/* Testimonial 2 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='flex items-center mb-4'>
								<div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4'>
									<span className='font-bold text-blue-600'>MR</span>
								</div>
								<div>
									<h4 className='font-bold'>Michael R.</h4>
									<p className='text-gray-500 text-sm'>Marketing Manager</p>
								</div>
							</div>
							<p className='text-gray-600'>
								"I was using a spreadsheet before, but JobTrakr is on another
								level. The reminders for follow-ups alone have been a
								game-changer. I'm much more organised now!"
							</p>
						</div>

						{/* Testimonial 3 */}
						<div className='bg-white p-6 rounded-lg shadow-md border border-gray-100'>
							<div className='flex items-center mb-4'>
								<div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4'>
									<span className='font-bold text-blue-600'>AT</span>
								</div>
								<div>
									<h4 className='font-bold'>Aisha T.</h4>
									<p className='text-gray-500 text-sm'>Recent Graduate</p>
								</div>
							</div>
							<p className='text-gray-600'>
								"As a recent graduate applying to my first professional roles,
								JobTrakr has been invaluable. I love how I can store notes from
								each interview and track my progress visually."
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20 bg-blue-600 text-white px-4'>
				<div className='container mx-auto max-w-4xl text-center'>
					<h2 className='text-3xl font-bold mb-6'>
						Ready to Streamline Your Job Search?
					</h2>
					<p className='text-xl mb-8 text-blue-100'>
						Join thousands of job seekers who've optimized their job search
						process with JobTrakr.
					</p>
					<Link to='/signup'>
						<Button
							size='lg'
							className='bg-white text-blue-600 hover:bg-blue-50'
						>
							Get Started For Free
							<ArrowRight className='ml-2 h-4 w-4' />
						</Button>
					</Link>
					<p className='mt-4 text-sm text-blue-200'>
						No credit card required. Free forever.
					</p>
				</div>
			</section>

			{/* Footer */}
			<footer className='bg-gray-900 text-gray-400 py-12 px-4'>
				<div className='container mx-auto max-w-6xl'>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
						<div>
							<div className='flex items-center gap-2 mb-4'>
								<img
									src='/images/jobtrakr-logo.png'
									alt='JobTrakr Logo'
									className='h-8'
								/>
							</div>
							<p className='text-sm'>
								The intelligent job application tracking system that helps you
								land your dream job faster.
							</p>
						</div>

						<div>
							<h4 className='font-bold text-white mb-4'>Features</h4>
							<ul className='space-y-2 text-sm'>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Dashboard
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Kanban Board
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Calendar
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Notifications
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Document Storage
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className='font-bold text-white mb-4'>Company</h4>
							<ul className='space-y-2 text-sm'>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										About Us
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Blog
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Careers
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Contact
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className='font-bold text-white mb-4'>Legal</h4>
							<ul className='space-y-2 text-sm'>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Privacy Policy
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Terms of Service
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-white'
									>
										Cookie Policy
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className='border-t border-gray-800 mt-12 pt-8 text-sm text-center'>
						<p>© {new Date().getFullYear()} JobTrakr. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default LandingPage
