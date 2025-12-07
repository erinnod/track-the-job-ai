import { supabase } from "@/lib/supabase";
import {
  EmailIntegration,
  EmailProvider,
  OAuthConfig,
  TrackedEmail,
  EmailNotificationSettings,
  GMAIL_OAUTH_CONFIG,
  OUTLOOK_OAUTH_CONFIG,
  EmailParseResult,
  STATUS_KEYWORDS,
  EmailJobStatus,
} from "@/types/email";

// Convert DB row to frontend format
export const mapEmailIntegrationFromDB = (
  dbIntegration: any
): EmailIntegration => ({
  id: dbIntegration.id,
  userId: dbIntegration.user_id,
  provider: dbIntegration.provider as EmailProvider,
  emailAddress: dbIntegration.email_address,
  isActive: dbIntegration.is_active,
  lastSyncTime: dbIntegration.last_sync_time,
  accessToken: dbIntegration.access_token,
  refreshToken: dbIntegration.refresh_token,
  tokenExpiresAt: dbIntegration.token_expires_at,
  createdAt: dbIntegration.created_at,
  updatedAt: dbIntegration.updated_at,
});

export const mapTrackedEmailFromDB = (dbEmail: any): TrackedEmail => ({
  id: dbEmail.id,
  userId: dbEmail.user_id,
  integrationId: dbEmail.integration_id,
  emailId: dbEmail.email_id,
  subject: dbEmail.subject,
  sender: dbEmail.sender,
  receivedAt: dbEmail.received_at,
  snippet: dbEmail.snippet,
  bodyText: dbEmail.body_text,
  jobApplicationId: dbEmail.job_application_id,
  parsedStatus: dbEmail.parsed_status,
  createdAt: dbEmail.created_at,
});

export const mapNotificationSettingsFromDB = (
  dbSettings: any
): EmailNotificationSettings => ({
  id: dbSettings.id,
  userId: dbSettings.user_id,
  notifyOnNewEmails: dbSettings.notify_on_new_emails,
  notifyOnStatusChange: dbSettings.notify_on_status_change,
  dailyDigest: dbSettings.daily_digest,
  updatedAt: dbSettings.updated_at,
});

