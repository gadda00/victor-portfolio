/* Victor Ndunda — i18n v8 (8 languages)
   ═══════════════════════════════════════════════════════════════════
   English · Kiswahili · Français · Español · Português · Deutsch ·
   中文（简体） · العربية (RTL)

   - Self-injects a language menu into every page's .nav-actions
     (same progressive pattern as palette.js — no per-page markup).
   - Translates the main nav (matched by href) + any [data-i18n-key]
     element. Everything else stays in the page's default English.
   - Persists the choice in localStorage('vn_lang').
   - First visit only: follows the browser language when it matches a
     supported one. A stored choice is never overridden.
   - Sets <html lang> and <html dir> (rtl for Arabic).
   - Honest coverage: non-English languages cover navigation and key
     interface only. Articles, case studies and service copy remain in
     English — the menu says so up front.

   A11y: role=menu / menuitemradio, arrow + Home/End keys, Esc closes
   and restores focus, click-outside closes, aria-live announcement on
   switch, coarse-pointer touch targets, reduced-motion aware.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORAGE_KEY = 'vn_lang';

  /* ── Supported languages (endonym names, display order) ────────── */
  var LANGS = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文（简体）' },
    { code: 'ar', name: 'العربية' }
  ];
  var RTL = { ar: true };

  /* ── Translations (navigation + key UI only — see header note) ─── */
  var dict = {
    en: {
      'nav.home': 'Home',
      'nav.services': 'Services',
      'nav.projects': 'Case Studies',
      'nav.insights': 'Writing',
      'nav.about': 'About',
      'nav.resume': 'Resume',
      'nav.book': 'Book a Free Call',
      'hero.badge': 'Available for select engagements · Nairobi 🇰🇪 & remote',
      'ui.changeLanguage': 'Change language',
      'ui.langLabel': 'Language',
      'ui.partialTag': 'partial',
      'ui.partialNote': 'Partial translation — menus and key interface only. Articles and case studies remain in English.',
      'ui.switched': 'Language switched to English'
    },
    sw: {
      'nav.home': 'Nyumbani',
      'nav.services': 'Huduma',
      'nav.projects': 'Miradi',
      'nav.insights': 'Makala',
      'nav.about': 'Kuhusu',
      'nav.resume': 'Wasifu',
      'nav.book': 'Weka Miadi ya Bure',
      'hero.badge': 'Ninapatikana kwa mashirika machache · Nairobi 🇰🇪 na mbali',
      'ui.changeLanguage': 'Badilisha lugha',
      'ui.langLabel': 'Lugha',
      'ui.partialTag': 'sehemu',
      'ui.partialNote': 'Tafsiri ya sehemu — menyu na vipengele muhimu tu. Makala na mifumo ya kesi inabaki Kiingereza.',
      'ui.switched': 'Lugha imebadilishwa kuwa Kiswahili'
    },
    fr: {
      'nav.home': 'Accueil',
      'nav.services': 'Services',
      'nav.projects': 'Études de cas',
      'nav.insights': 'Articles',
      'nav.about': 'À propos',
      'nav.resume': 'CV',
      'nav.book': 'Réserver un appel gratuit',
      'hero.badge': 'Disponible pour des missions sélectionnées · Nairobi 🇰🇪 & à distance',
      'ui.changeLanguage': 'Changer de langue',
      'ui.langLabel': 'Langue',
      'ui.partialTag': 'partiel',
      'ui.partialNote': 'Traduction partielle — menus et interface principale uniquement. Les articles et études de cas restent en anglais.',
      'ui.switched': 'Langue changée en français'
    },
    es: {
      'nav.home': 'Inicio',
      'nav.services': 'Servicios',
      'nav.projects': 'Casos de estudio',
      'nav.insights': 'Artículos',
      'nav.about': 'Sobre mí',
      'nav.resume': 'Currículum',
      'nav.book': 'Reservar una llamada gratuita',
      'hero.badge': 'Disponible para proyectos seleccionados · Nairobi 🇰🇪 y en remoto',
      'ui.changeLanguage': 'Cambiar de idioma',
      'ui.langLabel': 'Idioma',
      'ui.partialTag': 'parcial',
      'ui.partialNote': 'Traducción parcial — solo menús e interfaz principal. Los artículos y casos de estudio siguen en inglés.',
      'ui.switched': 'Idioma cambiado a español'
    },
    pt: {
      'nav.home': 'Início',
      'nav.services': 'Serviços',
      'nav.projects': 'Estudos de caso',
      'nav.insights': 'Artigos',
      'nav.about': 'Sobre mim',
      'nav.resume': 'Currículo',
      'nav.book': 'Marcar uma chamada gratuita',
      'hero.badge': 'Disponível para projetos selecionados · Nairóbi 🇰🇪 e remoto',
      'ui.changeLanguage': 'Mudar idioma',
      'ui.langLabel': 'Idioma',
      'ui.partialTag': 'parcial',
      'ui.partialNote': 'Tradução parcial — apenas menus e interface principal. Artigos e estudos de caso permanecem em inglês.',
      'ui.switched': 'Idioma alterado para português'
    },
    de: {
      'nav.home': 'Start',
      'nav.services': 'Leistungen',
      'nav.projects': 'Fallstudien',
      'nav.insights': 'Artikel',
      'nav.about': 'Über mich',
      'nav.resume': 'Lebenslauf',
      'nav.book': 'Kostenloses Gespräch buchen',
      'hero.badge': 'Verfügbar für ausgewählte Projekte · Nairobi 🇰🇪 und remote',
      'ui.changeLanguage': 'Sprache wechseln',
      'ui.langLabel': 'Sprache',
      'ui.partialTag': 'teilweise',
      'ui.partialNote': 'Teilweise Übersetzung — nur Menüs und Kernoberfläche. Artikel und Fallstudien bleiben auf Englisch.',
      'ui.switched': 'Sprache auf Deutsch geändert'
    },
    zh: {
      'nav.home': '首页',
      'nav.services': '服务',
      'nav.projects': '案例研究',
      'nav.insights': '文章',
      'nav.about': '关于',
      'nav.resume': '简历',
      'nav.book': '预约免费通话',
      'hero.badge': '可承接精选项目 · 内罗毕 🇰🇪 及远程',
      'ui.changeLanguage': '切换语言',
      'ui.langLabel': '语言',
      'ui.partialTag': '部分',
      'ui.partialNote': '部分翻译——仅菜单与关键界面。文章与案例研究仍为英文。',
      'ui.switched': '语言已切换为中文'
    },
    ar: {
      'nav.home': 'الرئيسية',
      'nav.services': 'الخدمات',
      'nav.projects': 'دراسات الحالة',
      'nav.insights': 'مقالات',
      'nav.about': 'نبذة عني',
      'nav.resume': 'السيرة الذاتية',
      'nav.book': 'احجز مكالمة مجانية',
      'hero.badge': 'متاح لمشاريع مختارة · نيروبي 🇰🇪 وعن بُعد',
      'ui.changeLanguage': 'تغيير اللغة',
      'ui.langLabel': 'اللغة',
      'ui.partialTag': 'جزئي',
      'ui.partialNote': 'ترجمة جزئية — القوائم والواجهة الرئيسية فقط. تبقى المقالات ودراسات الحالة بالإنجليزية.',
      'ui.switched': 'تم تغيير اللغة إلى العربية'
    }
  };

  /* ── Nav link → key map (matched against href) ─────────────────── */
  var NAV_MAP = [
    { re: /^\/(index\.html)?$/i, key: 'nav.home' },
    { re: /^#hero$/i, key: 'nav.home' },
    { re: /^\/services\/?(index\.html)?$/i, key: 'nav.services' },
    { re: /^\/projects\/?(index\.html)?$/i, key: 'nav.projects' },
    { re: /^\/blog\/?(index\.html)?$/i, key: 'nav.insights' },
    { re: /^(\/?)#about$/i, key: 'nav.about' },
    { re: /^\/resume\/?(index\.html)?$/i, key: 'nav.resume' },
    { re: /^\/book\/?(index\.html)?$/i, key: 'nav.book' }
  ];

  /* ── Resolve starting language ─────────────────────────────────── */
  function detectLang() {
    var list = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var base = String(list[i] || '').toLowerCase().split('-')[0];
      if (dict[base]) return base;
    }
    return null;
  }

  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
  var current = (stored && dict[stored]) ? stored : (detectLang() || 'en');

  /* ── DOM refs for the injected menu ────────────────────────────── */
  var menu = null, trigger = null, pop = null, noteEl = null;

  /* ── Apply language to the page ────────────────────────────────── */
  function apply(lang) {
    if (!dict[lang]) lang = 'en';
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    var t = dict[lang];

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL[lang] ? 'rtl' : 'ltr');
    if (document.body) document.body.setAttribute('data-lang', lang);

    /* [data-i18n-key] elements (hero badge on home, etc.) */
    var keyed = document.querySelectorAll('[data-i18n-key]');
    for (var i = 0; i < keyed.length; i++) {
      var k = keyed[i].getAttribute('data-i18n-key');
      if (t[k] !== undefined) keyed[i].textContent = t[k];
    }

    /* Nav links, matched by href so every page translates the same */
    var links = document.querySelectorAll('#nav .nav-link, nav .nav-link');
    for (var j = 0; j < links.length; j++) {
      var a = links[j];
      if (a.children.length) continue; /* never nuke icon markup */
      var href = (a.getAttribute('href') || '').trim();
      for (var m = 0; m < NAV_MAP.length; m++) {
        if (NAV_MAP[m].re.test(href)) { a.textContent = t[NAV_MAP[m].key]; break; }
      }
    }

    refreshMenu(t);
  }

  /* ── Keep trigger + menu + legacy buttons in sync ──────────────── */
  function refreshMenu(t) {
    if (trigger) {
      var codeEl = trigger.querySelector('.lang-trigger-code');
      if (codeEl) codeEl.textContent = current;
      trigger.setAttribute('aria-label', t['ui.changeLanguage']);
      trigger.setAttribute('title', t['ui.changeLanguage']);
    }
    if (pop) {
      var opts = pop.querySelectorAll('.lang-opt');
      for (var i = 0; i < opts.length; i++) {
        var o = opts[i];
        var active = o.getAttribute('data-lang-btn') === current;
        o.setAttribute('aria-checked', active ? 'true' : 'false');
        var right = o.querySelector('.lang-opt-right');
        if (right) right.textContent = active ? '✓' : (o.getAttribute('data-lang-btn') !== 'en' ? t['ui.partialTag'] : '');
      }
      if (noteEl) noteEl.textContent = t['ui.partialNote'];
      var label = pop.getAttribute('aria-label');
      if (label !== null) pop.setAttribute('aria-label', t['ui.langLabel']);
    }
    /* legacy tile buttons (if any page still carries them) */
    var legacy = document.querySelectorAll('[data-lang-btn]:not(.lang-opt)');
    for (var l = 0; l < legacy.length; l++) {
      var active2 = legacy[l].getAttribute('data-lang-btn') === current;
      legacy[l].classList.toggle('active', active2);
      legacy[l].setAttribute('aria-pressed', active2 ? 'true' : 'false');
    }
  }

  /* ── Component styles (self-injected, logical props for RTL) ───── */
  function injectStyles() {
    if (document.getElementById('vn-i18n-styles')) return;
    var st = document.createElement('style');
    st.id = 'vn-i18n-styles';
    st.textContent = ''
      + '.lang-menu{position:relative;flex:0 0 auto}'
      + '.lang-trigger{display:inline-flex;align-items:center;gap:.38rem;height:36px;padding:0 .6rem;border-radius:10px;border:1px solid var(--v6-stroke,var(--border,rgba(148,163,184,.25)));background:transparent;color:var(--v6-text-mid,var(--text-muted,#9aa7bd));font:600 .72rem/1 var(--v6-font-mono,ui-monospace,Menlo,monospace);letter-spacing:.03em;cursor:pointer;transition:border-color .2s,color .2s}'
      + '.lang-trigger:hover{border-color:var(--v6-cyan,var(--accent,#22d3ee));color:var(--v6-text-hi,var(--text,#eef2f8))}'
      + '.lang-trigger:focus-visible{outline:2px solid var(--v6-cyan,var(--accent,#22d3ee));outline-offset:2px}'
      + '.lang-trigger-code{text-transform:uppercase}'
      + '.lang-pop{position:absolute;top:calc(100% + 10px);inset-inline-end:0;min-width:238px;max-width:calc(100vw - 20px);max-height:min(70vh,430px);overflow:auto;background:#0f1420;border:1px solid var(--v6-stroke,var(--border,rgba(148,163,184,.22)));border-radius:14px;padding:.4rem;box-shadow:0 18px 50px rgba(0,0,0,.42);z-index:2500}'
      + 'html.light .lang-pop{background:#fff}'
      + '.lang-opt{display:flex;align-items:center;justify-content:space-between;gap:.75rem;width:100%;padding:.55rem .65rem;border:0;border-radius:9px;background:transparent;color:var(--v6-text-mid,var(--text-muted,#9aa7bd));font-family:inherit;font-size:.84rem;line-height:1.25;text-align:start;cursor:pointer}'
      + '.lang-opt:hover,.lang-opt:focus-visible{background:rgba(127,150,180,.14);color:var(--v6-text-hi,var(--text,#eef2f8))}'
      + '.lang-opt:focus-visible{outline:2px solid var(--v6-cyan,var(--accent,#22d3ee));outline-offset:-2px}'
      + '.lang-opt[aria-checked="true"]{color:var(--v6-text-hi,var(--text,#eef2f8));font-weight:700}'
      + '.lang-opt-right{display:inline-flex;align-items:center;min-width:1.2em;color:var(--v6-cyan,var(--accent,#22d3ee));font-size:.78rem;font-weight:600}'
      + '.lang-opt-right:empty{display:none}'
      + '.lang-note{margin:.35rem .3rem .2rem;padding:.5rem .5rem .3rem;border-top:1px solid rgba(127,150,180,.25);font-size:.66rem;line-height:1.45;color:var(--v6-text-dim,var(--text-muted,#8b98ad))}'
      + '@media (pointer:coarse){.lang-opt{padding:.72rem .65rem}}'
      + '@media (max-width:400px){.lang-trigger{padding:0 .45rem}.lang-trigger-code{display:none}}'
      + 'html[dir="rtl"] pre,html[dir="rtl"] code,html[dir="rtl"] kbd,html[dir="rtl"] samp{direction:ltr;text-align:left;unicode-bidi:embed}'
      + 'html[dir="rtl"] p,html[dir="rtl"] h1,html[dir="rtl"] h2,html[dir="rtl"] h3,html[dir="rtl"] h4,html[dir="rtl"] li,html[dir="rtl"] blockquote{unicode-bidi:plaintext}';
    document.head.appendChild(st);
  }

  /* ── Inject the menu into the first .nav-actions ───────────────── */
  function injectMenu() {
    var host = document.querySelector('.nav-actions');
    if (!host || document.querySelector('.lang-menu')) return;
    injectStyles();

    menu = document.createElement('div');
    menu.className = 'lang-menu';

    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lang-trigger';
    trigger.setAttribute('data-lang-trigger', '');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4.2" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>'
      + '<span class="lang-trigger-code">' + current + '</span>';

    pop = document.createElement('div');
    pop.className = 'lang-pop';
    pop.setAttribute('role', 'menu');
    pop.setAttribute('aria-label', 'Language');
    pop.hidden = true;

    for (var i = 0; i < LANGS.length; i++) {
      var L = LANGS[i];
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'lang-opt';
      opt.setAttribute('role', 'menuitemradio');
      opt.setAttribute('data-lang-btn', L.code);
      var name = document.createElement('span');
      name.textContent = L.name;
      name.lang = L.code; /* endonym stays in its own language */
      var right = document.createElement('span');
      right.className = 'lang-opt-right';
      right.setAttribute('aria-hidden', 'true');
      opt.appendChild(name);
      opt.appendChild(right);
      pop.appendChild(opt);
    }

    noteEl = document.createElement('p');
    noteEl.className = 'lang-note';
    pop.appendChild(noteEl);

    menu.appendChild(trigger);
    menu.appendChild(pop);
    host.insertBefore(menu, host.firstChild);

    /* events */
    trigger.addEventListener('click', function () {
      setOpen(pop.hidden);
    });
    pop.addEventListener('keydown', onMenuKey);
    window.addEventListener('resize', function () {
      if (!pop.hidden) clampPop();
    });
    document.addEventListener('click', function (e) {
      if (!pop.hidden && menu && !menu.contains(e.target)) setOpen(false);
    });
  }

  /* ── Open / close (focus management) ───────────────────────────── */
  function clampPop() {
    if (!pop || pop.hidden) return;
    pop.style.removeProperty('transform');
    var r = pop.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var overLeft = 8 - r.left;
    var overRight = r.right - (vw - 8);
    if (overLeft > 0) pop.style.transform = 'translateX(' + overLeft + 'px)';
    else if (overRight > 0) pop.style.transform = 'translateX(' + (-overRight) + 'px)';
  }

  function setOpen(open) {
    if (!pop || !trigger) return;
    pop.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var opts = pop.querySelectorAll('.lang-opt');
      var focusIdx = 0;
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].getAttribute('data-lang-btn') === current) { focusIdx = i; break; }
      }
      if (opts[focusIdx]) opts[focusIdx].focus();
      requestAnimationFrame(clampPop);
    }
  }

  function closeAndRestore() {
    if (!pop || pop.hidden) return;
    setOpen(false);
    if (trigger) trigger.focus();
  }

  function onMenuKey(e) {
    var opts = Array.prototype.slice.call(pop.querySelectorAll('.lang-opt'));
    var idx = opts.indexOf(document.activeElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        opts[(idx + 1) % opts.length].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        opts[(idx - 1 + opts.length) % opts.length].focus();
        break;
      case 'Home':
        e.preventDefault();
        opts[0].focus();
        break;
      case 'End':
        e.preventDefault();
        opts[opts.length - 1].focus();
        break;
      case 'Escape':
        e.preventDefault();
        closeAndRestore();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  /* ── Language selection (injected menu + any legacy buttons) ───── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-lang-btn]') : null;
    if (!b) return;
    var lang = b.getAttribute('data-lang-btn');
    if (lang === current) { closeAndRestore(); return; }
    apply(lang);
    announce(dict[lang]['ui.switched']);
    closeAndRestore();
  });

  function announce(msg) {
    try {
      var el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'position:absolute;left:-9999px;';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 1500);
    } catch (err) { /* ignore */ }
  }

  /* ── Init ──────────────────────────────────────────────────────── */
  function init() {
    injectMenu();
    apply(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Debug / integration hook */
  window.__i18n = {
    get current() { return current; },
    apply: apply,
    langs: LANGS.map(function (l) { return l.code; })
  };
})();
