"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

/**
 * Link that upgrades to a full prefetch once the user shows intent (hover,
 * focus or touch). The full prefetch includes the cached detail data, so the
 * page is ready on click and the poster can morph into the cover. Before
 * intent it keeps the default App Shell prefetch, which avoids firing an
 * AniList request for every poster that scrolls into view.
 */
export function IntentLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const [intent, setIntent] = useState(false);
  const arm = () => setIntent(true);

  return (
    <Link
      href={href}
      prefetch={intent ? true : "auto"}
      onMouseEnter={arm}
      onFocus={arm}
      onTouchStart={arm}
      className={className}
    >
      {children}
    </Link>
  );
}
