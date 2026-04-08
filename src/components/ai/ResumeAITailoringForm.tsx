import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { JobApplication } from "@/data/mockJobs";
import { useAI } from "@/contexts/AIContext";
import { generateWithGemini } from "@/lib/gemini-service";
import ReactMarkdown from "react-markdown";

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
  const { isAIEnabled, handleAIError, setCurrentModel } = useAI();

  const [step, setStep] = useState<"form" | "result">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentResume, setCurrentResume] = useState("");

  const handleGenerate = async () => {
    if (!isAIEnabled) {
      handleAIError(new Error("AI is disabled"));
      return;
    }

    const position = jobApplication?.position ?? "the position";
    const company = jobApplication?.company ?? "the company";
    const jobDesc = jobApplication?.jobDescription ?? "";

    const prompt = `You are an expert resume coach and ATS optimization specialist.

**Task:** Tailor the following resume content for a specific job application.

**Target Role:** ${position}
**Target Company:** ${company}
${jobDesc ? `\n**Job Description:**\n${jobDesc}\n` : ""}
${currentResume ? `\n**Current Resume Content:**\n${currentResume}\n` : ""}

Please provide:
1. **Tailored Professional Summary** (2-3 sentences optimized for this role)
2. **Key Skills to Highlight** (matched to the job description, bulleted)
3. **Suggested Bullet Point Improvements** (rewrite 3-5 existing bullet points to better match this role using the STAR method and quantified achievements)
4. **Keywords to Include** (ATS-critical terms from the job description not yet in the resume)

Format your response clearly with these 4 sections. Be specific and actionable.`;

    setIsLoading(true);
    try {
      const text = await generateWithGemini(prompt, {
        temperature: 0.5,
        maxTokens: 1500,
      });
      setCurrentModel("gemini-2.5-pro");
      setResult(text);
      setStep("result");
      onComplete?.({ content: text, type: "resume_tailoring" });
    } catch (err) {
      handleAIError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("form");
    setResult("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Tailor Resume
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Resume Tailoring
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 py-2">
            {jobApplication && (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-blue-800">
                Tailoring resume for{" "}
                <strong>{jobApplication.position}</strong> at{" "}
                <strong>{jobApplication.company}</strong>
              </div>
            )}

            <div className="space-y-1">
              <Label>
                Paste Your Current Resume Content{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                value={currentResume}
                onChange={(e) => setCurrentResume(e.target.value)}
                placeholder="Paste your current resume text here for personalised suggestions…"
                className="min-h-[160px] font-mono text-xs"
              />
              <p className="text-xs text-gray-400">
                If left blank, AI will suggest content based on the job
                description alone.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analysing & Tailoring…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tailor Resume
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">AI resume suggestions:</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 border rounded-md p-4 text-sm leading-relaxed max-h-[50vh] overflow-y-auto">
              <ReactMarkdown className="prose prose-sm max-w-none">
                {result}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
