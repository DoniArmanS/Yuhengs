"use client";

import Link from "next/link";
import { useReadingEntry } from "@/lib/manga/reading";
import { BookIcon } from "../icons";

const primary =
  "ink-frame inline-flex h-12 items-center gap-2.5 bg-onair px-5 font-bold text-on-onair transition-colors hover:bg-onair-hover";
const secondary =
  "inline-flex h-12 items-center border-2 border-frame bg-panel px-5 font-semibold text-paper transition-colors hover:bg-panel-raised";

/** Continue where you stopped, or start at the first chapter any source has. */
export function ReadCta({ mangaId, first, latest }: { mangaId: number; first: string; latest: string }) {
  const entry = useReadingEntry(mangaId);

  if (entry) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href={`/read/${mangaId}/${entry.chapter}`} className={primary}>
          <BookIcon className="size-5" />
          Continue · Ch. {entry.chapter}
        </Link>
        {latest !== entry.chapter ? (
          <Link href={`/read/${mangaId}/${latest}`} className={secondary}>
            Latest · Ch. {latest}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/read/${mangaId}/${first}`} className={primary}>
        <BookIcon className="size-5" />
        Start reading · Ch. {first}
      </Link>
      {latest !== first ? (
        <Link href={`/read/${mangaId}/${latest}`} className={secondary}>
          Latest · Ch. {latest}
        </Link>
      ) : null}
    </div>
  );
}
