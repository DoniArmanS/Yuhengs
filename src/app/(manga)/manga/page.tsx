import type { Metadata } from "next";
import Form from "next/form";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMangaHome } from "@/lib/manga/anilist-manga";
import { getAtsumaruLatest } from "@/lib/manga/atsumaru";
import { ContinueReading } from "@/components/manga/continue-reading";
import { MangaHeading, MangaRow, RowSkeleton } from "@/components/manga/manga-heading";
import { RelativeTime } from "@/components/relative-time";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Manga",
};

export default function MangaHome() {
  return (
    <>
      <section className="tone border-b-2 border-frame/30">
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <p className="text-xs font-extrabold tracking-[0.18em] text-onair uppercase">Manga · Manhwa · Manhua</p>
          <h1 className="condensed mt-2 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.92] font-extrabold text-balance">
            Every chapter, every group, one shelf.
          </h1>
          <Form action="/manga/search" className="mt-6 flex max-w-xl" role="search">
            <label htmlFor="manga-home-search" className="sr-only">
              Search manga
            </label>
            <input
              id="manga-home-search"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Solo Leveling, Frieren, Eleceed…"
              className="h-12 min-w-0 flex-1 border-2 border-r-0 border-frame bg-panel px-4 text-paper placeholder:text-faint focus:outline-none"
            />
            <button type="submit" className="inline-flex h-12 items-center gap-2 border-2 border-frame bg-onair px-5 font-bold text-on-onair hover:bg-onair-hover">
              <SearchIcon className="size-4" />
              Search
            </button>
          </Form>
        </div>
      </section>

      <ContinueReading />

      <Suspense fallback={<RowSkeleton title="New chapters" />}>
        <LatestUpdates />
      </Suspense>

      <Suspense fallback={<RowSkeleton title="Trending now" />}>
        <Collections />
      </Suspense>
    </>
  );
}

async function Collections() {
  const home = await getMangaHome();
  return (
    <>
      <MangaRow title="Trending now" items={home.trending} />
      <MangaRow title="Trending manhwa" description="Korean webtoons, read as one long strip." items={home.manhwa} />
      <MangaRow title="Most popular" items={home.popular} />
      <MangaRow title="Top rated" items={home.topRated} />
    </>
  );
}

/** Atsumaru's feed of series that just got a chapter, from any group. */
async function LatestUpdates() {
  await connection();
  let items: Awaited<ReturnType<typeof getAtsumaruLatest>> = [];
  let failed = false;
  try {
    items = await getAtsumaruLatest(18);
  } catch {
    failed = true;
  }

  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-labelledby="new-chapters">
      <MangaHeading id="new-chapters" title="New chapters" description="Series that just got a new upload, newest first." />
      {failed ? (
        <p className="ink-frame bg-panel px-4 py-3 text-sm text-dim">Atsumaru didn’t answer, so the newest uploads can’t be shown right now.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              {/* A plain link: /manga/open is a route handler that finds the AniList page. */}
              <a
                href={`/manga/open/${item.id}`}
                className="ink-frame group flex h-full items-center gap-3 bg-panel px-3.5 py-3 transition-[translate,box-shadow] duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-shadow)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm leading-snug font-bold group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                  <span className="mt-1 block text-xs text-dim">
                    {item.type ?? "Series"}
                    {item.updatedAt ? (
                      <>
                        {" · "}
                        <RelativeTime timestamp={Math.floor(item.updatedAt / 1000)} />
                      </>
                    ) : null}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-faint" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
