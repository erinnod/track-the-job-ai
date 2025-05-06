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

// Define database type for type safety
interface JobApplicationDB {
	id: string
	user_id: string
	company: string
	position: string
	location: string | null
	status: string
	applied_date: string | null
	last_updated: string
	company_website: string | null
	salary: string | null
	job_description: string | null
	work_type: string | null
	employment_type: string | null
	remote: boolean
	created_at?: string
	updated_at?: string
}

interface JobEventDB {
	id?: string
	job_application_id: string
	date: string
	title: string
	description: string | null
	created_at?: string
	updated_at?: string
}

interface JobContextType {
	jobs: JobApplication[]
	isLoading: boolean
	addJob: (job: JobApplication) => Promise<void>
	deleteJob: (id: string) => Promise<void>
	updateJob: (job: JobApplication) => Promise<void>
	refreshJobs: () => Promise<void>
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
	const fetchInProgressRef = useRef<Promise<void> | null>(null)
	const lastLoadTimeRef = useRef<number>(0)

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
	const safeSetJobs = useCallback(
		(updater: React.SetStateAction<JobApplication[]>) => {
			if (isMountedRef.current) {
				setJobs(updater)
			}
		},
		[]
	)

	const safeSetLoading = useCallback((value: boolean) => {
		if (isMountedRef.current) {
			setIsLoading(value)
		}
	}, [])

	// Convert a database job to frontend format
	const mapJobFromDB = (
		dbJob: JobApplicationDB,
		events: Array<any> = []
	): JobApplication => ({
		id: dbJob.id,
		company: dbJob.company,
		position: dbJob.position,
		location: dbJob.location || '',
		status: dbJob.status as JobApplication['status'],
		appliedDate: dbJob.applied_date || '',
		lastUpdated: dbJob.last_updated,
		companyWebsite: dbJob.company_website || '',
		salary: dbJob.salary || '',
		jobDescription: dbJob.job_description || '',
		workType: (dbJob.work_type || 'On-site') as JobApplication['workType'],
		employmentType: (dbJob.employment_type ||
			'Full-time') as JobApplication['employmentType'],
		remote: dbJob.remote || false,
		events: events,
		notes: [], // To be implemented when notes table is available
		contacts: [], // To be implemented when contacts table is available
	})

	// Prepare job for database from frontend format
	const prepareJobForDB = (
		job: JobApplication
	): Omit<JobApplicationDB, 'id' | 'user_id'> => ({
		company: job.company,
		position: job.position,
		location: job.location || null,
		status: job.status,
		applied_date: job.appliedDate || null,
		last_updated: new Date().toISOString(),
		company_website: job.companyWebsite || null,
		salary: job.salary || null,
		job_description:
			typeof job.jobDescription === 'string' ? job.jobDescription : '',
		work_type: job.workType || 'On-site',
		employment_type: job.employmentType || 'Full-time',
		remote: job.remote || false,
	})

