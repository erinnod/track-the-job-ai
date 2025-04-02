import { JobApplication } from "@/data/mockJobs";
import JobCard from "./JobCard";
import { Skeleton } from "@/components/ui/skeleton";

interface JobListDisplayProps {
  jobs: JobApplication[];
  onRemoveJob: (id: string) => void;
  isLoading?: boolean;
}

const JobListDisplay = ({
  jobs,
  onRemoveJob,
  isLoading = false,
}: JobListDisplayProps) => {
  // Show skeleton placeholders while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
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
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <JobCard key={job.id} job={job} onRemove={onRemoveJob} />
        ))
      ) : (
        <div className="col-span-full text-center py-10">
          <p className="text-gray-500">
            No jobs found. Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default JobListDisplay;
