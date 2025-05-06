import { createClient } from '@supabase/supabase-js'

// Debug mode flag - set to false to disable verbose logging
const DEBUG = false

// Debug logger that only logs in development mode
const debugLog = (...args: any[]) => {
	if (DEBUG) {
		console.debug(...args)
	}
}

// Supabase client setup
// Get URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Check if the URL is available
if (!supabaseUrl) {
	console.error('VITE_SUPABASE_URL environment variable is not set')
	throw new Error('Missing Supabase URL configuration')
}

// Get the anon key from environment variables
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if the key is available
if (!supabaseAnonKey) {
	console.error('VITE_SUPABASE_ANON_KEY environment variable is not set')
	throw new Error('Missing Supabase Anon Key configuration')
}

// Create Supabase client with additional configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		storageKey: 'jobtrakr-auth-token',
	},
	realtime: {
		params: {
			eventsPerSecond: 10,
		},
	},
	global: {
		headers: {
			'X-Client-Info': 'jobtrakr-web-app',
		},
		fetch: (url, options) => {
			// Log all API requests to help debug Content Security Policy issues
			debugLog('Supabase fetch:', url, options?.method || 'GET')

			// Add error handling for authentication issues
			return fetch(url, options)
				.then((response) => {
					// Check for authentication errors
					if (response.status === 403 && url.includes('/auth/v1/user')) {
						console.warn(
							'Auth token may be expired (403 Forbidden). Attempting refresh...'
						)
						// We'll let the AuthContext handle the refresh
					}

					return response
				})
				.catch((error) => {
					// Handle network errors
					console.error('Fetch error:', error)
					throw error
				})
		},
	},
})

// Cache for profile data
let profileDataCache: Record<string, any> = {}
let professionalDataCache: Record<string, any> = {}
const profileDataFetchPromise: Record<string, Promise<any>> = {} // Store promises to prevent duplicate requests
const professionalDataFetchPromise: Record<string, Promise<any>> = {}
const CACHE_TIMESTAMP_KEY = 'profile_cache_timestamp'
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes cache validity

// Cache for document data
let documentsCache: Record<string, any[]> = {}
const documentsFetchPromise: Record<string, Promise<any>> = {} // Store promises to prevent duplicate requests
const DOCUMENTS_CACHE_KEY = 'documents_cache'
const DOCUMENTS_TIMESTAMP_KEY = 'documents_cache_timestamp'

// URL cache to avoid redundant fetching
let documentUrlCache: Record<string, string> = {}
const DOCUMENT_URLS_CACHE_KEY = 'document_urls_cache'

// Add localStorage caching for true persistence between page loads
export const initializeLocalCache = () => {
	try {
		// Try to restore cache from localStorage
		const storedProfileCache = localStorage.getItem('profile_data_cache')
		const storedProfessionalCache = localStorage.getItem(
			'professional_data_cache'
		)
		const storedDocumentsCache = localStorage.getItem(DOCUMENTS_CACHE_KEY)
		const storedDocumentUrlsCache = localStorage.getItem(
			DOCUMENT_URLS_CACHE_KEY
		)

		if (storedProfileCache) {
			profileDataCache = JSON.parse(storedProfileCache)
			debugLog('Restored profile cache from localStorage')
		}

		if (storedProfessionalCache) {
			professionalDataCache = JSON.parse(storedProfessionalCache)
			debugLog('Restored professional cache from localStorage')
		}

		if (storedDocumentsCache) {
			documentsCache = JSON.parse(storedDocumentsCache)
			debugLog('Restored documents cache from localStorage')
		}

		if (storedDocumentUrlsCache) {
			documentUrlCache = JSON.parse(storedDocumentUrlsCache)
			debugLog('Restored document URLs cache from localStorage')
		}
	} catch (error) {
		console.error('Error initializing local cache:', error)
		// Reset caches if there was an error
		profileDataCache = {}
		professionalDataCache = {}
		documentsCache = {}
		documentUrlCache = {}
	}
}

// Initialize cache on module load
initializeLocalCache()

