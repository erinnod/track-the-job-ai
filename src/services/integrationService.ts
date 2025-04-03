import { supabase } from "@/lib/supabase";
import { createApplicationNotification } from "@/utils/notificationUtils";

// Define integration types
export type IntegrationType = "indeed" | "linkedin";

// Integration data structure
export interface Integration {
  id: string;
  user_id: string;
  type: IntegrationType;
  access_token: string;
  refresh_token: string;
  expires_at: string | Date;
  created_at: string | Date;
  last_synced_at: string | Date | null;
  is_active: boolean;
}

// Job application from external source
export interface ExternalJobApplication {
  external_id: string;
  platform: IntegrationType;
  company: string;
  position: string;
  location?: string;
  url?: string;
  applied_date: Date;
  status: string;
}

/**
 * Store a new integration for a user
 */
export const storeIntegration = async (
  userId: string,
  type: IntegrationType,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<Integration | null> => {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    const { data, error } = await supabase
      .from("user_integrations")
      .insert({
        user_id: userId,
        type,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return data as unknown as Integration;
  } catch (error) {
    console.error(`Error storing ${type} integration:`, error);
    return null;
  }
};

/**
 * Get active integrations for a user
 */
export const getUserIntegrations = async (
  userId: string
): Promise<Integration[]> => {
  try {
    const { data, error } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw error;
    return data as unknown as Integration[];
  } catch (error) {
    console.error("Error fetching user integrations:", error);
    return [];
  }
};

/**
 * Sync jobs from Indeed
 */
export const syncIndeedJobs = async (
  userId: string,
  accessToken: string
): Promise<ExternalJobApplication[]> => {
  try {
    // Make a real API call to Indeed's applied jobs endpoint
    const response = await fetch(
      "https://apis.indeed.com/oauth/v2/applied-jobs",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Indeed API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Indeed's API response into ExternalJobApplication objects
    // The actual response format would need to be adjusted based on Indeed's API docs
    return data.jobs.map((job: any) => ({
      external_id: `indeed_${job.id}`,
      platform: "indeed",
      company: job.company,
      position: job.title,
      location: job.location,
      url: job.url,
      applied_date: new Date(job.dateApplied),
      status: "applied", // Indeed might provide a different status format
    }));
  } catch (error) {
    console.error("Error syncing Indeed jobs:", error);
    return [];
  }
};

/**
 * Sync jobs from LinkedIn
 */
export const syncLinkedInJobs = async (
  userId: string,
  accessToken: string
): Promise<ExternalJobApplication[]> => {
  try {
    const jobs: ExternalJobApplication[] = [];

    // 1. Fetch applied jobs using the applications history endpoint
    try {
      const appliedResponse = await fetch(
        "https://api.linkedin.com/v2/jobApplications?q=jobSeeker",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            Accept: "application/json",
          },
        }
      );

      if (appliedResponse.ok) {
        const appliedData = await appliedResponse.json();

        // Map applied jobs to our format
        const appliedJobs =
          appliedData.elements?.map((application: any) => ({
            external_id: `linkedin_applied_${application.entityUrn
              .split(":")
              .pop()}`,
            platform: "linkedin",
            company:
              application.companyDetails?.companyName || "Unknown Company",
            position: application.jobPostingInfo?.title || "Unknown Position",
            location: application.jobPostingInfo?.formattedLocation || "",
            url: `https://www.linkedin.com/jobs/view/${application.jobPostingInfo?.jobPostingId}`,
            applied_date: new Date(application.applicationDate),
            status: "applied",
          })) || [];

        jobs.push(...appliedJobs);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn applied jobs:", error);
    }

    // 2. Fetch saved jobs using the saved jobs endpoint
    try {
      const savedResponse = await fetch(
        "https://api.linkedin.com/v2/savedJobs?q=jobSeeker",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            Accept: "application/json",
          },
        }
      );

      if (savedResponse.ok) {
        const savedData = await savedResponse.json();

        // Map saved jobs to our format
        const savedJobs =
          savedData.elements?.map((saved: any) => ({
            external_id: `linkedin_saved_${saved.entityUrn.split(":").pop()}`,
            platform: "linkedin",
            company:
              saved.jobPosting?.companyDetails?.companyName ||
              "Unknown Company",
            position: saved.jobPosting?.title || "Unknown Position",
            location: saved.jobPosting?.formattedLocation || "",
            url: `https://www.linkedin.com/jobs/view/${saved.jobPosting?.id}`,
            applied_date: new Date(), // Use current date for saved jobs
            status: "saved", // Use "saved" as status for saved jobs
          })) || [];

        jobs.push(...savedJobs);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn saved jobs:", error);
    }

    return jobs;
  } catch (error) {
    console.error("Error syncing LinkedIn jobs:", error);
    return [];
  }
};

/**
 * Import external job applications into the system
 */
export const importExternalJobs = async (
  userId: string,
  jobs: ExternalJobApplication[]
): Promise<number> => {
  let importedCount = 0;

  try {
    // First, get existing external IDs to avoid duplicates
    const { data: existingJobs } = await supabase
      .from("job_applications")
      .select("external_id")
      .eq("user_id", userId)
      .not("external_id", "is", null);

    const existingExternalIds =
      existingJobs?.map((job) => job.external_id) || [];

    // Filter out jobs that are already imported
    const newJobs = jobs.filter(
      (job) => !existingExternalIds.includes(job.external_id)
    );

    for (const job of newJobs) {
      // Convert 'saved' status to 'bookmarked' or other appropriate status in your system
      const jobStatus = job.status === "saved" ? "bookmarked" : job.status;

      // Insert the job into the database
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          user_id: userId,
          company: job.company,
          position: job.position,
          location: job.location || null,
          status: jobStatus,
          applied_date: job.applied_date.toISOString(),
          last_updated: new Date().toISOString(),
          external_id: job.external_id,
          external_url: job.url || null,
          external_platform: job.platform,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error importing job:", error);
        continue;
      }

      // Only create notification for applied jobs, not saved/bookmarked
      if (jobStatus === "applied") {
        // Create notification for the imported job
        await createApplicationNotification(userId, job.company, job.position);
      }

      importedCount++;
    }

    return importedCount;
  } catch (error) {
    console.error("Error importing external jobs:", error);
    return importedCount;
  }
};

