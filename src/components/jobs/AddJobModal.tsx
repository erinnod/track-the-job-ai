
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { JobApplication } from "@/data/mockJobs";

interface AddJobModalProps {
  onAddJob?: (job: JobApplication) => void;
}

const AddJobModal = ({ onAddJob }: AddJobModalProps) => {
  const [open, setOpen] = useState(false);
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
    if (onAddJob) {
      onAddJob(newJob);
    }
    
    toast.success("Job added successfully!");
    setOpen(false);
    
    // Reset form
    setJobData({
      company: "",
      position: "",
      location: "",
      status: "saved",
      companyWebsite: "",
      salary: "",
      jobDescription: ""
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Job Application</DialogTitle>
        </DialogHeader>
        
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
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
