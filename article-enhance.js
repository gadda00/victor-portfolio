/* Victor Ndunda — Long-form reading layer (v12)
   ═══════════════════════════════════════════════════════════════════
   For blog articles (.article-body) and free guides (.guide-body):
     1. Auto TOC — sticky rail on wide screens, collapsible on mobile
     2. Scroll-spy highlight of the current section
     3. Per-heading anchor links (hover "#" → copies the deep link)
     4. Share row — copy link / WhatsApp / X with the article title
     5. Resume-where-you-left-off (scroll position memory per article)
     6. Related reading — 3 most tag-similar articles (or sibling guides)
   Everything progressive: fewer than 3 headings → no TOC; fetch fails
   → no related block; storage blocked → no scroll memory. No errors.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.querySelector('.article-body') || document.querySelector('.guide-body');
  if (!body) return;

  var IS_GUIDE = body.classList.contains('guide-body');
  var HEAD_SEL = 'h2, h3';
  var headings = Array.prototype.slice.call(body.querySelectorAll(HEAD_SEL));

  /* ── 1. Slugify + id assignment ────────────────────────────────── */
  function slugify(txt) {
    return txt.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 's';
  }
  var used = {};
  headings.forEach(function (h) {
    if (h.id) return;
    var base = slugify(h.textContent), id = base, n = 2;
    while (used[id]) { id = base + '-' + (n++); }
    used[id] = true;
    h.id = id;
  });

  var h2s = headings.filter(function (h) { return h.tagName === 'H2'; });

  /* ── 2. TOC (needs ≥3 h2s to be worth it) ──────────────────────── */
  var tocNav = null;
  if (h2s.length >= 3) {
    tocNav = document.createElement('nav');
    tocNav.className = 'vn-toc';
    tocNav.setAttribute('aria-label', 'Table of contents');

    var tocHtml = h2s.map(function (h) {
      var num = h2s.indexOf(h) + 1;
      return '<a href="#' + h.id + '" class="vn-toc-l' + (h.tagName === 'H3' ? ' sub' : '') + '" data-toc="' + h.id + '">' +
        '<span class="vn-toc-n">' + (num < 10 ? '0' + num : num) + '</span>' + h.textContent.replace(/<[^>]*>/g, '') + '</a>';
    }).join('');

    /* Mobile / narrow: collapsible block right after the intro meta */
    var details = document.createElement('details');
    details.className = 'vn-toc-mobile';
    details.innerHTML = '<summary><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/></svg>On this page</summary><div>' + tocHtml + '</div>';
    var mount = body.parentElement || body;
    var meta = mount.querySelector('.article-meta') || body.previousElementSibling;
    (meta ? meta.nextSibling ? mount.insertBefore(details, meta.nextSibling) : mount.appendChild(details) : mount.insertBefore(details, body));

    /* Wide screens: fixed right rail (scrollable if long) */
    var rail = document.createElement('div');
    rail.className = 'vn-toc-rail';
    rail.innerHTML = '<div class="vn-toc-rail-h">On this page</div>' + tocHtml;
    document.body.appendChild(rail);

    tocNav = rail;

    /* Inject styles once */
    var st = document.createElement('style');
    st.textContent =
      '.vn-toc-mobile{margin:0 0 2rem;border:1px solid var(--border,rgba(148,163,184,.18));border-radius:12px;background:var(--glass,rgba(148,163,184,.05))}' +
      '.vn-toc-mobile summary{display:flex;align-items:center;gap:.5rem;padding:.8rem 1rem;font-size:.85rem;font-weight:600;color:var(--text,#e2e8f0);cursor:pointer;list-style:none}' +
      '.vn-toc-mobile summary::-webkit-details-marker{display:none}' +
      '.vn-toc-mobile[open] summary{border-bottom:1px solid var(--border,rgba(148,163,184,.18))}' +
      '.vn-toc-mobile div{padding:.5rem .75rem .75rem}' +
      '.vn-toc-l,.vn-toc-rail a{display:flex;gap:.55rem;align-items:baseline;padding:.34rem .5rem;font-size:.8rem;color:var(--text-muted,#94a3b8);text-decoration:none;border-radius:6px;line-height:1.45}' +
      '.vn-toc-l:hover,.vn-toc-rail a:hover{color:var(--accent,#22d3ee)}' +
      '.vn-toc-l.active,.vn-toc-rail a.active{color:var(--accent,#22d3ee);background:var(--glass,rgba(148,163,184,.08))}' +
      '.vn-toc-l.sub,.vn-toc-rail a.sub{padding-left:1.5rem;font-size:.76rem}' +
      '.vn-toc-n{font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:.62rem;color:var(--text-dim,#64748b);min-width:1.1rem}' +
      '.vn-toc-rail{display:none}' +
      '@media (min-width:1180px){' +
        '.vn-toc-rail{display:block;position:fixed;top:50%;transform:translateY(-50%);right:1.5rem;width:230px;max-height:70vh;overflow-y:auto;padding:.75rem .5rem;border:1px solid var(--border,rgba(148,163,184,.14));border-radius:14px;background:var(--bg-elev,rgba(10,14,26,.7));backdrop-filter:blur(10px);scrollbar-width:thin;z-index:50}' +
        '.vn-toc-rail-h{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim,#64748b);padding:.2rem .5rem .55rem}' +
        '.vn-toc-mobile{display:none}' +
      '}' +
      '@media print{.vn-toc-rail,.vn-share{display:none!important}}';
    document.head.appendChild(st);

    /* ── Scroll-spy ──────────────────────────────────────────────── */
    if ('IntersectionObserver' in window) {
      var links = document.querySelectorAll('[data-toc]');
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('data-toc') === en.target.id); });
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      headings.forEach(function (h) { spy.observe(h); });
    }
  }

  /* ── 3. Per-heading anchor links ───────────────────────────────── */
  headings.forEach(function (h) {
    var a = document.createElement('a');
    a.className = 'vn-h-anchor';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', 'Copy link to this section');
    a.textContent = '#';
    h.classList.add('vn-has-anchor');
    h.insertBefore(a, h.firstChild);
    a.addEventListener('click', function (e) {
      e.preventDefault();
      history.replaceState(null, '', '#' + h.id);
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          if (typeof window.vnToast === 'function') window.vnToast('Section link copied ✓');
        }).catch(function () {});
      }
    });
  });
  var anchorStyle = document.createElement('style');
  anchorStyle.textContent =
    '.vn-h-anchor{position:absolute;margin-left:-1.4rem;font:700 .85em \'JetBrains Mono\',ui-monospace,monospace;color:var(--accent,#22d3ee);text-decoration:none;opacity:0;transition:opacity .15s;align-self:center}' +
    '.vn-has-anchor{position:relative}' +
    '.vn-has-anchor:hover .vn-h-anchor,.vn-h-anchor:focus{opacity:.85}' +
    '@media (max-width:860px){.vn-h-anchor{display:none}}' +
    '@media print{.vn-h-anchor{display:none}}';
  document.head.appendChild(anchorStyle);

  /* ── 4. Share row (copy link / WhatsApp / X) ────────────────────── */
  (function shareRow() {
    var host = document.querySelector('.article-meta') || (body.parentElement || body);
    var row = document.createElement('div');
    row.className = 'vn-share';
    var title = encodeURIComponent(document.title);
    var url = encodeURIComponent(window.location.origin + window.location.pathname);
    row.innerHTML =
      '<button type="button" class="vn-share-b" data-act="copy">🔗 Copy link</button>' +
      '<a class="vn-share-b" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' + title + '%20' + url + '">💬 WhatsApp</a>' +
      '<a class="vn-share-b" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=' + title + '&url=' + url + '">𝕏 Post</a>';
    host.appendChild(row);
    var st = document.createElement('style');
    st.textContent =
      '.vn-share{display:flex;gap:.5rem;flex-wrap:wrap;margin:1.1rem 0 0}' +
      '.vn-share-b{display:inline-flex;align-items:center;gap:.4rem;padding:.42rem .8rem;border-radius:999px;border:1px solid var(--border,rgba(148,163,184,.2));background:var(--glass,rgba(148,163,184,.06));color:var(--text-muted,#94a3b8);font:500 .78rem/1 inherit;cursor:pointer;text-decoration:none;transition:color .2s,border-color .2s}' +
      '.vn-share-b:hover{color:var(--accent,#22d3ee);border-color:var(--accent,#22d3ee)}';
    document.head.appendChild(st);
    row.querySelector('[data-act="copy"]').addEventListener('click', function () {
      var u = window.location.origin + window.location.pathname;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(u).then(function () {
          if (typeof window.vnToast === 'function') window.vnToast('Link copied ✓');
        }).catch(function () {});
      }
    });
  })();

  /* ── 5. Resume where you left off ──────────────────────────────── */
  (function scrollMemory() {
    var KEY = 'vn_read:' + window.location.pathname;
    var saved = 0;
    try { saved = parseFloat(localStorage.getItem(KEY) || '0') || 0; } catch (e) { return; }
    var hasHash = window.location.hash && window.location.hash.length > 1;
    if (saved > 0.15 && saved < 0.92 && !hasHash) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var restore = function () {
        var m = document.documentElement.scrollHeight - window.innerHeight;
        if (m > 400) {
          window.scrollTo(0, saved * m);
          if (typeof window.vnToast === 'function') window.vnToast('Picking up where you left off ↑', 2800);
        }
      };
      /* wait for images/layout to settle before measuring */
      if (document.readyState === 'complete') setTimeout(restore, 350);
      else window.addEventListener('load', function () { setTimeout(restore, 350); });
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var m = document.documentElement.scrollHeight - window.innerHeight;
        if (m > 400) {
          try { localStorage.setItem(KEY, String(window.scrollY / m)); } catch (e) {}
        }
      });
    }, { passive: true });
  })();

  /* ── 6. Related reading ────────────────────────────────────────── */
  (function related() {
    var mount = document.querySelector('.article-back') || body;
    var box = document.createElement('div');
    box.className = 'vn-related';
    var st = document.createElement('style');
    st.textContent =
      '.vn-related{margin-top:2.6rem;padding-top:1.8rem;border-top:1px solid var(--border,rgba(148,163,184,.16))}' +
      '.vn-related-h{font-size:.66rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim,#64748b);margin-bottom:1rem}' +
      '.vn-rel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.8rem}' +
      '.vn-rel-card{display:flex;flex-direction:column;gap:.4rem;padding:.95rem 1.05rem;border:1px solid var(--border,rgba(148,163,184,.16));border-radius:12px;background:var(--glass,rgba(148,163,184,.05));text-decoration:none;transition:border-color .2s,transform .2s}' +
      '.vn-rel-card:hover{border-color:var(--accent,#22d3ee);transform:translateY(-2px)}' +
      '.vn-rel-tag{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent,#22d3ee)}' +
      '.vn-rel-t{font-size:.86rem;font-weight:600;color:var(--text,#e2e8f0);line-height:1.45}' +
      '.vn-rel-m{font-size:.7rem;color:var(--text-dim,#64748b);margin-top:auto}' +
      '@media print{.vn-related{display:none}}';
    document.head.appendChild(st);

    function render(items, kind) {
      if (!items.length) return;
      box.innerHTML = '<div class="vn-related-h">Related ' + kind + '</div><div class="vn-rel-grid">' +
        items.map(function (p) {
          return '<a class="vn-rel-card" href="' + p.url + '">' +
            '<span class="vn-rel-tag">' + (p.tag || p.category || 'Read') + '</span>' +
            '<span class="vn-rel-t">' + p.title.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>' +
            '<span class="vn-rel-m">' + (p.readTime || p.duration || '') + '</span></a>';
        }).join('') + '</div>';
      mount.parentElement.insertBefore(box, mount);
    }

    if (IS_GUIDE) {
      fetch('/services/data.json?v=1.3').then(function (r) { return r.json(); }).then(function (d) {
        var others = (d.guides || []).filter(function (g) {
          return window.location.pathname.indexOf(g.id) === -1;
        });
        render(others.slice(0, 3), 'guides');
      }).catch(function () {});
    } else {
      fetch('/blog/posts.json').then(function (r) { return r.json(); }).then(function (d) {
        var posts = d.posts || [];
        var me = posts.filter(function (p) { return window.location.pathname === p.url; })[0];
        if (!me) return;
        var myTags = (me.tags || []).map(function (t) { return t.toLowerCase(); });
        var scored = posts.filter(function (p) { return p.url !== me.url; }).map(function (p) {
          var overlap = (p.tags || []).filter(function (t) { return myTags.indexOf(t.toLowerCase()) > -1; }).length;
          return { p: p, s: overlap };
        }).sort(function (a, b) { return b.s - a.s || (new Date(b.p.date) - new Date(a.p.date)); });
        render(scored.slice(0, 3).map(function (x) { return x.p; }), 'reading');
      }).catch(function () {});
    }
  })();
})();
