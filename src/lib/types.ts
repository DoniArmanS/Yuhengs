export type MediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC";

export type MediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface AnimeCard {
  id: number;
  idMal: number | null;
  title: { romaji: string | null; english: string | null };
  coverImage: { extraLarge: string | null; large: string | null; color: string | null };
  format: MediaFormat | null;
  status: MediaStatus | null;
  episodes: number | null;
  averageScore: number | null;
  seasonYear: number | null;
  genres: string[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

export interface AnimeDetail extends AnimeCard {
  title: { romaji: string | null; english: string | null; native: string | null };
  bannerImage: string | null;
  description: string | null;
  duration: number | null;
  genres: string[];
  season: MediaSeason | null;
  popularity: number | null;
  studios: { nodes: { name: string }[] };
  relations: {
    edges: { relationType: string; node: AnimeCard & { type: "ANIME" | "MANGA" } }[];
  };
  recommendations: { nodes: { mediaRecommendation: AnimeCard | null }[] };
}

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AiringSlot {
  airingAt: number;
  episode: number;
  media: AnimeCard & {
    bannerImage: string | null;
    popularity: number | null;
    genres: string[];
    isAdult: boolean;
  };
}
