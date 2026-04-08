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
import { Input } from "@/components/ui/input";
import { FileText, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAI } from "@/contexts/AIContext";
import { JobApplication } from "@/data/mockJobs";
import { generateWithGemini } from "@/lib/gemini-service";
import ReactMarkdown from "react-markdown";

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
  const { isAIEnabled, handleAIError, setCurrentModel } = useAI();

  const [step, setStep] = useState<"form" | "result">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [yourName, setYourName] = useState(
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : ""
  );
  const [yourBackground, setYourBackground] = useState("");
  const [tone, setTone] = useState<"professional" | "enthusiastic" | "concise">(
    "professional"
  );

  const handleGenerate = async () => {
    if (!isAIEnabled) {
      handleAIError(new Error("AI is disabled"));
      return;
    }

    const position = jobApplication?.position ?? "the position";
    const company = jobApplication?.company ?? "the company";
    const jobDesc = jobApplication?.jobDescription ?? "";

    const prompt = `You are a professional career coach. Write a compelling cover letter for a job application.

**Applicant:** ${yourName || "the applicant"}
**Role:** ${position}
**Company:** ${company}
**Tone:** ${tone}
${jobDesc ? `\n**Job Description:**\n${jobDesc}\n` : ""}
${yourBackground ? `\n**Applicant's Background:**\n${yourBackground}\n` : ""}

Instructions:
- Write a complete, ready-to-send cover letter
- Opening paragraph: express genuine interest in the role and company
- Middle paragraph(s): highlight relevant skills and specific achievements from the background
- Closing paragraph: call to action
- Keep it to 3-4 paragraphs, under 400 words
- Do NOT include "[Your Address]" placeholders — write a clean, modern-format letter
- Start with "Dear Hiring Manager," (unless company/role suggest a different greeting)
`;

    setIsLoading(true);
    try {
      const text = await generateWithGemini(prompt, {
        temperature: tone === "enthusiastic" ? 0.8 : 0.6,
        maxTokens: 1024,
      });
      setCurrentModel("gemini-2.5-pro");
      setResult(text);
      setStep("result");
      onComplete?.({ content: text, type: "cover_letter" });
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
          <FileText className="w-4 h-4 mr-2" />
          AI Cover Letter
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Cover Letter Generator
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 py-2">
            {jobApplication && (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-blue-800">
                Generating cover letter for{" "}
                <strong>{jobApplication.position}</strong> at{" "}
                <strong>{jobApplication.company}</strong>
              </div>
            )}

            <div className="space-y-1">
              <Label>Your Name</Label>
              <Input
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="e.g. Jane Smith"
              />
            </div>

            <div className="space-y-1">
              <Label>Your Background & Key Highlights</Label>
              <Textarea
                value={yourBackground}
                onChange={(e) => setYourBackground(e.target.value)}
                placeholder="Briefly describe your experience and achievements relevant to this role…"
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-400">
                The more detail you provide, the better the letter. Include
                years of experience, specific skills, and notable achievements.
              </p>
            </div>

            <div className="space-y-1">
              <Label>Tone</Label>
              <div className="flex gap-2">
                {(["professional", "enthusiastic", "concise"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        tone === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Your AI-generated cover letter:
              </p>
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
