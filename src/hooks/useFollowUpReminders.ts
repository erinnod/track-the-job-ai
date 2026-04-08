/**
 * useFollowUpReminders — per-job follow-up reminders stored in localStorage.
 *
 * A reminder has a due date and an optional custom message.
 * The hook also surfaces which reminders are overdue or due today.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface FollowUpReminder {
  jobId: string;
  dueDate: string; // ISO date string "YYYY-MM-DD"
  note: string;
  dismissed: boolean;
  createdAt: string;
}

type ReminderStore = Record<string, FollowUpReminder>;

const STORAGE_PREFIX = "jobtrakr_reminders_";

function getKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function load(userId: string): ReminderStore {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(userId: string, store: ReminderStore) {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(store));
  } catch {
    // Quota
  }
}

export interface UseFollowUpRemindersReturn {
  getReminder: (jobId: string) => FollowUpReminder | null;
  setReminder: (jobId: string, dueDate: string, note?: string) => void;
  dismissReminder: (jobId: string) => void;
  clearReminder: (jobId: string) => void;
  /** All non-dismissed reminders that are due today or overdue */
  dueReminders: FollowUpReminder[];
  /** All non-dismissed upcoming reminders */
  upcomingReminders: FollowUpReminder[];
}

export function useFollowUpReminders(): UseFollowUpRemindersReturn {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const [store, setStore] = useState<ReminderStore>(() => load(userId));

  useEffect(() => {
    setStore(load(userId));
  }, [userId]);

  const update = useCallback(
    (updater: (prev: ReminderStore) => ReminderStore) => {
      setStore((prev) => {
        const next = updater(prev);
        persist(userId, next);
        return next;
      });
    },
    [userId]
  );

  const getReminder = useCallback(
    (jobId: string): FollowUpReminder | null => store[jobId] ?? null,
    [store]
  );

  const setReminder = useCallback(
    (jobId: string, dueDate: string, note = "") => {
      update((prev) => ({
        ...prev,
        [jobId]: {
          jobId,
          dueDate,
          note,
          dismissed: false,
          createdAt: new Date().toISOString(),
        },
      }));
    },
    [update]
  );

  const dismissReminder = useCallback(
    (jobId: string) => {
      update((prev) => {
        if (!prev[jobId]) return prev;
        return { ...prev, [jobId]: { ...prev[jobId], dismissed: true } };
      });
    },
    [update]
  );

  const clearReminder = useCallback(
    (jobId: string) => {
      update((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
    },
    [update]
  );

  const todayStr = new Date().toISOString().split("T")[0];

  const { dueReminders, upcomingReminders } = useMemo(() => {
    const all = Object.values(store).filter((r) => !r.dismissed);
    return {
      dueReminders: all.filter((r) => r.dueDate <= todayStr),
      upcomingReminders: all.filter((r) => r.dueDate > todayStr),
    };
  }, [store, todayStr]);

  return {
    getReminder,
    setReminder,
    dismissReminder,
    clearReminder,
    dueReminders,
    upcomingReminders,
  };
}
