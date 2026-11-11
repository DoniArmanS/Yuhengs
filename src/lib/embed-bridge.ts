/**
 * Talks to the embed players over postMessage. They are cross-origin iframes,
 * so this is the only way to know where playback is or to move it. Read from
 * each player's own JavaScript on 2026-11-11 (there are no public docs):
 *
 *  - MegaPlay (lib/handle-bridge.min.js): sends JSON strings,
 *    {event:"PLAYER_READY"} once, and {event:"CURRENT_TIME", time, duration}
 *    only in reply to {cmd:"GET_TIME"}. Accepts {cmd:"SEEK", value} and
 *    {cmd:"SKP_DATA", value:null, auto}, which turns its own skip-intro on.
 *    (Until October it pushed {event:"time"} by itself; formats change
 *    without notice.)
 *  - AniEmbed: sends {source:"aniembed", type:"event", data:{currentTime,
 *    duration}}; accepts {source:"aniembed", version:1, type:"command",
 *    name:"seek", data:{time}}. Last verified 2026-10-08.
 *  - VidNest: sends {type:"MEDIA_DATA", data:{progress:{watched, duration}}}
 *    and {type:"PLAYER_EVENT"}; it takes no commands and resumes by itself.
 *
 * Every message is optional and anything unrecognised is ignored, so a
 * player that changes its format just loses the extras and keeps playing.
 */

export interface Playback {
  time: number;
  duration: number;
}

export interface BridgeUpdate {
  ready?: boolean;
  playback?: Playback;
}

export interface Bridge {
  /** The only origin whose messages are trusted, and the only one we post to. */
  origin: string;
  read(message: Record<string, unknown>): BridgeUpdate | null;
  /** For players that only report their position when asked. */
  poll?(player: Window): void;
  seek?(player: Window, seconds: number): void;
  /** Turns the player's own skip-intro on or off. */
  autoSkip?(player: Window, on: boolean): void;
}

/** Messages arrive as objects or JSON strings; anything else isn't for us. */
export function asMessage(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function playback(time: unknown, duration: unknown): Playback | undefined {
  const t = num(time);
  const d = num(duration);
  return t !== undefined && d !== undefined && d > 0 && t >= 0 ? { time: t, duration: d } : undefined;
}

const MEGAPLAY = "https://megaplay.buzz";
const ANIEMBED = "https://aniembed.se";
const VIDNEST = "https://vidnest.fun";

/** Keyed by server id in providers.ts; a server without an entry gets no extras. */
export const BRIDGES: Record<string, Bridge> = {
  megaplay: {
    origin: MEGAPLAY,
    read(msg) {
      if (msg.event === "PLAYER_READY") return { ready: true };
      if (msg.event === "CURRENT_TIME") return { ready: true, playback: playback(msg.time, msg.duration) };
      return null;
    },
    poll: (player) => player.postMessage({ cmd: "GET_TIME" }, MEGAPLAY),
    seek: (player, seconds) => player.postMessage({ cmd: "SEEK", value: Math.max(0, seconds) }, MEGAPLAY),
    autoSkip: (player, on) => player.postMessage({ cmd: "SKP_DATA", value: null, auto: on }, MEGAPLAY),
  },
  aniembed: {
    origin: ANIEMBED,
    read(msg) {
      if (msg.source !== "aniembed" || msg.type !== "event") return null;
      const data = asMessage(msg.data) ?? {};
      return { ready: true, playback: playback(data.currentTime, data.duration) };
    },
    seek: (player, seconds) =>
      player.postMessage(
        { source: "aniembed", version: 1, type: "command", name: "seek", data: { time: Math.max(0, seconds) } },
        ANIEMBED,
      ),
  },
  vidnest: {
    origin: VIDNEST,
    read(msg) {
      if (msg.type !== "MEDIA_DATA" && msg.type !== "PLAYER_EVENT") return null;
      const progress = asMessage(asMessage(msg.data)?.progress);
      return { ready: true, playback: playback(progress?.watched, progress?.duration) };
    },
  },
};
