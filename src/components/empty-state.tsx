import type { ReactNode } from "react";

// Broadcast colour bars, toned down to sit on the navy page.
const BARS = ["#bfc3c9", "#c9b44a", "#4fb3c2", "#55a85a", "#a65aa8", "#c2473f", "#3f57b8"];

/** Empty and error states as an "off air" test card. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="flex h-24 w-40 overflow-hidden rounded-[4px] border border-rule-strong" aria-hidden>
        {BARS.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      <h2 className="condensed mt-6 text-3xl font-extrabold text-balance">{title}</h2>
      {children ? <div className="mt-3 text-sm leading-relaxed text-dim">{children}</div> : null}
    </div>
  );
}
