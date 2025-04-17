import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { JobApplication } from '@/data/mockJobs'

interface JobDescriptionFieldProps {
	jobData: Partial<JobApplication> & {
		jobDescription?: string
	}
	handleChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void
}

/**
 * JobDescriptionField - A form component for editing job descriptions with real-time character counting
 *
 * Uses controlled input pattern to ensure proper state management
 */
const JobDescriptionField = ({
	jobData,
	handleChange,
}: JobDescriptionFieldProps) => {
	// Local state to handle the textarea value
	const [description, setDescription] = useState<string>(
		jobData.jobDescription || ''
	)

	// Update local state when props change
	useEffect(() => {
		// Only update if different to avoid unnecessary re-renders
		if (jobData.jobDescription !== description) {
			setDescription(jobData.jobDescription || '')
		}
	}, [jobData.jobDescription, description])

	// Handle direct textarea changes with proper event handling
	const handleDescriptionChange = (
		e: React.ChangeEvent<HTMLTextAreaElement>
	) => {
		const newValue = e.target.value

		// Update local state
		setDescription(newValue)

		// Create a synthetic event to pass to the parent's handleChange
		const syntheticEvent = {
			...e,
			target: {
				...e.target,
				name: 'jobDescription',
				value: newValue,
			},
		} as React.ChangeEvent<HTMLTextAreaElement>

		// Call the parent handler
		handleChange(syntheticEvent)
	}

	return (
		<div className='space-y-2'>
			<Label htmlFor='jobDescription'>Job Description</Label>
			<Textarea
				id='jobDescription'
				name='jobDescription'
				value={description}
				onChange={handleDescriptionChange}
				placeholder='Paste job description or add notes...'
				rows={6}
				className='min-h-[150px] resize-y'
				aria-describedby='job-description-counter'
			/>
			<div
				id='job-description-counter'
				className='text-xs text-muted-foreground flex justify-between'
			>
				<span>
					{description ? `${description.length} characters` : 'No description'}
				</span>
				{description.length > 5000 && (
					<span className='text-red-500'>Very long - consider shortening</span>
				)}
			</div>
		</div>
	)
}

export default JobDescriptionField
