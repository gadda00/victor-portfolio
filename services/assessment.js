/* Victor Ndunda — AI Readiness Assessment
   ─────────────────────────────────────────────────────────────────
   12 questions across 4 dimensions (Data, Pain, Team, Goals).
   - 100% client-side: no tracking, no server, no PII collected
   - Score 0–100 + per-dimension breakdown + weakest-link insight
   - Recommendation mapped to the live package ladder (v11.1):
     audit $2,000 · starter $10,000 · growth $28,000 · enterprise from $20,000
   - Optional email report: sends score + visitor email to the owner
     via Web3Forms only when the visitor explicitly consents
   - Result is shareable (?r=&tier=&rec=) and printable
   - Persists vn_assessment_ctx so /book/ can continue the thread
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Theme + nav bootstrap (same pattern as portal/wizard) ─────── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function bootChrome() {
    var stored = localStorage.getItem('theme');
    var theme = stored || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    var tt = document.getElementById('themeToggle');
    if (tt) tt.addEventListener('click', function () {
      var cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      var nxt = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove(cur);
      document.documentElement.classList.add(nxt);
      localStorage.setItem('theme', nxt);
    });
    var mt = document.getElementById('mobileToggle');
    var nl = document.getElementById('navLinks');
    if (mt && nl) mt.addEventListener('click', function () {
      nl.classList.toggle('open');
      mt.setAttribute('aria-expanded', nl.classList.contains('open') ? 'true' : 'false');
    });
  }

  /* ── Privacy-friendly event hooks (same convention as site) ────── */
  function track(name, data) {
    try { (window.__vnEvents = window.__vnEvents || []).push({ event: name, t: Date.now(), data: data || {} }); } catch (e) {}
  }

  /* ── Question bank ─────────────────────────────────────────────── */
  var DIMS = {
    data: { label: 'Data & Systems', chip: '🗂️ Data & Systems' },
    pain: { label: 'Process Pain', chip: '⚙️ Process Pain' },
    team: { label: 'Team Readiness', chip: '👥 Team Readiness' },
    goal: { label: 'Goals & Momentum', chip: '🎯 Goals & Momentum' }
  };
  var DIM_ORDER = ['data', 'pain', 'team', 'goal'];

  var QUESTIONS = [
    { dim: 'data', q: 'Where does your team\u2019s operational knowledge live right now?', sub: 'Reports, customer history, inventory, processes — the stuff the business runs on.',
      opts: [
        ['In people\u2019s heads, WhatsApp threads, and paper', 0],
        ['Scattered spreadsheets and email inboxes', 1],
        ['One or two shared tools — a CRM, ERP, or workspace', 2],
        ['A structured database or documented system others can query', 3]
      ]},
    { dim: 'data', q: 'If you pulled a key report today, how much would you trust it?', sub: 'Think about your most important numbers — sales, stock, outstanding invoices.',
      opts: [
        ['Nobody would bet money on it', 0],
        ['Often stale, duplicated, or contradicts other reports', 1],
        ['Mostly right, with known exceptions we work around', 2],
        ['Clean, current, and trusted for decisions', 3]
      ]},
    { dim: 'data', q: 'How do your key systems exchange data today?', sub: 'For example between your sales tool, accounting, and operations.',
      opts: [
        ['Manual retyping — someone copies between systems', 0],
        ['CSV exports by hand, when we remember', 1],
        ['A few integrations exist, with some manual glue', 2],
        ['APIs or synced integrations are already in place', 3]
      ]},
    { dim: 'pain', q: 'How many hours a week does your team lose to repetitive manual work?', sub: 'Data entry, copy-pasting between systems, answering the same questions, chasing status.',
      opts: [
        ['Under 5 hours', 0],
        ['5–20 hours', 1],
        ['20–50 hours', 2],
        ['More than 50 hours', 3]
      ], hours: [3, 12, 35, 60] },
    { dim: 'pain', q: 'When a process breaks or someone makes an error, what does it cost?', sub: 'The honest version — what actually happens.',
      opts: [
        ['Barely noticeable — we fix it and move on', 0],
        ['Annoying, but recoverable within a day', 1],
        ['Real money — lost orders, angry clients, rework', 2],
        ['Serious — compliance risk or six-figure exposure', 3]
      ]},
    { dim: 'pain', q: 'Where does AI sit on leadership\u2019s agenda right now?', sub: 'Momentum matters more than enthusiasm.',
      opts: [
        ['Nowhere — nobody has asked for it', 0],
        ['Occasional curiosity, no owner', 1],
        ['It\u2019s on the agenda for this year', 2],
        ['Named priority, with a budget line attached', 3]
      ]},
    { dim: 'team', q: 'Is there one person who would own an AI project day-to-day?', sub: 'Adoption is where AI projects die — not code.',
      opts: [
        ['No — everyone is at full capacity', 0],
        ['Maybe, if we freed someone up', 1],
        ['Yes, a likely champion exists', 2],
        ['Yes — someone with time already allocated', 3]
      ]},
    { dim: 'team', q: 'How does your team usually react to new tools?', sub: 'Be honest — past rollouts are the best predictor.',
      opts: [
        ['Resistance — tools get abandoned', 0],
        ['Skeptical, but they comply if pushed', 1],
        ['Curious — a few actively try things', 2],
        ['They ask for more before we\u2019ve finished rolling out', 3]
      ]},
    { dim: 'team', q: 'Who keeps your technology running today?', sub: 'Email, backups, the website, the till system.',
      opts: [
        ['Nobody — we call someone when it breaks', 0],
        ['One overloaded person wears the hat', 1],
        ['A part-time technical person or agency', 2],
        ['An in-house technical owner', 3]
      ]},
    { dim: 'goal', q: 'How clear is the first problem you\u2019d want AI to solve?', sub: 'Clarity cuts consulting cost dramatically.',
      opts: [
        ['Vague — \u201cwe need AI\u201d is about it', 0],
        ['A direction, not a specific workflow', 1],
        ['One clear candidate workflow in mind', 2],
        ['A ranked list of candidate workflows', 3]
      ]},
    { dim: 'goal', q: 'When do you want something live in production?', sub: 'Real timelines, not aspirations.',
      opts: [
        ['No timeline — someday is fine', 0],
        ['Within the next year', 1],
        ['This quarter', 2],
        ['Within weeks — we\u2019re ready now', 3]
      ]},
    { dim: 'goal', q: 'What\u2019s a realistic starting budget for this?', sub: 'Anchors the recommendation to what you can actually commit.',
      opts: [
        ['Nothing committed yet — we need to see the case first', 0],
        ['Under $3,000', 1],
        ['$3,000–$15,000', 2],
        ['$15,000+', 3]
      ]}
  ];

  /* ── Package ladder (mirrors services/data.json v1.3.0) ────────── */
  var PACKAGES = {
    audit: {
      id: 'audit', icon: '🔍', name: 'AI Audit',
      price: '$2,000 · KES 160K', monthly: '',
      timeline: '1–2 weeks',
      desc: 'A consulting engagement, not a build: current-state assessment, 5–10 ranked opportunities, a quick-win pilot plan, and a make-vs-buy recommendation. 50% of the fee is credited toward any build within 6 months.',
      ul: ['Opportunity map, ranked by return', 'Data & readiness review', 'Risk and compliance check', 'Executive readout + 12-month roadmap', 'Fee credited 50% toward a build']
    },
    starter: {
      id: 'starter', icon: '🚀', name: 'AI Starter',
      price: '$10,000 · KES 800K', monthly: ' + $1,400/mo care',
      timeline: '2–3 weeks',
      desc: 'Ship one focused production system — a WhatsApp or web assistant, one automation workflow, a working knowledge base — and prove the value before scaling.',
      ul: ['One production workflow, live in weeks', 'Knowledge base (50 docs) with citations', 'EN + Swahili out of the box', 'Basic analytics dashboard', '2 revisions + 30 days support']
    },
    growth: {
      id: 'growth', icon: '📈', name: 'AI Growth',
      price: '$28,000 · KES 2.2M', monthly: ' + $6,000/mo care',
      timeline: '4–8 weeks',
      desc: 'Production AI integrated with your CRM/ERP: multi-agent orchestration, RAG with citations, analytics, and team training. For operations that are ready to run on AI.',
      ul: ['CRM/ERP-integrated production system', 'Multi-agent orchestration', 'RAG with citations + evaluation suite', 'Team training session included', '3 revisions + 90 days support'],
      alt: { icon: '🏢', name: 'AI Enterprise', price: 'from $20,000, scaling with scope', note: 'If you need 50+ specialized agents, SLAs, and 24/7 monitoring, the Enterprise tier starts at $20,000 — the Scope Wizard can size it precisely.' }
    },
    enterprise: {
      id: 'enterprise', icon: '🏢', name: 'AI Enterprise',
      price: 'from $20,000', monthly: ' + $10,000/mo care',
      timeline: '8–16 weeks',
      desc: 'Custom multi-agent systems with SLAs, monitoring, and compliance reviews — scoped precisely to your operation.',
      ul: ['50+ specialized agents', 'SLAs + 24/7 monitoring', 'Security + compliance review', 'Dedicated engineer', '12 months support']
    }
  };

  var TIERS = [
    { min: 0,  id: 'explorer', label: 'Foundation First', cls: '',
      verdict: 'You have honest upside, but the foundations aren\u2019t mapped yet — building now would mean guessing. Start with the Audit: it turns \u201cwe should use AI\u201d into a ranked, costed roadmap, and half its fee comes back as credit toward a build.' },
    { min: 40, id: 'ready',    label: 'Ready to Build', cls: 't2',
      verdict: 'You have enough structure, pain, and ownership to ship a focused first system — and see returns in weeks, not quarters. Start with one workflow that pays for itself, then scale from proof.' },
    { min: 70, id: 'primed',   label: 'Built for Production', cls: 't3',
      verdict: 'Your data, team, and mandate can carry production-grade AI. The question isn\u2019t whether to build — it\u2019s what to build first, and at what depth. A Growth-tier system (or Enterprise scale) is within reach.' }
  ];

  var DIM_ADVICE = {
    data: 'Fix data access and quality first — every AI option gets cheaper, safer, and faster once the numbers are trusted.',
    pain: 'Pick the one workflow where errors or hours genuinely hurt. Value concentrated there funds everything else.',
    team: 'Name a champion with real allocated time. Adoption is where AI projects die — not code.',
    goal: 'Write down the first workflow to fix and give it a deadline. Clarity alone cuts consulting cost by a third.'
  };

  /* ── State ─────────────────────────────────────────────────────── */
  var state = { i: 0, answers: new Array(QUESTIONS.length).fill(null), shared: false };
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── DOM helpers ───────────────────────────────────────────────── */
  function $(s) { return document.querySelector(s); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtUsd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  /* ── Scoring ───────────────────────────────────────────────────── */
  function computeResult() {
    var dims = { data: { raw: 0, n: 0 }, pain: { raw: 0, n: 0 }, team: { raw: 0, n: 0 }, goal: { raw: 0, n: 0 } };
    QUESTIONS.forEach(function (q, idx) {
      var a = state.answers[idx];
      if (a === null) return;
      dims[q.dim].raw += q.opts[a][1];
      dims[q.dim].n += 1;
    });
    var out = { dims: {}, totalRaw: 0, maxRaw: 0 };
    DIM_ORDER.forEach(function (d) {
      var raw = dims[d].raw, n = dims[d].n;
      var pct = n > 0 ? Math.round(raw / (n * 3) * 100) : null;
      out.dims[d] = pct;
      out.totalRaw += raw;
      out.maxRaw += n * 3;
    });
    out.score = out.maxRaw > 0 ? Math.round(out.totalRaw / out.maxRaw * 100) : 0;
    return out;
  }
  function tierFor(score) {
    var t = TIERS[0];
    TIERS.forEach(function (x) { if (score >= x.min) t = x; });
    return t;
  }
  function recommend(score) {
    var tier = tierFor(score);
    var recId = score < 40 ? 'audit' : (score < 70 ? 'starter' : 'growth');
    var bridging = null;
    // Thoughtful cross-check: budget realism overrides ambition honestly.
    var budget = state.answers[11];
    var budgetVal = budget === null ? null : QUESTIONS[11].opts[budget][1];
    if (recId !== 'audit' && budgetVal !== null && budgetVal <= 1) {
      bridging = 'Your score supports the ' + PACKAGES[recId].name + ', but your stated budget is under $3,000 — so the honest start is the AI Audit ($2,000). Half its fee is credited toward the build when you\u2019re ready, so nothing is lost by mapping first.';
      recId = 'audit';
    }
    return { tier: tier, recId: recId, bridging: bridging };
  }

  /* ── Rendering: questions ──────────────────────────────────────── */
  var qPanel, rPanel, qMeta, qTitle, qSub, qOptions, prog, fill, nav, prevBtn, skipBtn, navInfo;

  function renderQuestion() {
    var q = QUESTIONS[state.i];
    var dimIdx = QUESTIONS.slice(0, state.i + 1).filter(function (x) { return x.dim === q.dim; }).length;
    qMeta.innerHTML = '<span class="asmt-dim-chip">' + DIMS[q.dim].chip + '</span><span>Q' + (state.i + 1) + ' of ' + QUESTIONS.length + '</span>';
    qTitle.textContent = q.q;
    qSub.textContent = q.sub;
    qOptions.innerHTML = '';
    q.opts.forEach(function (o, oi) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wiz-option' + (state.answers[state.i] === oi ? ' selected' : '');
      b.setAttribute('aria-pressed', state.answers[state.i] === oi ? 'true' : 'false');
      b.innerHTML =
        '<div class="wiz-option-icon">' + ['○', '◐', '◑', '●'][oi] + '</div>' +
        '<div class="wiz-option-body"><div class="wiz-option-name">' + esc(o[0]) + '</div></div>';
      b.addEventListener('click', function () { choose(oi); });
      qOptions.appendChild(b);
    });
    var pct = (state.i) / QUESTIONS.length * 100;
    fill.style.width = Math.max(pct, 100 / QUESTIONS.length) + '%';
    prog.setAttribute('aria-valuenow', String(state.i + 1));
    navInfo.textContent = 'Question ' + (state.i + 1) + ' of ' + QUESTIONS.length;
    prevBtn.disabled = state.i === 0;
    qTitle.setAttribute('tabindex', '-1');
    try { qTitle.focus({ preventScroll: false }); } catch (e) {}
  }

  function choose(oi) {
    state.answers[state.i] = oi;
    track('assessment_answer', { q: state.i + 1, v: QUESTIONS[state.i].opts[oi][1] });
    var btns = qOptions.querySelectorAll('.wiz-option');
    btns.forEach(function (b, bi) {
      b.classList.toggle('selected', bi === oi);
      b.setAttribute('aria-pressed', bi === oi ? 'true' : 'false');
    });
    window.setTimeout(function () {
      if (state.i < QUESTIONS.length - 1) {
        state.i += 1;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
      } else {
        finish();
      }
    }, REDUCED ? 0 : 240);
  }

  /* ── Rendering: results ────────────────────────────────────────── */
  var DIAL_C = 527.8;

  function animateDial(score) {
    var dialFill = $('#dialFill'), dialNum = $('#dialNum');
    if (REDUCED) {
      dialFill.style.strokeDashoffset = DIAL_C * (1 - score / 100);
      dialNum.textContent = score;
      return;
    }
    requestAnimationFrame(function () {
      dialFill.style.strokeDashoffset = DIAL_C * (1 - score / 100);
    });
    var t0 = performance.now(), dur = 1100;
    function tick(t) {
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      dialNum.textContent = Math.round(score * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function pkgCardHtml(pkg, bridging) {
    var html =
      '<div class="asmt-pkg-card">' +
        '<div class="asmt-pkg-icon">' + pkg.icon + '</div>' +
        '<div class="asmt-pkg-body">' +
          '<h4 class="asmt-pkg-name">' + esc(pkg.name) + ' <span style="font-weight:600;color:var(--text-muted);font-size:0.8rem">· ' + pkg.timeline + '</span></h4>' +
          '<div class="asmt-pkg-price">' + pkg.price + (pkg.monthly ? ' <span class="asmt-pkg-mo">' + pkg.monthly + '</span>' : '') + '</div>' +
          '<p class="asmt-pkg-desc">' + esc(pkg.desc) + '</p>' +
          '<ul class="asmt-pkg-ul">' + pkg.ul.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
          (pkg.alt ? '<p class="asmt-pkg-desc" style="margin-top:0.9rem;padding-top:0.9rem;border-top:1px dashed var(--border)"><strong>' + pkg.alt.icon + ' ' + esc(pkg.alt.name) + ':</strong> ' + esc(pkg.alt.price) + ' — ' + esc(pkg.alt.note) + '</p>' : '') +
        '</div>' +
      '</div>';
    if (bridging) {
      html += '<p class="asmt-weakest" style="margin-top:1rem"><strong>Budget reality check:</strong> ' + esc(bridging) + '</p>';
    }
    return html;
  }

  function renderResult(res, rec, opts) {
    opts = opts || {};
    var tier = rec.tier;
    animateDial(res.score);

    var badge = $('#tierBadge');
    badge.textContent = tier.label;
    badge.className = 'asmt-tier-badge ' + (tier.cls || '');
    $('#verdictText').textContent = opts.sharedVerdict || tier.verdict;

    // Dimension bars (hidden in shared mode)
    var dimBlock = $('#dimBlock');
    if (opts.shared) {
      dimBlock.hidden = true;
    } else {
      dimBlock.hidden = false;
      DIM_ORDER.forEach(function (d) {
        var pct = res.dims[d];
        var el = document.getElementById('dim' + d.charAt(0).toUpperCase() + d.slice(1));
        var bar = document.getElementById('bar' + d.charAt(0).toUpperCase() + d.slice(1));
        if (el) el.textContent = pct === null ? '—' : pct + '/100';
        if (bar) window.setTimeout(function () { bar.style.width = (pct || 0) + '%'; }, 120);
      });
      // Weakest link
      var weakest = null, low = 101;
      DIM_ORDER.forEach(function (d) {
        if (res.dims[d] !== null && res.dims[d] < low) { low = res.dims[d]; weakest = d; }
      });
      $('#weakestNote').innerHTML = weakest
        ? '<strong>Your weakest link: ' + DIMS[weakest].label + ' (' + low + '/100).</strong> ' + esc(DIM_ADVICE[weakest])
        : '';
    }

    // Package card
    $('#pkgCard').innerHTML =
      '<h3 class="asmt-subhead">' + (opts.shared ? 'Recommended for this score' : 'Your recommended starting point') + '</h3>' +
      pkgCardHtml(PACKAGES[rec.recId], rec.bridging);

    // CTA carries the lead context
    var book = $('#ctaBook');
    book.href = '/book/?src=assessment&score=' + res.score + '&rec=' + rec.recId;

    // ROI defaults from the pain answer
    var hoursInput = $('#roiHours');
    var qi = state.answers[3];
    hoursInput.value = (opts.shared || qi === null) ? 12 : QUESTIONS[3].hours[qi];
    if (!$('#roiRate').value) $('#roiRate').value = 12;
    if (!$('#roiErrors').value) $('#roiErrors').value = 0;
    updateRoi(rec.recId);

    // Shared mode: hide email capture, show a nudge instead
    var emailBlock = $('#emailBlock');
    if (opts.shared) {
      emailBlock.hidden = true;
      var note = document.createElement('p');
      note.className = 'asmt-shared-note';
      note.innerHTML = 'This is a <strong>shared result</strong>. <a href="/services/assessment.html" style="color:var(--accent)">Take the assessment yourself</a> for your full breakdown — it takes 2 minutes.';
      $('.asmt-meta-row').parentNode.insertBefore(note, $('.asmt-meta-row'));
    }

    // Panels
    qPanel.hidden = true;
    rPanel.hidden = false;
    nav.hidden = true;
    fill.style.width = '100%';
    rPanel.setAttribute('tabindex', '-1');
    try { rPanel.focus(); } catch (e) {}
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  }

  function finish() {
    var res = computeResult();
    var rec = recommend(res.score);
    track('assessment_complete', { score: res.score, rec: rec.recId });
    try {
      localStorage.setItem('vn_assessment_ctx', JSON.stringify({
        score: res.score,
        tier: rec.tier.id,
        tierLabel: rec.tier.label,
        recId: rec.recId,
        recName: PACKAGES[rec.recId].name,
        dims: res.dims,
        t: Date.now()
      }));
    } catch (e) {}
    renderResult(res, rec, {});
  }

  /* ── ROI calculator ────────────────────────────────────────────── */
  function pkgPriceUsd(id) {
    return { audit: 2000, starter: 10000, growth: 28000, enterprise: 20000 }[id] || 2000;
  }
  function updateRoi(recId) {
    var h = parseFloat($('#roiHours').value) || 0;
    var r = parseFloat($('#roiRate').value) || 0;
    var errCost = parseFloat($('#roiErrors').value) || 0;
    var cost = h * 52 * r + errCost;
    var lo = cost * 0.20, hi = cost * 0.40;
    var price = pkgPriceUsd(recId);
    var mid = (lo + hi) / 2;
    var pay;
    if (mid <= 0) pay = '—';
    else {
      var months = price / (mid / 12);
      pay = months <= 12 ? months.toFixed(1) + ' months' : (months / 12).toFixed(1) + ' years';
    }
    $('#roiCost').textContent = cost > 0 ? fmtUsd(cost) + ' / yr' : '—';
    $('#roiSave').innerHTML = cost > 0
      ? fmtUsd(lo) + ' – ' + '<em>' + fmtUsd(hi) + '</em> / yr'
      : '—';
    $('#roiPay').textContent = cost > 0 ? pay : '—';
  }

  /* ── Email report (Web3Forms, consent-gated) ───────────────────── */
  function sendReport(ctx) {
    var email = $('#asmtEmail').value.trim();
    var consent = $('#asmtConsent').checked;
    var status = $('#asmtEmailStatus');
    var btn = $('#asmtSend');

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      status.className = 'asmt-email-status err';
      status.textContent = 'That email address doesn\u2019t look right — mind checking it?';
      return;
    }
    if (!consent) {
      status.className = 'asmt-email-status err';
      status.textContent = 'Please tick the consent box so I know you actually want the report.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.className = 'asmt-email-status';
    status.textContent = '';

    var dimsLine = DIM_ORDER.map(function (d) {
      return DIMS[d].label + ' ' + (ctx.dims && ctx.dims[d] !== null && ctx.dims[d] !== undefined ? ctx.dims[d] : '—') + '/100';
    }).join(' · ');

    var key = (typeof window.VN_W3F_KEY === 'string' && window.VN_W3F_KEY) ? window.VN_W3F_KEY : '';
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: key,
        subject: 'Assessment lead — score ' + ctx.score + '/100 · ' + ctx.recName + ' recommended',
        from_name: 'victorndunda.com assessment',
        name: 'AI Readiness Assessment',
        email: email,
        message:
          'AI READINESS ASSESSMENT LEAD (victorndunda.com)\n' +
          'Score: ' + ctx.score + '/100 (' + ctx.tierLabel + ')\n' +
          'Recommended: ' + ctx.recName + '\n' +
          'Dimensions: ' + dimsLine + '\n' +
          'Visitor email: ' + email + ' (consented to follow-up)\n' +
          'Time: ' + new Date().toLocaleString() + '\n\n' +
          'Reply with the full report + suggested next steps.'
      })
    }).then(function (r) { return r.json(); })
      .then(function (j) {
        track('assessment_lead', { sent: !!(j && j.success), score: ctx.score });
        if (j && j.success) {
          btn.textContent = 'Report requested ✓';
          status.className = 'asmt-email-status ok';
          status.textContent = 'On its way — Victor will send the full report and follow-up suggestions to ' + email + '.';
        } else {
          btn.disabled = false;
          btn.textContent = 'Send me the report →';
          status.className = 'asmt-email-status err';
          status.textContent = 'The send failed' + (j && j.message ? ' (' + j.message + ')' : '') + '. You can book a call instead — the score is already attached to it.';
        }
      })
      .catch(function () {
        track('assessment_lead', { sent: false, score: ctx.score });
        btn.disabled = false;
        btn.textContent = 'Send me the report →';
        status.className = 'asmt-email-status err';
        status.textContent = 'Network error — try again, or book a call directly (your score travels with it).';
      });
  }

  /* ── Share / retake / print ────────────────────────────────────── */
  function shareUrl() {
    var ctx = readCtx();
    var u = new URL(location.href);
    u.search = '?r=' + ctx.score + '&tier=' + ctx.tier + '&rec=' + ctx.recId;
    return u.toString();
  }
  function readCtx() {
    try { return JSON.parse(localStorage.getItem('vn_assessment_ctx')) || null; } catch (e) { return null; }
  }

  /* ── Init ──────────────────────────────────────────────────────── */
  ready(function () {
    bootChrome();

    qPanel = $('#questionPanel');
    rPanel = $('#resultPanel');
    qMeta = $('#qMeta');
    qTitle = $('#qTitle');
    qSub = $('#qSub');
    qOptions = $('#qOptions');
    prog = $('#asmtProgress');
    fill = $('#progressFill');
    nav = $('#asmtNav');
    prevBtn = $('#wizPrev');
    skipBtn = $('#wizSkip');
    navInfo = $('#wizNavInfo');

    if (skipBtn) skipBtn.hidden = true; // every question requires an honest pick

    // Shared-result mode: ?r=<score>&tier=<id>&rec=<pkg>
    var params = new URLSearchParams(location.search);
    var r = parseInt(params.get('r') || '', 10);
    if (!isNaN(r) && r >= 0 && r <= 100) {
      state.shared = true;
      var tierId = params.get('tier') || 'explorer';
      var tier = TIERS.filter(function (t) { return t.id === tierId; })[0] || tierFor(r);
      var recId = params.get('rec');
      if (!PACKAGES[recId]) recId = recommend(r).recId;
      var res = { score: r, dims: { data: null, pain: null, team: null, goal: null } };
      prog.hidden = true;
      renderResult(res, { tier: tier, recId: recId, bridging: null }, { shared: true });
      return;
    }

    prog.hidden = false; // questions are live — show the slim progress bar
    renderQuestion();

    prevBtn.addEventListener('click', function () {
      if (state.i > 0) { state.i -= 1; renderQuestion(); }
    });

    // Keyboard: 1–4 picks an option
    document.addEventListener('keydown', function (e) {
      if (qPanel.hidden) return;
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        var btns = qOptions.querySelectorAll('.wiz-option');
        if (btns[n - 1]) btns[n - 1].click();
      }
    });

    // ROI live updates
    ['roiHours', 'roiRate', 'roiErrors'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        var ctx = readCtx();
        updateRoi(ctx ? ctx.recId : 'audit');
      });
    });

    // Email report
    var sendBtn = $('#asmtSend');
    if (sendBtn) sendBtn.addEventListener('click', function () {
      var ctx = readCtx();
      if (!ctx) return;
      sendReport(ctx);
    });

    // Retake
    var retake = $('#btnRetake');
    if (retake) retake.addEventListener('click', function () {
      state.i = 0;
      state.answers = new Array(QUESTIONS.length).fill(null);
      state.shared = false;
      rPanel.hidden = true;
      qPanel.hidden = false;
      nav.hidden = false;
      prog.hidden = false;
      // Remove any shared-note added earlier
      var note = document.querySelector('.asmt-shared-note');
      if (note) note.remove();
      $('#emailBlock').hidden = false;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });

    // Share
    var share = $('#btnShare');
    if (share) share.addEventListener('click', function () {
      var url = shareUrl();
      if (!url) return;
      track('assessment_share', {});
      if (navigator.share) {
        navigator.share({ title: 'AI Readiness Assessment', text: 'I scored ' + (readCtx() ? readCtx().score : '') + '/100 on this AI readiness assessment.', url: url }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          share.textContent = '✓ Link copied';
          window.setTimeout(function () { share.textContent = '↗ Share this score'; }, 2200);
        }).catch(function () {});
      }
    });

    // Print
    var printBtn = $('#btnPrint');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
  });
})();
