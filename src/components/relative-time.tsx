"use client";

import { useNow } from "@/lib/use-now";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });

export function relativeLabel(timestamp: number, now: number): string {
  const diff = timestamp - now;
  const abs = Math.abs(diff);
  if (abs < 60) return diff < 0 ? "just now" : "now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86_400), "day");
}

/** "40 min. ago" / "in 2 hr." in the browser; empty on the server pass. */
export function RelativeTime({ timestamp }: { timestamp: number }) {
  const now = useNow();
  return <time dateTime={new Date(timestamp * 1000).toISOString()}>{now ? relativeLabel(timestamp, now) : ""}</time>;
}
