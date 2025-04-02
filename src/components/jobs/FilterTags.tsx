
import { X } from "lucide-react";
import { JobApplication, statusLabels } from "@/data/mockJobs";

interface FilterTagsProps {
  statusFilter: JobApplication['status'][];
  handleToggleStatus: (status: JobApplication['status']) => void;
  clearFilters: () => void;
}

const FilterTags = ({ 
  statusFilter, 
  handleToggleStatus, 
  clearFilters 
}: FilterTagsProps) => {
  if (statusFilter.length === 0) return null;
  
  return (
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
  );
};

export default FilterTags;
