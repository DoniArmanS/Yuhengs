export type Audio = "sub" | "dub";

export interface StreamServer {
  id: string;
  name: string;
  audio: Audio[];
  /**
   * Run the embed in a sandboxed iframe (no pop-ups or top-level redirects).
   * Only for providers verified to keep working when sandboxed; the others
   * detect the sandbox and refuse to play.
   */
  sandbox: boolean;
  /** Needs Web Crypto, which browsers only enable on HTTPS (or localhost) pages. */
  secureOnly: boolean;
  url: (anilistId: number, episode: number, audio: Audio) => string;
}

/**
 * Embed providers keyed by AniList id, in fallback order. Playback was
 * verified in Chromium on 2026-10-07 (Frieren, One Piece 1100, Dandadan,
 * Solo Leveling dub).
 *
 * Removed after testing: VidLink (its anime API points at localhost),
 * VidSrc.su (blank page), Anixo (blocks other domains), VidPlus (blank),
 * Videasy (shows the episode but the stream never starts).
 */
export const SERVERS: StreamServer[] = [
  {
    id: "aniembed",
    name: "AniEmbed",
    audio: ["sub", "dub"],
    sandbox: true,
    secureOnly: false,
    url: (id, ep, audio) => `https://aniembed.se/e/${id}/${ep}?lang=${audio}`,
  },
  {
    id: "megaplay",
    name: "MegaPlay",
    audio: ["sub", "dub"],
    sandbox: false,
    secureOnly: true,
    url: (id, ep, audio) => `https://megaplay.buzz/stream/ani/${id}/${ep}/${audio}`,
  },
  {
    id: "vidnest",
    name: "VidNest",
    audio: ["sub", "dub"],
    sandbox: false,
    secureOnly: false,
    url: (id, ep, audio) => `https://vidnest.fun/anime/${id}/${ep}/${audio}`,
  },
];

export const SANDBOX_POLICY = "allow-scripts allow-same-origin allow-presentation allow-forms";
