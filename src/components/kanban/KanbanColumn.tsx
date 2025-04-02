
import { JobApplication, statusLabels } from "@/data/mockJobs";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  status: JobApplication['status'];
  statusLabel: string;
  jobs: JobApplication[];
  onCardMove: (id: string, newStatus: JobApplication['status']) => void;
}

const getStatusColor = (status: JobApplication['status']) => {
  switch (status) {
    case 'offer':
      return "bg-[#DCFCE7] border-green-300"; // Green for offers
    case 'rejected':
      return "bg-[#FFE4E6] border-red-300"; // Red/pink for rejected
    case 'interview':
      return "bg-[#D3E4FD] border-blue-300"; // Blue for interview
    case 'applied':
      return "bg-[#EDE9FE] border-purple-300"; // Purple for applied
    case 'saved':
    default:
      return "bg-[#F1F0FB] border-gray-300"; // Grey for saved/default
  }
};

const KanbanColumn = ({ status, statusLabel, jobs, onCardMove }: KanbanColumnProps) => {
  const columnColorClass = getStatusColor(status);
  
  return (
    <div className={`rounded-lg border ${columnColorClass} p-4 h-[calc(100vh-220px)] flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {statusLabel}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {jobs.length}
          </span>
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {jobs.length > 0 ? (
          jobs.map(job => (
            <KanbanCard 
              key={job.id} 
              job={job} 
              onCardMove={onCardMove} 
            />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 italic text-sm">
            No jobs in this column
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
