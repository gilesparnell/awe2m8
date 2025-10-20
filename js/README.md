# AWE2M8 JavaScript Files

## File Structure

- **core-effects.js** - Custom AWE2M8 effects (load on all pages)
- **interactive-base.js** - Foundation interactions (load on all pages)
- **dark-mode.js** - Theme toggle (load on all pages)
- **particles.js** - Particle background (load on homepage only)

## Load Order
1. particles.js (if homepage)
2. interactive-base.js
3. dark-mode.js
4. core-effects.js