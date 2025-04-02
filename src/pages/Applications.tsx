
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobList from "@/components/jobs/JobList";
import { mockJobs } from "@/data/mockJobs";
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
import { Plus, Filter } from "lucide-react";
import { useState } from "react";

const Applications = () => {
  const [viewMode, setViewMode] = useState<"all" | "active" | "saved" | "rejected" | "offers">("all");
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage your job applications</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Filter size={16} />
              Filters
            </Button>
            <Button className="gap-2">
              <Plus size={16} />
              Add Job
            </Button>
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
          
          <TabsContent value="all">
            <div className="bg-white rounded-lg p-6">
              <JobList jobs={mockJobs} />
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="bg-white rounded-lg p-6">
              <JobList 
                jobs={mockJobs.filter(
                  job => job.status === "applied" || job.status === "interview"
                )} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="bg-white rounded-lg p-6">
              <JobList 
                jobs={mockJobs.filter(job => job.status === "saved")} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="rejected">
            <div className="bg-white rounded-lg p-6">
              <JobList 
                jobs={mockJobs.filter(job => job.status === "rejected")} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="offers">
            <div className="bg-white rounded-lg p-6">
              <JobList 
                jobs={mockJobs.filter(job => job.status === "offer")} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Applications;
