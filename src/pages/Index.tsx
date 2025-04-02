
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import StatsOverview from "@/components/dashboard/StatsOverview";
import JobList from "@/components/jobs/JobList";
import AddJobModal from "@/components/jobs/AddJobModal";
import { mockJobs, JobApplication } from "@/data/mockJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(mockJobs);
  
  const handleAddJob = (newJob: JobApplication) => {
    setJobs(prevJobs => [newJob, ...prevJobs]);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <AddJobModal onAddJob={handleAddJob} />
        </div>
        
        <StatsOverview jobs={jobs} />
        
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger 
                value="all" 
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                All Applications
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Saved
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all">
            <div className="bg-white rounded-lg p-6">
              <JobList jobs={jobs} />
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="bg-white rounded-lg p-6">
              <JobList 
                jobs={jobs.filter(
                  job => job.status === "applied" || job.status === "interview"
                )} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="bg-white rounded-lg p-6">
              <JobList 
                jobs={jobs.filter(job => job.status === "saved")} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
