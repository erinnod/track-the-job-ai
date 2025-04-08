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
        .from("integrations")
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
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Integrations</h1>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Browser Extension Now Available</AlertTitle>
          <AlertDescription>
            Install our browser extension to easily save job postings from
            LinkedIn, Indeed, and other sites with a single click.
          </AlertDescription>
        </Alert>

        {/* Tabs for different import methods */}
        <Tabs
          defaultValue="extension"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="extension">
              <Globe className="mr-2 h-4 w-4" />
              Browser Extension
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Hammer className="mr-2 h-4 w-4" />
              Manual Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extension">
            {/* Browser Extension content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chrome Extension Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Chrome className="h-6 w-6 text-blue-600" />
                    <CardTitle>Chrome Extension</CardTitle>
                  </div>
                  <div className="inline-flex items-center py-1 px-2 bg-green-100 text-green-700 text-xs rounded-full">
                    <Check className="h-3 w-3 mr-1" /> Available
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    Our Chrome extension lets you save job listings from
                    LinkedIn and Indeed with a single click. Install it to
                    streamline your job application tracking.
                  </CardDescription>

                  <div className="space-y-4">
                    <div className="rounded-md bg-slate-50 p-4">
                      <h3 className="text-sm font-medium mb-2">Features:</h3>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          Save jobs with one click from LinkedIn & Indeed
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          Auto-extract job details (title, company, location)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          Quick access to your JobTrakr dashboard
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://chrome.google.com/webstore/detail/jobtrakr/extension-id-placeholder",
                        "_blank"
                      )
                    }
                    className="flex items-center gap-2 w-full justify-center"
                  >
                    <Download className="h-4 w-4" />
                    Install Chrome Extension
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardFooter>
              </Card>

              {/* How to Use Card */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                  <CardDescription>
                    Get started with the JobTrakr browser extension in a few
                    simple steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4 text-sm">
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Install the extension</p>
                        <p className="text-slate-600">
                          Click the Install button and follow the prompts in the
                          Chrome Web Store
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Sign in to JobTrakr</p>
                        <p className="text-slate-600">
                          Click the extension icon and sign in with your
                          JobTrakr account
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Browse job listings</p>
                        <p className="text-slate-600">
                          Visit LinkedIn or Indeed and browse jobs as you
                          normally would
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Save with one click</p>
                        <p className="text-slate-600">
                          Click the "Save to JobTrakr" button on any job listing
                          page
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/help/browser-extension")}
                  >
                    View Full Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            {/* Manual Import Guide */}
            <ManualImportGuide />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default IntegrationsPage;
