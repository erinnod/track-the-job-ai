import { useState } from "react";
import { useFollowUpReminders } from "@/hooks/useFollowUpReminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Trash2, CalendarClock } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays } from "date-fns";
import { JobApplication } from "@/data/mockJobs";

/** Quick date presets relative to today */
const PRESETS = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

interface FollowUpReminderProps {
  job: JobApplication;
}

const FollowUpReminderPanel = ({ job }: FollowUpReminderProps) => {
  const { getReminder, setReminder, dismissReminder, clearReminder } =
    useFollowUpReminders();
  const reminder = getReminder(job.id);

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(
    reminder?.dueDate ?? addDays(new Date(), 7).toISOString().split("T")[0]
  );
  const [note, setNote] = useState(reminder?.note ?? "");
  const [editing, setEditing] = useState(!reminder);

  const isOverdue = reminder && !reminder.dismissed && reminder.dueDate < todayStr;
  const isToday = reminder && !reminder.dismissed && reminder.dueDate === todayStr;

  const handleSave = () => {
    setReminder(job.id, date, note);
    setEditing(false);
  };

  const handleClear = () => {
    clearReminder(job.id);
    setDate(addDays(new Date(), 7).toISOString().split("T")[0]);
    setNote("");
    setEditing(true);
  };

  const daysUntil = reminder
    ? differenceInCalendarDays(parseISO(reminder.dueDate), new Date())
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <CalendarClock className="h-4 w-4 text-blue-500" />
        <span>Follow-Up Reminder</span>
        {reminder && !reminder.dismissed && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isOverdue
                ? "bg-red-100 text-red-700"
                : isToday
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isOverdue
              ? "Overdue"
              : isToday
              ? "Due today"
              : daysUntil === 1
              ? "Tomorrow"
              : `${daysUntil} days`}
          </span>
        )}
        {reminder?.dismissed && (
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
            Dismissed
          </span>
        )}
      </div>

      {reminder && !editing ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {format(parseISO(reminder.dueDate), "MMMM d, yyyy")}
              </p>
              {reminder.note && (
                <p className="text-sm text-gray-600 mt-0.5">{reminder.note}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-gray-500"
                onClick={() => {
                  setDate(reminder.dueDate);
                  setNote(reminder.note);
                  setEditing(true);
                }}
              >
                Edit
              </Button>
              {!reminder.dismissed ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-gray-500"
                  onClick={() => dismissReminder(job.id)}
                  title="Dismiss reminder"
                >
                  <BellOff className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-red-400 hover:text-red-600"
                onClick={handleClear}
                title="Remove reminder"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-gray-50 rounded-md p-3 border border-gray-200">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const d = addDays(new Date(), p.days).toISOString().split("T")[0];
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    date === d
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <Label htmlFor={`reminder-date-${job.id}`} className="text-xs">
              Date
            </Label>
            <Input
              id={`reminder-date-${job.id}`}
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`reminder-note-${job.id}`} className="text-xs">
              Note (optional)
            </Label>
            <Input
              id={`reminder-note-${job.id}`}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Send a follow-up email"
              className="h-8 text-sm"
              maxLength={120}
            />
          </div>

          <div className="flex gap-2 justify-end">
            {reminder && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={handleSave} className="h-7" disabled={!date}>
              <Bell className="h-3.5 w-3.5 mr-1" />
              Set Reminder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpReminderPanel;
