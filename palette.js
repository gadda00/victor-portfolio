/* Victor Ndunda — Site-wide Command Palette (v12)
   ═══════════════════════════════════════════════════════════════════
   One palette, every page. Self-injects its DOM + styles so no page
   needs markup surgery. Indexes every page, service, package, guide,
   article and FAQ (data.json + posts.json, cached 12h). Adds:
     - Recent pages memory (vn_recent)
     - Context actions (resume estimate / readiness score / briefs)
     - ?q= deep links (keeps the WebSite SearchAction JSON-LD honest)
     - window.vnToast + showToast fallback for pages without app.js
     - "/" and Cmd/Ctrl+K hotkeys (guarded while typing)
   A11y: role=dialog + listbox/option semantics, focus trap + restore,
   aria-activedescendant, reduced-motion aware. Progressive everywhere.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'https://wa.me/254724346971';
  var EMAIL = 'mututandunda@gmail.com';

  /* ── Toast (shared, available to other site scripts) ───────────── */
  if (typeof window.vnToast !== 'function') {
    window.vnToast = function (msg, ms) {
      try {
        var c = document.querySelector('.vn-toast-wrap');
        if (!c) {
          c = document.createElement('div');
          c.className = 'vn-toast-wrap';
          c.setAttribute('aria-live', 'polite');
          document.body.appendChild(c);
        }
        var t = document.createElement('div');
        t.className = 'vn-toast';
        t.textContent = msg;
        c.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('on'); });
        setTimeout(function () {
          t.classList.remove('on');
          setTimeout(function () { t.remove(); }, 350);
        }, ms || 2600);
      } catch (e) { /* non-fatal */ }
    };
  }
  if (typeof window.showToast !== 'function') {
    window.showToast = function (msg) { window.vnToast(msg); };
  }

  /* ── Static index: pages + actions ─────────────────────────────── */
  function here() { return window.location.pathname; }
  function shortTitle() {
    var t = (document.title || '').replace(/\s*[|·—-]\s*Victor Ndunda.*$/i, '');
    return t || 'Page';
  }

  var PAGES = [
    { i: '🏠', t: 'Home', d: 'Portfolio, case studies & contact', u: '/' },
    { i: '🛠️', t: 'Services', d: 'Packages, catalogue, calculator & FAQs', u: '/services/' },
    { i: '📊', t: 'AI Readiness Assessment', d: 'Score your AI readiness in 2 minutes', u: '/services/assessment.html' },
    { i: '🧭', t: 'Scope Wizard', d: 'Scope a project, get a live estimate', u: '/services/wizard.html' },
    { i: '📄', t: 'Proposal Generator', d: 'Turn a scope into a shareable proposal', u: '/services/proposal.html' },
    { i: '📝', t: 'Contract Builder', d: 'Generate the engagement contract', u: '/services/contract.html' },
    { i: '🧾', t: 'Invoice Generator', d: 'Invoices with installment schedules', u: '/services/invoice.html' },
    { i: '💳', t: 'Payment', d: 'Payment options & M-Pesa details', u: '/services/payment.html' },
    { i: '📅', t: 'Book an Assessment', d: 'Free 30-minute call — no pitch', u: '/book/' },
    { i: '🗂️', t: 'Case Studies', d: 'Shipped systems with measurable results', u: '/projects/' },
    { i: '📝', t: 'Blog — Insights', d: 'Research & technical articles', u: '/blog/' },
    { i: '📗', t: 'Free Guides', d: 'Practical AI guides for businesses', u: '/services/#guides' },
    { i: '📘', t: 'The AI Starter Guide', d: 'Flagship guide: adopting AI step by step', u: '/guide/' },
    { i: '📄', t: 'Resume', d: 'Full resume page', u: '/resume/' },
    { i: '⬇️', t: 'Download Resume PDF', d: 'Victor-Ndunda-Resume.pdf', u: '/resume/Victor-Ndunda-Resume.pdf', dl: true },
    { i: '🤖', t: 'How I Use AI', d: 'AI transparency & data-handling policy', u: '/ai-policy.html' },
    { i: '⚖️', t: 'Terms of Service', d: 'Engagement terms', u: '/terms-of-service.html' },
    { i: '🔒', t: 'Privacy Policy', d: 'What data is collected, and how', u: '/privacy-policy.html' },
    { i: '🚀', t: 'Busara AI', d: 'busaraai.com — live platform', x: 'https://busaraai.com' },
    { i: '🌱', t: 'KilimoPRO', d: 'github.com/gadda00/kilimopro', x: 'https://github.com/gadda00/kilimopro' },
    { i: '🐙', t: 'GitHub Profile', d: 'github.com/gadda00', x: 'https://github.com/gadda00' },
    { i: '💼', t: 'LinkedIn', d: 'linkedin.com/in/victor-ndunda', x: 'https://www.linkedin.com/in/victor-ndunda' }
  ];

  var ACTIONS = [
    { i: '📧', t: 'Email Victor', d: EMAIL, a: function () { window.location.href = 'mailto:' + EMAIL; } },
    { i: '💬', t: 'WhatsApp with context', d: 'Opens WhatsApp, mentions this page', a: function () {
        window.open(WA + '?text=' + encodeURIComponent('Hi Victor — I have a question about ' + shortTitle() + ' (' + window.location.origin + here() + ')'), '_blank', 'noopener');
      } },
    { i: '📋', t: 'Copy email address', d: 'Copies ' + EMAIL + ' to clipboard', a: function () { copy(EMAIL); } },
    { i: '🔗', t: 'Copy this page link', d: 'Copies the current URL', a: function () { copy(window.location.href); } },
    { i: '🌓', t: 'Toggle theme', d: 'Switch dark / light mode', a: toggleTheme }
  ];

  function copy(text) {
    var done = function () { window.vnToast('Copied ✓'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
    } else { legacyCopy(text, done); }
  }
  function legacyCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); done();
    } catch (e) { window.vnToast('Copy failed — ' + text); }
  }
  function toggleTheme() {
    var btn = document.getElementById('themeToggle');
    if (btn) { btn.click(); return; }
    var html = document.documentElement;
    var next = (html.className.indexOf('light') > -1) ? 'dark' : 'light';
    html.className = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  }

  /* ── Dynamic index (data.json + posts.json, 12h cache) ─────────── */
  var dyn = [], dynLoaded = false;
  var CACHE_KEY = 'vn_cp_index', CACHE_TTL = 12 * 60 * 60 * 1000;

  function cacheGet() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.t || Date.now() - o.t > CACHE_TTL || !Array.isArray(o.e)) return null;
      return o.e;
    } catch (e) { return null; }
  }
  function cacheSet(entries) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), e: entries })); } catch (e) {}
  }

  function loadDyn() {
    if (dynLoaded) return;
    dynLoaded = true;
    var cached = cacheGet();
    if (cached) { dyn = cached; }
    var urls = ['/services/data.json?v=1.3', '/blog/posts.json'];
    Promise.all(urls.map(function (u) {
      return fetch(u).then(function (r) { return r.json(); });
    })).then(function (res) {
      var out = [];
      try {
        var d = res[0] || {};
        (d.packages || []).forEach(function (p) {
          var price = typeof p.price === 'number' ? '$' + p.price.toLocaleString() : (p.price || '');
          out.push({ i: '📦', t: p.name + ' package', d: (price ? price + ' · ' : '') + (p.tagline || ''), u: '/services/#packages', k: 'package' });
        });
        (d.services || []).forEach(function (s) {
          var fp = typeof s.fromPrice === 'number' ? 'from $' + s.fromPrice.toLocaleString() : (s.fromPrice || '');
          out.push({ i: '🧩', t: s.name, d: (fp ? fp + ' · ' : '') + (s.description || ''), u: '/services/#catalog', k: 'service' });
        });
        (d.guides || []).forEach(function (g) {
          out.push({ i: '📗', t: g.title, d: (g.duration || '') + (g.audience ? ' · ' + g.audience : ''), u: g.url, k: 'guide' });
        });
        (d.faqs || []).forEach(function (f) {
          out.push({ i: '❓', t: f.q, d: (f.a || '').replace(/<[^>]*>/g, '').substring(0, 90) + '…', u: '/services/#faqs', k: 'FAQ' });
        });
      } catch (e) {}
      try {
        ((res[1] || {}).posts || []).forEach(function (p) {
          out.push({ i: '📝', t: p.title, d: (p.readTime ? p.readTime + ' · ' : '') + (p.excerpt || '').substring(0, 70) + '…', u: p.url, k: 'article' });
        });
      } catch (e) {}
      if (out.length) { dyn = out; cacheSet(out); }
    }).catch(function () {
      /* offline / fetch blocked — cached index (if any) already applied */
    });
  }

  /* ── Recent pages ──────────────────────────────────────────────── */
  function recents() {
    try { return JSON.parse(localStorage.getItem('vn_recent') || '[]'); } catch (e) { return []; }
  }
  function pushRecent() {
    var p = here();
    if (/^\/(dashboard|admin)\//.test(p) || /^\/(offline|404)/.test(p)) return;
    var r = recents().filter(function (x) { return x.u !== p; });
    r.unshift({ t: shortTitle(), u: p });
    r = r.slice(0, 8);
    try { localStorage.setItem('vn_recent', JSON.stringify(r)); } catch (e) {}
  }

  /* ── Context actions (estimate / assessment on file) ───────────── */
  function readLS(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function contextActions() {
    var out = [];
    var est = readLS('vn_last_estimate');
    if (est && est.t && Date.now() - est.t < 30 * 24 * 3600 * 1000) {
      var v = (est.usdLow && est.usdHigh) ? ('$' + est.usdLow.toLocaleString() + '–$' + est.usdHigh.toLocaleString()) : (est.range || '');
      out.push({ i: '💰', t: 'Resume your estimate', d: (est.service ? est.service + ' · ' : '') + v, a: function () { window.location.href = '/book/#assistant'; }, k: 'context' });
    }
    var as = readLS('vn_assessment_ctx');
    if (as && as.score != null) {
      out.push({ i: '🧠', t: 'Your readiness score: ' + as.score + '/100', d: (as.recName || as.tierLabel || '') + (as.recId ? ' suggested' : ''), a: function () { window.location.href = '/services/assessment.html?r=' + as.score; }, k: 'context' });
    }
    return out;
  }

  /* ── Build the DOM (once, lazily, on first open) ───────────────── */
  var root = null, input = null, list = null, sel = 0, lastFocus = null, built = false;

  function build() {
    if (built) return;
    built = true;

    var st = document.createElement('style');
    st.textContent =
      '.vn-cp{position:fixed;inset:0;z-index:3000;display:none;align-items:flex-start;justify-content:center;padding:14vh 1rem 1rem}' +
      '.vn-cp.open{display:flex}' +
      '.vn-cp-ovl{position:absolute;inset:0;background:rgba(2,6,16,.55);backdrop-filter:blur(4px)}' +
      '.vn-cp-box{position:relative;width:100%;max-width:600px;background:var(--bg-elev,#0f1526);border:1px solid var(--border,rgba(148,163,184,.18));border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.45);overflow:hidden;opacity:0;transform:translateY(8px) scale(.985);transition:opacity .18s var(--ease,ease-out),transform .18s var(--ease,ease-out)}' +
      '.vn-cp.open .vn-cp-box{opacity:1;transform:none}' +
      '.vn-cp-in{display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;border-bottom:1px solid var(--border,rgba(148,163,184,.18));color:var(--text-muted,#94a3b8)}' +
      '.vn-cp-in svg{flex:none;opacity:.7}' +
      '.vn-cp-in input{flex:1;background:none;border:none;outline:none;color:var(--text,#e2e8f0);font:500 1rem/1.3 inherit;font-family:inherit}' +
      '.vn-cp-in input::placeholder{color:var(--text-dim,#64748b)}' +
      '.vn-cp-in kbd{font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:.68rem;padding:.18rem .42rem;border-radius:5px;background:var(--glass,rgba(148,163,184,.08));border:1px solid var(--border,rgba(148,163,184,.18));color:var(--text-muted,#94a3b8)}' +
      '.vn-cp-list{max-height:min(52vh,420px);overflow-y:auto;padding:.5rem;scrollbar-width:thin}' +
      '.vn-cp-it{display:flex;align-items:center;gap:.75rem;padding:.68rem .9rem;border-radius:10px;cursor:pointer}' +
      '.vn-cp-it[aria-selected="true"],.vn-cp-it:hover{background:var(--glass,rgba(148,163,184,.1))}' +
      '.vn-cp-ic{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--glass,rgba(148,163,184,.08));font-size:1rem}' +
      '.vn-cp-tx{flex:1;min-width:0}' +
      '.vn-cp-t{font-size:.875rem;font-weight:500;color:var(--text,#e2e8f0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.vn-cp-d{font-size:.75rem;color:var(--text-muted,#94a3b8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.vn-cp-k{flex:none;font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim,#64748b);border:1px solid var(--border,rgba(148,163,184,.18));border-radius:4px;padding:.14rem .34rem}' +
      '.vn-cp-empty{padding:1.4rem;text-align:center;color:var(--text-muted,#94a3b8);font-size:.875rem}' +
      '.vn-cp-ft{display:flex;gap:1.1rem;padding:.7rem 1.25rem;border-top:1px solid var(--border,rgba(148,163,184,.18));font-size:.68rem;color:var(--text-dim,#64748b)}' +
      '.vn-cp-ft kbd{font-family:\'JetBrains Mono\',ui-monospace,monospace;padding:.1rem .3rem;border-radius:3px;background:var(--glass,rgba(148,163,184,.08));border:1px solid var(--border,rgba(148,163,184,.18))}' +
      '.vn-cp-trig{display:inline-flex;align-items:center;gap:.45rem;padding:.42rem .68rem;border-radius:9px;background:var(--glass,rgba(148,163,184,.08));border:1px solid var(--border,rgba(148,163,184,.18));color:var(--text-muted,#94a3b8);font:500 .78rem/1 inherit;cursor:pointer;transition:color .2s,border-color .2s}' +
      '.vn-cp-trig:hover{border-color:var(--accent,#22d3ee);color:var(--text,#e2e8f0)}' +
      '.vn-cp-trig kbd{font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:.64rem;padding:.08rem .26rem;border-radius:4px;background:var(--bg-elev,#0f1526);border:1px solid var(--border,rgba(148,163,184,.18))}' +
      '.vn-cp-fab{position:fixed;right:1.1rem;bottom:1.1rem;z-index:900;display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .85rem;border-radius:999px;background:var(--bg-elev,#0f1526);border:1px solid var(--border,rgba(148,163,184,.18));color:var(--text-muted,#94a3b8);font:600 .78rem/1 inherit;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.35);transition:color .2s,border-color .2s,transform .2s}' +
      '.vn-cp-fab:hover{border-color:var(--accent,#22d3ee);color:var(--text,#e2e8f0);transform:translateY(-2px)}' +
      '.vn-toast-wrap{position:fixed;left:50%;bottom:1.4rem;transform:translateX(-50%);z-index:4000;display:flex;flex-direction:column;gap:.5rem;align-items:center;pointer-events:none}' +
      '.vn-toast{background:var(--bg-elev,#0f1526);color:var(--text,#e2e8f0);border:1px solid var(--border,rgba(148,163,184,.18));border-left:3px solid var(--accent,#22d3ee);padding:.65rem 1rem;border-radius:10px;font-size:.84rem;font-weight:500;box-shadow:0 10px 34px rgba(0,0,0,.4);opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s}' +
      '.vn-toast.on{opacity:1;transform:none}' +
      '@media (max-width:600px){.vn-cp{padding-top:9vh}.vn-cp-fab{bottom:.9rem;right:.9rem}}' +
      '@media print{.vn-cp,.vn-cp-fab,.vn-toast-wrap{display:none!important}}' +
      (REDUCED ? '.vn-cp-box,.vn-toast{transition:none}' : '');
    document.head.appendChild(st);

    root = document.createElement('div');
    root.className = 'vn-cp';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Site search');
    root.innerHTML =
      '<div class="vn-cp-ovl" data-close></div>' +
      '<div class="vn-cp-box">' +
        '<div class="vn-cp-in">' +
          '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
          '<input id="vnCpInput" type="text" placeholder="Search pages, services, guides, articles…" aria-label="Search the site" role="combobox" aria-expanded="true" aria-controls="vnCpList" aria-autocomplete="list" autocomplete="off" spellcheck="false" />' +
          '<kbd>esc</kbd>' +
        '</div>' +
        '<div class="vn-cp-list" id="vnCpList" role="listbox" aria-label="Results"></div>' +
        '<div class="vn-cp-ft"><span><kbd>↑↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector('input');
    list = root.querySelector('#vnCpList');

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { close(); return; }
      var it = e.target.closest('.vn-cp-it');
      if (it) { pick(Number(it.getAttribute('data-i'))); }
    });
    input.addEventListener('input', function () { sel = 0; render(input.value); });
  }

  /* ── Search + rank ─────────────────────────────────────────────── */
  function score(q, entry) {
    var t = entry.t.toLowerCase(), d = (entry.d || '').toLowerCase();
    if (!q) return 0;
    var ti = t.indexOf(q);
    if (ti === 0) return 100;
    if (ti > 0) return 80 - Math.min(ti, 20);
    var di = d.indexOf(q);
    if (di > -1) return 55 - Math.min(di, 15);
    /* subsequence over title */
    var pos = -1, hit = 0;
    for (var j = 0; j < q.length; j++) {
      pos = t.indexOf(q[j], pos + 1);
      if (pos === -1) { hit = 0; break; }
      hit += (pos === 0 || /[\s\-—:(]/.test(t[pos - 1] || '')) ? 2 : 1;
    }
    if (hit) return Math.min(hit * 6, 60);
    return 0;
  }

  function allEntries() {
    var out = [];
    PAGES.forEach(function (p) { if (p.u !== here() || (p.dl)) out.push(p); });
    ACTIONS.forEach(function (a) { out.push(a); });
    contextActions().forEach(function (c) { out.push(c); });
    dyn.forEach(function (e) { out.push(e); });
    return out;
  }

  function results(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) {
      var idle = contextActions();
      recents().slice(0, 4).forEach(function (r) {
        if (r.u !== here()) idle.push({ i: '🕘', t: r.t, d: 'Recently viewed', u: r.u, k: 'recent' });
      });
      if (!idle.length) idle = idle.concat(ACTIONS.slice(0, 3));
      return idle.slice(0, 9);
    }
    var terms = q.split(/\s+/).filter(Boolean);
    return allEntries().map(function (e) {
      var s = 0;
      for (var w = 0; w < terms.length; w++) { s += score(terms[w], e); }
      return { e: e, s: s };
    }).filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (x) { return x.e; })
      .slice(0, 14);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(q) {
    var res = results(q);
    if (!res.length) {
      list.innerHTML = '<div class="vn-cp-empty">Nothing found for “' + esc(q) + '”.<br/>Try “rag”, “audit”, “booking”, “invoice”…</div>';
      return;
    }
    list.innerHTML = res.map(function (e, i) {
      return '<div class="vn-cp-it" role="option" aria-selected="' + (i === sel) + '" data-i="' + i + '" id="vnCpOpt' + i + '">' +
        '<span class="vn-cp-ic" aria-hidden="true">' + (e.i || '•') + '</span>' +
        '<span class="vn-cp-tx"><span class="vn-cp-t">' + esc(e.t) + '</span>' +
        (e.d ? '<span class="vn-cp-d">' + esc(e.d) + '</span>' : '') + '</span>' +
        (e.k ? '<span class="vn-cp-k">' + esc(e.k) + '</span>' : '') +
        '</div>';
    }).join('');
    input.setAttribute('aria-activedescendant', 'vnCpOpt' + sel);
  }

  function move(d) {
    var items = list.querySelectorAll('.vn-cp-it');
    if (!items.length) return;
    sel = Math.max(0, Math.min(sel + d, items.length - 1));
    items.forEach(function (el) { el.setAttribute('aria-selected', 'false'); });
    items[sel].setAttribute('aria-selected', 'true');
    items[sel].scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    input.setAttribute('aria-activedescendant', 'vnCpOpt' + sel);
  }

  function pick(i) {
    var res = results(input.value);
    var e = res[i];
    if (!e) return;
    close();
    try {
      if (typeof localStorage !== 'undefined') {
        var r = recents().filter(function (x) { return x.u !== (e.u || ''); });
        if (e.u && e.u !== here()) { r.unshift({ t: e.t, u: e.u }); localStorage.setItem('vn_recent', JSON.stringify(r.slice(0, 8))); }
      }
    } catch (err) {}
    if (e.a) { e.a(); return; }
    if (e.x) { window.open(e.x, '_blank', 'noopener'); return; }
    if (e.u) { window.location.href = e.u; }
  }

  /* ── Open / close ──────────────────────────────────────────────── */
  function open(q) {
    build();
    loadDyn();
    lastFocus = document.activeElement;
    sel = 0;
    root.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    input.value = q || '';
    render(input.value);
    setTimeout(function () { input.focus(); input.select(); }, 30);
  }
  function close() {
    if (!root || !root.classList.contains('open')) return;
    root.classList.remove('open');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function toggle() { root && root.classList.contains('open') ? close() : open(); }

  /* ── Triggers ──────────────────────────────────────────────────── */
  function bindTriggers() {
    var navBtn = document.getElementById('cmdTrigger');
    if (navBtn) {
      navBtn.addEventListener('click', function () { open(); });
    } else {
      var host = document.querySelector('.nav-actions');
      if (host) {
        var b = document.createElement('button');
        b.className = 'vn-cp-trig';
        b.type = 'button';
        b.setAttribute('aria-label', 'Open site search (Cmd+K)');
        b.title = 'Search (Cmd+K or /)';
        b.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><kbd>⌘K</kbd>';
        host.insertBefore(b, host.firstChild);
        b.addEventListener('click', function () { open(); });
      } else {
        var fab = document.createElement('button');
        fab.className = 'vn-cp-fab';
        fab.type = 'button';
        fab.setAttribute('aria-label', 'Open site search (Cmd+K)');
        fab.innerHTML = '🔍 <span>Search</span>';
        document.body.appendChild(fab);
        fab.addEventListener('click', function () { open(); });
      }
    }

    document.addEventListener('keydown', function (e) {
      var typing = /^(input|textarea|select)$/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        open();
        return;
      }
      if (!root || !root.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Home') { e.preventDefault(); sel = 0; move(0); }
      else if (e.key === 'End') { e.preventDefault(); sel = list.querySelectorAll('.vn-cp-it').length - 1; move(0); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
      else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
    });
  }

  /* ── Boot ──────────────────────────────────────────────────────── */
  function boot() {
    bindTriggers();
    pushRecent();
    /* ?q= deep links — the WebSite SearchAction JSON-LD points here */
    var q = new URLSearchParams(window.location.search).get('q');
    if (q && q.trim()) open(q.trim());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
