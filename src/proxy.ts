import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, GATE_MAX_AGE, HINT_COOKIE, gateToken } from "@/lib/manga/gate";

/** Keeps the manga section (and its reader) behind MANGA_PASSWORD. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/manga/unlock") return NextResponse.next();

  const secret = process.env.MANGA_PASSWORD;
  const allowed = secret
    ? request.cookies.get(GATE_COOKIE)?.value === (await gateToken(secret))
    : process.env.NODE_ENV !== "production";

  if (allowed) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (!request.cookies.has(HINT_COOKIE)) {
      res.cookies.set(HINT_COOKIE, "1", {
        path: "/",
        maxAge: GATE_MAX_AGE,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      });
    }
    return res;
  }

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Locked" }, { status: 401 });

  const unlock = new URL("/manga/unlock", request.url);
  unlock.searchParams.set("next", pathname + search);
  const res = NextResponse.redirect(unlock);
  if (request.cookies.has(HINT_COOKIE)) res.cookies.delete(HINT_COOKIE);
  return res;
}

export const config = {
  matcher: ["/manga", "/manga/:path*", "/read/:path*", "/api/manga/:path*"],
};
