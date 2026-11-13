import Image from "next/image";
import Link from "next/link";
import { BookIcon } from "../icons";

/** On an anime page: the manga it was adapted from. */
export function ReadTheManga({ id, title, cover, kind }: { id: number; title: string; cover: string | null; kind: string }) {
  return (
    <Link
      href={`/manga/${id}`}
      className="group mt-6 flex max-w-md items-center gap-3 rounded-[3px] border border-rule-strong bg-panel p-3 transition-colors hover:border-paper/50"
    >
      {cover ? (
        <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[2px]">
          <Image src={cover} alt="" fill sizes="44px" className="object-cover" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold tracking-wider text-onair uppercase">Source material</span>
        <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">Read the {kind.toLowerCase()}</span>
        <span className="block truncate text-xs text-dim">{title}</span>
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-onair text-on-onair" aria-hidden>
        <BookIcon className="size-[18px]" />
      </span>
    </Link>
  );
}
