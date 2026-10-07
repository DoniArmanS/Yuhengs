/** Wordmark: the station name beside a red on-air tally light. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="size-2.5 rounded-full bg-onair shadow-[0_0_10px_rgb(255_68_56/0.7)]" aria-hidden />
      <span translate="no" className="condensed text-2xl leading-none font-extrabold tracking-tight">
        Yuhengs
      </span>
    </span>
  );
}
