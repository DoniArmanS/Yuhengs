import type { NextRequest } from "next/server";
import { getRandomPool } from "@/lib/anilist";

/**
 * GET /random sends the viewer to a random popular anime. The pool is cached
 * for a day; the pick (Math.random, and reading the request) happens on every
 * request, so each click lands somewhere new.
 */
export async function GET(request: NextRequest) {
  const pool = await getRandomPool();
  const target = pool.length ? `/anime/${pool[Math.floor(Math.random() * pool.length)]}` : "/search";
  return Response.redirect(new URL(target, request.nextUrl), 307);
}
