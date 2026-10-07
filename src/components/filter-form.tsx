"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition, type FormEvent } from "react";
import type { SearchFilters } from "@/lib/anilist";
import { FORMATS, GENRES, SEASONS, SORTS, STATUSES } from "@/lib/filters";
import { SearchIcon } from "./icons";

const selectClass =
  "h-10 w-full rounded-[3px] border border-rule bg-panel px-3 text-sm text-paper focus:border-paper/50 focus:ring-2 focus:ring-paper/15 focus:outline-none";

/**
 * A plain GET form (works without JS). Once hydrated, select changes apply
 * immediately and navigation runs in a transition so results stay visible.
 */
export function FilterForm({ filters, maxYear }: { filters: SearchFilters; maxYear: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const years = Array.from({ length: maxYear - 1969 }, (_, i) => String(maxYear - i));

  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  function navigate(form: HTMLFormElement, mode: "push" | "replace" = "push") {
    const data = new FormData(form);
    const qs = new URLSearchParams();
    for (const [key, value] of data) {
      if (typeof value === "string" && value.trim()) qs.set(key, value.trim());
    }
    const url = `/search${qs.size ? `?${qs}` : ""}`;
    startTransition(() => (mode === "push" ? router.push(url) : router.replace(url)));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(e.currentTarget);
  }

  return (
    <form
      action="/search"
      onSubmit={onSubmit}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName !== "SELECT") return;
        // Arrow keys on a closed <select> fire change per step; settle first and
        // replace history so each step isn't a back-button entry.
        const form = e.currentTarget;
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => navigate(form, "replace"), 350);
      }}
      role="search"
      data-pending={pending || undefined}
      className="group/filters"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="search-q" className="sr-only">
            Anime title
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={filters.search}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search by title, in English or romaji…"
            className="h-12 w-full rounded-[3px] border border-rule-strong bg-panel pr-4 pl-12 text-base text-paper placeholder:text-faint focus:border-paper/60 focus:ring-2 focus:ring-paper/15 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-[3px] transition-[background-color,transform] duration-150 active:scale-[0.97] h-12 shrink-0 px-6 font-semibold text-white bg-onair hover:bg-onair-hover"
        >
          Search
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Select label="Genre" name="genre" value={filters.genre} options={GENRES.map((g) => ({ value: g, label: g }))} />
        <Select label="Season" name="season" value={filters.season} options={SEASONS} />
        <Select label="Year" name="year" value={filters.year?.toString()} options={years.map((y) => ({ value: y, label: y }))} />
        <Select label="Format" name="format" value={filters.format} options={FORMATS} />
        <Select label="Status" name="status" value={filters.status} options={STATUSES} />
        <Select label="Sort" name="sort" value={filters.sort} options={SORTS} placeholder={filters.search ? "Best match" : "Most popular"} />
      </div>
      <p role="status" className="mt-3 h-5 text-sm text-dim">
        {pending ? "Updating results…" : ""}
      </p>
    </form>
  );
}

function Select({
  label,
  name,
  value,
  options,
  placeholder = "Any",
}: {
  label: string;
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-xs text-faint">
        {label}
      </label>
      {/* key resets the uncontrolled value when the URL changes from outside the form */}
      <select key={value ?? ""} id={`f-${name}`} name={name} defaultValue={value ?? ""} className={selectClass}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
