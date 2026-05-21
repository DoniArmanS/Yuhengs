/**
 * Yuhengs Anime Player JavaScript
 * Implements server switching and high-performance HTML5 Canvas falling Sakura petals.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialise Server Switching
    initServerSwitch();
});

/**
 * Server Selector Logic
 */
function initServerSwitch() {
    const serverButtons = document.querySelectorAll('.server-btn');
    const playerIframe = document.getElementById('player-iframe');

    if (!serverButtons || !playerIframe) return;

    serverButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            serverButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');

            // Change iframe source
            const videoUrl = button.getAttribute('data-url');
            if (videoUrl) {
                playerIframe.setAttribute('src', videoUrl);
            }
        });
    });
}

    // Sakura animation removed for performance
