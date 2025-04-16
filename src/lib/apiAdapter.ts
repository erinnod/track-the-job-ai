/**
 * API adapter to handle API routes in Vite+React app
 *
 * Since we're using Vite and React Router instead of Next.js,
 * we need a way to handle API routes. This file provides a simple
 * adapter that proxies requests to external services.
 */

import { supabase } from "./supabase";
import {
  storeIntegration,
  syncAllIntegrations,
} from "@/services/integrationService";

// Handler types
type ApiRequest = {
  method: string;
  query: Record<string, string>;
  body: any;
  headers: Headers;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
  redirect: (url: string) => void;
};

type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void>;

// API handlers
const handlers: Record<string, ApiHandler> = {
  // Indeed auth
  "/api/integrations/indeed/auth": async (req, res) => {
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate that credentials are set
    const clientId = import.meta.env.VITE_INDEED_CLIENT_ID;
    if (
      !clientId ||
      clientId.includes("REPLACE_WITH_YOUR") ||
      clientId === "" ||
      clientId === "your_indeed_client_id"
    ) {
      return res.status(500).json({
        error:
          "Indeed API credentials not configured. Set up your API credentials in the .env file or use the manual import option.",
      });
    }

    // Generate a random state value to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);

    // Construct the authorization URL
    const authUrl = new URL("https://secure.indeed.com/oauth/v2/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append(
      "redirect_uri",
      import.meta.env.VITE_INDEED_REDIRECT_URI
    );
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "email jobs_applied");

    // Redirect the user to the Indeed authorization page
    res.redirect(authUrl.toString());
  },

  // Indeed callback
  "/api/integrations/indeed/callback": async (req, res) => {
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the authorization code from the request
    const { code } = req.query;
    if (!code) {
      res.redirect("/settings/integrations?status=error&provider=indeed");
      return;
    }

    try {
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
            client_id: import.meta.env.VITE_INDEED_CLIENT_ID,
            client_secret: import.meta.env.VITE_INDEED_CLIENT_SECRET,
            redirect_uri: import.meta.env.VITE_INDEED_REDIRECT_URI,
            code: code,
          }),
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange code: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokenData;

      // Store the integration in the database
      await storeIntegration(
        session.user.id,
        "indeed",
        access_token,
        refresh_token,
        expires_in
      );

      // Redirect back to the integrations page
      res.redirect("/settings/integrations?status=success&provider=indeed");
    } catch (error) {
      console.error("Error handling Indeed callback:", error);
      res.redirect("/settings/integrations?status=error&provider=indeed");
    }
  },

  // LinkedIn auth
  "/api/integrations/linkedin/auth": async (req, res) => {
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate that credentials are set
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    if (
      !clientId ||
      clientId === "your_linkedin_client_id" ||
      clientId.includes("REPLACE_WITH_YOUR") ||
      clientId === ""
    ) {
      return res.status(500).json({
        error:
          "LinkedIn API credentials not configured. Set up your API credentials in the .env file or use the manual import option.",
      });
    }

    // Generate a random state value to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);

    // Construct the authorization URL
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append(
      "redirect_uri",
      import.meta.env.VITE_LINKEDIN_REDIRECT_URI
    );
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append(
      "scope",
      "r_emailaddress r_liteprofile r_fullprofile r_1st_connections_size r_ads r_ads_reporting w_member_social r_basicprofile"
    );

    // Redirect the user to the LinkedIn authorization page
    res.redirect(authUrl.toString());
  },

  // LinkedIn callback
  "/api/integrations/linkedin/callback": async (req, res) => {
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the authorization code from the request
    const { code } = req.query;
    if (!code) {
      res.redirect("/settings/integrations?status=error&provider=linkedin");
      return;
    }

    try {
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
            client_id: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
            client_secret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET,
            redirect_uri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI,
            code: code,
          }),
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange code: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const { access_token, expires_in } = tokenData;
      // LinkedIn doesn't provide a refresh token in the basic OAuth flow
      const refresh_token = "";

      // Store the integration in the database
      await storeIntegration(
        session.user.id,
        "linkedin",
        access_token,
        refresh_token,
        expires_in
      );

      // Redirect back to the integrations page
      res.redirect("/settings/integrations?status=success&provider=linkedin");
    } catch (error) {
      console.error("Error handling LinkedIn callback:", error);
      res.redirect("/settings/integrations?status=error&provider=linkedin");
    }
  },

  // Sync integrations
  "/api/integrations/sync": async (req, res) => {
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Use our actual sync function with real API calls
      const result = await syncAllIntegrations(session.user.id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error syncing integrations:", error);
      res.status(500).json({
        success: false,
        imported: 0,
        message: "Error syncing integrations",
      });
    }
  },
};

// API request handler
export const handleApiRequest = async (
  path: string,
  options: RequestInit = {}
) => {
  const handler = handlers[path];

  if (!handler) {
    throw new Error(`No handler found for path: ${path}`);
  }

  // Parse options
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body as string) : null;
  const headers = new Headers(options.headers || {});

  // Parse query parameters from path
  const url = new URL(path, window.location.origin);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Create request and response objects
  const req: ApiRequest = { method, body, headers, query };

  let statusCode = 200;
  let responseData: any = null;
  let redirectUrl: string | null = null;

  const res: ApiResponse = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
    redirect: (url) => {
      redirectUrl = url;
    },
  };

  // Execute handler
  await handler(req, res);

  // Handle redirect
  if (redirectUrl) {
    window.location.href = redirectUrl;
    // Return a promise that never resolves since we're redirecting
    return new Promise(() => {});
  }

  // Return response
  if (responseData) {
    return {
      ok: statusCode >= 200 && statusCode < 300,
      status: statusCode,
      json: async () => responseData,
    };
  }

  return {
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
  };
};

// API route wrapper
export const fetchFromApi = async (path: string, options: RequestInit = {}) => {
  try {
    // Use our API adapter
    return await handleApiRequest(path, options);
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};
