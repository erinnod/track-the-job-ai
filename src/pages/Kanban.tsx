
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { JobApplication, mockJobs } from "@/data/mockJobs";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { useToast } from "@/hooks/use-toast";

const Kanban = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(mockJobs);
  const { toast } = useToast();

  const handleCardMove = (id: string, newStatus: JobApplication['status']) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === id 
          ? { ...job, status: newStatus, lastUpdated: new Date().toISOString() } 
          : job
      )
    );
    
    const job = jobs.find(job => job.id === id);
    if (job) {
      toast({
        title: "Job status updated",
        description: `${job.position} at ${job.company} moved to ${newStatus}`,
      });
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Kanban Board</h1>
        </div>
        
        <KanbanBoard jobs={jobs} onCardMove={handleCardMove} />
      </div>
    </Layout>
  );
};

export default Kanban;
