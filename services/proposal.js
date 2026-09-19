/* Victor Ndunda — Proposal Generator (v11.1)
   - Completes stage 4 of the engagement pipeline (Enquiry › Estimate › Call
     › PROPOSAL › Invoice › Payment › Delivery).
   - Imports the assistant estimate (vn_last_estimate) and the scope-wizard
     brief (vn_client_briefs, ?brief=ID) so the client sees one consistent
     story from first chat to signed proposal.
   - Renders a branded, printable proposal document.
   - Persists to localStorage 'vn_proposals' (owner device — same model as
     the invoicing tool). No network, no third parties.
*/
(function () {
  'use strict';

  var STORE = 'vn_proposals';
  var WA_NUMBER = '254724346971';
  var REVISION_RATE = 200; // USD/hr (matches the contract generator)

  /* ── Package defaults (mirror services/data.json v1.3) ── */
  var PACKAGES = {
    audit: {
      name: 'AI Audit', total: 2000, monthly: 0, timeline: '1–2 weeks',
      approach: 'A focused discovery engagement: current-state assessment of people, data and systems; an opportunity map of 5–10 ranked use cases with an ROI model per use case; one quick-win pilot plan ready to build; a make-vs-buy recommendation; and a risk + compliance review (Kenya DPA 2019, GDPR). Ends with an executive readout and a 12-month roadmap.',
      deliverables: [
        'Current-state assessment (people, data, systems)',
        'Opportunity map — 5–10 ranked use cases with ROI model',
        'Quick-win pilot plan (1 actionable project ready to build)',
        'Make-vs-buy recommendation',
        'Risk + compliance review (Kenya DPA 2019, GDPR)',
        'Executive readout + 12-month roadmap'
      ]
    },
    starter: {
      name: 'AI Starter', total: 10000, monthly: 1400, timeline: '2–3 weeks',
      approach: 'A focused first build: a WhatsApp or website FAQ chatbot trained on your documents, one automation workflow (lead capture, auto-reply or appointment booking), a knowledge base of up to 50 documents, a basic analytics dashboard, and English + Swahili support. Two revision rounds and 30 days of post-launch support are included.',
      deliverables: [
        'WhatsApp or website FAQ chatbot (70–80% of routine questions)',
        '1 automation workflow (lead capture, auto-reply, or booking)',
        'Knowledge base setup — chat with up to 50 documents',
        'Basic analytics dashboard (queries, resolution rate, topics)',
        'Multilingual support (English + Swahili)',
        '2 revision rounds + 30 days post-launch support'
      ]
    },
    growth: {
      name: 'AI Growth', total: 28000, monthly: 6000, timeline: '6–10 weeks',
      approach: 'Production AI woven into your stack: a RAG knowledge bot over company documents with citations, 2–3 integrations (CRM, ERP, WhatsApp Business, email or custom API), a predictive analytics dashboard, a custom AI agent for one workflow, and an admin console with user management. Includes monthly enhancements, an analytics review, and priority support (4-hour response, business hours).',
      deliverables: [
        'RAG knowledge bot over company documents, with citations',
        '2–3 integrations (CRM, ERP, WhatsApp Business, email, custom API)',
        'Predictive analytics dashboard (forecasting, churn, demand, anomalies)',
        'Custom AI agent for one workflow (e.g. lead qualification, support triage)',
        'Admin console + user management',
        'Monthly enhancements + analytics review',
        'Priority support — 4-hour response, business hours'
      ]
    },
    enterprise: {
      name: 'AI Enterprise', total: 20000, monthly: 0, timeline: '12–24 weeks',
      approach: 'A custom multi-agent system (50+ agents on the Busara AI DAG framework), LLM fine-tuning on your domain, computer-vision pipelines where needed, on-prem or private-cloud deployment for data sovereignty, and a security + compliance review (SOC2, ISO 27001, GDPR, Kenya DPA). Dedicated engineer, named contact channel, 99.5% uptime SLA with 1-hour critical response, and quarterly executive business reviews.',
      deliverables: [
        'Custom multi-agent DAG orchestration (Busara AI framework — 50+ agents)',
        'LLM fine-tuning on your domain (legal, medical, agricultural, financial)',
        'Computer-vision pipelines where required (defect detection, OCR)',
        'On-prem or private-cloud deployment (data sovereignty)',
        'Security & compliance review (SOC2, ISO 27001, GDPR, Kenya DPA)',
        'Dedicated Slack/Teams channel + named engineer',
        '99.5% uptime SLA + 1-hour critical response',
        'Quarterly roadmap + executive business reviews'
      ]
    },
    custom: {
      name: 'Custom engagement', total: 0, monthly: 0, timeline: 'Scoped after discovery',
      approach: 'A scoped engagement defined after the discovery call — typically a focused production slice with an evaluation suite, observability baseline, documentation and handover.',
      deliverables: [
        'Scoped deliverables agreed in writing before kickoff',
        'Evaluation suite + observability baseline',
        'Documentation & team handover'
      ]
    }
  };

  var WHY_DEFAULT = [
    '6 production AI systems shipped — case studies with numbers, not promises',
    'Tapi Learn (client product): 11K+ learners across 38 countries, EN·FR·SW',
    'KilimoPRO: 22+ data sources, 91% on-device CV accuracy, offline-first',
    'Real math, not wrappers — Holt-Winters, GARCH, OLS running in production'
  ];

  /* ── State ── */
  var state = {
    id: null, number: null, createdAt: null, status: 'draft',
    client: { name: '', company: '', email: '' },
    packageId: 'growth', title: '',
    understanding: '', approach: '', deliverables: '', whyMe: WHY_DEFAULT.join('\n'),
    timeline: '', totalUsd: null, monthlyUsd: null, fx: 80,
    plan: 'fifty', validityDays: 14, issue: '', notes: ''
  };

  function $(s) { return document.querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n, cur) {
    n = Math.round(Number(n) || 0);
    return cur === 'KES' ? 'KES ' + n.toLocaleString('en-US') : '$' + n.toLocaleString('en-US');
  }
  function lines(s) {
    return String(s || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  /* ── Persistence ── */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) { /* storage full/blocked */ }
  }
  function nextNumber() {
    var year = new Date().getFullYear();
    var used = load().filter(function (p) { return (p.number || '').indexOf('PRP-' + year) === 0; }).length;
    return 'PRP-' + year + '-' + String(used + 1).padStart(3, '0');
  }

  /* ── Schedule lines by plan ── */
  function schedule() {
    var t = Number(state.totalUsd) || 0;
    if (state.plan === 'milestone') {
      return [
        { label: 'Kickoff (30%)', usd: Math.round(t * 0.3) },
        { label: 'Midpoint review (40%)', usd: Math.round(t * 0.4) },
        { label: 'Delivery (30%)', usd: t - Math.round(t * 0.3) - Math.round(t * 0.4) }
      ];
    }
    if (state.plan === 'monthly') {
      var rows = [{ label: 'Build (one-time)', usd: t }];
      if (Number(state.monthlyUsd) > 0) rows.push({ label: 'Support retainer (monthly)', usd: Number(state.monthlyUsd), monthly: true });
      return rows;
    }
    return [
      { label: 'Deposit on signature (50%)', usd: Math.round(t * 0.5) },
      { label: 'On delivery (50%)', usd: t - Math.round(t * 0.5) }
    ];
  }

  /* ── Live document render ── */
  function renderDoc() {
    var p = PACKAGES[state.packageId] || PACKAGES.custom;
    var pkgName = p.name;
    var isEnterprise = state.packageId === 'enterprise' || state.packageId === 'custom';
    var total = Number(state.totalUsd) || 0;
    var monthly = Number(state.monthlyUsd) || 0;
    var kesTotal = Math.round(total * (Number(state.fx) || 80) / 1000) * 1000;
    var kesMonthly = Math.round(monthly * (Number(state.fx) || 80) / 1000) * 1000;
    var issue = state.issue || todayISO();
    var validUntil = new Date(issue);
    validUntil.setDate(validUntil.getDate() + (Number(state.validityDays) || 14));
    var validStr = validUntil.toISOString().slice(0, 10);

    var deliv = lines(state.deliverables);
    var delivHtml = deliv.length
      ? '<ul class="pr-list">' + deliv.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>'
      : '<p><em>Deliverables listed per package — edit on the left.</em></p>';
    var why = lines(state.whyMe).length ? lines(state.whyMe) : WHY_DEFAULT;
    var whyHtml = '<ul class="pr-list">' + why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
    var schedRows = schedule().map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td class="num">' + money(r.usd, 'USD') +
        (r.monthly ? '<small style="color:var(--text-muted)"> /mo</small>' : '') + '</td></tr>';
    }).join('');

    var stamp = state.status !== 'draft' && state.status !== 'sent'
      ? '<span class="pr-status-stamp ' + esc(state.status) + '">' + esc(state.status) + '</span>' : '';
    if (state.status === 'sent') stamp = '<span class="pr-status-stamp sent">sent</span>';

    $('#prDoc').innerHTML =
      '<div class="inv-doc-head">' +
        '<div class="inv-doc-brand">' +
          '<div class="mark">VN</div>' +
          '<div><div class="nm">Victor Ndunda</div><div class="sm">AI Engineer · Production systems, not demos</div><div class="sm">victorndunda.com · Nairobi, Kenya</div></div>' +
        '</div>' +
        '<div class="inv-doc-meta">' +
          '<div class="ttl">Proposal' + stamp + '</div>' +
          '<div class="no">' + esc(state.number || 'PRP-DRAFT') + '</div>' +
          '<div class="dt">Issued ' + esc(issue) + ' · Valid until ' + esc(validStr) + '<br/>' + esc(pkgName) + (isEnterprise ? '' : ' package') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="inv-doc-parties">' +
        '<div><h4>Prepared for</h4><div class="p">' + esc(state.client.name || 'Client name') +
          (state.client.company ? '\n' + esc(state.client.company) : '') +
          (state.client.email ? '\n' + esc(state.client.email) : '') + '</div></div>' +
        '<div><h4>Prepared by</h4><div class="p">Victor Ndunda\nAI Engineer &amp; Founder\nmututandunda@gmail.com · +254 724 346 971</div></div>' +
      '</div>' +

      '<h2 class="pr-sec">1 · The project</h2>' +
      '<p><strong>' + esc(state.title || 'Project title') + '</strong></p>' +
      (state.understanding ? '<h2 class="pr-sec">2 · What I heard</h2><p>' + esc(state.understanding) + '</p>' : '') +

      '<h2 class="pr-sec">' + (state.understanding ? '3' : '2') + ' · Recommended approach — ' + esc(pkgName) + '</h2>' +
      '<p>' + esc(state.approach || p.approach) + '</p>' +

      '<h2 class="pr-sec">' + (state.understanding ? '4' : '3') + ' · Deliverables</h2>' + delivHtml +

      '<h2 class="pr-sec">' + (state.understanding ? '5' : '4') + ' · Timeline</h2>' +
      '<div class="pr-kv"><span>Estimated delivery</span><b>' + esc(state.timeline || p.timeline) + '</b></div>' +
      '<p class="pr-fine">From project kickoff — the date the deposit is received and the discovery call is completed. Scope changes are agreed in writing before they affect the timeline.</p>' +

      '<h2 class="pr-sec">' + (state.understanding ? '6' : '5') + ' · Investment</h2>' +
      '<div class="pr-invest">' +
        '<div class="big">' +
          (total > 0
            ? '<span class="amt">' + money(total, 'USD') + '</span><span class="cur">≈ ' + money(kesTotal, 'KES') + ' one-time</span>'
            : '<span class="amt">Custom — scoped after discovery</span><span class="cur">' + (state.packageId === 'enterprise' ? 'from $20,000 — typical $20K–$200K+ build + $10K–$40K/mo support' : 'scoped in writing') + '</span>') +
        '</div>' +
        (monthly > 0 ? '<div class="mth">Optional support retainer: <b>' + money(monthly, 'USD') + '/mo</b> (≈ ' + money(kesMonthly, 'KES') + '/mo) — monitoring, enhancements, analytics, support. Cancel with 30 days notice.</div>' : '') +
        (total > 0 ? '<table class="pr-sched"><thead><tr><th>Payment schedule</th><th style="text-align:right">Amount</th></tr></thead><tbody>' + schedRows + '</tbody></table>' : '') +
        '<p class="pr-fine">Payment methods: M-Pesa (Paybill 4071186 — account = invoice number), Flutterwave, Stripe. Invoices due within 7 days. Figures exclude applicable taxes (e.g. 16% VAT where required). Additional revisions beyond the package: USD $' + REVISION_RATE + '/hour.</p>' +
      '</div>' +

      '<h2 class="pr-sec">' + (state.understanding ? '7' : '6') + ' · Why this will work</h2>' + whyHtml +

      '<h2 class="pr-sec">' + (state.understanding ? '8' : '7') + ' · Next steps</h2>' +
      '<ul class="pr-list">' +
        '<li>Review this proposal — questions are welcome on WhatsApp or email (reply within one business day).</li>' +
        '<li>Confirm acceptance (signature below or a written reply referencing ' + esc(state.number || 'this proposal') + ').</li>' +
        '<li>Receive the contract + deposit invoice — kickoff is scheduled once the deposit clears.</li>' +
      '</ul>' +
      (state.notes ? '<h2 class="pr-sec">Notes</h2><p>' + esc(state.notes) + '</p>' : '') +

      '<div class="pr-sign">' +
        '<div class="blk"><div class="ln"></div><div class="who">Victor Ndunda — Service Provider · Date</div></div>' +
        '<div class="blk"><div class="ln"></div><div class="who">' + esc(state.client.name || 'Client') + ' — Client · Date</div></div>' +
      '</div>' +

      '<div class="inv-doc-foot">' + esc(state.number || 'PRP-DRAFT') + ' · Generated from victorndunda.com/services/proposal.html · This proposal is an offer, not a contract — the signed agreement governs.' +
      ' <span class="pr-validity">Valid until ' + esc(validStr) + '</span></div>';
  }

  /* ── Builder render ── */
  function renderSaved() {
    var list = load();
    var box = $('#prSaved');
    if (!list.length) {
      box.innerHTML = '<div class="inv-empty">No proposals yet — build one and press Save.</div>';
      return;
    }
    list.slice().reverse().forEach(function (p) {
      var div = document.createElement('div');
      div.className = 'inv-saved';
      div.innerHTML =
        '<span class="no">' + esc(p.number) + '</span>' +
        '<span class="who">' + esc((p.client && p.client.name) || p.title || 'Untitled') + '</span>' +
        '<span class="amt">' + (p.totalUsd ? money(p.totalUsd, 'USD') : 'Custom') + '</span>' +
        '<span class="st ' + esc(p.status) + '">' + esc(p.status) + '</span>' +
        '<span class="act">' +
          '<button data-load="' + esc(p.id) + '" title="Load">✏️</button>' +
          '<button data-mark="' + esc(p.id) + '" title="Toggle sent">📤</button>' +
          '<button data-accept="' + esc(p.id) + '" title="Mark accepted">✅</button>' +
          '<button data-del="' + esc(p.id) + '" title="Delete">🗑️</button>' +
        '</span>';
      box.appendChild(div);
    });
  }

  function syncInputs() {
    $('#cl-name').value = state.client.name;
    $('#cl-company').value = state.client.company;
    $('#cl-email').value = state.client.email;
    $('#pr-package').value = state.packageId;
    $('#pr-title').value = state.title;
    $('#pr-understanding').value = state.understanding;
    $('#pr-approach').value = state.approach;
    $('#pr-deliverables').value = state.deliverables;
    $('#pr-why').value = state.whyMe;
    $('#pr-timeline').value = state.timeline;
    $('#pr-total').value = state.totalUsd == null ? '' : state.totalUsd;
    $('#pr-monthly').value = state.monthlyUsd == null ? '' : state.monthlyUsd;
    $('#pr-fx').value = state.fx;
    $('#pr-plan').value = state.plan;
    $('#pr-valid').value = state.validityDays;
    $('#pr-date').value = state.issue;
    $('#pr-notes').value = state.notes;
  }

  function readInputs() {
    state.client.name = $('#cl-name').value.trim();
    state.client.company = $('#cl-company').value.trim();
    state.client.email = $('#cl-email').value.trim();
    state.title = $('#pr-title').value.trim();
    state.understanding = $('#pr-understanding').value.trim();
    state.approach = $('#pr-approach').value.trim();
    state.deliverables = $('#pr-deliverables').value.trim();
    state.whyMe = $('#pr-why').value.trim();
    state.timeline = $('#pr-timeline').value.trim();
    state.totalUsd = $('#pr-total').value === '' ? null : Number($('#pr-total').value);
    state.monthlyUsd = $('#pr-monthly').value === '' ? null : Number($('#pr-monthly').value);
    state.fx = Number($('#pr-fx').value) || 80;
    state.plan = $('#pr-plan').value;
    state.validityDays = Number($('#pr-valid').value) || 14;
    state.issue = $('#pr-date').value || todayISO();
    state.notes = $('#pr-notes').value.trim();
  }

  /* ── Package switch → sensible defaults ── */
  function applyPackage(id, opts) {
    opts = opts || {};
    var p = PACKAGES[id];
    if (!p) return;
    state.packageId = id;
    if (!opts.keepApproach) state.approach = state.approach || p.approach;
    if (!opts.keepDeliverables) state.deliverables = state.deliverables || p.deliverables.join('\n');
    if (!opts.keepTimeline) state.timeline = state.timeline || p.timeline;
    if (!opts.keepTotal && state.totalUsd == null && p.total) state.totalUsd = p.total;
    if (!opts.keepMonthly && state.monthlyUsd == null && p.monthly) state.monthlyUsd = p.monthly;
  }

  /* ── Imports ── */
  function tryEstimateHint() {
    try {
      var est = JSON.parse(localStorage.getItem('vn_last_estimate') || 'null');
      var hint = $('#prEstimateHint'), txt = $('#prEstimateHintText');
      if (est && est.service) {
        txt.textContent = 'Assistant estimate on record: ' + est.service + ' — ' + est.range + '.';
        hint.hidden = false;
      } else { hint.hidden = true; }
    } catch (e) { $('#prEstimateHint').hidden = true; }
  }
  function importEstimate() {
    try {
      var est = JSON.parse(localStorage.getItem('vn_last_estimate') || 'null');
      if (!est) { window.vnToast('No estimate found — run one on /book/ first', 'ℹ️'); return; }
      state.title = state.title || est.service + (est.domain ? ' — ' + est.domain + ' context' : '');
      state.understanding = state.understanding ||
        ('Scope discussed with the assistant: ' + est.service + ' · volume ' + est.volume + ' · integrations ' + est.integrations + ' · languages ' + est.languages + '.');
      state.totalUsd = Math.round((est.usdLow + est.usdHigh) / 2 / 50) * 50;
      renderDoc(); syncInputs();
      window.vnToast('Estimate imported — midpoint of ' + est.range, '💰');
    } catch (e) { window.vnToast('Could not read the saved estimate', '⚠️'); }
  }

  function importBrief(briefId) {
    try {
      var briefs = JSON.parse(localStorage.getItem('vn_client_briefs') || '[]');
      var b = briefId ? briefs.find(function (x) { return x.id === briefId; }) : briefs[briefs.length - 1];
      if (!b) { window.vnToast('No brief found — the scope wizard saves one', 'ℹ️'); return; }
      if (b.details) {
        state.client.name = b.details.name || state.client.name;
        state.client.email = b.details.email || state.client.email;
        state.client.company = b.details.company || state.client.company;
      }
      if (b.estimate && b.estimate.packageId) applyPackage(b.estimate.packageId, { keepTotal: true, keepMonthly: true });
      state.title = state.title || (b.estimate && b.estimate.packageName ? b.estimate.packageName + ' engagement' : 'AI engagement');
      if (b.estimate && b.estimate.totalUsd) state.totalUsd = b.estimate.totalUsd;
      if (b.estimate && b.estimate.monthlyUsd) state.monthlyUsd = b.estimate.monthlyUsd;
      if (b.details && b.details.description) state.understanding = state.understanding || b.details.description;
      if (b.state && b.state.types && b.state.types.length && !state.deliverables) {
        var p = PACKAGES[state.packageId] || PACKAGES.custom;
        state.deliverables = p.deliverables.slice(0, Math.max(3, b.state.types.length + 1)).join('\n');
      }
      renderDoc(); syncInputs();
      window.vnToast('Brief imported — review before sending', '📋');
    } catch (e) { window.vnToast('Could not read the saved brief', '⚠️'); }
  }

  /* ── Save / share / print ── */
  function persist() {
    readInputs();
    if (!state.client.name && !state.title) { window.vnToast('Add a client name or project title first', '⚠️'); return null; }
    var list = load();
    if (!state.id) {
      state.id = 'prop-' + Date.now();
      state.createdAt = new Date().toISOString();
      state.number = nextNumber();
    }
    var idx = list.findIndex(function (p) { return p.id === state.id; });
    var snapshot = JSON.parse(JSON.stringify(state));
    if (idx >= 0) list[idx] = snapshot; else list.push(snapshot);
    save(list); renderSaved(); renderDoc();
    window.vnToast('Saved ' + state.number, '💾');
    return snapshot;
  }

  function shareText() {
    var p = PACKAGES[state.packageId] || PACKAGES.custom;
    var total = Number(state.totalUsd) || 0;
    var monthly = Number(state.monthlyUsd) || 0;
    var parts = [
      'Proposal ' + (state.number || 'PRP-DRAFT') + ' — ' + (state.title || p.name),
      total ? 'Investment: ' + money(total, 'USD') + (monthly ? ' + ' + money(monthly, 'USD') + '/mo support' : '') : 'Investment: custom — scoped after discovery',
      'Timeline: ' + (state.timeline || p.timeline),
      'Full document: ' + location.origin + '/services/proposal.html',
      'Accept by replying with the proposal number. M-Pesa Paybill 4071186 (account = invoice number) once invoiced.'
    ];
    return parts.join('\n');
  }

  function savedClick(e) {
    var list = load();
    var id = e.target.getAttribute('data-load') || e.target.getAttribute('data-mark') ||
      e.target.getAttribute('data-accept') || e.target.getAttribute('data-del');
    if (!id) return;
    var prop = list.find(function (x) { return x.id === id; });
    if (!prop) return;
    if (e.target.getAttribute('data-load')) {
      state = JSON.parse(JSON.stringify(prop));
      syncInputs(); renderDoc();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.vnToast('Loaded ' + prop.number, '✏️');
    } else if (e.target.getAttribute('data-mark')) {
      prop.status = prop.status === 'sent' ? 'draft' : 'sent';
      save(list); renderSaved();
      if (state.id === prop.id) { state.status = prop.status; renderDoc(); }
      window.vnToast(prop.number + ' → ' + prop.status, prop.status === 'sent' ? '📤' : '↩️');
    } else if (e.target.getAttribute('data-accept')) {
      prop.status = 'accepted';
      save(list); renderSaved();
      if (state.id === prop.id) { state.status = 'accepted'; renderDoc(); }
      window.vnToast(prop.number + ' accepted — generate the contract next', '✅');
    } else if (e.target.getAttribute('data-del')) {
      if (!confirm('Delete this proposal? This cannot be undone.')) return;
      save(list.filter(function (x) { return x.id !== id; }));
      if (state.id === id) { location.reload(); return; }
      renderSaved();
      window.vnToast('Proposal deleted', '🗑️');
    }
  }

  /* ── Wire ── */
  function wire() {
    ['cl-name', 'cl-company', 'cl-email', 'pr-title', 'pr-understanding', 'pr-approach',
     'pr-deliverables', 'pr-why', 'pr-timeline', 'pr-notes'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { readInputs(); renderDoc(); });
    });
    ['pr-total', 'pr-monthly', 'pr-fx', 'pr-valid'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { readInputs(); renderDoc(); });
    });
    $('#pr-plan').addEventListener('change', function () { state.plan = this.value; renderDoc(); });
    $('#pr-date').addEventListener('change', function () { state.issue = this.value; renderDoc(); });
    $('#pr-package').addEventListener('change', function () {
      state.packageId = this.value;
      var p = PACKAGES[this.value];
      state.approach = p.approach;
      state.deliverables = p.deliverables.join('\n');
      state.timeline = p.timeline;
      if (p.total) state.totalUsd = p.total;
      if (p.monthly) state.monthlyUsd = p.monthly;
      syncInputs(); renderDoc();
    });

    $('#prEstimate').addEventListener('click', importEstimate);
    $('#prBrief').addEventListener('click', function () { importBrief(null); });
    $('#prSave').addEventListener('click', persist);
    $('#prNew').addEventListener('click', function () { if (confirm('Start a new blank proposal? Unsaved edits are lost.')) location.reload(); });
    $('#prPrint').addEventListener('click', function () { window.print(); });
    $('#prShareWa').addEventListener('click', function () {
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(shareText()), '_blank', 'noopener');
    });
    $('#prShareMail').addEventListener('click', function () {
      var subj = 'Proposal ' + (state.number || 'PRP-DRAFT') + ' — ' + (state.title || 'AI engagement');
      window.location.href = 'mailto:' + encodeURIComponent(state.client.email || '') +
        '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(shareText() + '\n\n— Victor Ndunda');
    });
    var contract = $('#prContract');
    if (contract) contract.href = '/services/contract.html' + (state.id ? '?brief=' + state.id : '');
    $('#prSaved').addEventListener('click', savedClick);
  }

  /* ── Init ── */
  function init() {
    state.issue = todayISO();
    var briefId = new URLSearchParams(location.search).get('brief');
    wire();
    applyPackage('growth', {});
    syncInputs();
    renderSaved();
    renderDoc();
    tryEstimateHint();
    if (briefId || localStorage.getItem('vn_client_briefs')) {
      var hint = $('#prBriefHint'), txt = $('#prBriefHintText');
      txt.textContent = 'A wizard brief is on this device.';
      hint.hidden = false;
      if (briefId) importBrief(briefId);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
