/*
 * The manga section is for the site owner only. Visiting it needs the
 * MANGA_PASSWORD set in the environment; unlocking stores a hash of it in an
 * httpOnly cookie that src/proxy.ts checks on every manga request. Without a
 * password the section is open in development and locked in production.
 */
export const GATE_COOKIE = "yh_manga";
/** Readable by scripts: only tells the rest of the site to show manga links. */
export const HINT_COOKIE = "yh_manga_hint";
export const GATE_MAX_AGE = 60 * 60 * 24 * 180;

export async function gateToken(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`yuhengs-manga:${secret}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Only same-site manga paths may be returned to after unlocking. */
export function safeNext(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  return /^\/(manga|read)(\/|\?|$)/.test(next) ? next : "/manga";
}
