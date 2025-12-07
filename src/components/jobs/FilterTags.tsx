/**
 * FilterTags Component
 *
 * Displays active filters as removable tags, including status filters and search terms.
 * Provides a way to clear individual filters or all filters at once.
 * Uses React.memo for performance optimization.
 */

import { X } from "lucide-react";
import { JobApplication, statusLabels } from "@/data/mockJobs";
import { Dispatch, SetStateAction, memo, useCallback } from "react";

interface FilterTagsProps {
  statusFilter: JobApplication["status"][];
  handleToggleStatus: (status: JobApplication["status"]) => void;
  clearFilters: () => void;
  searchTerm?: string;
  setSearchTerm?: Dispatch<SetStateAction<string>>;
}

const FilterTags = memo(
  ({
    statusFilter,
    handleToggleStatus,
    clearFilters,
    searchTerm = "",
    setSearchTerm,
  }: FilterTagsProps) => {
    // Don't render anything if no filters are active
    const hasActiveFilters =
      statusFilter.length > 0 || (searchTerm && searchTerm.trim() !== "");

    if (!hasActiveFilters) return null;

    // Clear search term handler
    const handleClearSearch = useCallback(() => {
      if (setSearchTerm) {
        setSearchTerm("");
      }
    }, [setSearchTerm]);

    return (
      <div className="flex flex-wrap items-center mb-4 gap-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Active filters:
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Status filter tags */}
          {statusFilter.map((status) => (
            <div
              key={status}
              className="flex items-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs py-1 px-2 rounded-full"
              role="status"
            >
              {statusLabels[status]}
              <button
                className="ml-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleToggleStatus(status)}
                aria-label={`Remove ${statusLabels[status]} filter`}
                title={`Remove ${statusLabels[status]} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Search term tag */}
          {searchTerm && searchTerm.trim() !== "" && setSearchTerm && (
            <div
              className="flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs py-1 px-2 rounded-full"
              role="status"
            >
              Search: {searchTerm}
              <button
                className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                onClick={handleClearSearch}
                aria-label="Clear search filter"
                title="Clear search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Clear all button */}
          {hasActiveFilters &&
            (statusFilter.length > 1 ||
              (searchTerm && statusFilter.length > 0)) && (
              <button
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:underline"
                onClick={clearFilters}
                aria-label="Clear all filters"
                title="Clear all filters"
              >
                Clear all
              </button>
            )}
        </div>
      </div>
    );
  }
);

FilterTags.displayName = "FilterTags";

export default FilterTags;
