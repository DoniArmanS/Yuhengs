/**
 * Yuhengs Anime Player JavaScript
 * Implements server switching with loading states and smooth transitions
 * UI/UX Pro Max Edition
 */

document.addEventListener('DOMContentLoaded', () => {
    initServerSwitch();
});

/**
 * Server Selector Logic & Iframe Loading States
 */
function initServerSwitch() {
    const serverButtons = document.querySelectorAll('.server-btn[data-url]');
    const playerIframe = document.getElementById('player-iframe');
    const playerLoader = document.getElementById('player-loader');
    
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!serverButtons.length || !playerIframe) return;

    // Initial load handling
    playerIframe.addEventListener('load', () => {
        if (playerLoader) playerLoader.style.display = 'none';
        
        if (prefersReducedMotion) {
            playerIframe.classList.remove('iframe-loading');
            playerIframe.classList.add('iframe-loaded');
            playerIframe.style.opacity = '1';
        } else {
            playerIframe.classList.remove('iframe-loading');
            playerIframe.classList.add('iframe-loaded');
        }
    });

    serverButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (button.classList.contains('active')) return;
            
            // Update button states
            serverButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const videoUrl = button.getAttribute('data-url');
            if (videoUrl) {
                // Show loader and hide iframe temporarily
                if (playerLoader) playerLoader.style.display = 'flex';
                
                if (!prefersReducedMotion) {
                    playerIframe.classList.remove('iframe-loaded');
                    playerIframe.classList.add('iframe-loading');
                } else {
                    playerIframe.style.opacity = '0';
                }
                
                // Set small timeout to allow UI to update before heavy iframe load
                setTimeout(() => {
                    playerIframe.setAttribute('src', videoUrl);
                }, 50);
            }
        });
    });
}
