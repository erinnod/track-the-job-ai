/**
 * Welcome page script
 */

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const optionsButton = document.getElementById("options-button");

  // Add event listeners
  if (optionsButton) {
    optionsButton.addEventListener("click", openOptionsPage);
  }

  // Check auth status to personalize content
  checkAuthStatus();
});

/**
 * Open the extension options page
 */
function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}

/**
 * Check if user is already authenticated
 */
function checkAuthStatus() {
  // Use the same storage keys as the background script (authToken and user)
  chrome.storage.local.get(["authToken", "user"], (result) => {
    if (result.authToken && result.user) {
      // User is already logged in, update UI
      updateUIForLoggedInUser(result.user);
    }
  });
}

/**
 * Update the UI when user is already logged in
 * @param {Object} userData - User data
 */
function updateUIForLoggedInUser(userData) {
  // Find elements to update
  const createAccountStep = document.querySelector(".step:nth-child(1)");

  if (createAccountStep) {
    const createAccountBtn = createAccountStep.querySelector(".button");
    const stepHeading = createAccountStep.querySelector("h3");
    const stepText = createAccountStep.querySelector("p");

    // Update content to reflect logged in state
    if (stepHeading) stepHeading.textContent = "You're Already Logged In";
    if (stepText)
      stepText.textContent = `You're logged in as ${
        userData.email || "a JobTrakr user"
      }. You're ready to start saving jobs.`;

    // Update button
    if (createAccountBtn) {
      createAccountBtn.textContent = "Go to Dashboard";
      createAccountBtn.href = "https://www.jobtrakr.co.uk/dashboard";
    }
  }
}

/**
 * Check if auth token is valid (not expired)
 * @param {Object} auth - Auth data object
 * @returns {boolean} - Whether token is valid
 */
function isTokenValid(auth) {
  if (!auth || !auth.expiresAt) return false;

  // Check if token has expired
  return new Date(auth.expiresAt) > new Date();
}
