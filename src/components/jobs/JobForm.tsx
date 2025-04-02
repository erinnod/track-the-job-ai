
import { useState } from "react";
import { toast } from "sonner";
import { JobApplication } from "@/data/mockJobs";
import CompanyInfoFields from "./form/CompanyInfoFields";
import LocationStatusFields from "./form/LocationStatusFields";
import AdditionalInfoFields from "./form/AdditionalInfoFields";
import JobDescriptionField from "./form/JobDescriptionField";

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
        <CompanyInfoFields 
          jobData={jobData} 
          handleChange={handleChange} 
        />
        
        <LocationStatusFields 
          jobData={jobData} 
          handleChange={handleChange} 
          handleStatusChange={handleStatusChange} 
        />
        
        <AdditionalInfoFields 
          jobData={jobData} 
          handleChange={handleChange} 
        />
        
        <JobDescriptionField 
          jobData={jobData} 
          handleChange={handleChange} 
        />
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
