"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { SANDBOX_POLICY, SERVERS, type Audio } from "@/lib/providers";
import { recordWatch } from "@/lib/history";
import { REMOTES } from "@/lib/remote";
import type { SkipTimes } from "@/lib/skip-times";
import { RemoteBar } from "./remote-bar";

interface Prefs {
  server: string;
  audio: Audio;
  autoSkip: boolean;
}

// v2 stores only what the viewer explicitly chose, so a changed default server
// reaches everyone who never picked one. v1 saved the whole object (including
// the then-default server) whenever any setting changed; we carry over its
// audio and auto-skip choices but not that implicit server.
const PREFS_KEY = "yuhengs:player:v2";
const LEGACY_KEY = "yuhengs:player:v1";
const DEFAULT_PREFS: Prefs = { server: SERVERS[0].id, audio: "sub", autoSkip: false };
const listeners = new Set<() => void>();
let stored: Partial<Prefs> | null = null;
let prefsCache: Prefs | null = null;

function readStored(): Partial<Prefs> {
  if (stored) return stored;
  try {
    const v2 = localStorage.getItem(PREFS_KEY);
    if (v2) stored = JSON.parse(v2);
    else {
      const v1 = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "{}") as Partial<Prefs>;
      stored = {
        ...(v1.audio ? { audio: v1.audio } : {}),
        ...(typeof v1.autoSkip === "boolean" ? { autoSkip: v1.autoSkip } : {}),
      };
    }
  } catch {
    stored = {};
  }
  return stored!;
}

function readPrefs(): Prefs {
  return (prefsCache ??= { ...DEFAULT_PREFS, ...readStored() });
}

function writePrefs(next: Partial<Prefs>) {
  stored = { ...readStored(), ...next };
  prefsCache = { ...DEFAULT_PREFS, ...stored };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(stored));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const noopSubscribe = () => () => {};

