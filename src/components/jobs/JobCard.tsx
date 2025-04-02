
import { JobApplication, statusLabels } from "@/data/mockJobs";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  ExternalLink, 
  DollarSign,
  Building
} from "lucide-react";
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
    <Card className="h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {job.logo ? (
              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <img 
                  src={job.logo} 
                  alt={`${job.company} logo`} 
                  className="w-8 h-8 object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{job.position}</h3>
              <p className="text-sm text-gray-500">{job.company}</p>
            </div>
          </div>
          <div className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {statusLabels[job.status]}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          <span>{job.location}</span>
        </div>
        
        {job.salary && (
          <div className="mt-2 text-sm flex items-center text-gray-600">
            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
            <span>{job.salary}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          {formattedDate(job.appliedDate)}
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
          <span className="mr-1">Details</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
