/* Victor Ndunda — Resume page JS
   - Theme + mobile nav (mirrors app.js behaviour for /resume/)
   - Print button handler
   - Download tracking (localStorage counter, surfaced in /dashboard/)
*/
(function () {
  'use strict';

  // ── Theme bootstrap ───────────────────────────────────────────────
  var stored = localStorage.getItem('theme');
  var theme = stored || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      var nxt = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove(cur);
      document.documentElement.classList.add(nxt);
      localStorage.setItem('theme', nxt);
    });
  }

  // ── Mobile nav ────────────────────────────────────────────────────
  var mt = document.getElementById('mobileToggle');
  var nl = document.getElementById('navLinks');
  if (mt && nl) {
    mt.addEventListener('click', function () {
      nl.classList.toggle('open');
      mt.setAttribute('aria-expanded', nl.classList.contains('open') ? 'true' : 'false');
    });
    nl.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nl.classList.remove('open'); });
    });
  }

  // ── Nav scroll shadow ─────────────────────────────────────────────
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 10) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Print button ──────────────────────────────────────────────────
  var printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // ── Download tracking (localStorage) ──────────────────────────────
  var dlLinks = document.querySelectorAll('a[href*="Victor-Ndunda-Resume.pdf"]');
  dlLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      try {
        var raw = localStorage.getItem('vn_resume_downloads');
        var arr = raw ? JSON.parse(raw) : [];
        arr.push({ ts: Date.now(), ua: navigator.userAgent.slice(0, 120) });
        // keep last 100
        if (arr.length > 100) arr = arr.slice(-100);
        localStorage.setItem('vn_resume_downloads', JSON.stringify(arr));
      } catch (e) { /* ignore */ }
    });
  });

  // ── Reveal on scroll ──────────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.resume-section, .resume-card').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity 0.6s var(--ease, ease), transform 0.6s var(--ease, ease)';
      io.observe(el);
    });
    var style = document.createElement('style');
    style.textContent = '.in-view{opacity:1 !important;transform:none !important;}';
    document.head.appendChild(style);
  }
})();
