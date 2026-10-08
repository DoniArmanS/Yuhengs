"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from "./icons";
import { RelativeTime } from "./relative-time";

export interface SpotlightSlide {
  id: number;
  title: string;
  episode: number;
  airingAt: number;
  art: string | null;
  cover: string | null;
  color: string | null;
  genres: string[];
  blurb: string;
}

const SLIDE_MS = 7000;

const noop = () => () => {};
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * The on-air lead: rotates through the biggest new episodes like a channel's
 * "now showing" loop. Pauses while hovered, focused, or in a background tab;
 * never auto-advances for reduced-motion users.
 */
export function Spotlight({ slides }: { slides: SpotlightSlide[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const hidden = useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    },
    () => document.visibilityState === "hidden",
    () => false,
  );
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const running = mounted && !reduced && !held && !hidden && slides.length > 1;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [running, index, slides.length]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  // Swipe between slides on touch screens; mostly-vertical drags are left to page scroll.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
    setHeld(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    setHeld(false);
    if (!start || slides.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };
  const slide = slides[index];

  return (
    <article
      aria-roledescription="carousel"
      aria-label="New episodes"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      className="group/feature relative isolate flex min-h-[380px] overflow-hidden rounded-[4px] border border-rule bg-ink-deep sm:min-h-[460px]"
      style={{ ["--ambient" as string]: slide.color ?? "#ff4438" }}
    >
      {/* Backdrops crossfade; only the active one is visible. */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden
          className={`absolute inset-0 -z-20 transition-opacity duration-700 ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          {s.art ? (
            <Image
              src={s.art}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 960px, 100vw"
              className={`object-cover ${i === index ? "settle" : ""}`}
            />
          ) : null}
        </div>
      ))}
      <div className="scanlines pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/5" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/45 to-transparent" aria-hidden />
      <div className="ambient-glow absolute inset-0 -z-10 opacity-45" aria-hidden />

      {/* Slide timers */}
      {slides.length > 1 ? (
        <div className="absolute inset-x-5 top-4 flex gap-1.5 sm:inset-x-8" aria-hidden>
          {slides.map((s, i) => (
            <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-paper/20">
              {i < index ? <span className="block h-full bg-paper" /> : null}
              {i === index ? (
                <span
                  key={`${index}-${running}`}
                  className={`block h-full bg-paper ${reduced ? "" : "progress-run"} ${running ? "" : "progress-paused"}`}
                  style={{ ["--slide-ms" as string]: `${SLIDE_MS}ms` }}
                />
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative flex w-full items-end gap-8 p-5 pt-12 sm:p-8 sm:pt-14">
        <div key={slide.id} className="rise min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold">
            <span className="rounded-[2px] bg-onair px-1.5 py-0.5 text-xs font-bold text-white">New episode</span>
            <span className="text-paper/85">
              Episode {slide.episode} aired <RelativeTime timestamp={slide.airingAt} />
            </span>
          </p>
          <h3 className="condensed mt-3 text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.92] font-extrabold text-balance drop-shadow-[0_2px_24px_rgb(0_0_0/0.5)]">
            {slide.title}
          </h3>
          {slide.genres.length ? (
            <p className="mt-3 flex flex-wrap gap-1.5">
              {slide.genres.slice(0, 3).map((g) => (
                <span key={g} className="rounded-[2px] border border-paper/25 bg-ink/70 px-2 py-0.5 text-xs font-semibold text-paper/85">
                  {g}
                </span>
              ))}
            </p>
          ) : null}
          {slide.blurb ? <p className="mt-4 line-clamp-2 max-w-xl text-sm leading-relaxed text-paper/75 sm:text-base">{slide.blurb}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${slide.id}/${slide.episode}`}
              className="inline-flex h-12 items-center gap-2.5 rounded-[3px] bg-onair px-6 font-bold text-white shadow-[0_8px_30px_-6px_rgb(255_68_56/0.7)] transition-[background-color,transform] duration-150 hover:bg-onair-hover active:scale-[0.97]"
            >
              <PlayIcon className="size-4" />
              Watch episode {slide.episode}
            </Link>
            <Link
              href={`/anime/${slide.id}`}
              className="inline-flex h-12 items-center rounded-[3px] border border-paper/30 bg-ink/70 px-5 font-semibold transition-[border-color,transform] duration-150 hover:border-paper/70 active:scale-[0.97]"
            >
              Details
            </Link>
            {slides.length > 1 ? (
              <span className="ml-auto flex gap-1.5 sm:ml-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Previous episode"
                  className="grid size-10 place-items-center rounded-full border border-paper/25 bg-ink/70 transition-colors hover:border-paper/70"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Next episode"
                  className="grid size-10 place-items-center rounded-full border border-paper/25 bg-ink/70 transition-colors hover:border-paper/70"
                >
                  <ChevronRightIcon className="size-4" />
                </button>
              </span>
            ) : null}
          </div>
        </div>

        {slide.cover ? (
          <div
            key={`cover-${slide.id}`}
            className="rise relative hidden aspect-[2/3] w-[180px] shrink-0 rotate-[2deg] overflow-hidden rounded-[4px] border border-paper/20 shadow-[0_30px_60px_-15px_var(--ambient)] xl:block"
            style={{ animationDelay: "90ms" }}
            aria-hidden
          >
            <Image src={slide.cover} alt="" fill sizes="180px" className="object-cover" />
          </div>
        ) : null}
      </div>
      <p className="sr-only" aria-live={running ? "off" : "polite"}>
        Slide {index + 1} of {slides.length}: {slide.title}
      </p>
    </article>
  );
}