// Update localStorage when cache changes
const updateLocalStorage = () => {
	try {
		localStorage.setItem('profile_data_cache', JSON.stringify(profileDataCache))
		localStorage.setItem(
			'professional_data_cache',
			JSON.stringify(professionalDataCache)
		)
		localStorage.setItem(DOCUMENTS_CACHE_KEY, JSON.stringify(documentsCache))
		localStorage.setItem(
			DOCUMENT_URLS_CACHE_KEY,
			JSON.stringify(documentUrlCache)
		)
	} catch (error) {
		console.error('Error updating localStorage cache:', error)
	}
}

// Utility to preload user profile data
export const preloadUserProfileData = async (userId: string) => {
	if (!userId) return

	// Check if data was recently cached - use a shorter timeout for faster startup
	const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
	if (cacheTimestamp) {
		const cachedTime = parseInt(cacheTimestamp, 10)
		if (!isNaN(cachedTime) && Date.now() - cachedTime < CACHE_TIMEOUT) {
			debugLog('Using existing cache, still valid')
			// Return immediately, we'll refresh in the background if needed

			// Schedule a background refresh if cache is older than 2 minutes
			if (Date.now() - cachedTime > 2 * 60 * 1000) {
				setTimeout(() => {
					backgroundRefreshProfileData(userId)
				}, 5000) // Delay by 5 seconds to prioritize UI loading
			}
			return
		}
	}

	// Set a flag to avoid multiple concurrent loads
	const loadingFlag = sessionStorage.getItem('profile_loading')
	if (loadingFlag === 'true') {
		debugLog('Profile already loading in another tab/request')
		return
	}
	sessionStorage.setItem('profile_loading', 'true')

	try {
		// Only fetch profile data synchronously (most important)
		// This makes the initial page load faster
		const profileResponse = await fetchProfileData(userId)

		// Update cache timestamp immediately after profile data
		localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())

		// Professional data is less critical, load in background
		setTimeout(() => {
			fetchProfessionalData(userId)
				.then(() => {
					updateLocalStorage()
				})
				.catch((error) => {
					console.error('Background professional data fetch error:', error)
				})
				.finally(() => {
					// Clear loading flag when complete
					sessionStorage.removeItem('profile_loading')
				})
		}, 1000)

		return profileResponse
	} catch (error) {
		console.error('Error preloading user profile data:', error)
		sessionStorage.removeItem('profile_loading')
	}
}

// Separate function for background refresh to avoid duplicating code
const backgroundRefreshProfileData = async (userId: string) => {
	debugLog('Starting background refresh of profile data')
	try {
		// Fetch data in parallel but don't block UI
		const promises = [fetchProfileData(userId), fetchProfessionalData(userId)]
		await Promise.all(promises)

		// Update cache timestamp
		localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())

		// Update localStorage
		updateLocalStorage()
		debugLog('Background profile refresh complete')
	} catch (error) {
		console.error('Error in background profile refresh:', error)
	}
}

// Helper to fetch profile data with deduplication
const fetchProfileData = async (userId: string) => {
	// If a fetch is already in progress for this user, return the existing promise
	if (profileDataFetchPromise[userId]) {
		debugLog('Using existing profile fetch promise for', userId)
		return profileDataFetchPromise[userId]
	}

	try {
		// Create a new fetch promise and store it
		const fetchPromise = Promise.resolve(
			supabase.from('profiles').select('*').eq('id', userId).single()
		)

		// Store the promise for deduplication
		profileDataFetchPromise[userId] = fetchPromise

		// Wait for the result
		const response = await fetchPromise

		// Cache the result if successful
		if (!response.error && response.data) {
			profileDataCache[userId] = response.data
			// Update localStorage
			updateLocalStorage()
		}

		// Return the response
		return response
	} catch (error) {
		console.error('Error fetching profile data:', error)
		throw error
	} finally {
		// Clear the promise reference when done
		delete profileDataFetchPromise[userId]
	}
}

// Helper to fetch professional data with deduplication
const fetchProfessionalData = async (userId: string) => {
	// If a fetch is already in progress for this user, return the existing promise
	if (professionalDataFetchPromise[userId]) {
		debugLog('Using existing professional fetch promise for', userId)
		return professionalDataFetchPromise[userId]
	}

	try {
		// Create a new fetch promise and store it
		const fetchPromise = Promise.resolve(
			supabase
				.from('professional_details')
				.select('*')
				.eq('user_id', userId)
				.single()
		)

		// Store the promise for deduplication
		professionalDataFetchPromise[userId] = fetchPromise

		// Wait for the result
		const response = await fetchPromise

		// Cache the result if successful
		if (!response.error && response.data) {
			professionalDataCache[userId] = response.data
			// Update localStorage
			updateLocalStorage()
		}

		// Return the response
		return response
	} catch (error) {
		console.error('Error fetching professional data:', error)
		throw error
	} finally {
		// Clear the promise reference when done
		delete professionalDataFetchPromise[userId]
	}
}

