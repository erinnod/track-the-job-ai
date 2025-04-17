import { JobApplication } from '@/data/mockJobs'
import JobCard from './JobCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface JobListDisplayProps {
	jobs: JobApplication[]
	onRemoveJob: (id: string) => void
	isLoading?: boolean
	onRetry?: () => void
}

const JobListDisplay = ({
	jobs,
	onRemoveJob,
	isLoading = false,
	onRetry,
}: JobListDisplayProps) => {
	// Show skeleton placeholders while loading
	if (isLoading) {
		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6'>
				{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
					<div
						key={i}
						className='bg-gray-50 rounded-xl p-4 space-y-3'
					>
						<div className='flex justify-between'>
							<Skeleton className='h-4 w-28' />
							<Skeleton className='h-4 w-4 rounded-full' />
						</div>
						<div className='space-y-2'>
							<Skeleton className='h-3 w-24' />
							<Skeleton className='h-6 w-48' />
						</div>
						<div className='flex gap-2'>
							<Skeleton className='h-6 w-16 rounded-full' />
							<Skeleton className='h-6 w-20 rounded-full' />
						</div>
						<div className='flex justify-between pt-2'>
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-8 w-24 rounded-full' />
						</div>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6'>
			{jobs.length > 0 ? (
				jobs.map((job) => (
					<JobCard
						key={job.id}
						job={job}
						onRemove={onRemoveJob}
					/>
				))
			) : (
				<div className='col-span-full text-center py-10'>
					<p className='text-gray-500 mb-4'>
						No job applications found. Try adjusting your search or filters.
					</p>

					{onRetry && (
						<div className='flex justify-center'>
							<Button
								onClick={onRetry}
								variant='outline'
								className='gap-2'
							>
								<RefreshCw className='h-4 w-4' />
								Retry Loading
							</Button>
						</div>
					)}

					<div className='mt-6 p-4 bg-gray-50 rounded-md max-w-md mx-auto text-left'>
						<h3 className='font-medium text-gray-800 mb-2'>
							Troubleshooting Tips:
						</h3>
						<ul className='text-sm text-gray-600 space-y-2 list-disc pl-5'>
							<li>Check your internet connection</li>
							<li>Try refreshing the page</li>
							<li>Clear your browser storage using the button in the footer</li>
							<li>Make sure you're logged in with the correct account</li>
						</ul>
					</div>
				</div>
			)}
		</div>
	)
}

export default JobListDisplay
