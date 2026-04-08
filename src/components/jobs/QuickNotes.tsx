import { useState, useRef, KeyboardEvent } from "react";
import { useJobNotes, JobNote } from "@/hooks/useJobNotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Trash2, Pencil, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteItemProps {
  note: JobNote;
  onDelete: () => void;
  onUpdate: (text: string) => void;
}

const NoteItem = ({ note, onDelete, onUpdate }: NoteItemProps) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const commitEdit = () => {
    if (editText.trim()) {
      onUpdate(editText);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditText(note.text);
    setEditing(false);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 group relative">
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="text-sm min-h-[60px] bg-white"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelEdit();
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={commitEdit} className="h-7 px-2">
              <Check className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-800 whitespace-pre-wrap pr-16">{note.text}</p>
          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </p>
          {/* Edit / Delete — visible on hover */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded hover:bg-yellow-100 text-gray-500 hover:text-gray-700"
              title="Edit note"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
              title="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface QuickNotesProps {
  jobId: string;
}

const QuickNotes = ({ jobId }: QuickNotesProps) => {
  const { getNotes, addNote, updateNote, deleteNote } = useJobNotes();
  const notes = getNotes(jobId);
  const [newText, setNewText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAdd = () => {
    if (!newText.trim()) return;
    addNote(jobId, newText);
    setNewText("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <StickyNote className="h-4 w-4 text-yellow-500" />
        <span>Quick Notes</span>
        {notes.length > 0 && (
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
            {notes.length}
          </span>
        )}
      </div>

      {/* Existing notes */}
      {notes.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onDelete={() => deleteNote(jobId, note.id)}
              onUpdate={(text) => updateNote(jobId, note.id, text)}
            />
          ))}
        </div>
      )}

      {/* New note input */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Jot down a quick thought… (Ctrl+Enter to save)"
          className="text-sm min-h-[72px] resize-none"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{newText.length}/500</span>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="h-7"
          >
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickNotes;
