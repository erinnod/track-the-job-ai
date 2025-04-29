/**
 * JobTrakr - Indeed Content Script
 * This script runs on Indeed job pages to extract job data and add a "Save to JobTrakr" button.
 */

// Wait for page to load and then initialize
document.addEventListener('DOMContentLoaded', init)

/**
 * Initialize content script
 */
function init() {
	console.log('JobTrakr Extension: Indeed content script initialized')

	// Initialize login state sync
	initContentScript()

	// Extract job information and add save button
	extractJobInfoAndAddButton()

	// Monitor URL changes (Indeed is a single-page app)
	monitorUrlChanges()
}

// Initialize once page is loaded
function initOnLoad() {
	if (isJobDetailPage()) {
		initJobDetailPage()
	}
}

// Check if we're on a job detail page
function isJobDetailPage() {
	return (
		window.location.href.includes('/viewjob') ||
		window.location.href.includes('/job/')
	)
}

// Initialize for job detail page
function initJobDetailPage() {
	// Listen for messages from popup
	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.action === 'checkJobPage') {
			const jobData = extractJobData()
			sendResponse({
				isJobPage: true,
				jobData: jobData,
			})
		}
		return true // Indicates async response
	})

	// Add save button after a short delay to ensure page is fully loaded
	setTimeout(addSaveButton, 1000)
}

// Extract job data from the page
function extractJobData() {
	const jobData = {
		title: '',
		company: '',
		location: '',
		jobType: '',
		description: '',
		jobUrl: window.location.href,
		salary: '',
		postedDate: '',
		source: 'Indeed',
		skills: [],
	}

	try {
		// Extract job title
		const titleElement = document.querySelector(
			'h1.jobsearch-JobInfoHeader-title'
		)
		if (titleElement) {
			jobData.title = titleElement.textContent.trim()
		}

		// Extract company name
		const companyElement = document.querySelector('[data-company-name="true"]')
		if (companyElement) {
			jobData.company = companyElement.textContent.trim()
		}

		// Extract location
		const locationElement = document.querySelector(
			'[data-testid="job-location"]'
		)
		if (locationElement) {
			jobData.location = locationElement.textContent.trim()
		}

		// Extract job type
		const jobMetadataElements = document.querySelectorAll(
			'.jobsearch-JobMetadataHeader-item'
		)
		jobMetadataElements.forEach((el) => {
			if (
				el.textContent.includes('Full-time') ||
				el.textContent.includes('Part-time') ||
				el.textContent.includes('Contract') ||
				el.textContent.includes('Temporary')
			) {
				jobData.jobType = el.textContent.trim()
			}
		})

		// Extract salary if available
		const salaryElement = document.querySelector(
			'[data-testid="attribute_snippet_compensation"]'
		)
		if (salaryElement) {
			jobData.salary = salaryElement.textContent.trim()
		}

		// Extract posted date
		const dateElement = document.querySelector('[data-testid="job-age"]')
		if (dateElement) {
			jobData.postedDate = dateElement.textContent.replace('Posted', '').trim()
		}

		// Extract job description
		const descriptionElement = document.querySelector('#jobDescriptionText')
		if (descriptionElement) {
			jobData.description = descriptionElement.innerText.trim()
		}

		// Extract skills - Indeed doesn't always have a clear skills section,
		// but we can try to extract common skills from the job description
		const skillsRegex =
			/(?:skills|requirements|qualifications)(?:\s*\:|\s*\;|\s*required|\s*include|\s*needed)(?:\s*\:\s*|\s+)([\s\S]*?)(?:\n\n|\.\s+[A-Z])/i
		const descriptionMatch = jobData.description.match(skillsRegex)

		if (descriptionMatch && descriptionMatch[1]) {
			const skillsText = descriptionMatch[1]
			// Split by bullets, commas, or periods
			const skillsList = skillsText
				.split(/[•·\-\,\.\n]+/)
				.map((s) => s.trim())
				.filter((s) => s.length > 2 && s.length < 50)
			jobData.skills = skillsList.slice(0, 10) // Limit to 10 skills
		}
	} catch (error) {
		console.error('Error extracting job data:', error)
	}

	return jobData
}

// Add a "Save to JobTrakr" button to the page
function addSaveButton() {
	// Check if button already exists
	if (document.querySelector('#jobtrakr-save-button')) {
		return
	}

	// Find the apply button container to position our button
	const applyButtonContainer = document.querySelector(
		'[data-testid="jobActionsContainer"]'
	)

	if (!applyButtonContainer) {
		console.error('Could not find a container for the JobTrakr button')
		return
	}

	// Create our button
	const saveButton = document.createElement('button')
	saveButton.id = 'jobtrakr-save-button'
	saveButton.textContent = 'Save to JobTrakr'
	saveButton.style.cssText = `
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    margin-top: 12px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    transition: background-color 0.2s;
  `

	// Add hover effect
	saveButton.addEventListener('mouseover', () => {
		saveButton.style.backgroundColor = '#3a5ce7'
	})

	saveButton.addEventListener('mouseout', () => {
		saveButton.style.backgroundColor = '#4a6cf7'
	})

	// Add click handler
	saveButton.addEventListener('click', handleSaveButtonClick)

	// Add button to the page
	applyButtonContainer.appendChild(saveButton)
}

// Handle save button click
function handleSaveButtonClick() {
	const button = document.getElementById('jobtrakr-save-button')

	// Update button state
	button.textContent = 'Saving...'
	button.style.backgroundColor = '#999'
	button.disabled = true

	// Extract job data
	const jobData = extractJobData()

	// Send message to background script to save the job
	chrome.runtime.sendMessage({ action: 'saveJob', jobData }, (response) => {
		if (response && response.success) {
			button.textContent = '✓ Saved to JobTrakr'
			button.style.backgroundColor = '#4CAF50'
		} else {
			button.textContent = 'Error - Try Again'
			button.style.backgroundColor = '#f44336'
			button.disabled = false

			// Reset after 3 seconds
			setTimeout(() => {
				button.textContent = 'Save to JobTrakr'
				button.style.backgroundColor = '#4a6cf7'
			}, 3000)
		}
	})
}

// Start the script
init()
