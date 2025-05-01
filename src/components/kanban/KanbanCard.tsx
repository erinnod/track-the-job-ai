import { JobApplication, statusLabels } from '@/data/mockJobs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface KanbanCardProps {
	job: JobApplication
	onCardMove: (id: string, newStatus: JobApplication['status']) => void
}

const statuses: JobApplication['status'][] = [
	'saved',
	'applied',
	'interview',
	'offer',
	'rejected',
]

const KanbanCard = ({ job, onCardMove }: KanbanCardProps) => {
	const currentStatusIndex = statuses.indexOf(job.status)

	const moveLeft = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (currentStatusIndex > 0) {
			onCardMove(job.id, statuses[currentStatusIndex - 1])
		}
	}

	const moveRight = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (currentStatusIndex < statuses.length - 1) {
			onCardMove(job.id, statuses[currentStatusIndex + 1])
		}
	}

	const formattedDate = (dateString: string) => {
		if (!dateString) return ''
		try {
			return formatDistanceToNow(new Date(dateString), { addSuffix: true })
		} catch (e) {
			return dateString
		}
	}

	return (
		<Card className='shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white'>
			<CardContent className='p-3'>
				<div className='mb-1.5'>
					<div className='flex items-center text-gray-600 text-sm mb-1'>
						<Building className='mr-1 h-3 w-3' />
						<span className='truncate'>{job.company}</span>
					</div>
					<h4 className='font-medium text-gray-900 truncate text-sm'>
						{job.position}
					</h4>
					{job.location && (
						<div className='text-xs text-gray-500 truncate'>{job.location}</div>
					)}
				</div>

				{job.appliedDate && (
					<div className='text-xs text-gray-500 mt-1'>
						Applied {formattedDate(job.appliedDate)}
					</div>
				)}

				<div className='flex justify-between items-center mt-2'>
					<Button
						variant='ghost'
						size='sm'
						className='p-0 h-7 w-7'
						onClick={moveLeft}
						disabled={currentStatusIndex === 0}
					>
						<ArrowLeftIcon className='h-3.5 w-3.5' />
					</Button>

					{job.salary && (
						<div className='text-xs font-medium'>{job.salary}</div>
					)}

					<Button
						variant='ghost'
						size='sm'
						className='p-0 h-7 w-7'
						onClick={moveRight}
						disabled={currentStatusIndex === statuses.length - 1}
					>
						<ArrowRightIcon className='h-3.5 w-3.5' />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

export default KanbanCard
