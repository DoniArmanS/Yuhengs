import type { AnimeCard } from "./types";

export interface WallCover {
  id: number;
  src: string;
  color: string | null;
}

/**
 * A franchise key from the romaji title: lower-case letters and digits only,
 * first seven. "Shingeki no Kyojin Season 3" and "Shingeki no Kyojin" share
 * one, so sequels with near-identical art don't both land on the wall.
 */
function franchise(anime: AnimeCard): string {
  const title = anime.title.romaji ?? anime.title.english ?? String(anime.id);
  return title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").slice(0, 7);
}

/**
 * Covers for the landing poster wall. Interleaves the lists (trending first)
 * so the wall mixes what's on now with classics, keeps one cover per
 * franchise, never repeats a show, and leaves out ecchi so the wall is safe
 * to show anyone.
 */
export function pickWallCovers(lists: AnimeCard[][], count = 32): WallCover[] {
  const ids = new Set<number>();
  const franchises = new Set<string>();
  const covers: WallCover[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));

  for (let i = 0; i < longest && covers.length < count; i++) {
    for (const list of lists) {
      const anime = list[i];
      if (!anime || ids.has(anime.id) || anime.genres.includes("Ecchi")) continue;
      const src = anime.coverImage.extraLarge ?? anime.coverImage.large;
      const key = franchise(anime);
      if (!src || franchises.has(key)) continue;
      ids.add(anime.id);
      franchises.add(key);
      covers.push({ id: anime.id, src, color: anime.coverImage.color });
      if (covers.length === count) break;
    }
  }
  return covers;
}

/** Deals covers into columns round robin, so every column gets a mix. */
export function wallColumns(covers: WallCover[], columns: number): WallCover[][] {
  return Array.from({ length: columns }, (_, column) => covers.filter((_, i) => i % columns === column));
}
