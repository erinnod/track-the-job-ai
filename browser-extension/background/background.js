/**
 * JobTrakr Browser Extension - Background Script
 *
 * This script handles:
 * - Authentication state management
 * - Communication between content scripts and popup
 * - API communication with JobTrakr backend
 */

// Configuration
const API_URL = "https://www.jobtrakr.co.uk/api"; // Replace with your actual API URL

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("JobTrakr extension installed or updated", details);

  // Check if user is already authenticated
  checkAuthStatus();

  // Open the welcome page when the extension is installed (not for updates)
  if (details.reason === "install") {
    console.log("Opening welcome page for new installation");
    chrome.tabs.create({
      url: chrome.runtime.getURL("onboarding/welcome.html"),
    });
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  // Handle different message types
  switch (message.action) {
    case "saveJob":
      handleSaveJob(message.jobData, sendResponse);
      return true; // Indicates async response

    case "checkAuth":
      checkAuthStatus(sendResponse);
      return true; // Indicates async response

    case "logout":
      handleLogout(sendResponse);
      return true; // Indicates async response
  }
});

// Handle saving a job
async function handleSaveJob(jobData, sendResponse) {
  try {
    // Check if user is authenticated
    const authData = await getAuthData();

    if (!authData || !authData.authToken) {
      console.log("User not authenticated");
      sendResponse({ success: false, error: "Not authenticated" });
      return;
    }

    console.log("Saving job:", jobData);

    // Send job data to API
    const response = await fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.authToken}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error saving job:", errorData);
      sendResponse({
        success: false,
        error: errorData.message || "Failed to save job",
      });
      return;
    }

    const data = await response.json();
    console.log("Job saved successfully:", data);

    // Respond with success
    sendResponse({ success: true, data });

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "../icons/icon-128.png",
      title: "JobTrakr",
      message: "Job saved successfully!",
      priority: 2,
    });
  } catch (error) {
    console.error("Error in handleSaveJob:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Check authentication status
async function checkAuthStatus(sendResponse) {
  try {
    const authData = await getAuthData();

    if (!authData || !authData.authToken) {
      console.log("No auth token found");
      if (sendResponse) sendResponse({ isAuthenticated: false });
      return false;
    }

    // Validate token with API (optional)
    const response = await fetch(`${API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authData.authToken}`,
      },
    });

    if (!response.ok) {
      console.log("Token validation failed");
      // Clear invalid auth data
      await chrome.storage.local.remove(["authToken", "user"]);
      if (sendResponse) sendResponse({ isAuthenticated: false });
      return false;
    }

    const userData = await response.json();
    console.log("User is authenticated:", userData);

    // Update user data in storage
    await chrome.storage.local.set({ user: userData });

    if (sendResponse) sendResponse({ isAuthenticated: true, user: userData });
    return true;
  } catch (error) {
    console.error("Error checking auth status:", error);
    if (sendResponse)
      sendResponse({ isAuthenticated: false, error: error.message });
    return false;
  }
}

// Handle user logout
async function handleLogout(sendResponse) {
  try {
    await chrome.storage.local.remove(["authToken", "user"]);
    console.log("User logged out");

    if (sendResponse) sendResponse({ success: true });
  } catch (error) {
    console.error("Error during logout:", error);
    if (sendResponse) sendResponse({ success: false, error: error.message });
  }
}

// Get authentication data from storage
async function getAuthData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["authToken", "user"], (result) => {
      resolve({
        authToken: result.authToken,
        user: result.user,
      });
    });
  });
}

// Listen for auth redirect from main site
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    (tab.url.includes("auth-callback") ||
      tab.url.includes("login-success") ||
      tab.url.includes("dashboard?source=extension"))
  ) {
    try {
      console.log("Detected potential auth completion page:", tab.url);

      // Extract token from URL
      const url = new URL(tab.url);
      const token =
        url.searchParams.get("token") || url.searchParams.get("auth_token");

      let userData = {};
      try {
        userData = JSON.parse(
          decodeURIComponent(url.searchParams.get("user") || "{}")
        );
      } catch (e) {
        console.warn("Could not parse user data from URL");
      }

      if (token) {
        // Store token and user data
        chrome.storage.local.set(
          {
            authToken: token,
            user: userData,
          },
          () => {
            console.log("Authentication data stored");

            // Close the auth tab
            chrome.tabs.remove(tabId);

            // Show success notification
            chrome.notifications.create({
              type: "basic",
              iconUrl: "../icons/icon-128.png",
              title: "JobTrakr",
              message: "Successfully signed in!",
              priority: 2,
            });
          }
        );
      }
    } catch (error) {
      console.error("Error processing auth callback:", error);
    }
  }
});
