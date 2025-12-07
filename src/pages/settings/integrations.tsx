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
  Hammer,
  Globe,
  Chrome,
  Download,
  ArrowRight,
  ExternalLink,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManualImportGuide from "@/components/integrations/ManualImportGuide";
import SettingsLayout from "@/components/settings/SettingsLayout";
import EmailIntegrationSettings from "@/components/settings/EmailIntegrationSettings";

// Type definition for API response
interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

const IntegrationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("extension");

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

  const handleSync = async () => {
    if (!user || integrations.length === 0) return;

    setSyncing(true);
    try {
      // Call API to sync all integrations
      const response = (await fetchFromApi("/api/integrations/sync", {
        method: "POST",
      })) as ApiResponse;

      if (response && response.success) {
        toast({
          title: "Sync successful",
          description: "Your job applications have been imported.",
        });

        // Reload integrations to update lastSyncedAt
        const updatedIntegrations = await getUserIntegrations(user.id);
        setIntegrations(updatedIntegrations);

        // Redirect to the jobs page to see the new jobs
        navigate("/jobs");
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      console.error("Error syncing integrations:", error);
      toast({
        title: "Sync failed",
        description:
          "We couldn't import your job applications. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!user) return;

    setDeleting(integrationId);
    try {
      // Call API to delete integration
      const { error } = await supabase
        .from("user_integrations")
        .delete()
        .eq("id", integrationId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update integrations list
      setIntegrations(
        integrations.filter((integration) => integration.id !== integrationId)
      );

      toast({
        title: "Integration removed",
        description: "The integration has been disconnected.",
      });
    } catch (error) {
      console.error("Error deleting integration:", error);
      toast({
        title: "Error removing integration",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";

    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get provider icon
  const getProviderIcon = (type: IntegrationType) => {
    switch (type) {
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-blue-600" />;
      case "indeed":
        return <Briefcase className="h-5 w-5 text-blue-700" />;
      default:
        return null;
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
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect external services to enhance your job tracking experience.
          </p>
        </div>

        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="other">Other Services</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-6">
            <EmailIntegrationSettings />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4 mt-6">
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Coming Soon
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Calendar integration is coming soon. This feature will
                      allow you to sync interview schedules with your favorite
                      calendar app.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4 mt-6">
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Coming Soon
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Additional integrations with job boards, LinkedIn, and
                      other services are coming soon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
};

export default IntegrationsPage;
