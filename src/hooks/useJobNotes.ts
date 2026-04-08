/**
 * useJobNotes — per-job quick notes backed by localStorage.
 *
 * Notes are stored under `jobtrakr_notes_<userId>` as Record<jobId, Note[]>.
 * Each note has an id, text, and timestamp.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";

export interface JobNote {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

type NoteStore = Record<string, JobNote[]>;

const STORAGE_PREFIX = "jobtrakr_notes_";

function getKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function load(userId: string): NoteStore {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(userId: string, store: NoteStore) {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(store));
  } catch {
    // Quota — fail silently
  }
}

export interface UseJobNotesReturn {
  getNotes: (jobId: string) => JobNote[];
  addNote: (jobId: string, text: string) => JobNote;
  updateNote: (jobId: string, noteId: string, text: string) => void;
  deleteNote: (jobId: string, noteId: string) => void;
}

export function useJobNotes(): UseJobNotesReturn {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const [store, setStore] = useState<NoteStore>(() => load(userId));

  useEffect(() => {
    setStore(load(userId));
  }, [userId]);

  const persist = useCallback(
    (updater: (prev: NoteStore) => NoteStore) => {
      setStore((prev) => {
        const next = updater(prev);
        save(userId, next);
        return next;
      });
    },
    [userId]
  );

  const getNotes = useCallback(
    (jobId: string): JobNote[] =>
      [...(store[jobId] ?? [])].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [store]
  );

  const addNote = useCallback(
    (jobId: string, text: string): JobNote => {
      const now = new Date().toISOString();
      const note: JobNote = { id: uuidv4(), text: text.trim(), createdAt: now, updatedAt: now };
      persist((prev) => ({
        ...prev,
        [jobId]: [...(prev[jobId] ?? []), note],
      }));
      return note;
    },
    [persist]
  );

  const updateNote = useCallback(
    (jobId: string, noteId: string, text: string) => {
      persist((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] ?? []).map((n) =>
          n.id === noteId ? { ...n, text: text.trim(), updatedAt: new Date().toISOString() } : n
        ),
      }));
    },
    [persist]
  );

  const deleteNote = useCallback(
    (jobId: string, noteId: string) => {
      persist((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] ?? []).filter((n) => n.id !== noteId),
      }));
    },
    [persist]
  );

  return { getNotes, addNote, updateNote, deleteNote };
}