/**
 * Sync all active integrations for a user
 */
export const syncAllIntegrations = async (
  userId: string
): Promise<{
  success: boolean;
  imported: number;
  message: string;
}> => {
  try {
    // Get user's active integrations
    const integrations = await getUserIntegrations(userId);

    if (integrations.length === 0) {
      return {
        success: false,
        imported: 0,
        message: "No active integrations found",
      };
    }

    let totalImported = 0;

    // Process each integration
    for (const integration of integrations) {
      let jobs: ExternalJobApplication[] = [];

      // Get jobs from the appropriate platform
      switch (integration.type) {
        case "indeed":
          jobs = await syncIndeedJobs(userId, integration.access_token);
          break;
        case "linkedin":
          jobs = await syncLinkedInJobs(userId, integration.access_token);
          break;
      }

      // Import the jobs
      const imported = await importExternalJobs(userId, jobs);
      totalImported += imported;

      // Update last_synced_at timestamp
      await supabase
        .from("user_integrations")
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);
    }

    return {
      success: true,
      imported: totalImported,
      message: `Successfully imported ${totalImported} jobs from ${integrations.length} integration(s)`,
    };
  } catch (error) {
    console.error("Error syncing integrations:", error);
    return {
      success: false,
      imported: 0,
      message: "Error syncing integrations",
    };
  }
};

/**
 * Create a mock integration for development purposes
 * This allows testing the UI without needing real API credentials
 */
export const createMockIntegration = async (
  userId: string,
  type: IntegrationType
): Promise<Integration | null> => {
  try {
    // Check if the integration already exists
    const { data: existingIntegrations } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("is_active", true);

    // If it already exists, return it
    if (existingIntegrations && existingIntegrations.length > 0) {
      return existingIntegrations[0] as unknown as Integration;
    }

    // Create a mock integration
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Set expiry to 1 year from now

    const { data, error } = await supabase
      .from("user_integrations")
      .insert({
        user_id: userId,
        type,
        access_token: `mock_token_${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        refresh_token: `mock_refresh_${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return data as unknown as Integration;
  } catch (error) {
    console.error(`Error creating mock ${type} integration:`, error);
    return null;
  }
};
