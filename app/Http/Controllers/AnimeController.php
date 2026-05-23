<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AnimeStreamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnimeController extends Controller
{
    protected $streamService;
    protected $anilistUrl = 'https://graphql.anilist.co';

    public function __construct(AnimeStreamService $streamService)
    {
        $this->streamService = $streamService;
    }

    /**
     * Send GraphQL request to AniList API
     */
    protected function queryAniList($query, $variables = [])
    {
        try {
            $response = Http::timeout(15)->post($this->anilistUrl, [
                'query'     => $query,
                'variables' => $variables,
            ]);

            if ($response->successful()) {
                return $response->json()['data'] ?? null;
            }

            Log::error('AniList API failed: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('AniList Query Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Homepage — Trending, Popular, Latest, or Search results
     */
    public function index(Request $request)
    {
        $search      = $request->input('q');
        $animeList   = [];
        $trendingList = [];
        $popularList  = [];
        $latestList   = [];

        if ($search) {
            $query = '
            query ($search: String, $page: Int, $perPage: Int) {
                Page (page: $page, perPage: $perPage) {
                    media (search: $search, type: ANIME) {
                        id
                        idMal
                        title { romaji english native }
                        coverImage { extraLarge large }
                        bannerImage
                        description
                        episodes
                        genres
                        averageScore
                        seasonYear
                        status
                    }
                }
            }';

            $data      = $this->queryAniList($query, ['search' => $search, 'page' => 1, 'perPage' => 24]);
            $animeList = $data['Page']['media'] ?? [];
        } else {
            $query = '
            query ($page: Int, $perPage: Int) {
                trending: Page (page: $page, perPage: $perPage) {
                    media (type: ANIME, sort: TRENDING_DESC) {
                        id idMal
                        title { romaji english native }
                        coverImage { extraLarge large }
                        episodes averageScore seasonYear status
                    }
                }
                popular: Page (page: $page, perPage: $perPage) {
                    media (type: ANIME, sort: POPULARITY_DESC) {
                        id idMal
                        title { romaji english native }
                        coverImage { extraLarge large }
                        episodes averageScore seasonYear status
                    }
                }
                latest: Page (page: $page, perPage: $perPage) {
                    media (type: ANIME, sort: START_DATE_DESC, status_not: NOT_YET_RELEASED) {
                        id idMal
                        title { romaji english native }
                        coverImage { extraLarge large }
                        episodes averageScore seasonYear status
                    }
                }
            }';

            $data         = $this->queryAniList($query, ['page' => 1, 'perPage' => 12]);
            $trendingList = $data['trending']['media'] ?? [];
            $popularList  = $data['popular']['media']  ?? [];
            $latestList   = $data['latest']['media']   ?? [];
        }

        return view('anime.index', compact('animeList', 'trendingList', 'popularList', 'latestList', 'search'));
    }

    /**
     * Watch page — full anime detail + multi-server embed list
     */
    public function watch($id, $episode = 1)
    {
        $episode = max(1, (int) $episode);

        // 1. Fetch anime metadata from AniList
        $query = '
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
                id
                idMal
                title { romaji english native }
                coverImage { extraLarge large }
                bannerImage
                description
                episodes
                genres
                averageScore
                seasonYear
                status
                nextAiringEpisode { episode }
                studios(isMain: true) {
                    nodes { name }
                }
            }
        }';

        $data  = $this->queryAniList($query, ['id' => (int) $id]);
        $anime = $data['Media'] ?? null;

        if (!$anime) {
            abort(404, 'Anime not found');
        }

        // 2. Resolve total episodes
        $totalEpisodes = (int) ($anime['episodes'] ?? 0);

        if ($anime['status'] === 'RELEASING' && isset($anime['nextAiringEpisode']['episode'])) {
            $totalEpisodes = $anime['nextAiringEpisode']['episode'] - 1;
        } elseif ($anime['status'] === 'NOT_YET_RELEASED') {
            $totalEpisodes = 0;
        } elseif ($totalEpisodes <= 0) {
            // Fallback for ongoing shows without known total
            $totalEpisodes = max($episode + 5, 24);
        }

        // Clamp episode to valid range
        if ($totalEpisodes > 0) {
            $episode = min($episode, $totalEpisodes);
        }

        // 3. Generate all embed server URLs via AnimeStreamService
        $malId     = $anime['idMal'] ?? null;
        $allServers = $this->streamService->getServers($malId, $episode);

        return view('anime.watch', compact('anime', 'allServers', 'episode', 'totalEpisodes'));
    }
}
