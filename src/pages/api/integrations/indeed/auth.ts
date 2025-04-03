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
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate a random state value to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);

    // Store the state in the session or a secure cookie
    // For this example, we'll redirect with it and verify it in the callback

    // Construct the authorization URL
    const authUrl = new URL("https://secure.indeed.com/oauth/v2/authorize");
    authUrl.searchParams.append("client_id", INDEED_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", INDEED_REDIRECT_URI);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "email jobs_applied");

    // Redirect the user to the Indeed authorization page
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Indeed auth:", error);
    res.status(500).json({ error: "Failed to initiate authorization" });
  }
}
