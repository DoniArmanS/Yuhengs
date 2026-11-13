"use client";

import Image from "next/image";
import Link from "next/link";
import { removeReading, useReading, type ReadingEntry } from "@/lib/manga/reading";
import { CloseIcon } from "../icons";
import { MangaHeading } from "./manga-heading";

function percent(e: ReadingEntry) {
  return e.pages > 1 ? Math.round(((e.page + 1) / e.pages) * 100) : 0;
}

export function ReadingTile({ entry, removable = false }: { entry: ReadingEntry; removable?: boolean }) {
  return (
    <div className="ink-frame group relative flex gap-3 bg-panel p-2.5">
      <Link href={`/read/${entry.id}/${entry.chapter}`} className="flex min-w-0 flex-1 gap-3 outline-offset-4">
        <span className="relative h-[92px] w-16 shrink-0 overflow-hidden border-2 border-frame" style={{ backgroundColor: entry.color ?? undefined }}>
          {entry.cover ? <Image src={entry.cover} alt="" fill sizes="64px" className="object-cover" /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <span className="line-clamp-2 text-sm leading-snug font-bold group-hover:underline group-hover:underline-offset-4">{entry.title}</span>
          <span className="text-xs text-dim">
            Chapter {entry.chapter} · page {entry.page + 1} of {entry.pages}
          </span>
          <span className="h-2 w-full border border-frame bg-ink" aria-hidden>
            <span className="block h-full bg-onair" style={{ width: `${percent(entry)}%` }} />
          </span>
        </span>
      </Link>
      {removable ? (
        <button
          type="button"
          onClick={() => removeReading(entry.id)}
          className="grid size-9 shrink-0 place-items-center self-start text-faint hover:text-paper"
          aria-label={`Remove ${entry.title} from your library`}
        >
          <CloseIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Where you stopped, newest first. Nothing renders until there's something to resume. */
export function ContinueReading() {
  const entries = useReading();
  if (entries.length === 0) return null;
  return (
    <section className="mx-auto mt-12 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-labelledby="continue-reading">
      <MangaHeading id="continue-reading" title="Continue reading" href="/manga/library" linkLabel="Library" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.id}>
            <ReadingTile entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}
