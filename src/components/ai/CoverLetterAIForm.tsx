import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { JobApplication } from "@/data/mockJobs";
import AIComingSoon from "./AIComingSoon";

interface CoverLetterAIFormProps {
  onComplete?: (generatedContent: any) => void;
  resumeId?: string;
  resumeName?: string;
  jobApplication?: JobApplication;
}

export default function CoverLetterAIForm({
  onComplete,
  resumeId,
  resumeName,
  jobApplication,
}: CoverLetterAIFormProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Get job details for the coming soon message
  const jobDetails = jobApplication
    ? `${jobApplication.position} at ${jobApplication.company}`
    : "Cover Letter Generator";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          AI Cover Letter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <AIComingSoon
          featureName={jobDetails}
          description="Our AI cover letter generator is coming soon. This feature will create personalized cover letters tailored to your resume and job applications."
        />
      </DialogContent>
    </Dialog>
  );
}
