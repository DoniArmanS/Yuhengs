import { SectionHeading } from "./section-heading";

const REASONS = [
  {
    title: "No ads from us",
    body: "Yuhengs itself shows no ads or pop-ups. Video comes from third-party servers, and we sandbox the ones that allow it.",
  },
  {
    title: "Sub and dub, side by side",
    body: "Switch audio on any episode, and if one server is slow, pick another without leaving the page.",
  },
  {
    title: "No account needed",
    body: "Continue watching, your place in each episode and your history stay on this device. There is nothing to sign up for.",
  },
];

const QUESTIONS = [
  {
    q: "Is Yuhengs free?",
    a: "Yes. There are no accounts, subscriptions or paid tiers.",
  },
  {
    q: "Where do the videos come from?",
    a: "From third-party embed servers. Yuhengs hosts no video; anime details and artwork come from AniList.",
  },
  {
    q: "Why isn’t a new episode here yet?",
    a: "Servers upload new episodes minutes to hours after they air in Japan. Yuhengs checks for them and shows each one as soon as it plays.",
  },
  {
    q: "A pop-up opened. What happened?",
    a: "Some video servers run ads inside their player. Close the pop-up and come back, or switch to a server marked as sandboxed, which can’t open pop-ups.",
  },
];

/** Closing section of the home page: what Yuhengs is, and the questions new visitors ask. */
export function AboutYuhengs() {
  return (
    <section aria-labelledby="about" className="mx-auto mt-20 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <SectionHeading id="about" title="Why Yuhengs" />
      <ul className="grid gap-4 md:grid-cols-3">
        {REASONS.map((reason) => (
          <li key={reason.title} className="flex flex-col gap-2.5 rounded-[4px] border border-rule bg-panel p-6">
            <h3 className="text-lg font-bold">{reason.title}</h3>
            <p className="leading-relaxed text-dim">{reason.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-16 max-w-3xl">
        <h2 className="condensed text-3xl leading-none font-extrabold sm:text-[2rem]">Questions</h2>
        <div className="mt-5 border-t border-rule">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group border-b border-rule py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-xl leading-none text-onair transition-transform duration-200 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-[68ch] leading-relaxed text-dim">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
