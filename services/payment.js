/* Victor Ndunda — Payment page JS (v21 trust hardening)
   - Reads brief from localStorage
   - Renders payment plan options (50/50, milestone, monthly)
   - Renders payment methods with HONEST labels: M-Pesa is a manual
     Paybill instruction; Flutterwave/Stripe are placeholders (no
     provider is connected — see /trust-boundaries.html)
   - DOM-safe rendering: every user-controlled value (package name,
     client name, timeline, brief id) goes through textContent, never
     string-concatenated HTML. Links are built with sanitized ids only.
*/
(function () {
  'use strict';

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }

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

  // ── Helpers ───────────────────────────────────────────────────────
  function getBriefs() {
    try {
      var raw = localStorage.getItem('vn_client_briefs');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function getBrief(id) {
    return getBriefs().find(function (b) { return b.id === id; });
  }
  function saveBrief(brief) {
    var all = getBriefs();
    var idx = all.findIndex(function (b) { return b.id === brief.id; });
    if (idx >= 0) { all[idx] = brief; localStorage.setItem('vn_client_briefs', JSON.stringify(all)); }
  }
  function fmtMoney(usd, kes) {
    return '$' + (usd || 0).toLocaleString() + ' · KES ' + (kes || 0).toLocaleString();
  }
  /* The contract id is derived from the brief id, which is user-controlled
     data — strip it to [A-Za-z0-9-] before it touches any URL. */
  function safeContractId(brief) {
    var raw = String((brief && brief.id) || Date.now()).replace(/[^A-Za-z0-9-]/g, '');
    return 'VND-' + raw.slice(-8).toUpperCase();
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ── Payment methods (labels are honest about what is connected) ──
  var METHODS = [
    {
      id: 'mpesa',
      icon: '📱',
      name: 'M-Pesa (Kenya)',
      mode: 'manual',
      desc: 'Pay via M-Pesa Paybill, then report the code in your client workspace. Reconciled manually by Victor.',
      details: [
        { label: 'Paybill', value: '4071186' },
        { label: 'Account', value: '{contractId}' },
        { label: 'Name', value: 'Victor Ndunda' }
      ],
      cta: 'Send money via M-Pesa'
    },
    {
      id: 'flutterwave',
      icon: '💳',
      name: 'Flutterwave',
      mode: 'placeholder',
      desc: 'Card, bank transfer and mobile money across Africa. Placeholder — no Flutterwave integration is connected yet.',
      details: [
        { label: 'Status', value: 'Not connected — request a link by email' }
      ],
      cta: 'Request a payment link'
    },
    {
      id: 'stripe',
      icon: '🌍',
      name: 'Stripe (International)',
      mode: 'placeholder',
      desc: 'For international clients — cards and wallets. Placeholder — no Stripe integration is connected yet.',
      details: [
        { label: 'Status', value: 'Not connected — request a link by email' }
      ],
      cta: 'Request a payment link'
    }
  ];
  var MODE_BADGE = {
    manual: { cls: 'pm-mode pm-mode-manual', text: 'manual' },
    placeholder: { cls: 'pm-mode pm-mode-placeholder', text: 'not connected' }
  };

  // ── Render (DOM-built, no innerHTML with user data) ───────────────
  function render() {
    var briefId = new URLSearchParams(location.search).get('brief');
    var brief = briefId ? getBrief(briefId) : null;
    if (!brief) {
      var briefs = getBriefs();
      if (briefs.length > 0) brief = briefs[briefs.length - 1];
    }

    var root = $('#paymentContent');
    root.textContent = '';

    if (!brief) {
      var empty = el('div', 'portal-empty');
      empty.appendChild(el('h3', null, 'No brief selected'));
      empty.appendChild(el('p', null, 'Start by scoping your project with the wizard, then come back here to see payment options.'));
      var a0 = el('a', 'btn btn-primary', 'Start the Wizard →');
      a0.href = '/services/wizard.html';
      empty.appendChild(a0);
      root.appendChild(empty);
      return;
    }

    var est = brief.estimate || {};
    var details = brief.details || {};
    var contractId = safeContractId(brief);
    var totalUsd = est.totalUsd || 0;
    var totalKes = est.totalKes || 0;
    var monthlyUsd = est.monthlyUsd || 0;
    var monthlyKes = est.monthlyKes || 0;
    var isCustom = est.packageId === 'custom' || est.packageId === 'enterprise'; // 'enterprise' kept for legacy briefs

    /* ── Summary ── */
    var summary = el('div', 'payment-summary');
    var head = el('div', 'payment-summary-head');
    head.appendChild(el('div', 'payment-summary-pkg', est.packageName || 'Package'));
    head.appendChild(el('div', 'payment-summary-amount', isCustom ? 'Custom' : fmtMoney(totalUsd, totalKes)));
    summary.appendChild(head);
    var grid = el('div', 'payment-summary-grid');
    [
      ['Contract ID', contractId],
      ['Client', details.name || '—'],
      ['Timeline', est.timeline || '—'],
      ['Monthly', monthlyUsd ? '$' + monthlyUsd + '/mo' : '—']
    ].forEach(function (cell) {
      var c = el('div', 'payment-summary-cell');
      c.appendChild(el('div', 'payment-summary-label', cell[0]));
      c.appendChild(el('div', 'payment-summary-value', cell[1]));
      grid.appendChild(c);
    });
    summary.appendChild(grid);
    root.appendChild(summary);

    /* ── Plans (numbers only — schedule lines are computed, not user text) ── */
    function money(n) { return '$' + Math.round(n).toLocaleString(); }
    var plans = [
      {
        id: 'fifty-fifty', name: '50 / 50', badge: 'Most popular',
        desc: 'Half now, half on delivery. Simple and predictable.',
        schedule: isCustom ? ['Deposit: Custom', 'On delivery: Custom']
          : ['Deposit: ' + money(totalUsd * 0.5) + ' (KES ' + Math.round(totalKes * 0.5).toLocaleString() + ')',
             'On delivery: ' + money(totalUsd * 0.5) + ' (KES ' + Math.round(totalKes * 0.5).toLocaleString() + ')']
      },
      {
        id: 'instalments', name: 'Instalments', badge: 'No fees',
        desc: 'Three equal payments — kickoff, mid-build, delivery. Built for SMB cashflow.',
        schedule: isCustom ? ['Each instalment: Custom', 'No fees, no interest']
          : ['Instalment 1 (kickoff): ' + money(totalUsd / 3),
             'Instalment 2 (mid-build): ' + money(totalUsd / 3),
             'Instalment 3 (delivery): ' + money(totalUsd - 2 * Math.round(totalUsd / 3))]
      },
      {
        id: 'milestone', name: 'Milestone-based',
        desc: '30% kickoff, 40% midpoint, 30% delivery. Pay as you see progress.',
        schedule: isCustom ? ['Kickoff: Custom', 'Midpoint: Custom', 'Delivery: Custom']
          : ['Kickoff (30%): ' + money(totalUsd * 0.3),
             'Midpoint (40%): ' + money(totalUsd * 0.4),
             'Delivery (30%): ' + money(totalUsd * 0.3)]
      },
      {
        id: 'monthly', name: 'Monthly retainer',
        desc: 'One-time build + monthly support. Cancel with 30 days notice.',
        schedule: isCustom ? ['Build: Custom', 'Monthly: Custom support plan (scoped with your SLA tier)']
          : ['Build: ' + money(totalUsd), 'Monthly: $' + monthlyUsd + '/mo (KES ' + monthlyKes.toLocaleString() + ')']
      }
    ];

    root.appendChild(el('h2', 'payment-section-title', '1. Choose your payment plan'));
    var planWrap = el('div', 'payment-plans');
    plans.forEach(function (p, i) {
      var btn = el('button', 'payment-plan' + (i === 0 ? ' selected' : ''));
      btn.type = 'button';
      btn.dataset.plan = p.id;
      if (p.badge) btn.appendChild(el('span', 'payment-plan-badge', p.badge));
      btn.appendChild(el('div', 'payment-plan-name', p.name));
      btn.appendChild(el('div', 'payment-plan-desc', p.desc));
      var sched = el('div', 'payment-plan-schedule');
      p.schedule.forEach(function (line) { sched.appendChild(el('div', null, line)); });
      btn.appendChild(sched);
      planWrap.appendChild(btn);
    });
    root.appendChild(planWrap);

    /* ── Methods ── */
    root.appendChild(el('h2', 'payment-section-title', '2. Choose your payment method'));
    var methodWrap = el('div', 'payment-methods');
    METHODS.forEach(function (m) {
      var card = el('a', 'payment-method');
      card.target = '_blank';
      card.rel = 'noopener';
      if (m.id === 'mpesa') {
        card.href = 'mailto:mututandunda@gmail.com?subject=' +
          encodeURIComponent('Payment via M-Pesa for ' + contractId) +
          '&body=' + encodeURIComponent('Hi Victor,\n\nI\'d like to pay via M-Pesa for contract ' + contractId + '.\n\nPlan:\nAmount: ' + fmtMoney(totalUsd, totalKes) + '\n\nThanks!');
      } else {
        card.href = 'mailto:mututandunda@gmail.com?subject=' +
          encodeURIComponent('Payment link request for ' + contractId) +
          '&body=' + encodeURIComponent('Hi Victor,\n\nPlease send me a payment link for contract ' + contractId + ' (' + m.name + ').\n\nAmount: ' + fmtMoney(totalUsd, totalKes) + '\n\nThanks!');
      }
      card.appendChild(el('div', 'payment-method-icon', m.icon));
      var nameRow = el('div', 'payment-method-name');
      nameRow.textContent = m.name;
      var badge = MODE_BADGE[m.mode];
      if (badge) {
        var chip = el('span', badge.cls, badge.text);
        nameRow.appendChild(document.createTextNode(' '));
        nameRow.appendChild(chip);
      }
      card.appendChild(nameRow);
      card.appendChild(el('div', 'payment-method-desc', m.desc));
      m.details.forEach(function (d) {
        var row = el('div', 'payment-method-detail');
        var strong = el('strong', null, d.label + ': ');
        row.appendChild(strong);
        row.appendChild(document.createTextNode(String(d.value).replace('{contractId}', contractId)));
        card.appendChild(row);
      });
      card.appendChild(el('div', 'payment-method-cta', m.cta));
      methodWrap.appendChild(card);
    });
    root.appendChild(methodWrap);

    /* ── Confirm ── */
    var confirmBox = el('div', 'payment-confirm');
    confirmBox.appendChild(el('h3', null, 'Confirm with Victor'));
    confirmBox.appendChild(el('p', null, 'Once you\'ve picked a plan and method, send Victor a note to lock it in. He\'ll confirm the deposit, schedule the kickoff call, and send a finalized invoice.'));
    var actions = el('div', 'payment-confirm-actions');
    var mail = el('a', 'btn btn-primary', 'Email Victor to confirm');
    mail.href = 'mailto:mututandunda@gmail.com?subject=' +
      encodeURIComponent('Payment plan for ' + contractId) +
      '&body=' + encodeURIComponent('Hi Victor,\n\nI\'d like to confirm my payment plan for contract ' + contractId + '.\n\nPlan:\nMethod:\nAmount: ' + fmtMoney(totalUsd, totalKes) + '\n\nThanks!');
    actions.appendChild(mail);
    var wa = el('a', 'btn btn-ghost', 'WhatsApp Victor');
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.href = 'https://wa.me/254724346971?text=' +
      encodeURIComponent('Hi Victor, I\'d like to confirm payment for ' + contractId);
    actions.appendChild(wa);
    confirmBox.appendChild(actions);
    root.appendChild(confirmBox);

    root.appendChild(el('p', 'payment-note',
      'Honest labels: M-Pesa Paybill is a manual instruction reconciled by Victor; the Flutterwave and Stripe entries are placeholders — no card payment provider is connected to this demo. Payments you report in the client workspace stay client-reported until Victor verifies them. Invoices are due within 7 days. Deposits are non-refundable once work begins.'));

    /* ── Mode badge styles (injected once) ── */
    if (!document.getElementById('pm-mode-style')) {
      var st = document.createElement('style');
      st.id = 'pm-mode-style';
      st.textContent =
        '.pm-mode{display:inline-block;font-size:0.62rem;font-weight:700;letter-spacing:0.05em;' +
        'text-transform:uppercase;padding:0.12rem 0.45rem;border-radius:99px;vertical-align:middle;margin-left:0.35rem}' +
        '.pm-mode-manual{background:rgba(139,92,246,0.16);color:#a78bfa}' +
        '.pm-mode-placeholder{background:rgba(239,68,68,0.14);color:#ef4444}';
      document.head.appendChild(st);
    }

    // Wire plan selection
    $$('.payment-plan').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.payment-plan').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        // Save to brief
        brief.paymentPlan = btn.dataset.plan;
        brief.paymentStatus = 'plan-selected';
        brief.status = brief.status || 'contracted';
        saveBrief(brief);
        // v13: sync into the encrypted Client Portal when unlocked
        try {
          if (window.VNPortalCore && window.VNPortalCore.isAuthed()) {
            var proj = window.VNPortalCore.findProjectByBrief(brief.id);
            if (!proj) proj = window.VNPortalCore.addProject(brief);
            if (proj) window.VNPortalCore.buildPaymentPlan(proj, btn.dataset.plan);
          }
        } catch (e) { /* portal optional */ }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
