"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Browse" },
  { href: "/schedule", label: "Schedule" },
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
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="relative rounded-[3px] px-3 py-2 text-sm font-semibold text-dim transition-colors hover:text-paper aria-[current=page]:text-paper"
          >
            {label}
            {active ? <span className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-onair" aria-hidden /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
