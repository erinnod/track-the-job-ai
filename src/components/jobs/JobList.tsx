
import { JobApplication, statusLabels } from "@/data/mockJobs";
import JobCard from "./JobCard";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Filter, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface JobListProps {
  jobs: JobApplication[];
}

const JobList = ({ jobs: initialJobs }: JobListProps) => {
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<JobApplication['status'][]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const handleRemoveJob = (id: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
  };
  
  const handleToggleStatus = (status: JobApplication['status']) => {
    setStatusFilter(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  const clearFilters = () => {
    setStatusFilter([]);
  };
  
  const filteredJobs = jobs.filter(job => {
    // Text search filter
    const matchesSearch = 
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(job.status);
    
    return matchesSearch && matchesStatus;
  });
  
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white border-gray-200">
              <Filter className="h-4 w-4 mr-2" />
              Status Filters
              {statusFilter.length > 0 && (
                <span className="ml-2 h-5 w-5 bg-black text-white rounded-full text-xs flex items-center justify-center">
                  {statusFilter.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("applied")}
              onSelect={(e) => {
                e.preventDefault();
                handleToggleStatus("applied");
              }}
            >
              Applied
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("interview")}
              onSelect={(e) => {
                e.preventDefault();
                handleToggleStatus("interview");
              }}
            >
              Interview
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("offer")}
              onSelect={(e) => {
                e.preventDefault();
                handleToggleStatus("offer");
              }}
            >
              Offer
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("rejected")}
              onSelect={(e) => {
                e.preventDefault();
                handleToggleStatus("rejected");
              }}
            >
              Rejected
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("saved")}
              onSelect={(e) => {
                e.preventDefault();
                handleToggleStatus("saved");
              }}
            >
              Saved
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {statusFilter.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs text-gray-500" 
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5 mr-2" />
                Clear filters
              </Button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {statusFilter.length > 0 && (
        <div className="flex items-center mb-4 gap-2">
          <div className="text-sm text-gray-500">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {statusFilter.map(status => (
              <div key={status} className="flex items-center bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded-full">
                {statusLabels[status]}
                <button 
                  className="ml-1.5 text-gray-500 hover:text-gray-700"
                  onClick={() => handleToggleStatus(status)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {statusFilter.length > 1 && (
              <button 
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={clearFilters}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedJobs.length > 0 ? (
          sortedJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onRemove={handleRemoveJob}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No jobs found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;
