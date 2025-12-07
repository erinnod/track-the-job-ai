// JobTrakr Browser Extension
// Content script for auto-filling job application forms

// Configuration for known job sites
const KNOWN_SITES = {
  "linkedin.com": {
    name: "LinkedIn",
    selectors: {
      firstName: 'input[name="firstName"]',
      lastName: 'input[name="lastName"]',
      email: 'input[name="email"]',
      phone: 'input[name="phone"]',
      resumeUpload: 'input[type="file"][accept*="pdf"]',
      coverLetterUpload: 'input[type="file"][accept*="pdf"][name*="cover"]',
      submit: 'button[type="submit"]',
    },
  },
  "indeed.com": {
    name: "Indeed",
    selectors: {
      firstName: 'input[name="firstName"], input[name="applicant.firstName"]',
      lastName: 'input[name="lastName"], input[name="applicant.lastName"]',
      email: 'input[name="email"], input[type="email"]',
      phone: 'input[name="phoneNumber"], input[type="tel"]',
      resumeUpload: 'input[type="file"][accept*="pdf"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },
  "glassdoor.com": {
    name: "Glassdoor",
    selectors: {
      firstName: 'input[name="firstName"]',
      lastName: 'input[name="lastName"]',
      email: 'input[name="email"], input[type="email"]',
      phone: 'input[name="phone"], input[type="tel"]',
      resumeUpload: 'input[type="file"][accept*="pdf"]',
      submit: 'button[type="submit"]',
    },
  },
  // Add more sites as needed
};

// User profile data (will be filled from extension storage)
let userProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  resumeUrl: "",
  coverLetterUrl: "",
};

// Main initialization
function init() {
  console.log("[JobTrakr] Content script loaded");

  // Check if current site is a known job site
  const currentSite = getCurrentSite();
  if (!currentSite) {
    console.log("[JobTrakr] Not a known job site");
    return;
  }

  // Load user profile data from extension storage
  chrome.storage.sync.get("userProfile", (data) => {
    if (data.userProfile) {
      userProfile = data.userProfile;
      console.log("[JobTrakr] User profile loaded", userProfile);

      // Add the autofill button to the page
      addAutofillButton(currentSite);
    } else {
      console.log("[JobTrakr] No user profile found");
      // Show notification to set up profile
      showNotification("Please set up your profile in the JobTrakr extension");
    }
  });

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "autofill") {
      autofillForm(currentSite);
      sendResponse({ success: true });
    } else if (message.action === "captureJobData") {
      const jobData = captureJobData();
      sendResponse({ jobData });
    }
    return true; // Keep the message channel open for async response
  });
}

// Determine if current site is a known job site
function getCurrentSite() {
  const hostname = window.location.hostname;

  for (const site in KNOWN_SITES) {
    if (hostname.includes(site)) {
      return KNOWN_SITES[site];
    }
  }

  return null;
}

// Add autofill button to the page
function addAutofillButton(siteConfig) {
  // Create button element
  const button = document.createElement("button");
  button.innerText = "Auto-fill with JobTrakr";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 8px 12px;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  // Add event listener
  button.addEventListener("click", () => {
    autofillForm(siteConfig);
  });

  // Add to page
  document.body.appendChild(button);
}

// Autofill the form
function autofillForm(siteConfig) {
  console.log("[JobTrakr] Autofilling form for", siteConfig.name);

  // Get selectors for the current site
  const selectors = siteConfig.selectors;

  // Fill in text fields
  fillField(selectors.firstName, userProfile.firstName);
  fillField(selectors.lastName, userProfile.lastName);
  fillField(selectors.email, userProfile.email);
  fillField(selectors.phone, userProfile.phone);

  // Also try to capture job data to save to JobTrakr
  const jobData = captureJobData();
  if (jobData.title || jobData.company) {
    // Send job data to background script
    chrome.runtime.sendMessage({
      action: "saveJobData",
      jobData: jobData,
    });
  }

  // Show success notification
  showNotification("Form auto-filled by JobTrakr!");
}

// Helper function to fill a field
function fillField(selector, value) {
  if (!value) return;

  const fields = document.querySelectorAll(selector);
  if (fields.length > 0) {
    fields.forEach((field) => {
      field.value = value;
      // Trigger input event for reactive forms
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
    console.log("[JobTrakr] Filled field:", selector);
  } else {
    console.log("[JobTrakr] Field not found:", selector);
  }
}

// Capture job data from the page
function captureJobData() {
  let jobData = {
    title: "",
    company: "",
    location: "",
    description: "",
    url: window.location.href,
    date: new Date().toISOString(),
  };

  // Different sites have different structures, try common patterns
  // Job title
  const titleElements = document.querySelectorAll(
    'h1, .job-title, [data-testid="jobsearch-JobInfoHeader-title"]'
  );
  for (const el of titleElements) {
    const text = el.textContent.trim();
    if (text.length > 0 && text.length < 100) {
      jobData.title = text;
      break;
    }
  }

  // Company name
  const companyElements = document.querySelectorAll(
    '.company-name, [data-testid="jobsearch-JobInfoHeader-companyName"], .employer-name'
  );
  for (const el of companyElements) {
    const text = el.textContent.trim();
    if (text.length > 0 && text.length < 50) {
      jobData.company = text;
      break;
    }
  }

  // Location
  const locationElements = document.querySelectorAll(
    '.location, [data-testid="jobsearch-JobInfoHeader-location"], .job-location'
  );
  for (const el of locationElements) {
    const text = el.textContent.trim();
    if (text.length > 0 && text.length < 100) {
      jobData.location = text;
      break;
    }
  }

  // Description
  const descriptionElements = document.querySelectorAll(
    '.job-description, [data-testid="jobDescriptionText"], .description'
  );
  for (const el of descriptionElements) {
    const text = el.textContent.trim();
    if (text.length > 100) {
      jobData.description = text;
      break;
    }
  }

  return jobData;
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.innerText = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 16px;
    background-color: #4f46e5;
    color: white;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: opacity 0.3s ease-in-out;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Initialize when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
