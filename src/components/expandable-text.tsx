"use client";

import { useState } from "react";

/** Long text clamped to four lines on phones, with a toggle; shown in full from tablets up. */
export function ExpandableText({ paragraphs, className = "" }: { paragraphs: string[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = paragraphs.join(" ").length > 280;

  return (
    <div className={className}>
      <div className={`space-y-3 ${!open && long ? "max-md:line-clamp-4" : ""}`}>
        {paragraphs.map((para, i) => (
          <p key={i} className={!open && long && i > 0 ? "max-md:hidden" : undefined}>
            {para}
          </p>
        ))}
      </div>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-paper underline underline-offset-4 md:hidden"
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
