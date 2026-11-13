"use client";

import Link from "next/link";
import { clearReading, useReading } from "@/lib/manga/reading";
import { ReadingTile } from "./continue-reading";

export function Library() {
  const entries = useReading();

  if (entries.length === 0) {
    return (
      <div className="ink-frame tone mt-8 max-w-xl bg-panel p-6">
        <p className="font-bold">Nothing here yet.</p>
        <p className="mt-1 text-sm text-dim">Open any chapter and it shows up here, with the page you stopped on.</p>
        <Link href="/manga" className="mt-4 inline-flex h-11 items-center border-2 border-frame bg-onair px-4 font-bold text-on-onair hover:bg-onair-hover">
          Find something to read
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <ReadingTile entry={entry} removable />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Forget every series and chapter you’ve read in this browser?")) clearReading();
        }}
        className="mt-8 inline-flex h-11 items-center border-2 border-rule-strong px-4 text-sm font-semibold text-dim hover:border-frame hover:text-paper"
      >
        Clear library
      </button>
    </>
  );
}
