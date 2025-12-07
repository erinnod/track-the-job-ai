export type EmailProvider = "gmail" | "outlook" | "other";

export type EmailJobStatus =
  | "applied"
  | "interview"
  | "rejected"
  | "offer"
  | null;

export interface EmailIntegration {
  id: string;
  userId: string;
  provider: EmailProvider;
  emailAddress: string;
  isActive: boolean;
  lastSyncTime?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedEmail {
  id: string;
  userId: string;
  integrationId: string;
  emailId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  snippet?: string;
  bodyText?: string;
  jobApplicationId?: string;
  parsedStatus: EmailJobStatus;
  createdAt: string;
}

export interface EmailNotificationSettings {
  id: string;
  userId: string;
  notifyOnNewEmails: boolean;
  notifyOnStatusChange: boolean;
  dailyDigest: boolean;
  updatedAt: string;
}

// OAuth configuration types
export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
}

// Helper function to determine the correct redirect URI based on the environment
// This helps address common redirect_uri_mismatch errors
const getRedirectUri = (path: string): string => {
  const origin = window.location.origin;

  // For development environments, you may need to hardcode the redirect URI
  // to match exactly what's configured in Google Cloud Console
  if (origin.includes("localhost")) {
    // IMPORTANT: Update these values to match your Google Cloud Console configuration
    const AUTHORIZED_REDIRECT_URIS = {
      gmail: [
        "http://localhost:8080/auth/gmail/callback", // Changed to only use port 8080
      ],
      outlook: [
        "http://localhost:8080/auth/outlook/callback", // Changed to only use port 8080
      ],
    };

    // Choose the appropriate redirect URI based on the provider
    if (path.includes("gmail")) {
      console.log(
        "Using hardcoded Gmail redirect URI:",
        AUTHORIZED_REDIRECT_URIS.gmail[0]
      );
      return AUTHORIZED_REDIRECT_URIS.gmail[0];
    } else if (path.includes("outlook")) {
      console.log(
        "Using hardcoded Outlook redirect URI:",
        AUTHORIZED_REDIRECT_URIS.outlook[0]
      );
      return AUTHORIZED_REDIRECT_URIS.outlook[0];
    }
  }

  // For production or if none of the above matches, use the dynamic URI
  const dynamicUri = `${origin}${path}`;
  console.log("Using dynamic redirect URI:", dynamicUri);
  return dynamicUri;
};

export const GMAIL_OAUTH_CONFIG: OAuthConfig = {
  clientId: import.meta.env.VITE_GMAIL_CLIENT_ID || "",
  redirectUri: getRedirectUri("/auth/gmail/callback"),
  scope: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
};

export const OUTLOOK_OAUTH_CONFIG: OAuthConfig = {
  clientId: import.meta.env.VITE_OUTLOOK_CLIENT_ID || "",
  redirectUri: getRedirectUri("/auth/outlook/callback"),
  scope: ["Mail.Read", "User.Read"],
  authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
};

// NLP related types
export interface EmailParseResult {
  status?: EmailJobStatus;
  confidence: number;
  companyName?: string;
  position?: string;
  date?: string;
  relatedJobId?: string;
}

// Keywords for NLP-based email parsing
export const STATUS_KEYWORDS = {
  applied: [
    "application received",
    "thank you for applying",
    "confirmation",
    "application submitted",
  ],
  interview: [
    "interview",
    "meeting",
    "schedule",
    "discuss your application",
    "next steps",
    "meet the team",
  ],
  rejected: [
    "unfortunately",
    "not moving forward",
    "not selected",
    "other candidates",
    "regret",
    "not proceeding",
  ],
  offer: [
    "congratulations",
    "job offer",
    "pleased to offer",
    "formal offer",
    "welcome to the team",
    "salary",
    "compensation",
  ],
};