// Get cached profile data
export const getCachedProfileData = (userId: string) => {
	if (!profileDataCache[userId]) {
		// Trigger fetch in background if not cached
		setTimeout(() => {
			fetchProfileData(userId)
				.then(() => {})
				.catch((err) => console.error('Background profile fetch error:', err))
		}, 0)
	}
	return profileDataCache[userId] || null
}

// Get cached professional data
export const getCachedProfessionalData = (userId: string) => {
	if (!professionalDataCache[userId]) {
		// Trigger fetch in background if not cached
		setTimeout(() => {
			fetchProfessionalData(userId)
				.then(() => {})
				.catch((err) =>
					console.error('Background professional fetch error:', err)
				)
		}, 0)
	}
	return professionalDataCache[userId] || null
}

// Helper function to fetch documents with deduplication and caching
export const fetchUserDocuments = async (userId: string, fileType?: string) => {
	// Generate cache key based on user ID and optional file type
	const cacheKey = fileType ? `${userId}-${fileType}` : userId

	// Check if we have cached data that's still recent
	const cacheTimestamp = localStorage.getItem(DOCUMENTS_TIMESTAMP_KEY)
	const DOCS_CACHE_TIMEOUT = 10 * 60 * 1000 // 10 minutes

	if (
		documentsCache[cacheKey] &&
		documentsCache[cacheKey].length > 0 &&
		cacheTimestamp
	) {
		const cachedTime = parseInt(cacheTimestamp, 10)
		if (!isNaN(cachedTime) && Date.now() - cachedTime < DOCS_CACHE_TIMEOUT) {
			debugLog('Using cached documents for', cacheKey)

			// Refresh in background if cache is older than 3 minutes
			if (Date.now() - cachedTime > 3 * 60 * 1000) {
				setTimeout(() => refreshDocumentsInBackground(userId, fileType), 3000)
			}

			return { data: documentsCache[cacheKey], error: null }
		}
	}

	// If a fetch is already in progress for this key, return the existing promise
	if (documentsFetchPromise[cacheKey]) {
		debugLog('Using existing documents fetch promise for', cacheKey)
		return documentsFetchPromise[cacheKey]
	}

	try {
		// Create a new fetch promise
		const fetchPromise = Promise.resolve(
			// Build the query with pagination - fetch at most 50 documents at a time
			// This makes initial load faster
			supabase
				.from('user_documents')
				.select('*')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(50)
				.then(async (response) => {
					if (response.error) {
						console.error('Error fetching documents:', response.error)
						return { data: [], error: response.error }
					}

					// Filter by file type if specified
					let documents = response.data || []
					if (fileType && documents.length > 0) {
						documents = documents.filter((doc) => doc.file_type === fileType)
					}

					// Cache the results
					documentsCache[cacheKey] = documents

					// Update localStorage
					updateLocalStorage()
					localStorage.setItem(DOCUMENTS_TIMESTAMP_KEY, Date.now().toString())

					// If the user has more than 50 documents, fetch the rest in background
					// This ensures initial page load is fast while still getting all documents
					if (response.data && response.data.length === 50) {
						setTimeout(() => {
							fetchRemainingDocuments(userId, fileType, 50)
						}, 2000)
					}

					return { data: documents, error: null }
				})
		)

		// Store the promise for deduplication
		documentsFetchPromise[cacheKey] = fetchPromise

		// Return the promise
		return fetchPromise
	} catch (error) {
		console.error('Error in fetchUserDocuments:', error)
		throw error
	} finally {
		// Clear the promise reference when done
		setTimeout(() => {
			delete documentsFetchPromise[cacheKey]
		}, 5000)
	}
}

