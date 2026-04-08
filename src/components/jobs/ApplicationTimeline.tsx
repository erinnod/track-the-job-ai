/**
 * ApplicationTimeline — visual timeline showing all status changes and events
 * for a job application, ordered chronologically.
 *
 * Synthesises events from:
 * 1. job.appliedDate (applied event)
 * 2. job.events[] (interview events, etc.)
 * 3. job.lastUpdated (most recent update)
 * 4. job.status changes (inferred from existing data)
 */
import { useMemo } from "react";
import { JobApplication, statusLabels } from "@/data/mockJobs";
import { format, parseISO, isValid } from "date-fns";
import {
  Send,
  Calendar,
  Trophy,
  XCircle,
  Bookmark,
  Clock,
  Star,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: "status" | "event" | "update";
  status?: JobApplication["status"];
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  applied: Send,
  interview: Calendar,
  offer: Trophy,
  rejected: XCircle,
  saved: Bookmark,
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 border-blue-300 text-blue-700",
  interview: "bg-yellow-100 border-yellow-300 text-yellow-700",
  offer: "bg-green-100 border-green-300 text-green-700",
  rejected: "bg-red-100 border-red-300 text-red-700",
  saved: "bg-gray-100 border-gray-300 text-gray-600",
  event: "bg-purple-100 border-purple-300 text-purple-700",
  update: "bg-slate-100 border-slate-300 text-slate-600",
};

const LINE_COLORS: Record<string, string> = {
  applied: "border-blue-300",
  interview: "border-yellow-300",
  offer: "border-green-300",
  rejected: "border-red-300",
  saved: "border-gray-300",
  event: "border-purple-300",
  update: "border-slate-300",
};

function safeDate(str: string | undefined): Date | null {
  if (!str) return null;
  const d = parseISO(str);
  return isValid(d) ? d : null;
}

interface ApplicationTimelineProps {
  job: JobApplication;
}

const ApplicationTimeline = ({ job }: ApplicationTimelineProps) => {
  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = [];

    // 1. Saved event (always present if appliedDate is empty)
    const savedDate = safeDate(job.lastUpdated) ?? new Date();
    if (job.status === "saved" || !job.appliedDate) {
      result.push({
        id: "saved",
        date: savedDate,
        title: "Job Saved",
        description: `Saved ${job.position} at ${job.company}`,
        type: "status",
        status: "saved",
      });
    }

    // 2. Applied date
    const applied = safeDate(job.appliedDate);
    if (applied) {
      result.push({
        id: "applied",
        date: applied,
        title: "Application Submitted",
        description: `Applied for ${job.position} at ${job.company}`,
        type: "status",
        status: "applied",
      });
    }

    // 3. Job events (interviews, calls, etc.)
    if (job.events) {
      job.events.forEach((evt, i) => {
        const d = safeDate(evt.date);
        if (!d) return;
        result.push({
          id: `event-${i}`,
          date: d,
          title: evt.title,
          description: evt.description,
          type: "event",
        });
      });
    }

    // 4. Offer / Rejected status
    if (job.status === "offer" || job.status === "rejected") {
      const lastUpdated = safeDate(job.lastUpdated);
      if (lastUpdated) {
        result.push({
          id: `status-${job.status}`,
          date: lastUpdated,
          title:
            job.status === "offer"
              ? "Offer Received"
              : "Application Rejected",
          description:
            job.status === "offer"
              ? `Received an offer for ${job.position} at ${job.company}`
              : undefined,
          type: "status",
          status: job.status,
        });
      }
    }

    // Sort chronologically (oldest first)
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [job]);

  if (events.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-2">
        No timeline events yet.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((evt, index) => {
        const colorKey = evt.type === "event" ? "event" : evt.type === "update" ? "update" : (evt.status ?? "saved");
        const Icon = STATUS_ICONS[colorKey] ?? Star;
        const isLast = index === events.length - 1;

        return (
          <div key={evt.id} className="flex gap-3 relative">
            {/* Vertical line */}
            {!isLast && (
              <div
                className={`absolute left-[15px] top-7 bottom-0 w-px border-l-2 border-dashed ${LINE_COLORS[colorKey]}`}
              />
            )}

            {/* Icon circle */}
            <div
              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${STATUS_COLORS[colorKey]}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content */}
            <div className={`pb-5 flex-1 ${isLast ? "" : ""}`}>
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {evt.title}
              </p>
              {evt.description && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {evt.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(evt.date, "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApplicationTimeline;
