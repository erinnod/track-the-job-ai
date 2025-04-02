
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: JobApplication;
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

const JobCard = ({ job }: JobCardProps) => {
  const formattedDate = (dateString: string) => {
    if (!dateString) return "Not applied yet";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get the appropriate background color
  const cardBgColor = getPastelColor(job);
  
  return (
    <Card className={`h-full border-0 overflow-hidden ${cardBgColor} shadow-none rounded-xl`}>
      {/* Date display at top */}
      <div className="flex justify-between items-center px-4 pt-4">
        <span className="text-sm text-gray-600">{job.appliedDate ? new Date(job.appliedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "Saved"}</span>
        {/* Removed the visibility of the close/bookmark button */}
        <div className="invisible">
          {job.status === "saved" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
          )}
        </div>
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
        >
          Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
