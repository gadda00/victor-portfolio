/* Victor Ndunda — i18n (English / Swahili)
   - Persisted in localStorage('vn_lang')
   - Toggles body[data-lang] which CSS uses to show/hide [data-i18n-*-only] blocks
   - Swaps text content of any element with [data-i18n-key] attribute
   - Updates <html lang> accordingly
   - Updates toggle button active states across all pages
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'vn_lang';
  var current = localStorage.getItem(STORAGE_KEY) || 'en';

  // ── Translation table ─────────────────────────────────────────────
  var dict = {
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.work': 'Work',
      'nav.resume': 'Resume',
      'nav.blog': 'Blog',
      'nav.services': 'Services',
      'nav.contact': 'Contact',
      'nav.book': 'Book a Call',
      'nav.dashboard': 'Dashboard',
      'hero.badge': 'Available for work · Nairobi, Kenya 🇰🇪',
      'hero.title1': 'AI Engineer',
      'hero.title2': 'Founder',
      'hero.title3': 'Researcher',
      'hero.meta.loc': '📍 Nairobi, Kenya',
      'hero.meta.mission': 'Building for Africa & the world',
      'hero.cta.work': 'Explore My Work',
      'hero.cta.book': 'Book a Free Call',
      'hero.cta.resume': 'Download Resume',
      'hero.cta.blog': 'Read My Research →',
      'hero.stat.agents': 'AI Agents',
      'hero.stat.platforms': 'Platforms Live',
      'hero.stat.sources': 'Data Sources',
      'hero.stat.years': 'Years',
      'about.label': 'About',
      'about.title.pre': 'Hi, I\'m Victor — ',
      'about.title.post': 'nice to meet you.',
      'edu.label': 'Education',
      'edu.title.pre': 'Academic ',
      'edu.title.post': 'foundation.',
      'edu.cta.view': 'View full resume',
      'edu.cta.download': 'Download PDF',
      'services.label': 'Services',
      'services.title.pre': 'What I can ',
      'services.title.post': 'build for you.',
      'services.cta': 'Explore all services & pricing',
      'testimonials.label': 'Testimonials',
      'testimonials.title.pre': 'What people ',
      'testimonials.title.post': 'say.',
      'contact.label': 'Contact',
      'contact.title.pre': 'Let\'s build ',
      'contact.title.post': 'something.',
      'footer.rights': '© 2026 Victor Ndunda · Built in Nairobi, Kenya 🇰🇪'
    },
    sw: {
      'nav.home': 'Nyumbani',
      'nav.about': 'Kuhusu',
      'nav.work': 'Kazi',
      'nav.resume': 'Wasifu',
      'nav.blog': 'Blogu',
      'nav.services': 'Huduma',
      'nav.contact': 'Wasiliana',
      'nav.book': 'Weka Miadi',
      'nav.dashboard': 'Dashibodi',
      'hero.badge': 'Ninapatikana kwa kazi · Nairobi, Kenya 🇰🇪',
      'hero.title1': 'Injiniya wa AI',
      'hero.title2': 'Mwanzilishi',
      'hero.title3': 'Mtafiti',
      'hero.meta.loc': '📍 Nairobi, Kenya',
      'hero.meta.mission': 'Ninajenga kwa Afrika na dunia',
      'hero.cta.work': 'Tazama Kazi Yangu',
      'hero.cta.book': 'Weka Miadi ya Bure',
      'hero.cta.resume': 'Pakua Wasifu',
      'hero.cta.blog': 'Soma Utafiti Wangu →',
      'hero.stat.agents': 'Mawakala wa AI',
      'hero.stat.platforms': 'Jukwaa Zilizopo',
      'hero.stat.sources': 'Vyanzo vya Data',
      'hero.stat.years': 'Miaka',
      'about.label': 'Kuhusu',
      'about.title.pre': 'Habari, mimi ni Victor — ',
      'about.title.post': 'nafurahi kukutana.',
      'edu.label': 'Elimu',
      'edu.title.pre': 'Msingi wa ',
      'edu.title.post': 'elimu.',
      'edu.cta.view': 'Tazama wasifu kamili',
      'edu.cta.download': 'Pakua PDF',
      'services.label': 'Huduma',
      'services.title.pre': 'Ninachoweza ',
      'services.title.post': 'kukujengezia.',
      'services.cta': 'Tazama huduma zote na bei',
      'testimonials.label': 'Ushahidi',
      'testimonials.title.pre': 'Watu wanacho ',
      'testimonials.title.post': 'sema.',
      'contact.label': 'Wasiliana',
      'contact.title.pre': 'Tujenge ',
      'contact.title.post': 'jambo.',
      'footer.rights': '© 2026 Victor Ndunda · Imejengwa Nairobi, Kenya 🇰🇪'
    }
  };

  // ── Apply language to DOM ─────────────────────────────────────────
  function apply(lang) {
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang === 'sw' ? 'sw' : 'en');
    document.body.setAttribute('data-lang', lang);

    var t = dict[lang] || dict.en;
    var nodes = document.querySelectorAll('[data-i18n-key]');
    nodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n-key');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    // Update toggle buttons
    var btns = document.querySelectorAll('[data-lang-btn]');
    btns.forEach(function (b) {
      var active = b.getAttribute('data-lang-btn') === lang;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  // ── Wire up toggle buttons (on any page that has them) ───────────
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang-btn]');
    if (!b) return;
    var lang = b.getAttribute('data-lang-btn');
    if (lang === current) return;
    apply(lang);
    // Optional: announce
    try {
      var announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.style.cssText = 'position:absolute;left:-9999px;';
      announcement.textContent = lang === 'sw' ? 'Lugha imebadilishwa kuwa Kiswahili' : 'Language switched to English';
      document.body.appendChild(announcement);
      setTimeout(function () { announcement.remove(); }, 1500);
    } catch (err) { /* ignore */ }
  });

  // ── Apply on load ─────────────────────────────────────────────────
  // Defer until DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(current); });
  } else {
    apply(current);
  }

  // Expose for debugging
  window.__i18n = { get current() { return current; }, apply: apply };
})();
