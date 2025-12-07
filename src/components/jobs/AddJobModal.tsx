import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { JobApplication } from '@/data/mockJobs'
import { useJobs } from '@/contexts/JobContext'
import JobForm from './JobForm'

interface AddJobModalProps {
	onAddJob?: (job: JobApplication) => void
	buttonId?: string
}

const AddJobModal = ({ onAddJob, buttonId }: AddJobModalProps) => {
	const [open, setOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { addJob } = useJobs()

	const handleSubmit = async (job: JobApplication) => {
		// Prevent duplicate submissions
		if (isSubmitting) return

		try {
			setIsSubmitting(true)

			// Add the job to context
			await addJob(job)

			// Also call the onAddJob prop if provided (for backward compatibility)
			if (onAddJob) {
				onAddJob(job)
			}

			// Close the modal on success
			setOpen(false)
		} catch (error) {
			console.error('Error submitting job:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleCancel = () => {
		setOpen(false)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				<Button
					className='flex items-center text-sm px-2.5 py-1 h-8'
					id={buttonId}
					size='sm'
				>
					<PlusCircle className='h-3.5 w-3.5 mr-1.5' />
					Add Job
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-[550px]'>
				<DialogHeader>
					<DialogTitle>Add New Job Application</DialogTitle>
				</DialogHeader>

				<JobForm
					onSubmit={handleSubmit}
					onCancel={handleCancel}
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
						Save Job
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default AddJobModal
