import Layout from "@/components/layout/Layout";
import StatsOverview from "@/components/dashboard/StatsOverview";
import JobList from "@/components/jobs/JobList";
import { JobApplication } from "@/data/mockJobs";
import { useJobs } from "@/contexts/JobContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplicationStats from "@/components/dashboard/ApplicationStats";
import ApplicationTimeline from "@/components/dashboard/ApplicationTimeline";
import JobTypeAnalysis from "@/components/dashboard/JobTypeAnalysis";
import RecentActivity from "@/components/dashboard/RecentActivity";

const Index = () => {
  const { jobs, addJob, isLoading } = useJobs();

  const handleAddJob = (newJob: JobApplication) => {
    addJob(newJob);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
        </div>

        <StatsOverview jobs={jobs} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <ApplicationStats jobs={jobs} />
          </div>
          <div className="md:col-span-1">
            <RecentActivity jobs={jobs} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <ApplicationTimeline jobs={jobs} />
          </div>
          <div className="md:col-span-2">
            <JobTypeAnalysis jobs={jobs} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold pt-4">Your Job Applications</h2>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Applications</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <JobList jobs={jobs} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="active">
              <JobList
                jobs={jobs.filter(
                  (job) =>
                    job.status === "applied" || job.status === "interview"
                )}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="saved">
              <JobList
                jobs={jobs.filter((job) => job.status === "saved")}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
