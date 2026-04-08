/**
 * OnboardingFlow — a multi-step welcome guide shown to new users.
 *
 * Visibility is controlled by localStorage key "jobtrakr_onboarding_complete".
 * The flow can also be re-triggered from Settings.
 *
 * Steps:
 *   1. Welcome
 *   2. Add your first job (shows AddJobModal inline)
 *   3. Kanban & Calendar
 *   4. AI features
 *   5. Done
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Kanban,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  BarChart2,
  Tags,
  Bell,
} from "lucide-react";
import { useJobs } from "@/contexts/JobContext";

const STORAGE_KEY = "jobtrakr_onboarding_complete";

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {}
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

interface Step {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  description: string;
  bullets?: string[];
}

const STEPS: Step[] = [
  {
    title: "Welcome to JobTrakr!",
    icon: Briefcase,
    iconColor: "text-blue-600",
    description:
      "You're one step closer to landing your next role. JobTrakr helps you stay on top of every application, interview, and follow-up. Let's take a quick tour.",
    bullets: [
      "Track every application in one place",
      "Never miss an interview or follow-up",
      "Use AI to write cover letters and tailor your resume",
    ],
  },
  {
    title: "Adding & Managing Jobs",
    icon: Briefcase,
    iconColor: "text-indigo-600",
    description:
      'Click "Add Job" in the top navigation (or press N) to add a new application. Paste in a job description and let AI auto-fill the form for you.',
    bullets: [
      'Press "N" anywhere to quickly add a job',
      '"Auto-fill from Job Post" extracts details with AI',
      "Tag jobs and filter by tag across all views",
    ],
  },
  {
    title: "Kanban & Calendar Views",
    icon: Kanban,
    iconColor: "text-purple-600",
    description:
      "Switch between list, Kanban, and calendar views to manage your pipeline your way. Drag applications between stages on the Kanban board.",
    bullets: [
      "Kanban board: drag-and-drop between stages",
      "Calendar: see all interviews and follow-ups",
      "Timeline per job: see every status change at a glance",
    ],
  },
  {
    title: "Smart Features",
    icon: Sparkles,
    iconColor: "text-yellow-500",
    description:
      "JobTrakr is packed with tools to give you an edge in your search.",
    bullets: [
      "AI cover letter & resume tailoring for each role",
      "Interview prep checklist with 9 default items",
      "Follow-up reminders so you never go silent",
      "Salary chart comparing all your offers",
      "Weekly email summary every Monday",
    ],
  },
  {
    title: "You're all set!",
    icon: CheckCircle2,
    iconColor: "text-green-600",
    description:
      "That's it! Start by adding your first job application, or import your existing ones via CSV. Good luck with your search!",
    bullets: [
      'Press "?" anytime to see keyboard shortcuts',
      "Toggle dark mode in the top navigation",
      "Enable weekly email summaries in Settings → Notifications",
    ],
  },
];

interface OnboardingFlowProps {
  /** If true, force-show the flow regardless of localStorage */
  forceShow?: boolean;
  onComplete?: () => void;
}

const OnboardingFlow = ({ forceShow = false, onComplete }: OnboardingFlowProps) => {
  const { jobs } = useJobs();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setOpen(true);
      setStep(0);
      return;
    }
    // Show automatically for new users (no jobs and onboarding not yet complete)
    if (!isOnboardingComplete() && jobs.length === 0) {
      // Small delay to avoid flash on initial load
      const t = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, [forceShow, jobs.length]);

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleNext = () => {
    if (isLast) {
      markOnboardingComplete();
      setOpen(false);
      onComplete?.();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSkip = () => {
    markOnboardingComplete();
    setOpen(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 px-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-blue-600"
                  : i < step
                  ? "w-1.5 bg-blue-300"
                  : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-8 py-6 text-center">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4 ${currentStep.iconColor}`}
          >
            <Icon className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {currentStep.title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {currentStep.bullets && (
            <ul className="text-left space-y-2 bg-gray-50 rounded-lg p-4">
              {currentStep.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="px-8 pb-6 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-gray-400">
              Skip tour
            </Button>
          </div>
          <Button onClick={handleNext} className="gap-2">
            {isLast ? (
              <>
                Get started
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
