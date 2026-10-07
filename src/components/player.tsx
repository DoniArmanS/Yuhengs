"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SANDBOX_POLICY, SERVERS, type Audio } from "@/lib/providers";
import { recordWatch } from "@/lib/history";

interface Prefs {
  server: string;
  audio: Audio;
}

const PREFS_KEY = "yuhengs:player:v1";
const DEFAULT_PREFS: Prefs = { server: SERVERS[0].id, audio: "sub" };
const listeners = new Set<() => void>();
let prefsCache: Prefs | null = null;

function readPrefs(): Prefs {
  if (prefsCache) return prefsCache;
  try {
    prefsCache = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") };
  } catch {
    prefsCache = DEFAULT_PREFS;
  }
  return prefsCache!;
}

function writePrefs(next: Partial<Prefs>) {
  prefsCache = { ...readPrefs(), ...next };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefsCache));
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
}: {
  anilistId: number;
  episode: number;
  totalEpisodes: number | null;
  title: string;
  cover: string | null;
  color: string | null;
}) {
  const prefs = useSyncExternalStore(subscribe, readPrefs, () => DEFAULT_PREFS);
  // On plain-http LAN addresses, servers that need Web Crypto can't play.
  const secure = useSyncExternalStore(noopSubscribe, () => window.isSecureContext, () => true);
  const servers = SERVERS.filter((s) => s.audio.includes(prefs.audio) && (secure || !s.secureOnly));
  const active = servers.find((s) => s.id === prefs.server) ?? servers[0];
  const src = active?.url(anilistId, episode, prefs.audio);

  useEffect(() => {
    recordWatch({ id: anilistId, title, cover, color, episode, totalEpisodes });
  }, [anilistId, title, cover, color, episode, totalEpisodes]);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-[3px] border border-rule-strong bg-ink-deep shadow-2xl shadow-black/40">
        {src ? (
          <iframe
            key={src}
            src={src}
            title={`${title}, episode ${episode}`}
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            sandbox={active.sandbox ? SANDBOX_POLICY : undefined}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-dim">
            No server has this episode in {prefs.audio}. Switch the audio to try again.
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col items-start gap-4 rounded-[3px] border border-rule bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-dim" id="server-label">
            Server
          </span>
          <div role="group" aria-labelledby="server-label" className="flex flex-wrap gap-2">
            {servers.map((s, i) => {
              const selected = s.id === active?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => writePrefs({ server: s.id })}
                  className={`h-9 rounded-[2px] border px-3.5 text-sm font-semibold transition-colors ${
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
                className={`h-8 rounded-[3px] px-3.5 text-sm font-semibold transition-colors ${
                  selected ? "bg-paper text-ink" : "text-dim hover:text-paper"
                }`}
              >
                {audio === "sub" ? "Sub" : "Dub"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-sm text-dim">
        <p>
          {active?.sandbox
            ? `${active.name} runs with pop-ups blocked. If the video won’t load, switch servers; your choice is remembered.`
            : `${active?.name ?? "This server"} may open pop-up ads; close them and return here. If the video won’t load, switch servers.`}
        </p>
      </div>
    </div>
  );
}
