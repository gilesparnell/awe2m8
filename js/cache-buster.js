/**
 * Cache Buster - Development Mode Controller
 * 
 * USAGE:
 * 1. Include this file in your <head>: <script src="path/to/cache-buster.js"></script>
 * 2. Set DEV_MODE to false when going live
 * 3. That's it! All your pages will update automatically
 */

// ============================================
// 🎚️ FLIP THIS SWITCH TO GO LIVE
// ============================================
const DEV_MODE = true;  // Set to false for production
// ============================================

(function () {
    'use strict';

    if (!DEV_MODE) {
        console.log('Cache Buster: Production mode - caching enabled');
        return; // Exit early, allow normal caching
    }

    console.log('Cache Buster: Development mode - forcing fresh loads');

    // Generate unique timestamp
    const timestamp = new Date().getTime();

    /**
     * Add cache-busting parameter to URL
     */
    function bustCache(url) {
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
            return url;
        }

        // Handle absolute URLs (http://, https://, //)
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}_cb=${timestamp}`;
        }

        // Convert relative paths to absolute paths from domain root
        let absoluteUrl = url;
        if (!url.startsWith('/')) {
            // Get current path without filename
            const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

            // Resolve relative path
            const fullPath = currentPath + url;
            const parts = fullPath.split('/');
            const resolved = [];

            for (let part of parts) {
                if (part === '..') {
                    resolved.pop();
                } else if (part !== '.' && part !== '') {
                    resolved.push(part);
                }
            }

            absoluteUrl = '/' + resolved.join('/');
        }

        const separator = absoluteUrl.includes('?') ? '&' : '?';
        return `${absoluteUrl}${separator}_cb=${timestamp}`;
    }

    /**
     * Inject no-cache meta tags
     */
    function injectNoCacheMeta() {
        const meta = [
            { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
            { httpEquiv: 'Pragma', content: 'no-cache' },
            { httpEquiv: 'Expires', content: '0' }
        ];

        meta.forEach(attrs => {
            const tag = document.createElement('meta');
            tag.setAttribute('http-equiv', attrs.httpEquiv);
            tag.setAttribute('content', attrs.content);
            document.head.insertBefore(tag, document.head.firstChild);
        });
    }

    /**
     * Bust cache on all stylesheets
     */
    function bustStylesheets() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('_cb=')) {
                link.setAttribute('href', bustCache(href));
            }
        });
    }

    /**
     * Bust cache on all images
     */
    function bustImages() {
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.includes('_cb=')) {
                img.setAttribute('src', bustCache(src));
            }
        });
    }

    /**
     * Bust cache on all scripts
     */
    function bustScripts() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.includes('_cb=') && !src.includes('cache-buster.js')) {
                script.setAttribute('src', bustCache(src));
            }
        });
    }

    /**
     * Watch for dynamically added elements
     */
    function watchForNewElements() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's an image
                        if (node.tagName === 'IMG') {
                            const src = node.getAttribute('src');
                            if (src && !src.includes('_cb=')) {
                                node.setAttribute('src', bustCache(src));
                            }
                        }
                        // Check if it's a stylesheet
                        if (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet') {
                            const href = node.getAttribute('href');
                            if (href && !href.includes('_cb=')) {
                                node.setAttribute('href', bustCache(href));
                            }
                        }
                        // Check if it's a script
                        if (node.tagName === 'SCRIPT') {
                            const src = node.getAttribute('src');
                            if (src && !src.includes('_cb=')) {
                                node.setAttribute('src', bustCache(src));
                            }
                        }
                        // Check children
                        const imgs = node.querySelectorAll && node.querySelectorAll('img[src]');
                        if (imgs) {
                            imgs.forEach(img => {
                                const src = img.getAttribute('src');
                                if (src && !src.includes('_cb=')) {
                                    img.setAttribute('src', bustCache(src));
                                }
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        injectNoCacheMeta();
        bustStylesheets();
        bustImages();
        bustScripts();
        watchForNewElements();

        // Force reload on navigation
        window.addEventListener('pageshow', event => {
            if (event.persisted) {
                window.location.reload();
            }
        });
    }

    // Make bust function available globally for manual use
    window.bustCache = bustCache;

})();