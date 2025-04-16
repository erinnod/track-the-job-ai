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

const JobDescriptionField = ({
	jobData,
	handleChange,
}: JobDescriptionFieldProps) => {
	const [description, setDescription] = useState(jobData.jobDescription || '')

	// Update local state when props change
	useEffect(() => {
		setDescription(jobData.jobDescription || '')
	}, [jobData.jobDescription])

	// Handle direct textarea changes
	const handleDescriptionChange = (
		e: React.ChangeEvent<HTMLTextAreaElement>
	) => {
		const newValue = e.target.value
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

		console.log('JobDescriptionField: handleDescriptionChange', {
			length: newValue.length,
			preview: newValue.substring(0, 50) + (newValue.length > 50 ? '...' : ''),
		})

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
				className='min-h-[150px]'
			/>
			<div className='text-xs text-muted-foreground'>
				{description ? `${description.length} characters` : 'No description'}
			</div>
		</div>
	)
}

export default JobDescriptionField
