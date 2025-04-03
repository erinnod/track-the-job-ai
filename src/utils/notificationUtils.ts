import { supabase } from "@/lib/supabase";

/**
 * Creates a notification in the database
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
}) => {
  try {
    const { data, error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      description,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
};

/**
 * Creates a notification for a new job application
 */
export const createApplicationNotification = async (
  userId: string,
  company: string,
  position: string
) => {
  return createNotification({
    userId,
    type: "application",
    title: "Application Submitted",
    description: `You have successfully applied for ${position} at ${company}.`,
  });
};

/**
 * Creates a notification for an upcoming interview
 */
export const createInterviewNotification = async (
  userId: string,
  company: string,
  position: string,
  date: Date
) => {
  const dateString = date.toLocaleDateString();
  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return createNotification({
    userId,
    type: "interview",
    title: "Interview Scheduled",
    description: `You have an interview for ${position} at ${company} on ${dateString} at ${timeString}.`,
  });
};

/**
 * Creates a notification for a job status change
 */
export const createStatusChangeNotification = async (
  userId: string,
  company: string,
  position: string,
  status: string
) => {
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

  return createNotification({
    userId,
    type,
    title,
    description,
  });
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
