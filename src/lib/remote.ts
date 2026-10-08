/**
 * Remote control for embedded players over postMessage. The players live in
 * cross-origin iframes, so we can't touch their buttons; instead we send the
 * commands their own APIs accept and read the playback events they emit.
 *
 * Verified against the live players on 2026-10-08:
 *  - AniEmbed: {source:"aniembed", version:1, type:"command", name, data}
 *    with play / pause / seek {time}; emits events carrying
 *    currentTime, duration and paused.
 *  - MegaPlay (JW Player bridge): {cmd:"PLAY_TOGGLE"}, {cmd:"SEEK", value,
 *    skip?}; emits {event:"time", time, duration} while playing.
 * Servers without an API (VidNest) get no remote.
 */

export interface PlaybackUpdate {
  time?: number;
  duration?: number;
  playing?: boolean;
}

export interface Remote {
  origin: string;
  play(win: Window): void;
  pause(win: Window): void;
  seekTo(win: Window, seconds: number): void;
  /** Relative seek; `current` is our best estimate for players that need an absolute time. */
  seekBy(win: Window, delta: number, current: number): void;
  /** Turn an incoming message into a playback update, or null if it isn't one. */
  parse(data: unknown): PlaybackUpdate | null;
}

function asObject(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

const ANIEMBED_ORIGIN = "https://aniembed.se";
function aniembed(win: Window, name: string, data?: object) {
  win.postMessage({ source: "aniembed", version: 1, type: "command", name, ...(data ? { data } : {}) }, ANIEMBED_ORIGIN);
}

const MEGAPLAY_ORIGIN = "https://megaplay.buzz";

export const REMOTES: Record<string, Remote> = {
  aniembed: {
    origin: ANIEMBED_ORIGIN,
    play: (w) => aniembed(w, "play"),
    pause: (w) => aniembed(w, "pause"),
    seekTo: (w, t) => aniembed(w, "seek", { time: Math.max(0, t) }),
    seekBy: (w, d, current) => aniembed(w, "seek", { time: Math.max(0, current + d) }),
    parse(raw) {
      const msg = asObject(raw);
      if (!msg || msg.source !== "aniembed" || msg.type !== "event") return null;
      const data = asObject(msg.data) ?? {};
      const update: PlaybackUpdate = { time: num(data.currentTime), duration: num(data.duration) };
      if (msg.name === "play") update.playing = true;
      else if (msg.name === "pause" || msg.name === "ended") update.playing = false;
      else if (typeof data.paused === "boolean") update.playing = !data.paused;
      return update;
    },
  },
  megaplay: {
    origin: MEGAPLAY_ORIGIN,
    // MegaPlay only exposes a toggle, so play/pause each send it; callers only
    // invoke the one that changes the current state.
    play: (w) => w.postMessage({ cmd: "PLAY_TOGGLE" }, MEGAPLAY_ORIGIN),
    pause: (w) => w.postMessage({ cmd: "PLAY_TOGGLE" }, MEGAPLAY_ORIGIN),
    seekTo: (w, t) => w.postMessage({ cmd: "SEEK", value: Math.max(0, t) }, MEGAPLAY_ORIGIN),
    seekBy: (w, d) => w.postMessage({ cmd: "SEEK", value: d, skip: true }, MEGAPLAY_ORIGIN),
    parse(raw) {
      const msg = asObject(raw);
      if (!msg) return null;
      if ((msg.event === "time" || msg.event === "CURRENT_TIME") && num(msg.time) !== undefined) {
        return { time: num(msg.time), duration: num(msg.duration) };
      }
      return null;
    },
  },
};
