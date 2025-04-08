/**
 * JobTrakr Browser Extension
 * Background Script
 */

// Configuration
const API_BASE_URL = "https://jobtrakr.co.uk/api"; // Replace with your actual API endpoint

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);

  // Handle different message actions
  switch (message.action) {
    case "saveJob":
      handleSaveJob(message.jobData, sendResponse);
      return true; // Keep the message channel open for async response

    case "getStatus":
      handleGetStatus(sendResponse);
      return true;

    case "openOptions":
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return false;

    case "linkAccount":
      handleLinkAccount(
        message.websiteEmail,
        message.websitePassword,
        sendResponse
      );
      return true;

    default:
      console.warn("Unknown action:", message.action);
      sendResponse({ success: false, error: "Unknown action" });
      return false;
  }
});

/**
 * Handle saving a job to JobTrakr
 * @param {Object} jobData - The job data to save
 * @param {Function} sendResponse - Function to send response back to content script
 */
async function handleSaveJob(jobData, sendResponse) {
  try {
    console.log("Saving job:", jobData);

    // Get auth token from storage
    const auth = await getAuthToken();

    if (!auth) {
      console.log("No auth token found, opening login");
      // Open login page
      openLoginPage();
      sendResponse({
        success: false,
        error: "Authentication required",
        requiresAuth: true,
      });
      return;
    }

    // Add timestamp if not present
    if (!jobData.appliedDate) {
      jobData.appliedDate = new Date().toISOString();
    }

    // Transform data to match API expectations
    const apiJobData = transformJobDataForApi(jobData);

    // Determine if we should save to website or extension-only
    const endpoint = auth.websiteLinked
      ? `${API_BASE_URL}/jobs?syncToWebsite=true`
      : `${API_BASE_URL}/jobs`;

    // Send data to API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(apiJobData),
    });

    if (!response.ok) {
      // Handle API errors
      const errorData = await response.json().catch(() => ({}));
      console.error("API error:", response.status, errorData);

      if (response.status === 401) {
        // Token expired, clear it and ask for re-login
        await clearAuthToken();
        openLoginPage();
        sendResponse({
          success: false,
          error: "Session expired. Please log in again.",
          requiresAuth: true,
        });
      } else {
        sendResponse({
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        });
      }
      return;
    }

    const result = await response.json();

    // Add info about where the job was saved
    const storageLocation = auth.websiteLinked
      ? `JobTrakr extension and website (${auth.websiteEmail})`
      : "JobTrakr extension only";

    // Show a browser notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: "Job Saved to JobTrakr",
      message: `"${jobData.title}" at "${jobData.company}" was saved to ${storageLocation}.`,
    });

    // Send success response back to content script
    sendResponse({
      success: true,
      jobId: result.id,
      syncedToWebsite: auth.websiteLinked,
    });
  } catch (error) {
    console.error("Error saving job:", error);
    sendResponse({ success: false, error: error.message });
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
    const auth = await getAuthToken();

    if (!auth) {
      sendResponse({
        success: false,
        error: "Not logged in to extension",
      });
      return;
    }

    // Call API to link accounts
    const response = await fetch(`${API_BASE_URL}/auth/link-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        websiteEmail,
        websitePassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to link accounts: ${response.status}`
      );
    }

    const data = await response.json();

    // Update auth data in storage
    const updatedAuth = {
      ...auth,
      websiteLinked: true,
      websiteEmail,
    };

    await saveAuthData(updatedAuth);

    // Send success response
    sendResponse({
      success: true,
      message: "Accounts linked successfully",
      websiteEmail,
    });
  } catch (error) {
    console.error("Error linking accounts:", error);
    sendResponse({ success: false, error: error.message });
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
    status: "saved", // Default status for jobs saved from extension
    applied_date: jobData.appliedDate,
    notes:
      jobData.notes || `Saved from ${jobData.source} via JobTrakr extension`,
  };
}

/**
 * Handle request for extension status
 * @param {Function} sendResponse - Function to send response back to content script
 */
async function handleGetStatus(sendResponse) {
  try {
    // Get auth status
    const auth = await getAuthToken();

    // Get version info
    const manifest = chrome.runtime.getManifest();

    sendResponse({
      success: true,
      version: manifest.version,
      isLoggedIn: !!auth,
      userId: auth ? auth.userId : null,
      websiteLinked: auth ? !!auth.websiteLinked : false,
      websiteEmail: auth ? auth.websiteEmail : null,
    });
  } catch (error) {
    console.error("Error getting status:", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get auth token from storage
 * @returns {Promise<Object|null>} - Auth object or null if not found
 */
function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["auth"], (result) => {
      if (result.auth && isTokenValid(result.auth)) {
        resolve(result.auth);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Save auth data to storage
 * @param {Object} authData - Auth data to save
 * @returns {Promise<void>}
 */
function saveAuthData(authData) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ auth: authData }, () => {
      console.log("Auth data saved to storage");
      resolve();
    });
  });
}

/**
 * Check if stored token is still valid
 * @param {Object} auth - Auth object from storage
 * @returns {boolean} - Whether token is valid
 */
function isTokenValid(auth) {
  if (!auth || !auth.expiresAt) return false;

  // Check if token has expired
  return new Date(auth.expiresAt) > new Date();
}

/**
 * Clear auth token from storage
 * @returns {Promise<void>}
 */
function clearAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(["auth"], resolve);
  });
}

/**
 * Open login page
 */
function openLoginPage() {
  chrome.tabs.create({
    url: "popup/login.html",
  });
}

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // First install
    console.log("Extension installed");
    chrome.tabs.create({
      url: "onboarding/welcome.html",
    });
  } else if (details.reason === "update") {
    // Extension updated
    console.log("Extension updated from version", details.previousVersion);

    // Show update notification for major/minor updates
    const previousVersion = details.previousVersion.split(".");
    const currentVersion = chrome.runtime.getManifest().version.split(".");

    if (
      previousVersion[0] !== currentVersion[0] ||
      previousVersion[1] !== currentVersion[1]
    ) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "JobTrakr Extension Updated",
        message: `Updated to version ${currentVersion.join(
          "."
        )}. Click to see what's new.`,
      });
    }
  }
});

// Handle browser action click (extension icon)
chrome.action.onClicked.addListener((tab) => {
  // Check if we're on a job site
  const url = tab.url || "";

  if (
    url.includes("linkedin.com/jobs") ||
    url.includes("indeed.com/job") ||
    url.includes("glassdoor.com/job")
  ) {
    // We're on a job page, inject the content script if not already
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: injectSaveButton,
    });
  } else {
    // Not on a job page, open JobTrakr in a new tab
    chrome.tabs.create({
      url: "https://jobtrakr.co.uk/dashboard",
    });
  }
});

/**
 * Function to inject save button via executeScript
 */
function injectSaveButton() {
  // This function runs in the context of the page
  if (document.querySelector("#jobtrakr-save-button")) {
    // Button already exists, just highlight it
    const button = document.querySelector("#jobtrakr-save-button");
    button.style.transform = "scale(1.1)";
    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 200);
    return;
  }

  // Button doesn't exist yet, the page might not have loaded
  // Send a message to the content script to create it
  chrome.runtime.sendMessage({ action: "createSaveButton" });
}
