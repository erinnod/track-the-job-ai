/**
 * JobTrakr Extension Popup Script
 */

// Constants
const API_URL = 'https://jobtrakr.co.uk/api'
const WEB_APP_URL = 'https://jobtrakr.co.uk'

// DOM Elements
const elements = {
	statusIndicator: document.getElementById('status-indicator'),
	notification: document.getElementById('notification'),
	notificationMessage: document.getElementById('notification-message'),
	closeNotification: document.getElementById('close-notification'),

	// Views
	unauthenticatedView: document.getElementById('unauthenticated-view'),
	authenticatedView: document.getElementById('authenticated-view'),
	jobDetectionSection: document.getElementById('job-detection-section'),
	notJobPageSection: document.getElementById('not-job-page-section'),

	// Account info
	userEmail: document.getElementById('user-email'),
	jobsCount: document.getElementById('jobs-count'),

	// Job details
	jobTitle: document.getElementById('job-title'),
	jobCompany: document.getElementById('job-company'),
	jobLocation: document.getElementById('job-location'),

	// Buttons
	signInButton: document.getElementById('sign-in-button'),
	signOutButton: document.getElementById('sign-out-button'),
	saveJobButton: document.getElementById('save-job-button'),
	viewDashboardButton: document.getElementById('view-dashboard-button'),
}

// App state
let state = {
	isAuthenticated: false,
	user: null,
	currentJob: null,
	isOnJobPage: false,
}

/**
 * Initialize the popup
 */
function init() {
	console.log('Initializing JobTrakr extension popup...')

	// Check if user is authenticated
	checkAuthStatus()

	// Setup event listeners
	setupEventListeners()

	// Check if we're on a job page
	checkCurrentPage()
}

/**
 * Setup event listeners for all interactive elements
 */
function setupEventListeners() {
	// Sign in button
	elements.signInButton.addEventListener('click', () => {
		signIn()
	})

	// Sign out button
	elements.signOutButton.addEventListener('click', () => {
		signOut()
	})

	// Save job button
	elements.saveJobButton.addEventListener('click', () => {
		saveCurrentJob()
	})

	// View dashboard button
	elements.viewDashboardButton.addEventListener('click', () => {
		openDashboard()
	})

	// Close notification button
	elements.closeNotification.addEventListener('click', () => {
		hideNotification()
	})

	// Add a manual refresh button event listener
	document.addEventListener('click', function (e) {
		if (e.target && e.target.id === 'refresh-status') {
			checkAuthStatus()
			showNotification('Refreshing login status...', 'info')
		}
	})
}

/**
 * Check if the user is authenticated
 */
function checkAuthStatus() {
	console.log('Checking authentication status...')
	chrome.storage.local.get(['auth'], (result) => {
		console.log('Auth storage result:', result)
		if (result.auth && isTokenValid(result.auth)) {
			// User is authenticated
			console.log(
				'Valid auth token found:',
				result.auth.email || result.auth.websiteEmail
			)
			state.isAuthenticated = true
			state.user = {
				email: result.auth.email || result.auth.websiteEmail,
				id: result.auth.userId,
			}

			updateAuthUI()
			fetchUserStats()
		} else {
			// User is not authenticated or token expired
			console.log('No valid auth token found, checking website session')
			state.isAuthenticated = false
			state.user = null

			updateAuthUI()

			// Check if user is logged into the main website
			checkWebsiteSession()
		}
	})
}

/**
 * Check if the user is logged into the main website
 */
function checkWebsiteSession() {
	console.log('Checking website session...')

	// First check if we have a cookie directly accessible
	checkCookiesDirectly((cookieFound) => {
		if (cookieFound) return

		// If no cookie found, try the background service
		chrome.runtime.sendMessage(
			{ action: 'checkWebsiteSession' },
			(response) => {
				console.log('Website session response:', response)

				if (chrome.runtime.lastError) {
					console.error(
						'Error checking website session:',
						chrome.runtime.lastError
					)
					showNotification(
						'Error checking login status: ' + chrome.runtime.lastError.message,
						'error'
					)
					return
				}

				if (!response) {
					console.log('No response from background script')
					showNotification(
						'No response from background script. Try restarting the extension.',
						'error'
					)
					return
				}

				if (response.success && response.hasSession) {
					// User is logged into the website, update UI
					console.log('Website session found:', response.email)
					state.isAuthenticated = true
					state.user = {
						email: response.email,
						id: response.userId,
					}

					// Save auth data to prevent future checks
					const authData = {
						token: response.token || 'temporary-token',
						userId: response.userId,
						email: response.email,
						expiresAt: Date.now() + 86400 * 1000, // 24 hours from now
						websiteLinked: true,
						websiteEmail: response.email,
					}

					// Save to storage
					chrome.storage.local.set({ auth: authData }, () => {
						console.log('Auth data saved to storage:', authData)
						updateAuthUI()
						fetchUserStats()
						showNotification('Connected with your JobTrakr account', 'success')
					})
				} else {
					console.log('No website session found, showing login button')
					// Add a refresh button to the notification
					showNotification(
						'Not logged in. <a href="#" id="refresh-status">Refresh</a> or sign in below.',
						'info'
					)
				}
			}
		)
	})
}

