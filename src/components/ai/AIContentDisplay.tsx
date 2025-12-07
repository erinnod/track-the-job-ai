/**
 * AIContentDisplay Component (Coming Soon)
 *
 * This component currently displays a coming soon message for AI-generated content.
 * Once implemented, it will render formatted AI-generated content like job recommendations,
 * cover letters, and resume improvements.
 */

import React from "react";
import AIComingSoon from "./AIComingSoon";

interface AIContentDisplayProps {
  content?: string;
  type?: "coverLetter" | "resume" | "jobRecommendation";
  isLoading?: boolean;
  modelUsed?: string;
}

const AIContentDisplay: React.FC<AIContentDisplayProps> = ({
  content,
  type = "coverLetter",
  isLoading = false,
  modelUsed,
}) => {
  // Display titles based on content type
  const typeToTitle = {
    coverLetter: "AI Cover Letter",
    resume: "AI Tailored Resume",
    jobRecommendation: "AI Job Recommendations",
  };

  const title = typeToTitle[type];

  // Display descriptions based on content type
  const typeToDescription = {
    coverLetter:
      "Our AI cover letter generator is coming soon. This feature will create personalized cover letters tailored to your resume and job applications.",
    resume:
      "Our AI resume tailoring tool is coming soon. This feature will analyze job descriptions and customize your resume to highlight relevant skills and experience.",
    jobRecommendation:
      "Our AI job recommendation tool is coming soon. This feature will analyze your skills and preferences to suggest relevant job opportunities that match your profile.",
  };

  // For now, always show the coming soon component
  return (
    <AIComingSoon
      title={title}
      description={typeToDescription[type]}
      featureName={title}
      showNotifyButton={true}
    />
  );
};

export default AIContentDisplay;
