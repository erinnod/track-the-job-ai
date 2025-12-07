import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobApplication } from "@/data/mockJobs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface LocationStatusFieldsProps {
  jobData: Partial<JobApplication>;
  events?: JobApplication["events"];
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleStatusChange: (value: string) => void;
  handleWorkTypeChange: (value: string) => void;
  handleEmploymentTypeChange: (value: string) => void;
  handleInterviewDateChange?: (date: Date) => void;
  handleInterviewTimeChange?: (time: string) => void;
}

const LocationStatusFields = ({
  jobData,
  events,
  handleChange,
  handleStatusChange,
  handleWorkTypeChange,
  handleEmploymentTypeChange,
  handleInterviewDateChange,
  handleInterviewTimeChange,
}: LocationStatusFieldsProps) => {
  const [showInterviewFields, setShowInterviewFields] = useState(false);
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(
    undefined
  );
  const [interviewTime, setInterviewTime] = useState<string>("");

  // Show interview fields if status is "interview"
  useEffect(() => {
    setShowInterviewFields(jobData.status === "interview");

    // If we have event data with interview date, populate the fields
    const sourceEvents = events || jobData.events;
    if (sourceEvents && sourceEvents.length > 0) {
      const interviewEvent = sourceEvents.find((event) =>
        event.title.toLowerCase().includes("interview")
      );

      if (interviewEvent && interviewEvent.date) {
        try {
          const eventDate = new Date(interviewEvent.date);
          setInterviewDate(eventDate);

          // Extract time if it's a full datetime string
          if (interviewEvent.date.includes("T")) {
            setInterviewTime(format(eventDate, "HH:mm"));
          }
        } catch (e) {
          console.error("Error parsing interview date", e);
        }
      }
    }
  }, [jobData.status, events, jobData.events]);

  const onDateChange = (date: Date | undefined) => {
    setInterviewDate(date);
    if (date && handleInterviewDateChange) {
      handleInterviewDateChange(date);
    }
  };

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterviewTime(e.target.value);
    if (handleInterviewTimeChange) {
      handleInterviewTimeChange(e.target.value);
    }
  };

  const onStatusChange = (value: string) => {
    handleStatusChange(value);
    // Show interview fields immediately if status is changed to interview
    setShowInterviewFields(value === "interview");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={jobData.location || ""}
            onChange={handleChange}
            placeholder="e.g. New York, NY"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={jobData.status || "saved"}
            onValueChange={onStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Interview details section - only visible when status is "interview" */}
      {showInterviewFields && (
        <div className="border p-4 rounded-md bg-blue-50 mt-2 mb-2">
          <h3 className="text-sm font-medium mb-3">Interview Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewDate">Interview Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {interviewDate ? (
                      format(interviewDate, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={interviewDate}
                    onSelect={onDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewTime">Interview Time</Label>
              <div className="flex items-center border rounded-md pl-3 pr-3 bg-white">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <Input
                  id="interviewTime"
                  name="interviewTime"
                  type="time"
                  value={interviewTime}
                  onChange={onTimeChange}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workType">Work Type</Label>
          <Select
            value={jobData.workType || "On-site"}
            onValueChange={handleWorkTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select work type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Select
            value={jobData.employmentType || "Full-time"}
            onValueChange={handleEmploymentTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};

export default LocationStatusFields;
