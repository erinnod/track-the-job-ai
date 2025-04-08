// Save options to storage
function saveOptions() {
  const autoDetectStatus =
    document.getElementById("auto-detect-status").checked;
  const showNotifications =
    document.getElementById("show-notifications").checked;

  chrome.storage.sync.set(
    {
      autoDetectStatus: autoDetectStatus,
      showNotifications: showNotifications,
    },
    function () {
      // Show saved message
      const saveButton = document.getElementById("save-button");
      const originalText = saveButton.textContent;
      saveButton.textContent = "Options Saved!";
      setTimeout(function () {
        saveButton.textContent = originalText;
      }, 1500);
    }
  );
}

// Restore options from storage
function restoreOptions() {
  chrome.storage.sync.get(
    {
      // Default values
      autoDetectStatus: true,
      showNotifications: true,
    },
    function (items) {
      document.getElementById("auto-detect-status").checked =
        items.autoDetectStatus;
      document.getElementById("show-notifications").checked =
        items.showNotifications;
    }
  );

  // Set version
  const manifest = chrome.runtime.getManifest();
  document.getElementById("version").textContent = manifest.version;

  // Check login status
  checkLoginStatus();
}

// Check if user is logged in
function checkLoginStatus() {
  const accountStatus = document.getElementById("account-status");

  chrome.storage.local.get(["auth"], function (result) {
    if (result.auth && isTokenValid(result.auth)) {
      // User is logged in
      accountStatus.innerHTML = `
        <p>Signed in as <strong>${
          result.auth.email || result.auth.userId
        }</strong></p>
        <button id="logout-button">Sign Out</button>
      `;

      // Add logout button handler
      document
        .getElementById("logout-button")
        .addEventListener("click", logout);
    } else {
      // User is not logged in
      accountStatus.innerHTML = `
        <p>Not signed in</p>
        <button id="login-button">Sign In</button>
      `;

      // Add login button handler
      document.getElementById("login-button").addEventListener("click", login);
    }
  });
}

// Check if token is valid
function isTokenValid(auth) {
  if (!auth || !auth.expiresAt) return false;
  return new Date(auth.expiresAt) > new Date();
}

// Logout function
function logout() {
  chrome.storage.local.remove(["auth"], function () {
    checkLoginStatus();
  });
}

// Login function
function login() {
  chrome.tabs.create({ url: "https://jobtrakr.co.uk/login?source=extension" });
}

// Initialize the options page
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save-button").addEventListener("click", saveOptions);
