/* Victor Ndunda — Dashboard Hub JS
   - Theme + mobile nav
   - Lightweight localStorage analytics:
       * visit counter (per-browser)
       * resume download counts (cross-page, written by /resume/resume.js)
       * job applications (written by /jobs/ page when user applies)
   - Renders KPIs + recent downloads list
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

  // ── Analytics: visit counter ──────────────────────────────────────
  function bumpVisits() {
    try {
      var raw = localStorage.getItem('vn_visits');
      var data = raw ? JSON.parse(raw) : { total: 0, sessions: [], lastVisit: null };
      var now = Date.now();
      // New session if last visit > 30 min ago
      var isNewSession = !data.lastVisit || (now - data.lastVisit) > 30 * 60 * 1000;
      if (isNewSession) {
        data.total = (data.total || 0) + 1;
        data.sessions.push(now);
        if (data.sessions.length > 50) data.sessions = data.sessions.slice(-50);
      }
      data.lastVisit = now;
      localStorage.setItem('vn_visits', JSON.stringify(data));
      return data;
    } catch (e) {
      return { total: 0, sessions: [], lastVisit: null };
    }
  }

  function formatRelative(ts) {
    var diff = Date.now() - ts;
    if (diff < 60 * 1000) return 'just now';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  }

  function formatDate(ts) {
    try {
      var d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
             ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return new Date(ts).toISOString(); }
  }

  // ── Render KPIs ───────────────────────────────────────────────────
  function renderKPIs() {
    var visits = bumpVisits();

    var visitsEl = document.getElementById('kpiVisits');
    if (visitsEl) visitsEl.textContent = String(visits.total || 0);

    // Resume downloads
    var dlCount = 0;
    var dlArr = [];
    try {
      var raw = localStorage.getItem('vn_resume_downloads');
      if (raw) {
        dlArr = JSON.parse(raw) || [];
        dlCount = dlArr.length;
      }
    } catch (e) { /* ignore */ }
    var dlEl = document.getElementById('kpiResumeDls');
    if (dlEl) dlEl.textContent = String(dlCount);

    // Job applications (written by /jobs/ page — uses vn_jobs_applications key)
    var appCount = 0;
    var appArr = [];
    try {
      var rawApps = localStorage.getItem('vn_jobs_applications');
      if (rawApps) {
        appArr = JSON.parse(rawApps) || [];
        appCount = appArr.length;
      }
    } catch (e) { /* ignore */ }
    var appsEl = document.getElementById('kpiJobApps');
    if (appsEl) appsEl.textContent = String(appCount);

    // Last visit
    var lvEl = document.getElementById('kpiLastVisit');
    if (lvEl) {
      lvEl.textContent = visits.lastVisit ? formatRelative(visits.lastVisit) : '—';
    }

    // Recent downloads list (merge with recent job applications, sort by time)
    var listEl = document.getElementById('recentDownloads');
    if (listEl) {
      // Build a unified activity feed
      var feed = [];
      dlArr.forEach(function (item) {
        feed.push({ type: 'resume', ts: item.ts, label: '📄 Resume PDF downloaded' });
      });
      appArr.forEach(function (app) {
        var ts = app.appliedAt ? new Date(app.appliedAt).getTime() : (app.updatedAt || app.createdAt || Date.now());
        var label = '💼 Applied: ' + (app.title || app.jobId || 'job');
        if (app.company) label += ' @ ' + app.company;
        feed.push({ type: 'job', ts: ts, label: label });
      });
      feed.sort(function (a, b) { return b.ts - a.ts; });
      feed = feed.slice(0, 10);

      if (feed.length === 0) {
        listEl.innerHTML = '<div class="activity-empty">No activity yet. <a href="/resume/Victor-Ndunda-Resume.pdf" download style="color:var(--accent)">Download resume</a> or <a href="/jobs/" style="color:var(--accent)">apply to a job</a>.</div>';
      } else {
        listEl.innerHTML = feed.map(function (item) {
          return '<div class="activity-item">' +
                   '<span>' + item.label + '</span>' +
                   '<span class="activity-time">' + formatRelative(item.ts) + '</span>' +
                 '</div>';
        }).join('');
      }
    }
  }

  // Defer until DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderKPIs);
  } else {
    renderKPIs();
  }

  // Refresh relative times every 30s
  setInterval(function () {
    var visits = bumpVisits();
    var lvEl = document.getElementById('kpiLastVisit');
    if (lvEl && visits.lastVisit) lvEl.textContent = formatRelative(visits.lastVisit);
  }, 30000);
})();