	// Function to load jobs that can be called externally
	const loadJobs = async () => {
		try {
			// Avoid parallel loading requests if there's already one in progress
			if (fetchInProgressRef.current) {
				console.log(
					'Job loading already in progress, returning existing promise'
				)
				return fetchInProgressRef.current
			}

			// Implement rate limiting to prevent too many refreshes
			const now = Date.now()
			const timeSinceLastLoad = now - lastLoadTimeRef.current
			const MIN_REFRESH_INTERVAL = 10000 // 10 seconds

			if (timeSinceLastLoad < MIN_REFRESH_INTERVAL && jobs.length > 0) {
				console.log('Throttling refresh requests, using existing data')
				return Promise.resolve()
			}

			safeSetLoading(true)
			console.log('Loading jobs... Auth status:', !!user?.id)

			if (!user?.id) {
				// If no user, use mock data for demo purposes
				console.log('No authenticated user, loading mock data instead')
				safeSetJobs(mockJobs)
				safeSetLoading(false)
				return Promise.resolve()
			}

			// Check for cached jobs first to display immediately
			const cachedJobs = localStorage.getItem('cached_jobs')
			const cachedTimestamp = localStorage.getItem('cached_jobs_timestamp')
			const CACHE_VALID_DURATION = 5 * 60 * 1000 // 5 minutes (reduced for fresher data)

			// Generate cache key based on user ID for multi-user support
			const userCacheKey = `user_${user.id}_jobs`
			const userCachedJobs = localStorage.getItem(userCacheKey)
			const userCachedTimestamp = localStorage.getItem(
				`${userCacheKey}_timestamp`
			)

			// Check user-specific cache first, then fallback to general cache
			const effectiveCachedJobs = userCachedJobs || cachedJobs
			const effectiveCachedTimestamp = userCachedTimestamp || cachedTimestamp

			// Use cached data if it exists and is recent
			if (effectiveCachedJobs && effectiveCachedTimestamp) {
				const timestamp = parseInt(effectiveCachedTimestamp)
				const isValid = Date.now() - timestamp < CACHE_VALID_DURATION

				if (isValid) {
					try {
						const parsed = JSON.parse(effectiveCachedJobs)
						if (Array.isArray(parsed) && parsed.length > 0) {
							console.log('Using cached jobs data:', parsed.length, 'jobs')
							safeSetJobs(parsed)
							safeSetLoading(false)

							// Continue loading in background after a short delay
							// This prevents UI jank on initial page load
							const loadPromise = new Promise<void>((resolve) => {
								setTimeout(async () => {
									try {
										await fetchJobs(false)
										resolve()
									} catch (err) {
										console.error('Background refresh error:', err)
										resolve() // Still resolve to clean up the promise
									} finally {
										fetchInProgressRef.current = null
									}
								}, 500)
							})

							fetchInProgressRef.current = loadPromise
							return loadPromise
						}
					} catch (e) {
						console.error('Error parsing cached jobs:', e)
						// Cache is invalid, continue with normal loading
					}
				} else {
					console.log('Cache expired, loading fresh data')
				}
			}

			// No valid cache, load directly
			const loadPromise = fetchJobs(true)
			fetchInProgressRef.current = loadPromise

			return loadPromise.finally(() => {
				fetchInProgressRef.current = null
			})
		} catch (error: any) {
			console.error('Error loading jobs:', error.message)
			// Fallback to mock data with a clear indicator
			toast({
				title: 'Error loading jobs',
				description: 'Using demo data instead. ' + error.message,
				variant: 'destructive',
			})
			safeSetJobs(
				mockJobs.map((job) => ({ ...job, company: `[DEMO] ${job.company}` }))
			)
			safeSetLoading(false)
			fetchInProgressRef.current = null
			return Promise.resolve()
		}
	}

