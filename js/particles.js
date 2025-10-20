/* ============================================
   AWE2M8 GREEN PARTICLE SYSTEM
   Interactive particle background with mouse interaction
   ============================================ */

(function () {
    'use strict';

    const canvas = document.getElementById('particle-canvas');
    if (!canvas) {
        console.warn('Particle canvas not found. Make sure to add <canvas id="particle-canvas"></canvas> to your HTML.');
        return;
    }

    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let mouse = {
        x: null,
        y: null,
        radius: 150
    };

    // Set canvas size
    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    setCanvasSize();

    // Handle window resize
    window.addEventListener('resize', () => {
        setCanvasSize();
        init();
    });

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    // Reset mouse when leaving window
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle class
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
            this.baseX = x;
            this.baseY = y;
        }

        // Draw individual particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }

        // Update particle position
        update() {
            // Bounce off edges
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Check mouse interaction
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    // Push particles away from mouse
                    let force = (mouse.radius - distance) / mouse.radius;
                    let directionX = dx / distance;
                    let directionY = dy / distance;

                    this.x -= directionX * force * 5;
                    this.y -= directionY * force * 5;
                }
            }

            // Return to base position when not near mouse
            if (mouse.x === null || mouse.y === null) {
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx / 20;
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY;
                    this.y -= dy / 20;
                }
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;

            this.draw();
        }
    }

    // Initialize particles
    function init() {
        particlesArray = [];

        // Calculate number of particles based on screen size
        let numberOfParticles = (canvas.width * canvas.height) / 9000;

        // Limit particles on mobile for performance
        if (window.innerWidth < 768) {
            numberOfParticles = numberOfParticles / 2;
        }

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;

            // Green color variations - matching AWE2M8 brand
            let greenShade = Math.floor(Math.random() * 3);
            let color;
            switch (greenShade) {
                case 0:
                    color = 'rgba(0, 255, 0, 0.8)';    // Bright green
                    break;
                case 1:
                    color = 'rgba(0, 204, 0, 0.7)';    // Medium green
                    break;
                case 2:
                    color = 'rgba(0, 255, 136, 0.6)';  // Light green
                    break;
            }

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Connect nearby particles with lines
    function connect() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                // Draw connection line if particles are close
                if (distance < 120) {
                    let opacity = 1 - (distance / 120);
                    ctx.strokeStyle = `rgba(0, 255, 0, ${opacity * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Draw mouse glow effect
    function drawMouseGlow() {
        if (mouse.x !== null && mouse.y !== null) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
            let gradient = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, mouse.radius
            );
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    // Animation loop
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw mouse glow
        drawMouseGlow();

        // Update and draw all particles
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }

        // Connect nearby particles
        connect();

        // Continue animation
        requestAnimationFrame(animate);
    }

    // Start the particle system
    init();
    animate();

    console.log('✨ AWE2M8 Green Particle System Active!');

})();