export function Player({
  anilistId,
  episode,
  totalEpisodes,
  title,
  cover,
  color,
  missingOn = [],
  skip = { op: null, ed: null },
  nextHref = null,
}: {
  anilistId: number;
  episode: number;
  totalEpisodes: number | null;
  title: string;
  cover: string | null;
  color: string | null;
  /** Servers confirmed not to have this episode (sub); they're hidden from the picker. */
  missingOn?: string[];
  /** Opening/ending timestamps, for Skip intro. */
  skip?: SkipTimes;
  /** Where "Next episode" goes during the ending credits. */
  nextHref?: string | null;
}) {
  const prefs = useSyncExternalStore(subscribe, readPrefs, () => DEFAULT_PREFS);
  // On plain-http LAN addresses, servers that need Web Crypto can't play.
  const secure = useSyncExternalStore(noopSubscribe, () => window.isSecureContext, () => true);
  const servers = SERVERS.filter(
    (s) =>
      s.audio.includes(prefs.audio) &&
      (secure || !s.secureOnly) &&
      !(prefs.audio === "sub" && missingOn.includes(s.id)),
  );
  const active = servers.find((s) => s.id === prefs.server) ?? servers[0];
  const src = active?.url(anilistId, episode, prefs.audio);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loading = Boolean(src) && loadedSrc !== src;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const remote = active ? REMOTES[active.id] : undefined;

  // Next.js keeps up to 3 visited pages mounted but hidden (React <Activity>) so
  // Back is instant. A hidden iframe keeps playing, which left the previous
  // episode running in the background. So the iframe only exists while this
  // page is visible: the layout-effect cleanup runs as the page is hidden and
  // removes it; the effect runs again when the page is shown and brings back a
  // fresh one. (Navigating the existing iframe instead tangles with the
  // browser's session history and breaks the Back button.)
  const [onScreen, setOnScreen] = useState(true);
  useLayoutEffect(() => {
    // Re-showing a hidden page must put the player back before paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnScreen(true);
    return () => {
      setOnScreen(false);
      setLoadedSrc(null); // show "Tuning in…" again while it reloads
    };
  }, []);

  useEffect(() => {
    recordWatch({ id: anilistId, title, cover, color, episode, totalEpisodes });
  }, [anilistId, title, cover, color, episode, totalEpisodes]);

  // `contents`: the video and the controls become items of the watch page's
  // grid, which places them per screen size. On phones the video is pinned
  // under the header (sticky) and runs edge to edge.
  return (
    <div className="contents">
      <div className="relative z-30 aspect-video overflow-hidden rounded-[3px] border border-rule-strong bg-ink-deep shadow-2xl shadow-black/40 [grid-area:video] max-md:sticky max-md:top-[calc(4rem+env(safe-area-inset-top))] max-md:-mx-4 max-md:rounded-none max-md:border-x-0 max-md:border-t-0">
        {src && onScreen ? (
          <iframe
            ref={frameRef}
            key={src}
            src={src}
            onLoad={() => setLoadedSrc(src)}
            title={`${title}, episode ${episode}`}
            className={`absolute inset-0 size-full transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; screen-wake-lock"
            referrerPolicy="origin"
            sandbox={active.sandbox ? SANDBOX_POLICY : undefined}
          />
        ) : null}
        {loading ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-dim">
              <span className="tuning size-2.5 rounded-full bg-onair" aria-hidden />
              Tuning in to {active?.name}…
            </span>
          </div>
        ) : null}
        {!src ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-dim">
            No server has this episode in {prefs.audio}. Switch the audio to try again.
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3 [grid-area:controls]">
      {remote && src && onScreen ? (
        <RemoteBar
          key={src}
          frameRef={frameRef}
          remote={remote}
          skip={skip}
          nextHref={nextHref}
          autoSkip={prefs.autoSkip}
          onAutoSkipChange={(on) => writePrefs({ autoSkip: on })}
        />
      ) : null}
      <div className="flex items-center gap-3 rounded-[3px] border border-rule bg-panel p-2.5 sm:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-sm text-dim max-sm:sr-only" id="server-label">
            Server
          </span>
          {/* One swipeable row on phones instead of wrapping onto several lines */}
          <div role="group" aria-labelledby="server-label" className="scrollbar-none -my-1 flex min-w-0 gap-2 overflow-x-auto py-1">
            {servers.map((s, i) => {
              const selected = s.id === active?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => writePrefs({ server: s.id })}
                  className={`h-10 shrink-0 rounded-[2px] border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                    selected
                      ? "border-paper bg-paper text-ink"
                      : "border-rule bg-ink/60 text-paper hover:border-paper/50"
                  }`}
                >
                  <span className={`condensed mr-2 font-bold tabular-nums ${selected ? "text-ink/55" : "text-faint"}`}>
                    {i + 1}
                  </span>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div role="group" aria-label="Audio" className="flex shrink-0 rounded-[2px] border border-rule bg-ink/60 p-0.5">
          {(["sub", "dub"] as const).map((audio) => {
            const selected = prefs.audio === audio;
            return (
              <button
                key={audio}
                type="button"
                aria-pressed={selected}
                onClick={() => writePrefs({ audio })}
                className={`h-9 rounded-[3px] px-3.5 text-sm font-semibold transition-colors ${
                  selected ? "bg-paper text-ink" : "text-dim hover:text-paper"
                }`}
              >
                {audio === "sub" ? "Sub" : "Dub"}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-dim sm:text-sm">
        {active?.id === "aniembed"
          ? "AniEmbed’s own buttons ignore your first two taps: an ad layer we block catches them. Use the controls above, or tap again."
          : active?.sandbox
            ? `${active.name} runs with pop-ups blocked. If the video won’t load, switch servers; your choice is remembered.`
            : `${active?.name ?? "This server"} isn’t sandboxed: if a pop-up opens, close it and come back. If the video won’t load, switch servers.`}
      </p>
      </div>
    </div>
  );
}
