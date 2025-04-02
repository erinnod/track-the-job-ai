import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { JobApplication } from "@/data/mockJobs";
import { useJobs } from "@/contexts/JobContext";
import JobForm from "./JobForm";

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

const EditJobModal = ({ isOpen, onClose, jobId }: EditJobModalProps) => {
  const { jobs, updateJob } = useJobs();
  const [initialJob, setInitialJob] = useState<JobApplication | null>(null);

  // Find the job when jobId changes
  useEffect(() => {
    if (jobId) {
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        setInitialJob(job);
      }
    }
  }, [jobId, jobs]);

  const handleSubmit = (updatedJob: JobApplication) => {
    if (!initialJob) return;

    // Ensure we keep the same ID and created date
    const jobToUpdate = {
      ...updatedJob,
      id: initialJob.id,
      lastUpdated: new Date().toISOString(),
    };

    // Update the job
    updateJob(jobToUpdate);

    toast.success("Job updated successfully!");
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!initialJob) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Job Application</DialogTitle>
        </DialogHeader>

        <JobForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={initialJob}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              // Find the form submit button by its id and click it
              document.getElementById("job-form-submit")?.click();
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobModal;
