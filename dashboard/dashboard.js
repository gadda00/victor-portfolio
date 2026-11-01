/* ═══════════════════════════════════════════════════════════════════
   Dashboard JS v4.0 — Complete rewrite, clean and simple
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── Theme ────────────────────────────────────────────────────────
  var html = document.documentElement;
  var savedTheme = localStorage.getItem('theme') || 'dark';
  html.classList.remove('dark', 'light');
  html.classList.add(savedTheme);

  document.getElementById('themeToggle').addEventListener('click', function () {
    var isDark = html.classList.contains('dark');
    html.classList.remove('dark', 'light');
    html.classList.add(isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });

  // ─── Toast ────────────────────────────────────────────────────────
  function toast(msg, type) {
    var container = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    container.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 300);
    }, 3000);
  }
  window.__toast = toast;

  // ─── Single audited HTML escape (v21) ────────────────────────────
  // EVERY user-controlled value rendered through a template string in
  // this file must pass through esc2(). New code should prefer the DOM
  // helpers below (el/text) so escaping cannot be forgotten.
  function esc2(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  // For hrefs built from user data: allow only [A-Za-z0-9_.-] fragments.
  function safePath(s) {
    return String(s == null ? '' : s).replace(/[^A-Za-z0-9_.\-]/g, '');
  }

  // ─── Elements ─────────────────────────────────────────────────────
  var authOverlay = document.getElementById('authOverlay');
  var dashApp = document.getElementById('dashApp');
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebarBackdrop');
  var content = document.getElementById('content');
  var hamburger = document.getElementById('hamburger');

  // ─── Sidebar Toggle ───────────────────────────────────────────────
  function toggleSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('show');
      backdrop.classList.toggle('show');
    } else {
      sidebar.classList.toggle('hidden');
      content.classList.toggle('full');
    }
  }
  hamburger.addEventListener('click', toggleSidebar);
  backdrop.addEventListener('click', function () {
    sidebar.classList.remove('show');
    backdrop.classList.remove('show');
  });

  // ─── Auth ─────────────────────────────────────────────────────────
  function showDashboard() {
    authOverlay.style.display = 'none';
    dashApp.style.display = 'block';
    var user = VNAuth.getUser();
    if (user) {
      document.getElementById('userName').textContent = user.name || user.email;
      if (user.picture) {
        var img = document.getElementById('userAvatar');
        img.src = user.picture;
        img.style.display = 'block';
      }
    }
    VNAuth.startActivityMonitor(
      function () { toast('Session expired', 'warn'); setTimeout(function () { VNAuth.logout(); }, 1500); },
      function () { toast('Session expiring soon', 'warn'); }
    );
    // Default: hide sidebar on mobile, show on desktop
    if (window.innerWidth <= 768) sidebar.classList.add('hidden');
    switchSection('overview');
  }

  // Session restore is deferred to the end of this IIFE so every section
  // renderer and the sideLinks NodeList are initialized before showDashboard()
  // runs — restoring mid-session previously crashed at switchSection().

  // ─── Two-factor gate (TOTP — Google Authenticator) ──────────────
  // Runs after the first factor (Google or password) passes but BEFORE
  // the session is saved. First login on a browser shows enrollment; later
  // logins ask for the 6-digit code. Requires https (crypto.subtle).
  var pendingUser = null;

  function runTotpGate(user, done) {
    pendingUser = user;
    if (!window.VNTotp || !window.crypto || !window.crypto.subtle) {
      // TOTP unavailable (no https / script missing) — degrade with a notice.
      toast('Two-factor unavailable in this context — single-factor sign-in.', 'warn');
      VNAuth.finalizeLogin(user);
      done();
      return;
    }
    var enrolled = VNTotp.isEnrolled(user.email);
    document.getElementById('authOverlay').style.display = 'flex';
    document.querySelector('.auth-box:not(#totpBox)').style.display = 'none';
    var box = document.getElementById('totpBox');
    box.style.display = 'block';
    document.getElementById('totpEnroll').style.display = enrolled ? 'none' : 'block';
    document.getElementById('totpTitle').textContent = enrolled ? 'Two-factor verification' : 'Set up two-factor';
    document.getElementById('totpSub').textContent = enrolled
      ? 'Enter the 6-digit code from your authenticator app.'
      : 'One-time setup — takes about a minute, then this step asks for a code on every sign-in.';
    document.getElementById('totpError').style.display = 'none';
    document.getElementById('totpInput').value = '';

    if (!enrolled) {
      VNTotp.getOtpauthUri(user.email).then(function (uri) {
        VNTotp.renderQr(document.getElementById('totpQr'), uri);
        // Manual key: secret is the part after ?secret= and before &
        var m = uri.match(/secret=([A-Z2-7]+)/);
        document.getElementById('totpManual').textContent = m ? m[1] : '(unavailable)';
      });
    }
    setTimeout(function () { document.getElementById('totpInput').focus(); }, 100);

    // submit handler is bound once below; onVerify closure uses pendingDone
    pendingDone = done;
  }
  var pendingDone = null;

  document.getElementById('totpForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!pendingUser) return;
    var input = document.getElementById('totpInput');
    var err = document.getElementById('totpError');
    var btn = document.getElementById('totpSubmit');
    var code = input.value.replace(/\D/g, '');
    if (code.length !== 6) { err.textContent = 'Enter the 6-digit code from your app.'; err.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'Verifying…';
    var ok = await VNTotp.verify(pendingUser.email, code);
    btn.disabled = false; btn.textContent = 'Verify';
    if (!ok) {
      err.textContent = 'That code didn\u2019t match. Check the app and try again — codes rotate every 30 seconds.';
      err.style.display = 'block';
      input.select();
      return;
    }
    if (!VNTotp.isEnrolled(pendingUser.email)) VNTotp.markEnrolled(pendingUser.email);
    document.getElementById('totpBox').style.display = 'none';
    document.querySelector('.auth-box:not(#totpBox)').style.display = 'block';
    var name = pendingUser.name || 'back';
    VNAuth.finalizeLogin(pendingUser);
    var done = pendingDone; pendingUser = null; pendingDone = null;
    toast('Two-factor verified — welcome, ' + name + '!');
    if (done) done();
  });

  document.getElementById('totpCancel').addEventListener('click', function () {
    document.getElementById('totpBox').style.display = 'none';
    document.querySelector('.auth-box:not(#totpBox)').style.display = 'block';
    document.getElementById('totpInput').value = '';
    pendingUser = null; pendingDone = null;
  });

  if (window.VNAuth) {
    VNAuth.initGoogleAuth(
      function (user, totpState) {
        if (!totpState || !totpState.totpAvailable) {
          // No TOTP module — finalize directly (auth.js already logged the factor)
          VNAuth.finalizeLogin(user);
          toast('Welcome, ' + (user.name || 'back') + '!');
          showDashboard();
          return;
        }
        runTotpGate(user, showDashboard);
      },
      function (err) {
        var e = document.getElementById('authError');
        e.textContent = err;
        e.style.display = 'block';
      }
    );
  }

  // Render Google button when GIS loads
  function tryGoogle() {
    if (typeof google !== 'undefined' && google.accounts && window.VNAuth) {
      VNAuth.renderGoogleButton('googleSignInBtn');
    } else {
      setTimeout(tryGoogle, 200);
    }
  }
  tryGoogle();

  // Password login → first factor only; session completes after the TOTP gate
  document.getElementById('passwordLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var u = document.getElementById('usernameInput').value.trim();
    var p = document.getElementById('passwordInput').value;
    var result = await VNAuth.loginWithPassword(u, p);
    if (result.success) {
      if (window.VNTotp && window.crypto && window.crypto.subtle) runTotpGate(result.user, showDashboard);
      else { VNAuth.finalizeLogin(result.user); toast('Welcome back!'); showDashboard(); }
    }
    else {
      var err = document.getElementById('authError');
      err.textContent = result.error;
      err.style.display = 'block';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', function () {
    if (window.VNAuth) VNAuth.logout();
  });

  // ─── Section Navigation ───────────────────────────────────────────
  var sideLinks = document.querySelectorAll('.side-link');
  sideLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      var section = link.getAttribute('data-section');
      switchSection(section);
      // Close sidebar on mobile after click
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
        backdrop.classList.remove('show');
      }
    });
  });

  function switchSection(name) {
    sideLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-section') === name);
    });
    var renderer = sections[name];
    if (renderer) {
      content.innerHTML = renderer();
      if (listeners[name]) listeners[name]();
    } else {
      content.innerHTML = '<div class="empty"><div class="icon">🚧</div>Coming soon.</div>';
    }
  }

  // ─── Data Helpers ─────────────────────────────────────────────────
  function getBriefs() { try { return JSON.parse(localStorage.getItem('vn_client_briefs') || '[]'); } catch { return []; } }
  function getApps() { try { return JSON.parse(localStorage.getItem('vn_jobs_applications') || '[]'); } catch { return []; } }
  function getActivity() { try { return JSON.parse(localStorage.getItem('victor_activity_log') || '[]'); } catch { return []; } }
  function getLogins() { try { return JSON.parse(localStorage.getItem('victor_login_log') || '[]'); } catch { return []; } }
  function getLeads() { try { return JSON.parse(localStorage.getItem('vn_leads') || '[]'); } catch { return []; } }

  var blogPosts = [];
  fetch('/blog/posts.json').then(function (r) { return r.json(); }).then(function (d) { blogPosts = d.posts || []; }).catch(function () {});

  function timeAgo(ts) {
    if (!ts) return '—';
    var d = new Date(ts); var diff = Date.now() - d.getTime();
    var m = Math.floor(diff / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  // ─── Section Renderers ────────────────────────────────────────────
  var sections = {};
  var listeners = {};

  sections.overview = function () {
    var activity = getActivity().slice(0, 6);
    var briefs = getBriefs();
    var portalClients = getPortalClients();
    var apps = getApps();
    var resumeDls = parseInt(localStorage.getItem('vn_resume_downloads') || '0', 10);
    var visits = parseInt(localStorage.getItem('vn_visits') || '0', 10);
    var mrr = portalClients.reduce(function (a, c) {
      return a + (c.project && c.project.retainer && c.project.retainer.active ? (c.project.retainer.monthlyUsd || 0) : 0);
    }, 0);
    return '<div class="page-head"><h1>Overview</h1><p>' + new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + '</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Projects</div><div class="stat-val">' + (projectsData.length + getProjects().length) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Articles</div><div class="stat-val">' + blogPosts.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Portal Clients</div><div class="stat-val">' + (portalClients.length + briefs.length) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Retainer MRR</div><div class="stat-val">' + usd(mrr) + '</div></div>' +
      '</div>' +
      '<div class="actions">' +
      '<a href="/services/client-dashboard.html" class="action"><span class="icon">🔐</span>Client Portal</a>' +
      '<a href="/services/wizard.html" class="action"><span class="icon">🚀</span>New Brief</a>' +
      '<a href="/projects/" class="action"><span class="icon">📦</span>View Projects</a>' +
      '<a href="/" class="action"><span class="icon">🌐</span>View Site</a>' +
      '</div>' +
      '<div class="card"><h3>Recent Activity</h3>' +
      (activity.length ? activity.map(function (a) {
        return '<div class="activity"><div class="icon">📋</div><div class="txt">' + esc2(a.message) + '</div><div class="time">' + esc2(timeAgo(a.timestamp)) + '</div></div>';
      }).join('') : '<div class="empty"><div class="icon">📭</div>No activity yet.</div>') +
      '</div>';
  };

  // ─── Notifications (assistant → email pipeline) ─────────────────
  // The booking-page assistant emails you (via the site's existing
  // Web3Forms channel) when a visitor completes an estimate or picks a
  // hand-off. This panel documents the routing and lets you verify the
  // pipeline end-to-end — including a live check of the access key that
  // visitors' form submissions actually use.

  function getLiveW3FKey() {
    // Extract the key from the deployed /book/ page so the check reflects
    // exactly what visitors experience (window.VN_W3F_KEY line).
    return fetch('/book/').then(function (r) { return r.text(); }).then(function (html) {
      var m = html.match(/VN_W3F_KEY\s*=\s*['"]([0-9a-f-]{36})['"]/i)
        || html.match(/name="access_key"\s+value="([0-9a-f-]{36})"/i);
      return m ? m[1] : null;
    });
  }

  function sendTestNotification() {
    var btn = document.getElementById('notifTestBtn');
    var out = document.getElementById('notifTestOut');
    if (!btn) return;
    btn.disabled = true; btn.textContent = 'Checking…';
    out.innerHTML = '<span style="color:var(--txt3);font-size:0.8rem">Reading the live access key from /book/ and sending a test through api.web3forms.com…</span>';
    getLiveW3FKey().then(function (key) {
      if (!key) {
        btn.disabled = false; btn.textContent = 'Send test notification';
        out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div><strong>No access key found on /book/.</strong> The key line <code>window.VN_W3F_KEY</code> is missing or malformed in book/index.html.</div></div>';
        return;
      }
      var masked = key.slice(0, 8) + '…' + key.slice(-4);
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: key,
          subject: '🔔 TEST — notification pipeline check (victorndunda.com dashboard)',
          from_name: 'Dashboard Test',
          name: 'Dashboard Test',
          message: [
            'This is a TEST notification sent from the dashboard Notifications panel.',
            'Key checked: ' + masked,
            'Time: ' + new Date().toLocaleString(),
            '',
            'If this email arrived, the assistant → email pipeline is working.',
            'Real notifications look like this:',
            '  🔔 Estimate completed — booking assistant',
            '  Service: RAG Knowledge Systems',
            '  Volume: 500–5,000 / month',
            '  Integrations: 3–5 systems',
            '  Languages: English + Swahili/French',
            '  Ballpark: $16,200–$21,900 · KES 1,290,000–1,740,000',
            '',
            '—',
            'Privacy-safe pings: estimate configuration and channel only. No chat text, no personal data, no cookies.'
          ].join('\n')
        })
      }).then(function (r) { return r.json(); })
        .then(function (j) {
          btn.disabled = false; btn.textContent = 'Send test notification';
          if (j && j.success) {
            out.innerHTML = '<div class="check-item"><div class="check ok">✓</div><div><strong>Pipeline live (key ' + masked + ').</strong> Check the inbox linked to your Web3Forms account (spam folder the first time) — estimate and hand-off notifications will be delivered there too.</div></div>';
            toast('Test notification sent!');
          } else if (j && j.message && /invalid/i.test(j.message)) {
            out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div><strong>Access key is INVALID (' + masked + ') — the contact form is failing for visitors too.</strong><br>' +
              'Rotate it (free, ~1 minute): <ol style="margin:0.5rem 0 0 1.2rem;line-height:1.7">' +
              '<li>Open <a href="https://web3forms.com" target="_blank" style="color:var(--acc)">web3forms.com</a> and sign in with the email that should receive notifications</li>' +
              '<li>Create a new Access Key</li>' +
              '<li>Edit <code>book/index.html</code> in this repo — replace the key on the <code>window.VN_W3F_KEY</code> line (search for it)</li>' +
              '<li>Commit to <code>main</code> (auto-deploys), then come back and press this button again</li>' +
              '</ol>Until then, the WhatsApp and Cal.com hand-offs keep working — only email delivery is down.</div></div>';
            toast('Web3Forms key is invalid — see instructions', 'warn');
          } else {
            out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div><strong>Web3Forms rejected the request.</strong> ' + (j && j.message ? esc2(j.message) : 'Unknown error') + '</div></div>';
          }
        })
        .catch(function (err) {
          btn.disabled = false; btn.textContent = 'Send test notification';
          out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div><strong>Network error.</strong> ' + String(err) + '</div></div>';
        });
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = 'Send test notification';
      out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div><strong>Could not read /book/.</strong> ' + String(err) + '</div></div>';
    });
  }
  function esc(s) { return esc2(s); } // legacy local alias

  sections.notifications = function () {
    return '<div class="page-head"><h1>Notifications</h1><p>Assistant activity is emailed to you via Web3Forms — verify the pipeline here.</p></div>' +
      '<div class="card"><h3>What triggers an email</h3>' +
      '<table class="tbl"><thead><tr><th>Visitor action (/book/)</th><th>Email you receive</th><th>Contains</th></tr></thead><tbody>' +
      '<tr><td><strong>Estimate completed</strong></td><td>🔔 Estimate completed — booking assistant</td><td>Service, volume, integrations, languages, price range, timestamp</td></tr>' +
      '<tr><td><strong>Picks "Continue on WhatsApp"</strong></td><td>🔔 Handoff: WhatsApp</td><td>Channel + estimate context (if any) + timestamp</td></tr>' +
      '<tr><td><strong>Picks "Book the free assessment"</strong></td><td>🔔 Handoff: calendar</td><td>Channel + estimate context (if any) + timestamp</td></tr>' +
      '<tr><td><strong>Sends a brief / unanswered question</strong></td><td>🔔 Handoff: brief form</td><td>Channel + estimate context (if any) + timestamp</td></tr>' +
      '<tr><td><strong>Message form submitted</strong></td><td>New inquiry from victorndunda.com/book</td><td>Full contact form (name, email, message)</td></tr>' +
      '</tbody></table>' +
      '<p style="color:var(--txt2);font-size:0.8rem;margin-top:0.75rem;line-height:1.6">Privacy design: pings carry the estimate configuration and channel only — no chat text, no personal data, no cookies. Rate-limited to one ping per event type per visitor session (4 minutes). Disclosed on the booking page and in the privacy policy.</p>' +
      '</div>' +
      '<div class="card"><h3>Pipeline verification</h3>' +
      '<p style="color:var(--txt2);font-size:0.85rem;line-height:1.6;margin-bottom:0.75rem">Sends a labelled TEST email through the same Web3Forms endpoint the assistant uses. If it lands in your inbox, real notifications work too.</p>' +
      '<button class="btn" id="notifTestBtn">Send test notification</button>' +
      '<div id="notifTestOut" style="margin-top:0.75rem"></div>' +
      '</div>' +
      '<div class="card"><h3>Where notifications live</h3>' +
      '<div class="actions">' +
      '<a href="https://web3forms.com/dashboard" target="_blank" class="action"><span class="icon">📥</span>Web3Forms Inbox</a>' +
      '<a href="/book/" target="_blank" class="action"><span class="icon">🤖</span>Try the assistant</a>' +
      '<a href="/privacy-policy.html" target="_blank" class="action"><span class="icon">🔒</span>Privacy disclosure</a>' +
      '</div>' +
      '<p style="color:var(--txt3);font-size:0.78rem;margin-top:0.75rem;line-height:1.6">This is a static site on GitHub Pages, so email is the delivery channel — there is no server to store cross-visitor history. Web3Forms also keeps a submission log in their dashboard as a backup record.</p>' +
      '</div>';
  };

  listeners.notifications = function () {
    var b = document.getElementById('notifTestBtn');
    if (b) b.addEventListener('click', sendTestNotification);
  };

  // ─── Projects section ────────────────────────────────────────────
  var projectsData = [];
  fetch('/projects/projects.json').then(function (r) { return r.json(); }).then(function (d) { projectsData = d.projects || []; }).catch(function () {});

  function getProjects() { try { return JSON.parse(localStorage.getItem('vn_projects') || '[]'); } catch (e) { return []; } }
  function saveProjects(p) { localStorage.setItem('vn_projects', JSON.stringify(p)); }

  sections.projects = function () {
    var jsonProjects = projectsData;
    var customProjects = getProjects();
    var all = jsonProjects.concat(customProjects);

    return '<div class="page-head"><h1>Projects</h1><p>Connect GitHub repos and manage your project showcase.</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Total</div><div class="stat-val">' + all.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Featured</div><div class="stat-val">' + all.filter(function(p){return p.featured;}).length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Open-Source</div><div class="stat-val">' + all.filter(function(p){return p.github;}).length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Custom Added</div><div class="stat-val">' + customProjects.length + '</div></div>' +
      '</div>' +
      '<div class="actions">' +
      '<button class="action" id="addProjectBtn" style="border:none;cursor:pointer;font-family:inherit"><span class="icon">➕</span>Add from GitHub</button>' +
      '<a href="/projects/" class="action"><span class="icon">🌐</span>View Projects Page</a>' +
      '<a href="/projects/projects.json" class="action"><span class="icon">📋</span>Edit projects.json</a>' +
      '</div>' +
      // Add project form (hidden by default)
      '<div class="card" id="addProjectForm" style="display:none;margin-bottom:1rem">' +
        '<h3 style="margin-bottom:1rem">Connect a GitHub Repository</h3>' +
        '<label class="label">GitHub Repo (owner/repo)</label>' +
        '<input class="input" id="newProjectRepo" placeholder="e.g. gadda00/my-new-project" />' +
        '<label class="label">Display Name</label>' +
        '<input class="input" id="newProjectName" placeholder="e.g. My Awesome Project" />' +
        '<label class="label">Tagline</label>' +
        '<input class="input" id="newProjectTagline" placeholder="One-line description" />' +
        '<label class="label">Category</label>' +
        '<select class="select" id="newProjectCategory">' +
          '<option value="AI Platform">AI Platform</option>' +
          '<option value="Enterprise · Fintech">Enterprise · Fintech</option>' +
          '<option value="SaaS · Sales & Ops">SaaS · Sales & Ops</option>' +
          '<option value="Agricultural AI">Agricultural AI</option>' +
          '<option value="Open-Source · Developer Tools">Open-Source · Developer Tools</option>' +
          '<option value="Data Science">Data Science</option>' +
        '</select>' +
        '<label class="label">Featured?</label>' +
        '<select class="select" id="newProjectFeatured"><option value="false">No</option><option value="true">Yes</option></select>' +
        '<button class="btn" id="saveProjectBtn" style="margin-top:0.5rem">Fetch & Save Project</button>' +
        '<div id="addProjectStatus" style="margin-top:0.5rem;font-size:0.8rem;color:var(--txt2)"></div>' +
      '</div>' +
      // Project list
      '<div class="card"><h3>Current Projects</h3>' +
      '<table class="tbl"><thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Repo</th><th>Featured</th><th>Actions</th></tr></thead><tbody>' +
      all.map(function(p, i) {
        var isCustom = i >= jsonProjects.length;
        return '<tr>' +
          '<td><strong>' + (p.icon ? esc2(p.icon) + ' ' : '') + esc2(p.name) + '</strong>' + (isCustom ? ' <span class="badge b-green">custom</span>' : '') + '</td>' +
          '<td>' + esc2(p.category || '—') + '</td>' +
          '<td><span class="badge ' + (p.status === 'production' ? 'b-green' : p.status === 'active' ? 'b-blue' : 'b-gray') + '">' + esc2(p.status || '—') + '</span></td>' +
          '<td>' + (p.github ? '<a href="https://github.com/' + encodeURIComponent(safePath(p.github)) + '" target="_blank" style="color:var(--acc)">' + esc2(p.github) + '</a>' : '—') + '</td>' +
          '<td>' + (p.featured ? '⭐' : '—') + '</td>' +
          '<td>' + (isCustom ? '<button class="btn btn-sm btn-ghost" data-del-project="' + (i - jsonProjects.length) + '">Delete</button>' : '<span style="color:var(--txt3);font-size:0.75rem">json</span>') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="card" style="margin-top:1rem">' +
        '<h3>How to add a project</h3>' +
        '<p style="color:var(--txt2);font-size:0.85rem;line-height:1.6">' +
        '<strong>Option 1 (Dashboard):</strong> Click "Add from GitHub" above, enter the repo (owner/repo), and click "Fetch & Save". The dashboard will pull live data from the GitHub API and save it to localStorage. Custom projects show up on the public projects page immediately.<br><br>' +
        '<strong>Option 2 (Manual):</strong> Edit <a href="https://github.com/gadda00/victor-portfolio/edit/main/projects/projects.json" target="_blank" style="color:var(--acc)">projects/projects.json</a> directly on GitHub. Add a new entry to the <code>projects</code> array with all fields. Changes go live on the next deploy (GitHub Pages auto-rebuilds on push).' +
        '</p>' +
      '</div>';
  };

  listeners.projects = function () {
    var addBtn = document.getElementById('addProjectBtn');
    var form = document.getElementById('addProjectForm');
    addBtn.addEventListener('click', function () {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    var saveBtn = document.getElementById('saveProjectBtn');
    saveBtn.addEventListener('click', function () {
      var repo = document.getElementById('newProjectRepo').value.trim();
      var name = document.getElementById('newProjectName').value.trim();
      var tagline = document.getElementById('newProjectTagline').value.trim();
      var category = document.getElementById('newProjectCategory').value;
      var featured = document.getElementById('newProjectFeatured').value === 'true';

      if (!repo || !name) {
        document.getElementById('addProjectStatus').textContent = 'Repo and name are required.';
        return;
      }

      document.getElementById('addProjectStatus').textContent = 'Fetching from GitHub...';

      // Fetch repo data from GitHub API
      fetch('https://api.github.com/repos/' + repo)
        .then(function (r) {
          if (!r.ok) throw new Error('Repo not found');
          return r.json();
        })
        .then(function (data) {
          // Fetch languages
          return fetch('https://api.github.com/repos/' + repo + '/languages')
            .then(function (r) { return r.json(); })
            .then(function (langs) {
              var langArr = Object.keys(langs).slice(0, 5);
              var totalBytes = 0;
              for (var l in langs) totalBytes += langs[l];
              var langPct = {};
              for (var l2 in langs) langPct[l2] = Math.round(langs[l2] / totalBytes * 100);

              var newProject = {
                id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: name,
                tagline: tagline || data.description || 'A new project',
                description: data.description || tagline || 'A new project by Victor Ndunda.',
                category: category,
                status: data.archived ? 'shipped' : 'active',
                featured: featured,
                priority: 99,
                github: repo,
                liveUrl: data.homepage || null,
                repo: data.html_url,
                technologies: langArr,
                metrics: {
                  stars: data.stargazers_count,
                  forks: data.forks_count,
                  languages: langPct
                },
                visual: 'chart-line',
                accentColor: '#00d4ff',
                icon: '📦',
                badge: category,
                badgeClass: 'busara',
                links: [
                  { label: 'GitHub', url: data.html_url, type: 'primary' }
                ],
                highlights: [
                  data.language ? 'Primary language: ' + data.language : 'Multi-language',
                  'Stars: ' + data.stargazers_count,
                  'Forks: ' + data.forks_count,
                  data.license ? 'License: ' + data.license.spdx_id : 'MIT'
                ]
              };

              var custom = getProjects();
              custom.push(newProject);
              saveProjects(custom);

              document.getElementById('addProjectStatus').textContent = '✅ Project saved! It will appear on the public projects page.';
              window.__toast('Project added successfully!', 'success');

              // Refresh the view
              setTimeout(function () { switchSection('projects'); }, 1500);
            });
        })
        .catch(function (err) {
          document.getElementById('addProjectStatus').textContent = '❌ Error: ' + err.message + '. You can still add manually via projects.json.';
        });
    });

    // Delete custom project
    document.querySelectorAll('[data-del-project]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-del-project'), 10);
        var custom = getProjects();
        custom.splice(idx, 1);
        saveProjects(custom);
        window.__toast('Project deleted.', 'warn');
        switchSection('projects');
      });
    });
  };

  sections.content = function () {
    return '<div class="page-head"><h1>Content</h1><p>Manage blog articles.</p></div>' +
      '<div class="actions">' +
      '<a href="https://github.com/gadda00/victor-portfolio/new/main/blog/articles" target="_blank" class="action"><span class="icon">✍️</span>New Article</a>' +
      '<a href="/blog/posts.json" target="_blank" class="action"><span class="icon">📋</span>Edit posts.json</a>' +
      '<a href="/feed.xml" target="_blank" class="action"><span class="icon">📡</span>RSS Feed</a>' +
      '</div>' +
      '<div class="card"><table class="tbl"><thead><tr><th>Title</th><th>Tag</th><th>Date</th><th>Read</th></tr></thead><tbody>' +
      blogPosts.map(function (p) {
        return '<tr><td><strong>' + esc2(p.title) + '</strong></td><td><span class="badge b-blue">' + esc2(p.tag) + '</span></td><td>' + esc2(p.date) + '</td><td>' + esc2(p.readTime) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  };

  // ─── Client Portal Command Center (v13) ─────────────────────────
  // The client portal (/services/client-dashboard.html) is zero-backend:
  // client data is AES-encrypted in THEIR browser. This command center
  // is the owner's side of the bridge:
  //   1. Portal events logged on this browser (testing / shared device)
  //   2. Share codes — clients paste VN1.… codes to Victor, he imports
  //      full project snapshots (payments, stages, retainer, contact)
  //   3. Every client action ALSO emails you via Web3Forms instantly:
  //      signups, plans chosen, payments marked, messages, cancellations.

  function getPortalEvents() {
    try { return JSON.parse(localStorage.getItem('vn_portal_events') || '[]'); } catch { return []; }
  }
  function getPortalClients() {
    try { return JSON.parse(localStorage.getItem('vn_portal_clients') || '[]'); } catch { return []; }
  }
  function savePortalClients(arr) {
    try { localStorage.setItem('vn_portal_clients', JSON.stringify(arr)); } catch {}
  }

  /* v21: owner-side payment transitions on IMPORTED client records.
     Same event shape as portal-core's ledger. In demo mode this is an
     explicit, browser-local owner action — never a provider webhook. */
  function payActionAllowed(from, to) {
    if (from === 'reported') return ['submitted', 'verified', 'rejected'].indexOf(to) !== -1;
    if (from === 'submitted') return ['verified', 'rejected'].indexOf(to) !== -1;
    if (from === 'verified') return to === 'refunded';
    return false;
  }

  function transitionImportedPayment(idx, n, to) {
    var clients = getPortalClients();
    var c = clients[idx];
    if (!c || !c.project) return false;
    var pay = (c.project.payments || []).find(function (x) { return Number(x.n) === Number(n); });
    if (!pay) return false;
    var from = pay.status || 'due';
    if (from === to || !payActionAllowed(from, to)) { toast('Cannot move a payment from ' + from + ' to ' + to + '.', 'warn'); return false; }
    pay.status = to;
    pay.events = Array.isArray(pay.events) ? pay.events : [];
    pay.events.push({
      id: 'PE' + Date.now().toString(36).toUpperCase(),
      at: new Date().toISOString(),
      actor: 'owner', source: 'owner-action',
      from: from, to: to,
      currency: 'USD', amountMinor: Math.round((pay.usd || 0) * 100),
      provider: pay.method || null, providerRef: pay.ref || null,
      idempotencyKey: (c.project.id || 'P') + ':' + n + ':' + to + ':' + Date.now().toString(36),
      note: 'Owner ' + to + ' in dashboard (demo: browser-local owner action — no provider webhook).'
    });
    if (to === 'verified') pay.verifiedAt = new Date().toISOString();
    if (to === 'rejected') pay.rejectedAt = new Date().toISOString();
    if (to === 'refunded') pay.refundedAt = new Date().toISOString();
    savePortalClients(clients);
    toast('Payment ' + to + ' — owner-action event recorded');
    switchSection('clients');
    return true;
  }

  var IMPORT_PAY_BADGES = {
    verified:  ['b-green', 'verified'],
    reported:  ['b-yellow', 'reported'],
    submitted: ['b-blue', 'submitted'],
    rejected:  ['b-red', 'rejected'],
    refunded:  ['b-gray', 'refunded'],
    due:       ['b-gray', 'due'],
    sent:      ['b-blue', 'sent']
  };

  sections.clients = function () {
    var events = getPortalEvents();
    var clients = getPortalClients();
    var briefs = getBriefs();
    // v21: only VERIFIED payments count as received; reported tracked separately
    var verifiedTotal = clients.reduce(function (a, c) {
      return a + ((c.project && c.project.payments || []).filter(function (p) { return p.status === 'verified'; }).reduce(function (s, p) { return s + (p.usd || 0); }, 0));
    }, 0);
    var reportedTotal = clients.reduce(function (a, c) {
      return a + ((c.project && c.project.payments || []).filter(function (p) { return p.status === 'reported' || p.status === 'submitted'; }).reduce(function (s, p) { return s + (p.usd || 0); }, 0));
    }, 0);
    var mrr = clients.reduce(function (a, c) {
      return a + (c.project && c.project.retainer && c.project.retainer.active ? (c.project.retainer.monthlyUsd || 0) : 0);
    }, 0);

    return '<div class="page-head"><h1>Client Portal Command Center</h1><p>Imported client snapshots — client-reported data you verify explicitly.</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Portal Clients</div><div class="stat-val">' + clients.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Verified (tracked)</div><div class="stat-val">' + usd(verifiedTotal) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Reported · unverified</div><div class="stat-val" style="color:#fbbf24">' + usd(reportedTotal) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Retainer MRR</div><div class="stat-val">' + usd(mrr) + '</div></div>' +
      '</div>' +

      '<div class="card"><h3>📥 Import a client snapshot code</h3>' +
      '<p style="color:var(--txt2);font-size:0.85rem;line-height:1.6;margin:0 0 0.75rem">When a client clicks "Generate snapshot code" in their portal, they get a <code>VN2.…</code> string (versioned, expiring, checksummed). Paste it here to import their project snapshot. Imports are always <strong>client-reported and unverified</strong> — payments arrive as "reported" no matter what the code claims, and only your explicit action below produces "verified".</p>' +
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">' +
      '<input type="text" id="portalImportInput" placeholder="VN2.eyJ2IjoyLCJraW5kIjoidm4tcG9ydGFs…" style="flex:1;min-width:220px" class="input" />' +
      '<button class="btn" id="portalImportBtn">Import client</button>' +
      '</div>' +
      '<div id="portalImportOut" style="margin-top:0.6rem"></div>' +
      '</div>' +

      (clients.length ? '<div class="card"><h3>💼 Imported clients</h3>' +
      '<div class="check-item" style="margin-bottom:0.75rem"><div class="check warn">!</div><div><strong>Unverified imports.</strong> Snapshot data is client-provided. "Reported" payments still need reconciliation against your M-Pesa / bank statement before you mark them verified.</div></div>' +
      '<table class="tbl"><thead><tr><th>Client</th><th>Project</th><th>Payments (owner actions)</th><th>Retainer</th><th>Imported</th></tr></thead><tbody>' +
      clients.slice().reverse().map(function (c) {
        var p = c.project || {};
        var prog = p.progress != null ? p.progress : 0;
        var ret = p.retainer;
        var idx = clients.indexOf(c); // stable index into the un-reversed array
        var paysHtml = (p.payments || []).map(function (x) {
          var b = IMPORT_PAY_BADGES[x.status] || IMPORT_PAY_BADGES.due;
          var out = '<div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.3rem">' +
            '<span class="badge ' + b[0] + '">' + b[1] + '</span>' +
            '<span style="font-size:0.75rem;color:var(--txt2)">' + esc2(x.label) + ' · ' + usd(x.usd || 0) + (x.ref ? ' · ref ' + esc2(x.ref) : '') + (x.claimedStatus && x.claimedStatus !== 'reported' ? ' · client claimed "' + esc2(x.claimedStatus) + '"' : '') + '</span>';
          if (x.status === 'reported') {
            out += '<button class="btn btn-sm" data-pay-client="' + idx + '" data-pay-n="' + esc2(x.n) + '" data-pay-to="verified">✓ Verify</button>' +
                   '<button class="btn btn-sm btn-ghost" data-pay-client="' + idx + '" data-pay-n="' + esc2(x.n) + '" data-pay-to="rejected">✗ Reject</button>';
          } else if (x.status === 'submitted') {
            out += '<button class="btn btn-sm" data-pay-client="' + idx + '" data-pay-n="' + esc2(x.n) + '" data-pay-to="verified">✓ Verify</button>';
          } else if (x.status === 'verified') {
            out += '<button class="btn btn-sm btn-ghost" data-pay-client="' + idx + '" data-pay-n="' + esc2(x.n) + '" data-pay-to="refunded">↩ Refund</button>';
          }
          out += '</div>';
          return out;
        }).join('') || '<span style="color:var(--txt3);font-size:0.8rem">No payment plan yet</span>';
        return '<tr><td><strong>' + (c.client ? esc2(c.client.name || c.client.email) : '—') + '</strong><div style="font-size:0.7rem;color:var(--txt3)">' + (c.client ? esc2(c.client.email || '') : '') + '</div></td>' +
          '<td>' + esc2(p.name || p.packageName || '—') + '<div style="font-size:0.7rem;color:var(--txt3)">' + esc2(p.status || '') + ' · ' + prog + '%</div></td>' +
          '<td>' + paysHtml + '</td>' +
          '<td>' + (ret ? (ret.active ? '<span class="badge b-green">' + usd(ret.monthlyUsd) + '/mo</span>' : '<span class="badge b-gray">ended</span>') : '—') + '</td>' +
          '<td>' + (c.importedAt ? new Date(c.importedAt).toLocaleDateString() : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '') +

      '<div class="card"><h3>⚡ How the portal pipeline reaches you</h3>' +
      '<div class="set-row"><span class="set-label">Client signs up</span><span class="set-val">Instant email (Web3Forms) → mututandunda@gmail.com</span></div>' +
      '<div class="set-row"><span class="set-label">Payment reported by client</span><span class="set-val">Instant email with the client\'s M-Pesa ref — client-reported, not verified</span></div>' +
      '<div class="set-row"><span class="set-label">Verification</span><span class="set-val">You reconcile against your statement, then press ✓ Verify above (owner action)</span></div>' +
      '<div class="set-row"><span class="set-label">Client message / support request</span><span class="set-val">Instant email — reply within 4 business hours</span></div>' +
      '<div class="set-row"><span class="set-label">Full project detail</span><span class="set-val">Client snapshot code → validated import above (unverified)</span></div>' +
      '</div>' +

      (events.length ? '<div class="card"><h3>📡 Recent portal events (this device)</h3>' +
      events.slice(0, 15).map(function (e) {
        var ic = { auth: '🔐', project: '📁', payment: '💳', retainer: '🛡️', message: '💬' }[e.type] || '•';
        return '<div class="activity"><div class="icon">' + ic + '</div><div class="txt">' + esc2(e.text) + (e.email ? ' <span style="color:var(--txt3);font-size:0.75rem">(' + esc2(e.email) + ')</span>' : '') + '</div><div class="time">' + esc2(timeAgo(e.at)) + '</div></div>';
      }).join('') + '</div>' : '') +

      (briefs.length ? '<div class="card"><h3>📋 Legacy briefs (pre-portal)</h3><table class="tbl"><thead><tr><th>Client</th><th>Package</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
      briefs.map(function (b) {
        var pkg = b.recommendation ? b.recommendation.packageName : (b.estimate ? b.estimate.packageName : '—');
        var st = b.status || 'draft';
        var bc = { draft: 'b-gray', contracted: 'b-blue', 'in-progress': 'b-yellow', delivered: 'b-green' }[st] || 'b-gray';
        return '<tr><td><strong>' + (b.details ? esc2(b.details.name) : 'Unknown') + '</strong></td><td>' + esc2(pkg) + '</td><td><span class="badge ' + bc + '">' + esc2(st) + '</span></td><td>' + (b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '');
  };

  listeners.clients = function () {
    var btn = document.getElementById('portalImportBtn');
    var input = document.getElementById('portalImportInput');
    var out = document.getElementById('portalImportOut');
    if (!btn || !input) return;
    btn.addEventListener('click', async function () {
      var code = input.value.trim();
      out.innerHTML = '';
      if (!code) {
        out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div>Paste a snapshot code first.</div></div>';
        return;
      }
      if (!window.VNPortalCore || typeof window.VNPortalCore.decodeShareCode !== 'function') {
        out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div>Snapshot validator unavailable (portal-core.js did not load).</div></div>';
        return;
      }
      btn.disabled = true; btn.textContent = 'Validating…';
      var res;
      try { res = await window.VNPortalCore.decodeShareCode(code); }
      catch (e) { res = { ok: false, error: 'Validation failed: ' + (e && e.message ? e.message : 'unknown error') }; }
      btn.disabled = false; btn.textContent = 'Import client';

      if (!res || !res.ok) {
        out.innerHTML = '<div class="check-item"><div class="check warn">!</div><div><strong>Import rejected.</strong> ' + esc2(res && res.error ? res.error : 'Unknown error') + '</div></div>';
        return;
      }

      var snap = res.snapshot;
      var clients = getPortalClients().filter(function (c) { return c.project && c.project.id !== snap.project.id; });
      clients.push({
        client: snap.client,
        project: snap.project,
        importedAt: new Date().toISOString(),
        unverified: true,                       // imports are client-reported, always
        importMeta: {
          version: res.meta && res.meta.version,
          legacy: !!(res.meta && res.meta.legacy),
          replay: res.meta && res.meta.replay,
          importedAt: new Date().toISOString()
        }
      });
      if (clients.length > 50) clients = clients.slice(-50);
      savePortalClients(clients);

      var reportedUsd = (snap.project.payments || []).reduce(function (s, x) { return s + (x.usd || 0); }, 0);
      var notes = [];
      if (res.warning) notes.push(esc2(res.warning));
      if (res.meta && res.meta.replay === 'duplicate') notes.push('Duplicate import: this exact snapshot was already imported on this device (nonce replay flagged).');
      if (snap._meta && snap._meta.claimedPaid) notes.push('The client\'s code claimed paid/verified status — imported as <em>reported</em> (unverified) regardless.');
      notes.push('Payments show as "reported" — reconcile against your statement, then use ✓ Verify.');

      out.innerHTML = '<div class="check-item"><div class="check ok">✓</div><div><strong>Imported ' + esc2(snap.project.name || snap.project.packageName) + '</strong> — ' +
        esc2(snap.client ? snap.client.name : '') + ' · ' + usd(reportedUsd) + ' reported (unverified) · ' + (snap.project.progress || 0) + '% through the pipeline.' +
        '<div style="font-size:0.78rem;color:var(--txt2);margin-top:0.4rem;line-height:1.6">· ' + notes.join('<br>· ') + '</div></div></div>';
      input.value = '';
      toast('Client snapshot imported — unverified, client-reported');
      setTimeout(function () { switchSection('clients'); }, 1200);
    });

    // Owner payment actions on imported records (verify / reject / refund)
    document.querySelectorAll('[data-pay-client]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(b.getAttribute('data-pay-client'), 10);
        var n = parseInt(b.getAttribute('data-pay-n'), 10);
        var to = b.getAttribute('data-pay-to');
        var clients = getPortalClients();
        var c = clients[idx];
        var pay = c && c.project && (c.project.payments || []).find(function (x) { return Number(x.n) === n; });
        if (!pay) return;
        var label = (pay.label || 'installment ' + n) + ' (' + usd(pay.usd || 0) + ')';
        if (to === 'verified' && !confirm('Verify ' + label + ' for ' + (c.client ? (c.client.name || c.client.email) : 'this client') + '?\n\nOnly do this after reconciling the client\'s reference against your M-Pesa / bank statement. This records an owner-action event in the payment ledger (demo: browser-local).')) return;
        if (to === 'rejected' && !confirm('Reject ' + label + '? The client will need to re-report or follow up manually.')) return;
        if (to === 'refunded' && !confirm('Mark ' + label + ' as refunded? This records an owner-action refund event.')) return;
        transitionImportedPayment(idx, n, to);
      });
    });
  };

  // ─── Invoicing (v9: full engagement pipeline, first-party) ──────
  // Reads the same 'vn_invoices' store the invoice tool writes.
  // Full editing happens at /services/invoice.html — this panel gives
  // revenue at a glance, statuses, and pipeline health.

  function getInvoices() {
    try { return JSON.parse(localStorage.getItem('vn_invoices') || '[]'); } catch { return []; }
  }
  function invTotalsOf(inv) {
    var VAT = 0.16;
    var subtotal = (inv.items || []).reduce(function (s, it) { return s + (Number(it.qty) || 0) * (Number(it.rateUsd) || 0); }, 0);
    var discount = subtotal * ((Number(inv.discountPct) || 0) / 100);
    var vat = inv.vatOn ? (subtotal - discount) * VAT : 0;
    var totalUsd = subtotal - discount + vat;
    var paid = (inv.payments || []).reduce(function (s, p) { return s + (Number(p.usd) || 0); }, 0);
    return { totalUsd: totalUsd, paidUsd: paid, balanceUsd: totalUsd - paid };
  }
  function invStatus(inv) {
    if (inv.status === 'paid') return 'paid';
    if (inv.status === 'sent' && inv.due && inv.due < new Date().toISOString().slice(0, 10)) return 'overdue';
    return inv.status || 'draft';
  }
  function usd(n) { return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  sections.invoicing = function () {
    var invoices = getInvoices();
    var rev = { paid: 0, pending: 0, overdue: 0 };
    invoices.forEach(function (inv) {
      var t = invTotalsOf(inv);
      var st = invStatus(inv);
      if (st === 'paid') rev.paid += t.totalUsd;
      else if (st === 'overdue') rev.overdue += t.balanceUsd;
      else rev.pending += t.balanceUsd || t.totalUsd;
    });

    // v21: the invoice table is DOM-built in listeners.invoicing —
    // invoice numbers, client names and dates come from browser storage
    // (user-controlled) and must never be interpolated into HTML strings.
    return '<div class="page-head"><h1>Invoicing</h1><p>First-party invoices — draft, send, track payment.</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Paid</div><div class="stat-val">' + usd(rev.paid) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Pending</div><div class="stat-val">' + usd(rev.pending) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Overdue</div><div class="stat-val" style="color:' + (rev.overdue > 0 ? '#f87171' : 'inherit') + '">' + usd(rev.overdue) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Invoices</div><div class="stat-val">' + invoices.length + '</div></div>' +
      '</div>' +
      '<div class="actions">' +
      '<a href="/services/invoice.html" class="action"><span class="icon">🧾</span>New / Manage Invoices</a>' +
      '<a href="/services/wizard.html" class="action"><span class="icon">🚀</span>Scope Wizard</a>' +
      '<a href="/book/" class="action"><span class="icon">📅</span>Booking Page</a>' +
      '</div>' +
      '<div class="card"><h3>Pipeline</h3>' +
      '<p style="color:var(--txt2);font-size:0.9rem;line-height:1.7">Enquiry (assistant) → Estimate → Call booked (scheduler) → Proposal → <strong>Invoice</strong> → Payment → Delivery. ' +
      'The assistant estimate and wizard brief both import into the invoice tool as line items — one continuous, first-party chain.</p></div>' +
      '<div class="card" id="invTableMount"></div>' +
      '<div class="card"><h3>Payment methods on invoices</h3>' +
      '<div class="set-row"><span class="set-label">M-Pesa Paybill</span><span class="set-val">4071186 — Account = invoice number · reconciled manually</span></div>' +
      '<div class="set-row"><span class="set-label">Card / international</span><span class="set-val">Placeholder — no card provider connected; link on request (email)</span></div>' +
      '<div class="set-row"><span class="set-label">Storage</span><span class="set-val">This browser (localStorage) — export JSON backups from the invoice tool. Browser-local demo, not verified accounting.</span></div>' +
      '</div>';
  };

  listeners.invoicing = function () {
    // Mount the DOM-built invoice table (XSS-safe rendering) at the marker.
    var sections0 = document.querySelectorAll('#content .card');
    // The table card is the first .card containing the marker-free DOM table;
    // simplest: rebuild inside the marker element.
    var marker = document.getElementById('invTableMount');
    if (marker) {
      var invoices = getInvoices();
      var card = el('div', null);
      if (invoices.length) {
        var tbl = el('table', 'tbl');
        var thead = el('thead'); var hrow = el('tr');
        ['Number', 'Client', 'Total', 'Balance', 'Status', 'Due'].forEach(function (h) { hrow.appendChild(el('th', null, h)); });
        thead.appendChild(hrow); tbl.appendChild(thead);
        var tbody = el('tbody');
        invoices.slice().reverse().forEach(function (inv) {
          var t = invTotalsOf(inv);
          var st = invStatus(inv);
          var bc = { draft: 'badge-gray', sent: 'badge-blue', paid: 'badge-green', overdue: 'badge-red' }[st] || 'badge-gray';
          var row = el('tr');
          var numTd = el('td'); numTd.appendChild(el('strong', null, String(inv.number || '—'))); row.appendChild(numTd);
          row.appendChild(el('td', null, String((inv.client && (inv.client.name || inv.client.company)) || '—')));
          row.appendChild(el('td', null, usd(t.totalUsd)));
          row.appendChild(el('td', null, t.paidUsd > 0 ? usd(t.balanceUsd) : '—'));
          var std = el('td'); std.appendChild(el('span', 'badge ' + bc, st)); row.appendChild(std);
          row.appendChild(el('td', null, String(inv.due || '—')));
          tbody.appendChild(row);
        });
        tbl.appendChild(tbody); card.appendChild(tbl);
      } else {
        var empty = el('div', 'empty');
        empty.appendChild(el('div', 'icon', '🧾'));
        empty.appendChild(document.createTextNode('No invoices yet — open the invoice tool to draft your first.'));
        card.appendChild(empty);
      }
      while (marker.firstChild) marker.removeChild(marker.firstChild);
      marker.appendChild(card);
    }
  };

  sections.findclients = function () {
    return '<div class="page-head"><h1>Find Clients</h1><p>Lead generation sources and outreach tracker.</p></div>' +
      '<div class="actions">' +
      '<a href="https://www.upwork.com/nx/search/jobs/?q=AI+engineer" target="_blank" class="action"><span class="icon">💼</span>Upwork</a>' +
      '<a href="https://www.fiverr.com/categories/programming-tech/ai-services" target="_blank" class="action"><span class="icon">🎨</span>Fiverr</a>' +
      '<a href="https://www.linkedin.com/jobs/search/?keywords=AI+consultant" target="_blank" class="action"><span class="icon">📌</span>LinkedIn</a>' +
      '<a href="https://wellfound.com/jobs?q=AI+engineer" target="_blank" class="action"><span class="icon">🚀</span>Wellfound</a>' +
      '</div>' +
      '<div class="card"><h3>Lead Sources</h3>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Upwork</strong> — Search "AI engineer", "multi-agent", "RAG chatbot". Filter budget $5K+.</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>LinkedIn</strong> — Search CTOs/Founders at Nairobi startups. Company size 1-50.</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Twitter/X</strong> — "looking for AI engineer" OR "need AI chatbot" min_faves:5</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Nairobi Tech</strong> — iHub, Nairobi Garage, Nailab meetups. Offer free AI audits.</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Cold Outreach</strong> — 10 emails/week to Nairobi SMBs. Free 30-min AI audit.</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Agritech</strong> — KALRO, AgriBiz, Twiga Foods. Pitch KilimoPRO.</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Fintech</strong> — M-Pesa partners, Flutterwave merchants. Pitch fraud detection.</div></div>' +
      '<div class="check-item"><div class="check ok">✓</div><div><strong>Content</strong> — 1 blog post/week = inbound lead magnet. Post on LinkedIn.</div></div>' +
      '</div>' +
      '<div class="card"><h3>Outreach Tracker</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:0.4rem;margin-bottom:0.75rem">' +
      '<input type="text" class="input" id="leadName" placeholder="Company / Lead" />' +
      '<input type="text" class="input" id="leadSource" placeholder="Source" />' +
      '<select class="select" id="leadStatus"><option value="contacted">Contacted</option><option value="replied">Replied</option><option value="meeting">Meeting</option><option value="won">Won</option><option value="lost">Lost</option></select>' +
      '<button class="btn btn-sm" id="addLead">Add</button>' +
      '</div><div id="leadsList"></div></div>';
  };

  listeners.findclients = function () {
    document.getElementById('addLead').addEventListener('click', function () {
      var n = document.getElementById('leadName');
      var s = document.getElementById('leadSource');
      var st = document.getElementById('leadStatus');
      if (!n.value.trim()) { toast('Enter a name', 'warn'); return; }
      var leads = getLeads();
      leads.unshift({ name: n.value.trim(), source: s.value.trim() || '—', status: st.value, date: new Date().toISOString() });
      if (leads.length > 50) leads.length = 50;
      localStorage.setItem('vn_leads', JSON.stringify(leads));
      n.value = ''; s.value = ''; st.value = 'contacted';
      toast('Lead added!');
      renderLeads();
    });
    renderLeads();
  };

  function renderLeads() {
    var list = document.getElementById('leadsList');
    if (!list) return;
    var leads = getLeads();
    list.textContent = '';
    if (!leads.length) {
      var empty = el('div', 'empty');
      empty.style.padding = '1.5rem';
      empty.textContent = 'No leads yet.';
      list.appendChild(empty);
      return;
    }
    var sc = { contacted: 'b-blue', replied: 'b-purple', meeting: 'b-yellow', won: 'b-green', lost: 'b-red' };
    leads.forEach(function (l, i) {
      var row = el('div', 'set-row');
      row.appendChild(el('span', null, l.name || '—')).style.fontWeight = '500';
      var srcSpan = el('span', null, l.source || '—');
      srcSpan.style.cssText = 'color:var(--txt3);font-size:0.75rem';
      row.appendChild(srcSpan);
      row.appendChild(el('span', 'badge ' + (sc[l.status] || 'b-gray'), l.status || 'contacted'));
      var t = el('span', null, timeAgo(l.date));
      t.style.cssText = 'color:var(--txt3);font-size:0.7rem';
      row.appendChild(t);
      var del = el('button', null, '×');
      del.setAttribute('aria-label', 'Delete lead ' + (l.name || ''));
      del.style.cssText = 'background:none;border:none;color:var(--txt3);cursor:pointer';
      del.addEventListener('click', function () {
        var arr = getLeads();
        arr.splice(i, 1);
        localStorage.setItem('vn_leads', JSON.stringify(arr));
        renderLeads();
      });
      row.appendChild(del);
      list.appendChild(row);
    });
  }
  window.__dash_renderLeads = renderLeads;

  sections.analytics = function () {
    var visits = parseInt(localStorage.getItem('vn_visits') || '0', 10);
    var resumeDls = parseInt(localStorage.getItem('vn_resume_downloads') || '0', 10);
    var apps = getApps().length;
    return '<div class="page-head"><h1>Analytics</h1><p>Privacy-friendly — events are buffered in the visitor\'s browser; nothing is sent until you connect a provider.</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Sessions (this browser)</div><div class="stat-val">' + visits + '</div></div>' +
      '<div class="stat"><div class="stat-label">Resume DLs (this browser)</div><div class="stat-val">' + resumeDls + '</div></div>' +
      '<div class="stat"><div class="stat-label">Job Apps (this browser)</div><div class="stat-val">' + apps + '</div></div>' +
      '<div class="stat"><div class="stat-label">Articles</div><div class="stat-val">' + blogPosts.length + '</div></div>' +
      '</div>' +
      '<div class="card"><h3>Assistant & CTA event taxonomy</h3>' +
      '<p style="color:var(--txt2);font-size:0.8rem;line-height:1.6;margin-bottom:0.5rem">Every assistant interaction and CTA click emits a structured event to <code>window.__vnEvents</code> (same shape as the site-wide hooks in app.js). No message text is ever recorded — only the event name and its configuration props.</p>' +
      '<table class="tbl"><thead><tr><th>Event</th><th>Fires when</th><th>Props</th></tr></thead><tbody>' +
      '<tr><td><code>assistant_boot</code></td><td>Assistant initializes</td><td>—</td></tr>' +
      '<tr><td><code>assistant_msg</code></td><td>Any visitor message</td><td>— (no text)</td></tr>' +
      '<tr><td><code>assistant_intent</code></td><td>A scripted intent matches</td><td><code>i</code>: pricing / timeline / process / …</td></tr>' +
      '<tr><td><code>assistant_domain</code></td><td>Industry query mapped (e.g. hospital, sacco, hotel)</td><td><code>d</code>: domain id</td></tr>' +
      '<tr><td><code>assistant_faq</code></td><td>Services FAQ match</td><td><code>score</code></td></tr>' +
      '<tr><td><code>assistant_service</code></td><td>Catalogue service matched</td><td><code>s</code>: service id</td></tr>' +
      '<tr><td><code>assistant_estimate_start</code></td><td>Estimate flow begins</td><td><code>preset</code> (if domain-prefilled)</td></tr>' +
      '<tr><td><code>assistant_estimate_complete</code></td><td>Estimate produced</td><td>service, volume, integrations, languages, usd range</td></tr>' +
      '<tr><td><code>assistant_notify_sent</code> / <code>…_failed</code></td><td>Owner email ping result</td><td><code>kind</code></td></tr>' +
      '<tr><td><code>assistant_fallback</code></td><td>No match — question handed to Victor</td><td>— (no text)</td></tr>' +
      '<tr><td><code>cta_click</code></td><td>Any <code>data-track</code> element clicked (site-wide)</td><td><code>id</code>, page</td></tr>' +
      '</tbody></table>' +
      '<div class="check-item" style="margin-top:0.75rem"><div class="check ok">✓</div><div><strong>Zero network by default</strong> — events stay in the visitor\'s browser (in-memory only), consistent with the no-tracking promise.</div></div>' +
      '</div>' +
      '<div class="card"><h3>Connect a provider</h3>' +
      '<p style="color:var(--txt2);font-size:0.8rem;line-height:1.6;margin-bottom:0.5rem">Set <code>window.__vnTrack = fn(ev)</code> before page scripts run (e.g. in <code>&lt;head&gt;</code>) and every event above flows to your provider. Plausible/GA4/Umami snippets can be wired this way when you\'re ready.</p>' +
      '<div class="actions">' +
      '<a href="https://plausible.io" target="_blank" class="action"><span class="icon">📊</span>Plausible</a>' +
      '<a href="https://umami.is" target="_blank" class="action"><span class="icon">📈</span>Umami</a>' +
      '<a href="https://gtag.dev" target="_blank" class="action"><span class="icon">🛠️</span>GA4 gtag</a>' +
      '</div></div>' +
      '<div class="card"><h3>Article Performance</h3><table class="tbl"><thead><tr><th>Title</th><th>Read Time</th><th>Words</th></tr></thead><tbody>' +
      blogPosts.map(function (p) { return '<tr><td>' + esc2(p.title) + '</td><td>' + esc2(p.readTime) + '</td><td>' + esc2(p.wordCount) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
  };

  sections.jobs = function () {
    var apps = getApps();
    return '<div class="page-head"><h1>Job Applications</h1><p>Track your application pipeline — history from the standalone portal (now consolidated into this dashboard).</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Saved</div><div class="stat-val">' + apps.filter(function (a) { return a.status === 'saved'; }).length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Applied</div><div class="stat-val">' + apps.filter(function (a) { return a.status === 'applied'; }).length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Interviews</div><div class="stat-val">' + apps.filter(function (a) { return a.status === 'interview'; }).length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Offers</div><div class="stat-val">' + apps.filter(function (a) { return a.status === 'offer'; }).length + '</div></div>' +
      '</div>' +
      (apps.length ? '<div class="card"><table class="tbl"><thead><tr><th>Title</th><th>Company</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
      apps.map(function (a) {
        var sc = { saved: 'b-gray', applied: 'b-blue', interview: 'b-purple', offer: 'b-green', rejected: 'b-red' };
        return '<tr><td><strong>' + esc2(a.title || '—') + '</strong></td><td>' + esc2(a.company || '—') + '</td><td><span class="badge ' + (sc[a.status] || 'b-gray') + '">' + esc2(a.status || 'saved') + '</span></td><td>' + (a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty"><div class="icon">🔍</div>No applications tracked yet.</div>');
  };

  sections.social = function () {
    return '<div class="page-head"><h1>Social Composer</h1><p>Generate posts from a topic.</p></div>' +
      '<div class="card"><label class="label">Topic</label><input type="text" class="input" id="socialTopic" placeholder="e.g., Building a 50-agent DAG pipeline" />' +
      '<label class="label">Tone</label><select class="select" id="socialTone"><option value="professional">Professional</option><option value="casual">Casual</option><option value="technical">Technical</option><option value="story">Story</option></select>' +
      '<label class="label">Link (optional)</label><input type="url" class="input" id="socialUrl" placeholder="https://victorndunda.com/blog/..." />' +
      '<button class="btn" id="genSocial">Generate Posts</button></div>' +
      '<div id="socialResults"></div>';
  };

  listeners.social = function () {
    document.getElementById('genSocial').addEventListener('click', function () {
      var topic = document.getElementById('socialTopic').value.trim();
      var tone = document.getElementById('socialTone').value;
      var url = document.getElementById('socialUrl').value.trim();
      if (!topic) { toast('Enter a topic', 'warn'); return; }
      // v21: URL is user input — only accept http(s) URLs for the share links.
      if (url && !/^https?:\/\/[^\s]+$/.test(url)) { toast('Link must be an http(s) URL', 'warn'); return; }
      var platforms = { linkedin: 'LinkedIn', x: 'X (Twitter)', facebook: 'Facebook', whatsapp: 'WhatsApp' };
      var tones = {
        professional: { linkedin: 'New article: "' + topic + '".\n\nI break down the technical details and share what I learned.\n\n' + (url || '') + '\n\n#AI #Engineering', x: 'New: "' + topic + '"\n\n' + (url || '') + '\n\n#AI', facebook: 'Just published: "' + topic + '" — a deep dive.\n\n' + (url || ''), whatsapp: 'New article: "' + topic + '"\n\n' + (url || '') },
        casual: { linkedin: 'Shipped something new! 🚀\n\n"' + topic + '"\n\n' + (url || ''), x: 'New drop 🚀 "' + topic + '"\n\n' + (url || ''), facebook: 'Just dropped: "' + topic + '" 🎉\n\n' + (url || ''), whatsapp: 'Hey! New: "' + topic + '" 🚀\n\n' + (url || '') },
        technical: { linkedin: 'Technical deep dive: "' + topic + '"\n\nArchitecture + algorithms + production lessons.\n\n' + (url || '') + '\n\n#Engineering', x: 'Tech deep dive: "' + topic + '"\n\n' + (url || ''), facebook: 'Technical write-up: "' + topic + '"\n\n' + (url || ''), whatsapp: 'Tech article: "' + topic + '"\n\n' + (url || '') },
        story: { linkedin: 'The story behind "' + topic + '"...\n\nIt started with a problem. Here\'s how I built the solution.\n\n' + (url || ''), x: 'How I built "' + topic + '" — the story.\n\n' + (url || ''), facebook: 'The story behind "' + topic + '" — what I built, what broke.\n\n' + (url || ''), whatsapp: 'Story time: "' + topic + '"\n\n' + (url || '') }
      };
      var selected = tones[tone];
      var results = document.getElementById('socialResults');
      results.textContent = '';
      Object.keys(platforms).forEach(function (key) {
        var text = selected[key];
        var cardEl = el('div', 'post-card');
        var headEl = el('div', 'post-head');
        headEl.appendChild(el('span', 'post-name', platforms[key]));
        headEl.appendChild(el('span', 'post-count', text.length + ' chars'));
        cardEl.appendChild(headEl);
        var bodyEl = el('div', 'post-body', text);
        cardEl.appendChild(bodyEl);
        var actEl = el('div', 'post-actions');
        var copyBtn = el('button', null, 'Copy');
        copyBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(text).then(function () { window.__toast('Copied!'); }).catch(function () {});
        });
        actEl.appendChild(copyBtn);
        if (key === 'x') {
          var xA = el('a', null); xA.target = '_blank'; xA.rel = 'noopener';
          xA.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
          xA.appendChild(el('button', null, 'Post'));
          actEl.appendChild(xA);
        }
        if (key === 'whatsapp') {
          var wA = el('a', null); wA.target = '_blank'; wA.rel = 'noopener';
          wA.href = 'https://wa.me/?text=' + encodeURIComponent(text);
          wA.appendChild(el('button', null, 'Share'));
          actEl.appendChild(wA);
        }
        cardEl.appendChild(actEl);
        results.appendChild(cardEl);
      });
    });
  };

  sections.seo = function () {
    return '<div class="page-head"><h1>SEO</h1><p>Search optimization status.</p></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Score</div><div class="stat-val">92</div></div>' +
      '<div class="stat"><div class="stat-label">Pages</div><div class="stat-val">' + (14 + blogPosts.length) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Schemas</div><div class="stat-val">' + (12 + blogPosts.length) + '</div></div>' +
      '</div>' +
      '<div class="card"><h3>Checklist</h3>' +
      '<div class="check-item"><div class="check ok">✓</div>Canonical URLs on all pages</div>' +
      '<div class="check-item"><div class="check ok">✓</div>Open Graph + Twitter Card</div>' +
      '<div class="check-item"><div class="check ok">✓</div>JSON-LD structured data</div>' +
      '<div class="check-item"><div class="check ok">✓</div>Semantic HTML5</div>' +
      '<div class="check-item"><div class="check ok">✓</div>Mobile-first responsive</div>' +
      '<div class="check-item"><div class="check ok">✓</div>sitemap.xml + robots.txt</div>' +
      '<div class="check-item"><div class="check ok">✓</div>RSS feed</div>' +
      '<div class="check-item"><div class="check ok">✓</div>HTTPS enforced</div>' +
      '</div>' +
      '<div class="actions">' +
      '<a href="https://search.google.com/search-console" target="_blank" class="action"><span class="icon">🔍</span>Search Console</a>' +
      '<a href="/sitemap.xml" target="_blank" class="action"><span class="icon">🗺️</span>Sitemap</a>' +
      '<a href="/robots.txt" target="_blank" class="action"><span class="icon">🤖</span>Robots</a>' +
      '</div>';
  };

  sections.security = function () {
    var logins = getLogins();
    return '<div class="page-head"><h1>Security</h1><p>What this dashboard actually is — and its limits.</p></div>' +
      '<div class="card"><h3>Trust boundary (read this first)</h3>' +
      '<div class="check-item"><div class="check warn">!</div><div><strong>This is a client-side gate, not server-enforced authorization.</strong> All sign-in code (email allowlist, PBKDF2 verifier, TOTP derivation) ships to the browser. A visitor who modifies the page or storage can bypass the gate — so this dashboard holds no confidential records. See <a href="/trust-boundaries.html" target="_blank" style="color:var(--acc)">Trust Boundaries</a>.</div></div>' +
      '<div class="check-item"><div class="check warn">!</div><div><strong>TOTP is client-side too.</strong> The second factor derives from a seed in the deployed JavaScript — it deters casual access, it is not a second factor against a code-reading attacker.</div></div>' +
      '<div class="check-item"><div class="check warn">!</div><div><strong>Security headers are meta-tag only.</strong> GitHub Pages cannot set response headers; the CSP/nosniff/Referrer-Policy metas are best-effort, not equivalent.</div></div>' +
      '</div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="stat-label">Mode</div><div class="stat-val" style="font-size:1.1rem">' + (window.VNTrust ? window.VNTrust.mode : 'demo') + '</div></div>' +
      '<div class="stat"><div class="stat-label">Logins</div><div class="stat-val">' + logins.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Failed</div><div class="stat-val">' + logins.filter(function (l) { return !l.success; }).length + '</div></div>' +
      '<div class="stat"><div class="stat-label">Timeout</div><div class="stat-val">30m</div></div>' +
      '</div>' +
      '<div class="card"><h3>What does work</h3>' +
      '<div class="check-item"><div class="check ok">✓</div>Google ID tokens verified against Google\'s JWKS (signature, iss/aud/exp) — fails closed</div>' +
      '<div class="check-item"><div class="check ok">✓</div>PBKDF2 password fallback (100k iters, constant-time compare)</div>' +
      '<div class="check-item"><div class="check ok">✓</div>30-min idle timeout + noindex on private pages</div>' +
      '<div class="check-item"><div class="check ok">✓</div>Client workspace vault key held in memory only (never persisted)</div>' +
      '<div class="check-item"><div class="check ok">✓</div>Payment verification is an explicit owner action with an event ledger</div>' +
      '</div>' +
      '<div class="card"><h3>Login Log (this browser)</h3>' +
      (logins.length ? '<table class="tbl"><thead><tr><th>Email</th><th>Status</th><th>Time</th></tr></thead><tbody>' +
      logins.map(function (l) { return '<tr><td>' + esc2(l.email) + '</td><td><span class="badge ' + (l.success ? 'b-green' : 'b-red') + '">' + (l.success ? 'Success' : 'Failed') + '</span></td><td>' + esc2(new Date(l.timestamp).toLocaleString()) + '</td></tr>'; }).join('') +
      '</tbody></table>' : '<div class="empty">No logins logged.</div>') +
      '<button class="btn btn-ghost btn-sm" id="clearLogs" style="margin-top:0.75rem">Clear Logs</button></div>';
  };

  listeners.security = function () {
    document.getElementById('clearLogs').addEventListener('click', function () {
      VNAuth.clearLogs(); toast('Logs cleared.'); switchSection('security');
    });
  };

  sections.settings = function () {
    var user = VNAuth.getUser();
    var totpOn = !!(window.VNTotp && user && VNTotp.isEnrolled(user.email));
    return '<div class="page-head"><h1>Settings</h1><p>Account and configuration.</p></div>' +
      '<div class="card"><h3>Account</h3>' +
      '<div class="set-row"><span class="set-label">Name</span><span class="set-val">' + esc2(user ? user.name : '—') + '</span></div>' +
      '<div class="set-row"><span class="set-label">Email</span><span class="set-val">' + esc2(user ? user.email : '—') + '</span></div>' +
      '<div class="set-row"><span class="set-label">Two-factor (TOTP)</span><span class="set-val">' + (totpOn ? '✅ Enabled (Google Authenticator)' : 'Not enrolled on this browser') + ' <button class="btn btn-ghost btn-sm" id="resetTotp" style="margin-left:0.5rem">Reset</button></span></div>' +
      '</div>' +
      '<div class="card"><h3>Quick Links</h3><div class="actions">' +
      '<a href="https://github.com/gadda00/victor-portfolio" target="_blank" class="action"><span class="icon">🐙</span>GitHub</a>' +
      '<a href="https://search.google.com/search-console" target="_blank" class="action"><span class="icon">🔍</span>Search Console</a>' +
      '<a href="https://analytics.google.com" target="_blank" class="action"><span class="icon">📊</span>Analytics</a>' +
      '</div></div>' +
      '<div class="card danger"><h3 style="color:#ef4444">Danger Zone</h3>' +
      '<div class="set-row"><span class="set-label">Clear activity log</span><button class="btn btn-ghost btn-sm" id="clearActivity">Clear</button></div>' +
      '<div class="set-row"><span class="set-label">Export all data</span><button class="btn btn-ghost btn-sm" id="exportData">Export</button></div>' +
      '<div class="set-row"><span class="set-label">Sign out</span><button class="btn btn-ghost btn-sm" id="signOut2" style="color:#ef4444">Sign out</button></div>' +
      '</div>';
  };

  listeners.settings = function () {
    document.getElementById('clearActivity').addEventListener('click', function () { VNAuth.clearLogs(); toast('Activity cleared.'); });
    var resetBtn = document.getElementById('resetTotp');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (window.VNTotp) { VNTotp.reset(); toast('Two-factor enrollment cleared — you will be asked to enroll again on next sign-in.'); }
    });
    document.getElementById('exportData').addEventListener('click', function () {
      var data = {};
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('vn_') === 0) data[key] = localStorage.getItem(key);
      }
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'portfolio-data-' + Date.now() + '.json';
      a.click();
      toast('Data exported!');
    });
    document.getElementById('signOut2').addEventListener('click', function () { VNAuth.logout(); });
  };

  // v21: fail closed in production mode when the backend is not configured.
  if (window.VNTrust && !window.VNTrust.assertReady()) {
    // assertReady() has already replaced the page with a configuration error.
  } else {
    // Session restore (deferred — see note above; runs only after all renderers exist)
    if (window.VNAuth && VNAuth.checkSession()) showDashboard();
  }

  // Log access
  if (window.VNAuth) VNAuth.logActivity('dashboard', 'Accessed dashboard');
})();
