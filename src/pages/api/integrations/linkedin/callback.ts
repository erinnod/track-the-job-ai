import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { storeIntegration } from "@/services/integrationService";

// These would be stored in environment variables in production
const LINKEDIN_CLIENT_ID =
  process.env.LINKEDIN_CLIENT_ID || "your_linkedin_client_id";
const LINKEDIN_CLIENT_SECRET =
  process.env.LINKEDIN_CLIENT_SECRET || "your_linkedin_client_secret";
const LINKEDIN_REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI ||
  "http://localhost:3000/api/integrations/linkedin/callback";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the authorization code and state from the request
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // In a real implementation, you would validate the state parameter
    // against the one you stored during the authorization request

    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
          redirect_uri: LINKEDIN_REDIRECT_URI,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Failed to exchange code: ${JSON.stringify(errorData)}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;
    // LinkedIn doesn't provide a refresh token in the basic OAuth flow
    const refresh_token = "";

    // Store the integration in the database
    const integration = await storeIntegration(
      session.user.id,
      "linkedin",
      access_token,
      refresh_token,
      expires_in
    );

    if (!integration) {
      throw new Error("Failed to store integration");
    }

    // Redirect back to the integrations page
    res.redirect("/settings/integrations?status=success&provider=linkedin");
  } catch (error) {
    console.error("Error handling LinkedIn callback:", error);
    res.redirect("/settings/integrations?status=error&provider=linkedin");
  }
}
