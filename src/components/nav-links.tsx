"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Browse" },
  { href: "/schedule", label: "Schedule" },
  { href: "/history", label: "History" },
];

/** Reads the URL, so it must sit inside <Suspense>; NavLinksStatic is its fallback. */
export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

export function NavLinksStatic() {
  return <NavList pathname={null} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    // A pill group: the current page sits in a raised pill, like a selected channel.
    <nav aria-label="Main" className="hidden items-center gap-0.5 rounded-full border border-rule bg-ink-deep p-1 md:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname !== null && pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-dim transition-colors hover:text-paper aria-[current=page]:bg-panel-raised aria-[current=page]:text-paper"
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
