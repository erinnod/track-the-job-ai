import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Info,
  Loader2,
  LogIn,
  RefreshCw,
  Trash2,
  Linkedin,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Integration,
  IntegrationType,
  getUserIntegrations,
} from "@/services/integrationService";
import { supabase } from "@/lib/supabase";
import { fetchFromApi } from "@/lib/apiAdapter";

const IntegrationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Get status from query parameters (after OAuth callback)
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status");
  const provider = searchParams.get("provider");

  useEffect(() => {
    if (status && provider) {
      if (status === "success") {
        toast({
          title: "Integration successful",
          description: `Your ${provider} account was successfully connected.`,
        });
      } else if (status === "error") {
        toast({
          title: "Integration failed",
          description: `We couldn't connect to your ${provider} account. Please try again.`,
          variant: "destructive",
        });
      }

      // Remove query parameters from the URL
      navigate("/settings/integrations", { replace: true });
    }
  }, [status, provider, toast, navigate]);

  // Load user integrations
  useEffect(() => {
    const loadIntegrations = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const userIntegrations = await getUserIntegrations(user.id);
        setIntegrations(userIntegrations);
      } catch (error) {
        console.error("Error loading integrations:", error);
        toast({
          title: "Error loading integrations",
          description: "Please refresh the page to try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadIntegrations();
  }, [user, toast]);

  // Handle sync button click
  const handleSync = async () => {
    if (!user || syncing) return;

    setSyncing(true);
    try {
      const response = await fetchFromApi("/api/integrations/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Type assertion for the response
      const typedResponse = response as {
        ok: boolean;
        json: () => Promise<any>;
        status: number;
      };

      if (typedResponse.ok) {
        const result = await typedResponse.json();
        toast({
          title: "Sync successful",
          description: result.message,
        });
      } else {
        // Handle different error cases
        if (typedResponse.status === 500) {
          const errorData = await typedResponse.json();
          toast({
            title: "API Configuration Error",
            description:
              errorData.error || "Check your API credentials in the .env file",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sync failed",
            description: "Failed to sync job applications",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error syncing integrations:", error);
      toast({
        title: "Sync failed",
        description: "Failed to sync job applications",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete integration
  const handleDelete = async (integrationId: string) => {
    if (!user) return;

    setDeleting(integrationId);
    try {
      const { error } = await supabase
        .from("user_integrations")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integrationId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update the local state
      setIntegrations((prev) =>
        prev.filter((integration) => integration.id !== integrationId)
      );

      toast({
        title: "Integration removed",
        description: "The integration has been successfully removed",
      });
    } catch (error) {
      console.error("Error deleting integration:", error);
      toast({
        title: "Error removing integration",
        description: "Failed to remove the integration",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Get provider icon
  const getProviderIcon = (type: IntegrationType) => {
    switch (type) {
      case "linkedin":
        return <Linkedin className="h-6 w-6 text-blue-600" />;
      case "indeed":
        return <Briefcase className="h-6 w-6 text-blue-700" />;
      default:
        return <Briefcase className="h-6 w-6" />;
    }
  };

  // Get provider name
  const getProviderName = (type: IntegrationType) => {
    switch (type) {
      case "linkedin":
        return "LinkedIn";
      case "indeed":
        return "Indeed";
      default:
        // This ensures type safety while providing a fallback
        const value = type as string;
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Integrations</h1>
          <p className="text-slate-500 mt-1">
            Connect your accounts to import job applications automatically
          </p>
        </div>

        {/* Info alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle>Sync your job applications</AlertTitle>
          <AlertDescription>
            Connect your Indeed and LinkedIn accounts to automatically import
            job applications. This helps you keep track of all your applications
            in one place.
          </AlertDescription>
        </Alert>

        {/* Sync button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={handleSync}
            disabled={integrations.length === 0 || syncing}
            className="flex items-center gap-2"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LinkedIn Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Linkedin className="h-6 w-6 text-blue-600" />
                <CardTitle>LinkedIn</CardTitle>
              </div>
              {integrations.some((i) => i.type === "linkedin") && (
                <div className="inline-flex items-center py-1 px-2 bg-green-100 text-green-700 text-xs rounded-full">
                  <Check className="h-3 w-3 mr-1" /> Connected
                </div>
              )}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Import both saved and applied job applications from LinkedIn.
                You'll need to grant permission to access your LinkedIn job
                activity.
              </CardDescription>

              {integrations.some((i) => i.type === "linkedin") ? (
                <div className="text-sm text-slate-500 space-y-2">
                  {integrations
                    .filter((i) => i.type === "linkedin")
                    .map((integration) => (
                      <div key={integration.id}>
                        <p>
                          <span className="font-medium">Last synced:</span>{" "}
                          {formatDate(integration.last_synced_at)}
                        </p>
                        <p>
                          <span className="font-medium">Connected on:</span>{" "}
                          {formatDate(integration.created_at)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  <p>Not connected</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {integrations.some((i) => i.type === "linkedin") ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const integration = integrations.find(
                        (i) => i.type === "linkedin"
                      );
                      if (integration) {
                        handleDelete(integration.id);
                      }
                    }}
                    disabled={
                      deleting ===
                      integrations.find((i) => i.type === "linkedin")?.id
                    }
                    className="flex items-center gap-2 text-red-500 hover:text-red-700"
                  >
                    {deleting ===
                    integrations.find((i) => i.type === "linkedin")?.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Disconnect
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSync}
                          disabled={syncing}
                        >
                          {syncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sync now</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      // Use our API adapter to redirect to LinkedIn auth
                      await fetchFromApi("/api/integrations/linkedin/auth");
                    } catch (error) {
                      toast({
                        title: "API Configuration Error",
                        description:
                          "Please add your LinkedIn API credentials in the .env file",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Connect LinkedIn
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Indeed Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-700" />
                <CardTitle>Indeed</CardTitle>
              </div>
              {integrations.some((i) => i.type === "indeed") && (
                <div className="inline-flex items-center py-1 px-2 bg-green-100 text-green-700 text-xs rounded-full">
                  <Check className="h-3 w-3 mr-1" /> Connected
                </div>
              )}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Import job applications from Indeed. You'll need to grant
                permission to access your applied jobs.
              </CardDescription>

              {integrations.some((i) => i.type === "indeed") ? (
                <div className="text-sm text-slate-500 space-y-2">
                  {integrations
                    .filter((i) => i.type === "indeed")
                    .map((integration) => (
                      <div key={integration.id}>
                        <p>
                          <span className="font-medium">Last synced:</span>{" "}
                          {formatDate(integration.last_synced_at)}
                        </p>
                        <p>
                          <span className="font-medium">Connected on:</span>{" "}
                          {formatDate(integration.created_at)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  <p>Not connected</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {integrations.some((i) => i.type === "indeed") ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const integration = integrations.find(
                        (i) => i.type === "indeed"
                      );
                      if (integration) {
                        handleDelete(integration.id);
                      }
                    }}
                    disabled={
                      deleting ===
                      integrations.find((i) => i.type === "indeed")?.id
                    }
                    className="flex items-center gap-2 text-red-500 hover:text-red-700"
                  >
                    {deleting ===
                    integrations.find((i) => i.type === "indeed")?.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Disconnect
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSync}
                          disabled={syncing}
                        >
                          {syncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sync now</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      // Use our API adapter to redirect to Indeed auth
                      await fetchFromApi("/api/integrations/indeed/auth");
                    } catch (error) {
                      toast({
                        title: "API Configuration Error",
                        description:
                          "Please add your Indeed API credentials in the .env file",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Connect Indeed
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Connected Integrations */}
        {!loading && integrations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Connected Integrations
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Provider
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Connected On
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Last Synced
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {integrations.map((integration) => (
                    <tr
                      key={integration.id}
                      className="border-b border-slate-200"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(integration.type)}
                          <span className="font-medium">
                            {getProviderName(integration.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(integration.created_at)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(integration.last_synced_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center py-1 px-2 bg-green-100 text-green-700 text-xs rounded-full">
                          <Check className="h-3 w-3 mr-1" /> Active
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleSync}
                                  disabled={syncing}
                                >
                                  {syncing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Sync now</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(integration.id)}
                                  disabled={deleting === integration.id}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  {deleting === integration.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Disconnect</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default IntegrationsPage;
