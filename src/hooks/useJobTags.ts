/**
 * useJobTags — per-job tag management backed by localStorage.
 *
 * Tags are stored under the key `jobtrakr_tags_<userId>` as a
 * Record<jobId, string[]>. This works without any DB migration.
 *
 * If you later add a `tags text[]` column to job_applications, you can
 * migrate by reading from this store and writing to the DB on first load.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type TagStore = Record<string, string[]>;

const STORAGE_PREFIX = "jobtrakr_tags_";

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadStore(userId: string): TagStore {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(userId: string, store: TagStore) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(store));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export interface UseJobTagsReturn {
  /** Get tags for a specific job */
  getTags: (jobId: string) => string[];
  /** Add a tag to a job (no-op if already present) */
  addTag: (jobId: string, tag: string) => void;
  /** Remove a tag from a job */
  removeTag: (jobId: string, tag: string) => void;
  /** Replace all tags for a job */
  setTags: (jobId: string, tags: string[]) => void;
  /** All unique tags used across every job */
  allTags: string[];
}

export function useJobTags(): UseJobTagsReturn {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";

  const [store, setStore] = useState<TagStore>(() => loadStore(userId));

  // Re-load from localStorage if the user changes
  useEffect(() => {
    setStore(loadStore(userId));
  }, [userId]);

  const persist = useCallback(
    (updater: (prev: TagStore) => TagStore) => {
      setStore((prev) => {
        const next = updater(prev);
        saveStore(userId, next);
        return next;
      });
    },
    [userId]
  );

  const getTags = useCallback(
    (jobId: string): string[] => store[jobId] ?? [],
    [store]
  );

  const addTag = useCallback(
    (jobId: string, tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      persist((prev) => {
        const existing = prev[jobId] ?? [];
        if (existing.includes(trimmed)) return prev;
        return { ...prev, [jobId]: [...existing, trimmed] };
      });
    },
    [persist]
  );

  const removeTag = useCallback(
    (jobId: string, tag: string) => {
      persist((prev) => {
        const existing = prev[jobId] ?? [];
        return { ...prev, [jobId]: existing.filter((t) => t !== tag) };
      });
    },
    [persist]
  );

  const setTags = useCallback(
    (jobId: string, tags: string[]) => {
      persist((prev) => ({ ...prev, [jobId]: tags }));
    },
    [persist]
  );

  const allTags = Array.from(
    new Set(Object.values(store).flat())
  ).sort();

  return { getTags, addTag, removeTag, setTags, allTags };
}
