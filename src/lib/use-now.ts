"use client";

import { useSyncExternalStore } from "react";

let current: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function tick() {
  current = Math.floor(Date.now() / 1000);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(tick, 30_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  return (current ??= Math.floor(Date.now() / 1000));
}

/**
 * Current unix time in seconds, refreshed every 30s. Null during server
 * render and hydration, so time-relative UI never mismatches.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
