<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\GogoAnimeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnimeController extends Controller
{
    protected $gogoService;
    protected $anilistUrl = 'https://graphql.anilist.co';

    public function __construct(GogoAnimeService $gogoService)
    {
        $this->gogoService = $gogoService;
    }

    /**
     * Send GraphQL request to AniList API
     */
    protected function queryAniList($query, $variables = [])
    {
        try {
            $response = Http::post($this->anilistUrl, [
                'query' => $query,
                'variables' => $variables
            ]);

            if ($response->successful()) {
                return $response->json()['data'] ?? null;
            }

            Log::error("AniList API failed: " . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error("AniList Query Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Homepage dashboard (Trending, Popular, and Search results)
     */
    public function index(Request $request)
    {
        $search = $request->input('q');
        $animeList = [];
        $trendingList = [];
        $popularList = [];
        $latestList = [];

        if ($search) {
            // Search query AniList
            $query = '
            query ($search: String, $page: Int, $perPage: Int) {
                Page (page: $page, perPage: $perPage) {
                    media (search: $search, type: ANIME) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
                            large
                        }
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

            $data = $this->queryAniList($query, ['search' => $search, 'page' => 1, 'perPage' => 24]);
            $animeList = $data['Page']['media'] ?? [];
        } else {
            // Fetch Trending, Popular, and Latest
            $query = '
            query ($page: Int, $perPage: Int) {
                trending: Page (page: $page, perPage: $perPage) {
                    media (type: ANIME, sort: TRENDING_DESC) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
                            large
                        }
                        bannerImage
                        description
                        episodes
                        genres
                        averageScore
                        seasonYear
                        status
                    }
                }
                popular: Page (page: $page, perPage: $perPage) {
                    media (type: ANIME, sort: POPULARITY_DESC) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
                            large
                        }
                        bannerImage
                        description
                        episodes
                        genres
                        averageScore
                        seasonYear
                        status
                    }
                }
                latest: Page (page: $page, perPage: $perPage) {
                    media (type: ANIME, sort: START_DATE_DESC, status_not: NOT_YET_RELEASED) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
                            large
                        }
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

            $data = $this->queryAniList($query, ['page' => 1, 'perPage' => 12]);
            $trendingList = $data['trending']['media'] ?? [];
            $popularList = $data['popular']['media'] ?? [];
            $latestList = $data['latest']['media'] ?? [];
        }

        return view('anime.index', compact('animeList', 'trendingList', 'popularList', 'latestList', 'search'));
    }

    /**
     * Watching Page (Plays the anime with Gogoanime multi-server streaming)
     */
    public function watch($id, $episode = 1)
    {
        // 1. Fetch Anime Detail from AniList
        $query = '
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
                id
                idMal
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    extraLarge
                    large
                }
                bannerImage
                description
                episodes
                genres
                averageScore
                seasonYear
                status
                nextAiringEpisode {
                    episode
                }
                studios(isMain: true) {
                    nodes {
                        name
                    }
                }
            }
        }';

        $data = $this->queryAniList($query, ['id' => $id]);
        $anime = $data['Media'] ?? null;

        if (!$anime) {
            abort(404, "Anime not found");
        }

        $titleForSearch = $anime['title']['english'] ?? $anime['title']['romaji'];
        
        // Clean title for searching (Gogoanime works best with clean alphanumeric titles)
        $cleanTitle = preg_replace('/[^a-zA-Z0-9\s]/', '', $titleForSearch);
        
        // 2. Find matching slug in Gogoanime
        $slugs = $this->gogoService->search($cleanTitle);
        
        // Fallback: If English search fails, try Romaji title
        if (empty($slugs) && isset($anime['title']['romaji'])) {
            $cleanRomaji = preg_replace('/[^a-zA-Z0-9\s]/', '', $anime['title']['romaji']);
            $slugs = $this->gogoService->search($cleanRomaji);
        }

        $slug = null;
        if (!empty($slugs)) {
            // Take the first matching slug (usually the best match)
            $slug = $slugs[0]['slug'];
        } else {
            // Fallback slug generation if search completely fails
            // E.g. "attack-on-titan"
            $slug = strtolower(str_replace(' ', '-', trim(preg_replace('/[^a-zA-Z0-9\s]/', '', $titleForSearch))));
        }

        // 3. Fetch episode servers for current episode
        $servers = $this->gogoService->getEpisodeServers($slug, $episode);
        
        // 4. Calculate total episodes based on aired status
        $totalEpisodes = $anime['episodes'] ?? 0;
        
        if ($anime['status'] === 'RELEASING' && isset($anime['nextAiringEpisode']['episode'])) {
            $totalEpisodes = $anime['nextAiringEpisode']['episode'] - 1;
        } elseif ($anime['status'] === 'NOT_YET_RELEASED') {
            $totalEpisodes = 0;
        } elseif ($totalEpisodes <= 0) {
            $totalEpisodes = max($episode + 1, 24); // Fallback for ongoing shows without known total
        }

        // 5. Setup premium fallback servers (like embed.su or vidlink.pro) using MAL ID
        $malId = $anime['idMal'] ?? null;
        $fallbackServers = [];
        if ($malId) {
            $fallbackServers[] = [
                'name' => 'Server 1 (VidLink - Sub)',
                'class' => 'vidlink',
                'url' => "https://vidlink.pro/anime/{$malId}/{$episode}/sub?fallback=true"
            ];
            $fallbackServers[] = [
                'name' => 'Server 2 (VidLink - Dub)',
                'class' => 'vidlink-dub',
                'url' => "https://vidlink.pro/anime/{$malId}/{$episode}/dub?fallback=true"
            ];
            $fallbackServers[] = [
                'name' => 'Server 3 (Embed.su)',
                'class' => 'embedsu',
                'url' => "https://embed.su/embed/anime/{$malId}/{$episode}"
            ];
            $fallbackServers[] = [
                'name' => 'Server 4 (2Anime)',
                'class' => 'twoanime',
                'url' => "https://2anime.xyz/embed/{$malId}/{$episode}"
            ];
        }

        // Combine all servers, prioritizing Gogoanime mirrors
        $allServers = array_merge($servers, $fallbackServers);

        return view('anime.watch', compact('anime', 'allServers', 'slug', 'episode', 'totalEpisodes'));
    }
}
