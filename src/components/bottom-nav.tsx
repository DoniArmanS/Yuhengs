"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HistoryIcon, HomeIcon, SearchIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/schedule", label: "Schedule", Icon: CalendarIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
];

/** Reads the URL, so it must sit inside <Suspense>; BottomNavStatic is its fallback. */
export function BottomNav() {
  return <Bar pathname={usePathname()} />;
}

export function BottomNavStatic() {
  return <Bar pathname={null} />;
}

/**
 * Phone navigation: a thumb-reach tab bar fixed to the bottom, clear of the
 * home indicator. Tablets and up use the header links instead.
 */
function Bar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-ink pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-paper" : "text-faint active:text-paper"
                }`}
              >
                {active ? (
                  <span className="absolute top-1.5 size-1.5 rounded-full bg-onair shadow-[0_0_8px_rgb(255_68_56/0.8)]" aria-hidden />
                ) : null}
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
