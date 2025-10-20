/* ============================================
   AWE2M8 PREMIUM FEATURES
   Scroll Progress Bar, Page Transitions, Floating CTA
   ============================================ */

(function () {
    'use strict';

    // ============================================
    // 1. SCROLL PROGRESS BAR
    // ============================================
    function initScrollProgress() {
        // Create progress bar element
        const progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #00ff00, #00ff88);
            z-index: 9999;
            transition: width 0.1s ease;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        `;
        document.body.appendChild(progressBar);

        // Update progress on scroll
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });

        console.log('✅ Scroll Progress Bar Active');
    }

    // ============================================
    // 2. SMOOTH PAGE TRANSITIONS
    // ============================================
    function initPageTransitions() {
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.id = 'page-transition';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a0a 0%, #001a00 50%, #003300 100%);
            z-index: 99999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Add loading animation
        const loader = document.createElement('div');
        loader.style.cssText = `
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 255, 0, 0.3);
            border-top: 3px solid #00ff00;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        overlay.appendChild(loader);
        document.body.appendChild(overlay);

        // Add spin animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Fade in on page load
        window.addEventListener('load', () => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.pointerEvents = 'none';
            }, 400);
        });

        // Intercept link clicks for smooth transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');

            // Only handle internal links
            if (link && link.href &&
                link.href.indexOf(window.location.origin) === 0 &&
                !link.target &&
                !link.href.includes('#') &&
                !link.classList.contains('no-transition')) {

                e.preventDefault();

                // Show transition
                overlay.style.pointerEvents = 'auto';
                overlay.style.opacity = '1';

                // Navigate after animation
                setTimeout(() => {
                    window.location.href = link.href;
                }, 400);
            }
        });

        console.log('✅ Page Transitions Active');
    }

    // ============================================
    // 3. FLOATING CTA BUTTON
    // ============================================
    function initFloatingCTA() {
        // Create floating CTA
        const floatingCTA = document.createElement('a');
        floatingCTA.id = 'floating-cta';
        floatingCTA.href = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ11Zg2t9jtgPXR8kXwyLgtYjeV-nxazMBMvtVRkJWVN65wXfQyYO_35VMCxVQ6ONlF6TQKFJiYU'; // Update with your booking link
        floatingCTA.target = '_blank';
        floatingCTA.innerHTML = `
            <span class="cta-icon">🚀</span>
            <span class="cta-text">Book a Demo</span>
        `;
        floatingCTA.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            color: #000000;
            padding: 15px 25px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            z-index: 9998;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
        `;

        // Add styles for icon and text
        const ctaStyle = document.createElement('style');
        ctaStyle.textContent = `
            #floating-cta:hover {
                transform: translateY(-5px) scale(1.05);
                box-shadow: 0 6px 30px rgba(0, 255, 0, 0.6);
            }

            #floating-cta .cta-icon {
                font-size: 1.2em;
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            #floating-cta .cta-text {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }

            /* Hide on mobile to not block content */
            @media (max-width: 768px) {
                #floating-cta {
                    bottom: 80px;
                    right: 15px;
                    padding: 12px 20px;
                    font-size: 0.9rem;
                }
                
                #floating-cta .cta-text {
                    display: none;
                }
                
                #floating-cta .cta-icon {
                    font-size: 1.5em;
                    margin: 0;
                }
            }
        `;
        document.head.appendChild(ctaStyle);
        document.body.appendChild(floatingCTA);

        // Show CTA after scrolling down a bit
        let ctaShown = false;
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;

            if (scrolled > 300 && !ctaShown) {
                floatingCTA.style.opacity = '1';
                floatingCTA.style.transform = 'translateY(0)';
                floatingCTA.style.pointerEvents = 'auto';
                ctaShown = true;
            } else if (scrolled <= 300 && ctaShown) {
                floatingCTA.style.opacity = '0';
                floatingCTA.style.transform = 'translateY(20px)';
                floatingCTA.style.pointerEvents = 'none';
                ctaShown = false;
            }
        });

        // Add ripple effect on click
        floatingCTA.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                width: 100px;
                height: 100px;
                margin-top: -50px;
                margin-left: -50px;
                animation: ripple 0.6s;
                opacity: 0;
            `;

            const rippleStyle = document.createElement('style');
            rippleStyle.textContent = `
                @keyframes ripple {
                    from {
                        opacity: 1;
                        transform: scale(0);
                    }
                    to {
                        opacity: 0;
                        transform: scale(2);
                    }
                }
            `;
            document.head.appendChild(rippleStyle);

            ripple.style.left = e.clientX - floatingCTA.getBoundingClientRect().left + 'px';
            ripple.style.top = e.clientY - floatingCTA.getBoundingClientRect().top + 'px';

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });

        console.log('✅ Floating CTA Button Active');
    }

    // ============================================
    // INITIALIZE ALL FEATURES
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        initScrollProgress();
        initPageTransitions();
        initFloatingCTA();

        console.log('🎉 All Premium Features Loaded!');
    });

})();