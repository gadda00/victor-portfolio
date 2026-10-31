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

  /* ── 4. Hero console typing (v8: richer production readout) ─── */
  var CONSOLE_LINES = [
    [{ t: '$ ', c: 'v7-p' }, { t: 'victor', c: 'v7-hl' }, { t: ' --status --production' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'keja.app', c: 'v7-hl' },
      { t: ' \u00B7 87+ listings \u00B7 12 counties' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'tapi learn', c: 'v7-hl' },
      { t: ' \u00B7 11K+ learners \u00B7 38 countries' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'languages', c: 'v7-hl' }, { t: ' ' },
      { t: 'EN \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 ', c: 'v7-spark' },
      { t: 'SW \u2588\u2588\u2588\u2588\u2588 ', c: 'v7-spark' },
      { t: 'FR \u2588\u2588\u2588\u2588\u2588\u2586', c: 'v7-spark' }],
    [{ t: '\u2713 ', c: 'v7-ok' }, { t: '13 systems designed, built & shipped', c: 'v7-hl' }],
    [{ t: '$ ', c: 'v7-p' }, { t: 'victor', c: 'v7-hl' }, { t: ' --audit --risk', c: 'v7-am' }],
    [{ t: '\u26A0 ', c: 'v7-am' }, { t: '0 critical', c: 'v7-hl' },
      { t: ' \u00B7 evals wired \u00B7 observability live' }],
    [{ t: '\u2713 ', c: 'v7-ok' }, { t: 'ready for the next hard problem', c: 'v7-hl' }]
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
    try { initMagnetic(); } catch (e) { /* decorative only */ }
    try { initTilt(); } catch (e) { /* decorative only */ }
    try { initCursor(); } catch (e) { /* decorative only */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* ═══════════════════════════════════════════════════════════════════
   v8 · TEN-POLISH interaction modules (Cycle 11)
   5. Magnetic buttons  — CTAs lean toward the cursor
   6. Card tilt         — a whisper of 3D on hover
   7. Cursor signal     — lerped ring, desktop only
   8. Console v8        — richer command sequence + readout foot
   All gated: fine pointer + no reduced-motion + no touch.
   ═══════════════════════════════════════════════════════════════════ */

/* ── 5. Magnetic buttons ─────────────────────────────────────── */
function initMagnetic() {
  if (!FINE_POINTER || REDUCED) return;
  var SEL = '.hero-cta .btn, .nav-link-cta, .fab-book, .booking-cta-band .btn';
  document.querySelectorAll(SEL).forEach(function (btn) {
    btn.classList.add('v7-magnetic');
    var raf = null, tx = 0, ty = 0;
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      tx = x * 9; ty = y * 7;
      btn.classList.add('v7-mag-on');
      if (!raf) raf = requestAnimationFrame(apply);
      function apply() {
        btn.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
        raf = null;
      }
    }, { passive: true });
    btn.addEventListener('pointerleave', function () {
      btn.classList.remove('v7-mag-on');
      btn.style.transform = '';
    }, { passive: true });
  });
}

/* ── 6. Card tilt — subtle, readability-safe ──────────────────── */
function initTilt() {
  if (!FINE_POINTER || REDUCED) return;
  var SEL = '.bento-card, .blog-card, .case-card, .work-card';
  function bind(card) {
    if (card.__v8tilt) return;
    card.__v8tilt = true;
    card.classList.add('v7-tilt');
    if (card.parentElement) card.parentElement.classList.add('v7-tilt-wrap');
    var raf = null, rx = 0, ry = 0;
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      ry = x * 2.4; rx = -y * 2.4;
      card.classList.add('v7-tilt-on');
      if (!raf) raf = requestAnimationFrame(apply);
      function apply() {
        card.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        raf = null;
      }
    }, { passive: true });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('v7-tilt-on');
      card.style.transform = '';
    }, { passive: true });
    card.addEventListener('focusin', function () { card.style.transform = ''; });
  }
  document.querySelectorAll(SEL).forEach(bind);
  /* bento + blog cards render after fetch — catch them too */
  ['DOMContentLoaded', 'load'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      setTimeout(function () { document.querySelectorAll(SEL).forEach(bind); }, 400);
      setTimeout(function () { document.querySelectorAll(SEL).forEach(bind); }, 1400);
    });
  });
}

/* ── 7. Cursor signal — one quiet ring ────────────────────────── */
function initCursor() {
  if (!FINE_POINTER || REDUCED) return;
  var dot = document.createElement('div');
  dot.className = 'v7-cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  var x = -100, y = -100, cx = -100, cy = -100, seen = false;
  document.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; cx = x; cy = y; dot.style.opacity = '.9'; }
    var t = e.target && e.target.closest ? e.target.closest('a, button, [role="button"], input, textarea, select, summary, .bento-card, .blog-card') : null;
    dot.classList.toggle('v7-cur-in', !!t);
  }, { passive: true });
  document.addEventListener('pointerdown', function () { dot.style.opacity = '.5'; }, { passive: true });
  document.addEventListener('pointerup', function () { dot.style.opacity = '.9'; }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { dot.style.opacity = '0'; });
  (function loop() {
    cx += (x - cx) * .18;
    cy += (y - cy) * .18;
    dot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    requestAnimationFrame(loop);
  })();
}

/* ── 8. Console v8 — readout foot under the console body ────── */
var CONSOLE_FOOT = [
  { k: 'shell', v: 'production' },
  { k: 'stack', v: 'RAG \u00B7 agents \u00B7 forecasting \u00B7 fraud' },
  { k: 'status', v: 'shipping', ok: true }
];

function buildConsoleFoot(box) {
  if (box.querySelector('.v7-console-foot')) return;
  var foot = document.createElement('div');
  foot.className = 'v7-console-foot';
  CONSOLE_FOOT.forEach(function (f) {
    var s = document.createElement('span');
    s.innerHTML = '';
    var k = document.createElement('span'); k.textContent = f.k + ': ';
    var v = document.createElement(f.ok ? 'b' : 'b');
    if (f.ok) v.className = 'foot-ok';
    v.textContent = f.v;
    s.appendChild(k); s.appendChild(v);
    foot.appendChild(s);
  });
  box.appendChild(foot);
}

/* the static no-JS console body stays as the accessible baseline;
   when JS boots we enrich the markup and add the readout foot.  */
(function patchConsoleForV8() {
  var box = document.getElementById('v7Console');
  if (!box) return;
  buildConsoleFoot(box);
})();
