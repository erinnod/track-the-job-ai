
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { JobApplication } from "@/data/mockJobs";

interface JobFormProps {
  onSubmit: (job: JobApplication) => void;
  onCancel: () => void;
}

const JobForm = ({ onSubmit, onCancel }: JobFormProps) => {
  const [jobData, setJobData] = useState({
    company: "",
    position: "",
    location: "",
    status: "saved",
    companyWebsite: "",
    salary: "",
    jobDescription: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (value: string) => {
    setJobData(prev => ({ ...prev, status: value as JobApplication["status"] }));
  };
  
  const handleSubmit = () => {
    if (!jobData.company.trim() || !jobData.position.trim()) {
      toast.error("Company name and position are required");
      return;
    }
    
    // Create a new job with the form data
    const newJob: JobApplication = {
      id: Date.now().toString(), // Generate a unique ID
      company: jobData.company,
      position: jobData.position,
      location: jobData.location || "Not specified",
      status: jobData.status as JobApplication["status"],
      appliedDate: jobData.status === "saved" ? "" : new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      companyWebsite: jobData.companyWebsite,
      salary: jobData.salary,
      jobDescription: jobData.jobDescription,
      remote: jobData.location.toLowerCase().includes("remote")
    };
    
    // Pass the new job to the parent component
    onSubmit(newJob);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name*</Label>
            <Input 
              id="company" 
              name="company" 
              value={jobData.company} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position*</Label>
            <Input 
              id="position" 
              name="position" 
              value={jobData.position} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              name="location" 
              value={jobData.location} 
              onChange={handleChange} 
              placeholder="e.g. Remote, New York, NY" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={jobData.status} onValueChange={handleStatusChange}>
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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Company Website</Label>
            <Input 
              id="companyWebsite" 
              name="companyWebsite" 
              value={jobData.companyWebsite} 
              onChange={handleChange} 
              placeholder="https://..." 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Salary (if known)</Label>
            <Input 
              id="salary" 
              name="salary" 
              value={jobData.salary} 
              onChange={handleChange} 
              placeholder="e.g. $70,000 - $90,000" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description</Label>
          <Textarea 
            id="jobDescription" 
            name="jobDescription" 
            value={jobData.jobDescription} 
            onChange={handleChange} 
            placeholder="Paste job description or add notes..."
            rows={4} 
          />
        </div>
      </div>
      
      <button 
        id="job-form-submit" 
        type="submit" 
        style={{ display: 'none' }}
      />
    </form>
  );
};

export default JobForm;
