"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clearHistory, removeFromHistory, useHistory } from "@/lib/history";
import { useNow } from "@/lib/use-now";
import { relativeLabel } from "./relative-time";
import { CloseIcon, PlayIcon } from "./icons";

export function HistoryList() {
  const history = useHistory();
  const now = useNow(); // null until hydrated: history lives in this browser only
  const [confirming, setConfirming] = useState(false);

  if (now === null) {
    return <div className="mt-8 h-64 animate-pulse rounded-[4px] bg-panel" aria-busy="true" aria-label="Loading history" />;
  }

  if (history.length === 0) {
    return (
      <div className="mt-10 rounded-[4px] border border-rule bg-panel px-6 py-12 text-center">
        <p className="condensed text-2xl font-extrabold">Nothing watched yet</p>
        <p className="mt-2 text-sm text-dim">Episodes you play show up here so you can pick up where you left off.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-[3px] bg-onair px-5 font-semibold text-white transition-colors hover:bg-onair-hover"
        >
          Find something to watch
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-dim">
          {history.length} {history.length === 1 ? "show" : "shows"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirming) {
              clearHistory();
              setConfirming(false);
            } else setConfirming(true);
          }}
          onBlur={() => setConfirming(false)}
          className={`h-10 rounded-[3px] border px-4 text-sm font-semibold transition-colors ${
            confirming ? "border-onair bg-onair text-white" : "border-rule text-dim hover:border-rule-strong hover:text-paper"
          }`}
        >
          {confirming ? "Tap again to clear all" : "Clear history"}
        </button>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {history.map((entry) => {
          const progress = entry.totalEpisodes ? Math.min(entry.episode / entry.totalEpisodes, 1) : null;
          return (
            <li key={entry.id} className="relative">
              <Link
                href={`/watch/${entry.id}/${entry.episode}`}
                className="group flex gap-4 rounded-[4px] border border-rule bg-panel p-3 pr-12 transition-colors hover:border-rule-strong"
              >
                <span
                  className="relative h-[96px] w-[68px] shrink-0 overflow-hidden rounded-[3px]"
                  style={{ backgroundColor: entry.color ?? "var(--color-panel-raised)" }}
                >
                  {entry.cover ? <Image src={entry.cover} alt="" fill sizes="68px" className="object-cover" /> : null}
                  <span className="absolute inset-0 grid place-items-center bg-ink/40">
                    <span className="grid size-9 place-items-center rounded-full bg-onair text-white">
                      <PlayIcon className="size-3.5 translate-x-px" />
                    </span>
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center">
                  <span className="line-clamp-2 font-semibold">{entry.title}</span>
                  <span className="mt-1 text-sm text-dim">
                    Episode {entry.episode}
                    {entry.totalEpisodes ? ` of ${entry.totalEpisodes}` : ""}
                  </span>
                  <span className="mt-0.5 text-xs text-faint">Watched {relativeLabel(Math.floor(entry.updatedAt / 1000), now)}</span>
                  {progress !== null ? (
                    <span className="mt-2 h-1 overflow-hidden rounded-full bg-rule" aria-hidden>
                      <span className="block h-full bg-onair" style={{ width: `${progress * 100}%` }} />
                    </span>
                  ) : null}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => removeFromHistory(entry.id)}
                aria-label={`Remove ${entry.title} from history`}
                className="absolute top-2 right-2 grid size-10 place-items-center rounded-[3px] text-faint transition-colors hover:bg-panel-raised hover:text-paper"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
