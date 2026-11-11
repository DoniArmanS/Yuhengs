import Link from "next/link";
import { ChevronRightIcon, ShuffleIcon } from "./icons";
import { Logo } from "./logo";
import { SectionHeading } from "./section-heading";

/** The landing page's own header: transparent over the poster wall, with one way in. */
export function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="Yuhengs">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-0.5 rounded-full border border-rule bg-ink-deep/70 p-1 backdrop-blur md:flex">
          <Link href="/search" className="rounded-full px-4 py-1.5 text-sm font-semibold text-dim transition-colors hover:text-paper">
            Browse
          </Link>
          <Link href="/schedule" className="rounded-full px-4 py-1.5 text-sm font-semibold text-dim transition-colors hover:text-paper">
            Schedule
          </Link>
          {/* A plain link: /random is a redirecting route handler, so it needs a full request. */}
          <a href="/random" className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-dim transition-colors hover:text-paper">
            <ShuffleIcon className="size-4" />
            Random
          </a>
        </nav>
        <Link
          href="/home"
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-onair pr-3 pl-4 text-sm font-bold text-on-onair transition-colors hover:bg-onair-hover"
        >
          Open Yuhengs
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>
    </header>
  );
}

const STEPS = [
  {
    title: "Find a show",
    body: "Search, browse by genre and season, or see what aired in Japan in the last few hours.",
  },
  {
    title: "Pick sub or dub",
    body: "Choose the audio and a server. If one is slow, switch with a tap; your choice is remembered.",
  },
  {
    title: "Pick up where you left off",
    body: "Your place in each episode stays on this device, and the next episode can start by itself.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how" className="mx-auto max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10">
      <SectionHeading id="how" title="How it works" />
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-[4px] border border-rule bg-panel p-6">
            <span className="condensed text-5xl leading-none font-extrabold text-onair" aria-hidden>
              {i + 1}
            </span>
            <h3 className="text-lg font-bold">{step.title}</h3>
            <p className="leading-relaxed text-dim">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The last thing on the landing page: one more way in. */
export function FinalCall() {
  return (
    <section aria-labelledby="final-call" className="mx-auto mt-24 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <div className="relative isolate overflow-hidden rounded-[8px] border border-rule-strong bg-panel px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_srgb,var(--color-onair)_22%,transparent),transparent)]"
          aria-hidden
        />
        <h2 id="final-call" className="condensed text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-extrabold text-balance">
          Your next episode is waiting.
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-dim">New episodes every day, in sub and dub. No account, no payment.</p>
        <Link
          href="/home"
          className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-onair px-7 font-bold text-on-onair shadow-[0_14px_34px_-14px_rgb(187_154_247/0.85)] transition-[background-color,transform] duration-150 hover:bg-onair-hover active:scale-[0.97]"
        >
          Open Yuhengs
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>
    </section>
  );
}
