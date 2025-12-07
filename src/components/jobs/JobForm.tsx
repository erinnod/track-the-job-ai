import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { JobApplication } from '@/data/mockJobs'
import CompanyInfoFields from './form/CompanyInfoFields'
import LocationStatusFields from './form/LocationStatusFields'
import AdditionalInfoFields from './form/AdditionalInfoFields'
import JobDescriptionField from './form/JobDescriptionField'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

interface JobFormProps {
	onSubmit: (job: JobApplication) => void
	onCancel: () => void
	initialData?: JobApplication
}

const JobForm = ({ onSubmit, onCancel, initialData }: JobFormProps) => {
	const [jobData, setJobData] = useState<{
		company: string
		position: string
		location: string
		status: JobApplication['status'] // Use the status type from JobApplication
		companyWebsite: string
		salary: string
		jobDescription: string
		workType: JobApplication['workType']
		employmentType: JobApplication['employmentType']
	}>({
		company: initialData?.company || '',
		position: initialData?.position || '',
		location: initialData?.location || '',
		status: initialData?.status || 'saved', // Default status is "saved"
		companyWebsite: initialData?.companyWebsite || '',
		salary: initialData?.salary || '',
		jobDescription: initialData?.jobDescription || '',
		workType: initialData?.workType || 'On-site',
		employmentType: initialData?.employmentType || 'Full-time',
	})

	// State for interview date and time
	const [interviewDate, setInterviewDate] = useState<Date | undefined>(
		undefined
	)
	const [interviewTime, setInterviewTime] = useState<string>('')

	// Update form data when initialData changes
	useEffect(() => {
		if (initialData) {
			setJobData({
				company: initialData.company || '',
				position: initialData.position || '',
				location: initialData.location || '',
				status: initialData.status || 'saved',
				companyWebsite: initialData.companyWebsite || '',
				salary: initialData.salary || '',
				jobDescription: initialData.jobDescription || '',
				workType: initialData.workType || 'On-site',
				employmentType: initialData.employmentType || 'Full-time',
			})

			// Look for interview events to populate interview date/time
			if (initialData.events && initialData.events.length > 0) {
				const interviewEvent = initialData.events.find((event) =>
					event.title.toLowerCase().includes('interview')
				)

				if (interviewEvent && interviewEvent.date) {
					try {
						const eventDate = new Date(interviewEvent.date)
						setInterviewDate(eventDate)

						// Extract time if it's a full datetime string
						if (interviewEvent.date.includes('T')) {
							setInterviewTime(format(eventDate, 'HH:mm'))
						}
					} catch (e) {
						console.error('Error parsing interview date', e)
					}
				}
			}
		}
	}, [initialData])

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setJobData((prev) => ({ ...prev, [name]: value }))
	}

	const handleStatusChange = (value: string) => {
		// Ensure value is a valid status type before assigning
		if (
			['applied', 'interview', 'offer', 'rejected', 'saved'].includes(value)
		) {
			setJobData((prev) => ({
				...prev,
				status: value as JobApplication['status'],
			}))
		}
	}

	const handleWorkTypeChange = (value: string) => {
		// Ensure value is a valid work type before assigning
		if (['On-site', 'Remote', 'Hybrid'].includes(value)) {
			setJobData((prev) => ({
				...prev,
				workType: value as JobApplication['workType'],
			}))
		}
	}

	const handleEmploymentTypeChange = (value: string) => {
		// Ensure value is a valid employment type before assigning
		if (['Full-time', 'Part-time'].includes(value)) {
			setJobData((prev) => ({
				...prev,
				employmentType: value as JobApplication['employmentType'],
			}))
		}
	}

	const handleInterviewDateChange = (date: Date) => {
		setInterviewDate(date)
	}

	const handleInterviewTimeChange = (time: string) => {
		setInterviewTime(time)
	}

	const handleSubmit = () => {
		if (!jobData.company.trim() || !jobData.position.trim()) {
			toast.error('Company name and position are required')
			return
		}

		try {
			// If initialData exists, we're editing - use its ID, otherwise create new
			const jobId = initialData?.id || uuidv4()

			// Prepare events array
			const events = initialData?.events ? [...initialData.events] : []
			let formEvents = events

			// If status is interview and we have a date, add an interview event
			if (jobData.status === 'interview' && interviewDate) {
				// Format the date with time if available
				let formattedDate: string
				if (interviewTime) {
					// Create a new date with the interview time
					const [hours, minutes] = interviewTime.split(':').map(Number)
					const dateWithTime = new Date(interviewDate)
					dateWithTime.setHours(hours, minutes)
					formattedDate = dateWithTime.toISOString()
				} else {
					formattedDate = interviewDate.toISOString()
				}

				// Check if we already have an interview event
				const existingInterviewIdx = events.findIndex((event) =>
					event.title.toLowerCase().includes('interview')
				)

				const interviewEvent = {
					date: formattedDate,
					title: 'Job Interview',
					description: `Interview for ${jobData.position} position at ${
						jobData.company
					}${jobData.location ? ` (${jobData.location})` : ''}`,
				}

				const updatedEvents = [...events]

				if (existingInterviewIdx > -1) {
					updatedEvents[existingInterviewIdx] = interviewEvent
				} else {
					updatedEvents.push(interviewEvent)
				}

				formEvents = updatedEvents
			} else {
				formEvents = events
			}

			// Ensure job description is a string
			const sanitizedJobDescription =
				typeof jobData.jobDescription === 'string'
					? jobData.jobDescription
					: String(jobData.jobDescription || '')

			// Create a new job with the form data
			const formJob: JobApplication = {
				id: jobId,
				company: jobData.company,
				position: jobData.position,
				location: jobData.location || 'Not specified',
				status: jobData.status,
				appliedDate:
					initialData?.appliedDate ||
					(jobData.status === 'saved' ? '' : new Date().toISOString()),
				lastUpdated: new Date().toISOString(),
				companyWebsite: jobData.companyWebsite,
				salary: jobData.salary,
				jobDescription: sanitizedJobDescription,
				workType: jobData.workType,
				employmentType: jobData.employmentType,
				remote: jobData.workType === 'Remote' || jobData.workType === 'Hybrid',
				// Include the updated events
				events: formEvents,
				// Preserve other fields from initialData if they exist
				notes: initialData?.notes || [],
				contacts: initialData?.contacts || [],
			}

			// Pass the job to the parent component
			onSubmit(formJob)
		} catch (error) {
			console.error('Error preparing job submission:', error)
			toast.error('There was a problem submitting the form. Please try again.')
		}
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				handleSubmit()
			}}
		>
			<div className='grid gap-4 py-4'>
				<CompanyInfoFields
					jobData={jobData}
					handleChange={handleChange}
				/>

				<LocationStatusFields
					jobData={jobData}
					events={initialData?.events}
					handleChange={handleChange}
					handleStatusChange={handleStatusChange}
					handleWorkTypeChange={handleWorkTypeChange}
					handleEmploymentTypeChange={handleEmploymentTypeChange}
					handleInterviewDateChange={handleInterviewDateChange}
					handleInterviewTimeChange={handleInterviewTimeChange}
				/>

				<AdditionalInfoFields
					jobData={jobData}
					handleChange={handleChange}
				/>

				<JobDescriptionField
					jobData={jobData}
					handleChange={handleChange}
				/>
			</div>

			<button
				id='job-form-submit'
				type='submit'
				style={{ display: 'none' }}
			/>
		</form>
	)
}

export default JobForm
