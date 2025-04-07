import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

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

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch real notifications from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Check if the notifications table exists
        const { data: existingTables, error: tableError } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .eq("table_name", "notifications");

        // If table doesn't exist, create it
        if (!tableError && (!existingTables || existingTables.length === 0)) {
          // Create the notifications table if it doesn't exist
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

          // Create the table
          await supabase.rpc("pgscript", { code: createTableSQL });
        }

        // Fetch notifications from the database
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Transform database date strings to Date objects
          const formattedNotifications = data.map((notification) => ({
            ...notification,
            date: new Date(notification.created_at),
          }));

          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Fallback to empty notifications if there's an error
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up a real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
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
            setNotifications((prev) => [newNotification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
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
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((notification) => notification.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Supabase WebSocket status:", status);

        // Check for CSP errors in the status
        if (status === "SUBSCRIBED") {
          console.log("Successfully connected to Supabase realtime!");
        } else if (status === "CHANNEL_ERROR") {
          console.error(
            "Failed to connect to Supabase realtime. Check your Content Security Policy."
          );
        }
      });

    // Clean up subscription when unmounting
    return () => {
      notificationsSubscription.unsubscribe();
    };
  }, [user]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(
      (notification) => !notification.read
    ).length;
    setUnreadCount(count);
  }, [notifications]);

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
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
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  // Mark a single notification as unread
  const markAsUnread = async (id: string) => {
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
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: false }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as unread",
        variant: "destructive",
      });
    }
  };

  // Toggle the read status of a notification
  const toggleReadStatus = async (id: string) => {
    if (!user) return;

    // Find current notification
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    // Toggle the status
    if (notification.read) {
      await markAsUnread(id);
      toast({
        title: "Marked as unread",
        description: "Notification has been marked as unread",
      });
    } else {
      await markAsRead(id);
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read",
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
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
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string) => {
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
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAsUnread,
        toggleReadStatus,
        markAllAsRead,
        deleteNotification,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
