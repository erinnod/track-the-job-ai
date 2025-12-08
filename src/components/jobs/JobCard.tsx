import { JobApplication, statusLabels } from "@/data/mockJobs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import JobDetailsModal from "./JobDetailsModal";
import { formatSalaryForDisplay } from "@/utils/currencyUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobCardProps {
  job: JobApplication;
  onRemove: (id: string) => void;
}

const getStatusColor = (status: JobApplication["status"]) => {
  switch (status) {
    case "offer":
      return "bg-[#DCFCE7]"; // Green for offers
    case "rejected":
      return "bg-[#FFE4E6]"; // Red/pink for rejected
    case "interview":
      return "bg-[#D3E4FD]"; // Blue for interview
    case "applied":
      return "bg-[#EDE9FE]"; // Purple for applied
    case "saved":
    default:
      return "bg-[#F1F0FB]"; // Grey for saved/default
  }
};

const JobCard = ({ job, onRemove }: JobCardProps) => {
  const { toast } = useToast();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);

  const handleOpenRemoveConfirm = () => {
    setIsConfirmRemoveOpen(true);
  };

  const handleConfirmRemove = () => {
    onRemove(job.id);
    setIsConfirmRemoveOpen(false);
    toast({
      title: "Job removed",
      description: `${job.position} at ${job.company} has been removed`,
    });
  };

  const handleCancelRemove = () => {
    setIsConfirmRemoveOpen(false);
  };

  const handleViewDetails = () => {
    setIsDetailsModalOpen(true);
  };

  const cardBgColor = getStatusColor(job.status);
  const salaryDisplay = formatSalaryForDisplay(job.salary, job.location);

  return (
    <>
      <Card
        className={`h-full border-0 overflow-hidden ${cardBgColor} shadow-none rounded-xl`}
      >
        <div className="flex justify-between items-center px-4 pt-4">
          <span className="text-sm text-gray-600">
            {job.appliedDate
              ? new Date(job.appliedDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : job.lastUpdated
              ? new Date(job.lastUpdated).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date unavailable"}
          </span>
          <button
            onClick={handleOpenRemoveConfirm}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <CardContent className="p-4">
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-1">{job.company}</div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {job.position}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 my-3">
            {job.employmentType && (
              <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
                {job.employmentType}
              </span>
            )}
            {job.type && (
              <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
                {job.type}
              </span>
            )}
            {job.remote !== undefined && (
              <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700">
                {job.workType || (job.remote ? "Remote" : "On-site")}
              </span>
            )}
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-gray-700 font-bold">
              {statusLabels[job.status]}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center text-sm text-gray-700">
            {salaryDisplay}
          </div>
          <Button
            variant="default"
            size="sm"
            className="rounded-full bg-black text-white hover:bg-gray-800 px-5"
            onClick={handleViewDetails}
          >
            Details
          </Button>
        </CardFooter>
      </Card>

      {/* Render the details modal */}
      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        jobId={job.id}
      />

      {/* Confirmation dialog for removing job */}
      <Dialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove this job application?</DialogTitle>
            <DialogDescription>
              This will permanently delete the job application from your
              records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={handleCancelRemove}>
              No
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemove}>
              Yes, remove it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCard;
