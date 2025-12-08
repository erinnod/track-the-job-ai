
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JobApplication } from "@/data/mockJobs";
import { getCurrencySymbol } from "@/utils/currencyUtils";

interface AdditionalInfoFieldsProps {
  jobData: Partial<JobApplication>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const AdditionalInfoFields = ({ jobData, handleChange }: AdditionalInfoFieldsProps) => {
  const currencySymbol = getCurrencySymbol();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="companyWebsite">Company Website</Label>
        <Input 
          id="companyWebsite" 
          name="companyWebsite" 
          value={jobData.companyWebsite || ""} 
          onChange={handleChange} 
          placeholder="https://..." 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="salary">Salary (if known)</Label>
        <Input 
          id="salary" 
          name="salary" 
          value={jobData.salary || ""} 
          onChange={handleChange} 
          placeholder={`e.g. ${currencySymbol}70,000 - ${currencySymbol}90,000`} 
        />
      </div>
    </div>
  );
};

export default AdditionalInfoFields;