// Fetch documents beyond the initial 50
const fetchRemainingDocuments = async (
	userId: string,
	fileType?: string,
	offset: number = 50
) => {
	debugLog(`Fetching additional documents starting at offset ${offset}`)
	const cacheKey = fileType ? `${userId}-${fileType}` : userId

	try {
		const { data, error } = await supabase
			.from('user_documents')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + 49)

		if (error) {
			console.error('Error fetching additional documents:', error)
			return
		}

		if (!data || data.length === 0) return

		// Filter by file type if needed
		let additionalDocs = data
		if (fileType) {
			additionalDocs = data.filter((doc) => doc.file_type === fileType)
		}

		// Update the cache with the new documents
		documentsCache[cacheKey] = [
			...(documentsCache[cacheKey] || []),
			...additionalDocs,
		]
		updateLocalStorage()

		// If we got 50 documents, there might be more
		if (data.length === 50) {
			setTimeout(() => {
				fetchRemainingDocuments(userId, fileType, offset + 50)
			}, 1000)
		}
	} catch (e) {
		console.error('Error fetching remaining documents:', e)
	}
}

// Background refresh for documents
const refreshDocumentsInBackground = async (
	userId: string,
	fileType?: string
) => {
	debugLog('Starting background refresh of documents')
	const cacheKey = fileType ? `${userId}-${fileType}` : userId

	try {
		const { data, error } = await supabase
			.from('user_documents')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })

		if (error) throw error

		let filteredDocs = data || []
		if (fileType && filteredDocs.length > 0) {
			filteredDocs = filteredDocs.filter((doc) => doc.file_type === fileType)
		}

		// Update the cache
		documentsCache[cacheKey] = filteredDocs
		updateLocalStorage()
		localStorage.setItem(DOCUMENTS_TIMESTAMP_KEY, Date.now().toString())
		debugLog('Documents refreshed in background')
	} catch (error) {
		console.error('Error refreshing documents in background:', error)
	}
}

// Get cached documents
export const getCachedDocuments = (userId: string, fileType?: string) => {
	const cacheKey = fileType ? `${userId}-${fileType}` : userId

	// Check if we need to refresh the cache
	const cacheTimestamp = localStorage.getItem(DOCUMENTS_TIMESTAMP_KEY)
	const needsRefresh =
		!cacheTimestamp || Date.now() - parseInt(cacheTimestamp, 10) > CACHE_TIMEOUT

	// If we don't have cached data or it's stale, fetch in background
	if (!documentsCache[cacheKey] || needsRefresh) {
		setTimeout(() => {
			fetchUserDocuments(userId, fileType)
				.then(() => {})
				.catch((err) => console.error('Background documents fetch error:', err))
		}, 0)
	}

	// Return cached data (might be empty if first load)
	return documentsCache[cacheKey] || []
}

// Get a cached document URL or null if not cached
export const getCachedDocumentUrl = (filePath: string): string | null => {
	return documentUrlCache[filePath] || null
}

// Cache a document URL
export const cacheDocumentUrl = (filePath: string, url: string): void => {
	documentUrlCache[filePath] = url
	updateLocalStorage()
}

// Get all cached document URLs
export const getAllCachedDocumentUrls = (): Record<string, string> => {
	return { ...documentUrlCache }
}

// Clear cache for a user
export const clearUserCache = (userId: string) => {
	delete profileDataCache[userId]
	delete professionalDataCache[userId]
	delete profileDataFetchPromise[userId]
	delete professionalDataFetchPromise[userId]

	// Clear document caches
	Object.keys(documentsCache).forEach((key) => {
		if (key.startsWith(userId)) {
			delete documentsCache[key]
		}
	})

	Object.keys(documentsFetchPromise).forEach((key) => {
		if (key.startsWith(userId)) {
			delete documentsFetchPromise[key]
		}
	})

	// Clear document URL caches for this user's documents
	// Note: This would require matching filePaths with user, so we'll just clear all URL cache on logout
	documentUrlCache = {}

	localStorage.removeItem(CACHE_TIMESTAMP_KEY)
	localStorage.removeItem(DOCUMENTS_TIMESTAMP_KEY)
	localStorage.removeItem('profile_data_cache')
	localStorage.removeItem('professional_data_cache')
	localStorage.removeItem(DOCUMENTS_CACHE_KEY)
	localStorage.removeItem(DOCUMENT_URLS_CACHE_KEY)
}
