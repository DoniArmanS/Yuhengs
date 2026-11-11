import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getHomeCollections } from "@/lib/anilist";
import { getOnAirData } from "@/lib/on-air";
import { displayTitle } from "@/lib/format";
import { pickWallCovers, wallColumns } from "@/lib/poster-wall";
import { ContinueChip } from "./continue-chip";
import { ChevronRightIcon, PlayIcon } from "./icons";

/** Where each column starts and how long one loop takes, so the rows never line up. */
const COLUMN_OFFSETS = ["0px", "-150px", "-70px", "-230px"];
const COLUMN_SECONDS = [70, 80, 95, 105];

/**
 * The landing hero, one screen tall: the pitch and a search box on the left,
 * a slowly moving wall of about 32 different covers on the right. The copy
 * needs no data, so it renders at once; the wall, the top searches and the
 * episode count stream in behind it. The landing header floats over its top.
 */
export function PosterWallHero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink-deep">
      <Suspense fallback={null}>
        <PosterWall />
      </Suspense>
      <div className="wall-shade pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 items-center px-4 pt-24 pb-20 sm:px-6 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="flex max-w-[720px] flex-col gap-6">
          <p className="inline-flex h-8 items-center gap-2 self-start rounded-full border border-rule-strong bg-panel/70 px-3.5 text-[13px] font-semibold text-dim">
            <span className="tally size-1.5 rounded-full bg-onair" aria-hidden />
            New episodes every day
          </p>

          <h1 id="hero-title" className="condensed text-[clamp(3.25rem,8.4vw,6.25rem)] leading-[0.86] font-extrabold">
            <span className="block">Every new</span>
            <span className="block">episode.</span>
            <span className="block text-transparent [-webkit-text-stroke:2px_var(--color-onair)]">Sub &amp; dub. Free.</span>
          </h1>

          <p className="max-w-[48ch] text-base leading-relaxed text-dim sm:text-[17px]">
            Watch anime the day it airs in Japan. No account, no payment, and no ads from us.
          </p>

          <Form action="/search" role="search" className="flex flex-col gap-3">
            <label htmlFor="hero-search" className="sr-only">
              Search anime
            </label>
            <div className="flex gap-2 rounded-full border border-rule-strong bg-ink-deep p-1.5 transition-colors focus-within:border-onair">
              <input
                id="hero-search"
                name="q"
                type="search"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search anime, e.g. One Piece"
                className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-base text-paper placeholder:text-dim focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-full bg-onair px-5 font-bold text-on-onair transition-colors hover:bg-onair-hover sm:px-6"
              >
                Search
              </button>
            </div>
            <Suspense fallback={<div className="h-8" />}>
              <TopSearches />
            </Suspense>
          </Form>

          <ContinueChip />

          <div className="flex flex-wrap gap-3">
            <Link
              href="/home"
              className="inline-flex h-13 items-center gap-2.5 rounded-full bg-onair px-6 font-bold text-on-onair shadow-[0_14px_34px_-14px_rgb(187_154_247/0.85)] transition-[background-color,transform] duration-150 hover:bg-onair-hover active:scale-[0.97]"
            >
              <PlayIcon className="size-4" />
              Start watching
            </Link>
            <Link
              href="/search?sort=POPULARITY_DESC"
              className="inline-flex h-13 items-center gap-2 rounded-full border border-rule-strong bg-ink-deep/60 px-6 font-semibold text-paper transition-[border-color,transform] duration-150 hover:border-dim active:scale-[0.97]"
            >
              Browse popular
              <ChevronRightIcon className="size-4" />
            </Link>
          </div>

          <dl className="mt-1 flex flex-wrap gap-x-9 gap-y-4">
            <div className="flex flex-col-reverse gap-1">
              <dt className="text-xs font-bold tracking-[0.12em] text-dim uppercase">New in 24 hours</dt>
              <dd className="condensed text-[2rem] leading-none font-extrabold tabular-nums">
                <Suspense fallback="–">
                  <AiredLastDay />
                </Suspense>
              </dd>
            </div>
            <div className="flex flex-col-reverse gap-1">
              <dt className="text-xs font-bold tracking-[0.12em] text-dim uppercase">Switch any time</dt>
              <dd className="condensed text-[2rem] leading-none font-extrabold">Sub · Dub</dd>
            </div>
            <div className="flex flex-col-reverse gap-1">
              <dt className="text-xs font-bold tracking-[0.12em] text-dim uppercase">Sign-ups</dt>
              <dd className="condensed text-[2rem] leading-none font-extrabold text-guide">0</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

async function PosterWall() {
  const { trending, seasonal, popular, topRated } = await getHomeCollections();
  const columns = wallColumns(pickWallCovers([trending, seasonal, popular, topRated]), 4);

  return (
    <div
      className="absolute -top-40 -right-20 -bottom-40 -z-20 flex w-[60%] rotate-[-8deg] gap-4 max-lg:-right-[45%] max-lg:w-full max-lg:opacity-60 max-sm:-right-[75%] max-sm:w-[135%]"
      aria-hidden
    >
      {columns.map((column, c) => (
        <div key={c} className="min-w-0 flex-1" style={{ marginTop: COLUMN_OFFSETS[c] }}>
          {/* The column holds its covers twice and slides by half its height, so the loop is seamless. */}
          <div className={c % 2 ? "wall-down" : "wall-up"} style={{ ["--wall-seconds" as string]: `${COLUMN_SECONDS[c]}s` }}>
            {[...column, ...column].map((cover, i) => (
              <div
                key={i}
                className="relative mb-4 aspect-[2/3] overflow-hidden rounded-[10px]"
                style={{ backgroundColor: cover.color ?? "var(--color-panel)" }}
              >
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 34vw, 16vw"
                  loading={i < 3 ? "eager" : "lazy"}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

async function TopSearches() {
  const { trending } = await getHomeCollections();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-dim">Top search</span>
      {trending.slice(0, 5).map((anime) => (
        <Link
          key={anime.id}
          href={`/anime/${anime.id}`}
          className="inline-flex h-8 max-w-52 items-center rounded-full border border-rule-strong bg-ink-deep/70 px-3 text-[13px] text-dim transition-colors hover:border-onair hover:text-paper"
        >
          <span className="truncate">{displayTitle(anime)}</span>
        </Link>
      ))}
    </div>
  );
}

async function AiredLastDay() {
  const { airedLastDay } = await getOnAirData();
  return airedLastDay;
}
