import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

export const NotificationsTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: false,
    sms: true,
    jobMatches: true,
    applicationStatus: true,
    interviewReminders: true,
    marketing: false,
  });

  // Fetch notification preferences on mount
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        setIsInitializing(true);

        // Get current user
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;

        const userId = userData.user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Get notification preferences
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is the error code for "No rows returned" - we handle this by using defaults
          throw error;
        }

        if (data) {
          setNotifications({
            email: data.email_enabled || false,
            sms: data.sms_enabled || true,
            jobMatches: data.job_matches || true,
            applicationStatus: data.application_status || true,
            interviewReminders: data.interview_reminders || true,
            marketing: data.marketing || false,
          });
        }
      } catch (error: any) {
        logger.error("Error fetching notification preferences:", error);
        // Keep default values if fetch fails
      } finally {
        setIsInitializing(false);
      }
    };

    fetchNotificationPreferences();
  }, []);

  // Handle saving notification preferences
  const saveNotifications = async () => {
    try {
      setIsLoading(true);
      logger.info("Saving notification preferences:", notifications);

      // Save to Supabase - assumes you have a "notification_preferences" table
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: userId,
        email_enabled: notifications.email,
        sms_enabled: notifications.sms,
        job_matches: notifications.jobMatches,
        application_status: notifications.applicationStatus,
        interview_reminders: notifications.interviewReminders,
        marketing: notifications.marketing,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Notification preferences updated",
        description:
          "Your notification preferences have been saved successfully.",
      });
    } catch (error: any) {
      logger.error("Error saving notification preferences:", error);
      toast({
        title: "Error saving preferences",
        description:
          error.message ||
          "There was a problem saving your notification preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changing notification settings
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Email Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive updates via email
            </p>
          </div>
          <Switch
            checked={notifications.email}
            onCheckedChange={(checked) =>
              handleNotificationChange("email", checked)
            }
            disabled={isInitializing}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">SMS Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive updates via text message
            </p>
          </div>
          <Switch
            checked={notifications.sms}
            onCheckedChange={(checked) =>
              handleNotificationChange("sms", checked)
            }
            disabled={isInitializing}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Notify me about:</h3>

          <div className="flex items-center justify-between">
            <p className="text-sm">New job matches</p>
            <Switch
              checked={notifications.jobMatches}
              onCheckedChange={(checked) =>
                handleNotificationChange("jobMatches", checked)
              }
              disabled={isInitializing}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm">Application status changes</p>
            <Switch
              checked={notifications.applicationStatus}
              onCheckedChange={(checked) =>
                handleNotificationChange("applicationStatus", checked)
              }
              disabled={isInitializing}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm">Interview reminders</p>
            <Switch
              checked={notifications.interviewReminders}
              onCheckedChange={(checked) =>
                handleNotificationChange("interviewReminders", checked)
              }
              disabled={isInitializing}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm">Marketing communications</p>
            <Switch
              checked={notifications.marketing}
              onCheckedChange={(checked) =>
                handleNotificationChange("marketing", checked)
              }
              disabled={isInitializing}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={saveNotifications}
          disabled={isLoading || isInitializing}
        >
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
};
