/**
 * Shared utility functions for JobTrakr extension content scripts
 */

/**
 * Helper to get text content from an element
 * @param {string} selector - CSS selector
 * @returns {string} - Text content or empty string
 */
function getTextContent(selector) {
  const element = document.querySelector(selector);
  return element ? element.textContent.trim() : "";
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector to wait for
 * @param {number} timeout - Max time to wait in ms
 * @returns {Promise<Element>} - The found element
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Set timeout
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Create a button to save job to JobTrakr
 * @param {string} text - Button text
 * @param {Function} clickHandler - Button click handler
 */
function createActionButton(text, clickHandler) {
  // Check if button already exists
  if (document.querySelector("#jobtrakr-save-button")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "jobtrakr-save-button";
  button.textContent = text;
  button.className = "jobtrakr-button";

  // Style the button
  button.style.backgroundColor = "#4a86e8";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "4px";
  button.style.padding = "8px 16px";
  button.style.margin = "10px 0";
  button.style.cursor = "pointer";
  button.style.fontWeight = "bold";
  button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

  // Add hover effect
  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#3a76d8";
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "#4a86e8";
  });

  // Add click handler
  button.addEventListener("click", clickHandler);

  // Find an appropriate position to insert the button
  insertButtonIntoPage(button);
}

/**
 * Try to find an appropriate position to insert the button based on the site
 * @param {HTMLElement} button - The button to insert
 */
function insertButtonIntoPage(button) {
  const host = window.location.host;

  if (host.includes("linkedin.com")) {
    // LinkedIn placement
    const targetElement =
      document.querySelector(".jobs-unified-top-card__content--two-pane") ||
      document.querySelector(".jobs-unified-top-card__content");

    if (targetElement) {
      targetElement.appendChild(button);
    }
  } else if (host.includes("indeed.com")) {
    // Indeed placement
    const targetElement =
      document.querySelector(".jobsearch-CompanyInfoContainer") ||
      document.querySelector(".jobsearch-JobMetadataFooter") ||
      document.querySelector(".jobsearch-ViewJobLayout-jobDisplay");

    if (targetElement) {
      targetElement.parentNode.insertBefore(button, targetElement.nextSibling);
    }
  } else {
    // Generic fallback
    const jobHeader =
      document.querySelector("header") || document.querySelector("h1");

    if (jobHeader) {
      jobHeader.parentNode.insertBefore(button, jobHeader.nextSibling);
    } else {
      // Last resort: append to body with fixed positioning
      button.style.position = "fixed";
      button.style.top = "10px";
      button.style.right = "10px";
      button.style.zIndex = "9999";
      document.body.appendChild(button);
    }
  }
}

/**
 * Show a notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error)
 */
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = `jobtrakr-notification jobtrakr-notification-${type}`;

  // Style the notification
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "4px";
  notification.style.zIndex = "9999";
  notification.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  notification.style.maxWidth = "300px";

  if (type === "success") {
    notification.style.backgroundColor = "#4CAF50";
    notification.style.color = "white";
  } else if (type === "error") {
    notification.style.backgroundColor = "#F44336";
    notification.style.color = "white";
  } else {
    notification.style.backgroundColor = "#2196F3";
    notification.style.color = "white";
  }

  // Add to document
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

/**
 * Send message to background script
 * @param {Object} message - Message to send
 * @returns {Promise<any>} - Response from background script
 */
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Extract common skills from text based on a predefined list
 * @param {string} text - Text to extract skills from
 * @returns {string[]} - Array of found skills
 */
function extractCommonSkills(text) {
  // Remove HTML tags if present and normalize text
  const cleanText = text.replace(/<[^>]*>/g, " ").toLowerCase();

  // Common tech skills to look for
  const skillKeywords = [
    "JavaScript",
    "React",
    "Angular",
    "Vue",
    "Python",
    "Java",
    "C#",
    "PHP",
    "Ruby",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "SQL",
    "NoSQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Git",
    "Agile",
    "Scrum",
    "DevOps",
    "TypeScript",
    "HTML",
    "CSS",
    "SCSS",
    "Sass",
    "Redux",
    "GraphQL",
    "REST",
    "API",
    "CI/CD",
    "Linux",
    "Bash",
    "Swift",
    "Kotlin",
    "Go",
    "Rust",
    "C++",
    "TensorFlow",
    "PyTorch",
    "Machine Learning",
    "AI",
    "Data Science",
    "Analytics",
    "Blockchain",
    "Cloud",
    "Serverless",
    "Microservices",
    "Testing",
    "Jest",
    "Mocha",
    "Cypress",
  ];

  return skillKeywords
    .filter((skill) =>
      new RegExp(`\\b${skill.toLowerCase()}\\b`, "i").test(cleanText)
    )
    .filter((skill, index, self) => self.indexOf(skill) === index);
}
