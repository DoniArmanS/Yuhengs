"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Remote } from "@/lib/remote";
import type { SkipTimes } from "@/lib/skip-times";
import { Back10Icon, ChevronRightIcon, Forward10Icon, PauseIcon, PlayIcon, SkipIcon } from "./icons";

interface Playback {
  time: number | null;
  duration: number | null;
  playing: boolean | null;
  /** Date.now() when `time` was reported, to extrapolate between reports. */
  at: number;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Big, always-visible controls under the video: play/pause, ±10 s and
 * Skip intro. They drive the embedded player through its postMessage API,
 * since its own buttons are small or hidden on phones. Mount with
 * key={src} so state resets per episode/server.
 */
export function RemoteBar({
  frameRef,
  remote,
  skip,
  nextHref,
  autoSkip,
  onAutoSkipChange,
}: {
  frameRef: RefObject<HTMLIFrameElement | null>;
  remote: Remote;
  skip: SkipTimes;
  nextHref: string | null;
  autoSkip: boolean;
  onAutoSkipChange: (on: boolean) => void;
}) {
  const [pb, setPb] = useState<Playback>({ time: null, duration: null, playing: null, at: 0 });
  const [clock, setClock] = useState(0);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const skipped = useRef(false);
  const latest = useRef({ autoSkip, op: skip.op });
  useEffect(() => {
    latest.current = { autoSkip, op: skip.op };
  }, [autoSkip, skip.op]);

  const win = () => frameRef.current?.contentWindow ?? null;

  // Playback events from the player.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const w = frameRef.current?.contentWindow;
      if (!w || e.source !== w || e.origin !== remote.origin) return;
      const u = remote.parse(e.data);
      if (!u) return;

      setPb((prev) => ({
        time: u.time ?? prev.time,
        duration: u.duration ?? prev.duration,
        // Players that only stream time updates (MegaPlay) are playing while they arrive.
        playing: u.playing ?? (u.time !== undefined ? true : prev.playing),
        at: Date.now(),
      }));
      if (u.playing === undefined && u.time !== undefined) {
        clearTimeout(idle.current);
        idle.current = setTimeout(() => setPb((p) => ({ ...p, playing: false })), 1500);
      }

      // Auto-skip the opening once per episode.
      const { autoSkip: on, op } = latest.current;
      if (on && op && u.time !== undefined && u.time >= op[0] && u.time < op[1] - 3 && !skipped.current) {
        skipped.current = true;
        remote.seekTo(w, op[1]);
      }
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(idle.current);
    };
  }, [frameRef, remote]);

  // While playing, tick once a second so the time and Skip intro button stay current
  // between the player's (sometimes 5 s apart) reports.
  useEffect(() => {
    if (!pb.playing) return;
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pb.playing]);

  const now =
    pb.time === null ? null : pb.time + (pb.playing && clock > pb.at ? (clock - pb.at) / 1000 : 0);

  const toggle = () => {
    const w = win();
    if (!w) return;
    if (pb.playing) remote.pause(w);
    else remote.play(w);
    setPb((p) => ({ ...p, playing: !p.playing }));
  };
  // After a jump we make, assume we're where we asked to be until the player
  // reports again (AniEmbed reports only every 5 s), so the next ±10 s is
  // relative to the new position, not the old one.
  const jumpTo = (t: number) => {
    const target = Math.max(0, pb.duration ? Math.min(t, pb.duration) : t);
    setPb((p) => ({ ...p, time: target, at: Date.now() }));
    setClock(Date.now());
    return target;
  };
  const seekBy = (d: number) => {
    const w = win();
    if (!w) return;
    const from = now ?? 0;
    remote.seekBy(w, d, from);
    jumpTo(from + d);
  };
  const skipIntro = () => {
    const w = win();
    if (w && skip.op) {
      skipped.current = true;
      remote.seekTo(w, skip.op[1]);
      jumpTo(skip.op[1]);
    }
  };

  // Keyboard: Space/K play-pause, J/L ±10 s (ignored while typing).
  const actions = useRef({ toggle, seekBy });
  useEffect(() => {
    actions.current = { toggle, seekBy };
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        e.preventDefault();
        actions.current.toggle();
      } else if (k === "j") actions.current.seekBy(-10);
      else if (k === "l") actions.current.seekBy(10);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const inOp = skip.op !== null && now !== null && now >= skip.op[0] - 1 && now < skip.op[1] - 2;
  const inEd = skip.ed !== null && now !== null && now >= skip.ed[0];

  let contextual: ReactNode = null;
  if (inOp) {
    contextual = (
      <button
        type="button"
        onClick={skipIntro}
        className="inline-flex h-12 items-center gap-2 rounded-[3px] bg-paper px-4 font-bold text-ink transition-transform duration-150 active:scale-[0.97]"
      >
        Skip intro
        <SkipIcon className="size-4" />
      </button>
    );
  } else if (inEd && nextHref) {
    contextual = (
      <Link
        href={nextHref}
        className="inline-flex h-12 items-center gap-1.5 rounded-[3px] bg-paper px-4 font-bold text-ink transition-transform duration-150 active:scale-[0.97]"
      >
        Next episode
        <ChevronRightIcon className="size-4" />
      </Link>
    );
  } else if (!skip.op && (now === null || now < 600)) {
    // No intro timestamps for this episode: offer the classic 85-second jump.
    contextual = (
      <button
        type="button"
        onClick={() => seekBy(85)}
        className="inline-flex h-12 items-center gap-2 rounded-[3px] border border-rule-strong px-4 text-sm font-semibold transition-[border-color,transform] duration-150 hover:border-paper/60 active:scale-[0.97]"
      >
        Skip 85s
        <SkipIcon className="size-4" />
      </button>
    );
  }

  return (
    <div className="rounded-[3px] border border-rule bg-panel p-2.5 sm:p-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label="Playback">
          <RoundButton label="Back 10 seconds" onClick={() => seekBy(-10)}>
            <Back10Icon className="size-6" />
          </RoundButton>
          <button
            type="button"
            onClick={toggle}
            aria-label={pb.playing ? "Pause" : "Play"}
            className="grid size-14 place-items-center rounded-full bg-onair text-white shadow-[0_6px_20px_-6px_rgb(255_68_56/0.8)] transition-[background-color,transform] duration-150 hover:bg-onair-hover active:scale-95"
          >
            {pb.playing ? <PauseIcon className="size-6" /> : <PlayIcon className="size-6 translate-x-0.5" />}
          </button>
          <RoundButton label="Forward 10 seconds" onClick={() => seekBy(10)}>
            <Forward10Icon className="size-6" />
          </RoundButton>
        </div>
        {now !== null ? (
          <span className="condensed text-base font-bold text-dim tabular-nums">
            {fmt(now)}
            {pb.duration ? <span className="text-faint"> / {fmt(pb.duration)}</span> : null}
          </span>
        ) : null}
        <div className="ml-auto">{contextual}</div>
      </div>

      {skip.op ? (
        <label className="mt-2 flex min-h-10 cursor-pointer items-center gap-2.5 border-t border-rule/60 pt-2 text-sm text-dim">
          <input
            type="checkbox"
            checked={autoSkip}
            onChange={(e) => onAutoSkipChange(e.target.checked)}
            className="size-5 accent-[var(--color-onair)]"
          />
          Skip intros automatically
        </label>
      ) : null}
    </div>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-12 place-items-center rounded-full text-paper transition-[background-color,transform] duration-150 hover:bg-panel-raised active:scale-95"
    >
      {children}
    </button>
  );
}
