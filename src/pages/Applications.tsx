import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobList from "@/components/jobs/JobList";
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
import { AlertCircle, Plus, Trash } from "lucide-react";
import { useState } from "react";
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

const Applications = () => {
  const [viewMode, setViewMode] = useState<
    "all" | "active" | "saved" | "rejected" | "offers"
  >("all");
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { jobs, isLoading, deleteJob } = useJobs();

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

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Applications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage your job applications
            </p>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger
                value="all"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                onClick={() => setViewMode("all")}
              >
                All Applications
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                onClick={() => setViewMode("active")}
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                onClick={() => setViewMode("saved")}
              >
                Saved
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                onClick={() => setViewMode("rejected")}
              >
                Rejected
              </TabsTrigger>
              <TabsTrigger
                value="offers"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
                onClick={() => setViewMode("offers")}
              >
                Offers
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex justify-end mb-4">
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="rounded-md text-sm h-9"
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

          <TabsContent value="all">
            <div className="bg-white rounded-lg p-6">
              <JobList jobs={jobs} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="bg-white rounded-lg p-6">
              <JobList
                jobs={jobs.filter(
                  (job) =>
                    job.status === "applied" || job.status === "interview"
                )}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="bg-white rounded-lg p-6">
              <JobList
                jobs={jobs.filter((job) => job.status === "saved")}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="bg-white rounded-lg p-6">
              <JobList
                jobs={jobs.filter((job) => job.status === "rejected")}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="offers">
            <div className="bg-white rounded-lg p-6">
              <JobList
                jobs={jobs.filter((job) => job.status === "offer")}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Applications;
