import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  exchangeCodeForTokens,
  createEmailIntegration,
} from "@/services/emailService";
import { EmailProvider, GMAIL_OAUTH_CONFIG } from "@/types/email";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function EmailCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing your authentication...");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check for environment variables
  const checkEnvironmentVariables = () => {
    // Check if Gmail client ID is configured
    const gmailClientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
    const hasGmailClientId = !!gmailClientId;

    return {
      hasGmailClientId,
      redirectUri: window.location.origin + "/auth/gmail/callback",
      origin: window.location.origin,
    };
  };

  useEffect(() => {
    const processAuth = async () => {
      // Extract provider and code from URL
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Determine provider from URL path
      const provider = location.pathname.includes("gmail")
        ? ("gmail" as EmailProvider)
        : ("outlook" as EmailProvider);

      // Check environment variables
      const envCheck = checkEnvironmentVariables();

      // Log detailed information for debugging
      console.log("OAuth Callback Debug:");
      console.log("- Provider:", provider);
      console.log("- Code present:", Boolean(code));
      console.log("- Error:", error);
      console.log("- Error description:", errorDescription);
      console.log("- Current origin:", window.location.origin);
      console.log("- Expected callback path:", `/auth/${provider}/callback`);
      console.log(
        "- Full callback URL:",
        `${window.location.origin}/auth/${provider}/callback`
      );

      // Set debug info
      setDebugInfo(
        `Provider: ${provider}
Code present: ${Boolean(code)}
User logged in: ${Boolean(user?.id)}
Gmail Client ID configured: ${envCheck.hasGmailClientId}
Redirect URI used: ${envCheck.redirectUri}
Current origin: ${envCheck.origin}
Error: ${error || "None"}
Error description: ${errorDescription || "None"}`
      );

      // Handle redirect_uri_mismatch error specifically
      if (error === "redirect_uri_mismatch") {
        setStatus("error");
        setMessage(`Authentication error: Redirect URI mismatch. 
The redirect URI in your OAuth request (${window.location.origin}/auth/${provider}/callback) 
doesn't match what you've configured in your Google Cloud Console.`);

        // Add detailed advice to debug info
        setDebugInfo(
          (prev) => `${prev}

SOLUTION:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add this exact URI to the "Authorized redirect URIs":
   ${window.location.origin}/auth/${provider}/callback
4. Save changes and try again
5. Alternatively, modify your app code to use the URI that's already authorized`
        );

        return;
      }

      // Handle other errors from OAuth provider
      if (error) {
        setStatus("error");
        setMessage(
          `Authentication error: ${error}${
            errorDescription ? ` - ${errorDescription}` : ""
          }`
        );
        return;
      }

      // Handle missing code
      if (!code) {
        setStatus("error");
        setMessage("No authentication code received");
        return;
      }

      // Handle missing user
      if (!user?.id) {
        setStatus("error");
        setMessage("You must be logged in to connect your email");
        return;
      }

      try {
        // Check client ID before proceeding
        if (provider === "gmail" && !envCheck.hasGmailClientId) {
          throw new Error(
            "Gmail OAuth client ID is not configured in environment variables"
          );
        }

        // Exchange the code for access tokens
        const tokenData = await exchangeCodeForTokens(provider, code);

        // Create the email integration in our database
        await createEmailIntegration(
          user.id,
          provider,
          tokenData.email,
          tokenData.accessToken,
          tokenData.refreshToken,
          tokenData.expiresIn
        );

        setStatus("success");
        setMessage(
          `Successfully connected ${
            provider === "gmail" ? "Gmail" : "Outlook"
          } account: ${tokenData.email}`
        );

        // Navigate back after a short delay
        setTimeout(() => {
          navigate("/settings/integrations");
        }, 2000);
      } catch (error: any) {
        console.error("Error connecting email:", error);
        setStatus("error");
        setMessage(
          `Failed to connect email: ${error.message || "Unknown error"}`
        );
        // Add detailed error info
        if (
          error.message &&
          error.message.includes("Failed to exchange code")
        ) {
          setDebugInfo(
            (prev) =>
              prev +
              "\n\nOAuth token exchange failed. This often happens when the client ID is invalid or missing, or when redirect URIs don't match."
          );
        }
      }
    };

    processAuth();
  }, [location, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {status === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}

          {status === "success" && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}

          {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}

          <h1 className="text-2xl font-bold">Email Integration</h1>
          <p className="text-gray-600">{message}</p>

          {debugInfo && status === "error" && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-left w-full overflow-x-auto">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Debug Information
                  </p>
                  <pre className="text-xs text-amber-700 mt-1 whitespace-pre-wrap">
                    {debugInfo}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <button
              className="mt-4 px-4 py-2 rounded bg-primary text-white"
              onClick={() => navigate("/settings/integrations")}
            >
              Return to Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
