/**
 * JobDescriptionAnalyzer — paste a job description and let AI extract
 * company, position, location, salary, work type, and employment type,
 * then auto-fill the add/edit job form.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useAI } from "@/contexts/AIContext";
import { generateWithGemini } from "@/lib/gemini-service";
import { JobApplication } from "@/data/mockJobs";
import { Badge } from "@/components/ui/badge";

export interface ExtractedJobDetails {
  company?: string;
  position?: string;
  location?: string;
  salary?: string;
  workType?: JobApplication["workType"];
  employmentType?: JobApplication["employmentType"];
  jobDescription?: string;
}

interface JobDescriptionAnalyzerProps {
  onExtracted: (details: ExtractedJobDetails) => void;
}

function parseExtracted(raw: string): ExtractedJobDetails {
  try {
    // Gemini may wrap JSON in markdown code block
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      company: parsed.company || undefined,
      position: parsed.position || undefined,
      location: parsed.location || undefined,
      salary: parsed.salary || undefined,
      workType: ["On-site", "Remote", "Hybrid"].includes(parsed.workType)
        ? (parsed.workType as JobApplication["workType"])
        : undefined,
      employmentType: ["Full-time", "Part-time"].includes(parsed.employmentType)
        ? (parsed.employmentType as JobApplication["employmentType"])
        : undefined,
      jobDescription: parsed.jobDescription || undefined,
    };
  } catch {
    return {};
  }
}

const JobDescriptionAnalyzer = ({
  onExtracted,
}: JobDescriptionAnalyzerProps) => {
  const { isAIEnabled, handleAIError } = useAI();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ExtractedJobDetails | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    if (!isAIEnabled) {
      handleAIError(new Error("AI is not enabled"));
      return;
    }

    const prompt = `Analyze the following job posting and extract information as a JSON object.

Job Posting:
"""
${text.slice(0, 4000)}
"""

Return ONLY valid JSON with these exact keys (use null for missing fields):
{
  "company": "Company name",
  "position": "Job title",
  "location": "City, State or Remote",
  "salary": "Salary range as written, e.g. $90,000 - $120,000",
  "workType": "On-site" | "Remote" | "Hybrid",
  "employmentType": "Full-time" | "Part-time",
  "jobDescription": "A clean summary of the role in 2-3 sentences"
}

Return only the JSON object, nothing else.`;

    setIsLoading(true);
    try {
      const raw = await generateWithGemini(prompt, {
        temperature: 0.1, // Low temperature for reliable extraction
        maxTokens: 512,
      });
      const extracted = parseExtracted(raw);
      setPreview(extracted);
    } catch (err) {
      handleAIError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (preview) {
      onExtracted(preview);
      setOpen(false);
      setText("");
      setPreview(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setText("");
    setPreview(null);
  };

  const filled = preview
    ? Object.values(preview).filter((v) => v != null && v !== "").length
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Auto-fill from Job Post
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Job Description Analyzer
          </DialogTitle>
          <DialogDescription>
            Paste a job posting below and AI will extract the details to
            auto-fill your form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null); // Reset preview on text change
            }}
            placeholder="Paste the full job description here…"
            className="min-h-[160px] font-mono text-xs"
          />

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !text.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Extract Details
              </>
            )}
          </Button>

          {preview && (
            <div className="space-y-3 border rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Extracted details
                </p>
                <Badge variant="secondary">{filled} field{filled !== 1 ? "s" : ""} found</Badge>
              </div>

              <dl className="space-y-2 text-sm">
                {[
                  ["Company", preview.company],
                  ["Position", preview.position],
                  ["Location", preview.location],
                  ["Salary", preview.salary],
                  ["Work Type", preview.workType],
                  ["Employment", preview.employmentType],
                  ["Summary", preview.jobDescription],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label as string} className="flex gap-2">
                      <dt className="text-gray-500 w-24 shrink-0">{label}:</dt>
                      <dd className="text-gray-800 flex-1 break-words">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>

              <Button onClick={handleApply} className="w-full">
                Apply to Form
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDescriptionAnalyzer;
