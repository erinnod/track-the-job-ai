import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

// These would be stored in environment variables in production
const LINKEDIN_CLIENT_ID =
  process.env.LINKEDIN_CLIENT_ID || "your_linkedin_client_id";
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
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate a random state value to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);

    // Construct the authorization URL
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", LINKEDIN_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append(
      "scope",
      "r_emailaddress r_liteprofile w_member_social"
    );

    // Redirect the user to the LinkedIn authorization page
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating LinkedIn auth:", error);
    res.status(500).json({ error: "Failed to initiate authorization" });
  }
}
