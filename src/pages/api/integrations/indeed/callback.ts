import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { storeIntegration } from "@/services/integrationService";

// These would be stored in environment variables in production
const INDEED_CLIENT_ID =
  process.env.INDEED_CLIENT_ID || "your_indeed_client_id";
const INDEED_CLIENT_SECRET =
  process.env.INDEED_CLIENT_SECRET || "your_indeed_client_secret";
const INDEED_REDIRECT_URI =
  process.env.INDEED_REDIRECT_URI ||
  "http://localhost:3000/api/integrations/indeed/callback";

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
      "https://apis.indeed.com/oauth/v2/tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: INDEED_CLIENT_ID,
          client_secret: INDEED_CLIENT_SECRET,
          redirect_uri: INDEED_REDIRECT_URI,
          code: code as string,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Failed to exchange code: ${JSON.stringify(errorData)}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Store the integration in the database
    const integration = await storeIntegration(
      session.user.id,
      "indeed",
      access_token,
      refresh_token,
      expires_in
    );

    if (!integration) {
      throw new Error("Failed to store integration");
    }

    // Redirect back to the integrations page
    res.redirect("/settings/integrations?status=success&provider=indeed");
  } catch (error) {
    console.error("Error handling Indeed callback:", error);
    res.redirect("/settings/integrations?status=error&provider=indeed");
  }
}
