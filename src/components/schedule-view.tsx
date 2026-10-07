"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { AiringSlot } from "@/lib/types";
import { displayTitle } from "@/lib/format";

const noop = () => () => {};
// Read once in the browser; the server snapshot is null, so prerender never touches the clock.
let visitStartedAt: number | null = null;
const getVisitStart = () => (visitStartedAt ??= Date.now());

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Groups by the viewer's local day, so it renders only in the browser. */
export function ScheduleView({ slots }: { slots: AiringSlot[] }) {
  const now = useSyncExternalStore(noop, getVisitStart, () => null);
  const [selected, setSelected] = useState(0);

  if (now === null) return <ScheduleSkeleton />;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const byDay = new Map<string, AiringSlot[]>();
  for (const slot of slots) {
    const key = dayKey(new Date(slot.airingAt * 1000));
    byDay.set(key, [...(byDay.get(key) ?? []), slot]);
  }
  const day = days[selected];
  const list = byDay.get(dayKey(day)) ?? [];

  return (
    <div className="mt-8">
      <div role="group" aria-label="Day" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {days.map((d, i) => {
          const isSelected = i === selected;
          const count = byDay.get(dayKey(d))?.length ?? 0;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(i)}
              className={`flex min-w-[88px] shrink-0 flex-col items-center rounded-[3px] border px-3 py-2.5 transition-colors ${
                isSelected
                  ? "border-paper bg-paper text-ink"
                  : "border-rule bg-panel text-paper hover:border-paper/50"
              }`}
            >
              <span className="text-sm font-semibold">
                {i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className={`text-xs ${isSelected ? "text-ink/70" : "text-faint"}`}>
                {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                {" "}
                <span className="sr-only">,</span>({count})
              </span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-6">
        {list.length === 0 ? (
          <p className="py-12 text-center text-dim">No episodes scheduled for this day.</p>
        ) : (
          <ol className="divide-y divide-rule/50 rounded-[3px] border border-rule/70 bg-panel/50">
            {list.map((slot) => {
              const aired = slot.airingAt * 1000 <= now;
              const time = new Date(slot.airingAt * 1000).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <li key={`${slot.media.id}-${slot.episode}`}>
                  <Link
                    href={aired ? `/watch/${slot.media.id}/${slot.episode}` : `/anime/${slot.media.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-panel-raised/50"
                  >
                    <span className={`w-20 shrink-0 text-sm tabular-nums ${aired ? "text-faint" : "font-semibold text-guide"}`}>
                      {time}
                    </span>
                    <span
                      className="relative h-[56px] w-[40px] shrink-0 overflow-hidden rounded-[2px]"
                      style={{ backgroundColor: slot.media.coverImage.color ?? "var(--color-panel)" }}
                    >
                      {slot.media.coverImage.large ? (
                        <Image src={slot.media.coverImage.large} alt="" fill sizes="40px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-semibold">{displayTitle(slot.media)}</span>
                      <span className="text-sm text-dim">
                        Episode {slot.episode}
                        {slot.media.episodes ? ` of ${slot.media.episodes}` : ""}
                      </span>
                    </span>
                    <span className={`hidden shrink-0 text-sm sm:block ${aired ? "font-semibold text-paper" : "text-faint"}`}>
                      {aired ? "Watch now" : "Upcoming"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="mt-8" aria-busy="true" aria-label="Loading schedule">
      <div className="flex gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-[62px] w-[88px] shrink-0 animate-pulse rounded-[3px] bg-panel" />
        ))}
      </div>
      <div className="mt-6 h-96 animate-pulse rounded-[3px] bg-panel/50" />
    </div>
  );
}
