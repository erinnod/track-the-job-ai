/**
 * JobTrakr Login Script
 */

// Constants
const API_BASE_URL = "https://jobtrakr.co.uk/api";
const GOOGLE_AUTH_URL = "https://jobtrakr.co.uk/api/auth/google";
const GITHUB_AUTH_URL = "https://jobtrakr.co.uk/api/auth/github";

// DOM Elements
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const loginButton = document.getElementById("login-button");
const googleButton = document.getElementById("google-button");
const githubButton = document.getElementById("github-button");
const linkExistingAccountSection = document.getElementById(
  "link-account-section"
);
const toggleLinkAccountButton = document.getElementById("toggle-link-account");
const linkAccountForm = document.getElementById("link-account-form");

// Initialize the login page
document.addEventListener("DOMContentLoaded", init);

/**
 * Initialize the login page
 */
function init() {
  // First check if we have a valid auth token
  getAuthToken().then((auth) => {
    if (auth && isTokenValid(auth)) {
      // If already logged in, redirect to success page
      window.location.href = "login-success.html";
      return;
    }

    // Not logged in, check if there's an existing website session
    checkWebsiteSession();
  });

  // Set up form submission
  loginForm.addEventListener("submit", handleFormSubmit);

  // Set up OAuth buttons
  googleButton.addEventListener("click", () => handleOAuthLogin("google"));
  githubButton.addEventListener("click", () => handleOAuthLogin("github"));

  // Set up account linking toggle if it exists
  if (toggleLinkAccountButton) {
    toggleLinkAccountButton.addEventListener("click", toggleLinkAccountSection);
  }

  // Set up account linking form if it exists
  if (linkAccountForm) {
    linkAccountForm.addEventListener("submit", handleLinkAccount);
  }

  // Check if we're returning from website auth
  checkUrlForAuthCode();
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  // Clear previous errors
  clearErrors();

  // Get form values
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Basic validation
  let isValid = true;

  if (!email) {
    showError(emailError, "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError(emailError, "Please enter a valid email address");
    isValid = false;
  }

  if (!password) {
    showError(passwordError, "Password is required");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  // Show loading state
  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  try {
    // Attempt to log in
    const authData = await loginWithEmailPassword(email, password);

    if (authData) {
      // Save auth data to storage
      await saveAuthData(authData);

      // Check if user needs to link account
      if (authData.needsLinking) {
        showLinkAccountSection();
      } else {
        // Redirect to success page or close
        window.location.href = "login-success.html";
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    showError(
      passwordError,
      error.message ||
        "Login failed. Please check your credentials and try again."
    );

    // Reset button
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
}

/**
 * Handle OAuth login button click
 * @param {string} provider - OAuth provider (google, github)
 */
function handleOAuthLogin(provider) {
  // Determine the OAuth URL
  let authUrl;

  if (provider === "google") {
    authUrl = GOOGLE_AUTH_URL;
  } else if (provider === "github") {
    authUrl = GITHUB_AUTH_URL;
  } else {
    console.error("Unknown OAuth provider:", provider);
    return;
  }

  // Open the auth URL in a new tab
  chrome.tabs.create({ url: authUrl });

  // Listen for messages from the OAuth completion page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "oauth_complete" && message.provider === provider) {
      if (message.success && message.authData) {
        // Save auth data and close the window
        saveAuthData(message.authData).then(() => {
          window.close();
        });
      } else {
        console.error("OAuth error:", message.error);
        // Could display an error, but we're in a different tab/window now
      }
    }
  });
}

/**
 * Attempt to login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Auth data object
 */
async function loginWithEmailPassword(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.status}`);
    }

    const data = await response.json();

    // Validate the response data
    if (!data.token) {
      throw new Error("Invalid response from server");
    }

    return {
      token: data.token,
      userId: data.userId,
      email: data.email,
      expiresAt: calculateExpiryDate(data.expiresIn || 86400), // Default to 24 hours
      websiteLinked: data.websiteLinked || false,
      websiteEmail: data.websiteEmail || null,
    };
  } catch (error) {
    console.error("Login request error:", error);
    throw error;
  }
}

/**
 * Handle account linking form submission
 * @param {Event} event - Form submit event
 */
async function handleLinkAccount(event) {
  event.preventDefault();

  const websiteEmail = document.getElementById("website-email").value.trim();
  const websitePassword = document.getElementById("website-password").value;
  const linkButton = document.getElementById("link-account-button");
  const linkError = document.getElementById("link-account-error");

  // Clear previous errors
  if (linkError) {
    linkError.textContent = "";
    linkError.classList.add("hidden");
  }

  // Basic validation
  if (!websiteEmail || !isValidEmail(websiteEmail)) {
    if (linkError) {
      linkError.textContent = "Please enter a valid email address";
      linkError.classList.remove("hidden");
    }
    return;
  }

  if (!websitePassword) {
    if (linkError) {
      linkError.textContent = "Password is required";
      linkError.classList.remove("hidden");
    }
    return;
  }

  // Show loading state
  if (linkButton) {
    linkButton.disabled = true;
    linkButton.textContent = "Linking...";
  }

  try {
    // Get current auth data
    const authData = await getAuthToken();

    if (!authData || !authData.token) {
      throw new Error("Not logged in");
    }

    // Call API to link accounts
    const response = await fetch(`${API_BASE_URL}/auth/link-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({
        websiteEmail,
        websitePassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to link account: ${response.status}`
      );
    }

    const data = await response.json();

    // Update auth data with linked account info
    const updatedAuthData = {
      ...authData,
      websiteLinked: true,
      websiteEmail: websiteEmail,
    };

    // Save updated auth data
    await saveAuthData(updatedAuthData);

    // Redirect to success page
    window.location.href = "login-success.html?linked=true";
  } catch (error) {
    console.error("Account linking error:", error);

    if (linkError) {
      linkError.textContent =
        error.message ||
        "Failed to link account. Please check your credentials.";
      linkError.classList.remove("hidden");
    }

    // Reset button
    if (linkButton) {
      linkButton.disabled = false;
      linkButton.textContent = "Link Account";
    }
  }
}

/**
 * Show or hide the account linking section
 */
function toggleLinkAccountSection() {
  const linkSection = document.getElementById("link-account-container");
  const signupSection = document.getElementById("signup-section");

  if (linkSection && signupSection) {
    if (linkSection.classList.contains("hidden")) {
      // Show link section, hide signup
      linkSection.classList.remove("hidden");
      signupSection.classList.add("hidden");
      toggleLinkAccountButton.textContent = "Create a new account instead";
    } else {
      // Show signup section, hide link
      linkSection.classList.add("hidden");
      signupSection.classList.remove("hidden");
      toggleLinkAccountButton.textContent = "Link to existing JobTrakr account";
    }
  }
}

/**
 * Check URL for auth code from website redirect
 */
function checkUrlForAuthCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get("code");
  const state = urlParams.get("state");

  if (authCode && state === "website_auth") {
    // Exchange auth code for token
    exchangeAuthCode(authCode);
  }
}

/**
 * Exchange auth code for token
 * @param {string} code - Auth code from redirect URL
 */
async function exchangeAuthCode(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/exchange-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange auth code: ${response.status}`);
    }

    const data = await response.json();

    if (data.token) {
      // Save auth data
      await saveAuthData({
        token: data.token,
        userId: data.userId,
        email: data.email,
        expiresAt: calculateExpiryDate(data.expiresIn || 86400),
        websiteLinked: true,
        websiteEmail: data.email,
      });

      // Redirect to success page
      window.location.href = "login-success.html?linked=true";
    }
  } catch (error) {
    console.error("Auth code exchange error:", error);
    // Show error message
  }
}

