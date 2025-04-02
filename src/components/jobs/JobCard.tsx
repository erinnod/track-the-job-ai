
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
  Bookmark,
  Clock,
  DollarSign
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

// Array of card style classes - we'll use the same style for all cards in the new design
const cardStyles = ["card-navy", "card-navy", "card-navy", "card-navy"];

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
    <Card className="h-full transition-all duration-200 border-[1px] bg-gradient-to-br from-[#131A2C] to-[#0F1624] shadow-lg rounded-xl overflow-hidden hover:shadow-xl hover:border-[#5465FF]/30">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start w-full">
            <div className="text-xs text-gray-400 mb-2 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {formattedDate(job.appliedDate)}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-[#5465FF]">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-start space-x-3">
            {job.logo ? (
              <div className="rounded-xl overflow-hidden w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#1A1F2C] border border-[#242C44]">
                <img 
                  src={job.logo} 
                  alt={`${job.company} logo`} 
                  className="w-6 h-6 object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#1A1F2C] flex items-center justify-center flex-shrink-0 border border-[#242C44]">
                <span className="text-white font-bold">
                  {job.company.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg text-white">{job.position}</h3>
              <p className="text-gray-400">{job.company}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-center mt-2 text-sm text-gray-400">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          <span>{job.location}</span>
        </div>
        
        {job.salary && (
          <div className="mt-3 text-sm flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
            <span className="text-white">{job.salary}</span>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          {job.type && (
            <span className="text-xs py-1 px-3 rounded-full bg-[#1A1F2C] border border-[#242C44] text-gray-300">
              {job.type}
            </span>
          )}
          {job.level && (
            <span className="text-xs py-1 px-3 rounded-full bg-[#1A1F2C] border border-[#242C44] text-gray-300">
              {job.level} level
            </span>
          )}
          <span className="text-xs py-1 px-3 rounded-full bg-[#1A1F2C] border border-[#242C44] text-gray-300">
            {job.remote ? 'Remote' : 'On-site'}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className="flex items-center">
          <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
            job.status === 'offer' ? 'bg-green-500' :
            job.status === 'interview' ? 'bg-yellow-500' :
            job.status === 'applied' ? 'bg-blue-500' :
            job.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
          }`}></span>
          <span className="text-xs text-gray-400">
            {statusLabels[job.status]}
          </span>
        </div>
        <Button variant="default" className="text-xs rounded-xl bg-[#5465FF] hover:bg-[#788BFF] text-white">
          Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
