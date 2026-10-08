import Link from "next/link";

/**
 * Lower-third heading: a slanted red tab, the title, and a rule running to
 * the optional "See all" link, like a broadcast caption bar.
 */
export function SectionHeading({
  id,
  title,
  description,
  href,
  linkLabel = "See all",
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span className="h-7 w-1.5 shrink-0 -skew-x-12 bg-onair" aria-hidden />
        <h2 id={id} className="condensed text-3xl leading-none font-extrabold sm:text-[2rem]">
          {title}
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-rule-strong to-transparent" aria-hidden />
        {href ? (
          <Link href={href} className="-my-2 inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-dim underline-offset-4 transition-colors hover:text-paper hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {description ? <p className="mt-1.5 pl-[1.125rem] text-sm text-dim">{description}</p> : null}
    </div>
  );
}