/**
 * Calculate token expiry date
 * @param {number} expiresIn - Expiry time in seconds
 * @returns {string} - ISO date string
 */
function calculateExpiryDate(expiresIn) {
  const expiryDate = new Date();
  expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
  return expiryDate.toISOString();
}

/**
 * Save auth data to Chrome storage
 * @param {Object} authData - Auth data to save
 * @returns {Promise<void>}
 */
async function saveAuthData(authData) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ auth: authData }, () => {
      console.log("Auth data saved to storage");
      resolve();
    });
  });
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
 * Check if token is valid
 * @param {Object} auth - Auth data object
 * @returns {boolean} - Whether token is valid
 */
function isTokenValid(auth) {
  if (!auth || !auth.expiresAt) return false;
  return new Date(auth.expiresAt) > new Date();
}

/**
 * Clear error messages
 */
function clearErrors() {
  emailError.textContent = "";
  emailError.classList.add("hidden");
  passwordError.textContent = "";
  passwordError.classList.add("hidden");
}

/**
 * Show an error message
 * @param {HTMLElement} element - Error element to show
 * @param {string} message - Error message
 */
function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if there's an existing website session that can be used for authentication
 */
function checkWebsiteSession() {
  // Show a loading indicator
  const statusDiv = document.createElement("div");
  statusDiv.id = "website-session-status";
  statusDiv.innerHTML =
    '<p class="text-sm text-gray-500">Checking for website login...</p>';
  loginForm.prepend(statusDiv);

  // Send message to background script to check for website session
  chrome.runtime.sendMessage(
    { action: "checkWebsiteSession" },
    function (response) {
      // Remove the loading indicator
      const statusDiv = document.getElementById("website-session-status");
      if (statusDiv) {
        statusDiv.remove();
      }

      if (response && response.success && response.hasSession) {
        // Successfully logged in with website session
        // Redirect to success page
        window.location.href = "login-success.html";
      }
      // If no session or error, do nothing - user will see the normal login form
    }
  );
}
