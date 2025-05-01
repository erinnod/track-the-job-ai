import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { JobApplication } from '@/data/mockJobs'
import { useJobs } from '@/contexts/JobContext'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight } from 'lucide-react'

const Kanban = () => {
	const { jobs, updateJob, isLoading } = useJobs()
	const { toast } = useToast()

	const handleCardMove = (id: string, newStatus: JobApplication['status']) => {
		const job = jobs.find((job) => job.id === id)

		if (job) {
			const updatedJob = {
				...job,
				status: newStatus,
				lastUpdated: new Date().toISOString(),
			}

			updateJob(updatedJob)

			toast({
				title: 'Job status updated',
				description: `${job.position} at ${job.company} moved to ${newStatus}`,
			})
		}
	}

	if (isLoading) {
		return (
			<Layout>
				<div className='w-full max-w-7xl mx-auto px-2'>
					<div className='flex justify-between items-center mb-6'>
						<Skeleton className='h-8 w-40' />
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className='bg-gray-50 rounded-xl p-4 h-[70vh]'
							>
								<Skeleton className='h-6 w-24 mb-4' />
								<div className='space-y-4'>
									{[1, 2, 3].map((j) => (
										<div
											key={j}
											className='bg-white p-4 rounded-lg shadow-sm'
										>
											<Skeleton className='h-4 w-28 mb-2' />
											<Skeleton className='h-6 w-full mb-3' />
											<div className='flex gap-2'>
												<Skeleton className='h-5 w-16 rounded-full' />
												<Skeleton className='h-5 w-20 rounded-full' />
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</Layout>
		)
	}

	return (
		<Layout>
			<div className='w-full max-w-7xl mx-auto px-2'>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4'>
					<h1 className='text-2xl font-bold'>Kanban Board</h1>
					<div className='flex items-center text-sm text-gray-500 mt-2 md:mt-0 md:ml-4'>
						<span className='md:hidden flex items-center'>
							<ChevronRight className='h-4 w-4 mr-1' />
							Swipe to see more columns
						</span>
					</div>
				</div>

				<KanbanBoard
					jobs={jobs}
					onCardMove={handleCardMove}
				/>
			</div>
		</Layout>
	)
}

export default Kanban
