import Link from "next/link";
import type { AiringSlot } from "@/lib/types";
import { displayTitle } from "@/lib/format";
import { LocalTime } from "./local-time";

/**
 * "Just in" crawl under the header: newly aired episodes that are ready to
 * play. Pauses on hover or focus; with reduced motion it's a plain scroll row.
 */
export function NewsTicker({ slots }: { slots: AiringSlot[] }) {
  if (slots.length === 0) return null;

  // Each copy needs to be wider than the screen for a seamless loop, so short lists repeat.
  const repeat = Math.max(1, Math.ceil(12 / slots.length));
  const run = Array.from({ length: repeat }, () => slots).flat();

  const items = (copy: number) =>
    run.map((slot, i) => (
      <li
        key={`${copy}-${i}`}
        aria-hidden={copy === 1 || i >= slots.length ? true : undefined}
        className="flex shrink-0 items-center"
      >
        <Link
          href={`/watch/${slot.media.id}/${slot.episode}`}
          tabIndex={copy === 0 && i < slots.length ? undefined : -1}
          className="flex items-center gap-2.5 px-5 text-sm whitespace-nowrap transition-colors hover:text-paper"
        >
          <span className="condensed font-bold text-guide tabular-nums">
            <LocalTime timestamp={slot.airingAt} options={{ hour: "2-digit", minute: "2-digit", hour12: false }} />
          </span>
          <span className="font-semibold text-paper">{displayTitle(slot.media)}</span>
          <span className="text-dim">Episode {slot.episode}</span>
        </Link>
        <span className="h-3 w-px bg-rule-strong" aria-hidden />
      </li>
    ));

  return (
    <section aria-label="Just in: newly aired episodes" className="border-b border-rule bg-ink-deep">
      <div className="mx-auto flex max-w-[1400px] items-stretch">
        <p className="relative z-10 flex shrink-0 items-center gap-2 bg-onair px-4 py-2 text-sm font-bold text-white sm:ml-6 lg:ml-10">
          <span className="size-1.5 rounded-full bg-white" aria-hidden />
          Just in
        </p>
        <div className="ticker scrollbar-none relative min-w-0 flex-1 overflow-hidden">
          {/* Static edge fades (a CSS mask here forced a repaint every frame of the crawl) */}
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-ink-deep to-transparent" aria-hidden />
          <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink-deep to-transparent" aria-hidden />
          <ul
            className="ticker-track flex w-max py-2"
            style={{ ["--ticker-duration" as string]: `${run.length * 6}s` }}
          >
            {items(0)}
            {items(1)}
          </ul>
        </div>
      </div>
    </section>
  );
}
