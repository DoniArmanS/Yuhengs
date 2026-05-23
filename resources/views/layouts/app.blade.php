<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="description" content="Yuhengs - Platform Streaming Anime Premium Keqing-Themed dengan multi-server resolusi tinggi.">
    <title>@yield('title', 'Yuhengs - Premium Anime Streaming Platform')</title>
    
    <!-- Favicon Chibi Keqing -->
    <link rel="icon" type="image/png" href="/images/keqing-favicon.png">
    
    <!-- Theme CSS Styling -->
    <link rel="stylesheet" href="/css/keqing-theme.css">
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- Navigation Bar -->
    <nav class="navbar" aria-label="Main Navigation">
        <a href="{{ route('anime.index') }}" class="nav-brand" aria-label="Yuhengs Home">
            <img class="brand-img" src="/images/keqing-favicon.png" alt="Keqing Chibi Logo">
            <span class="brand-text">Yuhengs</span>
        </a>
        
        <form action="{{ route('anime.index') }}" method="GET" class="nav-search-form" role="search">
            <input 
                type="text" 
                name="q" 
                class="nav-search-input" 
                placeholder="Cari anime favoritmu..." 
                value="{{ request('q') }}"
                autocomplete="off"
                aria-label="Search anime"
            >
            <button type="submit" class="nav-search-btn" aria-label="Search Button">
                <i class="fas fa-search" aria-hidden="true"></i>
            </button>
        </form>
        
        <div class="nav-links">
            <a href="{{ route('anime.index') }}" class="nav-link {{ request()->is('/') ? 'active' : '' }}">
                <i class="fas fa-home" aria-hidden="true"></i> Beranda
            </a>
            <a href="https://github.com/DoniArmanS/Yuhengs" target="_blank" rel="noopener noreferrer" class="nav-link">
                <i class="fab fa-github" aria-hidden="true"></i> GitHub
            </a>
        </div>
    </nav>

    <!-- Main Content Area -->
    <main class="container" id="main-content">
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="site-footer">
        <p class="footer-text">
            Dibuatkan dengan ❤️ oleh <span class="highlight-purple">Doni Arman</span> untuk <span class="highlight-gold">Yuhengs</span>
        </p>
        <p class="footer-subtext">
            &copy; {{ date('Y') }} <a href="https://github.com/DoniArmanS" target="_blank" rel="noopener noreferrer">Doni Arman</a>. All Rights Reserved. Data disediakan oleh AniList API.
        </p>
    </footer>

    <!-- Theme JS Logic -->
    <script src="/js/anime-player.js"></script>
</body>
</html>
