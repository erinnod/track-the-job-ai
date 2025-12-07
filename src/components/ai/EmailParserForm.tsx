import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import AIComingSoon from "./AIComingSoon";

export default function EmailParserForm() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Mail className="w-4 h-4 mr-2" />
          AI Email Parser
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <AIComingSoon
          featureName="Email Parser"
          description="Our AI email parser is coming soon. This feature will automatically detect job applications and interview invitations in your emails and add them to your tracking system."
        />
      </DialogContent>
    </Dialog>
  );
}