// Fetch user's email integrations
export const fetchUserEmailIntegrations = async (
  userId: string
): Promise<EmailIntegration[]> => {
  try {
    const { data, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return data ? data.map(mapEmailIntegrationFromDB) : [];
  } catch (error) {
    console.error("Error fetching email integrations:", error);
    throw error;
  }
};

// Create a new email integration
export const createEmailIntegration = async (
  userId: string,
  provider: EmailProvider,
  emailAddress: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<EmailIntegration> => {
  try {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);

    const { data, error } = await supabase
      .from("email_integrations")
      .insert([
        {
          user_id: userId,
          provider,
          email_address: emailAddress,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expirationDate.toISOString(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create default notification settings if they don't exist
    await ensureNotificationSettings(userId);

    return mapEmailIntegrationFromDB(data);
  } catch (error) {
    console.error("Error creating email integration:", error);
    throw error;
  }
};

// Update an existing email integration
export const updateEmailIntegration = async (
  integrationId: string,
  updates: Partial<EmailIntegration>
): Promise<EmailIntegration> => {
  try {
    const { data, error } = await supabase
      .from("email_integrations")
      .update({
        email_address: updates.emailAddress,
        access_token: updates.accessToken,
        refresh_token: updates.refreshToken,
        token_expires_at: updates.tokenExpiresAt,
        is_active: updates.isActive,
        last_sync_time: updates.lastSyncTime,
      })
      .eq("id", integrationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapEmailIntegrationFromDB(data);
  } catch (error) {
    console.error("Error updating email integration:", error);
    throw error;
  }
};

// Delete an email integration
export const deleteEmailIntegration = async (
  integrationId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("email_integrations")
      .delete()
      .eq("id", integrationId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting email integration:", error);
    throw error;
  }
};

// Fetch tracked emails for user
export const fetchTrackedEmails = async (
  userId: string,
  limit: number = 50
): Promise<TrackedEmail[]> => {
  try {
    const { data, error } = await supabase
      .from("tracked_emails")
      .select("*")
      .eq("user_id", userId)
      .order("received_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data ? data.map(mapTrackedEmailFromDB) : [];
  } catch (error) {
    console.error("Error fetching tracked emails:", error);
    throw error;
  }
};

// Save a tracked email
export const saveTrackedEmail = async (
  userId: string,
  integrationId: string,
  emailData: {
    emailId: string;
    subject: string;
    sender: string;
    receivedAt: string;
    snippet?: string;
    bodyText?: string;
  }
): Promise<TrackedEmail> => {
  try {
    // First, parse the email to determine if it's job-related
    const parseResult = parseEmailContent(
      emailData.subject,
      emailData.bodyText || emailData.snippet || ""
    );

    // Only save if the confidence is above a threshold or it's explicitly job-related
    if (parseResult.confidence > 0.5 || parseResult.status) {
      const { data, error } = await supabase
        .from("tracked_emails")
        .insert([
          {
            user_id: userId,
            integration_id: integrationId,
            email_id: emailData.emailId,
            subject: emailData.subject,
            sender: emailData.sender,
            received_at: emailData.receivedAt,
            snippet: emailData.snippet,
            body_text: emailData.bodyText,
            parsed_status: parseResult.status,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const trackedEmail = mapTrackedEmailFromDB(data);

      // If we have a status and it matches a job application, update the job status
      if (parseResult.status && parseResult.relatedJobId) {
        await updateJobApplicationStatus(
          parseResult.relatedJobId,
          parseResult.status
        );
      }

      return trackedEmail;
    } else {
      throw new Error("Email not relevant to job applications");
    }
  } catch (error) {
    console.error("Error saving tracked email:", error);
    throw error;
  }
};

// Parse email content using basic NLP
export const parseEmailContent = (
  subject: string,
  bodyText: string
): EmailParseResult => {
  const combinedText = `${subject.toLowerCase()} ${bodyText.toLowerCase()}`;
  const result: EmailParseResult = {
    confidence: 0,
    status: null,
  };

  // Check for job status keywords
  Object.entries(STATUS_KEYWORDS).forEach(([status, keywords]) => {
    keywords.forEach((keyword) => {
      if (combinedText.includes(keyword.toLowerCase())) {
        result.confidence += 0.2;
        result.status = status as EmailJobStatus;
      }
    });
  });

  // Try to extract company name
  const companyRegex = /from\s+([A-Za-z0-9\s&]+)|([A-Za-z0-9\s&]+)\s+team/i;
  const companyMatch = bodyText.match(companyRegex);
  if (companyMatch) {
    result.companyName = (companyMatch[1] || companyMatch[2]).trim();
    result.confidence += 0.1;
  }

  // Try to extract position
  const positionRegex =
    /position of\s+([A-Za-z0-9\s&]+)|role of\s+([A-Za-z0-9\s&]+)/i;
  const positionMatch = bodyText.match(positionRegex);
  if (positionMatch) {
    result.position = (positionMatch[1] || positionMatch[2]).trim();
    result.confidence += 0.1;
  }

  return result;
};

// Update job application status based on email
export const updateJobApplicationStatus = async (
  jobId: string,
  status: EmailJobStatus
): Promise<void> => {
  if (!status) return;

  try {
    const { error } = await supabase
      .from("job_applications")
      .update({
        status,
        last_updated: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating job status:", error);
    throw error;
  }
};

// Get notification settings for user
export const getNotificationSettings = async (
  userId: string
): Promise<EmailNotificationSettings> => {
  try {
    const { data, error } = await supabase
      .from("email_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      throw error;
    }

    if (!data) {
      return await createNotificationSettings(userId);
    }

    return mapNotificationSettingsFromDB(data);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    throw error;
  }
};

// Ensure notification settings exist
export const ensureNotificationSettings = async (
  userId: string
): Promise<EmailNotificationSettings> => {
  try {
    const settings = await getNotificationSettings(userId);
    return settings;
  } catch (error) {
    return await createNotificationSettings(userId);
  }
};

// Create default notification settings
export const createNotificationSettings = async (
  userId: string
): Promise<EmailNotificationSettings> => {
  try {
    const { data, error } = await supabase
      .from("email_notification_settings")
      .insert([
        {
          user_id: userId,
          notify_on_new_emails: true,
          notify_on_status_change: true,
          daily_digest: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapNotificationSettingsFromDB(data);
  } catch (error) {
    console.error("Error creating notification settings:", error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (
  userId: string,
  settings: Partial<EmailNotificationSettings>
): Promise<EmailNotificationSettings> => {
  try {
    const { data, error } = await supabase
      .from("email_notification_settings")
      .update({
        notify_on_new_emails: settings.notifyOnNewEmails,
        notify_on_status_change: settings.notifyOnStatusChange,
        daily_digest: settings.dailyDigest,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapNotificationSettingsFromDB(data);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw error;
  }
};

// Get OAuth URL for a specific provider
export const getOAuthUrl = (provider: EmailProvider): string => {
  const config =
    provider === "gmail" ? GMAIL_OAUTH_CONFIG : OUTLOOK_OAUTH_CONFIG;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `${config.authUrl}?${params.toString()}`;
};

// Exchange OAuth code for tokens
export const exchangeCodeForTokens = async (
  provider: EmailProvider,
  code: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email: string;
}> => {
  try {
    console.log(
      `Starting token exchange for ${provider} with code present:`,
      !!code
    );
    const config =
      provider === "gmail" ? GMAIL_OAUTH_CONFIG : OUTLOOK_OAUTH_CONFIG;

    console.log(
      `Using client ID: ${config.clientId ? "Present (masked)" : "Missing!"}`
    );
    console.log(`Redirect URI: ${config.redirectUri}`);

    if (!config.clientId) {
      throw new Error(
        "Missing OAuth client ID. Please check your environment variables."
      );
    }

    // This would normally be a server-side operation to protect your client secret
    // For demo purposes, we're implementing it client-side
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        // Note: client_secret would be required in a real app but is omitted here
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed with status:", tokenResponse.status);
      console.error("Response text:", responseText);
      throw new Error(
        `Failed to exchange code for tokens: ${tokenResponse.status} ${
          responseText ? `- ${responseText}` : ""
        }`
      );
    }

    // Parse the JSON response, handling the case where it might not be valid JSON
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse token response as JSON:", e);
      throw new Error("Invalid response from authentication server");
    }

    if (!tokenData.access_token) {
      throw new Error("No access token returned from authentication server");
    }

    // Get user email from the API
    let email = "";

    if (provider === "gmail") {
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.email;
      } else {
        const errorText = await userInfoResponse.text();
        console.error("Failed to get user info:", errorText);
      }
    } else if (provider === "outlook") {
      const userInfoResponse = await fetch(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.mail || userInfo.userPrincipalName;
      } else {
        const errorText = await userInfoResponse.text();
        console.error("Failed to get user info:", errorText);
      }
    }

    if (!email) {
      console.warn("Could not retrieve email from user profile");
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || "", // Handle missing refresh token
      expiresIn: tokenData.expires_in || 3600, // Default to 1 hour if missing
      email,
    };
  } catch (error) {
    console.error(`Error exchanging code for ${provider} tokens:`, error);
    throw error;
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (
  provider: EmailProvider,
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> => {
  try {
    const config =
      provider === "gmail" ? GMAIL_OAUTH_CONFIG : OUTLOOK_OAUTH_CONFIG;

    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        // Note: client_secret would be required in a real app but is omitted here
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh access token");
    }

    const tokenData = await tokenResponse.json();

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    };
  } catch (error) {
    console.error(`Error refreshing ${provider} access token:`, error);
    throw error;
  }
};

// Fetch emails from Gmail
export const fetchGmailEmails = async (
  accessToken: string,
  maxResults: number = 10
): Promise<
  Array<{
    id: string;
    subject: string;
    sender: string;
    receivedAt: string;
    snippet: string;
    bodyText: string;
  }>
> => {
  try {
    // First get list of email IDs
    const listResponse = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error("Failed to fetch emails from Gmail");
    }

    const listData = await listResponse.json();
    const emailIds = listData.messages.map((msg: any) => msg.id);

    // Fetch details for each email
    const emails = await Promise.all(
      emailIds.map(async (id: string) => {
        const msgResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!msgResponse.ok) {
          throw new Error(`Failed to fetch email details for ID: ${id}`);
        }

        const msgData = await msgResponse.json();

        // Parse the email data
        const headers = msgData.payload.headers;
        const subject =
          headers.find((h: any) => h.name.toLowerCase() === "subject")?.value ||
          "";
        const from =
          headers.find((h: any) => h.name.toLowerCase() === "from")?.value ||
          "";
        const date =
          headers.find((h: any) => h.name.toLowerCase() === "date")?.value ||
          "";

        // Get the body text
        let bodyText = "";

        const getBodyText = (part: any) => {
          if (part.mimeType === "text/plain" && part.body.data) {
            return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }

          if (part.parts) {
            for (const subPart of part.parts) {
              const text = getBodyText(subPart);
              if (text) return text;
            }
          }

          return "";
        };

        bodyText = getBodyText(msgData.payload) || msgData.snippet || "";

        return {
          id: msgData.id,
          subject,
          sender: from,
          receivedAt: new Date(date).toISOString(),
          snippet: msgData.snippet || "",
          bodyText,
        };
      })
    );

    return emails;
  } catch (error) {
    console.error("Error fetching Gmail emails:", error);
    throw error;
  }
};

// Fetch emails from Outlook
export const fetchOutlookEmails = async (
  accessToken: string,
  maxResults: number = 10
): Promise<
  Array<{
    id: string;
    subject: string;
    sender: string;
    receivedAt: string;
    snippet: string;
    bodyText: string;
  }>
> => {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$select=id,subject,sender,receivedDateTime,bodyPreview,body`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch emails from Outlook");
    }

    const data = await response.json();

    return data.value.map((email: any) => ({
      id: email.id,
      subject: email.subject || "",
      sender: email.sender?.emailAddress?.address || "",
      receivedAt: email.receivedDateTime,
      snippet: email.bodyPreview || "",
      bodyText: email.body?.content || "",
    }));
  } catch (error) {
    console.error("Error fetching Outlook emails:", error);
    throw error;
  }
};

// Sync emails from all integrations
export const syncEmails = async (userId: string): Promise<number> => {
  try {
    // Get all active integrations
    const integrations = await fetchUserEmailIntegrations(userId);
    const activeIntegrations = integrations.filter((i) => i.isActive);

    if (activeIntegrations.length === 0) {
      return 0;
    }

    let totalProcessed = 0;

    // Process each integration
    for (const integration of activeIntegrations) {
      // Check if token needs refresh
      const now = new Date();
      const expiresAt = integration.tokenExpiresAt
        ? new Date(integration.tokenExpiresAt)
        : new Date(0);

      let accessToken = integration.accessToken || "";

      if (now >= expiresAt && integration.refreshToken) {
        // Refresh the access token
        const refreshResult = await refreshAccessToken(
          integration.provider,
          integration.refreshToken
        );

        accessToken = refreshResult.accessToken;

        // Update the integration with new token
        const expirationDate = new Date();
        expirationDate.setSeconds(
          expirationDate.getSeconds() + refreshResult.expiresIn
        );

        await updateEmailIntegration(integration.id, {
          accessToken,
          tokenExpiresAt: expirationDate.toISOString(),
        });
      }

      // Fetch emails based on provider
      let emails;
      if (integration.provider === "gmail") {
        emails = await fetchGmailEmails(accessToken);
      } else if (integration.provider === "outlook") {
        emails = await fetchOutlookEmails(accessToken);
      } else {
        continue; // Skip unknown providers
      }

      // Save relevant emails
      for (const email of emails) {
        try {
          await saveTrackedEmail(userId, integration.id, email);
          totalProcessed++;
        } catch (error) {
          // Ignore errors for individual emails
          console.warn("Error processing email:", error);
        }
      }

      // Update last sync time
      await updateEmailIntegration(integration.id, {
        lastSyncTime: new Date().toISOString(),
      });
    }

    return totalProcessed;
  } catch (error) {
    console.error("Error syncing emails:", error);
    throw error;
  }
};

// Match tracked emails to job applications
export const matchEmailsToJobs = async (userId: string): Promise<number> => {
  try {
    // Get tracked emails without job application ID
    const { data: emailsData, error: emailsError } = await supabase
      .from("tracked_emails")
      .select("*")
      .eq("user_id", userId)
      .is("job_application_id", null);

    if (emailsError) {
      throw emailsError;
    }

    if (!emailsData || emailsData.length === 0) {
      return 0;
    }

    // Get all job applications for the user
    const { data: jobsData, error: jobsError } = await supabase
      .from("job_applications")
      .select("id, company, position");

    if (jobsError) {
      throw jobsError;
    }

    if (!jobsData) {
      return 0;
    }

    let matchCount = 0;

    // Try to match emails to jobs
    for (const email of emailsData) {
      const trackedEmail = mapTrackedEmailFromDB(email);
      const emailText = `${trackedEmail.subject} ${
        trackedEmail.bodyText || trackedEmail.snippet || ""
      }`.toLowerCase();

      // Try to find matching job
      for (const job of jobsData) {
        const companyName = job.company.toLowerCase();
        const position = job.position.toLowerCase();

        // Check if email contains both company name and position
        if (emailText.includes(companyName) && emailText.includes(position)) {
          // Update the email with job ID
          const { error: updateError } = await supabase
            .from("tracked_emails")
            .update({ job_application_id: job.id })
            .eq("id", trackedEmail.id);

          if (!updateError) {
            matchCount++;

            // If email has a status, update the job
            if (trackedEmail.parsedStatus) {
              await updateJobApplicationStatus(
                job.id,
                trackedEmail.parsedStatus
              );
            }

            break; // Stop after first match
          }
        }
      }
    }

    return matchCount;
  } catch (error) {
    console.error("Error matching emails to jobs:", error);
    throw error;
  }
};
