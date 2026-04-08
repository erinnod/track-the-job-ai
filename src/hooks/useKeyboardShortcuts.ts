/**
 * useKeyboardShortcuts — registers global keyboard shortcuts.
 *
 * Shortcuts are ignored when the user is typing in an input, textarea,
 * or contenteditable element.
 *
 * Available shortcuts:
 *   N          → Add new job (triggers AddJobModal)
 *   /          → Focus search (if present)
 *   ?          → Open shortcuts help dialog
 *   G + D      → Go to Dashboard
 *   G + A      → Go to Applications
 *   G + K      → Go to Kanban
 *   G + C      → Go to Calendar
 *   G + S      → Go to Settings
 *   Escape     → Close any open modal / clear search
 */

import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type ShortcutHandler = () => void;

export interface ShortcutDefinition {
  keys: string; // Human-readable, e.g. "N" or "G then A"
  description: string;
  category: string;
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { keys: "N", description: "Add new job application", category: "Actions" },
  { keys: "/", description: "Focus search", category: "Actions" },
  { keys: "?", description: "Show keyboard shortcuts", category: "Help" },
  { keys: "G then D", description: "Go to Dashboard", category: "Navigation" },
  { keys: "G then A", description: "Go to Applications", category: "Navigation" },
  { keys: "G then K", description: "Go to Kanban Board", category: "Navigation" },
  { keys: "G then C", description: "Go to Calendar", category: "Navigation" },
  { keys: "G then S", description: "Go to Settings", category: "Navigation" },
  { keys: "Esc", description: "Close modal / dialog", category: "Actions" },
];

function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).contentEditable === "true"
  );
}

interface UseKeyboardShortcutsOptions {
  onShowHelp: () => void;
  onAddJob: () => void;
}

export function useKeyboardShortcuts({
  onShowHelp,
  onAddJob,
}: UseKeyboardShortcutsOptions) {
  const navigate = useNavigate();
  const pendingGRef = useRef(false);
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingG = useCallback(() => {
    pendingGRef.current = false;
    if (gTimeoutRef.current) {
      clearTimeout(gTimeoutRef.current);
      gTimeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Never hijack modifier-key combos (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      // If user is typing in a field, only allow Escape to propagate
      if (isTyping() && key !== "escape") return;

      // Handle "G then X" navigation sequences
      if (pendingGRef.current) {
        clearPendingG();
        switch (key) {
          case "d":
            e.preventDefault();
            navigate("/dashboard");
            return;
          case "a":
            e.preventDefault();
            navigate("/applications");
            return;
          case "k":
            e.preventDefault();
            navigate("/kanban");
            return;
          case "c":
            e.preventDefault();
            navigate("/calendar");
            return;
          case "s":
            e.preventDefault();
            navigate("/settings");
            return;
        }
        return;
      }

      switch (key) {
        case "n":
          e.preventDefault();
          onAddJob();
          break;

        case "g":
          // Start "G then …" sequence — wait 1.5 seconds for second key
          e.preventDefault();
          pendingGRef.current = true;
          gTimeoutRef.current = setTimeout(() => {
            pendingGRef.current = false;
          }, 1500);
          break;

        case "?":
          e.preventDefault();
          onShowHelp();
          break;

        case "/":
          // Focus the search input if present
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="text"][placeholder*="earch"], input[type="search"]'
          );
          if (searchInput) searchInput.focus();
          break;

        default:
          break;
      }
    },
    [navigate, onAddJob, onShowHelp, clearPendingG]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
    };
  }, [handleKeyDown]);
}
