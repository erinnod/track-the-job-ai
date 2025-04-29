/**
 * Common functionality for all content scripts
 */

// Create and show the save button on job pages
function showSaveButton(jobData) {
	// Check if button already exists
	if (document.getElementById('jobtrakr-save-button')) {
		return
	}

	// Create the button container
	const buttonContainer = document.createElement('div')
	buttonContainer.id = 'jobtrakr-button-container'
	buttonContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `

	// Create the save button
	const saveButton = document.createElement('button')
	saveButton.id = 'jobtrakr-save-button'
	saveButton.textContent = 'Save to JobTrakr'
	saveButton.style.cssText = `
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    margin-bottom: 8px;
  `

	saveButton.addEventListener('mouseover', () => {
		saveButton.style.backgroundColor = '#3730A3'
	})

	saveButton.addEventListener('mouseout', () => {
		saveButton.style.backgroundColor = '#4F46E5'
	})

	// Handle click event
	saveButton.addEventListener('click', () => {
		// Show saving state
		saveButton.textContent = 'Saving...'
		saveButton.disabled = true
		saveButton.style.opacity = '0.7'

		// Send message to background script
		chrome.runtime.sendMessage(
			{
				action: 'saveJob',
				jobData,
			},
			(response) => {
				if (response && response.success) {
					showNotification('Job saved successfully!', 'success')
					saveButton.textContent = 'Saved ✓'
					saveButton.style.backgroundColor = '#10B981'
				} else {
					showNotification(
						response?.message || 'Error saving job. Please try again.',
						'error'
					)
					saveButton.textContent = 'Save to JobTrakr'
					saveButton.disabled = false
					saveButton.style.opacity = '1'
				}
			}
		)
	})

	// Add button to container
	buttonContainer.appendChild(saveButton)

	// Create a notification div
	const notification = document.createElement('div')
	notification.id = 'jobtrakr-notification'
	notification.style.cssText = `
    background-color: #10B981;
    color: white;
    border-radius: 4px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 8px;
    display: none;
  `
	buttonContainer.appendChild(notification)

	// Add container to page
	document.body.appendChild(buttonContainer)
}

// Show a notification
function showNotification(message, type = 'success') {
	const notification = document.getElementById('jobtrakr-notification')
	if (!notification) return

	notification.textContent = message
	notification.style.backgroundColor =
		type === 'success' ? '#10B981' : '#EF4444'
	notification.style.display = 'block'

	// Hide after 3 seconds
	setTimeout(() => {
		notification.style.display = 'none'
	}, 3000)
}

// Initialize content script - call this from each job site's content script
function initContentScript() {
	// Check if we're on the JobTrakr website
	if (window.location.hostname.includes('jobtrakr.co.uk')) {
		// We're on the JobTrakr website - set up communication with the extension
		setupWebsiteToExtensionCommunication()
	} else {
		// We're on a job site - check if we need to sync login state
		syncLoginState()
	}
}

// Set up communication from website to extension
function setupWebsiteToExtensionCommunication() {
	console.log('Setting up website-to-extension communication')

	// Listen for login/logout events from the website
	document.addEventListener('jobtrakr-auth-changed', function (event) {
		console.log('Auth event from website:', event.detail)

		if (
			event.detail &&
			event.detail.action === 'login' &&
			event.detail.token &&
			event.detail.user
		) {
			// User logged in on website, sync to extension
			const extensionId = new URLSearchParams(window.location.search).get(
				'extension_id'
			)

			if (extensionId) {
				console.log('Syncing login to extension:', extensionId)

				// Send message to extension background script
				try {
					chrome.runtime.sendMessage(
						extensionId,
						{
							action: 'syncAuthState',
							token: event.detail.token,
							user: event.detail.user,
						},
						(response) => {
							// Check for runtime error
							if (chrome.runtime.lastError) {
								console.error(
									'Error syncing with extension:',
									chrome.runtime.lastError
								)
								return
							}

							console.log('Extension sync response:', response)
							if (response && response.success) {
								console.log('Successfully synced auth state with extension')
							}
						}
					)
				} catch (error) {
					console.error('Error sending message to extension:', error)
				}
			}
		} else if (event.detail && event.detail.action === 'logout') {
			// User logged out on website, could sync logout to extension
			console.log('User logged out of website')
		}
	})

	// Add a global function for the website to call
	window.syncWithExtension = function (data) {
		console.log('Website called syncWithExtension:', data)

		const extensionId = new URLSearchParams(window.location.search).get(
			'extension_id'
		)

		if (extensionId && data && data.token && data.user) {
			chrome.runtime.sendMessage(
				extensionId,
				{
					action: 'syncAuthState',
					token: data.token,
					user: data.user,
				},
				(response) => {
					console.log('Extension sync response:', response)
					return response
				}
			)
		}
	}

	// Notify the website that the extension is ready
	const event = new CustomEvent('jobtrakr-extension-loaded', {
		detail: { extensionId: chrome.runtime.id },
	})
	document.dispatchEvent(event)
}

// Sync login state from website to extension when on job sites
function syncLoginState() {
	console.log('Checking for login sync on job site')

	// Check cookies or other data to see if we need to sync
	chrome.runtime.sendMessage({ action: 'checkWebsiteSession' }, (response) => {
		console.log('Website session check response:', response)
	})
}

// Extract skills and keywords from a job description
function extractSkills(description) {
	if (!description) return []

	// Common technical skills to look for
	const commonSkills = [
		// Programming Languages
		'JavaScript',
		'TypeScript',
		'Python',
		'Java',
		'C#',
		'C++',
		'Ruby',
		'PHP',
		'Swift',
		'Kotlin',
		'Go',
		'Rust',
		'Scala',
		'Perl',
		'R',
		'MATLAB',
		'Objective-C',
		'Dart',
		'Groovy',
		'Bash',

		// Web Technologies
		'HTML',
		'CSS',
		'SASS',
		'LESS',
		'React',
		'Angular',
		'Vue',
		'Node.js',
		'Express',
		'Next.js',
		'Gatsby',
		'Redux',
		'jQuery',
		'Bootstrap',
		'Tailwind',
		'Material-UI',
		'Webpack',
		'Babel',
		'REST API',
		'GraphQL',
		'JSON',
		'XML',
		'JWT',
		'OAuth',

		// Databases
		'SQL',
		'MySQL',
		'PostgreSQL',
		'MongoDB',
		'Firebase',
		'DynamoDB',
		'Cassandra',
		'Redis',
		'Elasticsearch',
		'Oracle',
		'SQLite',
		'MariaDB',
		'Neo4j',
		'Supabase',

		// Cloud & DevOps
		'AWS',
		'Azure',
		'GCP',
		'Docker',
		'Kubernetes',
		'CI/CD',
		'Jenkins',
		'GitHub Actions',
		'Terraform',
		'Ansible',
		'Prometheus',
		'Grafana',
		'Nginx',
		'Apache',
		'Serverless',

		// AI & Data Science
		'Machine Learning',
		'Deep Learning',
		'AI',
		'TensorFlow',
		'PyTorch',
		'Keras',
		'Pandas',
		'NumPy',
		'SciPy',
		'Scikit-learn',
		'NLP',
		'Computer Vision',
		'Data Mining',
		'Big Data',
		'Hadoop',
		'Spark',
		'Tableau',
		'Power BI',
		'Data Visualization',

		// Mobile
		'iOS',
		'Android',
		'React Native',
		'Flutter',
		'Xamarin',
		'SwiftUI',
		'Jetpack Compose',

		// Tools & Others
		'Git',
		'GitHub',
		'GitLab',
		'Jira',
		'Confluence',
		'Agile',
		'Scrum',
		'Kanban',
		'Slack',
		'Figma',
		'Adobe XD',
		'Photoshop',
		'Illustrator',
		'InVision',
		'Sketch',

		// Soft Skills
		'Communication',
		'Teamwork',
		'Problem Solving',
		'Critical Thinking',
		'Leadership',
		'Time Management',
		'Adaptability',
		'Creativity',
		'Attention to Detail',
	]

	// Extract skills from the description
	const foundSkills = []
	commonSkills.forEach((skill) => {
		// Look for skills as whole words (not part of other words)
		const regex = new RegExp(
			'\\b' + skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
			'i'
		)
		if (regex.test(description)) {
			foundSkills.push(skill)
		}
	})

	return foundSkills
}

// Utility to clean text (remove extra whitespace, etc.)
function cleanText(text) {
	if (!text) return ''
	return text.replace(/\s+/g, ' ').trim()
}
