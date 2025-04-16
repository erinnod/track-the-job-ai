/**
 * ZipRecruiter content script to extract job data
 */

// Function to extract job data from ZipRecruiter job page
function extractZipRecruiterJobData() {
  try {
    // Extract job title
    const jobTitleElement = document.querySelector(".job_title");
    const jobTitle = jobTitleElement
      ? cleanText(jobTitleElement.textContent)
      : "";

    // Extract company name
    const companyElement = document.querySelector(".hiring_company_text");
    const company = companyElement ? cleanText(companyElement.textContent) : "";

    // Extract location
    const locationElement = document.querySelector(".location");
    const location = locationElement
      ? cleanText(locationElement.textContent)
      : "";

    // Extract salary if available
    const salaryElement = document.querySelector(".value_for_salary");
    const salary = salaryElement ? cleanText(salaryElement.textContent) : "";

    // Extract employment type
    const jobDetailsElements = document.querySelectorAll(
      ".job_details_list .value"
    );
    let employmentType = "";
    jobDetailsElements.forEach((element) => {
      const text = cleanText(element.textContent);
      if (
        text.includes("Full-time") ||
        text.includes("Part-time") ||
        text.includes("Contract") ||
        text.includes("Temporary") ||
        text.includes("Internship")
      ) {
        employmentType = text;
      }
    });

    // Extract job description
    const descriptionElement = document.querySelector(".job_description");
    const description = descriptionElement
      ? cleanText(descriptionElement.textContent)
      : "";

    // Get apply URL
    const applyUrl = window.location.href;

    // Extract skills from job description
    const skills = extractSkills(description);

    // Create job data object
    const jobData = {
      title: jobTitle,
      company: company,
      location: location,
      salary: salary,
      employmentType: employmentType,
      description: description,
      applyUrl: applyUrl,
      skills: skills,
      source: "ZipRecruiter",
    };

    // Display save button
    showSaveButton(jobData);

    return jobData;
  } catch (error) {
    console.error("Error extracting ZipRecruiter job data:", error);
    return null;
  }
}

// Function to check if current page is a ZipRecruiter job page
function isZipRecruiterJobPage() {
  return (
    window.location.href.includes("ziprecruiter.com/jobs/") ||
    window.location.href.includes("ziprecruiter.com/job/")
  );
}

// Initialize ZipRecruiter content script
function initZipRecruiter() {
  // Wait for page to load completely
  setTimeout(() => {
    if (isZipRecruiterJobPage()) {
      extractZipRecruiterJobData();
    }
  }, 1000);

  // Set up observer to detect URL changes (for SPA navigation)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;

      // Check if new page is a job page and extract data if it is
      setTimeout(() => {
        if (isZipRecruiterJobPage()) {
          extractZipRecruiterJobData();
        }
      }, 1000);
    }
  });

  // Start observing
  observer.observe(document, { subtree: true, childList: true });
}

// Initialize when document is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initZipRecruiter);
} else {
  initZipRecruiter();
}
