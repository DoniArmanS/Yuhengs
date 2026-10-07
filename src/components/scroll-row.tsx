"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/** Horizontal shelf with snap scrolling; arrow buttons appear on pointer devices. */
export function ScrollRow({ children, label }: { children: ReactNode; label: string }) {
  const trackRef = useRef<HTMLUListElement>(null);

  function page(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="group/row relative">
      <ul
        ref={trackRef}
        aria-label={label}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10"
      >
        {children}
      </ul>
      <button
        type="button"
        onClick={() => page(-1)}
        aria-label={`Scroll ${label} back`}
        className="absolute top-[35%] -left-5 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-rule-strong bg-panel text-paper opacity-0 shadow-lg shadow-black/40 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 pointer-fine:grid"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        onClick={() => page(1)}
        aria-label={`Scroll ${label} forward`}
        className="absolute top-[35%] -right-5 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-rule-strong bg-panel text-paper opacity-0 shadow-lg shadow-black/40 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 pointer-fine:grid"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
