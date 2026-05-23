@extends('layouts.app')

@section('title', 'Yuhengs - Premium Anime Streaming Platform')

@section('content')

    @if(!$search)
        <!-- Premium hero banner -->
        <section class="hero-section" aria-labelledby="hero-title">
            <div class="hero-content">
                <p class="hero-subtitle">Premium Anime Streaming</p>
                <h1 class="hero-title" id="hero-title">Selamat Datang di Yuhengs</h1>
                <p class="hero-desc">
                    Tonton anime terpopuler sepanjang masa dengan kualitas super jernih, loading super cepat, dan multi-server mirror bebas lag. Rasakan pengalaman streaming terbaik dengan antarmuka premium Keqing!
                </p>
                <div class="hero-badge-container">
                    <span class="hero-badge highlight"><i class="fas fa-bolt" aria-hidden="true"></i> High Speed Servers</span>
                    <span class="hero-badge"><i class="fas fa-shield-alt" aria-hidden="true"></i> Secure & Safe</span>
                    <span class="hero-badge"><i class="fas fa-heart" aria-hidden="true"></i> Ad-Free Player</span>
                </div>
            </div>
        </section>

        <!-- Trending Anime List -->
        <section aria-labelledby="trending-title">
            <h2 class="section-title" id="trending-title">
                <i class="fas fa-fire" style="color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);" aria-hidden="true"></i> 
                Anime Sedang <span class="accent">Tren</span>
            </h2>
            <div class="anime-grid" role="list">
                @forelse($trendingList as $anime)
                    <a href="{{ route('anime.watch', ['id' => $anime['id']]) }}" class="anime-card" role="listitem">
                        <div class="anime-cover-wrapper">
                            <span class="anime-rating">
                                <i class="fas fa-star" aria-hidden="true"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                            </span>
                            <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="Poster {{ $anime['title']['english'] ?? $anime['title']['romaji'] }}" loading="lazy">
                        </div>
                        <div class="anime-card-content">
                            <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                            <div class="anime-meta">
                                <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                            </div>
                        </div>
                    </a>
                @empty
                    <p class="empty-state"><i class="fas fa-ghost"></i> Tidak ada anime tren saat ini.</p>
                @endforelse
            </div>
        </section>

        <!-- Popular Anime List -->
        <section aria-labelledby="popular-title">
            <h2 class="section-title" id="popular-title">
                <i class="fas fa-trophy" style="color: var(--gold-primary); text-shadow: 0 0 10px var(--gold-glow);" aria-hidden="true"></i> 
                Anime Paling <span class="accent">Populer</span>
            </h2>
            <div class="anime-grid" role="list">
                @forelse($popularList as $anime)
                    <a href="{{ route('anime.watch', ['id' => $anime['id']]) }}" class="anime-card" role="listitem">
                        <div class="anime-cover-wrapper">
                            <span class="anime-rating">
                                <i class="fas fa-star" aria-hidden="true"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                            </span>
                            <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="Poster {{ $anime['title']['english'] ?? $anime['title']['romaji'] }}" loading="lazy">
                        </div>
                        <div class="anime-card-content">
                            <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                            <div class="anime-meta">
                                <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                            </div>
                        </div>
                    </a>
                @empty
                    <p class="empty-state"><i class="fas fa-ghost"></i> Tidak ada anime populer saat ini.</p>
                @endforelse
            </div>
        </section>

        <!-- Latest Anime List -->
        <section aria-labelledby="latest-title">
            <h2 class="section-title" id="latest-title">
                <i class="fas fa-calendar-alt" style="color: var(--purple-light); text-shadow: 0 0 10px rgba(167, 139, 250, 0.4);" aria-hidden="true"></i> 
                Anime Rilis <span class="accent">Terbaru</span>
            </h2>
            <div class="anime-grid" role="list">
                @forelse($latestList as $anime)
                    <a href="{{ route('anime.watch', ['id' => $anime['id']]) }}" class="anime-card" role="listitem">
                        <div class="anime-cover-wrapper">
                            <span class="anime-rating">
                                <i class="fas fa-star" aria-hidden="true"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                            </span>
                            <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="Poster {{ $anime['title']['english'] ?? $anime['title']['romaji'] }}" loading="lazy">
                        </div>
                        <div class="anime-card-content">
                            <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                            <div class="anime-meta">
                                <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                            </div>
                        </div>
                    </a>
                @empty
                    <p class="empty-state"><i class="fas fa-ghost"></i> Tidak ada anime terbaru saat ini.</p>
                @endforelse
            </div>
        </section>
    @else
        <!-- Search Results list -->
        <section aria-labelledby="search-title">
            <h2 class="section-title" id="search-title">
                <i class="fas fa-search" style="color: var(--purple-light);" aria-hidden="true"></i> 
                Hasil Pencarian untuk: <span class="accent">"{{ $search }}"</span>
            </h2>
            
            @if(count($animeList) > 0)
                <div class="anime-grid" role="list">
                    @foreach($animeList as $anime)
                        <a href="{{ route('anime.watch', ['id' => $anime['id']]) }}" class="anime-card" role="listitem">
                            <div class="anime-cover-wrapper">
                                <span class="anime-rating">
                                    <i class="fas fa-star" aria-hidden="true"></i> {{ $anime['averageScore'] ? number_format($anime['averageScore'] / 10, 1) : 'N/A' }}
                                </span>
                                <img class="anime-cover" src="{{ $anime['coverImage']['extraLarge'] ?? $anime['coverImage']['large'] }}" alt="Poster {{ $anime['title']['english'] ?? $anime['title']['romaji'] }}" loading="lazy">
                            </div>
                            <div class="anime-card-content">
                                <h3 class="anime-title">{{ $anime['title']['english'] ?? $anime['title']['romaji'] }}</h3>
                                <div class="anime-meta">
                                    <span>{{ $anime['seasonYear'] ?? 'N/A' }}</span>
                                    <span class="anime-episodes-badge">{{ $anime['episodes'] ?? '?' }} Ep</span>
                                </div>
                            </div>
                        </a>
                    @endforeach
                </div>
            @else
                <div class="empty-state">
                    <img class="empty-state-img" src="/images/keqing-favicon.png" alt="Keqing Sedih Chibi">
                    <h3>Pencarian Tidak Ditemukan</h3>
                    <p>Maaf, kami tidak dapat menemukan anime "{{ $search }}" di database kami. Silakan coba kata kunci lain!</p>
                </div>
            @endif
        </section>
    @endif

@endsection
