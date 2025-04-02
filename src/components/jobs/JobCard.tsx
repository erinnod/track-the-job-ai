
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
  Trash,
  Bookmark 
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

// Array of card style classes
const cardStyles = ["card-mint", "card-peach", "card-lavender", "card-skyblue"];

const JobCard = ({ job }: JobCardProps) => {
  const formattedDate = (dateString: string) => {
    if (!dateString) return "Not applied yet";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get a consistent style based on the job ID
  const cardStyleIndex = parseInt(job.id.toString().charAt(0)) % cardStyles.length;
  const cardStyle = cardStyles[cardStyleIndex];
  
  return (
    <Card className={`h-full transition-all duration-200 border dark:border-gray-800 ${cardStyle}`}>
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start w-full">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {formattedDate(job.appliedDate)}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-start space-x-3">
            {job.logo ? (
              <div className="rounded-full overflow-hidden w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white">
                <img 
                  src={job.logo} 
                  alt={`${job.company} logo`} 
                  className="w-6 h-6 object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-jobtrakr-charcoal font-bold">
                  {job.company.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{job.position}</h3>
              <p className="text-gray-500 dark:text-gray-400">{job.company}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{job.location}</span>
        </div>
        
        {job.salary && (
          <div className="mt-3 text-sm">
            <span className="font-medium">${job.salary.replace(/[^\d]/g, '')} </span>
            <span className="text-gray-500 dark:text-gray-400">per hour</span>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          {job.type && (
            <span className="text-xs py-1 px-3 rounded-full bg-white/20 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              {job.type}
            </span>
          )}
          {job.level && (
            <span className="text-xs py-1 px-3 rounded-full bg-white/20 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              {job.level} level
            </span>
          )}
          <span className="text-xs py-1 px-3 rounded-full bg-white/20 dark:bg-white/10 text-gray-700 dark:text-gray-300">
            {job.remote ? 'Remote' : 'On-site'}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-end">
        <Button variant="default" className="text-xs rounded-full bg-black text-white hover:bg-gray-800">
          Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
