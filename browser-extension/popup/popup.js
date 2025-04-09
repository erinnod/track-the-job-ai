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
  saveJobBtn: document.getElementById("save-job-button"),
  viewDashboardBtn: document.getElementById("view-dashboard-button"),
  logoutBtn: document.getElementById("logout-button"),

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
  console.log("Initializing popup...");

  // Debug element availability
  console.log("Login button found:", !!document.getElementById("loginBtn"));
  console.log("Logout button found:", !!document.getElementById("logoutBtn"));

  // Make sure the DOM elements are refreshed before attaching listeners
  refreshElements();

  // Check authentication status
  checkAuthStatus();

  // Attach event listeners
  attachEventListeners();

  // Check if we're on a job page
  checkCurrentPage();
}

// Refresh element references
function refreshElements() {
  elements.loginBtn = document.getElementById("loginBtn");
  elements.logoutBtn = document.getElementById("logoutBtn");
  elements.saveJobBtn = document.getElementById("save-job-button");
  elements.viewDashboardBtn = document.getElementById("view-dashboard-button");
}

// Authentication functions
function checkAuthStatus() {
  chrome.storage.local.get(["auth"], function (result) {
    if (result.auth && isTokenValid(result.auth)) {
      state.isAuthenticated = true;
      state.user = {
        email: result.auth.email || result.auth.websiteEmail,
        userId: result.auth.userId,
      };
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
  chrome.storage.local.get(["auth"], function (result) {
    if (!result || !result.auth || !result.auth.token) {
      console.log("No auth token found in fetchUserStats");
      return;
    }

    // Example API call to get user stats
    fetch(`${API_URL}/user/stats`, {
      headers: {
        Authorization: `Bearer ${result.auth.token}`,
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
  console.log("Login button clicked");

  // Try to use background script to open login page
  try {
    chrome.runtime.sendMessage({ action: "openLoginPage" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error sending message to background:",
          chrome.runtime.lastError
        );
        // Fallback: directly open login page
        openLoginPageDirectly();
      } else {
        console.log("Requested to open login page", response);
        // Close the popup
        window.close();
      }
    });
  } catch (error) {
    console.error("Error in login function:", error);
    // Fallback: directly open login page
    openLoginPageDirectly();
  }
}

// Fallback function to open login page directly
function openLoginPageDirectly() {
  console.log("Using direct login page open method");
  chrome.tabs.create({
    url: chrome.runtime.getURL("popup/login.html"),
  });
  window.close();
}

function logout() {
  // Clear all auth related storage
  chrome.storage.local.remove(["auth", "authToken", "user"], function () {
    // Also clear any cookies that might be conflicting
    chrome.cookies.getAll({ domain: "jobtrakr.co.uk" }, function (cookies) {
      for (let cookie of cookies) {
        const cookieUrl = "https://" + cookie.domain + cookie.path;
        chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
      }

      // Update UI
      state.isAuthenticated = false;
      state.user = null;
      updateAuthUI();
      showNotification("You have been signed out.", "info");

      console.log("Completely logged out from extension");
    });
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
  chrome.storage.local.get(["auth"], function (result) {
    if (!result || !result.auth || !result.auth.token) {
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
        Authorization: `Bearer ${result.auth.token}`,
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
  return new Promise((resolve) => {
    chrome.storage.local.get(["auth"], (result) => {
      if (result.auth && isTokenValid(result.auth)) {
        resolve(result.auth.token);
      } else {
        resolve(null);
      }
    });
  });
}

function openDashboard() {
  chrome.tabs.create({ url: "https://www.jobtrakr.co.uk/dashboard" });
}

function attachEventListeners() {
  // Login button
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", login);
  }

  // Logout button
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", logout);
  }

  // Save job button
  if (elements.saveJobBtn) {
    elements.saveJobBtn.addEventListener("click", saveCurrentJob);
  }

  // View dashboard button
  if (elements.viewDashboardBtn) {
    elements.viewDashboardBtn.addEventListener("click", openDashboard);
  }
}

// Run initialization when popup is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded");

  // Direct event listener for login button - highest priority
  const loginButton = document.getElementById("loginBtn");
  if (loginButton) {
    console.log("Found login button, attaching event listener directly");
    loginButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Login button clicked directly");

      // Open login page in new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL("popup/login.html"),
      });

      // Close popup
      window.close();
    });
  } else {
    console.error("Login button not found in DOM");
  }

  // Continue with regular initialization
  init();
});

// Add token validation function that matches login.js
function isTokenValid(auth) {
  if (!auth || !auth.expiresAt) return false;
  return new Date(auth.expiresAt) > new Date();
}
