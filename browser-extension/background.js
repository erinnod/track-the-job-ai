/**
 * JobTrakr Browser Extension
 * Background Script
 */

// Configuration - make sure it matches your production environment
const API_BASE_URL = 'https://jobtrakr.co.uk/api' // Production API endpoint
const WEB_APP_URL = 'https://jobtrakr.co.uk' // Production web app URL

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('Message received in background:', message)

	// Handle different message actions
	switch (message.action) {
		case 'saveJob':
			handleSaveJob(message.jobData, sendResponse)
			return true // Keep the message channel open for async response

		case 'getStatus':
			handleGetStatus(sendResponse)
			return true

		case 'openOptions':
			chrome.runtime.openOptionsPage()
			sendResponse({ success: true })
			return false

		case 'linkAccount':
			handleLinkAccount(
				message.websiteEmail,
				message.websitePassword,
				sendResponse
			)
			return true

		case 'checkWebsiteSession':
			checkWebsiteSession(sendResponse)
			return true

		case 'directLogin':
			handleDirectLogin(message.email, message.password, sendResponse)
			return true

		case 'openLoginPage':
			openLoginPage()
			sendResponse({ success: true })
			return false

		case 'getAuthCookies':
			getAuthCookies(sendResponse)
			return true

		default:
			console.warn('Unknown action:', message.action)
			sendResponse({ success: false, error: 'Unknown action' })
			return false
	}
})

// Listen for messages from external sources (the website)
chrome.runtime.onMessageExternal.addListener(
	(message, sender, sendResponse) => {
		console.log('External message received:', message, 'from:', sender.url)

		// Validate the sender is our website
		if (!sender.url.includes('jobtrakr.co.uk')) {
			console.warn('Rejecting message from non-jobtrakr origin:', sender.url)
			sendResponse({ success: false, error: 'Invalid origin' })
			return false
		}

		// Handle different message types
		switch (message.action) {
			case 'syncAuthState':
				// Website is asking for auth state sync
				syncAuthStateWithWebsite(message.token, message.user, sendResponse)
				return true // Keep the message channel open for async response

			case 'checkExtensionAuth':
				// Website is asking if extension is authenticated
				checkExtensionAuth(sendResponse)
				return true

			default:
				console.warn('Unknown external action:', message.action)
				sendResponse({ success: false, error: 'Unknown action' })
				return false
		}
	}
)

/**
 * Handle saving a job to JobTrakr
 * @param {Object} jobData - The job data to save
 * @param {Function} sendResponse - Function to send response back to content script
 */
