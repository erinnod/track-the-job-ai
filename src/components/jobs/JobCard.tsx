
import { JobApplication, statusColors, statusLabels } from "@/data/mockJobs";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  MoreHorizontal, 
  ExternalLink, 
  Edit, 
  Trash 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: JobApplication;
}

const JobCard = ({ job }: JobCardProps) => {
  const formattedDate = (dateString: string) => {
    if (!dateString) return "Not applied yet";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div className="flex items-start space-x-4">
          {job.logo ? (
            <img 
              src={job.logo} 
              alt={`${job.company} logo`} 
              className="w-10 h-10 rounded-md object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-bold">
                {job.company.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium text-lg">{job.position}</h3>
            <p className="text-gray-500">{job.company}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="-mt-1">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{job.location}</span>
        </div>
        
        {job.salary && (
          <div className="mt-3 text-sm">
            <span className="font-medium">Salary: </span>
            <span>{job.salary}</span>
          </div>
        )}
        
        <div className="mt-4">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]} text-white`}>
            {statusLabels[job.status]}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-gray-500 flex items-center">
        <Calendar className="h-3 w-3 mr-1" />
        <span>{formattedDate(job.appliedDate)}</span>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
