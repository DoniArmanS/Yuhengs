import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./logo";
import { NavLinks, NavLinksStatic } from "./nav-links";
import { HeaderSearch } from "./header-search";
import { SearchIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="Yuhengs home">
          <Logo />
        </Link>

        <Suspense fallback={<NavLinksStatic />}>
          <NavLinks />
        </Suspense>

        <div className="ml-auto flex items-center gap-2">
          <HeaderSearch />
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
