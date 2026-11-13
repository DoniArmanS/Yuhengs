"use client";

import { useSyncExternalStore } from "react";

/*
 * Reading progress lives in this browser only, like the anime watch history:
 * one entry per series (where you stopped) and the set of chapters finished.
 */

export interface ReadingEntry {
  id: number;
  title: string;
  cover: string | null;
  color: string | null;
  chapter: string;
  page: number;
  pages: number;
  updatedAt: number;
}

const KEY = "yuhengs:reading:v1";
const READ_KEY = "yuhengs:read:v1";
const LIMIT = 40;
const READ_LIMIT = 4000;
const EMPTY: ReadingEntry[] = [];
const NO_CHAPTERS: string[] = [];
const listeners = new Set<() => void>();

let entries: ReadingEntry[] | null = null;
let finished: Record<string, string[]> | null = null;

function readEntries(): ReadingEntry[] {
  if (entries) return entries;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    entries = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    entries = EMPTY;
  }
  return entries;
}

function readFinished(): Record<string, string[]> {
  if (finished) return finished;
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_KEY) ?? "{}");
    finished = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    finished = {};
  }
  return finished!;
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked; progress just won't persist.
  }
  listeners.forEach((l) => l());
}

export function recordReading(entry: Omit<ReadingEntry, "updatedAt">) {
  const current = readEntries();
  const same = current[0];
  // Page turns write often; skip the write when nothing changed.
  if (same && same.id === entry.id && same.chapter === entry.chapter && same.page === entry.page) return;
  entries = [{ ...entry, updatedAt: Date.now() }, ...current.filter((e) => e.id !== entry.id)].slice(0, LIMIT);
  save(KEY, entries);
}

/**
 * Opening a chapter: moves the series to the top of the library, but keeps
 * the saved page when it's the chapter you were already in (resuming).
 */
export function startReading(entry: Omit<ReadingEntry, "updatedAt">) {
  const saved = readEntries().find((e) => e.id === entry.id);
  recordReading(saved && saved.chapter === entry.chapter && saved.page < entry.pages ? { ...entry, page: saved.page } : entry);
}

export function markChapterRead(id: number, chapter: string) {
  const all = readFinished();
  const list = all[id] ?? [];
  if (list.includes(chapter)) return;
  finished = { ...all, [id]: [...list, chapter].slice(-READ_LIMIT) };
  save(READ_KEY, finished);
}

export function removeReading(id: number) {
  entries = readEntries().filter((e) => e.id !== id);
  save(KEY, entries);
}

export function clearReading() {
  entries = EMPTY;
  finished = {};
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(READ_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) entries = null;
    if (e.key === READ_KEY) finished = null;
    if (e.key === KEY || e.key === READ_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Server render and first hydration see nothing, then the stored list. */
export function useReading(): ReadingEntry[] {
  return useSyncExternalStore(subscribe, readEntries, () => EMPTY);
}

export function useReadingEntry(id: number): ReadingEntry | null {
  return useReading().find((e) => e.id === id) ?? null;
}

export function useFinishedChapters(id: number): string[] {
  return useSyncExternalStore(
    subscribe,
    () => readFinished()[id] ?? NO_CHAPTERS,
    () => NO_CHAPTERS,
  );
}
