import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { searchAnime } from "@/lib/anilist";
import { filtersToQuery, parseFilters } from "@/lib/filters";
import type { SearchFilters } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";
import { EmptyState } from "@/components/empty-state";
import { FilterForm } from "@/components/filter-form";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Browse anime",
  description: "Search every anime on AniList by title, genre, season, year and format.",
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 lg:px-10">
      <h1 className="condensed text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold">Browse anime</h1>
      <Suspense fallback={<ResultsSkeleton withForm />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  const { media, pageInfo } = await searchAnime(filters);

  return (
    <>
      <div className="mt-6">
        <FilterForm filters={filters} maxYear={new Date().getFullYear() + 1} />
      </div>

      <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-rule/60 pt-6">
        <p className="text-sm text-dim" aria-live="polite">
          {pageInfo.total > 0
            ? `${pageInfo.total.toLocaleString("en")} ${pageInfo.total === 1 ? "result" : "results"}${filters.search ? ` for “${filters.search}”` : ""}`
            : null}
        </p>
        {hasActiveFilters(filters) ? (
          <Link href="/search" className="text-sm font-medium text-paper underline underline-offset-4 hover:text-dim">
            Clear filters
          </Link>
        ) : null}
      </div>

      {media.length === 0 ? (
        <EmptyState title="Nothing matches that search">
          <p>Check the spelling, try the Japanese title, or remove a filter or two.</p>
        </EmptyState>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {media.map((anime, i) => (
            <li key={anime.id}>
              <AnimeCard anime={anime} priority={i < 6} sizes="(min-width: 1280px) 200px, (min-width: 768px) 22vw, 45vw" />
            </li>
          ))}
        </ul>
      )}

      {pageInfo.lastPage > 1 ? <Pagination filters={filters} current={pageInfo.currentPage} last={pageInfo.lastPage} /> : null}
    </>
  );
}

function hasActiveFilters(f: SearchFilters) {
  return Boolean(f.search || f.genre || f.season || f.year || f.format || f.status || f.sort);
}

function Pagination({ filters, current, last }: { filters: SearchFilters; current: number; last: number }) {
  const lastReachable = Math.min(last, 500);
  const linkClass =
    "inline-flex h-10 items-center gap-1 rounded-[2px] border border-rule bg-panel px-3.5 text-sm font-semibold hover:border-paper/50";

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
      {current > 1 ? (
        <Link href={`/search${filtersToQuery(filters, { page: current - 1 })}`} className={linkClass}>
          <ChevronLeftIcon className="size-4" /> Previous
        </Link>
      ) : null}
      <span className="px-2 text-sm text-dim tabular-nums">
        Page {current} of {lastReachable.toLocaleString("en")}
      </span>
      {current < lastReachable ? (
        <Link href={`/search${filtersToQuery(filters, { page: current + 1 })}`} className={linkClass}>
          Next <ChevronRightIcon className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}

function ResultsSkeleton({ withForm = false }: { withForm?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading results">
      {withForm ? <div className="mt-6 h-[156px] animate-pulse rounded-[3px] bg-panel/60" /> : null}
      <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[2/3] animate-pulse rounded-[3px] bg-panel" />
            <div className="mt-2.5 h-4 w-4/5 animate-pulse rounded bg-panel" />
          </li>
        ))}
      </ul>
    </div>
  );
}
