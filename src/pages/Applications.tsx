import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobList from "@/components/jobs/JobList";
import JobListHeader from "@/components/jobs/JobListHeader";
import { JobApplication } from "@/data/mockJobs";
import { useJobs } from "@/contexts/JobContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Trash, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmailParserForm from "@/components/ai/EmailParserForm";
import JobRecommendationsAI from "@/components/ai/JobRecommendationsAI";
import AIContentDisplay from "@/components/ai/AIContentDisplay";
import CreditsDisplay from "@/components/payment/CreditsDisplay";
import { fetchUserAIContent } from "@/lib/ai-service";
import { AIGeneratedContent } from "@/types/ai";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import EmailTrackedItems from "@/components/jobs/EmailTrackedItems";

const Applications = () => {
  const [viewMode, setViewMode] = useState<
    "all" | "active" | "saved" | "rejected" | "offers"
  >("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusesToDelete, setStatusesToDelete] = useState<
    Record<string, boolean>
  >({
    saved: false,
    applied: false,
    interview: false,
    offer: false,
    rejected: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { jobs, isLoading, deleteJob, refreshJobs } = useJobs();
  const [jobRecommendations, setJobRecommendations] = useState<
    AIGeneratedContent[]
  >([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true);
  const { user } = useAuth();

  // Get the current job count based on active tab
  const getCurrentJobCount = () => {
    switch (viewMode) {
      case "active":
        return jobs.filter(
          (job) => job.status === "applied" || job.status === "interview"
        ).length;
      case "saved":
        return jobs.filter((job) => job.status === "saved").length;
      case "rejected":
        return jobs.filter((job) => job.status === "rejected").length;
      case "offers":
        return jobs.filter((job) => job.status === "offer").length;
      case "all":
      default:
        return jobs.length;
    }
  };

  // Toggle a status selection
  const toggleStatus = (status: string) => {
    setStatusesToDelete((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // Function to delete jobs by statuses
  const deleteJobsByStatus = async () => {
    // Get array of selected statuses
    const selectedStatuses = Object.entries(statusesToDelete)
      .filter(([_, isSelected]) => isSelected)
      .map(([status]) => status);

    if (selectedStatuses.length === 0) {
      toast({
        title: "No status selected",
        description: "Please select at least one status to delete.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Filter jobs by the selected statuses
      const jobsToDelete = jobs.filter((job) =>
        selectedStatuses.includes(job.status)
      );

      if (jobsToDelete.length === 0) {
        toast({
          title: "No jobs found",
          description: "No jobs with the selected statuses found.",
          variant: "destructive",
        });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      // Delete each job sequentially
      for (const job of jobsToDelete) {
        await deleteJob(job.id);
      }

      const statusText =
        selectedStatuses.length > 1 ? "selected statuses" : selectedStatuses[0];

      toast({
        title: "Jobs deleted",
        description: `Successfully deleted ${jobsToDelete.length} jobs with ${statusText}.`,
      });

      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting jobs:", error);
      toast({
        title: "Error",
        description: "There was a problem deleting the jobs.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to manually refresh jobs
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshJobs();
      toast({
        title: "Refreshed",
        description: "Job applications have been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem refreshing your applications.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load AI job recommendations
  const loadJobRecommendations = async () => {
    if (!user?.id) return;

    setIsLoadingRecommendations(true);
    try {
      const recommendations = await fetchUserAIContent(
        user.id,
        "job_recommendation"
      );
      setJobRecommendations(recommendations);
    } catch (error) {
      console.error("Error loading job recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // This effect runs when the component mounts to ensure data freshness
  useEffect(() => {
    // Force a rerender when the page is visited
    console.log("Applications page mounted, jobs count:", jobs.length);

    // If we have data already, we're good, if not, the JobContext will fetch it
    if (jobs.length === 0 && !isLoading) {
      console.log("No jobs found, attempting to refresh...");
      refreshJobs();
    }
  }, []);

  // Add a diagnostic effect to track when jobs change
  useEffect(() => {
    console.log(
      "Applications: Jobs data changed, now has",
      jobs.length,
      "jobs. Loading:",
      isLoading
    );
  }, [jobs, isLoading]);

  // Load job recommendations when user is available
  useEffect(() => {
    if (user?.id) {
      loadJobRecommendations();
    }
  }, [user?.id]);

  // Function to refresh job applications after email status changes
  const handleEmailStatusChange = () => {
    refreshJobs();
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Applications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage your job applications
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2 self-start"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(value) => setViewMode(value as any)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Applications</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="offers">Offers</TabsTrigger>
              </TabsList>
            </div>

            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="mt-2 sm:mt-0 rounded-md text-sm h-9"
                  variant="destructive"
                  size="sm"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Mass Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Jobs by Status</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all jobs with the selected
                    statuses.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      This action cannot be undone. All selected jobs will be
                      permanently deleted.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      Select statuses to delete
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="saved"
                          checked={statusesToDelete.saved}
                          onCheckedChange={() => toggleStatus("saved")}
                        />
                        <label
                          htmlFor="saved"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Saved
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="applied"
                          checked={statusesToDelete.applied}
                          onCheckedChange={() => toggleStatus("applied")}
                        />
                        <label
                          htmlFor="applied"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Applied
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="interview"
                          checked={statusesToDelete.interview}
                          onCheckedChange={() => toggleStatus("interview")}
                        />
                        <label
                          htmlFor="interview"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Interview
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="offer"
                          checked={statusesToDelete.offer}
                          onCheckedChange={() => toggleStatus("offer")}
                        />
                        <label
                          htmlFor="offer"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Offer
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rejected"
                          checked={statusesToDelete.rejected}
                          onCheckedChange={() => toggleStatus("rejected")}
                        />
                        <label
                          htmlFor="rejected"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Rejected
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={deleteJobsByStatus}
                    disabled={
                      isDeleting ||
                      !Object.values(statusesToDelete).some(Boolean)
                    }
                  >
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <JobListHeader
              jobCount={getCurrentJobCount()}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            <div className="mt-6">
              <TabsContent value="all" className="p-0 mt-0">
                <JobList
                  jobs={jobs}
                  isLoading={isLoading}
                  onRetry={handleRefresh}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </TabsContent>

              <TabsContent value="active" className="p-0 mt-0">
                <JobList
                  jobs={jobs.filter(
                    (job) =>
                      job.status === "applied" || job.status === "interview"
                  )}
                  isLoading={isLoading}
                  onRetry={handleRefresh}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </TabsContent>

              <TabsContent value="saved" className="p-0 mt-0">
                <JobList
                  jobs={jobs.filter((job) => job.status === "saved")}
                  isLoading={isLoading}
                  onRetry={handleRefresh}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </TabsContent>

              <TabsContent value="rejected" className="p-0 mt-0">
                <JobList
                  jobs={jobs.filter((job) => job.status === "rejected")}
                  isLoading={isLoading}
                  onRetry={handleRefresh}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </TabsContent>

              <TabsContent value="offers" className="p-0 mt-0">
                <JobList
                  jobs={jobs.filter((job) => job.status === "offer")}
                  isLoading={isLoading}
                  onRetry={handleRefresh}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            {/* All existing filters and search code */}
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  Smart Tools
                </CardTitle>
                <CardDescription>AI-powered application tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <EmailParserForm
                  onComplete={() => {
                    if (refreshJobs) refreshJobs();
                  }}
                />
                <JobRecommendationsAI
                  onComplete={(content) => {
                    loadJobRecommendations();
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email tracking and job recommendations side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Email tracking */}
          <div>
            <EmailTrackedItems
              limit={10}
              onStatusChange={handleEmailStatusChange}
            />
          </div>

          {/* Job recommendations */}
          <div>
            {jobRecommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-semibold">
                    AI Job Recommendations
                  </h2>
                </div>
                <div className="space-y-4">
                  {jobRecommendations.slice(0, 1).map((recommendation) => (
                    <AIContentDisplay
                      key={recommendation.id}
                      content={recommendation}
                      onDelete={loadJobRecommendations}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Applications;
