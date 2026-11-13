"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFinishedChapters, useReadingEntry } from "@/lib/manga/reading";
import { useNow } from "@/lib/use-now";
import { relativeLabel } from "../relative-time";

/** [key, title, newest upload (ms), indexes into `groups`] — compact, since long series run past a thousand rows. */
export type ChapterRow = [string, string | null, number | null, number[]];

const PAGE = 80;
const NEW_FOR = 3 * 86_400;

export function ChapterList({ mangaId, rows, groups }: { mangaId: number; rows: ChapterRow[]; groups: string[] }) {
  const [group, setGroup] = useState<number | null>(null);
  const [find, setFind] = useState("");
  const [oldestFirst, setOldestFirst] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const finished = useFinishedChapters(mangaId);
  const reading = useReadingEntry(mangaId);
  const now = useNow();
  const done = useMemo(() => new Set(finished), [finished]);

  // The groups with the most uploads get a chip; the rest are still in the rows.
  const topGroups = useMemo(() => {
    const counts = new Map<number, number>();
    rows.forEach(([, , , g]) => g.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([i]) => i);
  }, [rows]);

  const visible = useMemo(() => {
    const query = find.trim();
    let list = rows.filter(([key, , , g]) => (group === null || g.includes(group)) && (!query || key.startsWith(query)));
    if (oldestFirst) list = [...list].reverse();
    return list;
  }, [rows, group, find, oldestFirst]);

  const chip = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center rounded-full border-2 px-3.5 text-sm font-bold transition-colors ${
      active ? "border-frame bg-frame text-ink" : "border-rule-strong text-dim hover:border-frame hover:text-paper"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {topGroups.length > 1 ? (
          <div role="group" aria-label="Scanlation group" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <button type="button" aria-pressed={group === null} onClick={() => setGroup(null)} className={chip(group === null)}>
              All groups
            </button>
            {topGroups.map((i) => (
              <button key={i} type="button" aria-pressed={group === i} onClick={() => { setGroup(i); setShown(PAGE); }} className={chip(group === i)}>
                {groups[i]}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 gap-2">
          <label className="sr-only" htmlFor="chapter-find">
            Find a chapter number
          </label>
          <input
            id="chapter-find"
            inputMode="decimal"
            value={find}
            onChange={(e) => { setFind(e.target.value.replace(/[^\d.]/g, "")); setShown(PAGE); }}
            placeholder="Ch. #"
            className="h-9 w-24 border-2 border-rule-strong bg-ink px-3 text-sm text-paper placeholder:text-faint focus:border-frame focus:outline-none"
          />
          <button type="button" onClick={() => setOldestFirst((v) => !v)} className="h-9 border-2 border-rule-strong px-3 text-sm font-semibold text-dim hover:border-frame hover:text-paper">
            {oldestFirst ? "Oldest first" : "Newest first"}
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-dim">No chapter matches.</p>
      ) : (
        <ol className="ink-frame mt-4 divide-y-2 divide-rule bg-panel">
          {visible.slice(0, shown).map(([key, title, date, g]) => {
            const isReading = reading?.chapter === key;
            const isRead = done.has(key) && !isReading;
            const isNew = Boolean(now && date && now - date / 1000 < NEW_FOR && !isRead);
            const groupParam = group !== null ? `?g=${encodeURIComponent(groups[group])}` : "";
            return (
              <li key={key}>
                <Link
                  href={`/read/${mangaId}/${key}${groupParam}`}
                  className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-panel-raised ${isReading ? "bg-onair/10" : ""}`}
                >
                  <span className="min-w-0">
                    <span className={`block font-extrabold ${isRead ? "text-faint" : ""}`}>
                      Chapter {key}
                      {title ? <span className="font-semibold text-dim">: {title}</span> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-dim">
                      {g.map((i) => groups[i]).slice(0, 2).join(", ")}
                      {g.length > 2 ? ` +${g.length - 2} more` : ""}
                      {date && now ? ` · ${relativeLabel(Math.floor(date / 1000), now)}` : ""}
                    </span>
                  </span>
                  {isReading || isRead || isNew ? (
                    <span className={`shrink-0 text-[11px] font-extrabold tracking-wider uppercase ${isRead ? "text-faint" : "text-onair"}`}>
                      {isReading ? `Reading · p. ${reading!.page + 1}` : isRead ? "Read" : "New"}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {visible.length > shown ? (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE * 2)}
          className="mt-4 inline-flex h-11 items-center border-2 border-rule-strong px-4 text-sm font-semibold hover:border-frame"
        >
          Show more ({visible.length - shown} left)
        </button>
      ) : null}
    </div>
  );
}
