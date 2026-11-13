import type { NextRequest } from "next/server";
import { atsumaruAnilistId } from "@/lib/manga/atsumaru";

/**
 * GET /manga/open/:atsuId opens an Atsumaru series (from the "New chapters"
 * feed) on its AniList-based page, or searches for it when Atsumaru has no
 * AniList link.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/manga/open/[atsuId]">) {
  const { atsuId } = await ctx.params;
  if (!/^[A-Za-z0-9]{2,16}$/.test(atsuId)) return Response.redirect(new URL("/manga", request.nextUrl), 307);
  try {
    const { anilistId, title } = await atsumaruAnilistId(atsuId);
    const target = anilistId ? `/manga/${anilistId}` : `/manga/search?q=${encodeURIComponent(title)}`;
    return Response.redirect(new URL(target, request.nextUrl), 307);
  } catch {
    return Response.redirect(new URL("/manga", request.nextUrl), 307);
  }
}
