
import Layout from "@/components/layout/Layout";
import StatsOverview from "@/components/dashboard/StatsOverview";
import JobList from "@/components/jobs/JobList";
import AddJobModal from "@/components/jobs/AddJobModal";
import { mockJobs } from "@/data/mockJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <AddJobModal />
        </div>
        
        <StatsOverview jobs={mockJobs} />
        
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
