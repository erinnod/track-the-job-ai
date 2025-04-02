
import { JobApplication } from "@/data/mockJobs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface JobListHeaderProps {
  jobCount: number;
  sortBy: string;
  setSortBy: (value: string) => void;
}

const JobListHeader = ({ jobCount, sortBy, setSortBy }: JobListHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
        <span className="ml-3 text-sm bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
          {jobCount}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        <Select defaultValue={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] bg-white border-gray-200">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="company">Company Name</SelectItem>
            <SelectItem value="position">Position</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JobListHeader;
