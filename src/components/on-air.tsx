import Image from "next/image";
import Link from "next/link";
import type { AiringSlot } from "@/lib/types";
import { displayTitle } from "@/lib/format";
import { LocalTime } from "./local-time";
import { RelativeTime } from "./relative-time";
import { PlayIcon } from "./icons";

/**
 * The home page lead: the most popular episode that aired in the last day,
 * beside a running list of everything that just aired.
 */
export function OnAir({ slots, fetchedAt }: { slots: AiringSlot[]; fetchedAt: number }) {
  const aired = slots
    .filter((s) => s.airingAt <= fetchedAt)
    .sort((a, b) => b.airingAt - a.airingAt);

  const lastDay = aired.filter((s) => s.airingAt >= fetchedAt - 86_400);
  const feature =
    [...lastDay].sort(
      (a, b) =>
        Number(Boolean(b.media.bannerImage)) - Number(Boolean(a.media.bannerImage)) ||
        (b.media.popularity ?? 0) - (a.media.popularity ?? 0),
    )[0] ?? aired[0];

  const seen = new Set<number>(feature ? [feature.media.id] : []);
  const justAired = aired.filter((s) => (seen.has(s.media.id) ? false : (seen.add(s.media.id), true))).slice(0, 7);

  if (!feature) return null;

  return (
    <section aria-labelledby="on-air" className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="tally inline-block size-2.5 rounded-full bg-onair" aria-hidden />
        <h2 id="on-air" className="condensed text-lg font-bold">
          On air
        </h2>
        <span className="text-sm text-dim">New episodes from the last day</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Feature slot={feature} />

        <div className="rounded-[4px] border border-rule bg-panel">
          <h3 className="flex items-center justify-between border-b border-rule px-4 py-3 text-sm font-semibold">
            Just aired
            <Link href="/schedule" className="font-medium text-dim underline-offset-4 hover:text-paper hover:underline">
              Full schedule
            </Link>
          </h3>
          <ol>
            {justAired.map((slot) => (
              <li key={`${slot.media.id}-${slot.episode}`} className="border-b border-rule/60 last:border-b-0">
                <Link
                  href={`/watch/${slot.media.id}/${slot.episode}`}
                  className="group flex items-center gap-3 px-4 py-2.5 hover:bg-panel-raised"
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

function Feature({ slot }: { slot: AiringSlot }) {
  const { media } = slot;
  const title = displayTitle(media);
  const art = media.bannerImage ?? media.coverImage.extraLarge;

  return (
    <article className="relative isolate flex min-h-[340px] overflow-hidden rounded-[4px] border border-rule bg-panel sm:min-h-[420px]">
      {art ? (
        <Image
          src={art}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 960px, 100vw"
          className="-z-10 object-cover"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />

      <div className="mt-auto max-w-2xl p-5 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="rounded-[2px] bg-onair px-1.5 py-0.5 text-xs font-bold text-white">New episode</span>
          <span className="text-paper/85">
            Episode {slot.episode} aired <RelativeTime timestamp={slot.airingAt} />
          </span>
        </p>
        <h3 className="condensed mt-3 text-[clamp(2.25rem,5vw,4rem)] leading-[0.95] font-extrabold text-balance">
          {title}
        </h3>
        {media.genres.length ? <p className="mt-3 text-sm text-paper/75">{media.genres.slice(0, 3).join(", ")}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/watch/${media.id}/${slot.episode}`}
            className="inline-flex h-12 items-center gap-2.5 rounded-[3px] bg-onair px-6 font-bold text-white transition-colors hover:bg-onair-hover"
          >
            <PlayIcon className="size-4" />
            Watch episode {slot.episode}
          </Link>
          <Link
            href={`/anime/${media.id}`}
            className="inline-flex h-12 items-center rounded-[3px] border border-paper/30 bg-ink/40 px-5 font-semibold backdrop-blur-sm transition-colors hover:border-paper/70"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
