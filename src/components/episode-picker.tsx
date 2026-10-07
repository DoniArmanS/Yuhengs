"use client";

import Link from "next/link";
import { useState } from "react";
import { useLastEpisode } from "@/lib/history";

const CHUNK = 100;

export function EpisodePicker({
  animeId,
  total,
  current,
}: {
  animeId: number;
  total: number;
  current?: number;
}) {
  const lastWatched = useLastEpisode(animeId);
  const focus = current ?? lastWatched ?? 1;
  const chunks = Math.ceil(total / CHUNK);
  const [chunk, setChunk] = useState(() => Math.min(Math.floor((focus - 1) / CHUNK), chunks - 1));

  const start = chunk * CHUNK + 1;
  const end = Math.min(start + CHUNK - 1, total);
  const episodes = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div>
      {chunks > 1 ? (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor={`range-${animeId}`} className="text-sm text-dim">
            Episodes
          </label>
          <select
            id={`range-${animeId}`}
            value={chunk}
            onChange={(e) => setChunk(Number(e.target.value))}
            className="h-9 rounded-[3px] border border-rule bg-panel px-3 text-sm text-paper"
          >
            {Array.from({ length: chunks }, (_, i) => (
              <option key={i} value={i}>
                {i * CHUNK + 1}–{Math.min((i + 1) * CHUNK, total)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <ol className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
        {episodes.map((ep) => {
          const isCurrent = ep === current;
          const isLast = !current && ep === lastWatched;
          return (
            <li key={ep}>
              <Link
                href={`/watch/${animeId}/${ep}`}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Episode ${ep}${isLast ? ", last watched" : ""}`}
                className={`grid h-11 place-items-center rounded-[2px] border text-sm font-semibold tabular-nums transition-colors ${
                  isCurrent
                    ? "border-paper bg-paper text-ink"
                    : isLast
                      ? "border-guide/70 bg-panel text-guide"
                      : lastWatched && ep < lastWatched
                        ? "border-rule/50 bg-panel/50 text-faint hover:border-paper/50 hover:text-paper"
                        : "border-rule bg-panel text-paper hover:border-paper/50"
                }`}
              >
                {ep}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
