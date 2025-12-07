/**
 * JobListDisplay Component
 *
 * Renders a grid of job cards with loading skeletons and empty states.
 * Handles loading, empty results, and retry functionality.
 * Uses React.memo for performance optimization.
 */

import { JobApplication } from "@/data/mockJobs";
import JobCard from "./JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Inbox, AlertCircle } from "lucide-react";
import { memo, useMemo } from "react";

interface JobListDisplayProps {
  jobs: JobApplication[];
  onRemoveJob: (id: string) => void;
  isLoading?: boolean;
  onRetry?: () => void;
  error?: Error | null;
}

const JobListDisplay = ({
  jobs,
  onRemoveJob,
  isLoading = false,
  onRetry,
  error = null,
}: JobListDisplayProps) => {
  // Calculate number of skeleton cards based on viewport size
  const skeletonCount = useMemo(() => {
    // Get approximate column count based on viewport width
    const viewportWidth = window.innerWidth;
    let columns = 1;

    if (viewportWidth >= 1536) columns = 5; // 2xl
    else if (viewportWidth >= 1280) columns = 4; // xl
    else if (viewportWidth >= 1024) columns = 3; // lg
    else if (viewportWidth >= 640) columns = 2; // sm

    // Return enough skeletons for 2 rows
    return columns * 2;
  }, []);

  // Show skeleton placeholders while loading
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading job applications...</span>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="col-span-full text-center py-10 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/30">
          <AlertCircle
            className="h-6 w-6 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Error loading applications
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {error.message || "Failed to load job applications"}
        </p>

        {onRetry && (
          <div className="mt-6">
            <Button onClick={onRetry} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show empty state when no jobs match filters
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800">
          <Search
            className="h-6 w-6 text-gray-600 dark:text-gray-400"
            aria-hidden="true"
          />
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          No job applications found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search or filters.
        </p>

        {onRetry && (
          <div className="mt-6">
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Data
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md max-w-md mx-auto text-left">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            Troubleshooting Tips:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc pl-5">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cache and cookies</li>
            <li>Make sure you're logged in with the correct account</li>
          </ul>
        </div>
      </div>
    );
  }

  // Render the job grid
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
      aria-live="polite"
    >
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onRemove={onRemoveJob} />
      ))}
    </div>
  );
};

// Job card skeleton component for loading states
const JobCardSkeleton = memo(() => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 animate-pulse">
    <div className="flex justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="flex justify-between pt-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </div>
));

JobCardSkeleton.displayName = "JobCardSkeleton";

// Use memo to prevent unnecessary re-renders
export default memo(JobListDisplay);
