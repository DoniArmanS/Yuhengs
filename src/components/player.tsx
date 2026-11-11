"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { SANDBOX_POLICY, SERVERS, type Audio, type StreamServer } from "@/lib/providers";
import { getProgress, recordWatch, saveProgress } from "@/lib/history";
import { BRIDGES, asMessage, type Playback } from "@/lib/embed-bridge";
import { CloseIcon, PlayIcon } from "./icons";

interface Prefs {
  server: string;
  audio: Audio;
  /** Count down into the next episode when one ends (servers that report progress). */
  autoNext: boolean;
  /** Let the player skip openings by itself (MegaPlay). */
  autoSkip: boolean;
}

// v2 stores only what the viewer explicitly chose, so a changed default server
// reaches everyone who never picked one. v1 saved the whole object (including
// the then-default server) whenever any setting changed; we carry over its
// audio choice but not that implicit server.
const PREFS_KEY = "yuhengs:player:v2";
const LEGACY_KEY = "yuhengs:player:v1";
const DEFAULT_PREFS: Prefs = { server: SERVERS[0].id, audio: "sub", autoNext: true, autoSkip: false };
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
      stored = v1.audio ? { audio: v1.audio } : {};
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
  /** The next playable episode, for the end-of-episode countdown. */
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
  const fallback = servers.length > 1 ? servers[(servers.indexOf(active) + 1) % servers.length] : undefined;
  const src = active?.url(anilistId, episode, prefs.audio);

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
    return () => setOnScreen(false);
  }, []);

  useEffect(() => {
    recordWatch({ id: anilistId, title, cover, color, episode, totalEpisodes });
  }, [anilistId, title, cover, color, episode, totalEpisodes]);

  const bridge = active ? BRIDGES[active.id] : undefined;

  // `contents`: the video and the controls become items of the watch page's
  // grid, which places them per screen size. On phones the video is pinned
  // under the header (sticky) and runs edge to edge.
  return (
    <div className="contents">
      <div className="relative z-30 aspect-video overflow-hidden rounded-[3px] border border-rule-strong bg-ink-deep shadow-2xl shadow-black/40 [grid-area:video] max-md:sticky max-md:top-[calc(4rem+env(safe-area-inset-top))] max-md:-mx-4 max-md:rounded-none max-md:border-x-0 max-md:border-t-0">
        {src && active && onScreen ? (
          // Keyed by src: a new server or episode starts with fresh state.
          <Screen
            key={src}
            src={src}
            server={active}
            fallback={fallback}
            anilistId={anilistId}
            episode={episode}
            title={title}
            autoNext={prefs.autoNext}
            autoSkip={prefs.autoSkip}
            nextHref={nextHref}
          />
        ) : null}
        {!src ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-dim">
            No server has this episode in {prefs.audio}. Switch the audio to try again.
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3 [grid-area:controls]">
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

        <div className="flex flex-wrap items-center gap-2">
          {bridge ? (
            <Toggle
              label="Autoplay next"
              on={prefs.autoNext}
              onChange={(autoNext) => writePrefs({ autoNext })}
            />
          ) : null}
          {bridge?.autoSkip ? (
            <Toggle label="Skip intro" on={prefs.autoSkip} onChange={(autoSkip) => writePrefs({ autoSkip })} />
          ) : null}
        </div>

        <p className="text-xs text-dim sm:text-sm">
          {active?.id === "aniembed"
            ? "AniEmbed’s buttons ignore your first two taps: an ad layer we block catches them. Tap again, or switch to MegaPlay."
            : active?.sandbox
              ? `${active.name} runs with pop-ups blocked. If the video won’t load, switch servers; your choice is remembered.`
              : `${active?.name ?? "This server"} isn’t sandboxed: if a pop-up opens, close it and come back. If the video won’t load, switch servers.`}
        </p>
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex h-9 items-center gap-2.5 rounded-full border border-rule bg-panel pr-3.5 pl-2 text-sm font-semibold text-paper transition-colors hover:border-rule-strong"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-onair" : "bg-rule-strong"}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-paper transition-[left] duration-150 ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}

const POLL_MS = 5000;
/** Long enough for a slow server, short enough that nobody gives up first. */
const SLOW_MS = 15_000;
/** Seconds left in the episode when the next-episode countdown starts. */
const NEXT_AT_REMAINING = 25;
const COUNTDOWN_SECONDS = 10;
/** Don't resume into the first half minute or the end credits. */
const RESUME_MIN = 30;
const RESUME_TAIL = 90;

function clock(seconds: number) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/**
 * One server's player for one episode, plus the extras its postMessage API
 * allows: resume where you left off, a countdown into the next episode, and
 * the player's own skip-intro. Messages are trusted only from the server's
 * origin and only from this iframe.
 */
