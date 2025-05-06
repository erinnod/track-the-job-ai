import { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { JobApplication } from '@/data/mockJobs'
import { useJobs } from '@/contexts/JobContext'
import JobForm from './JobForm'

interface EditJobModalProps {
	isOpen: boolean
	onClose: () => void
	jobId: string | null
}

const EditJobModal = ({ isOpen, onClose, jobId }: EditJobModalProps) => {
	const { jobs, updateJob } = useJobs()
	const [initialJob, setInitialJob] = useState<JobApplication | null>(null)

	// Find the job when jobId changes
	useEffect(() => {
		if (jobId) {
			// Check sessionStorage first for full job details
			const cachedDetails = sessionStorage.getItem(`job_details_${jobId}`)

			if (cachedDetails) {
				try {
					const parsedDetails = JSON.parse(cachedDetails)
					// Find the basic job data
					const basicJob = jobs.find((j) => j.id === jobId)

					if (basicJob) {
						// Combine basic job with detailed data from cache
						const fullJob = {
							...basicJob,
							companyWebsite: parsedDetails.company_website || '',
							salary: parsedDetails.salary || '',
							jobDescription: parsedDetails.job_description || '',
						}
						setInitialJob(fullJob)
						return
					}
				} catch (e) {
					console.error('Error parsing cached job details:', e)
				}
			}

			// Fall back to basic job data if no cache is available
			const job = jobs.find((j) => j.id === jobId)
			if (job) {
				setInitialJob(job)
			}
		}
	}, [jobId, jobs, isOpen])

	const handleSubmit = (updatedJob: JobApplication) => {
		if (!initialJob) return

		console.log('EditJobModal - handling submit:', updatedJob)
		console.log('Job description before update:', updatedJob.jobDescription)

		// Ensure we keep the same ID and created date
		const jobToUpdate = {
			...updatedJob,
			id: initialJob.id,
			lastUpdated: new Date().toISOString(),
			// Ensure job description is properly carried over
			jobDescription:
				updatedJob.jobDescription || initialJob.jobDescription || '',
		}

		console.log('EditJobModal - job to update:', jobToUpdate)
		console.log(
			'Job description after preparing for update:',
			jobToUpdate.jobDescription
		)

		// Update the job
		updateJob(jobToUpdate)
			.then(() => {
				// Clear the session storage cache to force a refresh on next view
				sessionStorage.removeItem(`job_details_${jobToUpdate.id}`)

				toast.success('Job updated successfully!')
				onClose()
			})
			.catch((error) => {
				console.error('Error updating job:', error)
				toast.error('Failed to update job. Please try again.')
			})
	}

	const handleCancel = () => {
		onClose()
	}

	if (!initialJob) return null

	return (
		<Dialog
			open={isOpen}
			onOpenChange={onClose}
		>
			<DialogContent className='sm:max-w-[550px]'>
				<DialogHeader>
					<DialogTitle>Edit Job Application</DialogTitle>
				</DialogHeader>

				<JobForm
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					initialData={initialJob}
				/>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant='outline'>Cancel</Button>
					</DialogClose>
					<Button
						onClick={() => {
							// Find the form submit button by its id and click it
							document.getElementById('job-form-submit')?.click()
						}}
					>
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default EditJobModal
