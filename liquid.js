/* ═══════════════════════════════════════════════════════════════════
   liquid.js — Victor Ndunda v9 interaction engine (site-wide)
   ─────────────────────────────────────────────────────────────────
   Companion to liquid.css. Progressive enhancement only:
   every feature checks for support + prefers-reduced-motion and
   degrades silently. Exposes window.vnToast / window.vnCopy so any
   page (scheduler, invoice, dashboard) can use the toast system.

   1. Spotlight glow (cursor-follow) for .lg-spot
   2. 3D tilt for .lg-tilt
   3. Count-up stats (.lg-count[data-count])
   4. Scroll reveals (.lg-reveal)
   5. Toasts (window.vnToast)
   6. Clipboard helper (window.vnCopy)

   NOTE: the scroll progress bar and back-to-top button are provided by
   enhancements.js (site-wide) — liquid.js no longer injects duplicates.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── 1. Spotlight glow ── */
  function initSpotlight() {
    if (!finePointer || reduceMotion) return;
    document.addEventListener('pointerover', function (e) {
      var card = e.target.closest ? e.target.closest('.lg-spot') : null;
      if (!card) return;
      card.addEventListener('pointermove', track, { passive: true });
    });
    function track(e) {
      var card = e.currentTarget;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
  }

  /* ── 2. 3D tilt ── */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.lg-tilt').forEach(function (el) {
      var raf = null;
      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -6;  // max 3deg
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
          el.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
          raf = null;
        });
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ── 3. Count-up stats ── */
  function initCountUp() {
    var els = document.querySelectorAll('.lg-count[data-count]');
    if (!els.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (reduceMotion) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
      var dur = 1100, start = null;
      function frame(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);  // easeOutCubic
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 4. Scroll reveals ── */
  function initReveal() {
    var els = document.querySelectorAll('.lg-reveal');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('lg-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('lg-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 5. Toasts ── */
  var toastWrap = null;
  function initToasts() {
    toastWrap = document.createElement('div');
    toastWrap.className = 'vn-toast-wrap';
    toastWrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastWrap);
  }
  /**
   * window.vnToast(message, icon) — show a glass toast for ~3.2s.
   * Safe no-op if the body isn't ready.
   */
  window.vnToast = function (msg, icon) {
    if (!toastWrap) initToasts();
    var t = document.createElement('div');
    t.className = 'vn-toast';
    t.innerHTML = '<span class="t-icon" aria-hidden="true">' + (icon || '✓') + '</span><span></span>';
    t.lastElementChild.textContent = String(msg).slice(0, 200);
    toastWrap.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 350);
    }, 3200);
  };

  /* ── 6. Clipboard helper ── */
  /**
   * window.vnCopy(text, label) — copy to clipboard with a toast.
   * Falls back to a hidden textarea on older browsers.
   */
  window.vnCopy = function (text, label) {
    var done = function () { window.vnToast((label || 'Copied') + ' to clipboard', '📋'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(); });
    } else { legacy(); }
    function legacy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      } catch (e) { window.vnToast('Copy failed — select it manually', '⚠️'); }
    }
  };
  /* Delegated copy buttons: <button data-copy="text" data-copy-label="Email"> */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!btn) return;
    window.vnCopy(btn.getAttribute('data-copy'), btn.getAttribute('data-copy-label') || 'Copied');
  });

  /* ── Boot ── */
  function boot() {
    initSpotlight();
    initTilt();
    initCountUp();
    initReveal();
    initToasts();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
