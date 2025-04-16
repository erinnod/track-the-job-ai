/**
 * Common functionality for all content scripts
 */

// Create and show the save button on job pages
function showSaveButton(jobData) {
  // Check if button already exists
  if (document.getElementById("jobtrakr-save-button")) {
    return;
  }

  // Create the button container
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "jobtrakr-button-container";
  buttonContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `;

  // Create the save button
  const saveButton = document.createElement("button");
  saveButton.id = "jobtrakr-save-button";
  saveButton.textContent = "Save to JobTrakr";
  saveButton.style.cssText = `
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    margin-bottom: 8px;
  `;

  saveButton.addEventListener("mouseover", () => {
    saveButton.style.backgroundColor = "#3730A3";
  });

  saveButton.addEventListener("mouseout", () => {
    saveButton.style.backgroundColor = "#4F46E5";
  });

  // Handle click event
  saveButton.addEventListener("click", () => {
    // Show saving state
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;
    saveButton.style.opacity = "0.7";

    // Send message to background script
    chrome.runtime.sendMessage(
      {
        action: "saveJob",
        jobData,
      },
      (response) => {
        if (response && response.success) {
          showNotification("Job saved successfully!", "success");
          saveButton.textContent = "Saved ✓";
          saveButton.style.backgroundColor = "#10B981";
        } else {
          showNotification(
            response?.message || "Error saving job. Please try again.",
            "error"
          );
          saveButton.textContent = "Save to JobTrakr";
          saveButton.disabled = false;
          saveButton.style.opacity = "1";
        }
      }
    );
  });

  // Add button to container
  buttonContainer.appendChild(saveButton);

  // Create a notification div
  const notification = document.createElement("div");
  notification.id = "jobtrakr-notification";
  notification.style.cssText = `
    background-color: #10B981;
    color: white;
    border-radius: 4px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 8px;
    display: none;
  `;
  buttonContainer.appendChild(notification);

  // Add container to page
  document.body.appendChild(buttonContainer);
}

// Show a notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("jobtrakr-notification");
  if (!notification) return;

  notification.textContent = message;
  notification.style.backgroundColor =
    type === "success" ? "#10B981" : "#EF4444";
  notification.style.display = "block";

  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// Extract skills and keywords from a job description
function extractSkills(description) {
  if (!description) return [];

  // Common technical skills to look for
  const commonSkills = [
    // Programming Languages
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C#",
    "C++",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "Go",
    "Rust",
    "Scala",
    "Perl",
    "R",
    "MATLAB",
    "Objective-C",
    "Dart",
    "Groovy",
    "Bash",

    // Web Technologies
    "HTML",
    "CSS",
    "SASS",
    "LESS",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "Next.js",
    "Gatsby",
    "Redux",
    "jQuery",
    "Bootstrap",
    "Tailwind",
    "Material-UI",
    "Webpack",
    "Babel",
    "REST API",
    "GraphQL",
    "JSON",
    "XML",
    "JWT",
    "OAuth",

    // Databases
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Firebase",
    "DynamoDB",
    "Cassandra",
    "Redis",
    "Elasticsearch",
    "Oracle",
    "SQLite",
    "MariaDB",
    "Neo4j",
    "Supabase",

    // Cloud & DevOps
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Jenkins",
    "GitHub Actions",
    "Terraform",
    "Ansible",
    "Prometheus",
    "Grafana",
    "Nginx",
    "Apache",
    "Serverless",

    // AI & Data Science
    "Machine Learning",
    "Deep Learning",
    "AI",
    "TensorFlow",
    "PyTorch",
    "Keras",
    "Pandas",
    "NumPy",
    "SciPy",
    "Scikit-learn",
    "NLP",
    "Computer Vision",
    "Data Mining",
    "Big Data",
    "Hadoop",
    "Spark",
    "Tableau",
    "Power BI",
    "Data Visualization",

    // Mobile
    "iOS",
    "Android",
    "React Native",
    "Flutter",
    "Xamarin",
    "SwiftUI",
    "Jetpack Compose",

    // Tools & Others
    "Git",
    "GitHub",
    "GitLab",
    "Jira",
    "Confluence",
    "Agile",
    "Scrum",
    "Kanban",
    "Slack",
    "Figma",
    "Adobe XD",
    "Photoshop",
    "Illustrator",
    "InVision",
    "Sketch",

    // Soft Skills
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Critical Thinking",
    "Leadership",
    "Time Management",
    "Adaptability",
    "Creativity",
    "Attention to Detail",
  ];

  // Extract skills from the description
  const foundSkills = [];
  commonSkills.forEach((skill) => {
    // Look for skills as whole words (not part of other words)
    const regex = new RegExp(
      "\\b" + skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
      "i"
    );
    if (regex.test(description)) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
}

// Utility to clean text (remove extra whitespace, etc.)
function cleanText(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}
