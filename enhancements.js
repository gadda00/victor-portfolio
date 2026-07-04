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
  // Intercept same-origin link clicks and use document.startViewTransition
  // for a smooth fade between pages. Falls back to normal navigation.
  if ('startViewTransition' in document && !REDUCED_MOTION) {
    function shouldIntercept(url) {
      try {
        var target = new URL(url, location.href);
        if (target.origin !== location.origin) return false;
        // Skip if opens in new tab / has download / different protocol
        if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
        // Skip hash-only changes on same page (let smooth scroll handle)
        if (target.pathname === location.pathname && target.hash) return false;
        // Skip admin (has its own SPA-like nav) and jobs (dynamic data)
        if (target.pathname.startsWith('/admin') || target.pathname.startsWith('/jobs')) return false;
        return true;
      } catch (e) { return false; }
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.origin !== location.origin) return;
      if (!shouldIntercept(a.href)) return;

      e.preventDefault();
      var href = a.href;

      // If only the hash changed, don't intercept
      var targetUrl = new URL(href);
      if (targetUrl.pathname === location.pathname && targetUrl.search === location.search) {
        return;
      }

      document.startViewTransition(function () {
        // Navigate after the old snapshot is captured
        return new Promise(function (resolve) {
          // Use a tiny timeout so the new snapshot is captured after navigation
          location.href = href;
          // The promise won't resolve before navigation, which is fine —
          // the browser will paint the new page and VT captures it.
          // For same-document transitions we'd resolve here, but for MPA
          // the navigation itself completes the transition.
          setTimeout(resolve, 0);
        });
      });
    }, { capture: true });
  }

  // ── 2. PWA install prompt ─────────────────────────────────────────
  var deferredPrompt = null;
  var DISMISS_KEY = 'vn_pwa_install_dismissed';
  var DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    // Check if user previously dismissed
    try {
      var raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        var dismissed = parseInt(raw, 10);
        if (Date.now() - dismissed < DISMISS_TTL) return;
      }
    } catch (e) { /* ignore */ }
    showInstallBanner();
  });

  function showInstallBanner() {
    if (!deferredPrompt) return;
    // Don't show on admin/jobs (they have their own UX)
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/jobs')) return;
    // Don't double-insert
    if (document.querySelector('.pwa-install-banner')) return;

    var banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install app prompt');
    banner.innerHTML =
      '<div class="pwa-icon" aria-hidden="true">📱</div>' +
      '<div class="pwa-text">' +
        '<div class="pwa-title">Install Victor\'s Portfolio</div>' +
        '<div class="pwa-sub">Quick access · Works offline</div>' +
      '</div>' +
      '<div class="pwa-actions">' +
        '<button class="pwa-btn pwa-btn-dismiss" aria-label="Dismiss">Not now</button>' +
        '<button class="pwa-btn pwa-btn-primary">Install</button>' +
      '</div>';

    document.body.appendChild(banner);
    // Trigger reflow + show
    requestAnimationFrame(function () { banner.classList.add('visible'); });

    banner.querySelector('.pwa-btn-primary').addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        banner.classList.remove('visible');
        setTimeout(function () { banner.remove(); }, 400);
        if (choice.outcome === 'accepted') {
          try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
        }
        deferredPrompt = null;
      });
    });

    banner.querySelector('.pwa-btn-dismiss').addEventListener('click', function () {
      banner.classList.remove('visible');
      setTimeout(function () { banner.remove(); }, 400);
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
    });
  }

  window.addEventListener('appinstalled', function () {
    var b = document.querySelector('.pwa-install-banner');
    if (b) { b.classList.remove('visible'); setTimeout(function () { b.remove(); }, 400); }
    deferredPrompt = null;
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
