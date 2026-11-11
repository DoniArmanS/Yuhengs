import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./logo";
import { NavLinks, NavLinksStatic } from "./nav-links";
import { HeaderSearch } from "./header-search";
import { SearchIcon, ShuffleIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-ink pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="Yuhengs home">
          <Logo />
        </Link>

        <Suspense fallback={<NavLinksStatic />}>
          <NavLinks />
        </Suspense>

        <div className="ml-auto flex items-center gap-2">
          <HeaderSearch />
          {/* A plain link: /random is a redirecting route handler, so it needs a full request. */}
          <a
            href="/random"
            className="grid size-10 place-items-center rounded-full border border-rule text-paper transition-colors hover:border-rule-strong hover:bg-panel"
            aria-label="Random anime"
            title="Random anime"
          >
            <ShuffleIcon className="size-[18px]" />
          </a>
          <Link
            href="/search"
            className="grid size-10 place-items-center rounded-[3px] text-dim hover:text-paper md:hidden"
            aria-label="Search anime"
          >
            <SearchIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
