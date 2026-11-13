"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type TouchEvent } from "react";
import { markChapterRead, recordReading, startReading, useReadingEntry } from "@/lib/manga/reading";
import type { PageImage } from "@/lib/manga/types";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SlidersIcon } from "../icons";

type Mode = "page" | "strip";
type Dir = "rtl" | "ltr";
type Fit = "height" | "width";
type Tone = "normal" | "dim" | "night";

interface Settings {
  /** Chosen mode for titles whose default is the key (manga default to pages, webtoons to a strip). */
  modes: Partial<Record<Mode, Mode>>;
  dir: Dir;
  fit: Fit;
  tone: Tone;
  gap: boolean;
}

/*
 * Reader settings, kept in this browser. "Dim" is the default page tone: white
 * pages on a dark screen are hard on the eyes, especially at night.
 */
const SETTINGS_KEY = "yuhengs:reader:v1";
const DEFAULTS: Settings = { modes: {}, dir: "rtl", fit: "height", tone: "dim", gap: false };
const settingsListeners = new Set<() => void>();
let settingsCache: Settings | null = null;

function readSettings(): Settings {
  if (settingsCache) return settingsCache;
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
    settingsCache = stored && typeof stored === "object" ? { ...DEFAULTS, ...stored, modes: { ...stored.modes } } : DEFAULTS;
  } catch {
    settingsCache = DEFAULTS;
  }
  return settingsCache!;
}

function updateSettings(patch: Partial<Settings>) {
  settingsCache = { ...readSettings(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsCache));
  } catch {}
  settingsListeners.forEach((l) => l());
}

function subscribeSettings(listener: () => void) {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}

const TONE_FILTER: Record<Tone, string | undefined> = {
  normal: undefined,
  dim: "brightness(0.78) contrast(0.95)",
  night: "invert(0.88) hue-rotate(180deg)",
};

export interface ReaderProps {
  manga: { id: number; title: string; cover: string | null; color: string | null; defaultMode: Mode };
  chapter: { key: string; label: string };
  version: { param: string; label: string };
  versions: { param: string; label: string }[];
  /** Set when the preferred upload didn't load and another one is shown. */
  fallbackFrom: string | null;
  pages: PageImage[];
  olderHref: string | null;
  newerHref: string | null;
  newerKey: string | null;
  /** Every chapter, newest first, for the jump menu. */
  chapterKeys: string[];
}

