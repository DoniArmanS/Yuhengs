/**
 * Yuhengs Anime Player JavaScript
 * Implements server switching and high-performance HTML5 Canvas falling Sakura petals.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialise Server Switching
    initServerSwitch();

    // 2. Initialise Falling Sakura Animation
    initSakuraAnimation();
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

/**
 * Sakura Petals falling background animation on HTML5 Canvas
 */
function initSakuraAnimation() {
    const canvas = document.getElementById('sakura-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Resize handler
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Petal class definition
    class SakuraPetal {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height - 20;
            this.size = Math.random() * 8 + 6;
            this.speedX = Math.random() * 1.5 - 0.5;
            this.speedY = Math.random() * 1.5 + 1.0;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 2 - 1;
            this.opacity = Math.random() * 0.4 + 0.4;
            
            // Soft sakura pink colors
            const pinks = ['#ffb7c5', '#ffe4e8', '#ffa6c9', '#ffccd5'];
            this.color = pinks[Math.floor(Math.random() * pinks.length)];
        }

        update() {
            this.x += this.speedX + Math.sin(this.y / 30) * 0.5; // Wind wave drift
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;

            // Reset petal when it leaves screen
            if (this.y > height || this.x > width || this.x < -20) {
                this.x = Math.random() * width;
                this.y = -20;
                this.speedX = Math.random() * 1.5 - 0.5;
                this.speedY = Math.random() * 1.5 + 1.0;
                this.opacity = Math.random() * 0.4 + 0.4;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            
            // Draw a realistic cherry blossom petal shape
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            // Small notch in petal
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(this.size + 2, -1);
            ctx.lineTo(this.size + 2, 1);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.restore();
        }
    }

    // Initialize petals array
    const maxPetals = 45; // Performance-friendly petal count
    const petals = [];
    for (let i = 0; i < maxPetals; i++) {
        petals.push(new SakuraPetal());
    }

    // Electro spark helper (subtle, occasional Keqing theme lightnings)
    class ElectroSpark {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.length = Math.random() * 20 + 10;
            this.active = false;
            this.opacity = 0;
            this.points = [];
        }

        trigger() {
            this.active = true;
            this.opacity = Math.random() * 0.5 + 0.5;
            this.points = [{ x: this.x, y: this.y }];
            
            let cx = this.x;
            let cy = this.y;
            const segments = 4;
            for (let i = 0; i < segments; i++) {
                cx += Math.random() * 16 - 8;
                cy += Math.random() * 15 + 5;
                this.points.push({ x: cx, y: cy });
            }
        }

        update() {
            if (!this.active) {
                // Occasional trigger chance (very low to keep it clean)
                if (Math.random() < 0.0005) {
                    this.trigger();
                }
                return;
            }

            this.opacity -= 0.08;
            if (this.opacity <= 0) {
                this.active = false;
                this.reset();
            }
        }

        draw() {
            if (!this.active || this.points.length === 0) return;

            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.strokeStyle = '#bd93f9'; // Electric purple/magenta
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#a855f7';
            
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    // Initialize occasional electro sparks
    const maxSparks = 2;
    const sparks = [];
    for (let i = 0; i < maxSparks; i++) {
        sparks.push(new ElectroSpark());
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update and draw petals
        petals.forEach(petal => {
            petal.update();
            petal.draw();
        });

        // Update and draw electro sparks
        sparks.forEach(spark => {
            spark.update();
            spark.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();
}
