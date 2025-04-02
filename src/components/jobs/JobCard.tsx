
import { JobApplication, statusLabels } from "@/data/mockJobs";
import { 
  Card, 
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  Building,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: JobApplication;
  onRemove: (id: string) => void;
}

// Function to get a pastel color based on job position or company
const getPastelColor = (job: JobApplication) => {
  // Simple function to generate a consistent color based on the first letter of position
  const colors = [
    "bg-[#FDE1D3]", // Soft Peach (like Amazon card)
    "bg-[#D3E4FD]", // Soft Blue (like Twitter card)
    "bg-[#DCFCE7]", // Soft Green (like Google card)
    "bg-[#EDE9FE]", // Soft Purple (like Dribbble card)
    "bg-[#FFE4E6]", // Soft Pink (like Airbnb card)
    "bg-[#F1F0FB]", // Soft Gray
  ];
  
  const index = job.company.charCodeAt(0) % colors.length;
  return colors[index];
};

const JobCard = ({ job, onRemove }: JobCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const formattedDate = (dateString: string) => {
    if (!dateString) return "Not applied yet";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  const handleRemove = () => {
    onRemove(job.id);
    toast({
      title: "Job removed",
      description: `${job.position} at ${job.company} has been removed`,
    });
  };
  
  const handleViewDetails = () => {
    // For now we'll show a toast with job details
    // In a future update this could navigate to a job details page
    toast({
      title: `${job.position} at ${job.company}`,
      description: `Status: ${statusLabels[job.status]} | Location: ${job.location}`,
    });
  };
  
  // Get the appropriate background color
  const cardBgColor = getPastelColor(job);
  
  return (
    <Card className={`h-full border-0 overflow-hidden ${cardBgColor} shadow-none rounded-xl`}>
      {/* Date display at top */}
      <div className="flex justify-between items-center px-4 pt-4">
        <span className="text-sm text-gray-600">{job.appliedDate ? new Date(job.appliedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "Saved"}</span>
        {/* Make the close button visible again */}
        <button 
          onClick={handleRemove}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <CardContent className="p-4">
        {/* Company logo and info */}
        <div className="mb-3">
          <div className="text-sm text-gray-700 mb-1">{job.company}</div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">{job.position}</h3>
        </div>
        
        {/* Tags section */}
        <div className="flex flex-wrap gap-2 my-3">
          {job.type && (
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
              {job.type}
            </span>
          )}
          {job.level && (
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
              {job.level} level
            </span>
          )}
          {job.remote !== undefined && (
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
              {job.location.includes("Remote") ? "Remote" : "On-site"}
            </span>
          )}
          {/* Additional tag if needed */}
          {job.status === "interview" && (
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
              Interview
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="flex items-center text-sm text-gray-700">
          {/* Fixed the double dollar sign by removing the DollarSign icon */}
          {job.salary || "Not specified"}
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-full bg-black text-white hover:bg-gray-800 px-5"
          onClick={handleViewDetails}
        >
          Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
