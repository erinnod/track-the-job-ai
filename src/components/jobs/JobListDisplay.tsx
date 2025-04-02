
import { JobApplication } from "@/data/mockJobs";
import JobCard from "./JobCard";

interface JobListDisplayProps {
  jobs: JobApplication[];
  onRemoveJob: (id: string) => void;
}

const JobListDisplay = ({ jobs, onRemoveJob }: JobListDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.length > 0 ? (
        jobs.map(job => (
          <JobCard 
            key={job.id} 
            job={job} 
            onRemove={onRemoveJob}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-10">
          <p className="text-gray-500">No jobs found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default JobListDisplay;
