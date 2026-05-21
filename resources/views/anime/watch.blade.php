@extends('layouts.app')

@section('title', 'Nonton ' . ($anime['title']['english'] ?? $anime['title']['romaji']) . ' - Episode ' . $episode . ' | Yuhengs')

@section('content')

    <!-- Breadcrumb -->
    <div style="margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-muted); font-family: var(--font-outfit);">
        <a href="{{ route('anime.index') }}" style="color: var(--text-muted); text-decoration: none; transition: var(--transition-smooth);" onmouseover="this.style.color='var(--gold-primary)'" onmouseout="this.style.color='var(--text-muted)'">Beranda</a> 
        <span style="margin: 0 0.5rem; color: var(--gold-primary);">/</span> 
        <span style="color: var(--text-main); font-weight: 600;">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</span>
        <span style="margin: 0 0.5rem; color: var(--gold-primary);">/</span> 
        <span style="color: var(--sakura-pink); font-weight: 600;">Episode {{ $episode }}</span>
    </div>

    <div class="watch-container">
        <!-- Left Column: Video Player & Server Selectors -->
        <div>
            <div class="player-wrapper">
                <div class="video-player-container">
                    @if(count($allServers) > 0)
                        <iframe 
                            id="player-iframe" 
                            src="{{ $allServers[0]['url'] }}" 
                            allowfullscreen="true" 
                            scrolling="no"
                            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                        ></iframe>
                    @else
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #000; text-align: center; padding: 2rem;">
                            <img src="/images/keqing-favicon.png" alt="Sad" style="width: 80px; height: 80px; margin-bottom: 1rem; opacity: 0.7;">
                            <h3 style="color: var(--sakura-pink); font-family: var(--font-outfit); margin-bottom: 0.5rem;">Tidak Ada Server Aktif</h3>
                            <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 400px;">Maaf, kami tidak berhasil memuat server streaming untuk episode ini. Silakan coba memuat ulang halaman.</p>
                        </div>
                    @endif
                </div>

                <!-- Server Selectors -->
                <div class="server-selector-container">
                    <div class="server-label">
                        <i class="fas fa-server"></i> Pilih Server Streaming (Anti-Lag / Mirror)
                    </div>
                    <div class="server-grid">
                        @foreach($allServers as $index => $server)
                            <button 
                                class="server-btn {{ $index === 0 ? 'active' : '' }}" 
                                data-url="{{ $server['url'] }}"
                                title="Klik untuk beralih ke {{ $server['name'] }}"
                            >
                                <i class="fas fa-play-circle"></i> {{ $server['name'] }}
                            </button>
                        @endforeach
                    </div>
                    <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
                        <i class="fas fa-info-circle" style="color: var(--gold-primary);"></i> 
                        <span>Jika video loading lambat atau tidak berputar, silakan klik salah satu tombol server di atas untuk berganti cermin!</span>
                    </div>
                </div>
            </div>
            
            <!-- Quick Episode Control Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--bg-card); border: 1px solid var(--glass-border); padding: 1rem 1.5rem; border-radius: 14px; font-family: var(--font-outfit);">
                @if($episode > 1)
                    <a href="{{ route('anime.watch', ['id' => $anime['id'], 'episode' => $episode - 1]) }}" class="server-btn" style="text-decoration: none;">
                        <i class="fas fa-chevron-left"></i> Episode Sebelumnya
                    </a>
                @else
                    <button class="server-btn" disabled style="opacity: 0.4; cursor: not-allowed;">
                        <i class="fas fa-chevron-left"></i> Episode Sebelumnya
                    </button>
                @endif
                
                <span style="font-weight: 700; color: var(--gold-primary);">EPISODE {{ $episode }} / {{ $totalEpisodes }}</span>
                
                @if($episode < $totalEpisodes)
                    <a href="{{ route('anime.watch', ['id' => $anime['id'], 'episode' => $episode + 1]) }}" class="server-btn active" style="text-decoration: none;">
                        Episode Selanjutnya <i class="fas fa-chevron-right"></i>
                    </a>
                @else
                    <button class="server-btn" disabled style="opacity: 0.4; cursor: not-allowed;">
                        Episode Selanjutnya <i class="fas fa-chevron-right"></i>
                    </button>
                @endif
            </div>
        </div>

        <!-- Right Column: Sidebar Panels (Episode Selectors) -->
        <div class="sidebar-panel">
            <div class="sidebar-title">
                <span>Daftar Episode</span>
                <span style="font-size: 0.8rem; background: rgba(255,215,0,0.15); color: var(--gold-primary); padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid var(--gold-primary);">
                    {{ $totalEpisodes }} Eps
                </span>
            </div>
            <div class="episode-grid">
                @for($i = 1; $i <= $totalEpisodes; $i++)
                    <a 
                        href="{{ route('anime.watch', ['id' => $anime['id'], 'episode' => $i]) }}" 
                        class="episode-link {{ $i == $episode ? 'active' : '' }}"
                    >
                        {{ $i }}
                    </a>
                @endfor
            </div>
        </div>
    </div>

    <!-- Anime Details Section Below Player -->
    <div class="watch-info-section">
        <img class="info-poster" src="{{ $anime['coverImage']['large'] }}" alt="{{ $anime['title']['romaji'] }}">
        <div class="info-details">
            <h1 class="info-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h1>
            
            <div class="info-studios">
                <i class="fas fa-palette"></i> Studio: 
                {{ $anime['studios']['nodes'][0]['name'] ?? 'N/A' }} 
                &bull; <i class="fas fa-star" style="color: var(--gold-primary);"></i> Rating: {{ number_format($anime['averageScore'] / 10, 1) }}
                &bull; <i class="fas fa-calendar-alt"></i> Tahun: {{ $anime['seasonYear'] ?? 'N/A' }}
                &bull; <i class="fas fa-info-circle"></i> Status: <span style="text-transform: capitalize;">{{ strtolower(str_replace('_', ' ', $anime['status'])) }}</span>
            </div>

            <div class="info-genres">
                @foreach($anime['genres'] as $genre)
                    <span class="genre-tag">{{ $genre }}</span>
                @endforeach
            </div>

            <div class="info-description">
                <p style="font-weight: 700; color: #ffffff; margin-bottom: 0.5rem; font-family: var(--font-outfit); font-size: 1.1rem; display: flex; align-items: center; gap: 0.35rem;">
                    <i class="fas fa-align-left" style="color: var(--sakura-pink);"></i> Sinopsis
                </p>
                {!! $anime['description'] ?? 'Tidak ada sinopsis tersedia untuk anime ini.' !!}
            </div>
        </div>
    </div>

@endsection
