/* ═══════════════════════════════════════════════════════════════════
   Victor Ndunda — Client Portal UI v2.0 (v13 "Client Workspace")
   Renders on top of VNPortalCore: auth gate, overview, projects with
   7-stage pipeline, payments, retainer, messages, settings.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var C = window.VNPortalCore;
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Theme + nav bootstrap ─────────────────────────────────────── */
  var stored = localStorage.getItem('theme');
  var theme = stored || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
  var tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', function () {
    var cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var nxt = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.remove(cur);
    document.documentElement.classList.add(nxt);
    localStorage.setItem('theme', nxt);
  });
  var mt = $('#mobileToggle'), nl = $('#navLinks');
  if (mt && nl) mt.addEventListener('click', function () {
    nl.classList.toggle('open');
    mt.setAttribute('aria-expanded', nl.classList.contains('open') ? 'true' : 'false');
  });

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function fmtUSD(n) { return '$' + (n || 0).toLocaleString(); }
  function daysUntil(dateStr) {
    try { return Math.ceil((new Date(dateStr + 'T00:00:00') - Date.now()) / 86400000); } catch (e) { return 0; }
  }
  function toast(msg, type) {
    try { window.vnToast(msg, 3400); } catch (e) { /* palette not loaded */ }
  }

  /* ── Idle timeout ──────────────────────────────────────────────── */
  setInterval(function () {
    if (!C.isAuthed()) return;
    C.touchSession();
    // core restore handles expiry on reload; live expiry:
    try {
      var s = JSON.parse(sessionStorage.getItem('vn_portal_session') || 'null');
      if (s && Date.now() - s.lastActivity > C.SESSION_IDLE_MS) {
        C.logout();
        location.reload();
      }
    } catch (e) {}
  }, 60000);
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, function () { if (C.isAuthed()) C.touchSession(); }, { passive: true });
  });

  /* ═══ AUTH GATE ═════════════════════════════════════════════════ */
  function renderAuthGate() {
    var existingEmail = C.getAuthEmail();
    $('#authGate').style.display = 'flex';
    $('#portalApp').style.display = 'none';
    var mode = existingEmail ? 'login' : 'signup';

    function paint() {
      $('#authTitle').textContent = mode === 'login' ? 'Welcome back' : 'Create your workspace';
      $('#authSub').textContent = mode === 'login'
        ? 'Sign in to your encrypted project workspace.'
        : 'Your projects, contracts, payments and retainers — encrypted in your browser.';
      // hide signup-only fields AND drop their `required` flag — otherwise
      // invisible required inputs block constraint validation in login mode.
      ['authNameWrap', 'authCompanyWrap'].forEach(function (id) {
        var wrap = $('#' + id);
        var input = wrap.querySelector('input');
        wrap.style.display = mode === 'signup' ? 'block' : 'none';
        if (input) input.required = (mode === 'signup');
      });
      $('#authEmail').value = existingEmail || '';
      if (existingEmail) { $('#authEmail').readOnly = true; $('#authEmail').style.opacity = '0.7'; }
      $('#authSubmit').textContent = mode === 'login' ? 'Sign in to your workspace' : 'Create encrypted workspace';
      $('#authSwitchBtn').textContent = mode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in';
    }
    paint();

    $('#authSwitchBtn').onclick = function () {
      mode = mode === 'login' ? 'signup' : 'login';
      if (existingEmail) mode = 'login'; // this device already has an account
      $('#authError').style.display = 'none';
      paint();
    };

    $('#authForm').onsubmit = async function (ev) {
      ev.preventDefault();
      var btn = $('#authSubmit');
      var errBox = $('#authError');
      errBox.style.display = 'none';
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'Encrypting…';
      try {
        if (mode === 'login') {
          await C.login($('#authEmail').value.trim(), $('#authPassword').value, $('#authRemember').checked);
        } else {
          await C.signup($('#authName').value.trim(), $('#authEmail').value.trim(), $('#authCompany').value.trim(), $('#authPassword').value, $('#authRemember').checked);
        }
        enterApp();
      } catch (e) {
        errBox.textContent = e.message || 'Sign-in failed.';
        errBox.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    };
  }

  function enterApp() {
    $('#authGate').style.display = 'none';
    $('#portalApp').style.display = 'block';
    var p = C.profile();
    $('#portalHello').textContent = 'Welcome, ' + (p.name || 'client').split(' ')[0];
    $('#portalAvatar').textContent = (p.name || 'C').trim().charAt(0).toUpperCase();
    $('#portalEmail').textContent = p.email || '';
    C.migrateLegacyBriefs();
    go('overview');
  }

  /* ═══ APP NAV ═══════════════════════════════════════════════════ */
  var view = 'overview';
  var currentProject = null;

  function go(v, projectId) {
    view = v;
    if (projectId !== undefined) currentProject = projectId;
    $$('.portal-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.view === v); });
    var el = $('#portalView');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (v === 'overview') renderOverview(el);
    else if (v === 'projects') renderProjects(el);
    else if (v === 'project') renderProjectDetail(el);
    else if (v === 'payments') renderPayments(el);
    else if (v === 'retainer') renderRetainer(el);
    else if (v === 'messages') renderMessages(el);
    else if (v === 'settings') renderSettings(el);
  }
  window.__portalGo = go;

  $$('.portal-tab').forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.view); });
  });
  $('#portalLogout').addEventListener('click', function () {
    if (!confirm('Sign out of your workspace? Your data stays encrypted on this device.')) return;
    C.logout();
    location.reload();
  });

  /* ═══ OVERVIEW ══════════════════════════════════════════════════ */
  function allProjects() { return (C.vault() && C.vault().projects) || []; }

  function nextActions() {
    var acts = [];
    allProjects().forEach(function (p) {
      if (p.status === 'scoping' && (!p.payments || !p.payments.length)) {
        acts.push({ icon: '💳', text: 'Choose a payment plan for ' + p.packageName, cta: 'Set up payments', go: function () { go('project', p.id); setTimeout(function () { go('payments'); }, 50); } });
      }
      var np = C.nextPayment(p);
      if (np) {
        var d = daysUntil(np.dueDate);
        acts.push({
          icon: d < 0 ? '⚠️' : '📅',
          text: (d < 0 ? 'Overdue: ' : d < 7 ? 'Due in ' + d + 'd: ' : 'Upcoming: ') + np.label + ' — ' + fmtUSD(np.usd),
          cta: 'View', go: function () { go('payments'); }
        });
      }
      if (p.retainer && p.retainer.active) {
        var dl = C.retainerDaysLeft(p.retainer);
        if (dl !== null && dl <= 5) {
          acts.push({ icon: '🔁', text: 'Retainer renews in ' + dl + ' days — ' + fmtUSD(p.retainer.monthlyUsd) + '/mo', cta: 'Manage', go: function () { go('retainer'); } });
        }
      }
    });
    return acts;
  }

  function renderOverview(el) {
    var projects = allProjects();
    var active = projects.filter(function (p) { return p.status === 'active' || p.status === 'contracted'; });
    var paid = projects.reduce(function (a, p) { return a + C.totals(p).paidUsd; }, 0);
    var ret = projects.filter(function (p) { return p.retainer && p.retainer.active; });
    var acts = nextActions();

    el.innerHTML =
    '<div class="ov-grid">' +
      '<div class="ov-main">' +
        '<div class="ov-cards">' +
          '<div class="kpi-card"><div class="kpi-icon">🚀</div><div class="kpi-body"><div class="kpi-value">' + projects.length + '</div><div class="kpi-label">Projects</div></div></div>' +
          '<div class="kpi-card"><div class="kpi-icon">⚡</div><div class="kpi-body"><div class="kpi-value">' + active.length + '</div><div class="kpi-label">Active</div></div></div>' +
          '<div class="kpi-card"><div class="kpi-icon">💳</div><div class="kpi-body"><div class="kpi-value">' + fmtUSD(paid) + '</div><div class="kpi-label">Paid to date</div></div></div>' +
          '<div class="kpi-card"><div class="kpi-icon">🛡️</div><div class="kpi-body"><div class="kpi-value">' + ret.length + '</div><div class="kpi-label">Retainers</div></div></div>' +
        '</div>' +
        (acts.length
          ? '<div class="panel"><h3 class="panel-title">🎯 Next actions</h3>' + acts.map(function (a) {
              return '<div class="action-row"><span class="action-ic">' + a.icon + '</span><span class="action-tx">' + esc(a.text) + '</span><button class="btn btn-ghost btn-sm" data-act="' + esc(a.text) + '">Go →</button></div>';
            }).join('') + '</div>'
          : '') +
        '<div class="panel"><h3 class="panel-title">📁 Your projects</h3>' + projectsListHtml(projects) + '</div>' +
      '</div>' +
      '<aside class="ov-side">' +
        '<div class="panel panel-tint"><h3 class="panel-title">🔒 How your data is protected</h3>' +
          '<p class="mut">Everything here is <strong>encrypted in your browser</strong> (AES-256-GCM) with a key derived from your password. It never leaves this device in readable form — Victor only sees what you explicitly share or send.</p>' +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">🤝 Working with Victor</h3>' +
          '<ul class="side-list">' +
            '<li><strong>Response time:</strong> within 4 business hours</li>' +
            '<li><strong>Weekly demos</strong> during build stages</li>' +
            '<li><strong>30–90 days</strong> post-launch support included</li>' +
            '<li><strong>Retainers</strong> cancel with 30 days notice</li>' +
          '</ul>' +
          '<a class="btn btn-primary btn-sm full" href="#/messages" data-nav="messages">Message Victor</a>' +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">🚀 Start something new</h3>' +
          '<p class="mut">Scope a new AI project in 3 minutes with the wizard — it lands here automatically.</p>' +
          '<a class="btn btn-ghost btn-sm full" href="/services/wizard.html">Open the Scope Wizard</a>' +
        '</div>' +
      '</aside>' +
    '</div>';

    wireProjectsList(el);
    $$('[data-act]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = acts.find(function (x) { return x.text === b.dataset.act; });
        if (a) a.go();
      });
    });
    $$('[data-nav]', el).forEach(function (a) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); go(a.dataset.nav); });
    });
  }

  /* ═══ PROJECTS LIST ═════════════════════════════════════════════ */
  function statusBadge(st) {
    var map = {
      scoping: ['Scoping', 'gray'], contracted: ['Contracted', 'blue'],
      active: ['In build', 'yellow'], delivered: ['Delivered', 'green']
    };
    var m = map[st] || map.scoping;
    return '<span class="badge b-' + m[1] + '">' + m[0] + '</span>';
  }

  function projectsListHtml(projects) {
    if (!projects.length) {
      return '<div class="portal-empty"><h3>No projects yet</h3><p>Scope your AI project with the wizard — 6 questions, 3 minutes, instant estimate.</p><a href="/services/wizard.html" class="btn btn-primary">Start the Wizard →</a></div>';
    }
    return projects.slice().reverse().map(function (p) {
      var pct = C.progress(p);
      var t = C.totals(p);
      var icons = { audit: '🔍', starter: '🚀', growth: '📈', enterprise: '🏢' };
      return '<button class="proj-card" data-id="' + p.id + '">' +
        statusBadge(p.status) +
        '<div class="proj-head"><span class="proj-ic">' + (icons[p.packageId] || '📋') + '</span>' +
        '<div><div class="proj-name">' + esc(p.name) + '</div>' +
        '<div class="proj-sub">' + esc(p.packageName) + ' · ' + fmtDate(p.createdAt) + '</div></div></div>' +
        '<div class="prog-row"><div class="prog-bar"><i style="width:' + pct + '%"></i></div><span class="prog-tx">' + pct + '%</span></div>' +
        '<div class="proj-meta"><span>' + fmtUSD(t.paidUsd) + ' of ' + fmtUSD(t.totalUsd) + ' paid</span>' +
        (p.retainer && p.retainer.active ? '<span class="tag tag-green">Retainer ' + fmtUSD(p.retainer.monthlyUsd) + '/mo</span>' : '') + '</div>' +
      '</button>';
    }).join('');
  }

  function wireProjectsList(scope) {
    $$('.proj-card', scope).forEach(function (card) {
      card.addEventListener('click', function () { go('project', card.dataset.id); });
    });
  }

  function renderProjects(el) {
    var projects = allProjects();
    el.innerHTML =
      '<div class="page-head"><h2>Your projects</h2><p>Every engagement, from scoping to support. Click a project to open its full pipeline.</p></div>' +
      '<div class="panel">' + projectsListHtml(projects) + '</div>';
    wireProjectsList(el);
  }

  /* ═══ PROJECT DETAIL ════════════════════════════════════════════ */
  function renderProjectDetail(el) {
    var p = C.getProject(currentProject);
    if (!p) { go('projects'); return; }
    var pct = C.progress(p);
    var t = C.totals(p);
    var stagesHtml = C.STAGES.map(function (s) {
      var st = (p.stages || []).find(function (x) { return x.id === s.id; }) || { status: 'pending' };
      var cls = st.status === 'done' ? 'done' : st.status === 'active' ? 'active' : '';
      return '<div class="stage ' + cls + '">' +
        '<div class="stage-dot">' + (st.status === 'done' ? '✓' : s.icon) + '</div>' +
        '<div class="stage-body"><div class="stage-label">' + s.label + '</div>' +
        '<div class="stage-desc">' + s.desc + (st.note ? ' · <em>' + esc(st.note) + '</em>' : '') + '</div>' +
        (st.doneAt ? '<div class="stage-date">Completed ' + fmtDate(st.doneAt) + '</div>' : '') +
        '</div></div>';
    }).join('');

    var paysHtml = (p.payments || []).map(function (x) {
      return '<div class="pay-row' + (x.status === 'paid' ? ' paid' : '') + '">' +
        '<div class="pay-l"><div class="pay-label">' + esc(x.label) + '</div><div class="pay-due">Due ' + fmtDate(x.dueDate) + (x.ref ? ' · ref ' + esc(x.ref) : '') + '</div></div>' +
        '<div class="pay-amt">' + fmtUSD(x.usd) + '<span class="pay-kes">KES ' + (x.kes || 0).toLocaleString() + '</span></div>' +
        '<span class="badge ' + (x.status === 'paid' ? 'b-green' : x.status === 'sent' ? 'b-blue' : 'b-yellow') + '">' + (x.status === 'paid' ? 'Paid' : 'Due') + '</span>' +
      '</div>';
    }).join('') || '<p class="mut">No payment plan yet — choose one to activate the contract stage.</p>';

    var docsHtml = (p.documents || []).map(function (d) {
      var icons = { contract: '📝', invoice: '🧾', proposal: '📄' };
      return '<div class="doc-row"><span>' + (icons[d.type] || '📄') + '</span><div><strong>' + esc(d.type) + '</strong><div class="mut">' + esc(d.summary || '') + ' · ' + fmtDate(d.createdAt) + '</div></div></div>';
    }).join('') || '<p class="mut">Documents you generate (contracts, invoices, proposals) will be listed here.</p>';

    var actsHtml = (p.activity || []).slice().reverse().map(function (a) {
      return '<div class="act-row"><div class="act-dot"></div><div><div>' + esc(a.text) + '</div><div class="mut">' + fmtDate(a.at) + '</div></div></div>';
    }).join('');

    el.innerHTML =
    '<button class="btn btn-ghost btn-sm" id="projBack">← All projects</button>' +
    '<div class="page-head"><h2>' + esc(p.name) + '</h2><p>' + esc(p.packageName) + ' · ' + statusBadge(p.status) + ' · Started ' + fmtDate(p.createdAt) + '</p></div>' +

    '<div class="ov-grid">' +
      '<div class="ov-main">' +
        '<div class="panel"><div class="panel-title-row"><h3 class="panel-title">Delivery pipeline</h3><span class="prog-big">' + pct + '%</span></div>' +
          '<div class="prog-bar big"><i style="width:' + pct + '%"></i></div>' +
          '<div class="stages">' + stagesHtml + '</div>' +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">💳 Payments</h3>' + paysHtml +
          (!p.payments || !p.payments.length ? '<button class="btn btn-primary btn-sm" id="choosePlanBtn">Choose a payment plan</button>' : '') +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">📄 Documents</h3>' + docsHtml +
          '<div class="doc-actions">' +
            '<a class="btn btn-ghost btn-sm" href="/services/contract.html?brief=' + (p.briefId || '') + '">Generate contract</a>' +
            '<a class="btn btn-ghost btn-sm" href="/services/invoice.html?brief=' + (p.briefId || '') + '">Generate invoice</a>' +
            '<a class="btn btn-ghost btn-sm" href="/services/proposal.html?brief=' + (p.briefId || '') + '">Generate proposal</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<aside class="ov-side">' +
        '<div class="panel panel-tint"><h3 class="panel-title">Share with Victor</h3>' +
          '<p class="mut">Send Victor a live snapshot of this project — payments, stages and documents — so he can import it into his dashboard.</p>' +
          '<button class="btn btn-primary btn-sm full" id="shareBtn">Generate share code</button>' +
          '<textarea id="shareOut" class="share-out" readonly style="display:none" aria-label="Share code"></textarea>' +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">📈 Financial summary</h3>' +
          '<ul class="side-list">' +
            '<li><strong>Paid:</strong> ' + fmtUSD(t.paidUsd) + ' (' + t.pct + '%)</li>' +
            '<li><strong>Outstanding:</strong> ' + fmtUSD(t.dueUsd) + '</li>' +
            '<li><strong>Contract value:</strong> ' + fmtUSD(t.totalUsd) + '</li>' +
            (p.retainer ? '<li><strong>Retainer:</strong> ' + (p.retainer.active ? fmtUSD(p.retainer.monthlyUsd) + '/mo — renews ' + fmtDate(p.retainer.nextRenewal) : 'cancelled') + '</li>' : '') +
          '</ul>' +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">🕓 Activity</h3>' + (actsHtml || '<p class="mut">No activity yet.</p>') + '</div>' +
      '</aside>' +
    '</div>';

    $('#projBack').onclick = function () { go('projects'); };
    var cp = $('#choosePlanBtn');
    if (cp) cp.onclick = function () { go('payments'); };
    $('#shareBtn').onclick = function () {
      var code = C.makeShareCode(p.id);
      var out = $('#shareOut');
      out.style.display = 'block';
      out.value = code;
      out.select();
      try { document.execCommand('copy'); } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(function () {});
      toast('Share code copied — paste it to Victor on WhatsApp or email');
    };
    $$('a[href*="brief="]', el).forEach(function (a) {
      a.addEventListener('click', function () {
        try { C.recordDocument(p, a.textContent.toLowerCase().indexOf('contract') > -1 ? 'contract' : a.textContent.toLowerCase().indexOf('invoice') > -1 ? 'invoice' : 'proposal', 'Generated from portal'); } catch (e) {}
      });
    });
  }

  /* ═══ PAYMENTS ══════════════════════════════════════════════════ */
  var PLAN_OPTS = [
    { id: 'fifty-fifty', name: '50 / 50', desc: 'Half now, half on delivery. Simple and predictable.', badge: 'Most popular' },
    { id: 'milestone', name: 'Milestone-based', desc: '30% kickoff, 40% midpoint, 30% delivery. Pay as you see progress.' },
    { id: 'monthly', name: 'Build + Monthly', desc: 'One-time build, then a monthly retainer with support.' }
  ];

  function renderPayments(el) {
    var projects = allProjects();
    var withPlans = projects.filter(function (p) { return p.payments && p.payments.length; });
    var without = projects.filter(function (p) { return !p.payments || !p.payments.length; });

    var totalPaid = projects.reduce(function (a, p) { return a + C.totals(p).paidUsd; }, 0);
    var totalDue = projects.reduce(function (a, p) { return a + C.totals(p).dueUsd; }, 0);

    var plansHtml = '';
    if (without.length) {
      plansHtml = '<div class="panel"><h3 class="panel-title">1 · Choose a payment plan</h3>' +
        '<div class="plan-picker">' + without.map(function (p, pi) {
          return '<div class="plan-group' + (without.length > 1 ? '' : ' single') + '"><div class="plan-group-title">' + esc(p.packageName) + ' — ' + fmtUSD(p.estimate.totalUsd) + '</div>' +
            PLAN_OPTS.map(function (o, i) {
              return '<button class="payment-plan' + (i === 0 ? ' selected' : '') + '" data-proj="' + p.id + '" data-plan="' + o.id + '">' +
                (o.badge ? '<span class="payment-plan-badge">' + o.badge + '</span>' : '') +
                '<div class="payment-plan-name">' + o.name + '</div>' +
                '<div class="payment-plan-desc">' + o.desc + '</div>' +
              '</button>';
            }).join('') + '</div>';
        }).join('') + '</div></div>';
    }

    var scheduleHtml = withPlans.map(function (p) {
      var t = C.totals(p);
      return '<div class="panel"><div class="panel-title-row"><h3 class="panel-title">' + esc(p.name) + '</h3><span class="tag">' + t.pct + '% paid</span></div>' +
        '<div class="prog-bar"><i style="width:' + t.pct + '%"></i></div>' +
        (p.payments || []).map(function (x) {
          var d = daysUntil(x.dueDate);
          var overdue = x.status !== 'paid' && d < 0;
          return '<div class="pay-row' + (x.status === 'paid' ? ' paid' : overdue ? ' overdue' : '') + '">' +
            '<div class="pay-l"><div class="pay-label">' + esc(x.label) + (overdue ? ' <span class="tag tag-red">overdue ' + Math.abs(d) + 'd</span>' : '') + '</div>' +
            '<div class="pay-due">Due ' + fmtDate(x.dueDate) + (x.ref ? ' · ref ' + esc(x.ref) : '') + '</div></div>' +
            '<div class="pay-amt">' + fmtUSD(x.usd) + '<span class="pay-kes">KES ' + (x.kes || 0).toLocaleString() + '</span></div>' +
            (x.status === 'paid'
              ? '<span class="badge b-green">Paid</span>'
              : '<button class="btn btn-primary btn-sm" data-pay-proj="' + p.id + '" data-pay-n="' + x.n + '">Mark paid</button>') +
          '</div>';
        }).join('') + '</div>';
    }).join('');

    el.innerHTML =
      '<div class="page-head"><h2>Payments</h2><p>Plans, installments and receipts — with M-Pesa, card and bank options.</p></div>' +
      '<div class="ov-cards">' +
        '<div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-body"><div class="kpi-value">' + fmtUSD(totalPaid) + '</div><div class="kpi-label">Paid to date</div></div></div>' +
        '<div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-body"><div class="kpi-value">' + fmtUSD(totalDue) + '</div><div class="kpi-label">Outstanding</div></div></div>' +
      '</div>' +
      plansHtml +
      (scheduleHtml ? '<h3 class="section-title">Your payment schedule</h3>' + scheduleHtml : '') +
      '<div class="panel"><h3 class="panel-title">💳 How to pay</h3>' +
        '<div class="pay-methods">' +
          '<div class="pay-method"><div class="pm-ic">📱</div><div><strong>M-Pesa (Kenya)</strong><div class="mut">Paybill <code class="copyable" data-copy="4071186">4071186</code> · Account <code>VND-' + esc((currentProject || 'X').slice(-4)) + '</code></div></div></div>' +
          '<div class="pay-method"><div class="pm-ic">🌍</div><div><strong>Card / International</strong><div class="mut">Stripe or Flutterwave payment link — request one below and Victor sends it within 4 business hours.</div></div></div>' +
          '<div class="pay-method"><div class="pm-ic">🏦</div><div><strong>Bank transfer</strong><div class="mut">USD & KES accounts available on request.</div></div></div>' +
        '</div>' +
      '</div>';

    // plan selection
    $$('.plan-group .payment-plan', el).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grp = btn.closest('.plan-group');
        $$('.payment-plan', grp).forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        var p = C.getProject(btn.dataset.proj);
        if (p) {
          C.buildPaymentPlan(p, btn.dataset.plan);
          toast('Payment plan saved — ' + p.payments.length + ' installments created');
          renderPayments(el);
        }
      });
    });

    // mark paid flow
    $$('[data-pay-proj]', el).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = C.getProject(btn.dataset.payProj);
        var n = parseInt(btn.dataset.payN, 10);
        var pay = (p.payments || []).find(function (x) { return x.n === n; });
        if (!p || !pay) return;
        openMarkPaidModal(p, pay, function () { renderPayments(el); });
      });
    });

    $$('.copyable', el).forEach(function (c) {
      c.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(c.dataset.copy).catch(function () {});
        toast('Copied: ' + c.dataset.copy);
      });
    });
  }

  function openMarkPaidModal(p, pay, onDone) {
    var overlay = document.createElement('div');
    overlay.className = 'pm-modal';
    overlay.innerHTML =
      '<div class="pm-box" role="dialog" aria-modal="true" aria-label="Confirm payment">' +
        '<h3>Confirm payment — ' + esc(pay.label) + '</h3>' +
        '<p class="mut">' + esc(p.name) + ' · ' + fmtUSD(pay.usd) + ' / KES ' + (pay.kes || 0).toLocaleString() + '</p>' +
        '<label class="fld"><span>Payment method</span>' +
          '<select id="pmMethod"><option value="mpesa">M-Pesa</option><option value="card">Card / Stripe</option><option value="flutterwave">Flutterwave</option><option value="bank">Bank transfer</option></select></label>' +
        '<label class="fld"><span>Transaction reference (M-Pesa code / receipt #)</span>' +
          '<input id="pmRef" placeholder="e.g. QGH7X2LM9P" autocomplete="off" /></label>' +
        '<p class="mut small">Victor is notified instantly to verify and issue your receipt.</p>' +
        '<div class="pm-actions"><button class="btn btn-ghost btn-sm" id="pmCancel">Cancel</button>' +
        '<button class="btn btn-primary btn-sm" id="pmConfirm">Confirm payment</button></div>' +
      '</div>';
    document.body.appendChild(overlay);
    $('#pmCancel').onclick = function () { overlay.remove(); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    $('#pmConfirm').onclick = function () {
      C.markPaymentPaid(p, pay.n, $('#pmMethod').value, $('#pmRef').value);
      overlay.remove();
      toast('Payment recorded — receipt request sent to Victor');
      if (onDone) onDone();
    };
    setTimeout(function () { $('#pmRef').focus(); }, 50);
  }

  /* ═══ RETAINER (after-sales) ════════════════════════════════════ */
  function renderRetainer(el) {
    var projects = allProjects();
    var withRet = projects.filter(function (p) { return p.retainer; });

    if (!withRet.length) {
      el.innerHTML =
        '<div class="page-head"><h2>Retainer & after-sales</h2><p>Ongoing support, monitoring and iteration after launch.</p></div>' +
        '<div class="panel panel-tint"><h3 class="panel-title">No active retainer</h3>' +
        '<p class="mut">Every build includes 30–90 days of post-launch support. A retainer extends that: monitoring, monthly enhancements, analytics reviews, priority support (4-hour response), and quarterly strategy sessions.</p>' +
        '<div class="retainer-benefits">' +
          '<div class="rb"><strong>💳 Predictable</strong><span>Flat monthly — cancel with 30 days notice</span></div>' +
          '<div class="rb"><strong>⚡ Priority</strong><span>4-hour response, business hours</span></div>' +
          '<div class="rb"><strong>📈 Growth</strong><span>Monthly feature releases + analytics review</span></div>' +
        '</div>' +
        '<button class="btn btn-primary" id="startRetBtn">Add a retainer to a project</button></div>';
      var sb = $('#startRetBtn');
      if (sb) sb.onclick = function () { go('payments'); };
      return;
    }

    el.innerHTML =
      '<div class="page-head"><h2>Retainer & after-sales</h2><p>Your ongoing partnership with Victor — support, monitoring, iteration.</p></div>' +
      withRet.map(function (p) {
        var r = p.retainer;
        var dl = C.retainerDaysLeft(r);
        var active = r.active;
        return '<div class="panel ret-card' + (active ? '' : ' ret-off') + '">' +
          '<div class="ret-head"><div><h3>' + esc(p.name) + '</h3>' +
          '<p class="mut">' + (active ? 'Active since ' + fmtDate(r.startedAt) : 'Cancelled ' + fmtDate(r.cancelledAt)) + '</p></div>' +
          '<div class="ret-price">' + fmtUSD(r.monthlyUsd) + '<span>/mo</span></div></div>' +
          (active ?
            '<div class="ret-countdown"><div class="ret-days">' + (dl !== null && dl >= 0 ? dl : 0) + '</div><div class="ret-cd-label">days until renewal<br><strong>' + fmtDate(r.nextRenewal) + '</strong></div></div>'
            : '<p class="mut">Retainer ended. Reactivate anytime — Victor keeps your context.</p>') +
          '<div class="ret-stats">' +
            '<div><strong>' + (r.requestsThisCycle || 0) + '</strong><span>requests this cycle</span></div>' +
            '<div><strong>4h</strong><span>response SLA</span></div>' +
            '<div><strong>' + fmtUSD(r.monthlyUsd) + '</strong><span>per cycle</span></div>' +
          '</div>' +
          (active ?
            '<div class="ret-actions">' +
              '<button class="btn btn-primary btn-sm" data-req="' + p.id + '">Log a support request</button>' +
              '<button class="btn btn-ghost btn-sm" data-cancel="' + p.id + '">Pause / cancel (30-day notice)</button>' +
            '</div>' : '') +
        '</div>';
      }).join('') +
      '<div class="panel"><h3 class="panel-title">What your retainer covers</h3>' +
        '<div class="retainer-benefits">' +
          '<div class="rb"><strong>🩺 Monitoring</strong><span>Uptime, accuracy and cost tracking</span></div>' +
          '<div class="rb"><strong>🔧 Enhancements</strong><span>Monthly feature / prompt releases</span></div>' +
          '<div class="rb"><strong>📊 Analytics</strong><span>Monthly performance review call</span></div>' +
          '<div class="rb"><strong>🚑 Priority support</strong><span>4-hour response, business hours</span></div>' +
          '<div class="rb"><strong>🧭 Strategy</strong><span>Quarterly roadmap session</span></div>' +
          '<div class="rb"><strong>🎓 Training</strong><span>Team refreshers as you scale</span></div>' +
        '</div>' +
      '</div>';

    $$('[data-req]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = C.getProject(b.dataset.req);
        var summary = prompt('Describe your support request (one line):', '');
        if (summary === null) return;
        C.logRetainerRequest(p, summary || 'Support request');
        toast('Request logged — Victor responds within 4 business hours');
        renderRetainer(el);
      });
    });
    $$('[data-cancel]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = C.getProject(b.dataset.cancel);
        if (!confirm('Cancel the retainer for ' + p.name + '?\n\n30 days notice applies — you keep full support until ' + new Date(Date.now() + 30 * 86400000).toLocaleDateString() + '.')) return;
        var reason = prompt('Optional — anything Victor should know?', '') || '';
        C.cancelRetainer(p, reason);
        toast('Cancellation notice sent to Victor');
        renderRetainer(el);
      });
    });
  }

  /* ═══ MESSAGES ══════════════════════════════════════════════════ */
  function renderMessages(el) {
    var projects = allProjects();
    if (!projects.length) {
      el.innerHTML = '<div class="page-head"><h2>Messages</h2><p>Direct line to Victor — 4-hour business-hours response.</p></div>' +
        '<div class="portal-empty"><h3>No projects yet</h3><p>Create a project first, then message Victor from its context.</p><a href="/services/wizard.html" class="btn btn-primary">Start the Wizard →</a></div>';
      return;
    }
    var pid = currentProject && C.getProject(currentProject) ? currentProject : projects[projects.length - 1].id;
    var p = C.getProject(pid);

    var thread = (p.messages || []).slice().reverse().map(function (m) {
      return '<div class="msg me"><div class="msg-b">' + esc(m.text) + '</div><div class="msg-t">' + fmtDate(m.at) + '</div></div>';
    }).join('');

    el.innerHTML =
      '<div class="page-head"><h2>Messages</h2><p>Direct line to Victor — replies land in his inbox instantly; he responds within 4 business hours.</p></div>' +
      '<div class="ov-grid">' +
        '<div class="ov-main panel msg-panel">' +
          '<div class="panel-title-row"><h3 class="panel-title">💬 ' + esc(p.name) + '</h3>' +
          '<select id="msgProject" class="msg-select" aria-label="Project">' +
            projects.map(function (x) { return '<option value="' + x.id + '"' + (x.id === pid ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="msg-thread" id="msgThread">' + (thread || '<div class="msg-empty">No messages yet — say hello 👋</div>') + '</div>' +
          '<form id="msgForm" class="msg-form">' +
            '<textarea id="msgText" placeholder="Write to Victor…" rows="3" required></textarea>' +
            '<button class="btn btn-primary btn-sm" type="submit">Send →</button>' +
          '</form>' +
        '</div>' +
        '<aside class="ov-side">' +
          '<div class="panel panel-tint"><h3 class="panel-title">⚡ Response standards</h3>' +
          '<ul class="side-list"><li><strong>4 business hours</strong> — first response</li><li><strong>24 hours</strong> — status updates during build</li><li><strong>1 hour</strong> — critical production issues (retainer SLA)</li></ul></div>' +
          '<div class="panel"><h3 class="panel-title">📞 Other channels</h3>' +
          '<ul class="side-list"><li><a href="https://wa.me/254724346971" target="_blank" rel="noopener">WhatsApp — quick questions</a></li>' +
          '<li><a href="mailto:mututandunda@gmail.com">Email — mututandunda@gmail.com</a></li>' +
          '<li><a href="/book/">Book a call — 30 min, free</a></li></ul></div>' +
        '</aside>' +
      '</div>';

    $('#msgProject').onchange = function () { currentProject = this.value; renderMessages(el); };
    $('#msgForm').onsubmit = function (ev) {
      ev.preventDefault();
      var txt = $('#msgText').value.trim();
      if (!txt) return;
      C.addMessage(p, txt);
      $('#msgText').value = '';
      toast('Message sent — Victor will reply within 4 business hours');
      renderMessages(el);
    };
  }

  /* ═══ SETTINGS ══════════════════════════════════════════════════ */
  function renderSettings(el) {
    var prof = C.profile();
    el.innerHTML =
      '<div class="page-head"><h2>Settings</h2><p>Profile, security and data control.</p></div>' +
      '<div class="ov-grid"><div class="ov-main">' +
        '<div class="panel"><h3 class="panel-title">👤 Profile</h3>' +
          '<div class="set-grid">' +
            '<div class="set-row"><span class="mut">Name</span><strong>' + esc(prof.name) + '</strong></div>' +
            '<div class="set-row"><span class="mut">Email</span><strong>' + esc(prof.email) + '</strong></div>' +
            '<div class="set-row"><span class="mut">Company</span><strong>' + esc(prof.company || '—') + '</strong></div>' +
            '<div class="set-row"><span class="mut">Member since</span><strong>' + fmtDate(prof.createdAt) + '</strong></div>' +
          '</div>' +
        '</div>' +
        '<div class="panel"><h3 class="panel-title">🔐 Security</h3>' +
          '<p class="mut small">Vault: AES-256-GCM · Key derivation: PBKDF2-SHA256, ' + C.PBKDF2_ITERS.toLocaleString() + ' iterations · Idle timeout: 30 min · Remember-me: 7 days</p>' +
          '<form id="pwForm" class="pw-form">' +
            '<input type="password" id="pwCur" placeholder="Current password" autocomplete="current-password" required />' +
            '<input type="password" id="pwNew" placeholder="New password (min 8 chars)" autocomplete="new-password" required minlength="8" />' +
            '<button class="btn btn-primary btn-sm" type="submit">Change password</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<aside class="ov-side">' +
        '<div class="panel"><h3 class="panel-title">📦 Your data</h3>' +
          '<p class="mut small">All data lives encrypted in this browser only. Back it up before switching devices or clearing browser data.</p>' +
          '<button class="btn btn-ghost btn-sm full" id="expBtn">⬇ Export encrypted backup</button>' +
          '<button class="btn btn-ghost btn-sm full danger" id="delBtn">🗑 Delete account & data</button>' +
        '</div>' +
        '<div class="panel panel-tint"><h3 class="panel-title">❓ How encryption works</h3>' +
          '<p class="mut small">Your password never leaves this device. It derives two independent keys via PBKDF2: one verifies login, the other encrypts your vault. Not even a stolen browser database can read your projects.</p>' +
        '</div>' +
      '</aside></div>';

    $('#pwForm').onsubmit = async function (ev) {
      ev.preventDefault();
      var btn = ev.target.querySelector('button');
      btn.disabled = true; btn.textContent = 'Re-encrypting…';
      try {
        await C.changePassword($('#pwCur').value, $('#pwNew').value);
        toast('Password changed — vault re-encrypted');
        $('#pwForm').reset();
      } catch (e) { toast(e.message, 'error'); }
      btn.disabled = false; btn.textContent = 'Change password';
    };
    $('#expBtn').onclick = function () {
      var data = C.exportBackup();
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'victor-portal-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    };
    $('#delBtn').onclick = function () {
      if (!confirm('Delete your account and ALL encrypted data on this device? This cannot be undone.')) return;
      if (!confirm('Final confirmation — really delete everything?')) return;
      C.deleteAccount();
      location.reload();
    };
  }

  /* ═══ BOOTSTRAP ═════════════════════════════════════════════════ */
  async function boot() {
    var ok = false;
    try { ok = await C.restoreSession(); } catch (e) { ok = false; }
    if (ok && C.isAuthed()) enterApp();
    else renderAuthGate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
