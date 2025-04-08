/**
 * JobTrakr extension content script for LinkedIn job pages
 */

// Import shared utilities from utils.js
// The actual import will be handled by manifest.json content_scripts section

document.addEventListener("DOMContentLoaded", init);

/**
 * Initialize the content script
 */
function init() {
  // Check if we're on a job detail page
  if (isJobDetailPage()) {
    initJobDetailPage();
  }
}

/**
 * Check if current page is a LinkedIn job detail page
 * @returns {boolean}
 */
function isJobDetailPage() {
  // LinkedIn job detail pages have a specific URL pattern
  return (
    window.location.href.includes("/jobs/view/") ||
    window.location.href.includes("/jobs/collections/")
  );
}

/**
 * Initialize functionality for job detail page
 */
async function initJobDetailPage() {
  try {
    // Create save button after ensuring the job details have loaded
    await waitForElement(".job-view-layout");

    createActionButton("Save to JobTrakr", async () => {
      try {
        const jobData = extractJobData();

        // Send job data to background script
        const response = await sendMessageToBackground({
          action: "saveJob",
          jobData,
        });

        if (response && response.success) {
          showNotification("Job saved to JobTrakr!", "success");
        } else {
          showNotification(
            "Failed to save job: " + (response?.error || "Unknown error"),
            "error"
          );
        }
      } catch (error) {
        console.error("Error saving job:", error);
        showNotification("Error saving job: " + error.message, "error");
      }
    });
  } catch (error) {
    console.error("Error initializing LinkedIn job page:", error);
  }
}

/**
 * Extract job data from LinkedIn job detail page
 * @returns {Object} Job data
 */
function extractJobData() {
  // Job title
  const title =
    getTextContent(".job-details-jobs-unified-top-card__job-title") ||
    getTextContent(".topcard__title");

  // Company name
  const company =
    getTextContent(".job-details-jobs-unified-top-card__company-name") ||
    getTextContent(".topcard__org-name-link");

  // Location
  const location =
    getTextContent(".job-details-jobs-unified-top-card__bullet") ||
    getTextContent(".topcard__flavor--bullet");

  // Job type (if available)
  const jobTypeElement = document.querySelector(
    ".job-details-jobs-unified-top-card__job-insight"
  );
  const jobType = jobTypeElement
    ? Array.from(
        document.querySelectorAll(
          ".job-details-jobs-unified-top-card__job-insight"
        )
      )
        .find((el) => el.textContent.includes("Employment type"))
        ?.textContent.replace("Employment type", "")
        .trim()
    : "";

  // Description
  const description =
    getTextContent(".jobs-description__content") ||
    getTextContent(".description__text");

  // Application URL
  const applicationUrl = window.location.href;

  // Salary (if available)
  const salaryElement = Array.from(
    document.querySelectorAll(".job-details-jobs-unified-top-card__job-insight")
  ).find(
    (el) =>
      el.textContent.includes("$") ||
      el.textContent.toLowerCase().includes("salary")
  );
  const salary = salaryElement ? salaryElement.textContent.trim() : "";

  // Posted date
  const postedDateElement =
    document.querySelector(".job-details-jobs-unified-top-card__posted-date") ||
    document.querySelector(".topcard__flavor--metadata");
  const postedDate = postedDateElement
    ? postedDateElement.textContent.trim()
    : "";

  // Skills (if available)
  const skills = Array.from(
    document.querySelectorAll(".job-details-how-you-match__skills-item")
  )
    .map((skill) => skill.textContent.trim())
    .filter(Boolean);

  return {
    title,
    company,
    location,
    jobType,
    description,
    applicationUrl,
    salary,
    postedDate,
    source: "LinkedIn",
    skills: skills.length > 0 ? skills : undefined,
  };
}
