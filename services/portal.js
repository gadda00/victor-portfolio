/* Victor Ndunda — Client Portal JS
   - Renders briefs from localStorage('vn_client_briefs')
   - KPI counters
   - Export/clear data
   - Status tracking
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'vn_client_briefs';

  function $(s) { return document.querySelector(s); }

  // ── Theme bootstrap ───────────────────────────────────────────────
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
  var mt = $('#mobileToggle');
  var nl = $('#navLinks');
  if (mt && nl) mt.addEventListener('click', function () {
    nl.classList.toggle('open');
    mt.setAttribute('aria-expanded', nl.classList.contains('open') ? 'true' : 'false');
  });

  // ── Get briefs ────────────────────────────────────────────────────
  function getBriefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  // ── Format ────────────────────────────────────────────────────────
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return ''; }
  }
  function fmtMoney(usd, kes) {
    return '$' + (usd || 0).toLocaleString() + ' · KES ' + (kes || 0).toLocaleString();
  }

  // ── Status badge ──────────────────────────────────────────────────
  function statusBadge(brief) {
    var status = brief.status || 'draft';
    var labels = { draft: 'Draft', contracted: 'Contracted', 'in-progress': 'In Progress', delivered: 'Delivered' };
    return '<span class="brief-card-status ' + status + '">' + (labels[status] || 'Draft') + '</span>';
  }

  // ── Render briefs ─────────────────────────────────────────────────
  function renderBriefs() {
    var briefs = getBriefs();
    var container = $('#briefsList');

    // Update KPIs
    $('#kpiBriefs').textContent = String(briefs.length);
    var contracted = briefs.filter(function (b) { return b.status && b.status !== 'draft'; }).length;
    $('#kpiContracts').textContent = String(contracted);
    $('#kpiPayments').textContent = String(briefs.filter(function (b) { return b.paymentStatus; }).length);
    $('#kpiActive').textContent = String(briefs.filter(function (b) { return b.status === 'in-progress'; }).length);

    if (briefs.length === 0) {
      container.innerHTML =
        '<div class="portal-empty">' +
          '<h3>No briefs yet</h3>' +
          '<p>Start by scoping your AI project with the wizard. It takes 3 minutes.</p>' +
          '<a href="/services/wizard.html" class="btn btn-primary">Start the Wizard →</a>' +
        '</div>';
      return;
    }

    // Show most recent first
    var sorted = briefs.slice().reverse();
    container.innerHTML = sorted.map(function (b) {
      var est = b.estimate || {};
      var details = b.details || {};
      var state = b.state || {};
      var recom = b.recommendation || {};
      var pkgIcons = { audit: '🔍', starter: '🚀', growth: '📈', enterprise: '🏢' };
      var pkgIcon = pkgIcons[est.packageId] || '📋';

      return '<div class="brief-card">' +
        statusBadge(b) +
        '<div class="brief-card-head">' +
          '<div class="brief-card-pkg">' + pkgIcon + ' ' + (est.packageName || 'Package') + '</div>' +
          '<div class="brief-card-date">' + fmtDate(b.createdAt) + '</div>' +
        '</div>' +
        '<div class="brief-card-name">' + (details.name || 'Anonymous') + '</div>' +
        '<div class="brief-card-company">' + (details.company || details.email || 'No company') + '</div>' +
        '<div class="brief-card-est">' +
          '<div class="brief-card-est-label">Estimate</div>' +
          '<div class="brief-card-est-value">' + fmtMoney(est.totalUsd, est.totalKes) + '</div>' +
        '</div>' +
        '<div class="brief-card-meta">' +
          (state.goal ? '<span class="brief-tag">Goal: ' + state.goal + '</span>' : '') +
          (state.scale ? '<span class="brief-tag">Scale: ' + state.scale + '</span>' : '') +
          (state.timeline ? '<span class="brief-tag">Timeline: ' + state.timeline + '</span>' : '') +
          (state.types && state.types.length ? '<span class="brief-tag">' + state.types.length + ' AI types</span>' : '') +
        '</div>' +
        '<div class="brief-card-actions">' +
          '<a href="/services/contract.html?brief=' + b.id + '" class="btn btn-primary btn-sm">Contract</a>' +
          '<a href="/services/payment.html?brief=' + b.id + '" class="btn btn-ghost btn-sm">Payment</a>' +
          '<button class="btn btn-ghost btn-sm" data-action="delete" data-id="' + b.id + '">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Wire delete buttons
    container.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete this brief? This cannot be undone.')) return;
        var id = btn.getAttribute('data-id');
        var arr = getBriefs().filter(function (b) { return b.id !== id; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        renderBriefs();
      });
    });
  }

  // ── Export / clear ────────────────────────────────────────────────
  $('#exportData').addEventListener('click', function () {
    var data = {
      exportedAt: new Date().toISOString(),
      briefs: getBriefs()
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'victor-ndunda-portal-backup-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  $('#clearData').addEventListener('click', function () {
    if (!confirm('Clear ALL data? This removes every brief, contract, and payment record from your browser.')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderBriefs();
  });

  // ── Init ──────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBriefs);
  } else {
    renderBriefs();
  }
})();
