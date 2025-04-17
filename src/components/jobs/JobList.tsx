import { JobApplication, statusLabels } from '@/data/mockJobs'
import { useState, useEffect } from 'react'
import JobListHeader from './JobListHeader'
import JobSearchBar from './JobSearchBar'
import StatusFilterDropdown from './StatusFilterDropdown'
import FilterTags from './FilterTags'
import JobListDisplay from './JobListDisplay'
import { useJobs } from '@/contexts/JobContext'

interface JobListProps {
	jobs: JobApplication[]
	isLoading?: boolean
	onRetry?: () => void
}

const JobList = ({
	jobs: initialJobs,
	isLoading = false,
	onRetry,
}: JobListProps) => {
	const [sortBy, setSortBy] = useState('newest')
	const [searchTerm, setSearchTerm] = useState('')
	const [jobs, setJobs] = useState<JobApplication[]>(initialJobs)
	const [statusFilter, setStatusFilter] = useState<JobApplication['status'][]>(
		[]
	)
	const { deleteJob } = useJobs()

	// Update local jobs state when initialJobs prop changes
	useEffect(() => {
		console.log('JobList received new jobs:', initialJobs.length)
		// Always set jobs to ensure we have the latest data
		setJobs(initialJobs)
	}, [initialJobs])

	const handleRemoveJob = async (id: string) => {
		console.log('JobList: Removing job ID:', id)
		// Delete from database
		await deleteJob(id)

		// Local state will be updated through the props when the context state changes
		// No need to update local state here as it will cause double updates
	}

	const handleToggleStatus = (status: JobApplication['status']) => {
		setStatusFilter((prev) =>
			prev.includes(status)
				? prev.filter((s) => s !== status)
				: [...prev, status]
		)
	}

	const clearFilters = () => {
		setStatusFilter([])
	}

	// Apply filters
	const filteredJobs = jobs.filter((job) => {
		// Text search filter
		const matchesSearch =
			job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
			job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
			job.location.toLowerCase().includes(searchTerm.toLowerCase())

		// Status filter
		const matchesStatus =
			statusFilter.length === 0 || statusFilter.includes(job.status)

		return matchesSearch && matchesStatus
	})

	// Sort the filtered jobs
	const sortedJobs = [...filteredJobs].sort((a, b) => {
		switch (sortBy) {
			case 'newest':
				return (
					new Date(b.appliedDate || b.lastUpdated).getTime() -
					new Date(a.appliedDate || a.lastUpdated).getTime()
				)
			case 'oldest':
				return (
					new Date(a.appliedDate || a.lastUpdated).getTime() -
					new Date(b.appliedDate || b.lastUpdated).getTime()
				)
			case 'company':
				return a.company.localeCompare(b.company)
			case 'position':
				return a.position.localeCompare(b.position)
			default:
				return 0
		}
	})

	return (
		<div className='w-full'>
			<JobListHeader
				jobCount={sortedJobs.length}
				sortBy={sortBy}
				setSortBy={setSortBy}
			/>

			<div className='flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-6'>
				<JobSearchBar
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
				/>

				<StatusFilterDropdown
					statusFilter={statusFilter}
					handleToggleStatus={handleToggleStatus}
					clearFilters={clearFilters}
				/>
			</div>

			<FilterTags
				statusFilter={statusFilter}
				handleToggleStatus={handleToggleStatus}
				clearFilters={clearFilters}
			/>

			<JobListDisplay
				jobs={sortedJobs}
				onRemoveJob={handleRemoveJob}
				isLoading={isLoading}
				onRetry={onRetry}
			/>
		</div>
	)
}

export default JobList
