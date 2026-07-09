/* Victor Ndunda — Payment page JS
   - Reads brief from localStorage
   - Renders payment plan options (50/50, milestone, monthly)
   - Renders payment methods (M-Pesa, Flutterwave, Stripe)
   - Marks brief with payment status when a plan is selected
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

  // ── Payment methods ───────────────────────────────────────────────
  // Real M-Pesa Paybill / Till and Flutterwave/Stripe payment link placeholders.
  // Victor should replace these with his actual merchant details.
  var METHODS = [
    {
      id: 'mpesa',
      icon: '📱',
      name: 'M-Pesa (Kenya)',
      desc: 'Pay via M-Pesa Paybill. Fast, free, instant. Best for Kenyan clients.',
      details: [
        { label: 'Paybill', value: '4071186' },
        { label: 'Account', value: 'VND-{contractId}' },
        { label: 'Name', value: 'Victor Ndunda' }
      ],
      cta: 'Send money via M-Pesa'
    },
    {
      id: 'flutterwave',
      icon: '💳',
      name: 'Flutterwave',
      desc: 'Card, bank transfer, M-Pesa, mobile money across Africa. Multi-currency.',
      details: [
        { label: 'Link', value: 'https://flutterwave.com/pay/victor-ndunda' },
        { label: 'Currencies', value: 'USD, KES, NGN, GHS, ZAR' }
      ],
      cta: 'Pay with Flutterwave ↗'
    },
    {
      id: 'stripe',
      icon: '🌍',
      name: 'Stripe (International)',
      desc: 'For international clients — Visa, Mastercard, Amex, Apple Pay, Google Pay.',
      details: [
        { label: 'Link', value: 'https://buy.stripe.com/victor-ndunda' },
        { label: 'Currencies', value: 'USD, EUR, GBP, +135' }
      ],
      cta: 'Pay with Stripe ↗'
    }
  ];

  // ── Render ────────────────────────────────────────────────────────
  function render() {
    var briefId = new URLSearchParams(location.search).get('brief');
    var brief = briefId ? getBrief(briefId) : null;
    if (!brief) {
      var briefs = getBriefs();
      if (briefs.length > 0) brief = briefs[briefs.length - 1];
    }

    if (!brief) {
      $('#paymentContent').innerHTML =
        '<div class="portal-empty">' +
          '<h3>No brief selected</h3>' +
          '<p>Start by scoping your project with the wizard, then come back here to see payment options.</p>' +
          '<a href="/services/wizard.html" class="btn btn-primary">Start the Wizard →</a>' +
        '</div>';
      return;
    }

    var est = brief.estimate || {};
    var details = brief.details || {};
    var contractId = 'VND-' + (brief.id || Date.now()).slice(-8).toUpperCase();
    var totalUsd = est.totalUsd || 0;
    var totalKes = est.totalKes || 0;
    var monthlyUsd = est.monthlyUsd || 0;
    var monthlyKes = est.monthlyKes || 0;
    var isEnterprise = est.packageId === 'enterprise';

    // Plan calculations
    var plans = [
      {
        id: 'fifty-fifty',
        name: '50 / 50',
        badge: 'Most popular',
        desc: 'Half now, half on delivery. Simple and predictable.',
        schedule: isEnterprise
          ? '<div>Deposit: Custom</div><div>On delivery: Custom</div>'
          : '<div>Deposit: $' + Math.round(totalUsd * 0.5).toLocaleString() + ' (KES ' + Math.round(totalKes * 0.5).toLocaleString() + ')</div><div>On delivery: $' + Math.round(totalUsd * 0.5).toLocaleString() + ' (KES ' + Math.round(totalKes * 0.5).toLocaleString() + ')</div>'
      },
      {
        id: 'milestone',
        name: 'Milestone-based',
        desc: '30% kickoff, 40% midpoint, 30% delivery. Pay as you see progress.',
        schedule: isEnterprise
          ? '<div>Kickoff: Custom</div><div>Midpoint: Custom</div><div>Delivery: Custom</div>'
          : '<div>Kickoff (30%): $' + Math.round(totalUsd * 0.3).toLocaleString() + '</div><div>Midpoint (40%): $' + Math.round(totalUsd * 0.4).toLocaleString() + '</div><div>Delivery (30%): $' + Math.round(totalUsd * 0.3).toLocaleString() + '</div>'
      },
      {
        id: 'monthly',
        name: 'Monthly retainer',
        desc: 'One-time build + monthly support. Cancel with 30 days notice.',
        schedule: isEnterprise
          ? '<div>Build: Custom</div><div>Monthly: $' + (monthlyUsd * 1000).toLocaleString() + '+/mo</div>'
          : '<div>Build: $' + totalUsd.toLocaleString() + '</div><div>Monthly: $' + monthlyUsd + '/mo (KES ' + monthlyKes.toLocaleString() + ')</div>'
      }
    ];

    var planHtml = plans.map(function (p, i) {
      return '<button class="payment-plan' + (i === 0 ? ' selected' : '') + '" data-plan="' + p.id + '">' +
        (p.badge ? '<span class="payment-plan-badge">' + p.badge + '</span>' : '') +
        '<div class="payment-plan-name">' + p.name + '</div>' +
        '<div class="payment-plan-desc">' + p.desc + '</div>' +
        '<div class="payment-plan-schedule">' + p.schedule + '</div>' +
      '</button>';
    }).join('');

    var methodsHtml = METHODS.map(function (m) {
      var detailsHtml = m.details.map(function (d) {
        var val = d.value.replace('{contractId}', contractId);
        return '<div class="payment-method-detail"><strong>' + d.label + ':</strong> ' + val + '</div>';
      }).join('');
      var href = m.id === 'mpesa' ? 'mailto:mututandunda@gmail.com?subject=Payment%20via%20M-Pesa%20for%20' + contractId + '&body=Hi%20Victor%2C%0A%0AI%27d%20like%20to%20pay%20via%20M-Pesa%20for%20contract%20' + contractId + '.%0A%0APlan%3A%20%0AAmount%3A%20' + fmtMoney(totalUsd, totalKes) + '%0A%0AThanks!' : m.details[0].value.replace('{contractId}', contractId);
      return '<a href="' + href + '" target="_blank" rel="noopener" class="payment-method">' +
        '<div class="payment-method-icon">' + m.icon + '</div>' +
        '<div class="payment-method-name">' + m.name + '</div>' +
        '<div class="payment-method-desc">' + m.desc + '</div>' +
        detailsHtml +
        '<div class="payment-method-cta">' + m.cta + '</div>' +
      '</a>';
    }).join('');

    $('#paymentContent').innerHTML =
      '<!-- Summary -->' +
      '<div class="payment-summary">' +
        '<div class="payment-summary-head">' +
          '<div class="payment-summary-pkg">' + (est.packageName || 'Package') + '</div>' +
          '<div class="payment-summary-amount">' + (isEnterprise ? 'Custom' : fmtMoney(totalUsd, totalKes)) + '</div>' +
        '</div>' +
        '<div class="payment-summary-grid">' +
          '<div class="payment-summary-cell"><div class="payment-summary-label">Contract ID</div><div class="payment-summary-value">' + contractId + '</div></div>' +
          '<div class="payment-summary-cell"><div class="payment-summary-label">Client</div><div class="payment-summary-value">' + (details.name || '—') + '</div></div>' +
          '<div class="payment-summary-cell"><div class="payment-summary-label">Timeline</div><div class="payment-summary-value">' + (est.timeline || '—') + '</div></div>' +
          '<div class="payment-summary-cell"><div class="payment-summary-label">Monthly</div><div class="payment-summary-value">' + (monthlyUsd ? '$' + monthlyUsd + '/mo' : '—') + '</div></div>' +
        '</div>' +
      '</div>' +

      '<h2 class="payment-section-title">1. Choose your payment plan</h2>' +
      '<div class="payment-plans">' + planHtml + '</div>' +

      '<h2 class="payment-section-title">2. Choose your payment method</h2>' +
      '<div class="payment-methods">' + methodsHtml + '</div>' +

      '<div class="payment-confirm">' +
        '<h3>Confirm with Victor</h3>' +
        '<p>Once you\'ve picked a plan and method, send Victor a note to lock it in. He\'ll confirm the deposit, schedule the kickoff call, and send a finalized invoice.</p>' +
        '<div class="payment-confirm-actions">' +
          '<a href="mailto:mututandunda@gmail.com?subject=Payment%20plan%20for%20' + contractId + '&body=Hi%20Victor%2C%0A%0AI%27d%20like%20to%20confirm%20my%20payment%20plan%20for%20contract%20' + contractId + '.%0A%0APlan%3A%20%0AMethod%3A%20%0AAmount%3A%20' + fmtMoney(totalUsd, totalKes) + '%0A%0AThanks!" class="btn btn-primary">Email Victor to confirm</a>' +
          '<a href="https://wa.me/254724346971?text=Hi%20Victor%2C%20I%27d%20like%20to%20confirm%20payment%20for%20' + contractId + '" target="_blank" rel="noopener" class="btn btn-ghost">WhatsApp Victor</a>' +
        '</div>' +
      '</div>' +

      '<p class="payment-note">Payment methods above are Victor\'s merchant details. M-Pesa Paybill is live; Flutterwave and Stripe links should be set up by Victor in his merchant dashboards. Invoices are due within 7 days. Deposits are non-refundable once work begins.</p>';

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
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
