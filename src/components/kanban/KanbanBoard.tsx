import { JobApplication, statusLabels } from '@/data/mockJobs'
import KanbanColumn from './KanbanColumn'

interface KanbanBoardProps {
	jobs: JobApplication[]
	onCardMove: (id: string, newStatus: JobApplication['status']) => void
}

const KanbanBoard = ({ jobs, onCardMove }: KanbanBoardProps) => {
	// Define all possible statuses
	const statuses: JobApplication['status'][] = [
		'saved',
		'applied',
		'interview',
		'offer',
		'rejected',
	]

	return (
		<div className='w-full overflow-x-auto pb-6'>
			<div className='flex min-w-max gap-4'>
				{statuses.map((status) => {
					const statusJobs = jobs.filter((job) => job.status === status)

					return (
						<div
							key={status}
							className='w-[280px] md:w-[300px] flex-shrink-0'
						>
							<KanbanColumn
								status={status}
								statusLabel={statusLabels[status]}
								jobs={statusJobs}
								onCardMove={onCardMove}
							/>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default KanbanBoard