	// Separated fetch function for better reuse and background loading
	const fetchJobs = async (updateLoadingState = true) => {
		if (updateLoadingState) {
			safeSetLoading(true)
		}

		try {
			// Track when we started loading
			lastLoadTimeRef.current = Date.now()

			// Maximum number of jobs to fetch initially for faster loading
			const INITIAL_FETCH_LIMIT = 50

			// Optimized query with only essential fields for list view
			// This makes the initial load much faster
			const { data: jobsData, error: jobsError } = await supabase
				.from('job_applications')
				.select(
					`
					id, 
					company, 
					position, 
					location, 
					status, 
					applied_date, 
					last_updated,
					work_type,
					remote,
					employment_type,
					salary
				`
				)
				.eq('user_id', user.id)
				.order('last_updated', { ascending: false })
				.limit(INITIAL_FETCH_LIMIT)

			if (jobsError) {
				console.error('Error fetching jobs:', jobsError)
				throw jobsError
			}

			console.log('Fetched jobs data:', jobsData?.length || 0, 'jobs')

			if (!jobsData || jobsData.length === 0) {
				console.log('No jobs found for user, setting empty array')
				safeSetJobs([])
				return
			}

			// Check if we need to fetch more jobs in the background
			let totalJobsCount = jobsData.length
			let hasMoreJobs = jobsData.length === INITIAL_FETCH_LIMIT

			// Get all job IDs to fetch related events
			const jobIds = jobsData.map((job) => job.id)

			// Start both queries in parallel for better performance
			const eventsPromise = supabase
				.from('job_application_events')
				.select('*')
				.in('job_application_id', jobIds)
				.order('date', { ascending: false })

			// Count total jobs in a parallel request
			const countPromise = hasMoreJobs
				? supabase
						.from('job_applications')
						.select('id', { count: 'exact', head: true })
						.eq('user_id', user.id)
				: Promise.resolve({ count: jobsData.length })

			// Wait for both queries to complete
			const [eventsResult, countResult] = await Promise.all([
				eventsPromise,
				countPromise,
			])

			const { data: eventsData, error: eventsError } = eventsResult

			if (eventsError) {
				console.error('Error fetching job events:', eventsError.message)
			}

			// Update total count if we got it
			if (countResult.count !== null) {
				totalJobsCount = countResult.count
				hasMoreJobs = totalJobsCount > jobsData.length
			}

			// Create a map of job id -> events
			const eventsMap = new Map<string, Array<any>>()
			if (eventsData && eventsData.length > 0) {
				eventsData.forEach((event) => {
					if (!eventsMap.has(event.job_application_id)) {
						eventsMap.set(event.job_application_id, [])
					}
					eventsMap.get(event.job_application_id)?.push({
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
				status: job.status as JobApplication['status'],
				appliedDate: job.applied_date || '',
				lastUpdated: job.last_updated,
				companyWebsite: '', // Omit for faster initial load
				salary: job.salary || '', // Include salary in initial load
				jobDescription: '', // Omit for faster initial load
				workType: (job.work_type || 'On-site') as JobApplication['workType'],
				employmentType: (job.employment_type ||
					'Full-time') as JobApplication['employmentType'],
				remote: job.remote || false,
				events: eventsMap.get(job.id) || [],
				notes: [], // Will be loaded on demand
				contacts: [], // Will be loaded on demand
			}))

			console.log('Successfully formatted jobs:', formattedJobs.length)

			// Generate cache key based on user ID
			const userCacheKey = `user_${user.id}_jobs`

			// Cache the formatted jobs for future quick loading
			localStorage.setItem(userCacheKey, JSON.stringify(formattedJobs))
			localStorage.setItem(`${userCacheKey}_timestamp`, Date.now().toString())

			// For backward compatibility
			localStorage.setItem('cached_jobs', JSON.stringify(formattedJobs))
			localStorage.setItem('cached_jobs_timestamp', Date.now().toString())

			safeSetJobs(formattedJobs)

			// If there are more jobs, fetch them in the background and update
			if (hasMoreJobs) {
				setTimeout(() => {
					fetchRemainingJobs(INITIAL_FETCH_LIMIT, totalJobsCount, formattedJobs)
				}, 1000)
			} else {
				// Prefetch full job details in the background
				// This makes subsequent job detail views load instantly
				setTimeout(() => {
					prefetchJobDetails(jobIds)
				}, 2000)
			}
		} catch (error) {
			throw error
		} finally {
			if (updateLoadingState) {
				safeSetLoading(false)
			}
		}
	}

	// Fetch remaining jobs beyond the initial limit
	const fetchRemainingJobs = async (
		offset: number,
		totalCount: number,
		existingJobs: JobApplication[]
	) => {
		try {
			console.log(`Fetching additional jobs (${offset}/${totalCount})...`)

			const { data: additionalJobs, error } = await supabase
				.from('job_applications')
				.select(
					`
					id, 
					company, 
					position, 
					location, 
					status, 
					applied_date, 
					last_updated,
					work_type,
					remote,
					employment_type,
					salary
				`
				)
				.eq('user_id', user.id)
				.order('last_updated', { ascending: false })
				.range(offset, Math.min(offset + 49, totalCount - 1))

			if (error) {
				console.error('Error fetching additional jobs:', error)
				return
			}

			if (!additionalJobs || additionalJobs.length === 0) {
				return
			}

			// Get job IDs for events
			const jobIds = additionalJobs.map((job) => job.id)

			// Fetch events
			const { data: eventsData } = await supabase
				.from('job_application_events')
				.select('*')
				.in('job_application_id', jobIds)
				.order('date', { ascending: false })

			// Create a map of job id -> events
			const eventsMap = new Map<string, Array<any>>()
			if (eventsData && eventsData.length > 0) {
				eventsData.forEach((event) => {
					if (!eventsMap.has(event.job_application_id)) {
						eventsMap.set(event.job_application_id, [])
					}
					eventsMap.get(event.job_application_id)?.push({
						date: event.date,
						title: event.title,
						description: event.description || '',
					})
				})
			}

			// Format jobs
			const formattedAdditionalJobs = additionalJobs.map((job) => ({
				id: job.id,
				company: job.company,
				position: job.position,
				location: job.location || '',
				status: job.status as JobApplication['status'],
				appliedDate: job.applied_date || '',
				lastUpdated: job.last_updated,
				companyWebsite: '',
				salary: job.salary || '',
				jobDescription: '',
				workType: (job.work_type || 'On-site') as JobApplication['workType'],
				employmentType: (job.employment_type ||
					'Full-time') as JobApplication['employmentType'],
				remote: job.remote || false,
				events: eventsMap.get(job.id) || [],
				notes: [],
				contacts: [],
			}))

			// Merge with existing jobs
			const allJobs = [...existingJobs, ...formattedAdditionalJobs]

			// Update state
			safeSetJobs(allJobs)

			// Update cache
			const userCacheKey = `user_${user.id}_jobs`
			localStorage.setItem(userCacheKey, JSON.stringify(allJobs))
			localStorage.setItem(`${userCacheKey}_timestamp`, Date.now().toString())
			localStorage.setItem('cached_jobs', JSON.stringify(allJobs))
			localStorage.setItem('cached_jobs_timestamp', Date.now().toString())

			console.log(
				`Added ${formattedAdditionalJobs.length} more jobs, total now: ${allJobs.length}`
			)

			// Continue fetching if needed
			const newOffset = offset + additionalJobs.length
			if (newOffset < totalCount) {
				setTimeout(() => {
					fetchRemainingJobs(newOffset, totalCount, allJobs)
				}, 1000)
			} else {
				// All jobs fetched, prefetch details for the first 10
				setTimeout(() => {
					prefetchJobDetails(allJobs.slice(0, 10).map((job) => job.id))
				}, 2000)
			}
		} catch (error) {
			console.error('Error fetching remaining jobs:', error)
		}
	}

	// Prefetch detailed job data in the background
	const prefetchJobDetails = async (jobIds: string[]) => {
		try {
			// Only fetch first 10 jobs' full details to balance performance
			const priorityJobIds = jobIds.slice(0, 10)

			const { data: detailedJobs, error } = await supabase
				.from('job_applications')
				.select('*')
				.in('id', priorityJobIds)

			if (error) {
				console.error('Background prefetch error:', error)
				return
			}

			if (detailedJobs && detailedJobs.length > 0) {
				// Store in sessionStorage for quick access
				detailedJobs.forEach((job) => {
					sessionStorage.setItem(`job_details_${job.id}`, JSON.stringify(job))

					// Also update our in-memory jobs with the detailed data for recently edited jobs
					safeSetJobs((prevJobs) =>
						prevJobs.map((prevJob) => {
							if (prevJob.id === job.id) {
								return {
									...prevJob,
									jobDescription: job.job_description || '',
									companyWebsite: job.company_website || '',
									salary: job.salary || '',
								}
							}
							return prevJob
						})
					)
				})
				console.log('Prefetched detailed data for', detailedJobs.length, 'jobs')
			}
		} catch (e) {
			console.error('Error in background prefetch:', e)
			// Non-critical, so just log the error
		}
	}

	// Load jobs when user changes
	useEffect(() => {
		console.log('User changed, loading jobs. User ID:', user?.id)
		loadJobs()
	}, [user?.id])

	// Expose the loadJobs function for manual refresh
	const refreshJobs = async () => {
		return loadJobs()
	}

	// Add a job to Supabase
	const addJob = async (job: JobApplication): Promise<void> => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			// Generate a UUID if none provided
			const jobId = job.id || uuidv4()

			// Ensure jobDescription is defined and typed correctly
			const jobDescription =
				typeof job.jobDescription === 'string'
					? job.jobDescription
					: String(job.jobDescription || '')

			// Prepare job data for Supabase
			const supabaseJob: JobApplicationDB = {
				id: jobId,
				user_id: user.id,
				...prepareJobForDB(job),
				job_description: jobDescription, // Override with our validated version
			}

			// Insert job into Supabase
			const { error: jobError } = await supabase
				.from('job_applications')
				.insert(supabaseJob)

			if (jobError) {
				throw jobError
			}

			// Add events if any exist
			if (job.events && job.events.length > 0) {
				const eventsToInsert: JobEventDB[] = job.events.map((event) => ({
					job_application_id: jobId,
					date: event.date,
					title: event.title,
					description: event.description || null,
				}))

				const { error: eventsError } = await supabase
					.from('job_application_events')
					.insert(eventsToInsert)

				if (eventsError) {
					console.error('Error adding job events:', eventsError.message)
				}
			}

			// Create a new job with consistent data
			const jobToAdd: JobApplication = {
				...job,
				id: jobId,
				jobDescription,
				lastUpdated: supabaseJob.last_updated,
			}

			// Update local state
			safeSetJobs((prevJobs) => [jobToAdd, ...prevJobs])

			// Update cache with new job
			const userCacheKey = `user_${user.id}_jobs`
			const cachedJobs = localStorage.getItem(userCacheKey)

			if (cachedJobs) {
				try {
					const parsed = JSON.parse(cachedJobs)
					if (Array.isArray(parsed)) {
						const updatedCache = [jobToAdd, ...parsed]
						localStorage.setItem(userCacheKey, JSON.stringify(updatedCache))
						localStorage.setItem(
							`${userCacheKey}_timestamp`,
							Date.now().toString()
						)
					}
				} catch (e) {
					console.error('Error updating job cache:', e)
				}
			}

			toast({
				title: 'Job added',
				description: 'Job application has been added successfully.',
			})
		} catch (error: any) {
			console.error('Error adding job:', error.message)
			toast({
				title: 'Error adding job',
				description: error.message || 'There was a problem adding the job.',
				variant: 'destructive',
			})
		}
	}

