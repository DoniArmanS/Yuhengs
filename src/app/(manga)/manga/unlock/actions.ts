"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, GATE_MAX_AGE, HINT_COOKIE, gateToken, safeNext } from "@/lib/manga/gate";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function unlock(formData: FormData) {
  const secret = process.env.MANGA_PASSWORD;
  const next = safeNext(formData.get("next"));
  if (!secret) redirect(`/manga/unlock?next=${encodeURIComponent(next)}`);

  const given = String(formData.get("password") ?? "");
  if (!timingSafeEqual(digest(given), digest(secret))) {
    // A short pause makes guessing slow without bothering the owner.
    await new Promise((r) => setTimeout(r, 800));
    redirect(`/manga/unlock?error=1&next=${encodeURIComponent(next)}`);
  }

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(GATE_COOKIE, await gateToken(secret), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: GATE_MAX_AGE });
  jar.set(HINT_COOKIE, "1", { secure, sameSite: "lax", path: "/", maxAge: GATE_MAX_AGE });
  redirect(next);
}

export async function lock() {
  const jar = await cookies();
  jar.delete(GATE_COOKIE);
  jar.delete(HINT_COOKIE);
  redirect("/home");
}
