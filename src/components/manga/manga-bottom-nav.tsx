"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, BookmarkIcon, SearchIcon, TvIcon } from "../icons";

const TABS = [
  { href: "/manga", label: "Manga", Icon: BookIcon, exact: true },
  { href: "/manga/search", label: "Search", Icon: SearchIcon, exact: false },
  { href: "/manga/library", label: "Library", Icon: BookmarkIcon, exact: false },
  { href: "/home", label: "Anime", Icon: TvIcon, exact: false },
];

/** Reads the URL, so it must sit inside <Suspense>; MangaBottomNavStatic is its fallback. */
export function MangaBottomNav() {
  return <Bar pathname={usePathname()} />;
}

export function MangaBottomNavStatic() {
  return <Bar pathname={null} />;
}

function Bar({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Manga" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-frame/40 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = pathname !== null && (exact ? pathname === href || /^\/manga\/\d/.test(pathname) : pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-paper" : "text-faint active:text-paper"
                }`}
              >
                {active ? <span className="absolute top-0 h-0.5 w-8 bg-onair" aria-hidden /> : null}
                <Icon className="size-[22px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