/**
 * Check for cookies directly from popup
 */
function checkCookiesDirectly(callback) {
	console.log('Checking cookies directly...')

	// Only try if we have the cookies permission
	if (chrome.cookies) {
		chrome.cookies.getAll({ domain: 'jobtrakr.co.uk' }, (cookies) => {
			if (chrome.runtime.lastError) {
				console.error('Error getting cookies:', chrome.runtime.lastError)
				callback(false)
				return
			}

			console.log('Found cookies directly:', cookies.length)

			// Look for auth cookies
			const authCookie = cookies.find(
				(cookie) =>
					cookie.name === 'jobtrakr-auth-token' ||
					cookie.name === 'sb-kffbwemulhhsyaiooabh-auth-token' ||
					cookie.name.includes('auth') ||
					cookie.name.includes('session') ||
					cookie.name.includes('supabase')
			)

			if (authCookie) {
				console.log('Found auth cookie directly:', authCookie.name)

				// Verify token through the API
				fetch(`${API_URL}/auth/verify`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${authCookie.value}`,
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				})
					.then((response) => {
						if (!response.ok) throw new Error('Failed to verify token')
						return response.json()
					})
					.then((data) => {
						// Update state and storage
						state.isAuthenticated = true
						state.user = {
							email: data.user.email,
							id: data.user.id,
						}

						const authData = {
							token: authCookie.value,
							userId: data.user.id,
							email: data.user.email,
							expiresAt: Date.now() + 86400 * 1000, // 24 hours
							websiteLinked: true,
							websiteEmail: data.user.email,
						}

						chrome.storage.local.set({ auth: authData }, () => {
							console.log('Auth data saved from direct cookie:', authData)
							updateAuthUI()
							fetchUserStats()
							showNotification(
								'Connected with your JobTrakr account',
								'success'
							)
						})

						callback(true)
					})
					.catch((error) => {
						console.error('Error verifying cookie:', error)
						callback(false)
					})
			} else {
				console.log('No auth cookies found directly')
				callback(false)
			}
		})
	} else {
		console.log('Cookies API not available')
		callback(false)
	}
}

/**
 * Update the UI based on authentication status
 */
function updateAuthUI() {
	if (state.isAuthenticated) {
		// Show authenticated view
		elements.unauthenticatedView.classList.add('hidden')
		elements.authenticatedView.classList.remove('hidden')

		// Update status indicator
		elements.statusIndicator.textContent = 'Connected'
		elements.statusIndicator.classList.add('online')

		// Update user email
		if (state.user && state.user.email) {
			elements.userEmail.textContent = state.user.email
		}

		console.log('UI updated to authenticated state')
	} else {
		// Show unauthenticated view
		elements.unauthenticatedView.classList.remove('hidden')
		elements.authenticatedView.classList.add('hidden')

		// Update status indicator
		elements.statusIndicator.textContent = 'Disconnected'
		elements.statusIndicator.classList.remove('online')

		console.log('UI updated to unauthenticated state')
	}
}

/**
 * Fetch user statistics from the API
 */
function fetchUserStats() {
	if (!state.isAuthenticated) return

	chrome.storage.local.get(['auth'], (result) => {
		if (!result.auth || !result.auth.token) return

		fetch(`${API_URL}/user/stats`, {
			headers: {
				Authorization: `Bearer ${result.auth.token}`,
			},
		})
			.then((response) => {
				if (!response.ok) throw new Error('Failed to fetch user stats')
				return response.json()
			})
			.then((data) => {
				if (data.jobsCount !== undefined) {
					elements.jobsCount.textContent = data.jobsCount
				}
			})
			.catch((error) => {
				console.error('Error fetching user stats:', error)
			})
	})
}

/**
 * Sign in to JobTrakr
 */
function signIn() {
	// Get the extension ID for the callback
	const extensionId = chrome.runtime.id

	// Construct login URL with return parameters
	const loginUrl = `${WEB_APP_URL}/login?source=extension&extension_id=${extensionId}`

	console.log('Opening login URL:', loginUrl)

	// Show notification
	showNotification('Opening login page in new tab...', 'info')

	// Open the login page in a new tab
	chrome.tabs.create({ url: loginUrl })

	// Close the popup
	window.close()
}

/**
 * Sign out from JobTrakr
 */
function signOut() {
	chrome.storage.local.remove(['auth'], () => {
		state.isAuthenticated = false
		state.user = null

		updateAuthUI()
		showNotification('Signed out successfully', 'info')
	})
}

/**
 * Check if the current page is a job listing page
 */
function checkCurrentPage() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (!tabs || tabs.length === 0) return

		const currentTab = tabs[0]

		// Send message to content script to check if we're on a job page
		chrome.tabs.sendMessage(
			currentTab.id,
			{ action: 'checkJobPage' },
			(response) => {
				// Handle error if content script is not available
				if (chrome.runtime.lastError) {
					console.log('Content script not available or not a job page')
					state.isOnJobPage = false
					updateJobPageUI()
					return
				}

				if (response && response.isJobPage) {
					state.isOnJobPage = true
					state.currentJob = response.jobData
					updateJobPageUI()
				} else {
					state.isOnJobPage = false
					updateJobPageUI()
				}
			}
		)
	})
}

/**
 * Update the UI based on whether we're on a job page
 */
function updateJobPageUI() {
	if (state.isAuthenticated) {
		if (state.isOnJobPage && state.currentJob) {
			// Show job detection section
			elements.jobDetectionSection.classList.remove('hidden')
			elements.notJobPageSection.classList.add('hidden')

			// Update job details
			elements.jobTitle.textContent =
				state.currentJob.title || 'Unknown position'
			elements.jobCompany.textContent =
				state.currentJob.company || 'Unknown company'
			elements.jobLocation.textContent =
				state.currentJob.location || 'Unknown location'
		} else {
			// Show not on job page message
			elements.jobDetectionSection.classList.add('hidden')
			elements.notJobPageSection.classList.remove('hidden')
		}
	}
}

/**
 * Save the current job to JobTrakr
 */
function saveCurrentJob() {
	if (!state.isAuthenticated) {
		showNotification('Please sign in to save jobs', 'error')
		return
	}

	if (!state.isOnJobPage || !state.currentJob) {
		showNotification('No job detected on this page', 'error')
		return
	}

	// Disable save button and show loading state
	elements.saveJobButton.disabled = true
	elements.saveJobButton.textContent = 'Saving...'

	// Send message to background script to save the job
	chrome.runtime.sendMessage(
		{
			action: 'saveJob',
			jobData: state.currentJob,
		},
		(response) => {
			// Re-enable save button
			elements.saveJobButton.disabled = false
			elements.saveJobButton.textContent = 'Save to JobTrakr'

			if (response && response.success) {
				// Job saved successfully
				showNotification('Job saved successfully!', 'success')
				fetchUserStats() // Refresh job count
			} else {
				// Error saving job
				const errorMessage =
					response && response.error ? response.error : 'Failed to save job'

				showNotification(errorMessage, 'error')

				// If auth required, prompt user to sign in
				if (response && response.requiresAuth) {
					setTimeout(() => {
						signIn()
					}, 1500)
				}
			}
		}
	)
}

/**
 * Open the JobTrakr dashboard
 */
function openDashboard() {
	chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` })
	window.close()
}

/**
 * Show a notification to the user
 * @param {string} message - The message to show
 * @param {string} type - The type of notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
	elements.notificationMessage.innerHTML = message
	elements.notification.className = `notification ${type}`
	elements.notification.classList.remove('hidden')

	// Auto-hide after 5 seconds for success and info messages
	if (type !== 'error') {
		setTimeout(() => {
			hideNotification()
		}, 5000)
	}
}

/**
 * Hide the notification
 */
function hideNotification() {
	elements.notification.classList.add('hidden')
}

/**
 * Check if the authentication token is valid
 * @param {Object} auth - The auth object from storage
 * @returns {boolean} - Whether the token is valid
 */
function isTokenValid(auth) {
	if (!auth || !auth.token || !auth.expiresAt) {
		return false
	}

	const now = new Date().getTime()
	const expiresAt = new Date(auth.expiresAt).getTime()

	// Token is valid if it expires in the future
	return expiresAt > now
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', init)
