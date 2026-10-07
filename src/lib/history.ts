"use client";

import { useSyncExternalStore } from "react";

export interface HistoryEntry {
  id: number;
  title: string;
  cover: string | null;
  color: string | null;
  episode: number;
  totalEpisodes: number | null;
  updatedAt: number;
}

const KEY = "yuhengs:history:v1";
const LIMIT = 24;
const EMPTY: HistoryEntry[] = [];
const listeners = new Set<() => void>();

let cache: HistoryEntry[] | null = null;

function read(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export function recordWatch(entry: Omit<HistoryEntry, "updatedAt">) {
  const next = [
    { ...entry, updatedAt: Date.now() },
    ...read().filter((e) => e.id !== entry.id),
  ].slice(0, LIMIT);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked; history just won't persist.
  }
  listeners.forEach((l) => l());
}

export function removeFromHistory(id: number) {
  cache = read().filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Server render and first hydration see an empty list, then the stored one. */
export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useLastEpisode(id: number): number | null {
  const history = useHistory();
  return history.find((e) => e.id === id)?.episode ?? null;
}
