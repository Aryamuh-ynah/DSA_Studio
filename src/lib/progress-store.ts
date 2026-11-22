// Local progress store. Keyed by canonical problem id so completion
// synchronizes across every track a problem appears in.
// Backed by localStorage but exposed through a repository so a Supabase
// implementation can replace it later without touching UI code.

import { useSyncExternalStore } from "react";

export interface ProgressEntry {
  completed: boolean;
  needsRevision: boolean;
  bookmarked: boolean;
  notes: string;
  completedAt: string | null;
  lastRevisedAt: string | null;
}

export type ProgressMap = Record<string, ProgressEntry>;

const STORAGE_KEY = "dsa-sheet-progress-v1";

const EMPTY_MAP: ProgressMap = Object.freeze({});

function getServerSnapshot(): ProgressMap {
  return EMPTY_MAP;
}

const listeners = new Set<() => void>();
let cache: ProgressMap | null = null;

function isBrowser(): boolean {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch {
    // Accessing localStorage can throw in privacy-restricted browser contexts.
    return false;
  }
}

function read(): ProgressMap {
  if (typeof window === "undefined") return EMPTY_MAP;
  if (cache) return cache;
  if (!isBrowser()) return EMPTY_MAP;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return (cache = EMPTY_MAP);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return (cache = EMPTY_MAP);
    }
    const normalized: ProgressMap = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        normalized[id] = { ...defaultEntry(), ...(entry as ProgressEntry) };
      }
    }
    cache = normalized;
  } catch {
    cache = EMPTY_MAP;
  }
  return cache;
}

function write(next: ProgressMap): void {
  cache = next;
  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
  listeners.forEach((l) => l());
}

export function defaultEntry(): ProgressEntry {
  return {
    completed: false,
    needsRevision: false,
    bookmarked: false,
    notes: "",
    completedAt: null,
    lastRevisedAt: null,
  };
}

export function getEntry(id: string): ProgressEntry {
  const entry = read()[id];
  return entry ? { ...defaultEntry(), ...entry } : defaultEntry();
}

/** True when a note contains more than whitespace. */
export function hasNotes(notes: string | undefined): boolean {
  return !!notes && notes.trim() !== "";
}

export function getAllProgress(): ProgressMap {
  return read();
}

function update(id: string, patch: Partial<ProgressEntry>): void {
  const current = read();
  const existing = current[id] ? { ...defaultEntry(), ...current[id] } : defaultEntry();
  const next: ProgressMap = { ...current, [id]: { ...existing, ...patch } };
  write(next);
}

export const progressRepo = {
  toggleCompleted(id: string): void {
    const e = getEntry(id);
    update(id, {
      completed: !e.completed,
      completedAt: !e.completed ? new Date().toISOString() : null,
    });
  },
  toggleBookmarked(id: string): void {
    const e = getEntry(id);
    update(id, { bookmarked: !e.bookmarked });
  },
  toggleNeedsRevision(id: string): void {
    const e = getEntry(id);
    update(id, {
      needsRevision: !e.needsRevision,
      lastRevisedAt: !e.needsRevision ? null : new Date().toISOString(),
    });
  },
  setNotes(id: string, notes: string): void {
    update(id, { notes });
  },
  resetAll(): void {
    write({});
  },
};

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Hook: subscribe components to progress changes.
export function useProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

export function useProgressEntry(id: string): ProgressEntry {
  const all = useProgress();
  const entry = all[id];
  return entry ? { ...defaultEntry(), ...entry } : defaultEntry();
}
