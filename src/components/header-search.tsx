"use client";

import { useEffect, useRef } from "react";
import { SearchIcon } from "./icons";

/** Plain GET form to /search, so it works before hydration. "/" focuses it. */
export function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/search" role="search" className="relative hidden md:block">
      <label htmlFor="header-search" className="sr-only">
        Search anime
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
      <input
        ref={inputRef}
        id="header-search"
        name="q"
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search anime…"
        className="h-10 w-64 rounded-[3px] border border-rule bg-panel pr-9 pl-9 text-sm text-paper placeholder:text-faint focus:border-paper/50 focus:ring-2 focus:ring-paper/15 focus:outline-none lg:w-80"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-[2px] border border-rule px-1.5 text-2xs text-faint">
        /
      </kbd>
    </form>
  );
}
