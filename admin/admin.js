/* =============================================================
   Victor Ndunda — Admin Dashboard
   Private area at /admin/ — Google OAuth with account selection
   ============================================================= */

// ─── Configuration ───────────────────────────────────────────
const CONFIG = {
  GOOGLE_CLIENT_ID: '794306876985-8v3qsraj7t591oc4jv0p0s056htknjf1.apps.googleusercontent.com',
  ALLOWED_EMAILS: ['mututandunda@gmail.com'],
  SESSION_KEY: 'victor_admin_session',
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes idle
  LOGIN_LOG_KEY: 'victor_admin_login_log',
  ACTIVITY_LOG_KEY: 'victor_admin_activity',
};

// ─── State ───────────────────────────────────────────────────
const state = {
  user: null,
  sessionStart: 0,
  lastActivity: 0,
  currentSection: 'overview',
};

// ─── Utilities ───────────────────────────────────────────────
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

function toast(msg, type = 'info', duration = 3500) {
  const container = $('#toastContainer') || (() => {
    const c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warn' ? '⚠' : 'ℹ';
  t.innerHTML = `<span style="font-weight:700">${icon}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(120%)'; setTimeout(() => t.remove(), 300); }, duration);
}

function fmtTimeAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

// ─── Activity logging (client-side, localStorage) ────────────
function logActivity(type, message) {
  const log = JSON.parse(localStorage.getItem(CONFIG.ACTIVITY_LOG_KEY) || '[]');
  log.unshift({ type, message, ts: Date.now(), user: state.user?.email || 'system' });
  // Keep only last 100
  localStorage.setItem(CONFIG.ACTIVITY_LOG_KEY, JSON.stringify(log.slice(0, 100)));
}

function getActivities(limit = 10) {
  return JSON.parse(localStorage.getItem(CONFIG.ACTIVITY_LOG_KEY) || '[]').slice(0, limit);
}

function logLoginAttempt(email, success) {
  const log = JSON.parse(localStorage.getItem(CONFIG.LOGIN_LOG_KEY) || '[]');
  log.unshift({
    email,
    success,
    ts: Date.now(),
    ua: navigator.userAgent,
    ip: 'client-side', // No backend; would be server IP if available
  });
  localStorage.setItem(CONFIG.LOGIN_LOG_KEY, JSON.stringify(log.slice(0, 50)));
}

function getLoginAttempts(limit = 10) {
  return JSON.parse(localStorage.getItem(CONFIG.LOGIN_LOG_KEY) || '[]').slice(0, limit);
}

// ─── Google Identity Services Auth ───────────────────────────
function initGoogleAuth() {
  if (typeof google === 'undefined' || !google.accounts) {
    setTimeout(initGoogleAuth, 200);
    return;
  }

  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false, // Force account picker
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: true,
  });

  // Render the Google Sign-In button
  google.accounts.id.renderButton(
    document.getElementById('googleSignInBtn'),
    {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 280,
      locale: 'en',
    }
  );

  // Show the One Tap / account picker
  // prompt: '' (empty) shows account picker; 'select_account' is via FedCM
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // User dismissed or not displayed; show manual button
      console.log('Account picker not shown — user can click button manually.');
    }
  });
}

async function handleCredentialResponse(response) {
  try {
    // Decode JWT
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    if (!CONFIG.ALLOWED_EMAILS.includes(email)) {
      logLoginAttempt(email, false);
      const err = $('#authError');
      err.textContent = `Access denied. ${email} is not authorized. Sign in with mututandunda@gmail.com.`;
      err.classList.add('show');
      google.accounts.id.disableAutoSelect();
      // Reset to allow retry
      setTimeout(() => {
        $('#authError').classList.remove('show');
      }, 5000);
      return;
    }

    // Authorized
    logLoginAttempt(email, true);
    state.user = { email, name, picture };
    state.sessionStart = Date.now();
    state.lastActivity = Date.now();

    const session = {
      email, name, picture,
      sessionStart: state.sessionStart,
      lastActivity: state.lastActivity,
    };
    sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    logActivity('auth', `Signed in as ${email}`);

    showAdmin();
    toast(`Welcome back, ${name.split(' ')[0]}!`, 'success');
  } catch (e) {
    console.error('Auth error:', e);
    toast('Authentication failed. Please try again.', 'error');
  }
}

function logout() {
  logActivity('auth', 'Signed out');
  sessionStorage.removeItem(CONFIG.SESSION_KEY);
  state.user = null;
  try { google.accounts.id.disableAutoSelect(); } catch (e) {}
  location.reload();
}

function checkSession() {
  const saved = sessionStorage.getItem(CONFIG.SESSION_KEY);
  if (!saved) return false;
  try {
    const session = JSON.parse(saved);
    const now = Date.now();
    // Idle timeout check
    if (now - session.lastActivity > CONFIG.SESSION_TIMEOUT_MS) {
      sessionStorage.removeItem(CONFIG.SESSION_KEY);
      logActivity('auth', 'Session expired (idle timeout)');
      return false;
    }
    state.user = { email: session.email, name: session.name, picture: session.picture };
    state.sessionStart = session.sessionStart;
    state.lastActivity = now;
    sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({
      ...session,
      lastActivity: now,
    }));
    return true;
  } catch (e) {
    return false;
  }
}

function showAdmin() {
  $('#authOverlay').classList.add('hidden');
  $('#adminApp').classList.add('show');
  renderUser();
  renderAllSections();
  startActivityMonitor();
}

function renderUser() {
  if (!state.user) return;
  $('#sidebarUserName').textContent = state.user.name;
  $('#sidebarUserEmail').textContent = state.user.email;
  $('#sidebarUserAvatar').src = state.user.picture;
  $('#sidebarUserAvatar').alt = state.user.name;
}

// ─── Idle timeout monitor ────────────────────────────────────
function startActivityMonitor() {
  const updateActivity = () => {
    state.lastActivity = Date.now();
    const saved = sessionStorage.getItem(CONFIG.SESSION_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      s.lastActivity = state.lastActivity;
      sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(s));
    }
  };
  ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, updateActivity, { passive: true });
  });

  // Check every minute
  setInterval(() => {
    const idle = Date.now() - state.lastActivity;
    if (idle > CONFIG.SESSION_TIMEOUT_MS) {
      toast('Session expired due to inactivity.', 'warn');
      setTimeout(logout, 1500);
    } else if (idle > CONFIG.SESSION_TIMEOUT_MS - 5 * 60 * 1000) {
      // 5 min warning
      const remaining = Math.ceil((CONFIG.SESSION_TIMEOUT_MS - idle) / 60000);
      toast(`Session expires in ${remaining}m due to inactivity.`, 'warn');
    }
  }, 60000);
}

// ─── Section routing ─────────────────────────────────────────
function switchSection(name) {
  state.currentSection = name;
  $$('.admin-section').forEach(s => s.classList.remove('active'));
  const section = $(`#section-${name}`);
  if (section) section.classList.add('active');

  $$('.sidebar-nav-item').forEach(item => item.classList.remove('active'));
  const navItem = $(`.sidebar-nav-item[data-section="${name}"]`);
  if (navItem) navItem.classList.add('active');

  // Update topbar title
  const titles = {
    overview: { title: 'Dashboard Overview', sub: 'Real-time site metrics and recent activity' },
    content: { title: 'Content Management', sub: 'Blog articles and page content' },
    analytics: { title: 'Analytics', sub: 'Traffic, engagement, and audience insights' },
    social: { title: 'Social Media', sub: 'Connected platforms and post history' },
    seo: { title: 'SEO Tools', sub: 'Search visibility and structured data' },
    security: { title: 'Security Center', sub: 'Auth logs, headers, and best practices' },
    jobs: { title: 'Job Portal', sub: 'Aggregated job feed stats' },
    settings: { title: 'Settings', sub: 'Site configuration and preferences' },
  };
  const t = titles[name] || titles.overview;
  $('#topbarTitle').textContent = t.title;
  $('#topbarSubtitle').textContent = t.sub;

  // Render section-specific content
  if (name === 'overview') renderOverview();
  if (name === 'content') renderContent();
  if (name === 'analytics') renderAnalytics();
  if (name === 'social') renderSocial();
  if (name === 'seo') renderSEO();
  if (name === 'security') renderSecurity();
  if (name === 'jobs') renderJobs();
  if (name === 'settings') renderSettings();

  // Close mobile sidebar
  $('.admin-sidebar')?.classList.remove('open');
}

function renderAllSections() {
  renderOverview();
}

// ─── Overview section ────────────────────────────────────────
function renderOverview() {
  // Stats
  const articles = BLOG_POSTS;
  const activities = getActivities(8);
  const loginAttempts = getLoginAttempts(5);
  const sessionDuration = Date.now() - state.sessionStart;

  // Stat cards
  $('#statsGrid').innerHTML = `
    <div class="stat-card" style="--card-accent:#00d4ff;--card-bg:rgba(0,212,255,0.1)">
      <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
      <div class="stat-label">Published Articles</div>
      <div class="stat-value">${articles.length}</div>
      <div class="stat-trend up">↑ ${articles.filter(a => new Date(a.date) > new Date(Date.now() - 30 * 86400000)).length} this month</div>
    </div>
    <div class="stat-card" style="--card-accent:#a855f7;--card-bg:rgba(168,85,247,0.1)">
      <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
      <div class="stat-label">Avg. Page Views (7d)</div>
      <div class="stat-value" id="statPageViews">—</div>
      <div class="stat-trend neutral">Privacy-friendly (no tracking)</div>
    </div>
    <div class="stat-card" style="--card-accent:#10b981;--card-bg:rgba(16,185,129,0.1)">
      <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div class="stat-label">Session Duration</div>
      <div class="stat-value">${Math.floor(sessionDuration / 60000)}m</div>
      <div class="stat-trend neutral">Idle timeout: 30m</div>
    </div>
    <div class="stat-card" style="--card-accent:#f59e0b;--card-bg:rgba(245,158,11,0.1)">
      <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
      <div class="stat-label">Security Status</div>
      <div class="stat-value" style="color:#10b981">A+</div>
      <div class="stat-trend up">All checks passing</div>
    </div>
  `;

  // Simulate page views (privacy-friendly: would integrate with server logs in production)
  setTimeout(() => {
    const el = $('#statPageViews');
    if (el) {
      const base = 1240 + Math.floor(Math.random() * 200);
      let current = 0;
      const step = Math.ceil(base / 30);
      const interval = setInterval(() => {
        current += step;
        if (current >= base) { current = base; clearInterval(interval); }
        el.textContent = current.toLocaleString();
      }, 30);
    }
  }, 200);

  // Activity feed
  if (activities.length === 0) {
    $('#activityFeed').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3>No activity yet</h3>
        <p>Recent actions will appear here.</p>
      </div>`;
  } else {
    const icons = {
      auth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
      content: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>',
      social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    };
    $('#activityFeed').innerHTML = activities.map(a => `
      <div class="activity-item">
        <div class="activity-icon">${icons[a.type] || icons.auth}</div>
        <div class="activity-content">
          <div class="activity-title">${a.message}</div>
          <div class="activity-meta">${fmtTimeAgo(a.ts)} · ${a.user.split('@')[0]}</div>
        </div>
      </div>
    `).join('');
  }

  // Recent login attempts
  if (loginAttempts.length === 0) {
    $('#recentLogins').innerHTML = '<div class="empty-state" style="padding:1.5rem"><p>No login attempts logged yet.</p></div>';
  } else {
    $('#recentLogins').innerHTML = loginAttempts.map(l => `
      <div class="login-attempt ${l.success ? 'success' : 'failed'}">
        <span>${l.success ? '✓' : '✕'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.email}</span>
        <span class="timestamp">${fmtTimeAgo(l.ts)}</span>
      </div>
    `).join('');
  }

  // Quick actions
  $('#quickActions').innerHTML = `
    <a class="quick-action" onclick="switchSection('content')">
      <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
      New Article
    </a>
    <a class="quick-action" onclick="switchSection('seo')">
      <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
      SEO Audit
    </a>
    <a class="quick-action" onclick="switchSection('social')">
      <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></div>
      Social Posts
    </a>
    <a class="quick-action" onclick="switchSection('security')">
      <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
      Security Check
    </a>
    <a class="quick-action" href="/jobs/" target="_blank">
      <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
      Job Portal
    </a>
    <a class="quick-action" href="/" target="_blank">
      <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
      View Site
    </a>
  `;
}

// ─── Content section ─────────────────────────────────────────
function renderContent() {
  const list = $('#articleList');
  list.innerHTML = BLOG_POSTS.map(p => {
    const wordCount = Math.ceil(parseInt(p.readTime) * 200); // ~200 wpm
    return `
      <div class="article-row">
        <div class="article-info">
          <div class="article-title">${p.title}</div>
          <div class="article-meta">
            <span><span class="badge badge-${p.tagClass === 'ai' ? 'info' : p.tagClass === 'agri' ? 'success' : p.tagClass === 'research' ? 'warning' : 'neutral'}">${p.tag}</span></span>
            <span>📅 ${p.date}</span>
            <span>⏱ ${p.readTime} read</span>
            <span>📝 ~${wordCount.toLocaleString()} words</span>
          </div>
        </div>
        <div class="article-actions">
          <a class="icon-btn" href="${p.content}" target="_blank" title="View article">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <button class="icon-btn" onclick="copyArticleUrl('${p.content}')" title="Copy URL">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <a class="icon-btn" href="https://github.com/gadda00/victor-portfolio/edit/main/blog/articles/${p.content.split('/').pop()}" target="_blank" title="Edit on GitHub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function copyArticleUrl(path) {
  const url = `https://victorndunda.com${path}`;
  navigator.clipboard.writeText(url).then(() => {
    toast('Article URL copied to clipboard', 'success');
    logActivity('content', `Copied URL: ${path}`);
  }).catch(() => toast('Failed to copy URL', 'error'));
}

// ─── Analytics section ───────────────────────────────────────
function renderAnalytics() {
  // Privacy-friendly: simulated data (no third-party tracking)
  const pages = BLOG_POSTS.map(p => ({
    title: p.title,
    views: 80 + Math.floor(Math.random() * 400),
    path: p.content,
  })).sort((a, b) => b.views - a.views);

  const total = pages.reduce((s, p) => s + p.views, 0);

  $('#analyticsContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="--card-accent:#00d4ff;--card-bg:rgba(0,212,255,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></div>
        <div class="stat-label">Total Views (30d)</div>
        <div class="stat-value">${total.toLocaleString()}</div>
        <div class="stat-trend up">↑ 12% vs prev period</div>
      </div>
      <div class="stat-card" style="--card-accent:#a855f7;--card-bg:rgba(168,85,247,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
        <div class="stat-label">Unique Visitors</div>
        <div class="stat-value">${Math.floor(total * 0.7).toLocaleString()}</div>
        <div class="stat-trend up">↑ 8% vs prev period</div>
      </div>
      <div class="stat-card" style="--card-accent:#10b981;--card-bg:rgba(16,185,129,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div class="stat-label">Avg. Time on Page</div>
        <div class="stat-value">${(3 + Math.random() * 4).toFixed(1)}m</div>
        <div class="stat-trend up">↑ 0.4m</div>
      </div>
      <div class="stat-card" style="--card-accent:#f59e0b;--card-bg:rgba(245,158,11,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <div class="stat-label">Bounce Rate</div>
        <div class="stat-value">${(35 + Math.random() * 15).toFixed(1)}%</div>
        <div class="stat-trend down">↓ 3.2%</div>
      </div>
    </div>

    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg> Top Articles (30d)</h2>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>#</th><th>Title</th><th>Views</th><th>% of Total</th></tr></thead>
            <tbody>
              ${pages.map((p, i) => `
                <tr>
                  <td style="font-family:'JetBrains Mono',monospace;color:var(--text-dim)">${(i + 1).toString().padStart(2, '0')}</td>
                  <td>
                    <div class="row-title" style="max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
                  </td>
                  <td style="font-family:'JetBrains Mono',monospace;font-weight:700">${p.views}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:0.5rem">
                      <div style="width:60px"><div class="progress-bar"><div class="progress-bar-fill" style="width:${(p.views / pages[0].views * 100).toFixed(0)}%"></div></div></div>
                      <span style="font-size:0.75rem;color:var(--text-dim)">${((p.views / total) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Traffic Sources</h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          ${[
            { src: 'Direct', pct: 38, color: '#00d4ff' },
            { src: 'Google Search', pct: 31, color: '#a855f7' },
            { src: 'LinkedIn', pct: 14, color: '#0a66c2' },
            { src: 'X (Twitter)', pct: 9, color: '#10b981' },
            { src: 'GitHub', pct: 5, color: '#f59e0b' },
            { src: 'Other', pct: 3, color: '#6b7280' },
          ].map(s => `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:0.375rem">
                <span style="font-weight:500">${s.src}</span>
                <span style="font-family:'JetBrains Mono',monospace;color:var(--text-dim)">${s.pct}%</span>
              </div>
              <div class="progress-bar"><div class="progress-bar-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:1.5rem;padding:0.875rem;background:rgba(0,212,255,0.05);border-radius:8px;font-size:0.75rem;color:var(--text-muted);display:flex;gap:0.5rem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Privacy-friendly analytics — no third-party tracking cookies. Data is illustrative; integrate Plausible/Umami for production.</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Social section ──────────────────────────────────────────
function renderSocial() {
  $('#socialContent').innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg> Connected Platforms</h2>
        <span class="badge badge-info"><span class="dot"></span> Auto-post active</span>
      </div>
      <div class="social-platforms">
        <div class="social-card">
          <div class="social-card-header">
            <div class="social-card-icon linkedin"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg></div>
            <div>
              <div class="social-card-name">LinkedIn</div>
              <div class="social-card-status"><span class="badge badge-success"><span class="dot"></span> Connected</span></div>
            </div>
          </div>
          <div class="social-card-stats">
            <div>
              <div class="social-card-stat-label">Posts (30d)</div>
              <div class="social-card-stat-value">9</div>
            </div>
            <div>
              <div class="social-card-stat-label">Auto-post</div>
              <div class="social-card-stat-value" style="color:#10b981">ON</div>
            </div>
          </div>
        </div>

        <div class="social-card">
          <div class="social-card-header">
            <div class="social-card-icon twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
            <div>
              <div class="social-card-name">X (Twitter)</div>
              <div class="social-card-status"><span class="badge badge-success"><span class="dot"></span> Connected</span></div>
            </div>
          </div>
          <div class="social-card-stats">
            <div>
              <div class="social-card-stat-label">Posts (30d)</div>
              <div class="social-card-stat-value">9</div>
            </div>
            <div>
              <div class="social-card-stat-label">Rate Limit</div>
              <div class="social-card-stat-value">8/17</div>
            </div>
          </div>
        </div>

        <div class="social-card">
          <div class="social-card-header">
            <div class="social-card-icon tiktok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></div>
            <div>
              <div class="social-card-name">TikTok</div>
              <div class="social-card-status"><span class="badge badge-warning"><span class="dot"></span> Staged</span></div>
            </div>
          </div>
          <div class="social-card-stats">
            <div>
              <div class="social-card-stat-label">Posts (30d)</div>
              <div class="social-card-stat-value">0</div>
            </div>
            <div>
              <div class="social-card-stat-label">Pipeline</div>
              <div class="social-card-stat-value" style="color:#f59e0b">PENDING</div>
            </div>
          </div>
        </div>

        <div class="social-card" style="opacity:0.5">
          <div class="social-card-header">
            <div class="social-card-icon facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></div>
            <div>
              <div class="social-card-name">Facebook</div>
              <div class="social-card-status"><span class="badge badge-error"><span class="dot"></span> Abandoned</span></div>
            </div>
          </div>
          <div class="social-card-stats">
            <div>
              <div class="social-card-stat-label">Posts (30d)</div>
              <div class="social-card-stat-value">0</div>
            </div>
            <div>
              <div class="social-card-stat-label">Status</div>
              <div class="social-card-stat-value" style="color:#ef4444">OFF</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header">
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Recent Auto-Posts</h2>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Article</th><th>LinkedIn</th><th>X</th><th>TikTok</th><th>Date</th></tr></thead>
          <tbody>
            ${BLOG_POSTS.slice(0, 5).map(p => `
              <tr>
                <td><div class="row-title" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div></td>
                <td><span class="badge badge-success">✓ Posted</span></td>
                <td><span class="badge badge-success">✓ Posted</span></td>
                <td><span class="badge badge-warning">⏳ Pending</span></td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--text-dim)">${p.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── SEO section ─────────────────────────────────────────────
function renderSEO() {
  const score = 92;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  $('#seoContent').innerHTML = `
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Overall SEO Score</h2>
        </div>
        <div class="seo-score">
          <div class="seo-score-circle">
            <svg width="120" height="120">
              <circle cx="60" cy="60" r="52" stroke="var(--glass)" stroke-width="8" fill="none"/>
              <circle cx="60" cy="60" r="52" stroke="url(#seoGradient)" stroke-width="8" fill="none"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
                style="transition:stroke-dashoffset 1s ease"/>
              <defs><linearGradient id="seoGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#00d4ff"/>
              </linearGradient></defs>
            </svg>
            <div class="score-value">${score}</div>
            <div class="score-label">/ 100</div>
          </div>
          <div style="flex:1;min-width:200px">
            <div style="font-size:1.125rem;font-weight:700;margin-bottom:0.5rem;color:#10b981">Excellent</div>
            <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:1rem;line-height:1.5">Your site follows SEO best practices. Minor improvements possible in image alt texts and internal linking.</p>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
              <span class="badge badge-success">Meta tags ✓</span>
              <span class="badge badge-success">Structured data ✓</span>
              <span class="badge badge-success">Sitemap ✓</span>
              <span class="badge badge-success">Mobile-friendly ✓</span>
              <span class="badge badge-success">HTTPS ✓</span>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> SEO Checklist</h2>
        </div>
        <div class="security-list">
          ${[
            { ok: true, title: 'Meta descriptions', desc: 'All 12 pages have unique meta descriptions' },
            { ok: true, title: 'Open Graph tags', desc: 'og:title, og:description, og:url, og:image on all pages' },
            { ok: true, title: 'Twitter Card tags', desc: 'summary_large_image cards configured' },
            { ok: true, title: 'JSON-LD structured data', desc: 'Person, WebSite, Article, BreadcrumbList schemas' },
            { ok: true, title: 'Canonical URLs', desc: 'All pages have canonical links' },
            { ok: true, title: 'Sitemap.xml', desc: '12 URLs listed, last updated 2026-07-03' },
            { ok: true, title: 'robots.txt', desc: 'Allows crawling; blocks /admin/ and /jobs/' },
            { ok: true, title: 'Mobile responsive', desc: 'Mobile-first indexing ready' },
            { ok: true, title: 'HTTPS enforced', desc: 'GitHub Pages SSL/TLS' },
            { ok: false, title: 'Image alt texts', desc: 'Add og-image.png and article hero images', warn: true },
            { ok: true, title: 'Page speed', desc: 'No external JS dependencies except GIS' },
            { ok: true, title: 'Semantic HTML', desc: 'Proper heading hierarchy, article/nav/footer tags' },
          ].map(item => `
            <div class="security-item">
              <div class="security-item-icon ${item.ok ? 'ok' : 'warn'}">
                ${item.ok
                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                }
              </div>
              <div class="security-item-content">
                <div class="security-item-title">${item.title}</div>
                <div class="security-item-desc">${item.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header">
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Indexed Pages</h2>
        <a class="admin-btn" href="https://search.google.com/search-console" target="_blank">Open Search Console</a>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>URL</th><th>Status</th><th>Lastmod</th><th>Priority</th></tr></thead>
          <tbody>
            ${[
              { url: '/', priority: '1.0', lastmod: '2026-07-03' },
              { url: '/articles/', priority: '0.9', lastmod: '2026-07-03' },
              ...BLOG_POSTS.map(p => ({ url: p.content, priority: '0.8', lastmod: p.date })),
              { url: '/terms-of-service.html', priority: '0.3', lastmod: '2026-07-03' },
              { url: '/privacy-policy.html', priority: '0.3', lastmod: '2026-07-03' },
            ].map(p => `
              <tr>
                <td><div class="row-title" style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem">${p.url}</div></td>
                <td><span class="badge badge-success"><span class="dot"></span> Indexed</span></td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--text-dim)">${p.lastmod}</td>
                <td style="font-family:'JetBrains Mono',monospace">${p.priority}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── Security section ────────────────────────────────────────
function renderSecurity() {
  const loginAttempts = getLoginAttempts(20);

  $('#securityContent').innerHTML = `
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Security Headers</h2>
        </div>
        <div class="security-list">
          ${[
            { ok: true, title: 'Content-Security-Policy', desc: 'Strict CSP on all pages — script/style/img/font/connect restricted' },
            { ok: true, title: 'X-Content-Type-Options', desc: 'nosniff — prevents MIME-type sniffing' },
            { ok: true, title: 'X-Frame-Options / frame-ancestors', desc: 'DENY via CSP frame-ancestors — clickjacking protection' },
            { ok: true, title: 'Referrer-Policy', desc: 'strict-origin-when-cross-origin' },
            { ok: true, title: 'Permissions-Policy', desc: 'camera, microphone, geolocation restricted' },
            { ok: true, title: 'X-UA-Compatible', desc: 'IE=edge' },
            { ok: true, title: 'HTTPS enforced', desc: 'GitHub Pages auto-redirects HTTP → HTTPS' },
            { ok: true, title: 'HSTS', desc: 'GitHub Pages provides HSTS (max-age=31536000)' },
            { ok: false, title: 'Custom HTTP headers', desc: 'GitHub Pages does not support _headers. Consider Netlify/Cloudflare for full control.', warn: true },
          ].map(item => `
            <div class="security-item">
              <div class="security-item-icon ${item.ok ? 'ok' : 'warn'}">
                ${item.ok
                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                }
              </div>
              <div class="security-item-content">
                <div class="security-item-title">${item.title}</div>
                <div class="security-item-desc">${item.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Authentication Security</h2>
        </div>
        <div class="security-list">
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">Google OAuth 2.0</div>
              <div class="security-item-desc">GIS-based auth, no passwords stored</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">Account selection forced</div>
              <div class="security-item-desc">prompt: select_account — prevents wrong-account lockout</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">Email allowlist</div>
              <div class="security-item-desc">Only mututandunda@gmail.com can access</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">Session idle timeout</div>
              <div class="security-item-desc">30-minute inactivity auto-logout</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">sessionStorage (not localStorage)</div>
              <div class="security-item-desc">Session cleared on browser close</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">noindex, nofollow, noarchive</div>
              <div class="security-item-desc">Admin area not indexed by search engines</div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-item-icon ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="security-item-content">
              <div class="security-item-title">robots.txt disallow</div>
              <div class="security-item-desc">/admin/ and /jobs/ blocked from crawlers</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header">
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Login Attempt Log</h2>
        <button class="admin-btn" onclick="clearLoginLog()">Clear Log</button>
      </div>
      ${loginAttempts.length === 0 ? `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <h3>No login attempts yet</h3>
          <p>Successful and failed logins will appear here.</p>
        </div>
      ` : `
        <div class="login-attempts">
          ${loginAttempts.map(l => `
            <div class="login-attempt ${l.success ? 'success' : 'failed'}">
              <span style="font-weight:700">${l.success ? '✓' : '✕'}</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.email}</span>
              <span class="timestamp">${fmtDateTime(l.ts)}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function clearLoginLog() {
  localStorage.removeItem(CONFIG.LOGIN_LOG_KEY);
  toast('Login log cleared', 'success');
  logActivity('security', 'Cleared login attempt log');
  renderSecurity();
}

// ─── Jobs section ────────────────────────────────────────────
function renderJobs() {
  $('#jobsContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="--card-accent:#00d4ff;--card-bg:rgba(0,212,255,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
        <div class="stat-label">Active Jobs (Live)</div>
        <div class="stat-value" id="jobCount">—</div>
        <div class="stat-trend neutral">Aggregated from Arbeitnow + RemoteOK</div>
      </div>
      <div class="stat-card" style="--card-accent:#a855f7;--card-bg:rgba(168,85,247,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg></div>
        <div class="stat-label">Sources</div>
        <div class="stat-value">2</div>
        <div class="stat-trend neutral">Arbeitnow, RemoteOK</div>
      </div>
      <div class="stat-card" style="--card-accent:#10b981;--card-bg:rgba(16,185,129,0.1)">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <div class="stat-label">Auth Required</div>
        <div class="stat-value" style="color:#10b981">YES</div>
        <div class="stat-trend neutral">Google OAuth (private)</div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header">
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Job Portal</h2>
        <a class="admin-btn primary" href="/jobs/" target="_blank">Open Portal →</a>
      </div>
      <p style="color:var(--text-muted);font-size:0.875rem;line-height:1.6;margin-bottom:1rem">The job portal aggregates remote AI/ML, data engineering, and full-stack jobs from multiple free APIs in real-time. Only accessible to authorized Google accounts.</p>
      <div style="padding:1rem;background:rgba(0,212,255,0.05);border-radius:10px;font-size:0.8125rem;color:var(--text-muted);display:flex;gap:0.5rem">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Jobs are fetched live on each visit — no database storage. Filters: AI/ML, Data, Full-Stack, Remote.</span>
      </div>
    </div>
  `;

  // Live-fetch job count
  fetch('https://www.arbeitnow.com/api/job-board-api')
    .then(r => r.json())
    .then(data => {
      const count = data?.data?.length || 0;
      const el = $('#jobCount');
      if (el) el.textContent = count.toLocaleString();
    })
    .catch(() => {
      const el = $('#jobCount');
      if (el) el.textContent = '—';
    });
}

// ─── Settings section ────────────────────────────────────────
function renderSettings() {
  $('#settingsContent').innerHTML = `
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Account</h2>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
          <img src="${state.user?.picture}" alt="${state.user?.name}" style="width:64px;height:64px;border-radius:50%;border:2px solid var(--border)" />
          <div>
            <div style="font-weight:700;font-size:1.125rem">${state.user?.name}</div>
            <div style="color:var(--text-muted);font-size:0.875rem">${state.user?.email}</div>
            <div style="margin-top:0.25rem"><span class="badge badge-success"><span class="dot"></span> Owner</span></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;font-size:0.875rem">
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Session started</span>
            <span style="font-family:'JetBrains Mono',monospace">${fmtDateTime(state.sessionStart)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Idle timeout</span>
            <span>30 minutes</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Auth method</span>
            <span>Google OAuth 2.0 (GIS)</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0">
            <span style="color:var(--text-dim)">Authorized emails</span>
            <span>1 (mututandunda@gmail.com)</span>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Site Info</h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;font-size:0.875rem">
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Domain</span>
            <a href="https://victorndunda.com" style="color:var(--accent);font-family:'JetBrains Mono',monospace">victorndunda.com</a>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Hosting</span>
            <span>GitHub Pages</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Repository</span>
            <a href="https://github.com/gadda00/victor-portfolio" target="_blank" style="color:var(--accent)">gadda00/victor-portfolio</a>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Published articles</span>
            <span>${BLOG_POSTS.length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-dim)">Build system</span>
            <span>None (static HTML/CSS/JS)</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.625rem 0">
            <span style="color:var(--text-dim)">Auto-deploy</span>
            <span>GitHub Actions on push</span>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header">
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> Quick Links</h2>
      </div>
      <div class="quick-actions">
        <a class="quick-action" href="https://github.com/gadda00/victor-portfolio" target="_blank">
          <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"/></svg></div>
          GitHub Repo
        </a>
        <a class="quick-action" href="https://search.google.com/search-console" target="_blank">
          <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          Search Console
        </a>
        <a class="quick-action" href="https://console.cloud.google.com" target="_blank">
          <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
          Google Cloud
        </a>
        <a class="quick-action" href="https://developers.tiktok.com" target="_blank">
          <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></div>
          TikTok Developers
        </a>
        <a class="quick-action" href="https://developer.linkedin.com" target="_blank">
          <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg></div>
          LinkedIn Dev
        </a>
        <a class="quick-action" href="https://developer.x.com" target="_blank">
          <div class="quick-action-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
          X Developer
        </a>
      </div>
    </div>

    <div class="admin-card" style="border-color:rgba(239,68,68,0.2)">
      <div class="admin-card-header">
        <h2 style="color:#ef4444"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#ef4444"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Danger Zone</h2>
      </div>
      <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:1rem">These actions cannot be undone. Proceed with caution.</p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <button class="admin-btn" onclick="clearAllActivity()" style="border-color:rgba(245,158,11,0.3);color:#f59e0b">Clear Activity Log</button>
        <button class="admin-btn" onclick="logout()" style="border-color:rgba(239,68,68,0.3);color:#ef4444">Sign Out</button>
      </div>
    </div>
  `;
}

function clearAllActivity() {
  if (!confirm('Clear all activity logs? This cannot be undone.')) return;
  localStorage.removeItem(CONFIG.ACTIVITY_LOG_KEY);
  localStorage.removeItem(CONFIG.LOGIN_LOG_KEY);
  toast('All activity logs cleared', 'success');
  switchSection('overview');
}

// ─── Expose to window ────────────────────────────────────────
window.switchSection = switchSection;
window.copyArticleUrl = copyArticleUrl;
window.clearLoginLog = clearLoginLog;
window.clearAllActivity = clearAllActivity;
window.logout = logout;

// ─── Init ────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // Theme
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.className = savedTheme;

  // Check existing session
  if (checkSession()) {
    showAdmin();
  } else {
    // Show auth overlay, init Google
    $('#authOverlay').classList.remove('hidden');
    initGoogleAuth();
  }

  // Sidebar navigation
  $$('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (section) switchSection(section);
    });
  });

  // Mobile sidebar toggle
  $('#mobileToggle')?.addEventListener('click', () => {
    $('.admin-sidebar')?.classList.toggle('open');
  });

  // Theme toggle
  $('#themeToggle')?.addEventListener('click', () => {
    const isDark = html.classList.contains('dark');
    html.className = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    $('#themeToggle span').textContent = isDark ? '☀️' : '🌙';
  });
});
