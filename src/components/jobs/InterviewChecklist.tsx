import { useState, KeyboardEvent } from "react";
import { useInterviewChecklist } from "@/hooks/useInterviewChecklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, Trash2, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InterviewChecklistProps {
  jobId: string;
}

const InterviewChecklist = ({ jobId }: InterviewChecklistProps) => {
  const { getChecklist, toggleItem, addItem, removeItem, resetChecklist, getProgress } =
    useInterviewChecklist();
  const items = getChecklist(jobId);
  const { completed, total, percent } = getProgress(jobId);
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addItem(jobId, newItem);
    setNewItem("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <ClipboardList className="h-4 w-4 text-green-600" />
          <span>Interview Prep</span>
          <span className="text-xs text-gray-400">
            {completed}/{total}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => resetChecklist(jobId)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reset to defaults</TooltipContent>
        </Tooltip>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Checklist items */}
      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 group">
            <Checkbox
              id={`check-${item.id}`}
              checked={item.checked}
              onCheckedChange={() => toggleItem(jobId, item.id)}
              className="mt-0.5"
            />
            <label
              htmlFor={`check-${item.id}`}
              className={`flex-1 text-sm cursor-pointer leading-tight ${
                item.checked ? "line-through text-gray-400" : "text-gray-700"
              }`}
            >
              {item.text}
            </label>
            {item.custom && (
              <button
                type="button"
                onClick={() => removeItem(jobId, item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"
                title="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add custom item */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom item…"
          className="h-8 text-sm flex-1"
          maxLength={100}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="h-8 px-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InterviewChecklist;
