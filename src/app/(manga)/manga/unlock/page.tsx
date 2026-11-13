import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNext } from "@/lib/manga/gate";
import { unlock } from "./actions";

export const metadata: Metadata = {
  title: "Manga",
  robots: { index: false, follow: false },
};

export default function UnlockPage(props: PageProps<"/manga/unlock">) {
  return (
    <div className="tone flex min-h-[70dvh] items-center justify-center px-4 py-16">
      <div className="ink-frame w-full max-w-sm bg-panel p-6 sm:p-8">
        <h1 className="condensed inline-block -skew-x-8 bg-frame px-3 pt-1 pb-1.5 text-3xl leading-none font-extrabold text-ink">
          <span className="inline-block skew-x-8">Private shelf</span>
        </h1>
        <Suspense fallback={<UnlockForm next="/manga" error={false} />}>
          <UnlockFromParams searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function UnlockFromParams({ searchParams }: Pick<PageProps<"/manga/unlock">, "searchParams">) {
  const params = await searchParams;
  return <UnlockForm next={safeNext(params.next)} error={params.error === "1"} />;
}

function UnlockForm({ next, error }: { next: string; error: boolean }) {
  const configured = Boolean(process.env.MANGA_PASSWORD);

  if (!configured) {
    return (
      <p className="mt-5 text-sm leading-relaxed text-dim">
        The manga section stays locked until a password is set. Add <code className="text-paper">MANGA_PASSWORD</code> to
        the project’s environment variables on Vercel, redeploy, then come back here.
      </p>
    );
  }

  return (
    <form action={unlock} className="mt-5 space-y-4">
      <p className="text-sm text-dim">The manga section is for the owner of this site. Enter the password to open it on this device.</p>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="manga-password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="manga-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={error || undefined}
          aria-describedby={error ? "manga-password-error" : undefined}
          className="mt-1.5 h-12 w-full border-2 border-rule-strong bg-ink px-3 text-paper focus:border-frame focus:outline-none"
        />
        {error ? (
          <p id="manga-password-error" className="mt-2 text-sm font-semibold text-onair" role="alert">
            That password isn’t right.
          </p>
        ) : null}
      </div>
      <button type="submit" className="ink-frame h-12 w-full bg-onair font-bold text-on-onair hover:bg-onair-hover">
        Open manga
      </button>
    </form>
  );
}
