<?php

namespace App\Services;

/**
 * AnimeStreamService
 *
 * Generates embed server URLs for a given anime episode using verified
 * active embed providers (as of May 2026). All providers use the MAL ID
 * directly — no slug search or scraping required.
 *
 * Active providers:
 *   - VidLink.pro   (Sub + Dub)
 *   - NinjaShield   (Sub)
 *   - VidSrc.su     (Sub)
 */
class AnimeStreamService
{
    /**
     * Build all available server embed URLs for an episode.
     *
     * @param  int|null $malId        MyAnimeList ID from AniList
     * @param  int      $episode      Episode number (1-based)
     * @return array                  List of ['name', 'class', 'url', 'provider'] arrays
     */
    public function getServers(?int $malId, int $episode): array
    {
        if (!$malId) {
            return [];
        }

        return [
            [
                'name'     => 'VidLink — Sub',
                'class'    => 'vidlink-sub',
                'provider' => 'vidlink',
                'url'      => "https://vidlink.pro/anime/{$malId}/{$episode}/sub",
            ],
            [
                'name'     => 'VidLink — Dub',
                'class'    => 'vidlink-dub',
                'provider' => 'vidlink',
                'url'      => "https://vidlink.pro/anime/{$malId}/{$episode}/dub",
            ],
            [
                'name'     => 'NinjaShield',
                'class'    => 'ninjashield',
                'provider' => 'ninja',
                'url'      => "https://ninjasheild.stream/map/anime/{$malId}/{$episode}/sub",
            ],
            [
                'name'     => 'VidSrc',
                'class'    => 'vidsrc',
                'provider' => 'vidsrc',
                'url'      => "https://vidsrc.su/embed/anime/{$malId}/{$episode}/{$episode}",
            ],
        ];
    }
}
