import { supabase } from "@/lib/supabase";

interface NotificationResult {
  success: boolean;
  data?: any;
  error?: any;
  silentError?: boolean;
  message?: string;
}

/**
 * Creates a notification in the database, with a safe table existence check
 */
export const createNotification = async ({
  userId,
  type,
  title,
  description,
}: {
  userId: string;
  type: "interview" | "application" | "jobMatch";
  title: string;
  description: string;
}): Promise<NotificationResult> => {
  try {
    // Using a safer approach to check if table exists - try to access it and handle the error
    // This is safer than querying information_schema which may have permission issues
    try {
      // Try to insert the notification directly
      const { data, error } = await supabase.from("notifications").insert({
        user_id: userId,
        type,
        title,
        description,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // If successful, return success
      if (!error) {
        return { success: true, data };
      }

      // If error includes "does not exist", the table doesn't exist yet
      if (
        error.message?.includes("does not exist") ||
        error.code === "42P01" || // PostgreSQL code for undefined_table
        error.code === "404"
      ) {
        // HTTP not found
        console.log(
          "Notifications table doesn't exist yet. Skipping notification."
        );
        return {
          success: false,
          silentError: true,
          message: "Notifications table not available",
        };
      }

      // Other error - log it but don't break the application
      console.warn("Error inserting notification:", error);
      return { success: false, error, silentError: true };
    } catch (innerError) {
      console.warn("Error accessing notifications table:", innerError);
      return { success: false, error: innerError, silentError: true };
    }
  } catch (error) {
    console.error("Error in createNotification:", error);
    return { success: false, error, silentError: true };
  }
};

/**
 * Creates a notification for a new job application
 */
export const createApplicationNotification = async (
  userId: string,
  company: string,
  position: string
): Promise<NotificationResult> => {
  try {
    return await createNotification({
      userId,
      type: "application",
      title: "Application Submitted",
      description: `You have successfully applied for ${position} at ${company}.`,
    });
  } catch (error) {
    console.error("Error creating application notification:", error);
    return { success: false, error, silentError: true };
  }
};

/**
 * Creates a notification for an upcoming interview
 */
export const createInterviewNotification = async (
  userId: string,
  company: string,
  position: string,
  date: Date
): Promise<NotificationResult> => {
  try {
    const dateString = date.toLocaleDateString();
    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return await createNotification({
      userId,
      type: "interview",
      title: "Interview Scheduled",
      description: `You have an interview for ${position} at ${company} on ${dateString} at ${timeString}.`,
    });
  } catch (error) {
    console.error("Error creating interview notification:", error);
    return { success: false, error, silentError: true };
  }
};

/**
 * Creates a notification for a job status change
 */
export const createStatusChangeNotification = async (
  userId: string,
  company: string,
  position: string,
  status: string
): Promise<NotificationResult> => {
  try {
    let title = "Application Update";
    let description = "";
    let type: "interview" | "application" | "jobMatch" = "application";

    switch (status.toLowerCase()) {
      case "interview":
        title = "Interview Stage";
        description = `Your application for ${position} at ${company} has moved to the interview stage.`;
        type = "interview";
        break;
      case "offer":
        title = "Job Offer Received";
        description = `Congratulations! You've received an offer for ${position} at ${company}.`;
        break;
      case "rejected":
        title = "Application Not Selected";
        description = `Your application for ${position} at ${company} was not selected at this time.`;
        break;
      default:
        description = `Your application for ${position} at ${company} has been updated to ${status}.`;
    }

    return await createNotification({
      userId,
      type,
      title,
      description,
    });
  } catch (error) {
    console.error("Error creating status change notification:", error);
    return { success: false, error, silentError: true };
  }
};

/**
 * Creates a notification for job matches
 */
export const createJobMatchNotification = async (
  userId: string,
  count: number,
  jobType?: string
) => {
  const jobTypeText = jobType ? `matching ${jobType}` : "matching your profile";

  return createNotification({
    userId,
    type: "jobMatch",
    title: "New Job Matches",
    description: `We found ${count} new job ${
      count === 1 ? "posting" : "postings"
    } ${jobTypeText}.`,
  });
};

/**
 * Creates a notification for an interview reminder
 */
export const createInterviewReminderNotification = async (
  userId: string,
  company: string,
  position: string,
  date: Date,
  daysUntil: number
) => {
  const dateString = date.toLocaleDateString();
  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let timeDescription = "";
  if (daysUntil === 0) {
    timeDescription = "today";
  } else if (daysUntil === 1) {
    timeDescription = "tomorrow";
  } else {
    timeDescription = `in ${daysUntil} days`;
  }

  return createNotification({
    userId,
    type: "interview",
    title: "Interview Reminder",
    description: `Reminder: You have an interview for ${position} at ${company} ${timeDescription} (${dateString} at ${timeString}).`,
  });
};
