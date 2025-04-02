
import Layout from "@/components/layout/Layout";
import StatsOverview from "@/components/dashboard/StatsOverview";
import JobList from "@/components/jobs/JobList";
import AddJobModal from "@/components/jobs/AddJobModal";
import { mockJobs } from "@/data/mockJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-jobtrakr-charcoal dark:text-white">Dashboard</h1>
          <AddJobModal />
        </div>
        
        <StatsOverview jobs={mockJobs} />
        
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="dark:bg-gray-800">
              <TabsTrigger value="all" className="dark:data-[state=active]:bg-jobtrakr-blue dark:data-[state=active]:text-white">All Applications</TabsTrigger>
              <TabsTrigger value="active" className="dark:data-[state=active]:bg-jobtrakr-blue dark:data-[state=active]:text-white">Active</TabsTrigger>
              <TabsTrigger value="saved" className="dark:data-[state=active]:bg-jobtrakr-blue dark:data-[state=active]:text-white">Saved</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all">
            <JobList jobs={mockJobs} />
          </TabsContent>
          
          <TabsContent value="active">
            <JobList 
              jobs={mockJobs.filter(
                job => job.status === "applied" || job.status === "interview"
              )} 
            />
          </TabsContent>
          
          <TabsContent value="saved">
            <JobList 
              jobs={mockJobs.filter(job => job.status === "saved")} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
