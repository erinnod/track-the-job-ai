/**
 * JobTrakr Extension Popup Script
 */

// Constants
const API_URL = "https://www.jobtrakr.co.uk/api"; // Replace with your actual API URL

// DOM Elements
const elements = {
  userStatus: document.getElementById("userStatus"),
  statusText: document.getElementById("statusText"),
  notification: document.getElementById("notification"),

  // Views
  unauthenticatedView: document.getElementById("unauthenticatedView"),
  authenticatedView: document.getElementById("authenticatedView"),
  jobDetectionSection: document.getElementById("jobDetectionSection"),
  notJobPageView: document.getElementById("notJobPageView"),

  // Buttons
  loginBtn: document.getElementById("loginBtn"),
  saveJobBtn: document.getElementById("saveJobBtn"),
  viewDashboardBtn: document.getElementById("viewDashboardBtn"),
  logoutBtn: document.getElementById("logoutBtn"),

  // Job information
  userEmail: document.getElementById("userEmail"),
  jobsCount: document.getElementById("jobsCount"),
  jobTitle: document.getElementById("jobTitle"),
  companyName: document.getElementById("companyName"),
  jobLocation: document.getElementById("jobLocation"),
};

// State
let state = {
  isAuthenticated: false,
  user: null,
  detectedJob: null,
  isOnJobPage: false,
};

// Initialize popup
function init() {
  // Check authentication status
  checkAuthStatus();

  // Attach event listeners
  attachEventListeners();

  // Check if we're on a job page
  checkCurrentPage();
}

// Authentication functions
function checkAuthStatus() {
  chrome.storage.local.get(["authToken", "user"], function (result) {
    if (result.authToken && result.user) {
      state.isAuthenticated = true;
      state.user = result.user;
      updateAuthUI();
      fetchUserStats();
    } else {
      state.isAuthenticated = false;
      updateAuthUI();
    }
  });
}

function updateAuthUI() {
  if (state.isAuthenticated) {
    elements.unauthenticatedView.classList.add("hidden");
    elements.authenticatedView.classList.remove("hidden");

    elements.userStatus.className = "status-container status-success";
    elements.statusText.textContent = "Connected";

    if (state.user) {
      elements.userEmail.textContent = state.user.email || "User";
    }
  } else {
    elements.unauthenticatedView.classList.remove("hidden");
    elements.authenticatedView.classList.add("hidden");

    elements.userStatus.className = "status-container status-error";
    elements.statusText.textContent = "Not connected";
  }
}

