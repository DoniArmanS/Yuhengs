@extends('layouts.app')

@section('title', 'Nonton ' . ($anime['title']['english'] ?? $anime['title']['romaji']) . ' - Episode ' . $episode . ' | Yuhengs')

@section('content')

    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="{{ route('anime.index') }}" class="breadcrumb-link">Beranda</a> 
        <span class="breadcrumb-separator" aria-hidden="true">/</span> 
        <span class="breadcrumb-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</span>
        <span class="breadcrumb-separator" aria-hidden="true">/</span> 
        <span class="breadcrumb-current">Episode {{ $episode }}</span>
    </nav>

    <div class="watch-container">
        <!-- Left Column: Video Player & Server Selectors -->
        <div>
            <div class="player-wrapper">
                <div class="video-player-container" id="video-container">
                    @if(count($allServers) > 0)
                        <!-- Loading Indicator -->
                        <div class="player-loader" id="player-loader">
                            <div class="spinner"></div>
                            <span>Memuat Video...</span>
                        </div>
                        
                        <iframe 
                            id="player-iframe" 
                            src="{{ $allServers[0]['url'] }}" 
                            allowfullscreen="true" 
                            scrolling="no"
                            class="iframe-loading"
                            title="Video Player"
                        ></iframe>
                    @else
                        <div class="empty-state in-player">
                            <img src="/images/keqing-favicon.png" alt="Sad Keqing" class="empty-state-img" style="opacity: 0.7;">
                            <h3>Tidak Ada Server Aktif</h3>
                            <p>Maaf, kami tidak berhasil memuat server streaming untuk episode ini. Silakan coba episode lain.</p>
                        </div>
                    @endif
                </div>

                <!-- Server Selectors -->
                <div class="server-selector-container">
                    <div class="server-label">
                        <i class="fas fa-server" aria-hidden="true"></i> Pilih Server Streaming
                    </div>
                    <div class="server-grid" role="group" aria-label="Server selectors">
                        @foreach($allServers as $index => $server)
                            @php
                                $icon = 'fa-play-circle';
                                if($server['provider'] === 'vidlink') $icon = 'fa-video';
                                if($server['provider'] === 'ninja') $icon = 'fa-user-ninja';
                                if($server['provider'] === 'vidsrc') $icon = 'fa-film';
                            @endphp
                            <button 
                                class="server-btn {{ $index === 0 ? 'active' : '' }}" 
                                data-url="{{ $server['url'] }}"
                                aria-label="Play from {{ $server['name'] }}"
                            >
                                <i class="fas {{ $icon }}" aria-hidden="true"></i> {{ $server['name'] }}
                            </button>
                        @endforeach
                    </div>
                    <div class="server-info-text">
                        <i class="fas fa-info-circle" aria-hidden="true"></i> 
                        <span>Jika video loading lambat atau tidak berputar, silakan klik salah satu tombol server di atas untuk berganti cermin!</span>
                    </div>
                </div>
            </div>
            
            <!-- Quick Episode Control Bar -->
            <div class="episode-controls">
                @if($episode > 1)
                    <a href="{{ route('anime.watch', ['id' => $anime['id'], 'episode' => $episode - 1]) }}" class="server-btn">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i> Sebelumnya
                    </a>
                @else
                    <button class="server-btn disabled" disabled aria-disabled="true">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i> Sebelumnya
                    </button>
                @endif
                
                <span class="episode-controls-status">EPISODE {{ $episode }} / {{ $totalEpisodes > 0 ? $totalEpisodes : '?' }}</span>
                
                @if($totalEpisodes == 0 || $episode < $totalEpisodes)
                    <a href="{{ route('anime.watch', ['id' => $anime['id'], 'episode' => $episode + 1]) }}" class="server-btn active">
                        Selanjutnya <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </a>
                @else
                    <button class="server-btn disabled" disabled aria-disabled="true">
                        Selanjutnya <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                @endif
            </div>
        </div>

        <!-- Right Column: Sidebar Panels (Episode Selectors) -->
        <aside class="sidebar-panel">
            <div class="sidebar-title">
                <span>Daftar Episode</span>
                <span class="sidebar-badge">
                    {{ $totalEpisodes > 0 ? $totalEpisodes . ' Eps' : 'Ongoing' }}
                </span>
            </div>
            <div class="episode-grid" role="navigation" aria-label="Episode list">
                @php
                    $displayTotal = $totalEpisodes > 0 ? $totalEpisodes : max($episode + 5, 24);
                @endphp
                @for($i = 1; $i <= $displayTotal; $i++)
                    <a 
                        href="{{ route('anime.watch', ['id' => $anime['id'], 'episode' => $i]) }}" 
                        class="episode-link {{ $i == $episode ? 'active' : '' }}"
                        aria-label="Episode {{ $i }}"
                        {{ $i == $episode ? 'aria-current=page' : '' }}
                    >
                        {{ $i }}
                    </a>
                @endfor
            </div>
        </aside>
    </div>

    <!-- Anime Details Section Below Player -->
    <section class="watch-info-section" aria-labelledby="anime-details-title">
        <img class="info-poster" src="{{ $anime['coverImage']['large'] }}" alt="Poster {{ $anime['title']['romaji'] }}">
        <div class="info-details">
            <h1 class="info-title" id="anime-details-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h1>
            
            <div class="info-studios">
                <span><i class="fas fa-palette" aria-hidden="true"></i> {{ $anime['studios']['nodes'][0]['name'] ?? 'Studio N/A' }}</span>
                <span class="separator">&bull;</span>
                <span><i class="fas fa-star" aria-hidden="true"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}</span>
                <span class="separator">&bull;</span>
                <span><i class="fas fa-calendar-alt" aria-hidden="true"></i> {{ $anime['seasonYear'] ?? 'N/A' }}</span>
                <span class="separator">&bull;</span>
                <span><i class="fas fa-info-circle" aria-hidden="true"></i> <span style="text-transform: capitalize;">{{ strtolower(str_replace('_', ' ', $anime['status'])) }}</span></span>
            </div>

            <div class="info-genres" aria-label="Genres">
                @foreach($anime['genres'] as $genre)
                    <span class="genre-tag">{{ $genre }}</span>
                @endforeach
            </div>

            <div class="info-description">
                <p class="info-description-title">
                    <i class="fas fa-align-left" aria-hidden="true"></i> Sinopsis
                </p>
                <div class="info-description-content">
                    {!! $anime['description'] ?? 'Tidak ada sinopsis tersedia untuk anime ini.' !!}
                </div>
            </div>
        </div>
    </section>

@endsection