	// Delete a job from Supabase
	const deleteJob = async (id: string): Promise<void> => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			// Update local state first for immediate feedback
			safeSetJobs((prevJobs) => prevJobs.filter((job) => job.id !== id))

			// Update cache
			const userCacheKey = `user_${user.id}_jobs`
			const cachedJobs = localStorage.getItem(userCacheKey)

			if (cachedJobs) {
				try {
					const parsed = JSON.parse(cachedJobs)
					if (Array.isArray(parsed)) {
						const updatedCache = parsed.filter((job) => job.id !== id)
						localStorage.setItem(userCacheKey, JSON.stringify(updatedCache))
						localStorage.setItem(
							`${userCacheKey}_timestamp`,
							Date.now().toString()
						)
					}
				} catch (e) {
					console.error('Error updating job cache:', e)
				}
			}

			// Delete from Supabase
			const { error } = await supabase
				.from('job_applications')
				.delete()
				.eq('id', id)

			if (error) {
				throw error
			}

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
		}
	}

	// Update a job in Supabase
	const updateJob = async (updatedJob: JobApplication): Promise<void> => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			// Ensure jobDescription is defined and properly typed
			const jobDescription =
				typeof updatedJob.jobDescription === 'string'
					? updatedJob.jobDescription
					: String(updatedJob.jobDescription || '')

			// Update local state first for immediate feedback
			const updatedJobWithCorrectData = {
				...updatedJob,
				jobDescription,
				lastUpdated: new Date().toISOString(),
			}

			safeSetJobs((prevJobs) =>
				prevJobs.map((job) =>
					job.id === updatedJob.id ? updatedJobWithCorrectData : job
				)
			)

			// Update cache
			const userCacheKey = `user_${user.id}_jobs`
			const cachedJobs = localStorage.getItem(userCacheKey)

			if (cachedJobs) {
				try {
					const parsed = JSON.parse(cachedJobs)
					if (Array.isArray(parsed)) {
						const updatedCache = parsed.map((job) =>
							job.id === updatedJob.id ? updatedJobWithCorrectData : job
						)
						localStorage.setItem(userCacheKey, JSON.stringify(updatedCache))
						localStorage.setItem(
							`${userCacheKey}_timestamp`,
							Date.now().toString()
						)
					}
				} catch (e) {
					console.error('Error updating job cache:', e)
				}
			}

			// Prepare data for database update
			const dbUpdateData = {
				...prepareJobForDB(updatedJob),
				job_description: jobDescription, // Override with our validated version
			}

			console.log('Updating job with description:', jobDescription)

			// Update all fields in a single operation instead of two separate calls
			const { error: jobError } = await supabase
				.from('job_applications')
				.update(dbUpdateData)
				.eq('id', updatedJob.id)

			if (jobError) {
				throw jobError
			}

			// Handle events - first delete existing events for this job
			if (updatedJob.events && updatedJob.events.length > 0) {
				// Delete all existing events for this job
				const { error: deleteEventsError } = await supabase
					.from('job_application_events')
					.delete()
					.eq('job_application_id', updatedJob.id)

				if (deleteEventsError) {
					console.error(
						'Error deleting existing events:',
						deleteEventsError.message
					)
				}

				// Insert updated events
				const eventsToInsert: JobEventDB[] = updatedJob.events.map((event) => ({
					job_application_id: updatedJob.id,
					date: event.date,
					title: event.title,
					description: event.description || null,
				}))

				const { error: insertEventsError } = await supabase
					.from('job_application_events')
					.insert(eventsToInsert)

				if (insertEventsError) {
					console.error(
						'Error adding updated events:',
						insertEventsError.message
					)
				}
			}

			// Update sessionStorage cache if it exists
			const sessionKey = `job_details_${updatedJob.id}`
			const cachedDetails = sessionStorage.getItem(sessionKey)
			if (cachedDetails) {
				try {
					const parsedDetails = JSON.parse(cachedDetails)
					const updatedDetails = {
						...parsedDetails,
						job_description: jobDescription,
						last_updated: new Date().toISOString(),
					}
					sessionStorage.setItem(sessionKey, JSON.stringify(updatedDetails))
				} catch (e) {
					console.error('Error updating session storage cache:', e)
				}
			} else {
				// If no cached details exist yet, fetch and cache the full job details
				try {
					const { data } = await supabase
						.from('job_applications')
						.select('*')
						.eq('id', updatedJob.id)
						.single()

					if (data) {
						sessionStorage.setItem(sessionKey, JSON.stringify(data))
					}
				} catch (e) {
					console.error('Error fetching job details for cache:', e)
				}
			}

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
		}
	}

	const value = {
		jobs,
		isLoading,
		addJob,
		deleteJob,
		updateJob,
		refreshJobs,
	}

	return <JobContext.Provider value={value}>{children}</JobContext.Provider>
}

export default JobProvider
