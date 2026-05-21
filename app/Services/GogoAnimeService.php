<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GogoAnimeService
{
    protected $baseUrl = 'https://gogoanime3.co';

    /**
     * Search anime on Gogoanime
     */
    public function search($query)
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->timeout(10)->get($this->baseUrl . '/search.html', [
                'keyword' => $query
            ]);

            if (!$response->successful()) {
                return [];
            }

            $html = $response->body();
            
            // Extract using regular expressions
            // E.g. <p class="name"><a href="/category/naruto-shippuden" title="Naruto Shippuden">Naruto Shippuden</a></p>
            preg_match_all('/<p class="name">\s*<a href="\/category\/([^"]+)" title="([^"]+)">/', $html, $matches);

            $results = [];
            if (!empty($matches[1])) {
                foreach ($matches[1] as $index => $slug) {
                    $results[] = [
                        'slug' => $slug,
                        'title' => html_entity_decode($matches[2][$index], ENT_QUOTES, 'UTF-8')
                    ];
                }
            }

            return $results;
        } catch (\Exception $e) {
            \Log::error("GogoAnime search error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Scrape episode servers
     */
    public function getEpisodeServers($slug, $episodeNumber)
    {
        try {
            $url = "{$this->baseUrl}/{$slug}-episode-{$episodeNumber}";
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->timeout(10)->get($url);

            if (!$response->successful()) {
                return [];
            }

            $html = $response->body();
            $servers = [];

            // Extract using class-based parsing
            // <li class="filemoon"><a href="#" data-video="https://filemoon.sx/e/xxxxx">Filemoon</a></li>
            preg_match_all('/<li class="([^"]+)"[^>]*>\s*<a href="[^"]*"[^>]*data-video="([^"]+)"[^>]*>([^<]+)<\/a>/i', $html, $matches);

            if (!empty($matches[2])) {
                foreach ($matches[2] as $index => $videoUrl) {
                    $serverClass = strtolower(trim($matches[1][$index]));
                    $serverName = trim($matches[3][$index]);
                    
                    if (Str::startsWith($videoUrl, '//')) {
                        $videoUrl = 'https:' . $videoUrl;
                    }

                    $servers[] = [
                        'name' => html_entity_decode($serverName, ENT_QUOTES, 'UTF-8'),
                        'class' => $serverClass,
                        'url' => $videoUrl
                    ];
                }
            }

            // Fallback: If no server class tags matched, extract all data-video attributes
            if (empty($servers)) {
                preg_match_all('/data-video="([^"]+)"/i', $html, $matchesVideo);
                if (!empty($matchesVideo[1])) {
                    foreach ($matchesVideo[1] as $index => $videoUrl) {
                        if (Str::startsWith($videoUrl, '//')) {
                            $videoUrl = 'https:' . $videoUrl;
                        }
                        
                        $name = 'Server ' . ($index + 1);
                        if (str_contains($videoUrl, 'filemoon')) {
                            $name = 'Filemoon';
                        } elseif (str_contains($videoUrl, 'mp4upload')) {
                            $name = 'Mp4Upload';
                        } elseif (str_contains($videoUrl, 'gogoplay') || str_contains($videoUrl, 'embtaku') || str_contains($videoUrl, 'embed')) {
                            $name = 'Gogo Play';
                        }
                        
                        $servers[] = [
                            'name' => $name,
                            'class' => strtolower($name),
                            'url' => $videoUrl
                        ];
                    }
                }
            }

            return $servers;
        } catch (\Exception $e) {
            \Log::error("GogoAnime getEpisodeServers error: " . $e->getMessage());
            return [];
        }
    }
}
