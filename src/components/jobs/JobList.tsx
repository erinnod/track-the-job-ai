
import { JobApplication } from "@/data/mockJobs";
import JobCard from "./JobCard";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface JobListProps {
  jobs: JobApplication[];
}

const JobList = ({ jobs }: JobListProps) => {
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredJobs = jobs.filter(job => 
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.appliedDate || b.lastUpdated).getTime() - 
               new Date(a.appliedDate || a.lastUpdated).getTime();
      case "oldest":
        return new Date(a.appliedDate || a.lastUpdated).getTime() - 
               new Date(b.appliedDate || b.lastUpdated).getTime();
      case "company":
        return a.company.localeCompare(b.company);
      case "position":
        return a.position.localeCompare(b.position);
      default:
        return 0;
    }
  });
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
          <span className="ml-3 text-sm bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
            {sortedJobs.length}
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
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            className="pl-9 bg-white border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-white border-gray-200">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedJobs.length > 0 ? (
          sortedJobs.map(job => <JobCard key={job.id} job={job} />)
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No jobs found. Try adjusting your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;
