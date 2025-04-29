/**
 * JobTrakr Extension - LinkedIn Integration
 * This script runs on LinkedIn job pages to detect and extract job data
 */

// Initialize when the page is loaded
document.addEventListener('DOMContentLoaded', init)

// Global state
let state = {
	jobDetected: false,
	buttonAdded: false,
	jobData: null,
}

/**
 * Initialize the content script
 */
function init() {
	console.log('JobTrakr Extension: LinkedIn content script initialized')

	// Check if we're on a job page
	if (isJobDetailPage()) {
		// Add button after job details have fully loaded
		waitForJobDetails().then(() => {
			addSaveButton()
			extractJobData()
		})
	}

	// Listen for messages from popup
	setupMessageListeners()

	// Monitor DOM changes for SPA navigation
	observePageChanges()
}

/**
 * Check if the current page is a LinkedIn job detail page
 */
function isJobDetailPage() {
	const url = window.location.href
	return (
		url.includes('linkedin.com/jobs/view/') ||
		url.includes('linkedin.com/jobs/collections/') ||
		(url.includes('linkedin.com/jobs/search/') &&
			document.querySelector('.jobs-search__job-details'))
	)
}

/**
 * Wait for job details to be fully loaded
 */
function waitForJobDetails() {
	return new Promise((resolve) => {
		// Check if job title is already available
		if (document.querySelector('.jobs-unified-top-card__job-title')) {
			resolve()
			return
		}

		// If not, wait for it to become available
		const observer = new MutationObserver((mutations, obs) => {
			if (document.querySelector('.jobs-unified-top-card__job-title')) {
				obs.disconnect()
				resolve()
			}
		})

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})

		// Resolve after 5 seconds even if elements aren't found
		setTimeout(() => {
			observer.disconnect()
			resolve()
		}, 5000)
	})
}

/**
 * Add "Save to JobTrakr" button next to Apply button
 */
function addSaveButton() {
	// Avoid adding button multiple times
	if (state.buttonAdded || document.getElementById('jobtrakr-save-button')) {
		return
	}

	// Find the actions container
	const actionsContainer = document.querySelector(
		'.jobs-unified-top-card__actions'
	)
	if (!actionsContainer) {
		console.log('JobTrakr: Actions container not found')
		return
	}

	// Create save button
	const saveButton = document.createElement('button')
	saveButton.id = 'jobtrakr-save-button'
	saveButton.className = 'jobtrakr-button'
	saveButton.textContent = 'Save to JobTrakr'
	saveButton.style.cssText = `
    background-color: #0077b5;
    color: white;
    border: none;
    border-radius: 24px;
    padding: 8px 16px;
    margin-left: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  `

	// Add hover effect
	saveButton.addEventListener('mouseover', () => {
		saveButton.style.backgroundColor = '#006097'
	})

	saveButton.addEventListener('mouseout', () => {
		saveButton.style.backgroundColor = '#0077b5'
	})

	// Add click event
	saveButton.addEventListener('click', () => {
		saveToJobTrakr()
	})

	// Insert button into the DOM
	actionsContainer.appendChild(saveButton)

	state.buttonAdded = true
	console.log('JobTrakr: Save button added to page')
}

/**
 * Extract job data from the page
 */
