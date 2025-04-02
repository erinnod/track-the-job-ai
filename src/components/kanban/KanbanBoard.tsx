
import { JobApplication, statusLabels } from "@/data/mockJobs";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  jobs: JobApplication[];
  onCardMove: (id: string, newStatus: JobApplication['status']) => void;
}

const KanbanBoard = ({ jobs, onCardMove }: KanbanBoardProps) => {
  // Define all possible statuses
  const statuses: JobApplication['status'][] = [
    "saved", 
    "applied", 
    "interview", 
    "offer", 
    "rejected"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
      {statuses.map(status => {
        const statusJobs = jobs.filter(job => job.status === status);
        
        return (
          <KanbanColumn 
            key={status}
            status={status}
            statusLabel={statusLabels[status]}
            jobs={statusJobs}
            onCardMove={onCardMove}
          />
        );
      })}
    </div>
  );
};

export default KanbanBoard;
