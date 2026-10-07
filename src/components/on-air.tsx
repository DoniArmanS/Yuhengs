import Image from "next/image";
import Link from "next/link";
import type { AiringSlot } from "@/lib/types";
import { displayTitle } from "@/lib/format";
import { LocalTime } from "./local-time";
import { RelativeTime } from "./relative-time";
import { Spotlight, type SpotlightSlide } from "./spotlight";

/**
 * The home page lead: a rotating spotlight of the biggest new episodes,
 * beside a running list of everything that just aired. Only episodes the
 * servers actually have are passed in.
 */
export function OnAir({ slides, justAired }: { slides: SpotlightSlide[]; justAired: AiringSlot[] }) {
  if (slides.length === 0) return null;

  return (
    <section aria-labelledby="on-air" className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="tally inline-block size-2.5 rounded-full bg-onair" aria-hidden />
        <h2 id="on-air" className="condensed text-lg font-bold">
          On air
        </h2>
        <span className="text-sm text-dim">New episodes, ready to watch</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Spotlight slides={slides} />

        <div className="rise rounded-[4px] border border-rule bg-panel" style={{ animationDelay: "120ms" }}>
          <h3 className="flex items-center justify-between border-b border-rule px-4 py-3 text-sm font-semibold">
            Just aired
            <Link href="/schedule" className="font-medium text-dim underline-offset-4 hover:text-paper hover:underline">
              Full schedule
            </Link>
          </h3>
          <ol>
            {justAired.map((slot, i) => (
              <li
                key={`${slot.media.id}-${slot.episode}`}
                className="rise border-b border-rule/60 last:border-b-0"
                style={{ animationDelay: `${220 + i * 60}ms` }}
              >
                <Link
                  href={`/watch/${slot.media.id}/${slot.episode}`}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors duration-200 hover:bg-panel-raised"
                >
                  <span className="condensed w-12 shrink-0 text-base font-bold text-guide tabular-nums">
                    <LocalTime timestamp={slot.airingAt} options={{ hour: "2-digit", minute: "2-digit", hour12: false }} />
                  </span>
                  <span
                    className="relative h-12 w-[34px] shrink-0 overflow-hidden rounded-[2px]"
                    style={{ backgroundColor: slot.media.coverImage.color ?? "var(--color-panel-raised)" }}
                  >
                    {slot.media.coverImage.large ? (
                      <Image src={slot.media.coverImage.large} alt="" fill sizes="34px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold group-hover:underline group-hover:underline-offset-4">
                      {displayTitle(slot.media)}
                    </span>
                    <span className="flex gap-2.5 text-xs text-dim">
                      <span>Episode {slot.episode}</span>
                      <RelativeTime timestamp={slot.airingAt} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
