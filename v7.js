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

  /* ── 4. Interactive production shell (v9 hero signature) ───
     The console is now TYPEABLE: a boot sequence streams in, then a
     real prompt accepts commands — help, whoami, projects, stack,
     metrics, contact, book, theme, neofetch, sudo hire-me, clear —
     with suggestion chips so mobile users can tap instead of type.
     Reduced motion: boot renders instantly (user-typed input is the
     user's own motion, so the shell stays fully functional).      */
  var BOOT_LINES = [
    [{ t: '$ ', c: 'v7-p' }, { t: 'victor', c: 'v7-hl' }, { t: ' --status --production' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'keja.app', c: 'v7-hl' },
      { t: ' \u00B7 87+ listings \u00B7 12 counties' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'tapi learn', c: 'v7-hl' },
      { t: ' \u00B7 11K+ learners \u00B7 38 countries' }],
    [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'languages', c: 'v7-hl' }, { t: ' ' },
      { t: 'EN \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 ', c: 'v7-spark' },
      { t: 'SW \u2588\u2588\u2588\u2588\u2588 ', c: 'v7-spark' },
      { t: 'FR \u2588\u2588\u2588\u2588\u2588\u2586', c: 'v7-spark' }],
    [{ t: '\u2713 ', c: 'v7-ok' }, { t: '13 systems designed, built & shipped', c: 'v7-hl' }]
  ];
  var SHELL_HINT = [
    { t: '\u2014 interactive \u00B7 type ', c: 'v7-d' },
    { t: 'help', c: 'v7-hl' },
    { t: ' and press Enter', c: 'v7-d' }
  ];

  function mkLine(segs) {
    var div = document.createElement('div');
    div.className = 'v7-cl';
    (segs || []).forEach(function (s) {
      var sp = document.createElement('span');
      if (s.c) sp.className = s.c;
      sp.textContent = s.t;
      div.appendChild(sp);
    });
    return div;
  }

  var SHELL = null; /* set by initConsole, used by chips */

  function buildShellCommands(shell) {
    function pad(n) {
      var s = n; while (s.length < 14) s += ' '; return s;
    }
    return {
      'help': function () {
        return [
          { t: 'available commands:', c: 'v7-d' },
          { t: pad('help') + 'this list', c: 'v7-d' },
          { t: pad('whoami') + 'who is victor', c: 'v7-d' },
          { t: pad('projects') + 'flagship systems (alias: ls)', c: 'v7-d' },
          { t: pad('stack') + 'tools I ship with', c: 'v7-d' },
          { t: pad('metrics') + 'numbers from production', c: 'v7-d' },
          { t: pad('contact') + 'reach me', c: 'v7-d' },
          { t: pad('book') + 'open the scheduler', c: 'v7-d' },
          { t: pad('theme') + 'toggle dark / light', c: 'v7-d' },
          { t: pad('neofetch') + 'system card', c: 'v7-d' },
          { t: pad('clear') + 'wipe the screen', c: 'v7-d' },
          { t: pad('sudo hire-me') + 'you know what this does', c: 'v7-d' }
        ].map(function (l) { return [l]; });
      },
      'whoami': function () {
        return [
          [{ t: 'Victor Ndunda', c: 'v7-hl' }, { t: ' — production AI systems engineer.' }],
          [{ t: 'Nairobi, Kenya · worldwide. I turn high-value workflows', c: 'v7-d' }],
          [{ t: 'into reliable AI systems: RAG, agents, forecasting, fraud.', c: 'v7-d' }]
        ];
      },
      'projects': function () {
        return [
          [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'keja.app', c: 'v7-hl' }, { t: ' — AI real-estate platform \u00B7 87+ listings \u00B7 12 counties' }],
          [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'tapi learn', c: 'v7-hl' }, { t: ' — AI learning product \u00B7 11K+ learners \u00B7 38 countries' }],
          [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'firstlight', c: 'v7-hl' }, { t: ' — geo-AI decision layer for disaster response' }],
          [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'agentreplay', c: 'v7-hl' }, { t: ' — deterministic replay for agent QA (open source)' }],
          [{ t: '\u25CF ', c: 'v7-ok' }, { t: 'kilimopro', c: 'v7-hl' }, { t: ' — AI crop intelligence for Kenyan farmers' }],
          [{ t: '+ 8 more → /projects/', c: 'v7-d' }]
        ];
      },
      'ls': null, /* alias, wired below */
      'stack': function () {
        return [
          [{ t: 'python · typescript · langgraph · pgvector · fastapi' }],
          [{ t: 'next.js · flutter · postgres · redis · docker · gcp' }],
          [{ t: 'evals · observability · human-in-the-loop', c: 'v7-hl' }, { t: ' — built in', c: 'v7-d' }]
        ];
      },
      'metrics': function () {
        return [
          [{ t: '13', c: 'v7-hl' }, { t: ' systems designed, built & shipped' }],
          [{ t: '11K+', c: 'v7-hl' }, { t: ' learners on a shipped client product' }],
          [{ t: '87+', c: 'v7-hl' }, { t: ' live listings · ' }, { t: '12', c: 'v7-hl' }, { t: ' counties' }],
          [{ t: 'EN · FR · SW', c: 'v7-hl' }, { t: ' multilingual delivery' }]
        ];
      },
      'contact': function () {
        return [
          [{ t: 'email    ', c: 'v7-d' }, { t: 'mututandunda@gmail.com', c: 'v7-hl' }],
          [{ t: 'github  ', c: 'v7-d' }, { t: 'github.com/gadda00', c: 'v7-hl' }],
          [{ t: 'linkedin ', c: 'v7-d' }, { t: '/in/victor-ndunda', c: 'v7-hl' }],
          [{ t: 'whatsapp ', c: 'v7-d' }, { t: '+254 724 346 971', c: 'v7-hl' }]
        ];
      },
      'book': function () {
        setTimeout(function () { window.location.href = '/book/'; }, 650);
        return [[{ t: 'opening scheduler → ', c: 'v7-d' }, { t: '/book/', c: 'v7-hl' }]];
      },
      'theme': function () {
        var t = document.getElementById('themeToggle');
        if (t) t.click();
        return [[{ t: '[theme toggled]', c: 'v7-d' }]];
      },
      'history': function () {
        return shell.history.length
          ? shell.history.map(function (h) { return [{ t: '  ' + h, c: 'v7-d' }]; })
          : [[{ t: '(empty)', c: 'v7-d' }]];
      },
      'sudo hire-me': function () {
        setTimeout(function () { window.location.href = '/book/'; }, 950);
        return [
          [{ t: '[sudo] password for visitor: ••••••••', c: 'v7-d' }],
          [{ t: 'permission granted ', c: 'v7-d' }, { t: '\u2713', c: 'v7-ok' }],
          [{ t: 'initializing engagement protocol → ', c: 'v7-d' }, { t: '/book/', c: 'v7-hl' }]
        ];
      }
    };
  }

  function initConsole() {
    var box = document.getElementById('v7Console');
    if (!box) return;
    var body = box.querySelector('.v7-console-body');
    if (!body) return;

    /* system readout foot (v8 module below defines this) */
    try { buildConsoleFoot(box); } catch (e) { /* decorative */ }

    /* shell skeleton */
    body.textContent = '';
    var log = document.createElement('div');
    log.className = 'v7-shell-log';
    log.setAttribute('role', 'log');
    log.setAttribute('aria-label', 'Console output');
    var row = document.createElement('div');
    row.className = 'v7-shell-input-row';
    var prompt = document.createElement('span');
    prompt.className = 'v7-p';
    prompt.setAttribute('aria-hidden', 'true');
    prompt.textContent = 'victor@production:~$';
    var input = document.createElement('input');
    input.className = 'v7-shell-input';
    input.type = 'text';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', 'Console command input — type help and press Enter');
    input.placeholder = "type 'help' + Enter";
    row.appendChild(prompt); row.appendChild(input);
    body.appendChild(log); body.appendChild(row);

    var shell = {
      log: log, input: input, box: box,
      history: [], hIdx: -1,
      cmds: null,
      print: function (lines, animate) {
        lines.forEach(function (segs) {
          log.appendChild(mkLine(segs));
        });
        while (log.children.length > 60) log.removeChild(log.firstChild);
        log.scrollTop = log.scrollHeight;
      }
    };
    shell.cmds = buildShellCommands(shell);
    shell.cmds['ls'] = shell.cmds['projects'];
    SHELL = shell;

    function run(raw) {
      var cmd = String(raw || '').trim();
      if (!cmd) return;
      shell.print([[{ t: '$ ', c: 'v7-p' }, { t: cmd, c: 'v7-hl' }]]);
      /* every attempted command lands in history — like a real shell */
      shell.history.push(cmd);
      if (shell.history.length > 20) shell.history.shift();
      shell.hIdx = -1;
      if (cmd === 'clear') { log.textContent = ''; return; }
      if (cmd === 'neofetch') { neofetch(); return; }
      var fn = shell.cmds[cmd.toLowerCase()];
      if (!fn) {
        shell.print([[
          { t: 'command not found: ', c: 'v7-am' },
          { t: cmd.slice(0, 24), c: 'v7-hl' },
          { t: ' — try ', c: 'v7-d' },
          { t: 'help', c: 'v7-hl' }
        ]]);
        return;
      }
      shell.print(fn());
    }

    function neofetch() {
      var art = ['   *   ', '  /|\  ', ' *-o-* ', '  \|/  ', '   *   '];
      var light = document.documentElement.classList.contains('light');
      var info = [
        ['victor@production', ''],
        ['OS:      ', 'Production AI'],
        ['Host:    ', 'Nairobi, KE'],
        ['Uptime:  ', '13 systems shipped'],
        ['Shell:   ', 'vnd-sh v9'],
        ['Lang:    ', 'EN / SW / FR'],
        ['Stack:   ', 'RAG · agents · evals'],
        ['Theme:   ', light ? 'light' : 'dark']
      ];
      var wrap = document.createElement('div');
      wrap.className = 'v7-cl v7-nf';
      var left = document.createElement('div');
      left.className = 'v7-nf-art';
      art.forEach(function (a) {
        var d = document.createElement('div');
        d.textContent = a;
        left.appendChild(d);
      });
      var right = document.createElement('div');
      info.forEach(function (kv, i) {
        var d = document.createElement('div');
        if (i === 0) { d.className = 'v7-hl'; d.textContent = kv[0]; }
        else {
          var k = document.createElement('span'); k.className = 'v7-d'; k.textContent = kv[0];
          var v = document.createElement('span'); v.textContent = kv[1];
          d.appendChild(k); d.appendChild(v);
        }
        right.appendChild(d);
      });
      wrap.appendChild(left); wrap.appendChild(right);
      log.appendChild(wrap);
      while (log.children.length > 60) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    }

    /* input wiring */
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') {
        if (!shell.history.length) return;
        e.preventDefault();
        shell.hIdx = shell.hIdx < 0 ? shell.history.length - 1 : Math.max(0, shell.hIdx - 1);
        input.value = shell.history[shell.hIdx];
      } else if (e.key === 'ArrowDown') {
        if (shell.hIdx < 0) return;
        e.preventDefault();
        shell.hIdx++;
        if (shell.hIdx >= shell.history.length) { shell.hIdx = -1; input.value = ''; }
        else input.value = shell.history[shell.hIdx];
      } else if (e.key === 'Escape') { input.blur(); }
    });
    /* tap the console to type (but never steal a text selection) */
    box.addEventListener('click', function () {
      var sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length) return;
      if (document.activeElement !== input) input.focus({ preventScroll: true });
    });

    /* suggestion chips — tap-to-run, mobile friendly */
    var chips = document.createElement('div');
    chips.className = 'v7-shell-chips';
    ['help', 'projects', 'neofetch', 'book'].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'v7-shell-chip';
      b.textContent = c;
      b.setAttribute('aria-label', 'Run console command: ' + c);
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        run(c);
        if (FINE_POINTER) input.focus({ preventScroll: true });
      });
      chips.appendChild(b);
    });
    body.parentNode.insertBefore(chips, body.nextSibling);

    /* boot: typed (or instant for reduced motion), then hint */
    function bootDone() {
      shell.print([SHELL_HINT]);
      log.setAttribute('aria-live', 'polite');
    }
    if (REDUCED) {
      shell.print(BOOT_LINES);
      bootDone();
      return;
    }
    var caret = document.createElement('span');
    caret.className = 'v7-caret';
    caret.textContent = '\u2588';
    var li = 0;
    function nextLine() {
      if (li >= BOOT_LINES.length) { bootDone(); return; }
      var line = BOOT_LINES[li++];
      var div = mkLine([]);
      log.appendChild(div);
      div.appendChild(caret);
      var si = 0, ci = 0, span = null;
      function typeChar() {
        if (si >= line.length) { setTimeout(nextLine, 150); return; }
        if (!span) {
          span = document.createElement('span');
          if (line[si].c) span.className = line[si].c;
          div.insertBefore(span, caret);
          ci = 0;
        }
        span.textContent += line[si].t.charAt(ci++);
        if (ci >= line[si].t.length) { si++; span = null; }
        log.scrollTop = log.scrollHeight;
        setTimeout(typeChar, 11 + Math.random() * 14);
      }
      typeChar();
    }
    nextLine();
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
