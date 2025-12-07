// import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

export interface NotificationSettings {
  id: string;
  userId: string;
  email: string; // Email to send notifications to
  emailVerified: boolean;
  emailNotificationsEnabled: boolean;
  notifyOnStatusChange: boolean;
  notifyOnUpcomingInterviews: boolean;
  notifyOnNewEmails: boolean;
  dailyDigest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

// Map DB row to frontend format
export const mapNotificationSettingsFromDB = (
  dbSettings: any
): NotificationSettings => ({
  id: dbSettings.id,
  userId: dbSettings.user_id,
  email: dbSettings.email,
  emailVerified: dbSettings.email_verified,
  emailNotificationsEnabled: dbSettings.email_notifications_enabled,
  notifyOnStatusChange: dbSettings.notify_on_status_change,
  notifyOnUpcomingInterviews: dbSettings.notify_on_upcoming_interviews,
  notifyOnNewEmails: dbSettings.notify_on_new_emails,
  dailyDigest: dbSettings.daily_digest,
  createdAt: dbSettings.created_at,
  updatedAt: dbSettings.updated_at,
});

// Replace direct Nodemailer usage with API calls
// Instead of creating a transporter directly in the browser
const callEmailService = async (endpoint: string, data: any) => {
  try {
    // Use fetch to call your server-side email endpoint
    const response = await fetch(`/api/email/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling email service:", error);
    throw error;
  }
};

// Get notification settings for a user
export const getNotificationSettings = async (
  userId: string
): Promise<NotificationSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found, create default settings
        return createNotificationSettings(userId);
      }
      throw error;
    }

    return mapNotificationSettingsFromDB(data);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    throw error;
  }
};

// Create default notification settings for a user
export const createNotificationSettings = async (
  userId: string
): Promise<NotificationSettings | null> => {
  try {
    // First get the user's email from auth table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user email:", userError);
      return null;
    }

    const userEmail = userData?.email;
    if (!userEmail) {
      console.error("User email not found");
      return null;
    }

    const { data, error } = await supabase
      .from("notification_settings")
      .insert([
        {
          user_id: userId,
          email: userEmail,
          email_verified: false, // Will need to be verified
          email_notifications_enabled: true,
          notify_on_status_change: true,
          notify_on_upcoming_interviews: true,
          notify_on_new_emails: true,
          daily_digest: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send a verification email
    await sendVerificationEmail(userEmail, userId);

    return mapNotificationSettingsFromDB(data);
  } catch (error) {
    console.error("Error creating notification settings:", error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("notification_settings")
      .update({
        email: settings.email,
        email_notifications_enabled: settings.emailNotificationsEnabled,
        notify_on_status_change: settings.notifyOnStatusChange,
        notify_on_upcoming_interviews: settings.notifyOnUpcomingInterviews,
        notify_on_new_emails: settings.notifyOnNewEmails,
        daily_digest: settings.dailyDigest,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If email was changed, send a new verification email
    if (settings.email && settings.email !== data.email) {
      await sendVerificationEmail(settings.email, userId);
    }

    return mapNotificationSettingsFromDB(data);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw error;
  }
};

// Generate a verification token for email verification
export const generateVerificationToken = async (
  userId: string,
  email: string
): Promise<string> => {
  // Generate a random token
  const token = Math.random().toString(36).substr(2, 10);

  try {
    // Store the token in the database with an expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    await supabase.from("email_verification_tokens").insert([
      {
        user_id: userId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      },
    ]);

    return token;
  } catch (error) {
    console.error("Error generating verification token:", error);
    throw error;
  }
};

// Send a verification email
export const sendVerificationEmail = async (
  email: string,
  userId: string
): Promise<void> => {
  try {
    const token = await generateVerificationToken(userId, email);
    const verificationLink = `${window.location.origin}/verify-email?token=${token}&userId=${userId}`;

    // Use our server endpoint instead of direct Nodemailer
    await callEmailService("send-verification", {
      email,
      userId,
      verificationLink,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

// Verify an email with a token
export const verifyEmail = async (
  token: string,
  userId: string
): Promise<boolean> => {
  try {
    // Check if the token is valid and not expired
    const { data, error } = await supabase
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if the token is expired
    if (new Date(data.expires_at) < new Date()) {
      return false;
    }

    // Update the user's email verification status
    await supabase
      .from("notification_settings")
      .update({ email_verified: true })
      .eq("user_id", userId);

    // Delete the used token
    await supabase
      .from("email_verification_tokens")
      .delete()
      .eq("token", token);

    return true;
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
};

// Send an email using server API instead of direct Nodemailer
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    await callEmailService("send", {
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Send a notification to a user about a job status change
export const sendJobStatusChangeNotification = async (
  userId: string,
  jobTitle: string,
  company: string,
  oldStatus: string,
  newStatus: string
): Promise<void> => {
  try {
    // Get user's notification settings
    const settings = await getNotificationSettings(userId);

    if (
      !settings ||
      !settings.emailNotificationsEnabled ||
      !settings.notifyOnStatusChange ||
      !settings.emailVerified
    ) {
      // User doesn't want status change notifications or email not verified
      return;
    }

    const template = getEmailTemplate("statusChange", {
      jobTitle,
      company,
      oldStatus,
      newStatus,
    });

    await sendEmail(settings.email, template.subject, template.body);
  } catch (error) {
    console.error("Error sending job status change notification:", error);
    throw error;
  }
};

// Send a notification about an upcoming interview
export const sendUpcomingInterviewNotification = async (
  userId: string,
  jobTitle: string,
  company: string,
  interviewDate: string,
  interviewTime: string,
  interviewType: string
): Promise<void> => {
  try {
    // Get user's notification settings
    const settings = await getNotificationSettings(userId);

    if (
      !settings ||
      !settings.emailNotificationsEnabled ||
      !settings.notifyOnUpcomingInterviews ||
      !settings.emailVerified
    ) {
      // User doesn't want interview notifications or email not verified
      return;
    }

    const template = getEmailTemplate("upcomingInterview", {
      jobTitle,
      company,
      interviewDate,
      interviewTime,
      interviewType,
    });

    await sendEmail(settings.email, template.subject, template.body);
  } catch (error) {
    console.error("Error sending upcoming interview notification:", error);
    throw error;
  }
};

// Template helpers
interface TemplateData {
  [key: string]: string;
}

// Get an email template based on the type and data
export const getEmailTemplate = (
  templateType: string,
  data: TemplateData
): EmailTemplate => {
  switch (templateType) {
    case "verification":
      return {
        subject: "Verify Your Email - JobTrakr",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Email Address</h2>
            <p>Please click the link below to verify your email address for JobTrakr:</p>
            <p>
              <a href="${data.verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
            </p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
            <p>Thank you,<br>The JobTrakr Team</p>
          </div>
        `,
      };
    case "statusChange":
      return {
        subject: `Job Status Update - ${data.jobTitle} at ${data.company}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Job Status Update</h2>
            <p>We wanted to let you know that the status of your job application has changed:</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <p><strong>Job:</strong> ${data.jobTitle} at ${data.company}</p>
              <p><strong>Previous Status:</strong> ${data.oldStatus}</p>
              <p><strong>New Status:</strong> ${data.newStatus}</p>
            </div>
            <p>
              <a href="${window.location.origin}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                View In JobTrakr
              </a>
            </p>
            <p>Thank you,<br>The JobTrakr Team</p>
          </div>
        `,
      };
    case "upcomingInterview":
      return {
        subject: `Upcoming Interview - ${data.jobTitle} at ${data.company}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Upcoming Interview Reminder</h2>
            <p>Don't forget about your upcoming interview:</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <p><strong>Job:</strong> ${data.jobTitle} at ${data.company}</p>
              <p><strong>Date:</strong> ${data.interviewDate}</p>
              <p><strong>Time:</strong> ${data.interviewTime}</p>
              <p><strong>Type:</strong> ${data.interviewType}</p>
            </div>
            <p>
              <a href="${window.location.origin}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                View In JobTrakr
              </a>
            </p>
            <p>Good luck with your interview!</p>
            <p>Thank you,<br>The JobTrakr Team</p>
          </div>
        `,
      };
    default:
      throw new Error(`Unknown email template type: ${templateType}`);
  }
};