export function MangaReader(props: ReaderProps) {
  const { manga, chapter, pages, version } = props;
  const router = useRouter();
  const settings = useSyncExternalStore(subscribeSettings, readSettings, () => DEFAULTS);
  const mode = settings.modes[manga.defaultMode] ?? manga.defaultMode;
  const total = pages.length;

  // Until the reader moves, the position is the one saved for this chapter (resuming).
  const saved = useReadingEntry(manga.id);
  const savedPage = saved && saved.chapter === chapter.key && saved.page < total ? saved.page : 0;
  const [picked, setPicked] = useState<number | null>(null);
  const index = picked ?? savedPage;
  const atEnd = index >= total;

  const [chrome, setChrome] = useState(true);
  const [retries, setRetries] = useState<Record<number, number>>({});
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const resumed = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const filter = TONE_FILTER[settings.tone];

  // Opening the chapter puts the series at the top of the library.
  useEffect(() => {
    if (total === 0) return;
    startReading({ id: manga.id, title: manga.title, cover: manga.cover, color: manga.color, chapter: chapter.key, page: 0, pages: total });
  }, [manga.id, manga.title, manga.cover, manga.color, chapter.key, total]);

  // Every move after that is saved; reaching the last page marks the chapter read.
  useEffect(() => {
    if (picked === null || total === 0) return;
    recordReading({ id: manga.id, title: manga.title, cover: manga.cover, color: manga.color, chapter: chapter.key, page: Math.min(picked, total - 1), pages: total });
    if (picked >= total - 1) markChapterRead(manga.id, chapter.key);
  }, [picked, manga.id, manga.title, manga.cover, manga.color, chapter.key, total]);

  function go(delta: number) {
    setPicked((current) => Math.max(0, Math.min(total, (current ?? savedPage) + delta)));
    if (mode === "page") window.scrollTo({ top: 0 });
  }

  function goTo(n: number) {
    setPicked(Math.max(0, Math.min(total, n)));
    if (mode === "page") window.scrollTo({ top: 0 });
    else pageRefs.current[n]?.scrollIntoView({ block: "start" });
  }

  // Keys: arrows follow the reading direction, space and page keys always go forward.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || dialogRef.current?.open) return;
      const target = e.target as HTMLElement;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      if (mode !== "page") return;
      const forward = settings.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const back = settings.dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        go(1);
      } else if (e.key === back || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Page mode: fetch the next few pages ahead of time.
  useEffect(() => {
    if (mode !== "page") return;
    for (const p of pages.slice(index + 1, index + 4)) {
      const img = new Image();
      img.src = p.url;
    }
  }, [mode, index, pages]);

  // Strip mode: jump to the saved page once, then follow the scroll.
  useEffect(() => {
    if (mode !== "strip" || resumed.current || savedPage === 0) return;
    resumed.current = true;
    pageRefs.current[savedPage]?.scrollIntoView({ block: "start" });
  }, [mode, savedPage]);

  useEffect(() => {
    if (mode !== "strip") return;
    let frame = 0;
    let lastY = window.scrollY;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 12) setChrome(y < lastY || y < 80);
        lastY = y;
        const middle = window.innerHeight / 2;
        let current = 0;
        pageRefs.current.forEach((el, i) => {
          if (el && el.getBoundingClientRect().top <= middle) current = i;
        });
        const end = document.documentElement.scrollHeight - window.innerHeight - y < 40;
        setPicked(end ? total : current);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [mode, total]);

  function onStageClick(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    const x = e.clientX / window.innerWidth;
    if (x > 0.35 && x < 0.65) return setChrome((v) => !v);
    const left = x <= 0.35;
    go(left === (settings.dir === "rtl") ? 1 : -1);
  }

  function onTouchStart(e: TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 70) return;
    // Right-to-left books turn forward with a swipe to the right.
    go((dx > 0) === (settings.dir === "rtl") ? 1 : -1);
  }

  function imageFor(i: number, className: string, eager: boolean) {
    const page = pages[i];
    if (broken[i]) {
      return (
        <div className="grid min-h-[60dvh] w-full place-items-center border-2 border-dashed border-frame bg-panel p-6 text-center">
          <div>
            <p className="font-bold">Page {i + 1} didn’t load.</p>
            <button
              type="button"
              onClick={() => {
                setBroken((b) => ({ ...b, [i]: false }));
                setRetries((r) => ({ ...r, [i]: (r[i] ?? 0) + 1 }));
              }}
              className="mt-3 inline-flex h-11 items-center border-2 border-frame bg-onair px-4 font-bold text-on-onair"
            >
              Try again
            </button>
            {props.versions.length > 1 ? <p className="mt-3 text-sm text-dim">Or pick another upload in the reader settings.</p> : null}
          </div>
        </div>
      );
    }
    const retry = retries[i];
    const src = retry ? `${page.url}${page.url.includes("?") ? "&" : "?"}retry=${retry}` : page.url;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Pages come straight from the source's image host, already optimised.
      <img
        key={src}
        src={src}
        alt={`Page ${i + 1} of ${total}`}
        width={page.width ?? undefined}
        height={page.height ?? undefined}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        onLoad={(e) => {
          e.currentTarget.dataset.loaded = "true";
        }}
        onError={() => setBroken((b) => ({ ...b, [i]: true }))}
        style={{ filter, aspectRatio: page.width && page.height ? `${page.width} / ${page.height}` : undefined }}
        className={className}
      />
    );
  }

  const endCard = (
    <div className="mx-auto grid w-full max-w-md place-items-center px-6 py-16 text-center">
      <p className="text-xs font-extrabold tracking-[0.18em] text-onair uppercase">End of chapter</p>
      <p className="condensed mt-2 text-3xl font-extrabold">{chapter.label}</p>
      {props.newerHref ? (
        <Link href={props.newerHref} className="ink-frame mt-6 inline-flex h-12 items-center gap-2 bg-onair px-6 font-bold text-on-onair hover:bg-onair-hover">
          Chapter {props.newerKey}
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <p className="mt-4 text-sm text-dim">You’re caught up. The next chapter isn’t out yet.</p>
      )}
      <Link href={`/manga/${manga.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-dim underline-offset-4 hover:text-paper hover:underline">
        Back to {manga.title}
      </Link>
    </div>
  );

  const seg = (active: boolean) =>
    `h-10 flex-1 border-2 px-3 text-sm font-bold transition-colors ${active ? "border-frame bg-frame text-ink" : "border-rule-strong text-dim hover:border-frame hover:text-paper"}`;

  return (
    <div className="relative min-h-dvh">
      {/* Top bar */}
      <header
        className={`fixed inset-x-0 top-0 z-30 border-b-2 border-frame/40 bg-ink/95 pt-[env(safe-area-inset-top)] backdrop-blur transition-transform duration-200 ${chrome ? "" : "-translate-y-full"}`}
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-3 sm:px-5">
          <Link href={`/manga/${manga.id}`} className="grid size-10 shrink-0 place-items-center border-2 border-frame text-paper hover:bg-panel" aria-label={`Back to ${manga.title}`}>
            <ChevronLeftIcon />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{manga.title}</p>
            <p className="truncate text-xs text-dim">
              {chapter.label} · {version.label}
            </p>
          </div>
          <button type="button" onClick={() => dialogRef.current?.showModal()} className="grid size-10 shrink-0 place-items-center border-2 border-frame text-paper hover:bg-panel" aria-label="Reader settings">
            <SlidersIcon />
          </button>
        </div>
        {props.fallbackFrom ? (
          <p className="border-t border-rule bg-panel px-4 py-1.5 text-center text-xs text-dim">
            {props.fallbackFrom} didn’t load, so this is another group’s upload.
          </p>
        ) : null}
      </header>

      {/* Pages */}
      {mode === "page" ? (
        <div
          className={`flex min-h-dvh w-full cursor-pointer justify-center select-none ${settings.fit === "height" ? "items-center" : "items-start pt-14"}`}
          onClick={onStageClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {atEnd
            ? endCard
            : imageFor(
                index,
                settings.fit === "height" ? "block h-auto max-h-dvh w-auto max-w-full bg-panel object-contain" : "block h-auto w-full max-w-[1100px] bg-panel",
                true,
              )}
        </div>
      ) : (
        <div className={`mx-auto flex max-w-[820px] flex-col pt-14 ${settings.gap ? "gap-3" : ""}`} onClick={() => setChrome((v) => !v)}>
          {pages.map((_, i) => (
            <div key={i} ref={(el) => { pageRefs.current[i] = el; }}>
              {/* Sources rarely give page sizes, and a page with no height counts as on screen, so every
                  page would load at once. Each one holds most of a screen until it has loaded. */}
              {imageFor(i, "block h-auto min-h-[80vh] w-full bg-panel data-[loaded]:min-h-0", i < 2)}
            </div>
          ))}
          {endCard}
        </div>
      )}

      {/* Bottom bar */}
      <footer
        className={`fixed inset-x-0 bottom-0 z-30 border-t-2 border-frame/40 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-200 ${chrome ? "" : "translate-y-full"}`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:px-5">
          {props.olderHref ? (
            <Link href={props.olderHref} className="grid size-10 shrink-0 place-items-center border-2 border-frame hover:bg-panel" aria-label="Previous chapter">
              <ChevronLeftIcon />
            </Link>
          ) : (
            <span className="size-10 shrink-0" />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-16 shrink-0 text-center text-sm font-bold tabular-nums">
              {atEnd ? "End" : `${index + 1} / ${total}`}
            </span>
            <label className="sr-only" htmlFor="reader-page">
              Page
            </label>
            <input
              id="reader-page"
              type="range"
              min={0}
              max={total}
              value={Math.min(index, total)}
              dir={mode === "page" && settings.dir === "rtl" ? "rtl" : "ltr"}
              onChange={(e) => goTo(Number(e.target.value))}
              className="h-2 min-w-0 flex-1 cursor-pointer accent-[var(--color-onair)]"
            />
          </div>
          {props.newerHref ? (
            <Link href={props.newerHref} className="grid size-10 shrink-0 place-items-center border-2 border-frame hover:bg-panel" aria-label="Next chapter">
              <ChevronRightIcon />
            </Link>
          ) : (
            <span className="size-10 shrink-0" />
          )}
        </div>
      </footer>

      {/* Settings */}
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] border-2 border-frame bg-panel p-0 text-paper shadow-[6px_6px_0_var(--color-shadow)] backdrop:bg-black/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex items-center justify-between border-b-2 border-rule px-5 py-3">
          <h2 className="condensed text-2xl font-extrabold">Reader</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} className="grid size-10 place-items-center text-dim hover:text-paper" aria-label="Close settings">
            <CloseIcon />
          </button>
        </div>
        <div className="space-y-5 px-5 py-5">
          <fieldset>
            <legend className="mb-2 text-xs font-extrabold tracking-wider text-dim uppercase">Layout</legend>
            <div className="flex gap-2">
              <button type="button" aria-pressed={mode === "page"} className={seg(mode === "page")} onClick={() => updateSettings({ modes: { ...settings.modes, [manga.defaultMode]: "page" } })}>
                Single page
              </button>
              <button type="button" aria-pressed={mode === "strip"} className={seg(mode === "strip")} onClick={() => updateSettings({ modes: { ...settings.modes, [manga.defaultMode]: "strip" } })}>
                Long strip
              </button>
            </div>
          </fieldset>
          {mode === "page" ? (
            <>
              <fieldset>
                <legend className="mb-2 text-xs font-extrabold tracking-wider text-dim uppercase">Direction</legend>
                <div className="flex gap-2">
                  <button type="button" aria-pressed={settings.dir === "rtl"} className={seg(settings.dir === "rtl")} onClick={() => updateSettings({ dir: "rtl" })}>
                    Right to left
                  </button>
                  <button type="button" aria-pressed={settings.dir === "ltr"} className={seg(settings.dir === "ltr")} onClick={() => updateSettings({ dir: "ltr" })}>
                    Left to right
                  </button>
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-xs font-extrabold tracking-wider text-dim uppercase">Fit</legend>
                <div className="flex gap-2">
                  <button type="button" aria-pressed={settings.fit === "height"} className={seg(settings.fit === "height")} onClick={() => updateSettings({ fit: "height" })}>
                    Whole page
                  </button>
                  <button type="button" aria-pressed={settings.fit === "width"} className={seg(settings.fit === "width")} onClick={() => updateSettings({ fit: "width" })}>
                    Fit width
                  </button>
                </div>
              </fieldset>
            </>
          ) : (
            <fieldset>
              <legend className="mb-2 text-xs font-extrabold tracking-wider text-dim uppercase">Gaps between pages</legend>
              <div className="flex gap-2">
                <button type="button" aria-pressed={!settings.gap} className={seg(!settings.gap)} onClick={() => updateSettings({ gap: false })}>
                  None
                </button>
                <button type="button" aria-pressed={settings.gap} className={seg(settings.gap)} onClick={() => updateSettings({ gap: true })}>
                  Small
                </button>
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="mb-2 text-xs font-extrabold tracking-wider text-dim uppercase">Page tone · easier on the eyes</legend>
            <div className="flex gap-2">
              {(["normal", "dim", "night"] as const).map((t) => (
                <button key={t} type="button" aria-pressed={settings.tone === t} className={seg(settings.tone === t)} onClick={() => updateSettings({ tone: t })}>
                  {t === "normal" ? "Normal" : t === "dim" ? "Dim" : "Night"}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="reader-chapter" className="mb-2 block text-xs font-extrabold tracking-wider text-dim uppercase">
              Chapter
            </label>
            <select
              id="reader-chapter"
              value={chapter.key}
              onChange={(e) => router.push(`/read/${manga.id}/${e.target.value}`)}
              className="h-11 w-full border-2 border-rule-strong bg-ink px-3 text-paper focus:border-frame focus:outline-none"
            >
              {props.chapterKeys.map((k) => (
                <option key={k} value={k}>
                  Chapter {k}
                </option>
              ))}
            </select>
          </div>
          {props.versions.length > 1 ? (
            <fieldset>
              <legend className="mb-2 text-xs font-extrabold tracking-wider text-dim uppercase">Upload</legend>
              <ul className="space-y-1.5">
                {props.versions.map((v) => (
                  <li key={v.param}>
                    <Link
                      href={`/read/${manga.id}/${chapter.key}?v=${encodeURIComponent(v.param)}`}
                      replace
                      aria-current={v.param === version.param ? "true" : undefined}
                      className="flex h-11 items-center justify-between border-2 border-rule-strong px-3 text-sm font-semibold hover:border-frame aria-[current=true]:border-frame aria-[current=true]:bg-frame aria-[current=true]:text-ink"
                    >
                      {v.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
