import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";
import { getNotificationSettings } from "@/services/notificationService";
import { sendEmail } from "@/services/notificationService";

// Let's disable debug logs completely to prevent console flooding
const DEBUG_MODE = false;

// Debug logger that only logs in debug mode
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    logger.debug(message, data);
  }
};

export interface Notification {
  id: string;
  type: "interview" | "application" | "jobMatch";
  title: string;
  description: string;
  date: Date;
  read: boolean;
  user_id?: string;
  created_at?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  toggleReadStatus: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Using function declaration for better HMR compatibility
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

// Using function declaration for better HMR compatibility
function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Create a simpler toast implementation to avoid circular dependency
  const showToast = useCallback(
    (
      title: string,
      description: string,
      variant: "default" | "destructive" = "default"
    ) => {
      console.log(`TOAST: ${variant} - ${title} - ${description}`);
      // We'll just log the toast for now to avoid the circular dependency
    },
    []
  );

  const previousStatusRef = useRef<string>("");
  const userIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);

  // Track if mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Add a flag to control whether we set up a channel at all
  const isSubscriptionSetupRef = useRef(false);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      // Also clean up any channel subscription
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch (err) {
          logger.error("Error during cleanup:", err);
        }
        channelRef.current = null;
      }

      // Reset subscription flag to allow setup if component remounts
      isSubscriptionSetupRef.current = false;
    };
  }, []);

  // Memoize these functions to prevent unnecessary re-creation

  // Safe state updater that checks if component is still mounted
  const safeSetNotifications = useCallback((updater: any) => {
    if (isMountedRef.current) {
      setNotifications(updater);
    }
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        // Update in the database
        const { error } = await supabase
          .from("notifications")
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        // Update local state
        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === id
                ? { ...notification, read: true }
                : notification
            )
          );
        }
      } catch (error) {
        logger.error("Error marking notification as read:", error);
        if (isMountedRef.current) {
          showToast(
            "Error",
            "Failed to mark notification as read",
            "destructive"
          );
        }
      }
      // Remove the toast from dependencies to prevent recreation
    },
    [user]
  );

  // Mark a single notification as unread
  const markAsUnread = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        // Update in the database
        const { error } = await supabase
          .from("notifications")
          .update({ read: false, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        // Update local state
        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === id
                ? { ...notification, read: false }
                : notification
            )
          );
        }
      } catch (error) {
        logger.error("Error marking notification as unread:", error);
        if (isMountedRef.current) {
          showToast(
            "Error",
            "Failed to mark notification as unread",
            "destructive"
          );
        }
      }
      // Remove the toast from dependencies to prevent recreation
    },
    [user]
  );

  // Toggle the read status of a notification
  const toggleReadStatus = useCallback(
    async (id: string) => {
      if (!user) return;

      // Find current notification
      const notification = notifications.find((n) => n.id === id);
      if (!notification) return;

      try {
        // Toggle the status
        if (notification.read) {
          await markAsUnread(id);
          if (isMountedRef.current) {
            showToast(
              "Marked as unread",
              "Notification has been marked as unread"
            );
          }
        } else {
          await markAsRead(id);
          if (isMountedRef.current) {
            showToast("Marked as read", "Notification has been marked as read");
          }
        }
      } catch (error) {
        logger.error("Error toggling notification status:", error);
      }
    },
    [user, notifications, markAsRead, markAsUnread]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      // Update in the database
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        throw error;
      }

      // Update local state
      if (isMountedRef.current) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      if (isMountedRef.current) {
        showToast(
          "Error",
          "Failed to mark all notifications as read",
          "destructive"
        );
      }
    }
  }, [user]);

  // Delete a notification
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        // Delete from the database
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        // Update local state
        if (isMountedRef.current) {
          setNotifications((prev) =>
            prev.filter((notification) => notification.id !== id)
          );
        }
      } catch (error) {
        logger.error("Error deleting notification:", error);
        if (isMountedRef.current) {
          showToast("Error", "Failed to delete notification", "destructive");
        }
      }
    },
    [user]
  );

  // Fetch notifications - separate effect with its own dependencies
  useEffect(() => {
    // Don't fetch if no user
    if (!user) {
      if (isMountedRef.current) {
        setNotifications([]);
        setLoading(false);
      }
      return;
    }

    // Set loading to false if we already have notifications
    if (notifications.length > 0) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    // Define a timeout to ensure loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 5000); // 5 second maximum loading time

    const fetchNotifications = async () => {
      if (isMountedRef.current) {
        setLoading(true);
      }

      try {
        // Try to fetch notifications directly first
        // If the table doesn't exist, this will throw an error
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          // If there's no error, process the data
          if (!error && data && isMountedRef.current) {
            // Transform database date strings to Date objects
            const formattedNotifications = data.map((notification) => ({
              ...notification,
              date: new Date(notification.created_at),
            }));

            setNotifications(formattedNotifications);
            setLoading(false);
            clearTimeout(loadingTimeout); // Clear the timeout

            // Add this inside the fetchNotifications function after fetching notifications
            const sendEmailNotificationIfNeeded = async (
              notification: Notification
            ) => {
              if (!user) return;

              try {
                // Get user's notification settings
                const settings = await getNotificationSettings(user.id);

                if (
                  !settings ||
                  !settings.emailNotificationsEnabled ||
                  !settings.emailVerified
                ) {
                  return; // User doesn't want email notifications or email not verified
                }

                // Check the notification type and settings to determine if we should send an email
                const shouldSendEmail =
                  (notification.type === "interview" &&
                    settings.notifyOnUpcomingInterviews) ||
                  (notification.type === "application" &&
                    settings.notifyOnStatusChange) ||
                  (notification.type === "jobMatch" &&
                    settings.notifyOnNewEmails);

                if (shouldSendEmail) {
                  // Format the email
                  const subject = `JobTrakr: ${notification.title}`;
                  const html = `
										<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
											<h2>${notification.title}</h2>
											<p>${notification.description}</p>
											<p>Date: ${notification.date.toLocaleString()}</p>
											<p>
												<a href="${
                          window.location.origin
                        }/notifications" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
													View Notifications
												</a>
											</p>
											<p>Thank you,<br>The JobTrakr Team</p>
										</div>
									`;

                  // Send the email
                  await sendEmail(settings.email, subject, html);
                }
              } catch (error) {
                logger.error("Error sending email notification:", error);
              }
            };

            return; // Exit early as we successfully got the data
          }

          // If there's an error and it seems like the table doesn't exist
          if (
            error &&
            (error.message?.includes("does not exist") ||
              error.code === "42P01" || // PostgreSQL code for undefined_table
              error.code === "404")
          ) {
            // Need to create the table
            debugLog(
              "Notifications table doesn't exist, attempting to create it..."
            );

            // Continue to table creation below
          } else if (error) {
            // Some other error occurred with the query
            throw error;
          }
        } catch (queryError) {
          if (DEBUG_MODE) {
            logger.warn(
              "Error querying notifications, attempting to create table:",
              queryError
            );
          }
          // Continue to table creation
        }

        // Create the notifications table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('interview', 'application', 'jobMatch')),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Add RLS policies for notifications
          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
          
          -- Users can only view their own notifications
          CREATE POLICY "Users can view their own notifications" 
            ON public.notifications FOR SELECT 
            USING (auth.uid() = user_id);
            
          -- Users can only update their own notifications
          CREATE POLICY "Users can update their own notifications" 
            ON public.notifications FOR UPDATE 
            USING (auth.uid() = user_id);
            
          -- Users can only delete their own notifications
          CREATE POLICY "Users can delete their own notifications" 
            ON public.notifications FOR DELETE 
            USING (auth.uid() = user_id);
        `;

        try {
          // Create the table
          await supabase.rpc("pgscript", { code: createTableSQL });
          debugLog("Successfully created notifications table");
          // Table was just created, so there are no notifications yet
          if (isMountedRef.current) {
            setNotifications([]);
          }
        } catch (createError) {
          logger.error("Error creating notifications table:", createError);
          // Set to empty array as fallback
          if (isMountedRef.current) {
            setNotifications([]);
          }
        }
      } catch (error) {
        logger.error("Error in fetchNotifications:", error);
        // Fallback to empty notifications if there's an error
        if (isMountedRef.current) {
          setNotifications([]);
          setLoading(false);
        }
        clearTimeout(loadingTimeout); // Clear the timeout
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        clearTimeout(loadingTimeout); // Clear the timeout
      }
    };

    fetchNotifications();

    // Clear timeout on cleanup
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Set up realtime subscription - separate effect
  useEffect(() => {
    // Always clear loading state after a brief delay to prevent eternal spinner
    const loadingClearTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 3000);

    // Don't do anything if there's no user or we already set up
    if (!user?.id || isSubscriptionSetupRef.current) {
      return () => clearTimeout(loadingClearTimeout);
    }

    // Mark that we've set up a subscription
    isSubscriptionSetupRef.current = true;

    // Reset status ref
    previousStatusRef.current = "";

    // Set up a real-time subscription for notifications with error handling
    debugLog("Setting up Supabase realtime channel...");

    let channelSetupAttempts = 0;
    const maxAttempts = 3;

    const setupChannel = () => {
      try {
        // Don't set up if component is unmounted
        if (!isMountedRef.current) {
          return () => {};
        }

        channelSetupAttempts++;
        debugLog(`Attempt ${channelSetupAttempts} to set up realtime channel`);

        // Safety check for user
        if (!user?.id) {
          return () => {};
        }

        // Create a unique channel name with user ID to prevent conflicts
        const channelName = `public:notifications:${user.id}`;

        try {
          const channel = supabase
            .channel(channelName)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${user.id}`,
              },
              (payload) => {
                // Update notifications based on the change type
                if (payload.eventType === "INSERT") {
                  const newNotification: Notification = {
                    ...payload.new,
                    id: payload.new.id,
                    type: payload.new.type as
                      | "interview"
                      | "application"
                      | "jobMatch",
                    title: payload.new.title,
                    description: payload.new.description,
                    date: new Date(payload.new.created_at),
                    read: payload.new.read,
                  };

                  // Use the safe setter to prevent updates after unmount
                  if (isMountedRef.current) {
                    setNotifications((prev) => [newNotification, ...prev]);
                  }
                } else if (payload.eventType === "UPDATE") {
                  if (isMountedRef.current) {
                    setNotifications((prev) =>
                      prev.map((notification) =>
                        notification.id === payload.new.id
                          ? {
                              ...notification,
                              ...payload.new,
                              type: payload.new.type as
                                | "interview"
                                | "application"
                                | "jobMatch",
                              date: new Date(payload.new.created_at),
                              read: payload.new.read,
                            }
                          : notification
                      )
                    );
                  }
                } else if (payload.eventType === "DELETE") {
                  if (isMountedRef.current) {
                    setNotifications((prev) =>
                      prev.filter(
                        (notification) => notification.id !== payload.old.id
                      )
                    );
                  }
                }
              }
            )
            .subscribe((status) => {
              // Only log status changes, not every status update
              if (status !== previousStatusRef.current) {
                debugLog("Supabase WebSocket status:", status);
                previousStatusRef.current = status;

                // Check for connection status
                if (status === "SUBSCRIBED") {
                  debugLog("Successfully connected to Supabase realtime!");
                } else if (status === "CHANNEL_ERROR") {
                  logger.error(
                    "Failed to connect to Supabase realtime. Check your Content Security Policy."
                  );

                  // Try again if we haven't reached the max attempts
                  if (channelSetupAttempts < maxAttempts) {
                    debugLog(`Retrying connection in 2 seconds...`);
                    setTimeout(setupChannel, 2000);
                  } else {
                    logger.error(
                      `Failed to connect after ${maxAttempts} attempts. Please check your network and security settings.`
                    );
                  }
                }
              }
            });

          // Store the channel reference
          channelRef.current = channel;

          return () => {
            debugLog("Cleaning up Supabase realtime subscription");
            try {
              if (channel) {
                channel.unsubscribe();
              }
            } catch (err) {
              logger.error("Error unsubscribing from channel:", err);
            }
            channelRef.current = null;
          };
        } catch (subError) {
          logger.error("Error in channel subscription:", subError);
          return () => {};
        }
      } catch (error) {
        logger.error("Error setting up realtime subscription:", error);
        return () => {}; // Return empty cleanup function
      }
    };

    const cleanup = setupChannel();
    return () => {
      cleanup();
      clearTimeout(loadingClearTimeout);
    };
  }, []);

  // Handle user changes separately to avoid flashing
  useEffect(() => {
    if (!user) {
      // Clean up on logout
      if (channelRef.current) {
        debugLog("User logged out, cleaning up channels");
        try {
          channelRef.current.unsubscribe();
        } catch (error) {
          logger.error("Error unsubscribing on logout:", error);
        }
        channelRef.current = null;
      }

      if (isMountedRef.current) {
        setNotifications([]);
        setLoading(false); // Make sure to clear loading state on logout
      }
      return;
    }

    // If user changes but we already have a channel, update the channel with new user ID
    if (channelRef.current && userIdRef.current !== user.id) {
      debugLog("User changed, updating channel reference");
      // Store the new user ID
      userIdRef.current = user.id;

      // Fetch notifications for the new user
      const fetchUserNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data && isMountedRef.current) {
            // Transform database date strings to Date objects
            const formattedNotifications = data.map((notification) => ({
              ...notification,
              date: new Date(notification.created_at),
            }));

            setNotifications(formattedNotifications);
          }
        } catch (error) {
          logger.error(
            "Error fetching notifications after user change:",
            error
          );
        }
      };

      fetchUserNotifications();
    } else if (!channelRef.current) {
      // Store user ID if we don't have a channel yet
      userIdRef.current = user.id;
    }
  }, [user?.id]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(
      (notification) => !notification.read
    ).length;

    if (isMountedRef.current) {
      setUnreadCount(count);
    }
  }, [notifications]);

  // Create an initial loading flag that shows only on first render
  const initialLoadRef = useRef(true);
  useEffect(() => {
    // Set initial load to false after a short period
    const initialLoadTimeout = setTimeout(() => {
      initialLoadRef.current = false;
      // Force render update by setting loading to false
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 2000); // 2 seconds max for initial load

    return () => {
      clearTimeout(initialLoadTimeout);
    };
  }, []);

  // Create a wrapped version of the provider to handle loading edge cases
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    deleteNotification,
    loading,
  };

  // If we're in the initial load and have no notifications, show a loading message
  if (initialLoadRef.current && loading && notifications.length === 0) {
    return (
      <NotificationContext.Provider value={value}>
        {children}
      </NotificationContext.Provider>
    );
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
