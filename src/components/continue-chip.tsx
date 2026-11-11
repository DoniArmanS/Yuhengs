"use client";

import Image from "next/image";
import Link from "next/link";
import { useHistory } from "@/lib/history";
import { PlayIcon } from "./icons";

/** On the landing page, a returning viewer gets one tap back into their last episode. */
export function ContinueChip() {
  const [last] = useHistory();
  if (!last) return null;

  return (
    <Link
      href={`/watch/${last.id}/${last.episode}`}
      className="inline-flex max-w-full items-center gap-3 self-start rounded-full border border-rule-strong bg-panel/85 py-1.5 pr-4 pl-1.5 text-sm transition-colors hover:border-onair"
    >
      <span
        className="relative size-9 shrink-0 overflow-hidden rounded-full"
        style={{ backgroundColor: last.color ?? "var(--color-panel-raised)" }}
      >
        {last.cover ? <Image src={last.cover} alt="" fill sizes="36px" className="object-cover" /> : null}
      </span>
      <span className="min-w-0 truncate text-dim">
        Continue <span className="font-semibold text-paper">{last.title}</span> · Episode {last.episode}
      </span>
      <PlayIcon className="size-3.5 shrink-0 text-onair" />
    </Link>
  );
}
