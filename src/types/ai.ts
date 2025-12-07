export type AIContentType = "cover_letter" | "resume" | "job_recommendation";

export interface AIGeneratedContent {
  id: string;
  userId: string;
  contentType: AIContentType;
  title: string;
  content: string;
  sourceDocumentId?: string;
  jobApplicationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIFeaturePrice {
  coverLetter: number; // £3
  resumeTailoring: number; // £3
  jobRecommendation: number; // £2
}

export const AI_FEATURE_PRICES: AIFeaturePrice = {
  coverLetter: 3,
  resumeTailoring: 3,
  jobRecommendation: 2,
};

export interface ResumeGenerationOptions {
  targetJobTitle?: string;
  targetCompany?: string;
  targetJobDescription?: string;
  highlightSkills?: string[];
  tone?: "professional" | "casual" | "confident";
}

export interface CoverLetterGenerationOptions {
  jobApplicationId?: string;
  resumeId?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  highlightExperience?: string[];
  tone?: "professional" | "enthusiastic" | "formal";
}

export interface JobRecommendationOptions {
  baseJobTitle?: string;
  desiredLocation?: string;
  preferredIndustries?: string[];
  skills?: string[];
  experienceLevel?: string;
  recentApplications?: string[];
}

export interface ParsedEmail {
  id: string;
  userId: string;
  emailSubject: string;
  emailSender: string;
  emailContent: string;
  parsedCompany?: string;
  parsedPosition?: string;
  parsedDate?: string;
  jobApplicationId?: string;
  createdAt: string;
  parsedStatus: boolean;
}
