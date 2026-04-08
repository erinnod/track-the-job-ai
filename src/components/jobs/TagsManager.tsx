import { useState, useRef, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Tag, Plus } from "lucide-react";
import { useJobTags } from "@/hooks/useJobTags";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Preset colors for tags — cycles through these based on tag text */
const TAG_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
];

export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
  /** Show remove button — omit for read-only display */
  removable?: boolean;
}

export const TagBadge = ({ tag, onRemove, removable = false }: TagBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tagColor(tag)}`}
  >
    {tag}
    {removable && onRemove && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:opacity-70 transition-opacity"
        aria-label={`Remove tag ${tag}`}
      >
        <X className="h-3 w-3" />
      </button>
    )}
  </span>
);

interface TagsManagerProps {
  jobId: string;
  /** Read-only display mode — hides edit controls */
  readOnly?: boolean;
}

const TagsManager = ({ jobId, readOnly = false }: TagsManagerProps) => {
  const { getTags, addTag, removeTag, allTags } = useJobTags();
  const tags = getTags(jobId);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = allTags.filter(
    (t) => !tags.includes(t) && t.toLowerCase().includes(inputValue.toLowerCase())
  );

  const commit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed.length <= 30) {
      addTag(jobId, trimmed);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(jobId, tags[tags.length - 1]);
    }
  };

  if (readOnly) {
    return tags.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
        <Tag className="h-4 w-4" />
        <span>Tags</span>
      </div>

      <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-white min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
        {tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            removable
            onRemove={() => removeTag(jobId, tag)}
          />
        ))}

        <Popover open={open && (suggestions.length > 0 || inputValue.length > 0)} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // Slight delay so Popover click registers before blur
                setTimeout(() => setOpen(false), 150);
              }}
              placeholder={tags.length === 0 ? "Add tags…" : ""}
              className="flex-1 min-w-[80px] outline-none text-xs bg-transparent placeholder:text-gray-400"
              maxLength={30}
            />
          </PopoverTrigger>
          {(suggestions.length > 0 || inputValue.trim().length > 0) && (
            <PopoverContent
              className="w-48 p-1"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {inputValue.trim().length > 0 && !tags.includes(inputValue.trim()) && (
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(inputValue);
                    setOpen(false);
                  }}
                >
                  <Plus className="h-3 w-3 text-blue-500" />
                  Create "<strong>{inputValue.trim()}</strong>"
                </button>
              )}
              {suggestions.slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(jobId, suggestion);
                    setInputValue("");
                    setOpen(false);
                    inputRef.current?.focus();
                  }}
                >
                  <TagBadge tag={suggestion} />
                </button>
              ))}
            </PopoverContent>
          )}
        </Popover>
      </div>

      <p className="text-xs text-gray-400">
        Press Enter or comma to add a tag. Backspace removes the last tag.
      </p>
    </div>
  );
};

export default TagsManager;
