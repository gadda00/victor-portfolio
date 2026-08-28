/* ═══════════════════════════════════════════════════════════════════
   effects.js — Portfolio v6 interaction layer
   Spotlight cards · Magnetic buttons · Scroll progress · 3D tilt
   Loaded on the homepage only. Progressive enhancement — every
   feature degrades gracefully and respects prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── 1. Spotlight cards ───────────────────────────────────────
     Cards with .spot-card (or .work-card) get a radial gradient
     that follows the cursor via --mx/--my custom properties.     */
  function initSpotlight() {
    var cards = document.querySelectorAll('.spot-card, .work-card:not(.spot-card)');
    if (!cards.length || reduceMotion) return;

    cards.forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      }, { passive: true });
    });
  }

  /* ─── 2. Magnetic buttons ──────────────────────────────────────
     Primary CTAs subtly shift toward the cursor. Max 6px shift.  */
  function initMagnetic() {
    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;

    var magnets = document.querySelectorAll('.hero-cta .btn, .booking-cta-actions .btn');
    magnets.forEach(function (el) {
      var raf = null;

      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var rect = el.getBoundingClientRect();
          var relX = (e.clientX - rect.left) / rect.width - 0.5;
          var relY = (e.clientY - rect.top) / rect.height - 0.5;
          el.style.transform = 'translate(' + (relX * 7) + 'px, ' + (relY * 7) + 'px)';
          raf = null;
        });
      }, { passive: true });

      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ─── 5. Stuck-element safety net ───────────────────────────────
     app.js + enhancements.js both use IntersectionObserver reveals.
     If the user fast-scrolls, restores scroll position, or jumps via
     anchor, some elements can remain opacity:0 forever. This net
     periodically promotes any element the user has already scrolled
     past. Cheap (runs 4 times total), prevents invisible content.  */
  function initRevealSafetyNet() {
    var pending = [];
    var rafPending = false;

    function sweep() {
      // Only elements still hidden — the set shrinks over time, so
      // this is O(remaining) and effectively free after first pass.
      pending = document.querySelectorAll('.reveal:not(.is-visible), .reveal-target:not(.revealed)');
      var fold = window.scrollY + window.innerHeight - 60;
      pending.forEach(function (el) {
        if (el.getBoundingClientRect().top + window.scrollY < fold) {
          el.classList.add('is-visible', 'revealed');
        }
      });
      rafPending = false;
    }

    // Debounced sweep on scroll — catches anything IO missed
    // (fast scrolls, anchor jumps, scroll restoration).
    window.addEventListener('scroll', function () {
      if (!rafPending) {
        rafPending = true;
        setTimeout(function () { requestAnimationFrame(sweep); }, 220);
      }
    }, { passive: true });

    window.addEventListener('hashchange', function () {
      setTimeout(sweep, 350);
    });

    setTimeout(sweep, 1000);
    setTimeout(sweep, 3000);
  }

  /* ─── Boot ───────────────────────────────────────────────────── */
  function boot() {
    initSpotlight();
    initMagnetic();
    initRevealSafetyNet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
