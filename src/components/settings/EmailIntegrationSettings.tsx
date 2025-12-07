import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUserEmailIntegrations,
  deleteEmailIntegration,
  updateEmailIntegration,
  getOAuthUrl,
  syncEmails,
  matchEmailsToJobs,
  getNotificationSettings,
  updateNotificationSettings,
} from "@/services/emailService";
import {
  EmailIntegration,
  EmailProvider,
  EmailNotificationSettings,
} from "@/types/email";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Trash2,
  RefreshCw,
  AlarmClock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function EmailIntegrationSettings() {
  const [integrations, setIntegrations] = useState<EmailIntegration[]>([]);
  const [notificationSettings, setNotificationSettings] =
    useState<EmailNotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user integrations
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [integrations, notificationSettings] = await Promise.all([
        fetchUserEmailIntegrations(user?.id || ""),
        getNotificationSettings(user?.id || ""),
      ]);
      setIntegrations(integrations);
      setNotificationSettings(notificationSettings);
    } catch (error) {
      console.error("Error loading email integrations:", error);
      toast({
        title: "Error loading integrations",
        description: "There was a problem loading your email integrations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth connection
  const handleConnect = (provider: EmailProvider) => {
    const authUrl = getOAuthUrl(provider);

    // Debug: Log the full auth URL to see the redirect_uri that's being sent
    console.log("Debug - Auth URL:", authUrl);
    console.log("Debug - Current origin:", window.location.origin);
    console.log("Debug - Provider:", provider);

    // Parse the URL to extract redirect_uri parameter for better debugging
    try {
      const urlObj = new URL(authUrl);
      const params = new URLSearchParams(urlObj.search);
      const redirectUri = params.get("redirect_uri");
      console.log("Debug - Extracted redirect_uri:", redirectUri);

      // If running on port 8080 but redirect URI has 5173, warn the user
      if (
        window.location.port === "8080" &&
        redirectUri &&
        redirectUri.includes("5173")
      ) {
        console.warn(
          "Warning: You're running on port 8080 but redirect URI contains port 5173!"
        );
        toast({
          title: "Redirect URI Mismatch",
          description:
            "Your OAuth configuration may have incorrect redirect URI settings. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Error parsing auth URL:", e);
    }

    // Navigate to the auth URL
    window.location.href = authUrl;
  };

  // Handle deleting an integration
  const handleDelete = async (integrationId: string) => {
    try {
      await deleteEmailIntegration(integrationId);
      setIntegrations(integrations.filter((i) => i.id !== integrationId));
      toast({
        title: "Integration removed",
        description: "Email integration has been successfully removed",
      });
    } catch (error) {
      console.error("Error deleting integration:", error);
      toast({
        title: "Error removing integration",
        description: "There was a problem removing your email integration",
        variant: "destructive",
      });
    }
  };

  // Handle enabling/disabling an integration
  const handleToggleActive = async (
    integrationId: string,
    isActive: boolean
  ) => {
    try {
      await updateEmailIntegration(integrationId, { isActive });
      setIntegrations(
        integrations.map((i) =>
          i.id === integrationId ? { ...i, isActive } : i
        )
      );
      toast({
        title: isActive ? "Integration enabled" : "Integration disabled",
        description: `Email integration has been ${
          isActive ? "enabled" : "disabled"
        }`,
      });
    } catch (error) {
      console.error("Error updating integration:", error);
      toast({
        title: "Error updating integration",
        description: "There was a problem updating your email integration",
        variant: "destructive",
      });
    }
  };

  // Handle notification setting changes
  const handleNotificationSettingChange = async (
    setting: keyof EmailNotificationSettings,
    value: boolean
  ) => {
    if (!notificationSettings || !user?.id) return;

    try {
      const updatedSettings = await updateNotificationSettings(user.id, {
        [setting]: value,
      });

      setNotificationSettings(updatedSettings);

      toast({
        title: "Settings updated",
        description: "Your notification settings have been updated",
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error updating settings",
        description: "There was a problem updating your notification settings",
        variant: "destructive",
      });
    }
  };

  // Sync emails from all integrations
  const handleSyncEmails = async () => {
    if (!user?.id) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const processedCount = await syncEmails(user.id);

      // After syncing emails, match them to job applications
      const matchedCount = await matchEmailsToJobs(user.id);

      setSyncResult({
        status: "success",
        message: `Processed ${processedCount} emails and matched ${matchedCount} to your job applications.`,
      });

      toast({
        title: "Sync completed",
        description: `Successfully processed ${processedCount} emails`,
      });
    } catch (error: any) {
      console.error("Error syncing emails:", error);

      setSyncResult({
        status: "error",
        message: error.message || "There was a problem syncing your emails",
      });

      toast({
        title: "Error syncing emails",
        description: error.message || "There was a problem syncing your emails",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = (time?: string) => {
    if (!time) return "Never";

    try {
      return formatDistanceToNow(new Date(time), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect your email accounts to automatically track job application
          status changes.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4">
        {/* Current integrations */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Connected Accounts</h4>

          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No email accounts connected yet. Connect your accounts to
                  track job applications.
                </p>
              </CardContent>
            </Card>
          ) : (
            integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-primary" />
                        {integration.emailAddress}
                      </CardTitle>
                      <CardDescription>
                        {integration.provider === "gmail" ? "Gmail" : "Outlook"}{" "}
                        · Last sync:{" "}
                        {formatLastSyncTime(integration.lastSyncTime)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={integration.isActive ? "default" : "outline"}
                    >
                      {integration.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${integration.id}`}
                      checked={integration.isActive}
                      onCheckedChange={(checked) =>
                        handleToggleActive(integration.id, checked)
                      }
                    />
                    <Label
                      htmlFor={`active-${integration.id}`}
                      className="text-sm"
                    >
                      {integration.isActive ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                  <div className="flex space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Email Integration
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this email
                            integration? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(integration.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Add new integration */}
        <div className="space-y-4 mt-6">
          <h4 className="text-sm font-medium">Add Email Account</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#EA4335"
                      d="M5.266 9.805C4.77 8.538 4.77 7.186 5.266 5.919C5.797 4.662 6.851 3.667 8.14 3.165C9.44 2.672 10.894 2.719 12.15 3.307C13.413 3.895 14.376 4.949 14.816 6.222L11.268 8.36C11.093 7.848 10.725 7.416 10.237 7.14C9.75 6.863 9.172 6.756 8.606 6.84C8.031 6.915 7.504 7.186 7.102 7.607C6.699 8.029 6.449 8.576 6.394 9.157L5.266 9.805Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.266 14.119C4.77 15.385 4.77 16.738 5.266 18.004C5.797 19.262 6.851 20.257 8.14 20.759C9.44 21.252 10.894 21.205 12.15 20.617C13.413 20.029 14.376 18.975 14.816 17.702L11.268 15.564C11.093 16.076 10.725 16.508 10.237 16.784C9.75 17.061 9.172 17.168 8.606 17.084C8.031 17.009 7.504 16.738 7.102 16.317C6.699 15.895 6.449 15.348 6.394 14.767L5.266 14.119Z"
                    />
                    <path
                      fill="#34A853"
                      d="M19.29 10.166C19.495 11.014 19.519 11.893 19.361 12.75H12.107V9.75H16.29C16.487 9.75 16.675 9.872 16.778 10.058L19.29 10.166Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M12.107 21.002C9.881 21.002 7.811 20.071 6.394 18.506L8.606 15.882C9.332 16.932 10.658 17.623 12.107 17.623C13.145 17.623 14.118 17.269 14.816 16.661L17.382 19.099C16.059 20.296 14.161 21.002 12.107 21.002Z"
                    />
                  </svg>
                  Gmail
                </CardTitle>
                <CardDescription>
                  Connect your Gmail account to track job applications
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleConnect("gmail")}
                  disabled={isLoading}
                >
                  Connect Gmail
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#0078D4"
                      d="M11.826 15.043L5.477 10.694C5.372 10.617 5.318 10.488 5.336 10.358V5.044C5.336 4.849 5.534 4.714 5.711 4.788L12.165 7.794C12.246 7.831 12.297 7.911 12.297 7.998V14.885C12.297 15.074 12.101 15.198 11.935 15.125L11.826 15.043Z"
                    />
                    <path
                      fill="#0078D4"
                      d="M5.711 4.788L12.246 8.463C12.327 8.5 12.419 8.5 12.501 8.463L19.035 4.788C19.213 4.704 19.411 4.849 19.411 5.044V10.358C19.428 10.488 19.375 10.617 19.269 10.694L12.921 15.043C12.922 15.043 12.92 15.043 12.919 15.042C12.817 15.099 12.695 15.099 12.594 15.042C12.593 15.042 12.59 15.043 12.589 15.043L11.826 14.517V9.552L12.308 9.261L12.921 8.878C13.007 8.82 13.007 8.695 12.921 8.637L5.711 4.788Z"
                    />
                    <path
                      fill="#0078D4"
                      d="M19.269 10.694L12.921 15.043C12.835 15.102 12.835 15.228 12.921 15.286L19.035 19.212C19.213 19.296 19.411 19.151 19.411 18.956V13.642C19.428 13.512 19.375 13.383 19.269 13.306V10.694Z"
                    />
                    <path
                      fill="#0078D4"
                      d="M12.308 15.493L11.826 15.819V14.885L12.308 15.204V15.493Z"
                    />
                  </svg>
                  Outlook
                </CardTitle>
                <CardDescription>
                  Connect your Outlook account to track job applications
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleConnect("outlook")}
                  disabled={isLoading}
                >
                  Connect Outlook
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Email sync section */}
        {integrations.length > 0 && (
          <div className="space-y-4 mt-6">
            <h4 className="text-sm font-medium">Email Sync</h4>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Job Application Emails
                </CardTitle>
                <CardDescription>
                  Manually sync emails to check for new job applications status
                  updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {syncResult && (
                  <div
                    className={`p-3 mb-4 rounded text-sm ${
                      syncResult.status === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {syncResult.status === "success" ? (
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{syncResult.message}</span>
                      </div>
                    ) : (
                      <div className="flex">
                        <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{syncResult.message}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm text-muted-foreground mb-4">
                  <p>This will check your connected email accounts for:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Interview invitations</li>
                    <li>Application status updates</li>
                    <li>Rejection notices</li>
                    <li>Job offers</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSyncEmails}
                  disabled={isSyncing || integrations.length === 0}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing Emails...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Notification settings */}
        <div className="space-y-4 mt-6">
          <h4 className="text-sm font-medium">Notification Settings</h4>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Control how you receive notifications for email updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : notificationSettings ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-emails">New Job Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when new job-related emails are detected
                      </p>
                    </div>
                    <Switch
                      id="new-emails"
                      checked={notificationSettings.notifyOnNewEmails}
                      onCheckedChange={(checked) =>
                        handleNotificationSettingChange(
                          "notifyOnNewEmails",
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="status-changes">Status Changes</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when job application status changes based on
                        emails
                      </p>
                    </div>
                    <Switch
                      id="status-changes"
                      checked={notificationSettings.notifyOnStatusChange}
                      onCheckedChange={(checked) =>
                        handleNotificationSettingChange(
                          "notifyOnStatusChange",
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect an email account to manage notification settings
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info card */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center text-amber-700">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              About Email Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700">
              JobTrakr uses read-only access to your emails to identify
              job-related messages. We never store your full emails - only the
              relevant details needed for job tracking. You can revoke access at
              any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
