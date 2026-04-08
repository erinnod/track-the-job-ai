/**
 * KeyboardShortcutsHelp — modal dialog listing all available keyboard shortcuts.
 * Trigger with the "?" key.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHORTCUT_DEFINITIONS } from "@/hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

/** Renders a keyboard key badge */
const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-300 bg-gray-100 text-gray-700 text-xs font-mono shadow-sm">
    {children}
  </kbd>
);

/** Parses "G then A" into an array of Key elements with "then" text */
const ShortcutKeys = ({ keys }: { keys: string }) => {
  const parts = keys.split(" then ");
  return (
    <span className="flex items-center gap-1">
      {parts.map((k, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-xs text-gray-400">then</span>}
          <Key>{k}</Key>
        </span>
      ))}
    </span>
  );
};

const KeyboardShortcutsHelp = ({ open, onClose }: KeyboardShortcutsHelpProps) => {
  // Group shortcuts by category
  const byCategory: Record<string, typeof SHORTCUT_DEFINITIONS> = {};
  SHORTCUT_DEFINITIONS.forEach((s) => {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-blue-500" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {Object.entries(byCategory).map(([category, shortcuts]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {category}
              </p>
              <ul className="space-y-2">
                {shortcuts.map((s) => (
                  <li
                    key={s.keys}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">{s.description}</span>
                    <ShortcutKeys keys={s.keys} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center pt-2">
          Shortcuts are disabled while typing in a text field.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
