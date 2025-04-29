/**
 * JobTrakr Browser Extension - Background Script
 *
 * This script handles:
 * - Authentication state management
 * - Communication between content scripts and popup
 * - API communication with JobTrakr backend
 */

// Constants
const API_URL = 'https://jobtrakr.co.uk/api'
const WEBAPP_URL = 'https://jobtrakr.co.uk'

// Extension state
let state = {
	isAuthenticated: false,
	userData: null,
	lastSavedJob: null,
	authToken: null,
}

// Initialize when extension is loaded
initializeExtension()

/**
 * Initialize the extension background process
 */
function initializeExtension() {
	console.log('JobTrakr Extension: Background script initialized')

	// Check if user is already authenticated
	checkAuthentication()

	// Setup message listeners
	setupMessageListeners()
}

/**
 * Check if the user is authenticated with JobTrakr
 */
async function checkAuthentication() {
	try {
		// Check if we have an auth token in storage
		const data = await chrome.storage.local.get(['authToken', 'userData'])

		if (data.authToken) {
			// Validate token with the API
			const response = await fetch(`${API_URL}/auth/validate`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${data.authToken}`,
					'Content-Type': 'application/json',
				},
			})

			if (response.ok) {
				// Token is valid
				state.isAuthenticated = true
				state.authToken = data.authToken
				state.userData = data.userData || (await response.json()).user

				// Save user data to storage if it wasn't there
				if (!data.userData) {
					chrome.storage.local.set({ userData: state.userData })
				}

				console.log('JobTrakr: User is authenticated')
			} else {
				// Token is invalid, clear storage
				clearAuthData()
			}
		} else {
			// No token found
			clearAuthData()
		}
	} catch (error) {
		console.error('JobTrakr: Error checking authentication', error)
		clearAuthData()
	}
}

/**
 * Clear authentication data from state and storage
 */
function clearAuthData() {
	state.isAuthenticated = false
	state.userData = null
	state.authToken = null

	chrome.storage.local.remove(['authToken', 'userData'])
	console.log('JobTrakr: User is not authenticated')
}

/**
 * Setup message listeners for communication with content scripts and popup
 */
function setupMessageListeners() {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log('JobTrakr: Received message', message.action)

		switch (message.action) {
			case 'getAuthStatus':
				handleGetAuthStatus(sendResponse)
				break

			case 'signIn':
				handleSignIn(message.token, message.userData, sendResponse)
				break

			case 'signOut':
				handleSignOut(sendResponse)
				break

			case 'saveJob':
				handleSaveJob(message.jobData, sendResponse)
				break

			case 'getUserStats':
				handleGetUserStats(sendResponse)
				break

			case 'checkCurrentPage':
				handleCheckCurrentPage(sender.tab.id, sendResponse)
				break
		}

		// Return true to indicate we'll send a response asynchronously
		return true
	})
}

/**
 * Handle get authentication status message
 */
function handleGetAuthStatus(sendResponse) {
	sendResponse({
		isAuthenticated: state.isAuthenticated,
		userData: state.userData,
	})
}

/**
 * Handle sign in message
 */
function handleSignIn(token, userData, sendResponse) {
	if (!token) {
		sendResponse({ success: false, error: 'No token provided' })
		return
	}

	// Update state
	state.isAuthenticated = true
	state.authToken = token
	state.userData = userData

	// Save to storage
	chrome.storage.local.set({
		authToken: token,
		userData: userData,
	})

	sendResponse({
		success: true,
		isAuthenticated: true,
		userData: userData,
	})

	console.log('JobTrakr: User signed in', userData.email)
}

/**
 * Handle sign out message
 */
function handleSignOut(sendResponse) {
	// Clear auth data
	clearAuthData()

	sendResponse({
		success: true,
		isAuthenticated: false,
	})

	console.log('JobTrakr: User signed out')
}

/**
 * Handle save job message
 */
async function handleSaveJob(jobData, sendResponse) {
	try {
		if (!state.isAuthenticated || !state.authToken) {
			sendResponse({
				success: false,
				error: 'User not authenticated',
			})
			return
		}

		if (!jobData) {
			sendResponse({
				success: false,
				error: 'No job data provided',
			})
			return
		}

		console.log('JobTrakr: Saving job', jobData.title)

		// Send job data to API
		const response = await fetch(`${API_URL}/jobs`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${state.authToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(jobData),
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Failed to save job')
		}

		const savedJob = await response.json()

		// Update last saved job
		state.lastSavedJob = savedJob

		// Send success response
		sendResponse({
			success: true,
			job: savedJob,
		})

		console.log('JobTrakr: Job saved successfully', savedJob.id)

		// Show notification
		chrome.notifications.create({
			type: 'basic',
			iconUrl: '/icons/icon-128.png',
			title: 'Job Saved to JobTrakr',
			message: `${jobData.title} at ${jobData.company} has been saved to your JobTrakr account.`,
		})
	} catch (error) {
		console.error('JobTrakr: Error saving job', error)

		sendResponse({
			success: false,
			error: error.message || 'Error saving job',
		})
	}
}

/**
 * Handle get user stats message
 */
async function handleGetUserStats(sendResponse) {
	try {
		if (!state.isAuthenticated || !state.authToken) {
			sendResponse({
				success: false,
				error: 'User not authenticated',
			})
			return
		}

		// Get user stats from API
		const response = await fetch(`${API_URL}/users/stats`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${state.authToken}`,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Failed to get user stats')
		}

		const stats = await response.json()

		// Send success response
		sendResponse({
			success: true,
			stats: stats,
		})
	} catch (error) {
		console.error('JobTrakr: Error getting user stats', error)

		sendResponse({
			success: false,
			error: error.message || 'Error getting user stats',
		})
	}
}

/**
 * Handle check current page message
 * Communicates with the content script to check if current page is a job page
 */
function handleCheckCurrentPage(tabId, sendResponse) {
	chrome.tabs.sendMessage(tabId, { action: 'checkJobPage' }, (response) => {
		if (chrome.runtime.lastError) {
			// Content script may not be loaded
			sendResponse({ isJobPage: false })
			return
		}

		if (response && response.isJobPage) {
			sendResponse({
				isJobPage: true,
				jobData: response.jobData,
			})
		} else {
			sendResponse({ isJobPage: false })
		}
	})
}

/**
 * Handle browser action click - open popup
 */
chrome.action.onClicked.addListener((tab) => {
	console.log('JobTrakr: Browser action clicked')
})

/**
 * Listen for tab updates to inject content scripts for supported job sites
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url) {
		const url = tab.url.toLowerCase()

		// Check if the URL matches known job sites
		if (
			url.includes('linkedin.com/jobs') ||
			url.includes('indeed.com') ||
			url.includes('glassdoor.com/job') ||
			url.includes('remoteworker.co.uk/job') ||
			url.includes('monster.com/job') ||
			url.includes('ziprecruiter.com')
		) {
			console.log('JobTrakr: Detected job site:', url)

			// Inject content script if needed (handled by manifest.json)
			// This is here for potential future dynamic script injection
		}
	}
})