function Screen({
  src,
  server,
  fallback,
  anilistId,
  episode,
  title,
  autoNext,
  autoSkip,
  nextHref,
}: {
  src: string;
  server: StreamServer;
  fallback?: StreamServer;
  anilistId: number;
  episode: number;
  title: string;
  autoNext: boolean;
  autoSkip: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const bridge = BRIDGES[server.id];
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [resumedAt, setResumedAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // The message handler reads the latest settings without re-subscribing.
  const settings = useRef({ autoNext, autoSkip, nextHref });
  const flags = useRef({ ready: false, cancelled: false });
  useEffect(() => {
    settings.current = { autoNext, autoSkip, nextHref };
  }, [autoNext, autoSkip, nextHref]);

  useEffect(() => {
    if (!bridge) return;
    const b = bridge;
    function onMessage(e: MessageEvent) {
      const player = iframeRef.current?.contentWindow;
      if (!player || e.origin !== b.origin || e.source !== player) return;
      const message = asMessage(e.data);
      const update = message ? b.read(message) : null;
      if (!update) return;

      if (update.ready && !flags.current.ready) {
        flags.current.ready = true;
        setReady(true);
        if (settings.current.autoSkip) b.autoSkip?.(player, true);
        const saved = getProgress(anilistId, episode);
        if (b.seek && saved && saved.time > RESUME_MIN && saved.time < saved.duration - RESUME_TAIL) {
          b.seek(player, saved.time);
          setResumedAt(saved.time);
        }
      }

      if (update.playback) {
        const { time, duration } = update.playback;
        setPlayback(update.playback);
        saveProgress(anilistId, episode, time, duration);
        const { autoNext: next, nextHref: href } = settings.current;
        if (next && href && !flags.current.cancelled && duration - time <= NEXT_AT_REMAINING) {
          setCountdown((c) => c ?? COUNTDOWN_SECONDS);
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [bridge, anilistId, episode]);

  // MegaPlay only reports its position when asked; ask while the tab is visible.
  useEffect(() => {
    if (!ready || !bridge?.poll) return;
    const b = bridge;
    const ask = () => {
      const player = iframeRef.current?.contentWindow;
      if (player && document.visibilityState === "visible") b.poll?.(player);
    };
    ask();
    const timer = setInterval(ask, POLL_MS);
    return () => clearInterval(timer);
  }, [ready, bridge]);

  // Flipping "Skip intro" mid-episode takes effect at once.
  useEffect(() => {
    const player = iframeRef.current?.contentWindow;
    if (ready && player) bridge?.autoSkip?.(player, autoSkip);
  }, [ready, bridge, autoSkip]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextHref) router.push(nextHref);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, nextHref, router]);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resumedAt === null) return;
    const timer = setTimeout(() => setResumedAt(null), 8000);
    return () => clearTimeout(timer);
  }, [resumedAt]);

  const startOver = () => {
    const player = iframeRef.current?.contentWindow;
    if (player) bridge?.seek?.(player, 0);
    setResumedAt(null);
  };
  const cancelNext = () => {
    flags.current.cancelled = true;
    setCountdown(null);
  };

  // A player with an API is up when it says so; others when the frame loads.
  const playing = bridge ? ready || playback !== null : loaded;
  const tryInstead = slow && !dismissed && !playing ? fallback : undefined;

  return (
    <>
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={() => setLoaded(true)}
        title={`${title}, episode ${episode}`}
        className={`absolute inset-0 size-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; screen-wake-lock"
        referrerPolicy="origin"
        sandbox={server.sandbox ? SANDBOX_POLICY : undefined}
      />

      {!loaded ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
          <span className="flex items-center gap-2.5 text-sm font-semibold text-dim">
            <span className="tuning size-2.5 rounded-full bg-onair" />
            Tuning in to {server.name}…
          </span>
        </div>
      ) : null}

      {resumedAt !== null ? (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-3 rounded-full border border-rule-strong bg-ink-deep/90 py-1.5 pr-1.5 pl-4 text-sm shadow-lg" role="status">
          <span className="tabular-nums">Resumed at {clock(resumedAt)}</span>
          <button
            type="button"
            onClick={startOver}
            className="h-8 rounded-full bg-panel-raised px-3 font-semibold text-paper transition-colors hover:bg-rule-strong"
          >
            Start over
          </button>
        </div>
      ) : null}

      {tryInstead ? (
        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-center gap-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
          <p className="flex items-center gap-3 rounded-full border border-rule-strong bg-ink-deep/95 py-1.5 pr-1.5 pl-4 text-sm shadow-lg" role="status">
            Not playing?
            <button
              type="button"
              onClick={() => writePrefs({ server: tryInstead.id })}
              className="h-8 rounded-full bg-onair px-3.5 font-semibold text-on-onair transition-colors hover:bg-onair-hover"
            >
              Try {tryInstead.name}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="grid size-8 place-items-center rounded-full text-dim transition-colors hover:text-paper"
            >
              <CloseIcon className="size-4" />
            </button>
          </p>
        </div>
      ) : null}

      {countdown !== null && countdown > 0 && nextHref ? (
        <div
          className="absolute right-3 bottom-14 z-10 flex w-[min(19rem,calc(100%-1.5rem))] flex-col gap-3 rounded-[6px] border border-rule-strong bg-ink-deep/95 p-4 shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-dim">
            Next: <span className="font-semibold text-paper">Episode {episode + 1}</span> in{" "}
            <span className="font-semibold text-guide tabular-nums">{countdown}s</span>
          </p>
          <div className="flex gap-2">
            <Link
              href={nextHref}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-onair px-3 text-sm font-bold text-on-onair transition-colors hover:bg-onair-hover"
            >
              <PlayIcon className="size-3.5" />
              Play now
            </Link>
            <button
              type="button"
              onClick={cancelNext}
              className="h-9 rounded-full border border-rule-strong px-4 text-sm font-semibold text-paper transition-colors hover:border-dim"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
