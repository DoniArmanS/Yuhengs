import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { searchManga } from "@/lib/manga/anilist-manga";
import { MangaCard } from "@/components/manga/manga-card";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Search",
};

export default function MangaSearchPage(props: PageProps<"/manga/search">) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 lg:px-10">
      <h1 className="condensed text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold">Search manga</h1>
      <Suspense fallback={<SearchBox query="" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

function SearchBox({ query }: { query: string }) {
  return (
    <Form action="/manga/search" role="search" className="mt-5 flex max-w-xl">
      <label htmlFor="manga-search" className="sr-only">
        Title
      </label>
      <input
        id="manga-search"
        name="q"
        type="search"
        defaultValue={query}
        autoComplete="off"
        spellCheck={false}
        autoFocus={!query}
        placeholder="Title, in any language"
        className="h-12 min-w-0 flex-1 border-2 border-r-0 border-frame bg-panel px-4 text-paper placeholder:text-faint focus:outline-none"
      />
      <button type="submit" className="inline-flex h-12 items-center gap-2 border-2 border-frame bg-onair px-5 font-bold text-on-onair hover:bg-onair-hover">
        <SearchIcon className="size-4" />
        Search
      </button>
    </Form>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/manga/search">, "searchParams">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Math.min(50, Number(params.page) || 1));

  if (!query) return <SearchBox query="" />;

  const { media, pageInfo } = await searchManga(query, page);

  return (
    <>
      <SearchBox query={query} />
      <p className="mt-8 border-t-2 border-rule pt-6 text-sm text-dim" aria-live="polite">
        {pageInfo.total > 0 ? `${pageInfo.total.toLocaleString("en")} results for “${query}”` : `Nothing found for “${query}”.`}
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {media.map((m) => (
          <li key={m.id}>
            <MangaCard manga={m} />
          </li>
        ))}
      </ul>
      {pageInfo.hasNextPage || page > 1 ? (
        <nav aria-label="Pages" className="mt-10 flex items-center gap-3">
          {page > 1 ? (
            <Link href={`/manga/search?q=${encodeURIComponent(query)}&page=${page - 1}`} className="inline-flex h-11 items-center border-2 border-frame px-4 font-semibold hover:bg-panel">
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-dim">Page {page}</span>
          {pageInfo.hasNextPage ? (
            <Link href={`/manga/search?q=${encodeURIComponent(query)}&page=${page + 1}`} className="inline-flex h-11 items-center border-2 border-frame px-4 font-semibold hover:bg-panel">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
