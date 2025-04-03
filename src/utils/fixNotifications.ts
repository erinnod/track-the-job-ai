import { supabase } from "@/lib/supabase";

/**
 * Utility function to fix existing notifications by updating
 * notification types that should be 'interview' but are currently 'application'
 */
export const fixInterviewNotifications = async (userId: string) => {
  try {
    // Get all notifications for this user
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "application");

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error };
    }

    if (!notifications || notifications.length === 0) {
      return { success: true, message: "No notifications to update" };
    }

    // Filter for notifications that should be interview type based on title or description
    const interviewKeywords = [
      "interview",
      "interview stage",
      "has moved to the interview stage",
      "interview scheduled",
    ];

    const notificationsToUpdate = notifications.filter((notification) => {
      const titleMatches =
        notification.title &&
        interviewKeywords.some((keyword) =>
          notification.title.toLowerCase().includes(keyword.toLowerCase())
        );

      const descriptionMatches =
        notification.description &&
        interviewKeywords.some((keyword) =>
          notification.description.toLowerCase().includes(keyword.toLowerCase())
        );

      return titleMatches || descriptionMatches;
    });

    if (notificationsToUpdate.length === 0) {
      return { success: true, message: "No notifications need updating" };
    }

    // Update the notification types
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ type: "interview", updated_at: new Date().toISOString() })
      .in(
        "id",
        notificationsToUpdate.map((n) => n.id)
      );

    if (updateError) {
      console.error("Error updating notification types:", updateError);
      return { success: false, error: updateError };
    }

    return {
      success: true,
      message: `Updated ${notificationsToUpdate.length} notifications to interview type`,
    };
  } catch (error) {
    console.error("Exception fixing notification types:", error);
    return { success: false, error };
  }
};

/**
 * Run the notification fix for the currently logged-in user
 */
export const run = async () => {
  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("No authenticated user found");
      return { success: false, error: "No authenticated user found" };
    }

    // Run the fix for this user
    return await fixInterviewNotifications(user.id);
  } catch (error) {
    console.error("Error running notification fix:", error);
    return { success: false, error };
  }
};
