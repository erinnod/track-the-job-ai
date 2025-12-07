/**
 * JobTrakr Browser Extension
 * Background Script
 */

// Configuration - make sure it matches your production environment
const API_BASE_URL = 'https://jobtrakr.co.uk/api' // Production API endpoint
const WEB_APP_URL = 'https://jobtrakr.co.uk' // Production web app URL

// Listen for tab updates to detect successful login on website
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	// Check if this is the redirect after login
	if (
		changeInfo.status === 'complete' &&
		tab.url &&
		tab.url.includes('jobtrakr.co.uk/dashboard') &&
		tab.url.includes('source=extension')
	) {
		console.log(
			'Detected successful login redirect. Syncing session to extension...'
		)

		// Execute script in the tab to extract auth data
		chrome.scripting.executeScript(
			{
				target: { tabId: tabId },
				function: () => {
					// Try to find auth token in localStorage
					const authData =
						localStorage.getItem('supabase.auth.token') ||
						localStorage.getItem('jobtrakr-auth-data')

					// Return any auth data found on the page
					return {
						authData: authData,
						cookies: document.cookie,
					}
				},
			},
			(results) => {
				if (chrome.runtime.lastError) {
					console.error('Error executing script:', chrome.runtime.lastError)
					return
				}

				if (results && results[0] && results[0].result) {
					console.log('Found auth data on webpage, syncing to extension')

					// Try to sync session
					checkWebsiteSession((success) => {
						if (success) {
							// Show a notification
							chrome.notifications.create({
								type: 'basic',
								iconUrl: 'icons/icon-128.png',
								title: 'JobTrakr Authenticated',
								message: 'Successfully signed in to JobTrakr extension',
							})
						}
					})
				}
			}
		)
	}
})

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
 * @param {Function} sendResponse - Function to send response back (optional)
 */
async function checkWebsiteSession(sendResponse) {
	let success = false
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

				// Verify the token by calling the API
				try {
					// First try with fetch to get error details if any
					const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${authToken}`,
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
						credentials: 'include', // Important: Include credentials with the request
					})

					let userData

					// Handle various response types
					if (!verifyResponse.ok) {
						console.error('Failed to verify token:', verifyResponse.status)
						throw new Error(`Failed to verify token: ${verifyResponse.status}`)
					}

					// Check content type to avoid parsing errors
					const contentType = verifyResponse.headers.get('content-type')

					if (contentType && contentType.includes('application/json')) {
						// Parse JSON response
						userData = await verifyResponse.json()
					} else if (contentType && contentType.includes('text/html')) {
						// For HTML responses, we'll try to extract any JSON data embedded in it
						const text = await verifyResponse.text()
						try {
							// Try to find JSON data in HTML response
							const jsonMatch = text.match(/\{.*\}/)
							if (jsonMatch) {
								userData = JSON.parse(jsonMatch[0])
							} else {
								throw new Error('Could not parse JSON from HTML response')
							}
						} catch (parseError) {
							console.error('Error parsing HTML response:', parseError)
							throw new Error('Invalid response format from verify endpoint')
						}
					} else {
						throw new Error(
							`Unexpected content type: ${contentType || 'unknown'}`
						)
					}

					if (!userData || !userData.user) {
						throw new Error('Invalid user data in response')
					}

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
					success = true

					console.log(
						'Website session found via cookies and saved to extension'
					)

					if (typeof sendResponse === 'function') {
						sendResponse({
							success: true,
							hasSession: true,
							email: userData.user.email,
							userId: userData.user.id,
							token: authToken,
						})
					}

					// Show a notification
					chrome.notifications.create({
						type: 'basic',
						iconUrl: 'icons/icon-128.png',
						title: 'JobTrakr Authenticated',
						message: `You are now signed in to JobTrakr extension using your website account (${userData.user.email})`,
					})

					return success
				} catch (verifyError) {
					console.error('Error verifying token:', verifyError)
					// Continue to next method if token verification fails
				}
			}
		} catch (cookieError) {
			console.error('Error checking cookies:', cookieError)
		}

		// If cookies didn't work, try alternate approach with XHR
		// This can sometimes work better than fetch for CORS issues
		try {
			// Create a Promise-based wrapper for XMLHttpRequest
			const sessionData = await new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest()
				xhr.withCredentials = true // Include credentials
				xhr.open('GET', `${API_BASE_URL}/auth/session`, true)
				xhr.setRequestHeader('Content-Type', 'application/json')
				xhr.setRequestHeader('Accept', 'application/json')

				xhr.onload = function () {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							const response = JSON.parse(xhr.responseText)
							resolve(response)
						} catch (e) {
							reject(new Error('Invalid JSON response'))
						}
					} else {
						reject(new Error(`HTTP error: ${xhr.status}`))
					}
				}

				xhr.onerror = function () {
					reject(new Error('Network error'))
				}

				xhr.send()
			})

			if (!sessionData || !sessionData.user || !sessionData.token) {
				throw new Error('Invalid session data from API')
			}

			// Valid session data received, save it
			const authData = {
				token: sessionData.token,
				userId: sessionData.user.id,
				email: sessionData.user.email,
				expiresAt: calculateExpiryDate(sessionData.expiresIn || 86400),
				websiteLinked: true,
				websiteEmail: sessionData.user.email,
			}

			await saveAuthData(authData)
			success = true

			console.log(
				'Website session found via XHR and saved to extension:',
				authData
			)

			if (typeof sendResponse === 'function') {
				sendResponse({
					success: true,
					hasSession: true,
					email: sessionData.user.email,
					userId: sessionData.user.id,
					token: sessionData.token,
				})
			}

			// Show a notification
			chrome.notifications.create({
				type: 'basic',
				iconUrl: 'icons/icon-128.png',
				title: 'JobTrakr Authenticated',
				message: `You are now signed in to JobTrakr extension using your website account (${sessionData.user.email})`,
			})

			return success
		} catch (xhrError) {
			console.error('Error with XHR session check:', xhrError)
		}

		// If both methods failed, return failure
		if (typeof sendResponse === 'function') {
			sendResponse({
				success: false,
				hasSession: false,
				error: 'No valid session found',
			})
		}

		return success
	} catch (error) {
		console.error('Error checking website session:', error)
		if (typeof sendResponse === 'function') {
			sendResponse({ success: false, error: error.message })
		}
		return false
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
				Accept: 'application/json',
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
					Accept: 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			})

			// Check content type of response
			const contentType = webLoginResponse.headers.get('content-type')
			if (contentType && contentType.includes('text/html')) {
				console.log(
					'Received HTML response instead of JSON, trying cookie approach'
				)
			}

			if (!webLoginResponse.ok) {
				// Try to parse response data, but handle case where it's not JSON
				let errorMessage = `Login failed: ${webLoginResponse.status}`
				try {
					const errorData = await webLoginResponse.json()
					if (errorData.message) {
						errorMessage = errorData.message
					}
				} catch (err) {
					console.error('Error parsing login response:', err)
				}
				throw new Error(errorMessage)
			}

			// Now check if we got cookies
			const cookies = await chrome.cookies.getAll({ domain: 'jobtrakr.co.uk' })
			const authCookie = cookies.find(
				(cookie) =>
					cookie.name === 'jobtrakr-auth-token' ||
					cookie.name === 'sb-kffbwemulhhsyaiooabh-auth-token' ||
					cookie.name.includes('auth') ||
					cookie.name.includes('session') ||
					cookie.name.includes('supabase')
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
					Accept: 'application/json',
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
