import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SearchCheck } from "lucide-react";
import AIComingSoon from "./AIComingSoon";

export default function JobRecommendationsAI() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <SearchCheck className="w-4 h-4 mr-2" />
          AI Job Recommendations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <AIComingSoon
          featureName="AI Job Recommendations"
          description="Our AI job recommendation tool is coming soon. This feature will analyze your skills and preferences to suggest relevant job opportunities that match your profile."
        />
      </DialogContent>
    </Dialog>
  );
}
