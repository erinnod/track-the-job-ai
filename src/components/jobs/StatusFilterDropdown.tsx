
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import { JobApplication } from "@/data/mockJobs";

interface StatusFilterDropdownProps {
  statusFilter: JobApplication['status'][];
  handleToggleStatus: (status: JobApplication['status']) => void;
  clearFilters: () => void;
}

const StatusFilterDropdown = ({ 
  statusFilter, 
  handleToggleStatus,
  clearFilters 
}: StatusFilterDropdownProps) => {
  return (
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
  );
};

export default StatusFilterDropdown;
