import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import {
  NotificationSettings as NotificationSettingsType,
  getNotificationSettings,
  updateNotificationSettings,
  sendVerificationEmail,
} from "@/services/notificationService";
import { MailCheck, Mail, Loader2 } from "lucide-react";

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettingsType | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;

      try {
        const userSettings = await getNotificationSettings(user.id);
        if (userSettings) {
          setSettings(userSettings);
          setEmail(userSettings.email);
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        toast({
          title: "Error",
          description:
            "Could not load notification settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user, toast]);

  const handleToggle = (field: string) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: !prev[field as keyof NotificationSettingsType],
      };
    });
  };

  const handleSave = async () => {
    if (!user?.id || !settings) return;

    setIsSaving(true);

    try {
      // Check if email was changed
      const emailChanged = email !== settings.email;

      // Update settings in the database
      const updatedSettings = await updateNotificationSettings(user.id, {
        ...settings,
        email,
      });

      if (updatedSettings) {
        setSettings(updatedSettings);

        toast({
          title: "Settings Saved",
          description: "Your notification settings have been updated.",
        });

        // If email changed, it needs to be verified again
        if (emailChanged) {
          toast({
            title: "Email Changed",
            description:
              "Please check your new email address for a verification link.",
          });
        }
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Could not save settings. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.id || !settings) return;

    setIsSendingVerification(true);

    try {
      await sendVerificationEmail(settings.email, user.id);

      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description:
          "Could not send verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Email Settings Card */}
      <div className="border rounded-lg p-6 shadow-sm">
        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Email Notifications
          </h2>
          <p className="text-slate-500">
            Update your email and notification delivery preferences
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
            {settings && !settings.emailVerified && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isSendingVerification}
                >
                  {isSendingVerification ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Verify Email
                </Button>
              </div>
            )}
            {settings && (
              <div className="flex items-center mt-1">
                {settings.emailVerified ? (
                  <>
                    <MailCheck className="h-4 w-4 text-green-500 mr-2" />
                    <p className="text-sm text-green-500">Email verified</p>
                  </>
                ) : (
                  <p className="text-sm text-amber-500">
                    Email not verified. Please check your inbox for a
                    verification link.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <h3 className="font-medium">Enable Email Notifications</h3>
              <p className="text-sm text-slate-500">
                Receive any notifications via email
              </p>
            </div>
            <Switch
              checked={settings?.emailNotificationsEnabled}
              onCheckedChange={() => handleToggle("emailNotificationsEnabled")}
              disabled={!settings?.emailVerified}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-700 hover:bg-blue-800"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notification Types Card */}
      <div className="border rounded-lg p-6 shadow-sm">
        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Notification Types
          </h2>
          <p className="text-slate-500">
            Choose which notifications you want to receive
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">Status Changes</h3>
                <p className="text-sm text-slate-500">
                  Get notified when your job application status changes
                </p>
              </div>
              <Switch
                checked={settings?.notifyOnStatusChange}
                onCheckedChange={() => handleToggle("notifyOnStatusChange")}
                disabled={
                  !settings?.emailVerified ||
                  !settings?.emailNotificationsEnabled
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">Upcoming Interviews</h3>
                <p className="text-sm text-slate-500">
                  Get reminders about interviews you have scheduled
                </p>
              </div>
              <Switch
                checked={settings?.notifyOnUpcomingInterviews}
                onCheckedChange={() =>
                  handleToggle("notifyOnUpcomingInterviews")
                }
                disabled={
                  !settings?.emailVerified ||
                  !settings?.emailNotificationsEnabled
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">New Job Emails</h3>
                <p className="text-sm text-slate-500">
                  Get notified when new job-related emails are detected
                </p>
              </div>
              <Switch
                checked={settings?.notifyOnNewEmails}
                onCheckedChange={() => handleToggle("notifyOnNewEmails")}
                disabled={
                  !settings?.emailVerified ||
                  !settings?.emailNotificationsEnabled
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">Daily Digest</h3>
                <p className="text-sm text-slate-500">
                  Receive a daily summary of your job application activity
                </p>
              </div>
              <Switch
                checked={settings?.dailyDigest}
                onCheckedChange={() => handleToggle("dailyDigest")}
                disabled={
                  !settings?.emailVerified ||
                  !settings?.emailNotificationsEnabled
                }
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-700 hover:bg-blue-800"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
