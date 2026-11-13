import "server-only";

/*
 * Requests to the chapter sources. They identify themselves honestly (no
 * browser disguise) and give up after a few seconds so one slow site can't
 * hold a page. Callers run them inside "use cache" functions, so a failure
 * throws and is never cached.
 */
const USER_AGENT = process.env.MANGA_USER_AGENT || "manga-reader/1.0 (personal use)";
const TIMEOUT_MS = 12_000;

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SourceError";
  }
}

async function request(url: string, accept: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: accept },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new SourceError(`${new URL(url).host} did not answer (${err instanceof Error ? err.name : "network error"})`);
  }
  if (!res.ok) {
    // A Cloudflare challenge page means the site now blocks automated readers; say so plainly.
    const challenged = res.status === 403 && (res.headers.get("content-type") ?? "").includes("text/html");
    throw new SourceError(
      challenged ? `${new URL(url).host} is asking for a browser check` : `${new URL(url).host} answered ${res.status}`,
      res.status,
    );
  }
  return res;
}

/** Cut-off bodies, timeouts, rate limits and server errors are usually gone a moment later. */
function transient(err: unknown): boolean {
  return err instanceof SourceError && (err.status === undefined || err.status === 429 || err.status >= 500);
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!transient(err)) throw err;
    await new Promise((r) => setTimeout(r, 500));
    return run();
  }
}

export async function getJson<T>(url: string): Promise<T> {
  return withRetry(async () => {
    const res = await request(url, "application/json");
    try {
      return (await res.json()) as T;
    } catch {
      throw new SourceError(`${new URL(url).host} sent something that isn't JSON`);
    }
  });
}

export async function getHtml(url: string): Promise<string> {
  return withRetry(async () => {
    const res = await request(url, "text/html");
    try {
      return await res.text();
    } catch {
      throw new SourceError(`${new URL(url).host} cut the page off`);
    }
  });
}

/** The handful of HTML entities that show up in titles and URLs. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Lowercase letters and digits only, for comparing titles across sites. */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

/** "Chapter 147" adds nothing to a list that already shows the number. */
export function cleanChapterTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  const rest = title.replace(/^\s*(chapter|chap\.?|ch\.?|episode|ep\.?)\s*[\d.]+\s*[:\-–—.]?\s*/i, "").trim();
  return rest && !/^[\d.]+$/.test(rest) ? rest : null;
}
