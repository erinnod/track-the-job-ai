
import { JobApplication, statusLabels } from "@/data/mockJobs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, ArrowRightIcon, ArrowLeftIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface KanbanCardProps {
  job: JobApplication;
  onCardMove: (id: string, newStatus: JobApplication['status']) => void;
}

const statuses: JobApplication['status'][] = ["saved", "applied", "interview", "offer", "rejected"];

const KanbanCard = ({ job, onCardMove }: KanbanCardProps) => {
  const currentStatusIndex = statuses.indexOf(job.status);
  
  const moveLeft = () => {
    if (currentStatusIndex > 0) {
      onCardMove(job.id, statuses[currentStatusIndex - 1]);
    }
  };
  
  const moveRight = () => {
    if (currentStatusIndex < statuses.length - 1) {
      onCardMove(job.id, statuses[currentStatusIndex + 1]);
    }
  };
  
  const formattedDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white">
      <CardContent className="p-3">
        <div className="mb-2">
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <Building className="mr-1 h-3 w-3" />
            {job.company}
          </div>
          <h4 className="font-medium text-gray-900 truncate">{job.position}</h4>
          {job.location && (
            <div className="text-sm text-gray-500 truncate">{job.location}</div>
          )}
        </div>
        
        {job.appliedDate && (
          <div className="text-xs text-gray-500 mt-2">
            Applied {formattedDate(job.appliedDate)}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-8 w-8" 
            onClick={moveLeft}
            disabled={currentStatusIndex === 0}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          
          {job.salary && (
            <div className="text-xs font-medium">{job.salary}</div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-8 w-8" 
            onClick={moveRight}
            disabled={currentStatusIndex === statuses.length - 1}
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;