async function handleSaveJob(jobData, sendResponse) {
	try {
		console.log('Saving job:', jobData)

		// Get auth token from storage
		const auth = await getAuthToken()

		if (!auth) {
			console.log('No auth token found, opening login')
			// Open login page
			openLoginPage()
			sendResponse({
				success: false,
				error: 'Authentication required',
				requiresAuth: true,
			})
			return
		}

		// Add timestamp if not present
		if (!jobData.appliedDate) {
			jobData.appliedDate = new Date().toISOString()
		}

		// Transform data to match API expectations
		const apiJobData = transformJobDataForApi(jobData)

		// Determine if we should save to website or extension-only
		const endpoint = auth.websiteLinked
			? `${API_BASE_URL}/jobs?syncToWebsite=true`
			: `${API_BASE_URL}/jobs`

		// Send data to API
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth.token}`,
			},
			body: JSON.stringify(apiJobData),
		})

		if (!response.ok) {
			// Handle API errors
			const errorData = await response.json().catch(() => ({}))
			console.error('API error:', response.status, errorData)

			if (response.status === 401) {
				// Token expired, clear it and ask for re-login
				await clearAuthToken()
				openLoginPage()
				sendResponse({
					success: false,
					error: 'Session expired. Please log in again.',
					requiresAuth: true,
				})
			} else {
				sendResponse({
					success: false,
					error: errorData.message || `API error: ${response.status}`,
				})
			}
			return
		}

		const result = await response.json()

		// Add info about where the job was saved
		const storageLocation = auth.websiteLinked
			? `JobTrakr extension and website (${auth.websiteEmail})`
			: 'JobTrakr extension only'

		// Show a browser notification
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon-128.png',
			title: 'Job Saved to JobTrakr',
			message: `"${jobData.title}" at "${jobData.company}" was saved to ${storageLocation}.`,
		})

		// Send success response back to content script
		sendResponse({
			success: true,
			jobId: result.id,
			syncedToWebsite: auth.websiteLinked,
		})
	} catch (error) {
		console.error('Error saving job:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Handle linking an extension account to a website account
 * @param {string} websiteEmail - Website account email
 * @param {string} websitePassword - Website account password
 * @param {Function} sendResponse - Function to send response back
 */
async function handleLinkAccount(websiteEmail, websitePassword, sendResponse) {
	try {
		// Get current auth token
		const auth = await getAuthToken()

		if (!auth) {
			sendResponse({
				success: false,
				error: 'Not logged in to extension',
			})
			return
		}

		// Call API to link accounts
		const response = await fetch(`${API_BASE_URL}/auth/link-account`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth.token}`,
			},
			body: JSON.stringify({
				websiteEmail,
				websitePassword,
			}),
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(
				errorData.message || `Failed to link accounts: ${response.status}`
			)
		}

		const data = await response.json()

		// Update auth data in storage
		const updatedAuth = {
			...auth,
			websiteLinked: true,
			websiteEmail,
		}

		await saveAuthData(updatedAuth)

		// Send success response
		sendResponse({
			success: true,
			message: 'Accounts linked successfully',
			websiteEmail,
		})
	} catch (error) {
		console.error('Error linking accounts:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Transform job data to match API expectations
 * @param {Object} jobData - Job data from content script
 * @returns {Object} - Transformed job data for API
 */
function transformJobDataForApi(jobData) {
	// Map content script job data to API job format
	return {
		title: jobData.title,
		company: jobData.company,
		location: jobData.location,
		job_type: jobData.jobType,
		description: jobData.description,
		salary: jobData.salary,
		url: jobData.applicationUrl || jobData.url,
		source: jobData.source,
		skills: jobData.skills,
		status: 'saved', // Default status for jobs saved from extension
		applied_date: jobData.appliedDate,
		notes:
			jobData.notes || `Saved from ${jobData.source} via JobTrakr extension`,
	}
}

/**
 * Handle request for extension status
 * @param {Function} sendResponse - Function to send response back to content script
 */
async function handleGetStatus(sendResponse) {
	try {
		// Get auth status
		const auth = await getAuthToken()

		// Get version info
		const manifest = chrome.runtime.getManifest()

		sendResponse({
			success: true,
			version: manifest.version,
			isLoggedIn: !!auth,
			userId: auth ? auth.userId : null,
			websiteLinked: auth ? !!auth.websiteLinked : false,
			websiteEmail: auth ? auth.websiteEmail : null,
		})
	} catch (error) {
		console.error('Error getting status:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Get auth token from storage
 * @returns {Promise<Object|null>} - Auth object or null if not found
 */
function getAuthToken() {
	return new Promise((resolve) => {
		chrome.storage.local.get(['auth'], (result) => {
			console.log('Getting auth token from storage:', result.auth)
			if (result.auth && isTokenValid(result.auth)) {
				resolve(result.auth)
			} else {
				resolve(null)
			}
		})
	})
}

/**
 * Save auth data to storage
 * @param {Object} authData - Auth data to save
 * @returns {Promise<void>}
 */
function saveAuthData(authData) {
	return new Promise((resolve) => {
		chrome.storage.local.set({ auth: authData }, () => {
			console.log('Auth data saved to storage')
			resolve()
		})
	})
}

/**
 * Check if stored token is still valid
 * @param {Object} auth - Auth object from storage
 * @returns {boolean} - Whether token is valid
 */
function isTokenValid(auth) {
	if (!auth || !auth.expiresAt) return false

	// Check if token has expired
	return new Date(auth.expiresAt) > new Date()
}

/**
 * Clear auth token from storage
 * @returns {Promise<void>}
 */
function clearAuthToken() {
	return new Promise((resolve) => {
		chrome.storage.local.remove(['auth'], resolve)
	})
}

/**
 * Open login page
 */
function openLoginPage() {
	// Get extension ID for the login URL
	const extensionId = chrome.runtime.id

	// Create the login URL with proper parameters
	const loginUrl =
		'https://jobtrakr.co.uk/login?source=extension&extension_id=' +
		extensionId +
		'&redirect_after_login=dashboard'

	console.log('Opening website login page at:', loginUrl)

	chrome.tabs.create({
		url: loginUrl,
	})
}

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'install') {
		// First install
		console.log('Extension installed')
		chrome.tabs.create({
			url: 'onboarding/welcome.html',
		})
	} else if (details.reason === 'update') {
		// Extension updated
		console.log('Extension updated from version', details.previousVersion)

		// Show update notification for major/minor updates
		const previousVersion = details.previousVersion.split('.')
		const currentVersion = chrome.runtime.getManifest().version.split('.')

		if (
			previousVersion[0] !== currentVersion[0] ||
			previousVersion[1] !== currentVersion[1]
		) {
			chrome.notifications.create({
				type: 'basic',
				iconUrl: 'icons/icon-128.png',
				title: 'JobTrakr Extension Updated',
				message: `Updated to version ${currentVersion.join(
					'.'
				)}. Click to see what's new.`,
			})
		}
	}
})

// Handle browser action click (extension icon)
chrome.action.onClicked.addListener((tab) => {
	// Check if we're on a job site
	const url = tab.url || ''

	if (
		url.includes('linkedin.com/jobs') ||
		url.includes('indeed.com/job') ||
		url.includes('glassdoor.com/job')
	) {
		// We're on a job page, inject the content script if not already
		chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: injectSaveButton,
		})
	} else {
		// Not on a job page, open JobTrakr in a new tab
		chrome.tabs.create({
			url: 'https://jobtrakr.co.uk/dashboard',
		})
	}
})

