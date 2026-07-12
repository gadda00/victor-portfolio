/* Victor Ndunda — Site enhancements (2025 modern web platform)
   - View Transitions API for cross-page navigation (same-origin)
   - PWA install prompt (beforeinstallprompt)
   - Scroll progress indicator
   - Back-to-top button
   - Respect prefers-reduced-motion throughout
   - Progressive: all features fail gracefully if unsupported
*/
(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. View Transitions for same-origin navigations ──────────────
  // This site is an MPA (multi-page application). Cross-document view
  // transitions are enabled via the <meta name="view-transition" content="same-origin">
  // tag in each page's <head>. The browser handles snapshot capture and
  // animation natively (Chrome 123+, Safari 18+, Firefox behind flag).
  //
  // No JS interception needed — attempting to call document.startViewTransition()
  // with a location.href callback would unload the document mid-transition
  // and break the animation. The meta tag is the correct MPA mechanism.
  //
  // For same-document (SPA) navigations, we could use startViewTransition(),
  // but this site doesn't do SPA routing. Leaving this as a no-op.

  // ── 2. PWA install prompt — DISABLED ──────────────────────────────
  // User requested removal of the install popup.
  // The beforeinstallprompt event is still captured (to prevent Chrome's
  // default mini-infobar) but no custom banner is shown.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); // Prevent Chrome's default mini-infobar
  });

  // ── 3. Scroll progress indicator ──────────────────────────────────
  var progressEl = document.createElement('div');
  progressEl.className = 'scroll-progress';
  progressEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressEl);

  var ticking = false;
  function updateProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressEl.style.width = pct + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
  updateProgress();

  // ── 4. Back-to-top button ─────────────────────────────────────────
  var backTop = document.createElement('a');
  backTop.className = 'back-to-top';
  backTop.href = '#main';
  backTop.setAttribute('aria-label', 'Back to top');
  backTop.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(backTop);

  var backTopVisible = false;
  function toggleBackTop() {
    var shouldShow = window.scrollY > 600;
    if (shouldShow !== backTopVisible) {
      backTopVisible = shouldShow;
      backTop.classList.toggle('visible', backTopVisible);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { updateProgress(); toggleBackTop(); });
      ticking = true;
    }
  }, { passive: true });
  // Initial check (in case page loads scrolled, e.g. via #anchor or refresh)
  toggleBackTop();

  // ── 5. Active section tracking via IntersectionObserver ──────────
  // Highlights the nav link for the section currently in view
  if ('IntersectionObserver' in window) {
    var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) sections.push({ link: link, el: sec });
    });

    if (sections.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove('active'); });
            var match = sections.find(function (s) { return s.el === entry.target; });
            if (match) match.link.classList.add('active');
          }
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      sections.forEach(function (s) { observer.observe(s.el); });
    }
  }

  // ── 6. Print-friendly: ensure scroll progress + back-to-top hidden ─
  window.addEventListener('beforeprint', function () {
    progressEl.style.display = 'none';
    backTop.style.display = 'none';
  });
  window.addEventListener('afterprint', function () {
    progressEl.style.display = '';
    backTop.style.display = '';
  });
})();
