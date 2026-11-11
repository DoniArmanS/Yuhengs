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

export function clearHistory() {
  cache = EMPTY;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(PROGRESS_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

/*
 * Where the viewer is inside each episode, for servers that report it. Kept
 * apart from the history list (which changes once per episode) because this
 * is written every few seconds while a video plays.
 */
const PROGRESS_KEY = "yuhengs:progress:v1";
const PROGRESS_LIMIT = 300;

export interface EpisodeProgress {
  time: number;
  duration: number;
  updatedAt: number;
}

function readProgress(): Record<string, EpisodeProgress> {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProgress(id: number, episode: number, time: number, duration: number) {
  if (!(duration > 0) || !(time >= 0)) return;
  const all = readProgress();
  all[`${id}:${episode}`] = { time: Math.round(time), duration: Math.round(duration), updatedAt: Date.now() };
  const keys = Object.keys(all);
  if (keys.length > PROGRESS_LIMIT) {
    keys
      .sort((a, b) => all[a].updatedAt - all[b].updatedAt)
      .slice(0, keys.length - PROGRESS_LIMIT)
      .forEach((k) => delete all[k]);
  }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked; the episode just won't resume.
  }
}

export function getProgress(id: number, episode: number): EpisodeProgress | null {
  const saved = readProgress()[`${id}:${episode}`];
  return saved && Number.isFinite(saved.time) && Number.isFinite(saved.duration) ? saved : null;
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
