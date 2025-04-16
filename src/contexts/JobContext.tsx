import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useCallback,
	useRef,
} from 'react'
import { JobApplication, mockJobs } from '@/data/mockJobs'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/hooks/use-toast'

interface JobContextType {
	jobs: JobApplication[]
	isLoading: boolean
	addJob: (job: JobApplication) => Promise<void>
	deleteJob: (id: string) => Promise<void>
	updateJob: (job: JobApplication) => Promise<void>
}

const JobContext = createContext<JobContextType | undefined>(undefined)

// This is a named function, not an arrow function
// Named function declarations work better with HMR
export function useJobs() {
	const context = useContext(JobContext)
	if (context === undefined) {
		throw new Error('useJobs must be used within a JobProvider')
	}
	return context
}

interface JobProviderProps {
	children: ReactNode
}

// Using function declaration instead of arrow function for better HMR
function JobProvider({ children }: JobProviderProps) {
	const [jobs, setJobs] = useState<JobApplication[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const { user } = useAuth()
	const { toast } = useToast()

	// Add mounted ref to prevent state updates after unmount
	const isMountedRef = useRef(true)

	// Cleanup function when component unmounts
	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
		}
	}, [])

	// Safe state setter that checks if component is still mounted
	const safeSetJobs = useCallback((updater: any) => {
		if (isMountedRef.current) {
			setJobs(updater)
		}
	}, [])

	const safeSetLoading = useCallback((value: boolean) => {
		if (isMountedRef.current) {
			setIsLoading(value)
		}
	}, [])

	// Load jobs from Supabase on mount or when user changes
	useEffect(() => {
		const loadJobs = async () => {
			try {
				safeSetLoading(true)

				if (!user?.id) {
					// If no user, use mock data for demo purposes
					safeSetJobs(mockJobs)
					return
				}

				// Fetch jobs from Supabase
				const { data: jobsData, error: jobsError } = await supabase
					.from('job_applications')
					.select('*')
					.eq('user_id', user.id)
					.order('last_updated', { ascending: false })

				if (jobsError) {
					throw jobsError
				}

				if (jobsData) {
					// Get all job IDs to fetch related events
					const jobIds = jobsData.map((job) => job.id)

					// Fetch events for all jobs
					const { data: eventsData, error: eventsError } = await supabase
						.from('job_application_events')
						.select('*')
						.in('job_application_id', jobIds)

					if (eventsError) {
						console.error('Error fetching job events:', eventsError)
					}

					// Create a map of job id -> events
					const eventsMap = new Map()
					if (eventsData && eventsData.length > 0) {
						eventsData.forEach((event) => {
							if (!eventsMap.has(event.job_application_id)) {
								eventsMap.set(event.job_application_id, [])
							}
							eventsMap.get(event.job_application_id).push({
								date: event.date,
								title: event.title,
								description: event.description || '',
							})
						})
					}

					// Map Supabase data to JobApplication format
					const formattedJobs = jobsData.map((job) => ({
						id: job.id,
						company: job.company,
						position: job.position,
						location: job.location || '',
						status: job.status,
						appliedDate: job.applied_date,
						lastUpdated: job.last_updated,
						companyWebsite: job.company_website || '',
						salary: job.salary || '',
						jobDescription: job.job_description || '',
						workType: job.work_type || 'On-site',
						employmentType: job.employment_type || 'Full-time',
						remote: job.remote || false,
						// Add events from the map or empty array if none
						events: eventsMap.get(job.id) || [],
						// These would come from separate tables in future improvements
						notes: [],
						contacts: [],
					}))
					safeSetJobs(formattedJobs)
				}
			} catch (error: any) {
				console.error('Error loading jobs:', error.message)
				// Fallback to mock data
				safeSetJobs(mockJobs)
			} finally {
				safeSetLoading(false)
			}
		}

		loadJobs()
	}, [user?.id, safeSetJobs, safeSetLoading])

	// Add a job to Supabase
	const addJob = async (job: JobApplication) => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			console.log(
				'Adding job:',
				JSON.stringify(
					{
						company: job.company,
						position: job.position,
						jobDescription: job.jobDescription,
						description_length: job.jobDescription
							? job.jobDescription.length
							: 0,
					},
					null,
					2
				)
			)

			// Generate a UUID if none provided
			const jobId = job.id || uuidv4()

			// Ensure jobDescription is defined and properly typed
			if (job.jobDescription === undefined) {
				console.warn('Job description is undefined, setting to empty string')
				job.jobDescription = ''
			}

			// Force jobDescription to be a string
			if (typeof job.jobDescription !== 'string') {
				console.warn(
					`Job description has incorrect type: ${typeof job.jobDescription}, converting to string`
				)
				job.jobDescription = String(job.jobDescription || '')
			}

			// Prepare job data for Supabase with direct values
			const supabaseJob = {
				id: jobId,
				user_id: user.id,
				company: job.company,
				position: job.position,
				location: job.location || '',
				status: job.status,
				applied_date: job.appliedDate || new Date().toISOString(),
				last_updated: new Date().toISOString(),
				company_website: job.companyWebsite || null,
				salary: job.salary || null,
				job_description: job.jobDescription || '', // Ensure it's a string with fallback
				work_type: job.workType || 'On-site',
				employment_type: job.employmentType || 'Full-time',
				remote: job.remote || false,
			}

			console.log(
				'Job insert payload:',
				JSON.stringify(
					{
						...supabaseJob,
						job_description_length: supabaseJob.job_description.length,
						job_description_sample:
							supabaseJob.job_description.substring(0, 50) + '...',
					},
					null,
					2
				)
			)

			// Insert job into Supabase
			const { data, error: jobError } = await supabase
				.from('job_applications')
				.insert(supabaseJob)
				.select('id, company, job_description')

			if (jobError) {
				console.error('Error inserting job:', jobError)
				throw jobError
			}

			console.log('Job inserted successfully:', data)

			// Add events if any exist
			if (job.events && job.events.length > 0) {
				const eventsToInsert = job.events.map((event) => ({
					job_application_id: jobId,
					date: event.date,
					title: event.title,
					description: event.description || '',
				}))

				const { error: eventsError } = await supabase
					.from('job_application_events')
					.insert(eventsToInsert)

				if (eventsError) {
					console.error('Error adding job events:', eventsError)
					// Continue even if events failed to save
				}
			}

			// Make sure we use the data we sent to Supabase for consistency
			const jobToAdd = {
				...job,
				id: jobId,
				jobDescription: supabaseJob.job_description,
				lastUpdated: supabaseJob.last_updated,
			}

			// Update local state
			safeSetJobs((prevJobs: JobApplication[]) => [jobToAdd, ...prevJobs])

			toast({
				title: 'Job added',
				description: 'Job application has been added successfully.',
			})

			return
		} catch (error: any) {
			console.error('Error adding job:', error.message)
			toast({
				title: 'Error adding job',
				description: error.message || 'There was a problem adding the job.',
				variant: 'destructive',
			})

			// Still update the local state for better UX
			safeSetJobs((prevJobs: JobApplication[]) => [...prevJobs, job])
		}
	}

	// Delete a job from Supabase
	const deleteJob = async (id: string) => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			// Delete from Supabase
			const { error } = await supabase
				.from('job_applications')
				.delete()
				.eq('id', id)

			if (error) {
				throw error
			}

			// Update local state
			safeSetJobs((prevJobs: JobApplication[]) =>
				prevJobs.filter((job) => job.id !== id)
			)

			toast({
				title: 'Job deleted',
				description: 'Job application has been deleted successfully.',
			})
		} catch (error: any) {
			console.error('Error deleting job:', error.message)
			toast({
				title: 'Error deleting job',
				description: error.message || 'There was a problem deleting the job.',
				variant: 'destructive',
			})

			// Still update the local state for better UX in case of network errors
			safeSetJobs((prevJobs: JobApplication[]) =>
				prevJobs.filter((job) => job.id !== id)
			)
		}
	}

	// Update a job in Supabase
	const updateJob = async (updatedJob: JobApplication) => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			console.log(
				'updateJob received job:',
				JSON.stringify(
					{
						id: updatedJob.id,
						company: updatedJob.company,
						jobDescription: updatedJob.jobDescription,
						// Include just enough fields to debug without overwhelming the console
					},
					null,
					2
				)
			)

			// Ensure jobDescription is defined and properly typed
			if (updatedJob.jobDescription === undefined) {
				console.warn('Job description is undefined, setting to empty string')
				updatedJob.jobDescription = ''
			}

			// Force jobDescription to be a string
			if (typeof updatedJob.jobDescription !== 'string') {
				console.warn(
					`Job description has incorrect type: ${typeof updatedJob.jobDescription}, converting to string`
				)
				updatedJob.jobDescription = String(updatedJob.jobDescription || '')
			}

			// We'll use a raw object instead of building from properties to avoid any conversion issues
			const rawUpdateData = {
				company: updatedJob.company,
				position: updatedJob.position,
				location: updatedJob.location,
				status: updatedJob.status,
				applied_date: updatedJob.appliedDate,
				last_updated: new Date().toISOString(),
				company_website: updatedJob.companyWebsite || null,
				salary: updatedJob.salary || null,
				job_description: updatedJob.jobDescription || '', // Ensure it's a string with fallback
				work_type: updatedJob.workType || 'On-site',
				employment_type: updatedJob.employmentType || 'Full-time',
				remote: updatedJob.remote || false,
			}

			console.log(
				'Supabase job update payload:',
				JSON.stringify(
					{
						...rawUpdateData,
						job_description_length: rawUpdateData.job_description.length,
						job_description_sample:
							rawUpdateData.job_description.substring(0, 50) + '...',
					},
					null,
					2
				)
			)

			// Using a single focused update operation
			const { data, error: updateError } = await supabase
				.from('job_applications')
				.update(rawUpdateData)
				.eq('id', updatedJob.id)
				.select('id, company, job_description')

			if (updateError) {
				console.error('Supabase update error:', updateError)
				throw updateError
			}

			console.log('Updated job in Supabase:', data)

			// Handle events - first delete existing events for this job
			if (updatedJob.events && updatedJob.events.length > 0) {
				// Delete all existing events for this job
				const { error: deleteEventsError } = await supabase
					.from('job_application_events')
					.delete()
					.eq('job_application_id', updatedJob.id)

				if (deleteEventsError) {
					console.error('Error deleting existing events:', deleteEventsError)
					// Continue even if deletion failed
				}

				// Insert updated events
				const eventsToInsert = updatedJob.events.map((event) => ({
					job_application_id: updatedJob.id,
					date: event.date,
					title: event.title,
					description: event.description || '',
				}))

				const { error: insertEventsError } = await supabase
					.from('job_application_events')
					.insert(eventsToInsert)

				if (insertEventsError) {
					console.error('Error adding updated events:', insertEventsError)
					// Continue even if events failed to save
				}
			}

			// Update local state - ensure we use the actual object we sent to keep in sync
			updatedJob.jobDescription = rawUpdateData.job_description
			updatedJob.lastUpdated = rawUpdateData.last_updated

			safeSetJobs((prevJobs: JobApplication[]) =>
				prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
			)

			toast({
				title: 'Job updated',
				description: 'Job application has been updated successfully.',
			})
		} catch (error: any) {
			console.error('Error updating job:', error.message)
			toast({
				title: 'Error updating job',
				description: error.message || 'There was a problem updating the job.',
				variant: 'destructive',
			})

			// Still update the local state for better UX
			safeSetJobs((prevJobs: JobApplication[]) =>
				prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
			)
		}
	}

	const value = {
		jobs,
		isLoading,
		addJob,
		deleteJob,
		updateJob,
	}

	return <JobContext.Provider value={value}>{children}</JobContext.Provider>
}

export default JobProvider