/**
 * Function to inject save button via executeScript
 */
function injectSaveButton() {
	// This function runs in the context of the page
	if (document.querySelector('#jobtrakr-save-button')) {
		// Button already exists, just highlight it
		const button = document.querySelector('#jobtrakr-save-button')
		button.style.transform = 'scale(1.1)'
		setTimeout(() => {
			button.style.transform = 'scale(1)'
		}, 200)
		return
	}

	// Button doesn't exist yet, the page might not have loaded
	// Send a message to the content script to create it
	chrome.runtime.sendMessage({ action: 'createSaveButton' })
}

/**
 * Check for existing website session and authenticate extension if found
 * @param {Function} sendResponse - Function to send response back
 */
async function checkWebsiteSession(sendResponse) {
	try {
		console.log('Checking for existing website session...')

		// First try cookies directly - this is the most reliable method
		try {
			const cookies = await chrome.cookies.getAll({
				domain: 'jobtrakr.co.uk',
			})

			console.log('Found cookies:', cookies.length)

			// Look for auth cookies - expanded list of possible cookie names
			const authCookie = cookies.find(
				(cookie) =>
					cookie.name === 'jobtrakr-auth-token' ||
					cookie.name === 'sb-kffbwemulhhsyaiooabh-auth-token' ||
					cookie.name.includes('auth') ||
					cookie.name.includes('session') ||
					cookie.name.includes('supabase')
			)

			if (authCookie) {
				console.log('Found auth cookie:', authCookie.name)

				// Use the cookie value as token
				const authToken = authCookie.value

				// Verify the token by calling the API with the token
				const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${authToken}`,
						'Content-Type': 'application/json',
					},
					credentials: 'include', // Important: Include credentials with the request
				})

				if (verifyResponse.ok) {
					try {
						const userData = await verifyResponse.json()

						// Session found, save it to extension storage
						const authData = {
							token: authToken,
							userId: userData.user.id,
							email: userData.user.email,
							expiresAt: calculateExpiryDate(86400), // 24 hours
							websiteLinked: true,
							websiteEmail: userData.user.email,
						}

						await saveAuthData(authData)

						console.log(
							'Website session found via cookies and saved to extension'
						)
						sendResponse({
							success: true,
							hasSession: true,
							email: userData.user.email,
							userId: userData.user.id,
							token: authToken,
						})

						// Show a notification
						chrome.notifications.create({
							type: 'basic',
							iconUrl: 'icons/icon-128.png',
							title: 'JobTrakr Authenticated',
							message: `You are now signed in to JobTrakr extension using your website account (${userData.user.email})`,
						})

						return
					} catch (jsonError) {
						console.error('Error parsing verify response as JSON:', jsonError)
						// Continue to other methods
					}
				} else {
					console.error('Failed to verify token:', verifyResponse.status)
				}
			}
		} catch (cookieError) {
			console.error('Error checking cookies:', cookieError)
		}

		// If cookies didn't work, try the API method
		try {
			const response = await fetch(`${API_BASE_URL}/auth/session`, {
				method: 'GET',
				credentials: 'include', // Important: Include credentials with the request
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			})

			if (!response.ok) {
				// No valid session found through API either
				console.log('No valid website session found via API:', response.status)
				sendResponse({
					success: false,
					hasSession: false,
					error: 'No valid session found',
				})
				return
			}

			// Check content type to avoid parsing HTML as JSON
			const contentType = response.headers.get('content-type')
			if (!contentType || !contentType.includes('application/json')) {
				console.error('Unexpected content type:', contentType)
				sendResponse({
					success: false,
					hasSession: false,
					error: 'Unexpected content type',
				})
				return
			}

			const sessionData = await response.json()

			if (!sessionData.user || !sessionData.token) {
				console.log('Invalid session data:', sessionData)
				sendResponse({
					success: false,
					hasSession: false,
					error: 'Invalid session data',
				})
				return
			}

			// Session found, save it to extension storage
			const authData = {
				token: sessionData.token,
				userId: sessionData.user.id,
				email: sessionData.user.email,
				expiresAt: calculateExpiryDate(sessionData.expiresIn || 86400),
				websiteLinked: true,
				websiteEmail: sessionData.user.email,
			}

			await saveAuthData(authData)

			console.log(
				'Website session found via API and saved to extension:',
				authData
			)
			sendResponse({
				success: true,
				hasSession: true,
				email: sessionData.user.email,
				userId: sessionData.user.id,
				token: sessionData.token,
			})

			// Show a notification
			chrome.notifications.create({
				type: 'basic',
				iconUrl: 'icons/icon-128.png',
				title: 'JobTrakr Authenticated',
				message: `You are now signed in to JobTrakr extension using your website account (${sessionData.user.email})`,
			})
		} catch (apiError) {
			console.error('Error with API session check:', apiError)
			sendResponse({
				success: false,
				hasSession: false,
				error: apiError.message,
			})
		}
	} catch (error) {
		console.error('Error checking website session:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Calculate token expiry date
 * @param {number} expiresIn - Expiry time in seconds
 * @returns {number} - Expiry timestamp in milliseconds
 */
function calculateExpiryDate(expiresIn) {
	return Date.now() + expiresIn * 1000
}

/**
 * Handle direct login with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {Function} sendResponse - Function to send response back
 */
async function handleDirectLogin(email, password, sendResponse) {
	try {
		console.log('Attempting direct login for:', email)

		// First try direct login to Supabase via the API
		const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		})

		if (!loginResponse.ok) {
			// If direct API login fails, try alternate method via authenticated fetch
			console.log('Direct API login failed, status:', loginResponse.status)

			// Try website login using fetch (this will set cookies)
			const webLoginResponse = await fetch(`${WEB_APP_URL}/api/auth/signin`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			})

			if (!webLoginResponse.ok) {
				const errorData = await webLoginResponse.json().catch(() => ({}))
				throw new Error(
					errorData.message || `Login failed: ${webLoginResponse.status}`
				)
			}

			// Now check if we got cookies
			const cookies = await chrome.cookies.getAll({ domain: 'jobtrakr.co.uk' })
			const authCookie = cookies.find(
				(cookie) =>
					cookie.name === 'jobtrakr-auth-token' ||
					cookie.name === 'sb-kffbwemulhhsyaiooabh-auth-token'
			)

			if (!authCookie) {
				throw new Error('No authentication cookie found after login')
			}

			// Use the cookie to get the user info
			const userResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${authCookie.value}`,
					'Content-Type': 'application/json',
				},
			})

			if (!userResponse.ok) {
				throw new Error('Could not verify user session')
			}

			const userData = await userResponse.json()

			// Save auth data
			const authData = {
				token: authCookie.value,
				userId: userData.user.id,
				email: userData.user.email,
				expiresAt: calculateExpiryDate(86400), // 24 hours
				websiteLinked: true,
				websiteEmail: userData.user.email,
			}

			await saveAuthData(authData)

			sendResponse({
				success: true,
				user: userData.user,
				message: 'Login successful via web cookies',
			})

			return
		}

		// Direct API login successful
		const loginData = await loginResponse.json()

		// Save auth data
		const authData = {
			token: loginData.token,
			userId: loginData.userId || loginData.user?.id,
			email: loginData.email || loginData.user?.email,
			expiresAt: calculateExpiryDate(loginData.expiresIn || 86400),
			websiteLinked: true,
			websiteEmail: loginData.email || loginData.user?.email,
		}

		await saveAuthData(authData)

		sendResponse({
			success: true,
			user: {
				id: authData.userId,
				email: authData.email,
			},
			message: 'Login successful via API',
		})
	} catch (error) {
		console.error('Direct login error:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Get auth cookies to share with the website
 * @param {Function} sendResponse - Function to send response back
 */
async function getAuthCookies(sendResponse) {
	try {
		const cookies = await chrome.cookies.getAll({
			domain: 'jobtrakr.co.uk',
		})

		console.log('Found cookies for sharing:', cookies.length)

		// Only share auth-related cookies
		const authCookies = cookies.filter(
			(cookie) =>
				cookie.name === 'jobtrakr-auth-token' ||
				cookie.name === 'sb-kffbwemulhhsyaiooabh-auth-token' ||
				cookie.name.includes('auth') ||
				cookie.name.includes('session') ||
				cookie.name.includes('supabase')
		)

		sendResponse({
			success: true,
			cookies: authCookies,
		})
	} catch (error) {
		console.error('Error getting auth cookies:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Sync auth state with the website
 * @param {string} token - Auth token from website
 * @param {Object} user - User object from website
 * @param {Function} sendResponse - Function to send response back
 */
async function syncAuthStateWithWebsite(token, user, sendResponse) {
	try {
		if (!token || !user) {
			throw new Error('Missing token or user data')
		}

		console.log('Syncing auth state with website for user:', user.email)

		// Create auth data object
		const authData = {
			token: token,
			userId: user.id,
			email: user.email,
			expiresAt: calculateExpiryDate(86400), // 24 hours
			websiteLinked: true,
			websiteEmail: user.email,
		}

		// Save to storage
		await saveAuthData(authData)

		console.log('Auth state synced with website')
		sendResponse({
			success: true,
			message: 'Auth state synced successfully',
		})
	} catch (error) {
		console.error('Error syncing auth state:', error)
		sendResponse({ success: false, error: error.message })
	}
}

/**
 * Check if the extension is authenticated
 * @param {Function} sendResponse - Function to send response back
 */
async function checkExtensionAuth(sendResponse) {
	try {
		const auth = await getAuthToken()

		if (!auth) {
			sendResponse({
				success: true,
				isAuthenticated: false,
			})
			return
		}

		sendResponse({
			success: true,
			isAuthenticated: true,
			user: {
				id: auth.userId,
				email: auth.email || auth.websiteEmail,
			},
		})
	} catch (error) {
		console.error('Error checking extension auth:', error)
		sendResponse({ success: false, error: error.message })
	}
}
