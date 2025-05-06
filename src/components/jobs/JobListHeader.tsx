import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface JobListHeaderProps {
	jobCount: number
	sortBy: string
	setSortBy: (value: string) => void
}

const JobListHeader = ({ jobCount, sortBy, setSortBy }: JobListHeaderProps) => {
	return (
		<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0'>
			<div className='flex items-center'>
				<h2 className='text-xl font-semibold text-gray-900'>
					Job Applications
				</h2>
				<div className='ml-2 inline-flex items-center justify-center rounded-sm bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700'>
					{jobCount}
				</div>
			</div>

			<div className='flex items-center gap-2 text-sm'>
				<span className='text-gray-500'>Sort by:</span>
				<Select
					defaultValue={sortBy}
					onValueChange={setSortBy}
				>
					<SelectTrigger className='w-[130px] h-8 border border-gray-200 rounded bg-white text-sm'>
						<SelectValue placeholder='Sort by' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='newest'>Newest First</SelectItem>
						<SelectItem value='oldest'>Oldest First</SelectItem>
						<SelectItem value='company'>Company Name</SelectItem>
						<SelectItem value='position'>Position</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}

export default JobListHeader
