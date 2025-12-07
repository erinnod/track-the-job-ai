import { ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { JobApplication } from '@/data/mockJobs'

interface JobDescriptionFieldProps {
	jobData: Partial<JobApplication> & {
		jobDescription?: string
	}
	handleChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
	const description = jobData.jobDescription ?? ''

	return (
		<div className='space-y-2'>
			<Label htmlFor='jobDescription'>Job Description</Label>
			<Textarea
				id='jobDescription'
				name='jobDescription'
				value={description}
				onChange={handleChange}
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
