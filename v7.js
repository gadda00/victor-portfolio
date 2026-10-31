/* ═══════════════════════════════════════════════════════════════════
   v7.js — "SIGNAL" interaction layer (site-wide)
   Loaded on every page AFTER the page's own scripts.

   1. html.v7js gate       — enables motion CSS only when JS runs
   2. Delegated spotlight  — cursor glow on every card, including
                             async-rendered bento + blog cards
   3. v7 reveals           — staggered entrance for subpage content
                             (skips elements already owned by
                             enhancements.js .reveal system)
   4. Hero console         — typing animation on the homepage widget
   5. Reduced motion       — everything degrades to static instantly
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── 1. Gate ─────────────────────────────────────────────────── */
  document.documentElement.classList.add('v7js');

  /* ── 2. Delegated spotlight ────────────────────────────────────
     One listener for the whole document. Matches any current or
     FUTURE card (bento/blog cards render after fetch).            */
  function initSpotlight() {
    if (!FINE_POINTER || REDUCED) return;
    var SELECTOR = '.spot-card, .work-card, .blog-card, .bento-card, ' +
      '.contact-card, .offer-card, .case-card, .about-card, .svc-quick-card, ' +
      '.pkg-card, .jobs-card, .guide-card, .newsletter-band, .booking-cta-band';
    document.addEventListener('pointermove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });
  }

  /* ── 3. Reveals ──────────────────────────────────────────────── */
  function initReveals() {
    if (REDUCED || !('IntersectionObserver' in window)) {
      // static fallback: nothing is hidden without the .v7-in toggle
      return;
    }
    var targets = document.querySelectorAll(
      '.section-head, .contact-card, .offer-card, .case-card, ' +
      '.resume-section, .svc-quick-card, .pkg-card, .jobs-card, ' +
      '.guide-card, .faq-item, .toc-card, .case-study-card'
    );
    var list = [];
    targets.forEach(function (el) {
      // enhancements.js already animates these on the homepage — skip
      if (el.classList.contains('reveal')) return;
      el.classList.add('v7-reveal');
      list.push(el);
    });
    if (!list.length) return;

    // stagger siblings inside the same parent
    var byParent = {};
    list.forEach(function (el) {
      var key = el.parentElement ? (el.parentElement.className || el.parentElement.tagName) : 'root';
      byParent[key] = (byParent[key] || 0) + 1;
      var idx = (byParent[key] - 1) % 4;
      if (idx > 0) el.style.setProperty('--v7d', (idx * 0.09).toFixed(2) + 's');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('v7-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });

    list.forEach(function (el) { io.observe(el); });

    // safety net: never leave content invisible (anchor jumps, fast scroll)
    var sweeps = 0;
    var timer = setInterval(function () {
      sweeps++;
      var pending = document.querySelectorAll('.v7-reveal:not(.v7-in)');
      if (!pending.length || sweeps > 8) { clearInterval(timer); return; }
      var fold = window.innerHeight + window.scrollY - 40;
      pending.forEach(function (el) {
        if (el.getBoundingClientRect().top + window.scrollY < fold) el.classList.add('v7-in');
      });
    }, 900);
  }

  /* ── 4. Hero console typing ──────────────────────────────────── */
  var CONSOLE_LINES = [
    [{ t: '$ ', c: 'v7-p' }, { t: 'victor --status --production' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'keja.app', c: 'v7-hl' },
      { t: ' \u00B7 87+ listings \u00B7 12 counties' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'tapi learn', c: 'v7-hl' },
      { t: ' \u00B7 11K+ learners \u00B7 38 countries' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'languages', c: 'v7-hl' },
      { t: ' \u00B7 EN \u00B7 FR \u00B7 SW' }],
    [{ t: '\u2713 ', c: 'v7-ok' }, { t: '13 systems designed, built & shipped', c: 'v7-hl' }]
  ];

  function initConsole() {
    var box = document.getElementById('v7Console');
    if (!box) return;
    var body = box.querySelector('.v7-console-body');
    if (!body) return;

    if (REDUCED) {
      renderAll(body);
      return;
    }

    var caret = document.createElement('span');
    caret.className = 'v7-caret';
    caret.textContent = '\u2588';

    function renderAll(container) {
      container.textContent = '';
      CONSOLE_LINES.forEach(function (line) {
        var div = document.createElement('div');
        div.className = 'v7-cl';
        line.forEach(function (seg) {
          var s = document.createElement('span');
          if (seg.c) s.className = seg.c;
          s.textContent = seg.t;
          div.appendChild(s);
        });
        container.appendChild(div);
      });
      container.appendChild(caret);
    }

    var running = false;
    function typeCycle() {
      if (running) return;
      running = true;
      body.textContent = '';
      var li = 0;
      function nextLine() {
        if (li >= CONSOLE_LINES.length) {
          body.appendChild(caret);
          setTimeout(function () { running = false; typeCycle(); }, 5200);
          return;
        }
        var line = CONSOLE_LINES[li++];
        var div = document.createElement('div');
        div.className = 'v7-cl';
        body.appendChild(div);
        div.appendChild(caret);
        var si = 0, ci = 0, span = null;
        function typeChar() {
          if (si >= line.length) { setTimeout(nextLine, 260); return; }
          if (!span) {
            span = document.createElement('span');
            if (line[si].c) span.className = line[si].c;
            div.insertBefore(span, caret);
            ci = 0;
          }
          span.textContent += line[si].t.charAt(ci++);
          if (ci >= line[si].t.length) { si++; span = null; }
          setTimeout(typeChar, 16 + Math.random() * 26);
        }
        typeChar();
      }
      nextLine();
    }
    typeCycle();
  }

  /* ── Boot ────────────────────────────────────────────────────── */
  function boot() {
    try { initSpotlight(); } catch (e) { /* decorative only */ }
    try { initReveals(); } catch (e) { /* decorative only */ }
    try { initConsole(); } catch (e) { /* decorative only */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
