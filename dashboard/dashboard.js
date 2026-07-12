/* ═══════════════════════════════════════════════════════════════════
   Dashboard JS — Victor Ndunda Portfolio
   Full control center: Overview, Content, Clients, Analytics, Jobs,
   Social Composer, SEO, Security, Settings
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── Theme ────────────────────────────────────────────────────────
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.classList.remove('dark', 'light');
  html.classList.add(savedTheme);

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isDark = html.classList.contains('dark');
    html.classList.remove('dark', 'light');
    html.classList.add(isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });

  // ─── Toast ────────────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const t = document.createElement('div');
    t.className = `dash-toast ${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  // ─── Blog posts data (loaded from posts.json) ─────────────────────
  let blogPosts = [];
  fetch('/blog/posts.json')
    .then(r => r.json())
    .then(data => { blogPosts = data.posts || []; })
    .catch(() => {});

  // ─── Auth Flow ────────────────────────────────────────────────────
  const authOverlay = document.getElementById('authOverlay');
  const dashApp = document.getElementById('dashApp');

  function showDashboard() {
    authOverlay.style.display = 'none';
    dashApp.style.display = 'block';
    const user = VNAuth.getUser();
    if (user) {
      document.getElementById('userName').textContent = user.name || user.email;
      if (user.picture) {
        document.getElementById('userAvatar').src = user.picture;
        document.getElementById('userAvatar').style.display = 'block';
      }
    }
    // Start idle monitor
    VNAuth.startActivityMonitor(
      () => { toast('Session expired. Signing out...', 'warn'); setTimeout(() => VNAuth.logout(), 1500); },
      () => toast('Session expiring soon. Click anywhere to stay active.', 'warn')
    );
    // Render default section
    switchSection('overview');
  }

  // Check existing session
  if (VNAuth.checkSession()) {
    showDashboard();
  }

  // Init Google Auth
  VNAuth.initGoogleAuth(
    (user) => { toast(`Welcome, ${user.name}!`); showDashboard(); },
    (err) => {
      const e = document.getElementById('authError');
      e.textContent = err;
      e.style.display = 'block';
    }
  );

  // Render Google button after GIS loads
  function tryRenderGoogle() {
    if (typeof google !== 'undefined' && google.accounts) {
      VNAuth.renderGoogleButton('googleSignInBtn');
    } else {
      setTimeout(tryRenderGoogle, 200);
    }
  }
  tryRenderGoogle();

  // Password form
  document.getElementById('passwordLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const result = await VNAuth.loginWithPassword(username, password);
    if (result.success) {
      toast('Welcome back!');
      showDashboard();
    } else {
      const err = document.getElementById('authError');
      err.textContent = result.error;
      err.style.display = 'block';
    }
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => VNAuth.logout());

  // ─── Section Navigation ───────────────────────────────────────────
  const sideLinks = document.querySelectorAll('.dash-side-link');
  const dashContent = document.getElementById('dashContent');
  const sidebar = document.getElementById('dashSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  // Sidebar toggle — works on ALL screen sizes
  sidebarToggle?.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      // Mobile: toggle slide in/out
      sidebar.classList.toggle('open');
      sidebarBackdrop.classList.toggle('show');
    } else {
      // Desktop: toggle between fully hidden and fully visible
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('dash_sidebar_collapsed', sidebar.classList.contains('collapsed'));
    }
  });

  // Close sidebar on backdrop click (mobile)
  sidebarBackdrop?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('show');
  });

  // On desktop, default to collapsed (sidebar hidden by default)
  if (window.innerWidth > 900) {
    // Always start collapsed unless user explicitly pinned it open
    if (localStorage.getItem('dash_sidebar_pinned') === 'true') {
      // Keep it open
    } else {
      sidebar.classList.add('collapsed');
    }
  }

  sideLinks.forEach(link => {
    link.addEventListener('click', () => {
      const section = link.getAttribute('data-section');
      switchSection(section);
      // Auto-close sidebar after selecting a section
      if (window.innerWidth <= 900) {
        // Mobile: close the slide-in drawer
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('show');
      } else {
        // Desktop: always collapse after selecting (unless pinned)
        if (localStorage.getItem('dash_sidebar_pinned') !== 'true') {
          sidebar.classList.add('collapsed');
          localStorage.setItem('dash_sidebar_collapsed', 'true');
        }
      }
    });
  });

  // Double-click on toggle = pin/unpin sidebar (keep it open permanently)
  sidebarToggle?.addEventListener('dblclick', () => {
    const pinned = localStorage.getItem('dash_sidebar_pinned') === 'true';
    if (pinned) {
      // Unpin — enable auto-collapse
      localStorage.setItem('dash_sidebar_pinned', 'false');
      sidebar.classList.add('collapsed');
      toast('Sidebar auto-collapse enabled');
    } else {
      // Pin — keep open permanently
      localStorage.setItem('dash_sidebar_pinned', 'true');
      sidebar.classList.remove('collapsed');
      toast('Sidebar pinned open — won\'t auto-collapse');
    }
  });

  function switchSection(name) {
    sideLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-section') === name));
    const renderer = sectionRenderers[name];
    if (renderer) {
      dashContent.innerHTML = renderer();
      // Attach event listeners after render
      attachSectionListeners(name);
    } else {
      dashContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚧</div><p>Section coming soon.</p></div>';
    }
  }

  // ─── Section Renderers ────────────────────────────────────────────
  const sectionRenderers = {
    overview: renderOverview,
    content: renderContent,
    clients: renderClients,
    clientsearch: renderClientSearch,
    analytics: renderAnalytics,
    jobs: renderJobs,
    social: renderSocial,
    seo: renderSEO,
    security: renderSecurity,
    settings: renderSettings,
  };

  // ─── Overview ─────────────────────────────────────────────────────
  function renderOverview() {
    const activity = VNAuth.getActivityLog().slice(0, 8);
    const loginLog = VNAuth.getLoginLog().slice(0, 5);
    const briefs = getClientBriefs();
    const applications = getJobApplications();
    const resumeDownloads = parseInt(localStorage.getItem('vn_resume_downloads') || '0', 10);

    return `
      <div class="dash-section-head">
        <h1>Overview</h1>
        <p>Your portfolio at a glance — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Published Articles</div><div class="kpi-value">${blogPosts.length}</div><div class="kpi-delta">↗ Content live</div></div>
        <div class="kpi-card"><div class="kpi-label">Client Briefs</div><div class="kpi-value">${briefs.length}</div><div class="kpi-delta">${briefs.filter(b => b.status === 'contracted').length} contracted</div></div>
        <div class="kpi-card"><div class="kpi-label">Job Applications</div><div class="kpi-value">${applications.length}</div><div class="kpi-delta">${applications.filter(a => a.status === 'interview').length} interviews</div></div>
        <div class="kpi-card"><div class="kpi-label">Resume Downloads</div><div class="kpi-value">${resumeDownloads}</div><div class="kpi-delta">All time</div></div>
      </div>
      <div class="quick-actions">
        <a href="/services/wizard.html" class="quick-action"><div class="quick-action-icon">🚀</div>New Project Brief</a>
        <a href="/jobs/" class="quick-action"><div class="quick-action-icon">🔍</div>Search Jobs</a>
        <a href="/blog/" class="quick-action"><div class="quick-action-icon">📝</div>View Blog</a>
        <a href="/resume/" class="quick-action"><div class="quick-action-icon">📄</div>Resume</a>
        <a href="/" class="quick-action"><div class="quick-action-icon">🌐</div>View Site</a>
        <button class="quick-action" onclick="location.reload()"><div class="quick-action-icon">🔄</div>Refresh</button>
      </div>
      <div class="activity-feed">
        <h3>Recent Activity</h3>
        ${activity.length ? activity.map(a => `
          <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(a.type)}</div>
            <div class="activity-text">${a.message}</div>
            <div class="activity-time">${timeAgo(a.timestamp)}</div>
          </div>
        `).join('') : '<div class="empty-state"><p>No activity yet.</p></div>'}
      </div>
      <div class="activity-feed">
        <h3>Recent Logins</h3>
        ${loginLog.length ? `
          <table class="dash-table">
            <thead><tr><th>Email</th><th>Status</th><th>Time</th><th>Device</th></tr></thead>
            <tbody>
              ${loginLog.map(l => `
                <tr>
                  <td>${l.email}</td>
                  <td><span class="badge ${l.success ? 'badge-green' : 'badge-red'}">${l.success ? 'Success' : 'Failed'}</span></td>
                  <td>${timeAgo(l.timestamp)}</td>
                  <td style="font-size:0.75rem;color:var(--text-dim)">${l.userAgent?.substring(0, 40) || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><p>No login attempts logged.</p></div>'}
      </div>
    `;
  }

  // ─── Content ──────────────────────────────────────────────────────
  function renderContent() {
    return `
      <div class="dash-section-head">
        <h1>Content Management</h1>
        <p>Manage your blog articles and published content.</p>
      </div>
      <div class="quick-actions">
        <a href="https://github.com/gadda00/victor-portfolio/new/main/blog/articles" target="_blank" class="quick-action"><div class="quick-action-icon">✍️</div>New Article</a>
        <a href="/blog/posts.json" target="_blank" class="quick-action"><div class="quick-action-icon">📋</div>Edit posts.json</a>
        <a href="/feed.xml" target="_blank" class="quick-action"><div class="quick-action-icon">📡</div>RSS Feed</a>
      </div>
      <table class="dash-table">
        <thead><tr><th>Title</th><th>Tag</th><th>Date</th><th>Read Time</th><th>Actions</th></tr></thead>
        <tbody>
          ${blogPosts.map(p => `
            <tr>
              <td><strong>${p.title}</strong></td>
              <td><span class="badge badge-${getTagBadge(p.tagClass)}">${p.tag}</span></td>
              <td>${p.date}</td>
              <td>${p.readTime}</td>
              <td>
                <a href="${p.url}" target="_blank" style="color:var(--accent);font-size:0.8125rem;margin-right:0.5rem">View</a>
                <a href="https://github.com/gadda00/victor-portfolio/edit/main/blog/articles/${p.slug}.html" target="_blank" style="color:var(--text-muted);font-size:0.8125rem">Edit</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ─── Client Briefs ────────────────────────────────────────────────
  function renderClients() {
    const briefs = getClientBriefs();
    return `
      <div class="dash-section-head">
        <h1>Client Briefs</h1>
        <p>Project briefs submitted through the services wizard.</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Briefs</div><div class="kpi-value">${briefs.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Contracted</div><div class="kpi-value">${briefs.filter(b => b.status === 'contracted').length}</div></div>
        <div class="kpi-card"><div class="kpi-label">In Progress</div><div class="kpi-value">${briefs.filter(b => b.status === 'in-progress').length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Delivered</div><div class="kpi-value">${briefs.filter(b => b.status === 'delivered').length}</div></div>
      </div>
      ${briefs.length ? `
        <table class="dash-table">
          <thead><tr><th>Client</th><th>Package</th><th>Budget</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${briefs.map(b => `
              <tr>
                <td><strong>${b.details?.name || 'Unknown'}</strong><br><span style="font-size:0.75rem;color:var(--text-dim)">${b.details?.email || ''}</span></td>
                <td>${b.recommendation?.packageName || b.estimate?.packageName || '—'}</td>
                <td>${b.details?.budget || '—'}</td>
                <td><span class="badge ${getStatusBadge(b.status)}">${b.status || 'draft'}</span></td>
                <td>${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <a href="/services/contract.html?brief=${b.id}" style="color:var(--accent);font-size:0.8125rem;margin-right:0.5rem">Contract</a>
                  <a href="/services/payment.html?brief=${b.id}" style="color:var(--text-muted);font-size:0.8125rem">Payment</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div class="empty-state"><div class="empty-state-icon">💼</div><p>No client briefs yet. Briefs appear here when clients submit the Project Scope Wizard.</p></div>'}
    `;
  }

  // ─── Find Clients (lead generation) ───────────────────────────────
  function renderClientSearch() {
    return `
      <div class="dash-section-head">
        <h1>Find Clients</h1>
        <p>Search for potential clients across platforms — freelancers, startups, and businesses that need AI services.</p>
      </div>

      <div class="quick-actions" style="margin-bottom:1.5rem">
        <a href="https://www.upwork.com/nx/search/jobs/?q=AI+engineer+multi-agent" target="_blank" rel="noopener noreferrer" class="quick-action">
          <div class="quick-action-icon">💼</div>Upwork AI Jobs
        </a>
        <a href="https://www.fiverr.com/categories/programming-tech/ai-services/ai-engineering" target="_blank" rel="noopener noreferrer" class="quick-action">
          <div class="quick-action-icon">🎨</div>Fiverr AI Services
        </a>
        <a href="https://www.toptal.com/talent/apply" target="_blank" rel="noopener noreferrer" class="quick-action">
          <div class="quick-action-icon">⭐</div>Toptal
        </a>
        <a href="https://www.linkedin.com/jobs/search/?keywords=AI%20consultant%20Nairobi" target="_blank" rel="noopener noreferrer" class="quick-action">
          <div class="quick-action-icon">📌</div>LinkedIn AI Nairobi
        </a>
        <a href="https://www.linkedin.com/jobs/search/?keywords=AI%20engineer%20Kenya" target="_blank" rel="noopener noreferrer" class="quick-action">
          <div class="quick-action-icon">🇰🇪</div>LinkedIn AI Kenya
        </a>
        <a href="https://wellfound.com/jobs?q=AI+engineer" target="_blank" rel="noopener noreferrer" class="quick-action">
          <div class="quick-action-icon">🚀</div>Wellfound
        </a>
      </div>

      <div class="activity-feed">
        <h3>🎯 Lead Generation Sources</h3>
        <div class="security-checklist">
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Upwork</strong> — Search for "AI engineer", "multi-agent", "RAG chatbot", "data analysis"
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Tip: Filter by budget $5K+ and "Payment verified" for quality leads
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>LinkedIn Sales Navigator</strong> — Search for CTOs/Founders at Nairobi startups
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Search: "CTO" OR "Founder" + "Nairobi" + "AI" + company size 1-50
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Twitter/X Advanced Search</strong> — Find people asking for AI help
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Search: "looking for AI engineer" OR "need AI chatbot" OR "hire AI consultant" min_faves:5
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Nairobi Tech Communities</strong> — iHub, Nairobi Garage, Nailab
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Attend meetups, post in Slack groups, offer free AI audits
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Cold Outreach</strong> — Email SMBs about AI readiness audits
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Target: 10 emails/week to Nairobi SMBs. Offer free 30-min AI audit call.
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Agritech Companies</strong> — KALRO, AgriBiz, Twiga Foods
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Pitch KilimoPRO expertise: crop disease detection, market forecasting
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Fintech Companies</strong> — M-Pesa partners, Flutterwave merchants
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Pitch fraud detection, financial forecasting, customer segmentation
              </div>
            </div>
          </div>
          <div class="security-item">
            <div class="security-check ok">✓</div>
            <div>
              <strong>Content Marketing</strong> — Write blog articles + post on LinkedIn
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.25rem">
                Each blog post = inbound lead magnet. 1 post/week → 4 leads/month
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="activity-feed" style="margin-top:1.5rem">
        <h3>📋 Outreach Tracker</h3>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:1rem">
          Track your outreach efforts. Data stored locally in your browser.
        </p>
        <div id="outreachTracker">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:0.5rem;margin-bottom:1rem">
            <input type="text" id="leadName" placeholder="Company / Lead name" style="padding:0.5rem;border-radius:8px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:0.875rem" />
            <input type="text" id="leadSource" placeholder="Source (Upwork, LinkedIn...)" style="padding:0.5rem;border-radius:8px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:0.875rem" />
            <select id="leadStatus" style="padding:0.5rem;border-radius:8px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:0.875rem">
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="meeting">Meeting booked</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <button class="btn btn-primary btn-sm" id="addLeadBtn">Add</button>
          </div>
          <div id="leadsList"></div>
        </div>
      </div>
    `;
  }

  // ─── Analytics ────────────────────────────────────────────────────
  function renderAnalytics() {
    // Privacy-friendly: all numbers are from localStorage, no tracking
    const visits = parseInt(localStorage.getItem('vn_visits') || '0', 10);
    const resumeDls = parseInt(localStorage.getItem('vn_resume_downloads') || '0', 10);
    const applications = getJobApplications().length;

    return `
      <div class="dash-section-head">
        <h1>Analytics</h1>
        <p>Privacy-friendly analytics — no third-party tracking. All data from localStorage.</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Sessions (this device)</div><div class="kpi-value">${visits}</div></div>
        <div class="kpi-card"><div class="kpi-label">Resume Downloads</div><div class="kpi-value">${resumeDls}</div></div>
        <div class="kpi-card"><div class="kpi-label">Job Applications</div><div class="kpi-value">${applications}</div></div>
        <div class="kpi-card"><div class="kpi-label">Published Articles</div><div class="kpi-value">${blogPosts.length}</div></div>
      </div>
      <div class="activity-feed">
        <h3>Article Performance (estimated)</h3>
        <table class="dash-table">
          <thead><tr><th>Article</th><th>Read Time</th><th>Words</th><th>Tag</th></tr></thead>
          <tbody>
            ${blogPosts.map(p => `
              <tr>
                <td>${p.title}</td>
                <td>${p.readTime}</td>
                <td>${p.wordCount}</td>
                <td><span class="badge badge-${getTagBadge(p.tagClass)}">${p.tag}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="activity-feed">
        <h3>Connect Real Analytics</h3>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:1rem">For production analytics, integrate one of these privacy-friendly tools:</p>
        <div class="quick-actions">
          <a href="https://plausible.io" target="_blank" class="quick-action"><div class="quick-action-icon">📊</div>Plausible</a>
          <a href="https://umami.is" target="_blank" class="quick-action"><div class="quick-action-icon">📈</div>Umami</a>
          <a href="https://analytics.google.com" target="_blank" class="quick-action"><div class="quick-action-icon">🔍</div>GA4</a>
        </div>
      </div>
    `;
  }

  // ─── Jobs ─────────────────────────────────────────────────────────
  function renderJobs() {
    const applications = getJobApplications();
    return `
      <div class="dash-section-head">
        <h1>Job Applications</h1>
        <p>Track your job applications and interview pipeline.</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Saved</div><div class="kpi-value">${applications.filter(a => a.status === 'saved').length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Applied</div><div class="kpi-value">${applications.filter(a => a.status === 'applied').length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Interviews</div><div class="kpi-value">${applications.filter(a => a.status === 'interview').length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Offers</div><div class="kpi-value">${applications.filter(a => a.status === 'offer').length}</div></div>
      </div>
      <div class="quick-actions">
        <a href="/jobs/" class="quick-action"><div class="quick-action-icon">🔍</div>Search Jobs</a>
      </div>
      ${applications.length ? `
        <table class="dash-table">
          <thead><tr><th>Title</th><th>Company</th><th>Status</th><th>Applied Date</th></tr></thead>
          <tbody>
            ${applications.map(a => `
              <tr>
                <td><strong>${a.title || '—'}</strong></td>
                <td>${a.company || '—'}</td>
                <td><span class="badge ${getAppStatusBadge(a.status)}">${a.status || 'saved'}</span></td>
                <td>${a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>No job applications yet. Visit the <a href="/jobs/" style="color:var(--accent)">Jobs Portal</a> to start applying.</p></div>'}
    `;
  }

  // ─── Social Composer ──────────────────────────────────────────────
  function renderSocial() {
    return `
      <div class="dash-section-head">
        <h1>Social Media Composer</h1>
        <p>Generate platform-specific posts from a topic or article.</p>
      </div>
      <div class="social-composer">
        <label for="socialTopic">Topic or Article Title</label>
        <input type="text" id="socialTopic" placeholder="e.g., Building a 50-agent multi-agent DAG pipeline" />
        <label for="socialTone">Tone</label>
        <select id="socialTone">
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="technical">Technical</option>
          <option value="story">Story-driven</option>
        </select>
        <label for="socialUrl">Link to include (optional)</label>
        <input type="url" id="socialUrl" placeholder="https://victorndunda.com/blog/articles/..." />
        <button class="btn btn-primary" id="generateSocial">Generate Posts</button>
      </div>
      <div id="socialResults"></div>
    `;
  }

  // ─── SEO ──────────────────────────────────────────────────────────
  function renderSEO() {
    return `
      <div class="dash-section-head">
        <h1>SEO Overview</h1>
        <p>Search engine optimization status and recommendations.</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">SEO Score</div><div class="kpi-value">92</div><div class="kpi-delta">Good</div></div>
        <div class="kpi-card"><div class="kpi-label">Indexed Pages</div><div class="kpi-value">${14 + blogPosts.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Schemas</div><div class="kpi-value">${12 + blogPosts.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Sitemap URLs</div><div class="kpi-value">${14 + blogPosts.length}</div></div>
      </div>
      <div class="security-checklist">
        <h3 style="margin-bottom:1rem">SEO Checklist</h3>
        <div class="security-item"><div class="security-check ok">✓</div>Canonical URLs on all pages</div>
        <div class="security-item"><div class="security-check ok">✓</div>Open Graph + Twitter Card meta</div>
        <div class="security-item"><div class="security-check ok">✓</div>JSON-LD structured data (Person, WebSite, Blog, Article, BreadcrumbList)</div>
        <div class="security-item"><div class="security-check ok">✓</div>Semantic HTML5 (main, article, nav, footer)</div>
        <div class="security-item"><div class="security-check ok">✓</div>Mobile-first responsive design</div>
        <div class="security-item"><div class="security-check ok">✓</div>sitemap.xml + robots.txt</div>
        <div class="security-item"><div class="security-check ok">✓</div>RSS feed (auto-generated from posts.json)</div>
        <div class="security-item"><div class="security-check ok">✓</div>HTTPS enforced</div>
        <div class="security-item"><div class="security-check ok">✓</div>Fast loading (no build step, minimal dependencies)</div>
        <div class="security-item"><div class="security-check warn">!</div>Image alt texts (verify on new images)</div>
        <div class="security-item"><div class="security-check ok">✓</div>View Transitions API for smooth navigation</div>
      </div>
      <div class="quick-actions">
        <a href="https://search.google.com/search-console" target="_blank" class="quick-action"><div class="quick-action-icon">🔍</div>Search Console</a>
        <a href="/sitemap.xml" target="_blank" class="quick-action"><div class="quick-action-icon">🗺️</div>Sitemap</a>
        <a href="/robots.txt" target="_blank" class="quick-action"><div class="quick-action-icon">🤖</div>Robots.txt</a>
        <a href="/feed.xml" target="_blank" class="quick-action"><div class="quick-action-icon">📡</div>RSS Feed</a>
      </div>
    `;
  }

  // ─── Security ─────────────────────────────────────────────────────
  function renderSecurity() {
    const loginLog = VNAuth.getLoginLog();
    const failedAttempts = loginLog.filter(l => !l.success);
    return `
      <div class="dash-section-head">
        <h1>Security Center</h1>
        <p>Monitor authentication, security headers, and access logs.</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Security Grade</div><div class="kpi-value">A+</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Logins</div><div class="kpi-value">${loginLog.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Failed Attempts</div><div class="kpi-value">${failedAttempts.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Session Timeout</div><div class="kpi-value">30m</div></div>
      </div>
      <div class="security-checklist">
        <h3 style="margin-bottom:1rem">Security Headers</h3>
        <div class="security-item"><div class="security-check ok">✓</div>Content-Security-Policy on all pages</div>
        <div class="security-item"><div class="security-check ok">✓</div>X-Content-Type-Options: nosniff</div>
        <div class="security-item"><div class="security-check ok">✓</div>Referrer-Policy: strict-origin-when-cross-origin</div>
        <div class="security-item"><div class="security-check ok">✓</div>noindex, nofollow on private pages</div>
        <div class="security-item"><div class="security-check ok">✓</div>noopener noreferrer on external links</div>
        <div class="security-item"><div class="security-check ok">✓</div>sessionStorage for auth (cleared on browser close)</div>
        <div class="security-item"><div class="security-check ok">✓</div>30-minute idle timeout with 5-min warning</div>
        <div class="security-item"><div class="security-check ok">✓</div>PBKDF2 password hashing (100k iterations)</div>
      </div>
      <div class="activity-feed">
        <h3>Login Attempt Log</h3>
        ${loginLog.length ? `
          <table class="dash-table">
            <thead><tr><th>Email</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              ${loginLog.map(l => `
                <tr>
                  <td>${l.email}</td>
                  <td><span class="badge ${l.success ? 'badge-green' : 'badge-red'}">${l.success ? 'Success' : 'Failed'}</span></td>
                  <td>${new Date(l.timestamp).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><p>No login attempts logged.</p></div>'}
        <button class="btn btn-ghost btn-sm" id="clearLogsBtn" style="margin-top:1rem">Clear Logs</button>
      </div>
    `;
  }

  // ─── Settings ─────────────────────────────────────────────────────
  function renderSettings() {
    const user = VNAuth.getUser();
    return `
      <div class="dash-section-head">
        <h1>Settings</h1>
        <p>Account and site configuration.</p>
      </div>
      <div class="settings-card">
        <h3>Account</h3>
        <div class="settings-row"><div class="settings-label">Name</div><div class="settings-value">${user?.name || '—'}</div></div>
        <div class="settings-row"><div class="settings-label">Email</div><div class="settings-value">${user?.email || '—'}</div></div>
        <div class="settings-row"><div class="settings-label">Session expires in</div><div class="settings-value" id="sessionCountdown">30 min</div></div>
      </div>
      <div class="settings-card">
        <h3>Quick Links</h3>
        <div class="quick-actions">
          <a href="https://github.com/gadda00/victor-portfolio" target="_blank" class="quick-action"><div class="quick-action-icon">🐙</div>GitHub Repo</a>
          <a href="https://search.google.com/search-console" target="_blank" class="quick-action"><div class="quick-action-icon">🔍</div>Search Console</a>
          <a href="https://console.cloud.google.com" target="_blank" class="quick-action"><div class="quick-action-icon">☁️</div>Google Cloud</a>
          <a href="https://analytics.google.com" target="_blank" class="quick-action"><div class="quick-action-icon">📊</div>Analytics</a>
        </div>
      </div>
      <div class="settings-card danger-zone">
        <h3 style="color:#ef4444">Danger Zone</h3>
        <div class="settings-row">
          <div class="settings-label">Clear activity log</div>
          <button class="btn btn-ghost btn-sm" id="clearActivityBtn">Clear</button>
        </div>
        <div class="settings-row">
          <div class="settings-label">Export all data (localStorage)</div>
          <button class="btn btn-ghost btn-sm" id="exportDataBtn">Export</button>
        </div>
        <div class="settings-row">
          <div class="settings-label">Sign out</div>
          <button class="btn btn-ghost btn-sm" id="signOutBtn2" style="color:#ef4444">Sign out</button>
        </div>
      </div>
    `;
  }

  // ─── Attach Section Listeners ─────────────────────────────────────
  function attachSectionListeners(name) {
    if (name === 'social') {
      document.getElementById('generateSocial')?.addEventListener('click', generateSocialPosts);
    }
    if (name === 'clientsearch') {
      // Lead tracker
      document.getElementById('addLeadBtn')?.addEventListener('click', () => {
        const nameEl = document.getElementById('leadName');
        const sourceEl = document.getElementById('leadSource');
        const statusEl = document.getElementById('leadStatus');
        if (!nameEl.value.trim()) { toast('Enter a lead name', 'warn'); return; }
        try {
          const leads = JSON.parse(localStorage.getItem('vn_leads') || '[]');
          leads.unshift({
            name: nameEl.value.trim(),
            source: sourceEl.value.trim() || '—',
            status: statusEl.value,
            date: new Date().toISOString(),
          });
          if (leads.length > 50) leads.length = 50;
          localStorage.setItem('vn_leads', JSON.stringify(leads));
        } catch {}
        nameEl.value = ''; sourceEl.value = ''; statusEl.value = 'contacted';
        toast('Lead added!');
        renderLeadsList();
      });
      renderLeadsList();
    }
    if (name === 'security') {
      document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
        VNAuth.clearLogs();
        toast('Logs cleared.');
        switchSection('security');
      });
    }
    if (name === 'settings') {
      document.getElementById('clearActivityBtn')?.addEventListener('click', () => {
        VNAuth.clearLogs();
        toast('Activity log cleared.');
      });
      document.getElementById('exportDataBtn')?.addEventListener('click', exportAllData);
      document.getElementById('signOutBtn2')?.addEventListener('click', () => VNAuth.logout());
      // Session countdown
      updateSessionCountdown();
      setInterval(updateSessionCountdown, 60000);
    }
  }

  function updateSessionCountdown() {
    const lastActivity = VNAuth.getLastActivity();
    if (!lastActivity) return;
    const remaining = 30 - Math.floor((Date.now() - lastActivity) / 60000);
    const el = document.getElementById('sessionCountdown');
    if (el) el.textContent = remaining + ' min';
  }

  // ─── Social Post Generation ───────────────────────────────────────
  function generateSocialPosts() {
    const topic = document.getElementById('socialTopic').value.trim();
    const tone = document.getElementById('socialTone').value;
    const url = document.getElementById('socialUrl').value.trim();
    if (!topic) { toast('Please enter a topic', 'warn'); return; }

    const platforms = {
      linkedin: { name: 'LinkedIn', icon: '💼', limit: 3000 },
      x: { name: 'X (Twitter)', icon: '𝕏', limit: 280 },
      facebook: { name: 'Facebook', icon: '📘', limit: 63206 },
      whatsapp: { name: 'WhatsApp', icon: '💬', limit: 65536 },
    };

    const tones = {
      professional: {
        linkedin: `New article: "${topic}".\n\nI break down the technical details and share what I learned building this.\n\n${url ? url + '\n\n' : ''}#AI #Engineering #Tech`,
        x: `New article: "${topic}"\n\n${url || ''}\n\n#AI #Engineering`,
        facebook: `Just published: "${topic}"\n\nA deep dive into the technical details and lessons learned.\n\n${url || ''}`,
        whatsapp: `New article: "${topic}"\n\n${url || 'Read at victorndunda.com/blog'}`,
      },
      casual: {
        linkedin: `Shipped something new! 🚀\n\n"${topic}"\n\nHad fun building this. Here's what I learned →\n\n${url || ''}`,
        x: `New post drop 🚀\n"${topic}"\n\n${url || ''}`,
        facebook: `Just dropped a new piece: "${topic}" 🎉\n\nCheck it out → ${url || 'victorndunda.com/blog'}`,
        whatsapp: `Hey! New article: "${topic}" 🚀\n\n${url || ''}`,
      },
      technical: {
        linkedin: `Technical deep dive: "${topic}"\n\nArchitecture decisions, algorithm choices, and production lessons.\n\nKey takeaways:\n• Design trade-offs\n• Performance optimizations\n• Real-world constraints\n\n${url || ''}\n\n#Engineering #Architecture`,
        x: `Tech deep dive: "${topic}"\n\nArchitecture + algorithms + production lessons.\n\n${url || ''}\n\n#Engineering`,
        facebook: `Technical write-up: "${topic}"\n\nCovers architecture, algorithms, and production lessons.\n\n${url || ''}`,
        whatsapp: `Technical article: "${topic}"\n\n${url || ''}`,
      },
      story: {
        linkedin: `The story behind "${topic}"...\n\nIt started with a problem. Here's how I built the solution — the mistakes, the breakthroughs, and what I'd do differently.\n\n${url || ''}\n\n#BuildInPublic`,
        x: `How I built "${topic}" — the story, the mistakes, the lessons.\n\n${url || ''}`,
        facebook: `The story behind "${topic}" — what I built, what broke, and what I learned.\n\n${url || ''}`,
        whatsapp: `Story time: "${topic}"\n\n${url || ''}`,
      },
    };

    const selected = tones[tone];
    const resultsEl = document.getElementById('socialResults');
    resultsEl.innerHTML = `
      <div class="social-platforms">
        ${Object.entries(platforms).map(([key, p]) => {
          const text = selected[key] || '';
          const overLimit = text.length > p.limit;
          return `
            <div class="social-post-card">
              <div class="social-post-head">
                <span class="social-post-name">${p.icon} ${p.name}</span>
                <span class="social-post-count ${overLimit ? 'badge-red' : ''}">${text.length}/${p.limit}</span>
              </div>
              <div class="social-post-body">${text.replace(/\n/g, '<br>')}</div>
              <div class="social-post-actions">
                <button onclick="navigator.clipboard.writeText(${JSON.stringify(text)}).then(()=>{window.__dashToast('Copied!')})">Copy</button>
                ${key === 'x' ? `<a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}" target="_blank"><button>Post</button></a>` : ''}
                ${key === 'whatsapp' ? `<a href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank"><button>Share</button></a>` : ''}
                ${key === 'linkedin' ? `<a href="https://www.linkedin.com/feed/?shareActive=true" target="_blank"><button>Share</button></a>` : ''}
                ${key === 'facebook' ? `<a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || 'https://victorndunda.com')}" target="_blank"><button>Share</button></a>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Expose toast for inline handlers
  window.__dashToast = toast;

  // ─── Helper Functions ─────────────────────────────────────────────
  function getClientBriefs() {
    try { return JSON.parse(localStorage.getItem('vn_client_briefs') || '[]'); }
    catch { return []; }
  }

  function getLeads() {
    try { return JSON.parse(localStorage.getItem('vn_leads') || '[]'); }
    catch { return []; }
  }

  function renderLeadsList() {
    const list = document.getElementById('leadsList');
    if (!list) return;
    const leads = getLeads();
    if (!leads.length) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:2rem">No leads tracked yet. Add your first lead above.</p>';
      return;
    }
    const statusColors = {
      contacted: 'badge-blue', replied: 'badge-purple',
      meeting: 'badge-yellow', won: 'badge-green', lost: 'badge-red',
    };
    list.innerHTML = leads.map((l, i) => `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid var(--border)">
        <span style="flex:1;font-size:0.875rem;font-weight:500">${l.name}</span>
        <span style="font-size:0.75rem;color:var(--text-muted)">${l.source}</span>
        <span class="badge ${statusColors[l.status] || 'badge-gray'}">${l.status}</span>
        <span style="font-size:0.75rem;color:var(--text-dim)">${timeAgo(l.date)}</span>
        <button onclick="(() => { const l=JSON.parse(localStorage.getItem('vn_leads')||'[]'); l.splice(${i},1); localStorage.setItem('vn_leads',JSON.stringify(l)); document.getElementById('leadsList')&&renderLeadsList(); })()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem">×</button>
      </div>
    `).join('');
  }

  function getJobApplications() {
    try { return JSON.parse(localStorage.getItem('vn_jobs_applications') || '[]'); }
    catch { return []; }
  }

  function getActivityIcon(type) {
    const icons = {
      auth: '🔐', content: '📝', client: '💼', job: '🔍',
      social: '💬', settings: '⚙️', security: '🔒',
    };
    return icons[type] || '📋';
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  function getTagBadge(tagClass) {
    const map = { ai: 'blue', agri: 'green', research: 'purple', engineering: 'yellow' };
    return map[tagClass] || 'gray';
  }

  function getStatusBadge(status) {
    const map = {
      draft: 'gray', contracted: 'blue', 'in-progress': 'yellow', delivered: 'green',
    };
    return map[status] || 'gray';
  }

  function getAppStatusBadge(status) {
    const map = {
      saved: 'gray', applied: 'blue', interview: 'purple',
      offer: 'green', rejected: 'red', ghosted: 'gray',
    };
    return map[status] || 'gray';
  }

  function exportAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vn_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `victor-portfolio-data-${Date.now()}.json`;
    a.click();
    toast('Data exported!');
  }

  // Log dashboard access
  VNAuth.logActivity('dashboard', 'Accessed dashboard');
})();
