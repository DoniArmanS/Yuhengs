"use client";

import Image from "next/image";
import Link from "next/link";
import { removeFromHistory, useHistory } from "@/lib/history";
import { CloseIcon, PlayIcon } from "./icons";
import { ScrollRow } from "./scroll-row";
import { SectionHeading } from "./section-heading";

export function ContinueWatching() {
  const history = useHistory();
  if (history.length === 0) return null;

  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <SectionHeading title="Continue watching" />
      <ScrollRow label="Continue watching">
        {history.map((entry) => {
          const progress = entry.totalEpisodes ? Math.min(entry.episode / entry.totalEpisodes, 1) : null;
          return (
            <li key={entry.id} className="group relative w-[72vw] max-w-[300px] shrink-0 snap-start sm:w-[300px]">
              <Link
                href={`/watch/${entry.id}/${entry.episode}`}
                className="flex gap-3 rounded-[4px] border border-rule bg-panel p-2.5 transition-colors hover:border-rule-strong"
              >
                <span
                  className="relative h-[84px] w-[60px] shrink-0 overflow-hidden rounded-[2px]"
                  style={{ backgroundColor: entry.color ?? "var(--color-panel-raised)" }}
                >
                  {entry.cover ? <Image src={entry.cover} alt="" fill sizes="60px" className="object-cover" /> : null}
                  <span className="absolute inset-0 grid place-items-center bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayIcon className="size-6 text-paper" />
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center pr-6">
                  <span className="line-clamp-2 text-sm font-semibold">{entry.title}</span>
                  <span className="mt-1 text-xs text-dim">
                    Episode {entry.episode}
                    {entry.totalEpisodes ? ` of ${entry.totalEpisodes}` : ""}
                  </span>
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
                aria-label={`Remove ${entry.title} from continue watching`}
                className="absolute top-2 right-2 grid size-7 place-items-center rounded-[2px] text-faint hover:bg-panel-raised hover:text-paper"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          );
        })}
      </ScrollRow>
    </section>
  );
}
