
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JobApplication } from "@/data/mockJobs";

interface CompanyInfoFieldsProps {
  jobData: Partial<JobApplication>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const CompanyInfoFields = ({ jobData, handleChange }: CompanyInfoFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="company">Company Name*</Label>
        <Input 
          id="company" 
          name="company" 
          value={jobData.company || ""} 
          onChange={handleChange} 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="position">Position*</Label>
        <Input 
          id="position" 
          name="position" 
          value={jobData.position || ""} 
          onChange={handleChange} 
          required 
        />
      </div>
    </div>
  );
};

export default CompanyInfoFields;
