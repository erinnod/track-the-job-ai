import { useState } from "react";
import { JobApplication, statusLabels } from "@/data/mockJobs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  DollarSign,
  Building,
  Globe,
  Phone,
  Mail,
  UserCircle,
  Clock,
  CalendarDays,
  ExternalLink,
  PoundSterling,
  PenLine,
  FileText,
  X,
  UserCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { useJobs } from "@/contexts/JobContext";
import EditJobModal from "./EditJobModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrencyIcon } from "@/utils/currencyUtils";

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

const JobDetailsModal = ({ isOpen, onClose, jobId }: JobDetailsModalProps) => {
  const { jobs, updateJob } = useJobs();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Find the job in the jobs array
  const job = jobs.find((j) => j.id === jobId);

  if (!job) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColorClass = (status: JobApplication["status"]) => {
    switch (status) {
      case "offer":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "interview":
        return "bg-blue-100 text-blue-800";
      case "applied":
        return "bg-purple-100 text-purple-800";
      case "saved":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold">
              {job.position}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Company information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-1">Company</h3>
              <div className="flex items-center space-x-3 px-1">
                {job.logo ? (
                  <img
                    src={job.logo}
                    alt={job.company}
                    className="w-10 h-10 rounded-md"
                  />
                ) : (
                  <Building className="w-10 h-10 text-gray-400 p-2 bg-gray-100 rounded-md" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{job.company}</p>
                    <Badge
                      className={`${getStatusColorClass(
                        job.status
                      )} px-2 py-1 text-xs font-medium`}
                    >
                      {statusLabels[job.status]}
                    </Badge>
                  </div>

                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Company Website
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Basic job details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-1">
                Basic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Location
                    </p>
                    <p>{job.location || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  {getCurrencyIcon(job.location)}
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Salary</p>
                    <p>{job.salary || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Applied Date
                    </p>
                    <p>
                      {job.appliedDate
                        ? formatDate(job.appliedDate)
                        : "Not applied yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Last Updated
                    </p>
                    <p>{formatDate(job.lastUpdated)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-1">
                Job Details
              </h3>
              <div className="flex flex-wrap gap-2 px-1">
                {job.employmentType && (
                  <Badge variant="outline">{job.employmentType}</Badge>
                )}
                {job.type && <Badge variant="outline">{job.type}</Badge>}
                <Badge variant="outline">
                  {job.workType || (job.remote ? "Remote" : "On-site")}
                </Badge>
              </div>
            </div>

            {/* Job Description */}
            {job.jobDescription && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-1">
                  Job Description
                </h3>
                <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap">
                  {job.jobDescription}
                </div>
              </div>
            )}

            {/* Contacts */}
            {job.contacts && job.contacts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-1">
                  Contacts
                </h3>
                <div className="space-y-4 px-1">
                  {job.contacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center space-x-2 mb-3">
                        <UserCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <p className="font-medium">{contact.name}</p>
                        {contact.position && (
                          <Badge variant="outline" className="ml-2">
                            {contact.position}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2 pl-7">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {contact.email}
                          </a>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events / Timeline */}
            {job.events && job.events.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-1">
                  Interview Process
                </h3>
                <div className="space-y-4 pl-2">
                  {job.events.map((event, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-blue-400 pl-4 pb-4 relative"
                    >
                      <div className="absolute w-3 h-3 bg-blue-400 rounded-full -left-[7px] top-1"></div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarDays className="w-4 h-4 mr-1 flex-shrink-0" />
                        {formatDate(event.date)}
                      </p>
                      <p className="font-medium mt-1">{event.title}</p>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {job.notes && job.notes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-1">Notes</h3>
                <ul className="space-y-2 list-disc pl-6">
                  {job.notes.map((note, index) => (
                    <li key={index} className="text-sm">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center gap-4 pt-6 mt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="default" onClick={handleOpenEditModal}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Modal */}
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        jobId={jobId}
      />
    </>
  );
};

export default JobDetailsModal;
