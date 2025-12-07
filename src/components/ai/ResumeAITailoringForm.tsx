import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { JobApplication } from "@/data/mockJobs";
import AIComingSoon from "./AIComingSoon";

interface ResumeAITailoringFormProps {
  jobApplication?: JobApplication;
  resumeId?: string;
  resumeName?: string;
  onComplete?: (tailoredContent: any) => void;
}

export default function ResumeAITailoringForm({
  jobApplication,
  resumeId,
  resumeName,
  onComplete,
}: ResumeAITailoringFormProps) {
  const [open, setOpen] = useState(false);

  // Get job details for the coming soon message
  const jobDetails = jobApplication
    ? `Resume tailoring for ${jobApplication.position} at ${jobApplication.company}`
    : resumeName
    ? `Resume tailoring for ${resumeName}`
    : "AI Resume Tailoring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Tailor Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <AIComingSoon
          featureName={jobDetails}
          description="Our AI resume tailoring tool is coming soon. This feature will analyze job descriptions and customize your resume to highlight relevant skills and experience."
        />
      </DialogContent>
    </Dialog>
  );
}
