<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Yuhengs - Premium Anime Streaming Platform')</title>
    <!-- Favicon Chibi Keqing -->
    <link rel="icon" type="image/png" href="/images/keqing-favicon.png">
    
    <!-- Theme CSS Styling -->
    <link rel="stylesheet" href="/css/keqing-theme.css">
    
    <!-- Glightbox or other tools if needed, but we keep it light and clean -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- Navigation Bar -->
    <nav class="navbar">
        <a href="{{ route('anime.index') }}" class="nav-brand">
            <img class="brand-img" src="/images/keqing-favicon.png" alt="Keqing Chibi">
            <span class="brand-text">Yuhengs</span>
        </a>
        
        <form action="{{ route('anime.index') }}" method="GET" class="nav-search-form">
            <input 
                type="text" 
                name="q" 
                class="nav-search-input" 
                placeholder="Cari anime favoritmu..." 
                value="{{ request('q') }}"
                autocomplete="off"
            >
            <button type="submit" class="nav-search-btn">
                <i class="fas fa-search"></i>
            </button>
        </form>
        
        <div style="display: flex; gap: 1.5rem; align-items: center; font-family: var(--font-outfit); font-weight: 600;">
            <a href="{{ route('anime.index') }}" style="color: var(--gold-primary); text-decoration: none; text-shadow: 0 0 5px var(--gold-glow);"><i class="fas fa-home"></i> Beranda</a>
            <a href="https://github.com/DoniArmanS/Yuhengs" target="_blank" style="color: var(--text-main); text-decoration: none; transition: var(--transition-smooth);" onmouseover="this.style.color='var(--purple-light)'" onmouseout="this.style.color='var(--text-main)'"><i class="fab fa-github"></i> GitHub</a>
        </div>
    </nav>

    <!-- Main Content Area -->
    <main class="container">
        @yield('content')
    </main>

    <!-- Footer -->
    <footer style="margin-top: 5rem; padding: 2.5rem 0; border-top: 1px solid var(--glass-border); background: rgba(8, 5, 22, 0.8); backdrop-filter: blur(12px); text-align: center; font-family: var(--font-outfit);">
        <p style="font-size: 1rem; color: #ffffff; margin-bottom: 0.5rem; font-weight: 600;">
            Dibuatkan dengan ❤️ oleh <span style="color: var(--purple-light);">Doni Arman</span> untuk <span style="color: var(--gold-primary);">Yuhengs</span>
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
            &copy; {{ date('Y') }} <a href="https://github.com/DoniArmanS" target="_blank" style="color: var(--purple-light); text-decoration: none; font-weight: 600;">Doni Arman</a>. All Rights Reserved. Data disediakan oleh AniList API.
        </p>
    </footer>

    <!-- Theme JS Logic -->
    <script src="/js/anime-player.js"></script>
</body>
</html>
