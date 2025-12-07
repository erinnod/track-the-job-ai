/**
 * JobList Component
 *
 * A smart component that manages job application filtering, sorting and display.
 * Handles search, status filtering, and sorting with proper error and loading states.
 * Uses memoization for performance optimization of expensive operations.
 */

import { JobApplication, statusLabels } from "@/data/mockJobs";
import { useState, useEffect, useMemo, useCallback } from "react";
import JobSearchBar from "./JobSearchBar";
import StatusFilterDropdown from "./StatusFilterDropdown";
import FilterTags from "./FilterTags";
import JobListDisplay from "./JobListDisplay";
import { useJobs } from "@/contexts/JobContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface JobListProps {
  jobs: JobApplication[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  sortBy?: string;
  setSortBy?: (value: string) => void;
}

const JobList = ({
  jobs: initialJobs,
  isLoading = false,
  error = null,
  onRetry,
  sortBy: externalSortBy,
  setSortBy: externalSetSortBy,
}: JobListProps) => {
  // Local state
  const [internalSortBy, setInternalSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<JobApplication["status"][]>(
    []
  );

  // Global state
  const { deleteJob } = useJobs();

  // Use either external or internal sort state
  const sortBy = externalSortBy || internalSortBy;
  const setSortBy = externalSetSortBy || setInternalSortBy;

  // Update local jobs state when initialJobs prop changes
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  /**
   * Handle job deletion with error handling
   */
  const handleRemoveJob = useCallback(
    async (id: string) => {
      try {
        await deleteJob(id);
        // Global state will trigger a props update, no need to modify local state
      } catch (error) {
        console.error("Error removing job:", error);
        // Error is handled by the JobContext with toast notifications
      }
    },
    [deleteJob]
  );

  /**
   * Toggle a status in the filter list
   */
  const handleToggleStatus = useCallback((status: JobApplication["status"]) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }, []);

  /**
   * Clear all applied filters
   */
  const clearFilters = useCallback(() => {
    setStatusFilter([]);
    setSearchTerm("");
  }, []);

  /**
   * Normalize search term for case-insensitive comparison
   */
  const normalizedSearchTerm = useMemo(
    () => searchTerm.toLowerCase().trim(),
    [searchTerm]
  );

  /**
   * Apply filters to the job list
   * Memoized to prevent unnecessary recalculations
   */
  const filteredJobs = useMemo(() => {
    // If no filters applied, return all jobs
    if (normalizedSearchTerm === "" && statusFilter.length === 0) {
      return jobs;
    }

    return jobs.filter((job) => {
      // Text search filter - match against multiple fields
      const matchesSearch =
        normalizedSearchTerm === "" ||
        job.company.toLowerCase().includes(normalizedSearchTerm) ||
        job.position.toLowerCase().includes(normalizedSearchTerm) ||
        (job.location &&
          job.location.toLowerCase().includes(normalizedSearchTerm));

      // Status filter - only apply if statuses are selected
      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(job.status);

      return matchesSearch && matchesStatus;
    });
  }, [jobs, normalizedSearchTerm, statusFilter]);

  /**
   * Sort the filtered jobs based on the selected sort method
   * Memoized to prevent unnecessary recalculations
   */
  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.appliedDate || b.lastUpdated).getTime() -
            new Date(a.appliedDate || a.lastUpdated).getTime()
          );
        case "oldest":
          return (
            new Date(a.appliedDate || a.lastUpdated).getTime() -
            new Date(b.appliedDate || b.lastUpdated).getTime()
          );
        case "company":
          return a.company.localeCompare(b.company);
        case "position":
          return a.position.localeCompare(b.position);
        default:
          return 0;
      }
    });
  }, [filteredJobs, sortBy]);

  // Show error if one exists
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading jobs</AlertTitle>
        <AlertDescription>
          {error.message ||
            "Failed to load job applications. Please try again."}
          {onRetry && (
            <button
              onClick={onRetry}
              className="underline ml-2 hover:text-red-400"
            >
              Retry
            </button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-6">
        <JobSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <StatusFilterDropdown
          statusFilter={statusFilter}
          handleToggleStatus={handleToggleStatus}
          clearFilters={clearFilters}
        />
      </div>

      {/* Only show filter tags if there are filters applied */}
      {(statusFilter.length > 0 || searchTerm) && (
        <FilterTags
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          handleToggleStatus={handleToggleStatus}
          clearFilters={clearFilters}
        />
      )}

      <div aria-live="polite" className="sr-only">
        {isLoading
          ? "Loading job applications"
          : `${sortedJobs.length} job applications found${
              statusFilter.length > 0 ? " with filters applied" : ""
            }`}
      </div>

      <JobListDisplay
        jobs={sortedJobs}
        onRemoveJob={handleRemoveJob}
        isLoading={isLoading}
        onRetry={onRetry}
      />
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default JobList;