function fetchUserStats() {
  if (!state.isAuthenticated) return;

  // Get the auth token first, then make the API call
  chrome.storage.local.get(["authToken"], function (result) {
    if (!result || !result.authToken) {
      console.log("No auth token found in fetchUserStats");
      return;
    }

    // Example API call to get user stats
    fetch(`${API_URL}/user/stats`, {
      headers: {
        Authorization: `Bearer ${result.authToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch user stats");
        return response.json();
      })
      .then((data) => {
        if (data.jobsCount) {
          elements.jobsCount.textContent = data.jobsCount;
        }
      })
      .catch((error) => {
        console.error("Error fetching user stats:", error);
      });
  });
}

function login() {
  // Open dashboard in new tab for authentication
  chrome.tabs.create({
    url: "https://www.jobtrakr.co.uk/login?source=extension&redirect_after_login=dashboard?source=extension",
  });

  // The main site will handle the auth flow and store the token in chrome.storage
  // We'll detect this in the background script
}

function logout() {
  chrome.storage.local.remove(["authToken", "user"], function () {
    state.isAuthenticated = false;
    state.user = null;
    updateAuthUI();
    showNotification("You have been signed out.", "info");
  });
}

// Job related functions
function checkCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;

    const currentTab = tabs[0];

    // Ask content script if we're on a job page
    chrome.tabs.sendMessage(
      currentTab.id,
      { action: "checkJobPage" },
      function (response) {
        if (chrome.runtime.lastError) {
          // Content script not available or didn't respond
          state.isOnJobPage = false;
          updateJobPageUI();
          return;
        }

        if (response && response.isJobPage) {
          state.isOnJobPage = true;
          state.detectedJob = response.jobData;
          updateJobPageUI();
        } else {
          state.isOnJobPage = false;
          updateJobPageUI();
        }
      }
    );
  });
}

function updateJobPageUI() {
  if (state.isAuthenticated) {
    if (state.isOnJobPage && state.detectedJob) {
      elements.notJobPageView.classList.add("hidden");
      elements.jobDetectionSection.classList.remove("hidden");

      // Update job preview
      elements.jobTitle.textContent =
        state.detectedJob.title || "Unknown Position";
      elements.companyName.textContent =
        state.detectedJob.company || "Unknown Company";
      elements.jobLocation.textContent =
        state.detectedJob.location || "Unknown Location";
    } else {
      elements.jobDetectionSection.classList.add("hidden");
      elements.notJobPageView.classList.remove("hidden");
    }
  }
}

function saveCurrentJob() {
  if (!state.isAuthenticated || !state.detectedJob) {
    return showNotification("You must be signed in to save jobs.", "error");
  }

  elements.saveJobBtn.disabled = true;
  elements.saveJobBtn.textContent = "Saving...";

  // Get the auth token first, then make the API call
  chrome.storage.local.get(["authToken"], function (result) {
    if (!result || !result.authToken) {
      console.log("No auth token found in saveCurrentJob");
      elements.saveJobBtn.disabled = false;
      elements.saveJobBtn.textContent = "Save Job";
      return showNotification(
        "Authentication error. Please sign in again.",
        "error"
      );
    }

    fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${result.authToken}`,
      },
      body: JSON.stringify(state.detectedJob),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to save job");
        return response.json();
      })
      .then((data) => {
        showNotification("Job saved successfully!", "success");
        elements.saveJobBtn.textContent = "Saved!";

        // Update job count
        if (elements.jobsCount) {
          const currentCount = parseInt(elements.jobsCount.textContent) || 0;
          elements.jobsCount.textContent = currentCount + 1;
        }

        // After 2 seconds, enable button again
        setTimeout(() => {
          elements.saveJobBtn.disabled = false;
          elements.saveJobBtn.textContent = "Save Job";
        }, 2000);
      })
      .catch((error) => {
        console.error("Error saving job:", error);
        showNotification("Error saving job. Please try again.", "error");
        elements.saveJobBtn.disabled = false;
        elements.saveJobBtn.textContent = "Save Job";
      });
  });
}

// Helper functions
function showNotification(message, type = "info") {
  elements.notification.textContent = message;
  elements.notification.className = `notification notification-${type}`;
  elements.notification.classList.remove("hidden");

  // Auto-hide notification after 3 seconds
  setTimeout(() => {
    elements.notification.classList.add("hidden");
  }, 3000);
}

function getAuthToken() {
  // Use a synchronous approach for simplicity in this demo
  // In a production extension, use the async storage pattern
  let token = "";
  try {
    // This is a workaround that should be replaced with proper async handling
    chrome.storage.local.get(["authToken"], function (result) {
      if (result && result.authToken) {
        token = result.authToken;
      }
    });
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return "";
  }
}

function openDashboard() {
  chrome.tabs.create({ url: "https://www.jobtrakr.co.uk/dashboard" });
}

function attachEventListeners() {
  // Login button
  elements.loginBtn.addEventListener("click", login);

  // Logout button
  elements.logoutBtn.addEventListener("click", logout);

  // Save job button
  elements.saveJobBtn.addEventListener("click", saveCurrentJob);

  // View dashboard button
  elements.viewDashboardBtn.addEventListener("click", openDashboard);
}

// Run initialization when popup is loaded
document.addEventListener("DOMContentLoaded", init);
