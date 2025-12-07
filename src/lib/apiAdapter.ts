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
import {
  sanitizeInput,
  sanitizeNumericInput,
  isSafeUrl,
} from "@/utils/security";

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

/**
 * Validate and clean job data to prevent injection attacks
 * @param data Raw job data from user input
 * @returns Sanitized job data
 */
export const validateAndCleanJobData = (data: any) => {
  if (!data) return null;

  // Create a new object with only allowed fields and sanitized values
  const cleanedData: any = {};

  // Define allowed fields and their validation/sanitization rules
  const allowedFields = {
    title: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 200) : null,
    company: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 100) : null,
    location: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 100) : null,
    description: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 5000) : null,
    job_type: (val: any) =>
      [
        "full-time",
        "part-time",
        "contract",
        "temporary",
        "internship",
        "other",
      ].includes(val)
        ? val
        : null,
    salary: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 50) : null,
    application_date: (val: any) => {
      // Validate date format (YYYY-MM-DD)
      if (typeof val !== "string") return null;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(val) ? val : null;
    },
    status: (val: any) =>
      [
        "applied",
        "interview",
        "offer",
        "rejected",
        "accepted",
        "saved",
      ].includes(val)
        ? val
        : null,
    notes: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 2000) : null,
    url: (val: any) =>
      typeof val === "string" && isSafeUrl(val)
        ? sanitizeInput(val).substring(0, 500)
        : null,
    contact_name: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 100) : null,
    contact_email: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 100) : null,
    contact_phone: (val: any) =>
      typeof val === "string" ? sanitizeInput(val).substring(0, 20) : null,
    interview_date: (val: any) => {
      // Validate date format (YYYY-MM-DD)
      if (typeof val !== "string") return null;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(val) ? val : null;
    },
    priority: (val: any) =>
      ["low", "medium", "high"].includes(val) ? val : null,
    user_id: (val: any) => (typeof val === "string" ? val : null), // User IDs should already be validated by Supabase
  };

  // Apply validation rules to each field
  for (const [field, validator] of Object.entries(allowedFields)) {
    if (field in data) {
      const cleaned = validator(data[field]);
      // Only include non-null values
      if (cleaned !== null) {
        cleanedData[field] = cleaned;
      }
    }
  }

  return cleanedData;
};

/**
 * Create a new job with proper validation
 * @param jobData Job data to save
 * @returns Result of the operation
 */
export const createJob = async (jobData: any) => {
  try {
    // Validate and clean job data
    const cleanedData = validateAndCleanJobData(jobData);

    if (!cleanedData) {
      throw new Error("Invalid job data");
    }

    // Ensure required fields are present
    if (!cleanedData.title || !cleanedData.user_id) {
      throw new Error("Missing required fields");
    }

    // Use parameterized query through Supabase
    const { data, error } = await supabase
      .from("jobs")
      .insert(cleanedData)
      .select();

    if (error) {
      console.error("Error creating job:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Job creation failed:", error);
    return { success: false, error: error.message || "Failed to create job" };
  }
};

/**
 * Update a job with proper validation
 * @param jobId ID of the job to update
 * @param jobData New job data
 * @returns Result of the operation
 */
export const updateJob = async (jobId: string, jobData: any) => {
  try {
    // Validate ID
    if (!jobId || typeof jobId !== "string") {
      throw new Error("Invalid job ID");
    }

    // Validate and clean job data
    const cleanedData = validateAndCleanJobData(jobData);

    if (!cleanedData || Object.keys(cleanedData).length === 0) {
      throw new Error("Invalid job data");
    }

    // Use parameterized query through Supabase
    const { data, error } = await supabase
      .from("jobs")
      .update(cleanedData)
      .eq("id", jobId)
      .select();

    if (error) {
      console.error("Error updating job:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Job update failed:", error);
    return { success: false, error: error.message || "Failed to update job" };
  }
};

/**
 * Delete a job with proper validation
 * @param jobId ID of the job to delete
 * @returns Result of the operation
 */
export const deleteJob = async (jobId: string) => {
  try {
    // Validate ID
    if (!jobId || typeof jobId !== "string") {
      throw new Error("Invalid job ID");
    }

    // Use parameterized query through Supabase
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      console.error("Error deleting job:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Job deletion failed:", error);
    return { success: false, error: error.message || "Failed to delete job" };
  }
};

/**
 * Get a job by ID with proper validation
 * @param jobId ID of the job to retrieve
 * @returns The job data
 */
export const getJobById = async (jobId: string) => {
  try {
    // Validate ID
    if (!jobId || typeof jobId !== "string") {
      throw new Error("Invalid job ID");
    }

    // Use parameterized query through Supabase
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Job fetch failed:", error);
    return { success: false, error: error.message || "Failed to fetch job" };
  }
};

/**
 * Get jobs for a user with validation and pagination
 * @param userId ID of the user to get jobs for
 * @param options Pagination and filter options
 * @returns List of jobs
 */
export const getJobsForUser = async (userId: string, options: any = {}) => {
  try {
    // Validate user ID
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID");
    }

    // Validate and sanitize pagination options
    const limit =
      sanitizeNumericInput(options.limit, { min: 1, max: 100 }) || 50;
    const page = sanitizeNumericInput(options.page, { min: 1 }) || 1;
    const offset = (page - 1) * limit;

    // Build the query with parameterized values
    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("application_date", { ascending: false });

    // Apply filters if provided
    if (options.status && typeof options.status === "string") {
      // Validate status
      const validStatuses = [
        "applied",
        "interview",
        "offer",
        "rejected",
        "accepted",
        "saved",
      ];
      if (validStatuses.includes(options.status)) {
        query = query.eq("status", options.status);
      }
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }

    return {
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  } catch (error) {
    console.error("Jobs fetch failed:", error);
    return { success: false, error: error.message || "Failed to fetch jobs" };
  }
};

/**
 * Search jobs with proper validation
 * @param userId User ID to search jobs for
 * @param searchTerm Term to search for
 * @param options Additional search options
 * @returns Search results
 */
export const searchJobs = async (
  userId: string,
  searchTerm: string,
  options: any = {}
) => {
  try {
    // Validate user ID
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID");
    }

    // Sanitize search term and prevent injection
    const sanitizedTerm = sanitizeInput(searchTerm);
    if (!sanitizedTerm) {
      return { success: true, data: [], count: 0 }; // Return empty result for empty search
    }

    // Validate and sanitize pagination options
    const limit =
      sanitizeNumericInput(options.limit, { min: 1, max: 100 }) || 50;
    const page = sanitizeNumericInput(options.page, { min: 1 }) || 1;
    const offset = (page - 1) * limit;

    // Use parameterized full-text search through Supabase
    // Note: This requires a text search index on the jobs table
    const { data, error, count } = await supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .textSearch("title", sanitizedTerm)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error searching jobs:", error);
      throw error;
    }

    return {
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  } catch (error) {
    console.error("Job search failed:", error);
    return { success: false, error: error.message || "Failed to search jobs" };
  }
};
