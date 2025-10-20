/* ============================================
   AWE2M8 MASTER EFFECTS FILE
   All visual effects in one organized place

   Custom visual effects, CTAs, and enhancements
   Loaded on: All pages
   
   ENABLE/DISABLE: Scroll to bottom and comment
   out features you don't want!
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       NAVIGATION & UI EFFECTS
       ========================================== */

    // SCROLL PROGRESS BAR - Green bar at top showing scroll position
    function initScrollProgress() {
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

        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });

        console.log('✅ Scroll Progress Bar');
    }

    // PAGE TRANSITIONS - Smooth fade between pages
    function initPageTransitions() {
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

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        window.addEventListener('load', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.pointerEvents = 'none', 400);
        });

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');

            if (link && link.href &&
                link.href.indexOf(window.location.origin) === 0 &&
                !link.target &&
                !link.href.includes('#')) {

                e.preventDefault();
                overlay.style.pointerEvents = 'auto';
                overlay.style.opacity = '1';

                setTimeout(() => {
                    window.location.href = link.href;
                }, 400);
            }
        });

        console.log('✅ Page Transitions');
    }

    // LOADING SCREEN - AWE2M8 branded loader on page load
    function initLoadingScreen() {
        const loader = document.createElement('div');
        loader.id = 'awe-loader';
        loader.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; font-weight: 800; color: #00ff00; margin-bottom: 30px; animation: logoPulse 1.5s ease-in-out infinite; text-shadow: 0 0 30px rgba(0, 255, 0, 0.6);">AWE2M8</div>
                <div style="width: 300px; height: 4px; background: rgba(0, 255, 0, 0.2); border-radius: 10px; overflow: hidden; margin: 0 auto 20px;">
                    <div style="height: 100%; background: linear-gradient(90deg, #00ff00, #00ff88); width: 0%; animation: loadProgress 2s ease forwards; box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);"></div>
                </div>
                <div style="color: rgba(0, 255, 0, 0.8); font-size: 0.9rem; animation: textFade 1.5s ease-in-out infinite;">Loading Amazing Demos...</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #awe-loader {
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #0a0a0a, #001a00, #003300);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.5s ease;
            }
            #awe-loader.hide { opacity: 0; pointer-events: none; }
            @keyframes loadProgress { 0% { width: 0%; } 100% { width: 100%; } }
            @keyframes logoPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
            @keyframes textFade { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        `;
        document.head.appendChild(style);
        document.body.insertBefore(loader, document.body.firstChild);

        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hide');
                setTimeout(() => loader.remove(), 500);
            }, 2000);
        });

        console.log('✅ Loading Screen');
    }

    /* ==========================================
       CONVERSION & CTA EFFECTS
       ========================================== */

    // FLOATING CTA BUTTON - Sticky "Book a Demo" button
    function initFloatingCTA() {
        const floatingCTA = document.createElement('a');
        floatingCTA.id = 'floating-cta';
        floatingCTA.href = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ11Zg2t9jtgPXR8kXwyLgtYjeV-nxazMBMvtVRkJWVN65wXfQyYO_35VMCxVQ6ONlF6TQKFJiYU';
        floatingCTA.target = '_blank';
        floatingCTA.innerHTML = `
            <span style="font-size: 1.2em; animation: pulse 2s ease-in-out infinite;">🚀</span>
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

        const ctaStyle = document.createElement('style');
        ctaStyle.textContent = `
            #floating-cta:hover {
                transform: translateY(-5px) scale(1.05);
                box-shadow: 0 6px 30px rgba(0, 255, 0, 0.6);
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @media (max-width: 768px) {
                #floating-cta { bottom: 80px; right: 15px; padding: 12px 20px; font-size: 0.9rem; }
                #floating-cta .cta-text { display: none; }
            }
        `;
        document.head.appendChild(ctaStyle);
        document.body.appendChild(floatingCTA);

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

        console.log('✅ Floating CTA Button');
    }

    // EXIT INTENT POPUP - Shows when user tries to leave
    function initExitIntent() {
        let shown = false;

        const popup = document.createElement('div');
        popup.id = 'exit-popup';
        popup.innerHTML = `
            <div style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(5px);" class="exit-overlay"></div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, #0a0a0a, #001a00); border: 2px solid #00ff00; border-radius: 24px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0, 255, 0, 0.3);">
                <button class="exit-close" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: rgba(255, 255, 255, 0.6); font-size: 2rem; cursor: pointer; transition: all 0.3s ease;">×</button>
                <div style="font-size: 4rem; margin-bottom: 20px; animation: exitBounce 1s ease infinite;">🚀</div>
                <h2 style="color: #00ff00; font-size: 2rem; margin-bottom: 15px;">Wait! Before You Go...</h2>
                <p style="color: rgba(255, 255, 255, 0.8); font-size: 1.1rem; margin-bottom: 25px;">See how AWE2M8 AI can transform your business in under 15 minutes</p>
                <a href="https://awe2m8.ai/contact" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #00ff00, #00cc00); color: #000000; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 1.1rem; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(0, 255, 0, 0.4);">Book a Free Demo</a>
                <div style="margin-top: 15px; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">No credit card required • 100% Free</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #exit-popup { position: fixed; inset: 0; z-index: 999998; display: none; }
            #exit-popup.show { display: block; }
            .exit-close:hover { color: #00ff00; transform: rotate(90deg); }
            @keyframes exitBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `;
        document.head.appendChild(style);
        document.body.appendChild(popup);

        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !shown) {
                popup.classList.add('show');
                shown = true;
            }
        });

        popup.querySelector('.exit-close').onclick = () => popup.classList.remove('show');
        popup.querySelector('.exit-overlay').onclick = () => popup.classList.remove('show');

        console.log('✅ Exit Intent Popup');
    }

    // SOCIAL PROOF COUNTER - Animated business count
    function initSocialProof() {
        const demoSection = document.querySelector('.demo-section');
        if (!demoSection) return;

        const proofBadge = document.createElement('div');
        proofBadge.innerHTML = `
            <div style="text-align: center; margin: 30px auto; padding: 20px; background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 16px; max-width: 600px;">
                <div style="font-size: 2.5rem; font-weight: 800; color: #00ff00; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 255, 0, 0.5);" class="social-counter">0</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 1.1rem;">Businesses Powered by AWE2M8 AI</div>
            </div>
        `;

        const firstP = demoSection.querySelector('p');
        firstP.after(proofBadge);

        const counter = proofBadge.querySelector('.social-counter');
        const targetNumber = 500; // ← CHANGE THIS NUMBER
        let currentNumber = 0;
        let animated = false;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    const interval = setInterval(() => {
                        currentNumber += Math.ceil(targetNumber / 50);
                        if (currentNumber >= targetNumber) {
                            currentNumber = targetNumber;
                            clearInterval(interval);
                            counter.textContent = targetNumber.toLocaleString() + '+';
                        } else {
                            counter.textContent = currentNumber.toLocaleString();
                        }
                    }, 30);
                }
            });
        });

        observer.observe(counter);
        console.log('✅ Social Proof Counter');
    }

    /* ==========================================
       DEMO PAGE ENHANCEMENTS
       ========================================== */

    // DEMO SEARCH BAR - Filter demos by keyword
    function initDemoSearch() {
        const demoSection = document.querySelector('.demo-section');
        if (!demoSection) return;

        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.placeholder = '🔍 Search demos...';
        searchBar.className = 'demo-search';

        const style = document.createElement('style');
        style.textContent = `
            .demo-search {
                width: 100%;
                max-width: 500px;
                padding: 15px 20px;
                margin: 20px auto;
                display: block;
                background: rgba(0, 255, 0, 0.05);
                border: 1px solid rgba(0, 255, 0, 0.2);
                border-radius: 50px;
                color: white;
                font-size: 1rem;
                outline: none;
                transition: all 0.3s ease;
            }
            .demo-search:focus {
                background: rgba(0, 255, 0, 0.1);
                border-color: #00ff00;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            }
            .demo-search::placeholder { color: rgba(255, 255, 255, 0.5); }
        `;
        document.head.appendChild(style);

        const heading = demoSection.querySelector('h2');
        heading.after(searchBar);

        const demoCards = document.querySelectorAll('.demo-card');
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            demoCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const desc = card.querySelector('p').textContent.toLowerCase();

                card.style.display = (title.includes(searchTerm) || desc.includes(searchTerm)) ? '' : 'none';
            });
        });

        console.log('✅ Demo Search Bar');
    }

    // DEMO TIMER BADGES - "⏱️ 2 min" badges on cards
    function initDemoTimers() {
        document.querySelectorAll('.demo-card').forEach(card => {
            const timer = document.createElement('div');
            timer.innerHTML = '⏱️ 2 min';
            timer.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(0, 255, 0, 0.9);
                color: #000000;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                box-shadow: 0 2px 10px rgba(0, 255, 0, 0.4);
            `;
            card.style.position = 'relative';
            card.appendChild(timer);
        });

        console.log('✅ Demo Timer Badges');
    }

    // RECENTLY VIEWED BADGES - "✓ Viewed" on visited demos
    function initRecentlyViewed() {
        const currentPage = window.location.pathname;
        let viewedPages = JSON.parse(localStorage.getItem('awe2m8_viewed') || '[]');

        if (!viewedPages.includes(currentPage)) {
            viewedPages.push(currentPage);
            localStorage.setItem('awe2m8_viewed', JSON.stringify(viewedPages));
        }

        document.querySelectorAll('.demo-card').forEach(card => {
            const href = card.getAttribute('href');
            if (viewedPages.some(page => page.includes(href))) {
                const badge = document.createElement('div');
                badge.textContent = '✓ Viewed';
                badge.style.cssText = `
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: rgba(0, 255, 136, 0.2);
                    border: 1px solid #00ff88;
                    color: #00ff88;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                `;
                card.style.position = 'relative';
                card.appendChild(badge);
            }
        });

        console.log('✅ Recently Viewed Badges');
    }

    /* ==========================================
       ANIMATION EFFECTS
       ========================================== */

    // CUSTOM CURSOR - Green glowing cursor (Desktop only)
    function initCustomCursor() {
        if (window.innerWidth < 768) return;

        const cursor = document.createElement('div');
        const cursorDot = document.createElement('div');

        const style = document.createElement('style');
        style.textContent = `
            body, a, button, .demo-card { cursor: none !important; }
            .custom-cursor {
                position: fixed;
                width: 20px;
                height: 20px;
                border: 2px solid #00ff00;
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                transition: all 0.15s ease;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
            .custom-cursor.hover { width: 40px; height: 40px; border-color: #00ff88; }
            .custom-cursor-dot {
                position: fixed;
                width: 6px;
                height: 6px;
                background: #00ff00;
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                transition: all 0.05s ease;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
            }
        `;
        document.head.appendChild(style);

        cursor.className = 'custom-cursor';
        cursorDot.className = 'custom-cursor-dot';
        document.body.appendChild(cursor);
        document.body.appendChild(cursorDot);

        let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        document.querySelectorAll('a, button, .demo-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });

        console.log('✅ Custom Cursor');
    }

    // PARALLAX DEMO CARDS - Cards move at different depths
    function initParallaxCards() {
        const cards = document.querySelectorAll('.demo-card');

        window.addEventListener('scroll', () => {
            cards.forEach((card, i) => {
                const rect = card.getBoundingClientRect();
                const scrollPercent = (window.innerHeight - rect.top) / window.innerHeight;

                if (scrollPercent > 0 && scrollPercent < 1) {
                    const translateY = (scrollPercent - 0.5) * 20 * (i % 2 === 0 ? 1 : -1);
                    card.style.transform = `translateY(${translateY}px)`;
                }
            });
        });

        console.log('✅ Parallax Cards');
    }

    // LOGO REVEAL - Matrix-style glitch effect
    function initLogoReveal() {
        const logo = document.querySelector('.logo img');
        if (!logo) return;

        logo.style.opacity = '0';
        logo.style.filter = 'blur(10px)';

        setTimeout(() => {
            logo.style.transition = 'all 1s ease';
            logo.style.opacity = '1';
            logo.style.filter = 'blur(0px) drop-shadow(0 0 20px rgba(0, 255, 0, 0.6))';

            let glitchCount = 0;
            const glitch = setInterval(() => {
                logo.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
                glitchCount++;
                if (glitchCount > 5) {
                    clearInterval(glitch);
                    logo.style.transform = 'translate(0, 0)';
                }
            }, 50);
        }, 500);

        console.log('✅ Logo Reveal');
    }

    // LAZY LOAD IMAGES - Images load as you scroll
    function initLazyLoad() {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));

        console.log('✅ Lazy Load Images');
    }

    /* ==========================================
       MASTER CONTROL CENTER
       Enable/Disable features here!
       ========================================== */

    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 AWE2M8 Effects Loading...\n');

        // NAVIGATION & UI
        initScrollProgress();           // Green bar at top
        initPageTransitions();          // Smooth page fades
        initLoadingScreen();            // AWE2M8 branded loader

        // CONVERSION & CTA
        initFloatingCTA();              // Sticky "Book Demo" button
        // initExitIntent();               // Exit popup- too pushy
        initSocialProof();              // "500+ businesses" counter

        // DEMO ENHANCEMENTS
        initDemoSearch();               // Search bar
        initDemoTimers();               // "⏱️ 2 min" badges
        initRecentlyViewed();           // "✓ Viewed" badges

        // ANIMATIONS
        // initCustomCursor();             // Green glowing cursor
        initParallaxCards();            // Depth scrolling
        initLogoReveal();               // Matrix glitch
        initLazyLoad();                 // Lazy image loading

        console.log('\n✨ All Effects Loaded!\n');
        console.log('💡 To disable: Comment out functions above\n');
    });

})();