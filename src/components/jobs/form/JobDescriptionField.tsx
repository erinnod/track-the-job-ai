
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JobApplication } from "@/data/mockJobs";

interface JobDescriptionFieldProps {
  jobData: Partial<JobApplication> & {
    jobDescription?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const JobDescriptionField = ({ jobData, handleChange }: JobDescriptionFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="jobDescription">Job Description</Label>
      <Textarea 
        id="jobDescription" 
        name="jobDescription" 
        value={jobData.jobDescription || ""} 
        onChange={handleChange} 
        placeholder="Paste job description or add notes..."
        rows={4} 
      />
    </div>
  );
};

export default JobDescriptionField;