function extractJobData() {
	try {
		// Job title
		const titleElement = document.querySelector(
			'.jobs-unified-top-card__job-title'
		)
		const title = titleElement ? titleElement.textContent.trim() : ''

		// Company
		const companyElement = document.querySelector(
			'.jobs-unified-top-card__company-name'
		)
		const company = companyElement ? companyElement.textContent.trim() : ''

		// Location
		const locationElement = document.querySelector(
			'.jobs-unified-top-card__bullet'
		)
		const location = locationElement ? locationElement.textContent.trim() : ''

		// Job type (full-time, part-time, etc)
		const jobTypeElements = document.querySelectorAll(
			'.jobs-unified-top-card__job-insight'
		)
		let jobType = ''

		jobTypeElements.forEach((element) => {
			const text = element.textContent.trim()
			if (text.includes('Employment type')) {
				jobType = text.replace('Employment type', '').trim()
			}
		})

		// Salary
		let salary = ''
		jobTypeElements.forEach((element) => {
			const text = element.textContent.trim()
			if (
				text.includes('$') ||
				text.includes('£') ||
				text.includes('€') ||
				text.includes('Salary') ||
				text.includes('compensation')
			) {
				salary = text.replace('Salary range', '').trim()
			}
		})

		// Description
		const descriptionElement = document.querySelector(
			'.jobs-description-content__text'
		)
		const description = descriptionElement
			? descriptionElement.textContent.trim()
			: ''

		// Application URL
		const applicationUrl = window.location.href

		// Skills
		const skillElements = document.querySelectorAll(
			'.jobs-description__content ul li'
		)
		const skills = Array.from(skillElements)
			.map((el) => el.textContent.trim())
			.filter((text) => text.length > 0 && text.length < 50) // Basic filter for likely skills
			.slice(0, 10) // Take max 10 skills

		// Posted date
		const postedDateElement = document.querySelector(
			'.jobs-unified-top-card__posted-date, .jobs-unified-top-card__subtitle-secondary-grouping span'
		)
		let postedDate = ''

		if (postedDateElement) {
			const postedText = postedDateElement.textContent.trim()
			// Extract things like "2 days ago", "1 week ago" etc.
			if (postedText.includes('ago')) {
				postedDate = postedText
			}
		}

		// Construct job data object
		const jobData = {
			title,
			company,
			location,
			jobType,
			salary,
			description,
			applicationUrl,
			skills: skills.join(', '),
			postedDate,
			source: 'linkedin',
			sourceId: extractJobIdFromUrl(applicationUrl),
		}

		state.jobData = jobData
		state.jobDetected = true

		console.log('JobTrakr: Extracted job data', jobData)
		return jobData
	} catch (error) {
		console.error('JobTrakr: Error extracting job data', error)
		return null
	}
}

/**
 * Extract LinkedIn job ID from URL
 */
function extractJobIdFromUrl(url) {
	const matches = url.match(/view\/([0-9]+)/)
	return matches && matches[1] ? matches[1] : ''
}

/**
 * Save current job to JobTrakr
 */
function saveToJobTrakr() {
	const saveButton = document.getElementById('jobtrakr-save-button')

	if (saveButton) {
		// Update button state
		saveButton.textContent = 'Saving...'
		saveButton.disabled = true
	}

	// Make sure we have job data
	if (!state.jobData) {
		state.jobData = extractJobData()
	}

	if (!state.jobData) {
		console.error('JobTrakr: No job data to save')
		if (saveButton) {
			saveButton.textContent = 'Error - Try Again'
			saveButton.disabled = false
		}
		return
	}

	// Send job data to background script
	chrome.runtime.sendMessage(
		{
			action: 'saveJob',
			jobData: state.jobData,
		},
		(response) => {
			if (saveButton) {
				if (response && response.success) {
					// Success
					saveButton.textContent = 'Saved ✓'
					saveButton.style.backgroundColor = '#36B37E'

					// Reset after 3 seconds
					setTimeout(() => {
						saveButton.textContent = 'Save to JobTrakr'
						saveButton.style.backgroundColor = '#0077b5'
						saveButton.disabled = false
					}, 3000)
				} else {
					// Error
					saveButton.textContent = 'Error - Try Again'
					saveButton.style.backgroundColor = '#D73A49'
					saveButton.disabled = false

					// Show error in console
					console.error(
						'JobTrakr: Error saving job',
						response ? response.error : 'Unknown error'
					)
				}
			}
		}
	)
}

/**
 * Setup message listeners for communication with popup
 */
function setupMessageListeners() {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === 'checkJobPage') {
			if (isJobDetailPage()) {
				// Make sure we have job data
				if (!state.jobData) {
					extractJobData()
				}

				sendResponse({
					isJobPage: true,
					jobData: state.jobData,
				})
			} else {
				sendResponse({
					isJobPage: false,
				})
			}
			return true // Keep the message channel open for asynchronous response
		}
	})
}

/**
 * Observe page changes for single page application navigation
 */
function observePageChanges() {
	// Reset state when URL changes
	let lastUrl = window.location.href

	// Check for URL changes
	const urlObserver = setInterval(() => {
		if (lastUrl !== window.location.href) {
			lastUrl = window.location.href
			console.log('JobTrakr: URL changed, checking if job page')

			// Reset state
			state.jobDetected = false
			state.buttonAdded = false
			state.jobData = null

			// Check if we're on a job page
			if (isJobDetailPage()) {
				waitForJobDetails().then(() => {
					addSaveButton()
					extractJobData()
				})
			}
		}
	}, 1000)
}
