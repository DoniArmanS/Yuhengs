"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { AiringSlot } from "@/lib/types";
import { displayTitle, slotKey } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { SectionHeading } from "./section-heading";

const HOUR_PX = 320;
const BLOCK_MIN = 24; // a typical episode slot
const LANE_PX = 76;
const BEFORE_H = 2;
const AFTER_H = 22;

interface Placed {
  slot: AiringSlot;
  left: number;
  lane: number;
}

/** Greedy lane packing so episodes airing at the same time stack instead of overlapping. */
function place(slots: AiringSlot[], start: number): { placed: Placed[]; lanes: number } {
  const width = (BLOCK_MIN / 60) * HOUR_PX;
  const laneEnds: number[] = [];
  const placed = slots.map((slot) => {
    const left = ((slot.airingAt - start) / 3600) * HOUR_PX;
    let lane = laneEnds.findIndex((end) => end + 6 <= left);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = left + width;
    return { slot, left, lane };
  });
  return { placed, lanes: Math.max(laneEnds.length, 1) };
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * A TV-guide strip of the next day's episodes in the viewer's own time,
 * with a live "now" marker. Client-only: positions depend on the local clock.
 */
export function TonightGuide({ slots, readyKeys }: { slots: AiringSlot[]; readyKeys: string[] }) {
  const now = useNow();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hasNow = now !== null;

  // Open the strip at the next upcoming episode (or "now" if one is close), once,
  // so a quiet hour doesn't greet people with an empty panel.
  useEffect(() => {
    if (!hasNow || !scrollerRef.current) return;
    const t = Math.floor(Date.now() / 1000);
    const start = Math.floor((t - BEFORE_H * 3600) / 3600) * 3600;
    const next = slots.find((s) => s.airingAt > t);
    const target = next?.airingAt ?? t;
    scrollerRef.current.scrollLeft = ((target - start) / 3600) * HOUR_PX - HOUR_PX * 0.25;
  }, [hasNow, slots]);

  return (
    <section aria-labelledby="tonight" className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <SectionHeading
        id="tonight"
        title="Coming up"
        description="The next 24 hours of new episodes, in your time"
        href="/schedule"
        linkLabel="Week view"
      />

      {now === null ? <GuideSkeleton /> : <Strip slots={slots} now={now} scrollerRef={scrollerRef} ready={new Set(readyKeys)} />}
    </section>
  );
}

function Strip({
  slots,
  now,
  scrollerRef,
  ready,
}: {
  slots: AiringSlot[];
  now: number;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  ready: Set<string>;
}) {
  const start = Math.floor((now - BEFORE_H * 3600) / 3600) * 3600;
  const end = start + (BEFORE_H + AFTER_H) * 3600;
  const visible = slots.filter((s) => s.airingAt >= start && s.airingAt < end);
  const { placed, lanes } = place(visible, start);
  const hours = Array.from({ length: BEFORE_H + AFTER_H }, (_, i) => start + i * 3600);
  const totalWidth = (BEFORE_H + AFTER_H) * HOUR_PX;
  const nowLeft = ((now - start) / 3600) * HOUR_PX;
  const blockWidth = (BLOCK_MIN / 60) * HOUR_PX;

  if (visible.length === 0) {
    return <p className="rounded-[4px] border border-rule bg-panel px-4 py-10 text-center text-dim">No episodes scheduled in the next day.</p>;
  }

  return (
    <div
      ref={scrollerRef}
      className="scrollbar-none overflow-x-auto rounded-[4px] border border-rule bg-panel"
      role="region"
      aria-label="Episode guide, scroll sideways for later times"
      tabIndex={0}
    >
      <div className="relative" style={{ width: totalWidth, height: 36 + lanes * LANE_PX + 12 }}>
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 border-l border-rule/70"
            style={{ left: i * HOUR_PX }}
            aria-hidden
          >
            <span className="condensed absolute top-2 left-2 text-sm font-bold text-faint tabular-nums">
              {timeFmt.format(new Date(h * 1000))}
            </span>
          </div>
        ))}

        <ol className="absolute inset-x-0 top-9">
          {placed.map(({ slot, left, lane }) => {
            const aired = slot.airingAt <= now;
            const watchable = aired && ready.has(slotKey(slot));
            return (
              <li
                key={`${slot.media.id}-${slot.episode}`}
                className="absolute"
                style={{ left, top: lane * LANE_PX, width: blockWidth - 6, height: LANE_PX - 8 }}
              >
                <Link
                  href={watchable ? `/watch/${slot.media.id}/${slot.episode}` : `/anime/${slot.media.id}`}
                  className={`flex h-full flex-col justify-between rounded-[3px] border px-2.5 py-2 transition-colors ${
                    aired
                      ? "border-rule bg-ink/60 text-dim hover:border-rule-strong hover:text-paper"
                      : "border-rule-strong bg-panel-raised hover:border-paper/60"
                  }`}
                >
                  <span className="line-clamp-2 text-[13px] leading-tight font-semibold">{displayTitle(slot.media)}</span>
                  <span className="flex items-center justify-between text-xs">
                    <span className={`condensed font-bold tabular-nums ${aired ? "" : "text-guide"}`}>
                      {timeFmt.format(new Date(slot.airingAt * 1000))}
                    </span>
                    <span className="text-dim">{aired && !watchable ? "Not ready" : `Ep ${slot.episode}`}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-onair" style={{ left: nowLeft }} aria-hidden>
          <span className="absolute bottom-1.5 left-1.5 rounded-[2px] bg-onair px-1.5 text-xs leading-5 font-bold text-white">
            Now
          </span>
        </div>
      </div>
    </div>
  );
}

function GuideSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-[4px] border border-rule bg-panel" aria-busy="true" aria-label="Loading guide" />;
}
