import Link from "next/link";
import { Logo } from "../logo";
import { BookmarkIcon, SearchIcon } from "../icons";
import { lock } from "@/app/(manga)/manga/unlock/actions";

/** Manga header: the Anime | Manga switch, manga search and the library. */
export function MangaHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-frame/40 bg-ink pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-10">
        <Link href="/manga" className="shrink-0" aria-label="Yuhengs manga home">
          <Logo />
        </Link>

        <nav aria-label="Section" className="flex items-center rounded-full border border-rule bg-ink-deep p-1">
          <Link href="/home" className="rounded-full px-3 py-1.5 text-sm font-semibold text-dim transition-colors hover:text-paper sm:px-4">
            Anime
          </Link>
          <Link href="/manga" aria-current="true" className="rounded-full bg-onair px-3 py-1.5 text-sm font-bold text-on-onair sm:px-4">
            Manga
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form action="/manga/search" role="search" className="relative hidden md:block">
            <label htmlFor="manga-header-search" className="sr-only">
              Search manga
            </label>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <input
              id="manga-header-search"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search manga, manhwa…"
              className="h-10 w-64 border-2 border-rule-strong bg-panel pr-3 pl-9 text-sm text-paper placeholder:text-faint focus:border-frame focus:outline-none lg:w-80"
            />
          </form>
          <Link
            href="/manga/library"
            className="hidden h-10 items-center gap-2 border-2 border-rule-strong px-3 text-sm font-semibold text-paper transition-colors hover:border-frame md:inline-flex"
          >
            <BookmarkIcon className="size-4" />
            Library
          </Link>
          <Link href="/manga/search" className="grid size-10 place-items-center text-dim hover:text-paper md:hidden" aria-label="Search manga">
            <SearchIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MangaFooter() {
  return (
    <footer className="tone mt-24 border-t-2 border-frame/40 bg-ink-deep">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-10">
        <div className="max-w-xl">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-dim">
            Your private manga shelf. Chapters come from WeebCentral, Bato and Atsumaru, credited to the groups
            that scanned them; covers and details from{" "}
            <a href="https://anilist.co" className="text-paper underline-offset-2 hover:underline" rel="noreferrer" target="_blank">
              AniList
            </a>
            . Yuhengs stores no pages.
          </p>
        </div>
        <form action={lock}>
          <button
            type="submit"
            className="inline-flex h-11 items-center border-2 border-rule-strong px-4 text-sm font-semibold text-dim transition-colors hover:border-frame hover:text-paper"
          >
            Lock manga on this device
          </button>
        </form>
      </div>
    </footer>
  );
}
