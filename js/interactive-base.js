/* ============================================
   AWE2M8 INTERACTIVE EFFECTS
   Foundation interactions: scroll reveals, 3D tilts, animations
   Loaded on: All pages
   ============================================ */

// ============================================
// 1. SCROLL REVEAL ANIMATIONS
// ============================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Animate all column boxes on scroll
    document.querySelectorAll('.column-box, .demo-card').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// ============================================
// 2. 3D CARD TILT EFFECT
// ============================================
function init3DTilt() {
    const cards = document.querySelectorAll('.demo-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateY(-12px) 
        scale(1.02)
      `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ============================================
// 3. SMOOTH SCROLL FOR INTERNAL LINKS
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// 4. CURSOR TRAIL EFFECT (Optional - cool!)
// ============================================
function initCursorTrail() {
    const coords = { x: 0, y: 0 };
    const circles = [];
    const numCircles = 20;

    // Create circles
    for (let i = 0; i < numCircles; i++) {
        const circle = document.createElement('div');
        circle.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.8), transparent);
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.1s ease;
    `;
        document.body.appendChild(circle);
        circles.push(circle);
    }

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        coords.x = e.clientX;
        coords.y = e.clientY;
    });

    // Animate circles
    function animateCircles() {
        let x = coords.x;
        let y = coords.y;

        circles.forEach((circle, index) => {
            circle.style.left = x - 10 + 'px';
            circle.style.top = y - 10 + 'px';
            circle.style.transform = `scale(${(numCircles - index) / numCircles})`;
            circle.style.opacity = (numCircles - index) / numCircles;

            const nextCircle = circles[index + 1] || circles[0];
            x += (nextCircle.offsetLeft - circle.offsetLeft) * 0.3;
            y += (nextCircle.offsetTop - circle.offsetTop) * 0.3;
        });

        requestAnimationFrame(animateCircles);
    }

    animateCircles();
}

// ============================================
// 5. MAGNETIC BUTTONS
// ============================================
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.card-link, .back-btn');

    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });
}

// ============================================
// 6. PARALLAX EFFECT ON SCROLL
// ============================================
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');

        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            hero.style.opacity = 1 - (scrolled / 500);
        }
    });
}

// ============================================
// 7. EMOJI FLOATING ANIMATION TRIGGER
// ============================================
function initEmojiFloat() {
    const emojis = document.querySelectorAll('.demo-icon, .cta-emoji');

    emojis.forEach((emoji, index) => {
        emoji.style.animationDelay = `${index * 0.2}s`;
    });
}

// ============================================
// 8. VIDEO LAZY LOADING
// ============================================
function initVideoLazyLoad() {
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const iframe = entry.target.querySelector('iframe');
                if (iframe && iframe.dataset.src) {
                    iframe.src = iframe.dataset.src;
                    videoObserver.unobserve(entry.target);
                }
            }
        });
    });

    document.querySelectorAll('.video-in-column').forEach(container => {
        videoObserver.observe(container);
    });
}

// ============================================
// 9. GRADIENT BACKGROUND MOUSE FOLLOW
// ============================================
function initGradientFollow() {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        document.body.style.setProperty('--mouse-x', `${x}%`);
        document.body.style.setProperty('--mouse-y', `${y}%`);
    });
}

// ============================================
// 10. DEMO CARD SEQUENTIAL LOAD
// ============================================
function initSequentialLoad() {
    const cards = document.querySelectorAll('.demo-card');

    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = 'fadeInUp 0.6s ease forwards';
        }, index * 50);
    });
}

// ============================================
// INITIALIZATION - Call all effects
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Essential effects (always run)
    initScrollAnimations();
    init3DTilt();
    initSmoothScroll();
    initMagneticButtons();
    initEmojiFloat();

    // Optional effects (comment out if too much)
    // initCursorTrail(); // Uncomment for cursor trail
    initParallax();
    initGradientFollow();
    initSequentialLoad();

    console.log('🎨 AWE2M8 Interactive Effects Loaded!');
});

// ============================================
// BONUS: Header shrink on scroll
// ============================================
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.padding = '12px 30px';
        header.style.background = 'rgba(15, 15, 35, 0.95)';
    } else {
        header.style.padding = '20px 30px';
        header.style.background = 'rgba(255, 255, 255, 0.05)';
    }

    lastScroll = currentScroll;
});