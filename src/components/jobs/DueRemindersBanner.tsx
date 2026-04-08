/**
 * DueRemindersBanner — shows a dismissible alert at the top of the page
 * when one or more follow-up reminders are due or overdue.
 */
import { useState } from "react";
import { useFollowUpReminders } from "@/hooks/useFollowUpReminders";
import { useJobs } from "@/contexts/JobContext";
import { Bell, X } from "lucide-react";
import { format, parseISO } from "date-fns";

const DueRemindersBanner = () => {
  const { dueReminders, dismissReminder } = useFollowUpReminders();
  const { jobs } = useJobs();
  const [collapsed, setCollapsed] = useState(false);

  if (dueReminders.length === 0 || collapsed) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-700 font-medium text-sm">
          <Bell className="h-4 w-4" />
          <span>
            {dueReminders.length} follow-up{dueReminders.length !== 1 ? "s" : ""} due
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-orange-400 hover:text-orange-600"
          title="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="space-y-1">
        {dueReminders.map((r) => {
          const job = jobs.find((j) => j.id === r.jobId);
          if (!job) return null;
          const isOverdue = r.dueDate < new Date().toISOString().split("T")[0];
          return (
            <li
              key={r.jobId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700">
                <span className="font-medium">{job.company}</span>
                {" — "}
                {job.position}
                {r.note && (
                  <span className="text-gray-500"> · {r.note}</span>
                )}
                {" "}
                <span
                  className={`text-xs font-medium ${
                    isOverdue ? "text-red-600" : "text-orange-600"
                  }`}
                >
                  ({isOverdue
                    ? `overdue since ${format(parseISO(r.dueDate), "MMM d")}`
                    : "today"})
                </span>
              </span>
              <button
                onClick={() => dismissReminder(r.jobId)}
                className="text-xs text-gray-400 hover:text-gray-600 ml-3 shrink-0"
              >
                Dismiss
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DueRemindersBanner;
