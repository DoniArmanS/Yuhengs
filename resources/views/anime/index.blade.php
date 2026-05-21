@extends('layouts.app')

@section('title', 'Yuhengs - Premium Anime Streaming Platform')

@section('content')

    @if(!$search)
        <!-- Premium hero banner -->
        <section class="hero-section">
            <div class="hero-content">
                <p class="hero-subtitle">Premium Anime Streaming</p>
                <h1 class="hero-title">Selamat Datang di Yuhengs</h1>
                <p class="hero-desc">
                    Tonton anime terpopuler sepanjang masa dengan kualitas super jernih, loading super cepat, dan multi-server mirror bebas lag. Rasakan pengalaman streaming terbaik dengan berbagai server premium pilihan!
                </p>
                <div class="hero-badge-container">
                    <span class="hero-badge highlight"><i class="fas fa-bolt"></i> High Speed Servers</span>
                    <span class="hero-badge"><i class="fas fa-shield-alt"></i> Secure & Safe</span>
                    <span class="hero-badge"><i class="fas fa-heart"></i> Ad-Free Player</span>
                </div>
            </div>
        </section>

        <!-- Trending Anime List -->
        <section>
            <h2 class="section-title">
                <i class="fas fa-fire" style="color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);"></i> 
                Anime Sedang <span class="accent">Tren</span>
            </h2>
            <div class="anime-grid">
                @forelse($trendingList as $anime)
                    <div class="anime-card" onclick="window.location='{{ route('anime.watch', ['id' => $anime['id']]) }}'">
                        <div class="anime-cover-wrapper">
                            <span class="anime-rating">
                                <i class="fas fa-star"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                            </span>
                            <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="{{ $anime['title']['romaji'] }}">
                        </div>
                        <div class="anime-card-content">
                            <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                            <div class="anime-meta">
                                <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                            </div>
                        </div>
                    </div>
                @empty
                    <p style="color: var(--text-muted);">Tidak ada anime tren saat ini.</p>
                @endforelse
            </div>
        </section>

        <!-- Popular Anime List -->
        <section>
            <h2 class="section-title">
                <i class="fas fa-trophy" style="color: var(--gold-primary); text-shadow: 0 0 10px var(--gold-glow);"></i> 
                Anime Paling <span class="accent">Populer</span>
            </h2>
            <div class="anime-grid">
                @forelse($popularList as $anime)
                    <div class="anime-card" onclick="window.location='{{ route('anime.watch', ['id' => $anime['id']]) }}'">
                        <div class="anime-cover-wrapper">
                            <span class="anime-rating">
                                <i class="fas fa-star"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                            </span>
                            <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="{{ $anime['title']['romaji'] }}">
                        </div>
                        <div class="anime-card-content">
                            <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                            <div class="anime-meta">
                                <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                            </div>
                        </div>
                    </div>
                @empty
                    <p style="color: var(--text-muted);">Tidak ada anime populer saat ini.</p>
                @endforelse
            </div>
        </section>

        <!-- Latest Anime List -->
        <section>
            <h2 class="section-title">
                <i class="fas fa-calendar-alt" style="color: var(--purple-light); text-shadow: 0 0 10px rgba(192, 132, 252, 0.4);"></i> 
                Anime Rilis <span class="accent">Terbaru</span>
            </h2>
            <div class="anime-grid">
                @forelse($latestList as $anime)
                    <div class="anime-card" onclick="window.location='{{ route('anime.watch', ['id' => $anime['id']]) }}'">
                        <div class="anime-cover-wrapper">
                            <span class="anime-rating">
                                <i class="fas fa-star"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                            </span>
                            <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="{{ $anime['title']['romaji'] }}">
                        </div>
                        <div class="anime-card-content">
                            <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                            <div class="anime-meta">
                                <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                            </div>
                        </div>
                    </div>
                @empty
                    <p style="color: var(--text-muted);">Tidak ada anime terbaru saat ini.</p>
                @endforelse
            </div>
        </section>
    @else
        <!-- Search Results list -->
        <section>
            <h2 class="section-title">
                <i class="fas fa-search" style="color: var(--purple-light);"></i> 
                Hasil Pencarian untuk: <span class="accent">"{{ $search }}"</span>
            </h2>
            
            @if(count($animeList) > 0)
                <div class="anime-grid">
                    @foreach($animeList as $anime)
                        <div class="anime-card" onclick="window.location='{{ route('anime.watch', ['id' => $anime['id']]) }}'">
                            <div class="anime-cover-wrapper">
                                <span class="anime-rating">
                                    <i class="fas fa-star"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                                </span>
                                <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="{{ $anime['title']['romaji'] }}">
                            </div>
                            <div class="anime-card-content">
                                <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                                <div class="anime-meta">
                                    <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                    <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="empty-search">
                    <img class="empty-search-img" src="/images/keqing-favicon.png" alt="Keqing Sedih Chibi">
                    <h3>Pencarian Tidak Ditemukan</h3>
                    <p>Maaf, kami tidak dapat menemukan anime "{{ $search }}" di database kami. Silakan coba kata kunci lain!</p>
                </div>
            @endif
        </section>
    @endif

@endsection
