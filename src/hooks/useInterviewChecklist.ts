/**
 * useInterviewChecklist — per-job interview prep checklist stored in localStorage.
 *
 * Each job gets a checklist seeded with sensible defaults.
 * Users can check/uncheck items, add custom items, and reset to defaults.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  custom: boolean; // true = user-added
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "id">[] = [
  { text: "Research the company (mission, products, culture)", checked: false, custom: false },
  { text: "Review the job description and required skills", checked: false, custom: false },
  { text: "Prepare STAR stories for 3+ behavioural questions", checked: false, custom: false },
  { text: "Prepare 5 questions to ask the interviewer", checked: false, custom: false },
  { text: "Practice technical skills / coding challenges", checked: false, custom: false },
  { text: "Update / review your resume", checked: false, custom: false },
  { text: "Confirm interview time, format, and platform", checked: false, custom: false },
  { text: "Dress code / professional attire sorted", checked: false, custom: false },
  { text: "Send a thank-you note after the interview", checked: false, custom: false },
];

function makeDefaults(): ChecklistItem[] {
  return DEFAULT_ITEMS.map((item) => ({ ...item, id: uuidv4() }));
}

type ChecklistStore = Record<string, ChecklistItem[]>;

const STORAGE_PREFIX = "jobtrakr_checklist_";

function getKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function load(userId: string): ChecklistStore {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(userId: string, store: ChecklistStore) {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(store));
  } catch {
    // Quota
  }
}

export interface UseInterviewChecklistReturn {
  getChecklist: (jobId: string) => ChecklistItem[];
  toggleItem: (jobId: string, itemId: string) => void;
  addItem: (jobId: string, text: string) => void;
  removeItem: (jobId: string, itemId: string) => void;
  resetChecklist: (jobId: string) => void;
  getProgress: (jobId: string) => { completed: number; total: number; percent: number };
}

export function useInterviewChecklist(): UseInterviewChecklistReturn {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const [store, setStore] = useState<ChecklistStore>(() => load(userId));

  useEffect(() => {
    setStore(load(userId));
  }, [userId]);

  const persist = useCallback(
    (updater: (prev: ChecklistStore) => ChecklistStore) => {
      setStore((prev) => {
        const next = updater(prev);
        save(userId, next);
        return next;
      });
    },
    [userId]
  );

  /** Returns the checklist for a job, creating defaults if none exist */
  const getChecklist = useCallback(
    (jobId: string): ChecklistItem[] => {
      if (!store[jobId]) {
        const defaults = makeDefaults();
        // Lazily initialise without triggering a re-render loop
        setTimeout(() => {
          persist((prev) => {
            if (prev[jobId]) return prev; // Already created
            return { ...prev, [jobId]: defaults };
          });
        }, 0);
        return defaults;
      }
      return store[jobId];
    },
    [store, persist]
  );

  const toggleItem = useCallback(
    (jobId: string, itemId: string) => {
      persist((prev) => {
        const items = prev[jobId] ?? makeDefaults();
        return {
          ...prev,
          [jobId]: items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      });
    },
    [persist]
  );

  const addItem = useCallback(
    (jobId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      persist((prev) => {
        const items = prev[jobId] ?? makeDefaults();
        return {
          ...prev,
          [jobId]: [
            ...items,
            { id: uuidv4(), text: trimmed, checked: false, custom: true },
          ],
        };
      });
    },
    [persist]
  );

  const removeItem = useCallback(
    (jobId: string, itemId: string) => {
      persist((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] ?? []).filter((item) => item.id !== itemId),
      }));
    },
    [persist]
  );

  const resetChecklist = useCallback(
    (jobId: string) => {
      persist((prev) => ({ ...prev, [jobId]: makeDefaults() }));
    },
    [persist]
  );

  const getProgress = useCallback(
    (jobId: string) => {
      const items = store[jobId] ?? [];
      const total = items.length;
      const completed = items.filter((i) => i.checked).length;
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
    [store]
  );

  return { getChecklist, toggleItem, addItem, removeItem, resetChecklist, getProgress };
}
