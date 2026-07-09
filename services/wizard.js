/* Victor Ndunda — Project Scope Wizard
   - Multi-step flow (6 steps)
   - Intelligent package recommendation engine (rules-based scoring)
   - Price estimation with timeline multiplier
   - Saves brief to localStorage (vn_client_briefs)
   - Generates draft contract link + payment plan
   - No backend — fully client-side
*/
(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────
  var state = {
    step: 1,
    goal: null,           // automate | insights | product | research | train
    types: new Set(),     // chatbots | rag | predictive | computer-vision | automation | multilingual | agriculture | multi-agent
    scale: null,          // solo | smb | midmarket | enterprise
    budget: null,         // under-3k | 3k-10k | 10k-30k | 30k-plus | equity | unsure
    timeline: null,       // asap | month | quarter | flexible
    details: { name: '', email: '', company: '', phone: '', industry: '', description: '', consent: false }
  };

  var TOTAL_STEPS = 6;
  var STORAGE_KEY = 'vn_client_briefs';

  // ── Package data (mirrors services/data.json) ─────────────────────
  var PACKAGES = {
    audit: {
      id: 'audit', name: 'AI Audit', icon: '🔍', color: '#64748b',
      priceUsd: 4500, priceKes: 350000, monthlyUsd: 0, monthlyKes: 0,
      timeline: '1–2 weeks',
      features: ['Current-state assessment','Opportunity map (5–10 ranked use cases)','Quick-win pilot plan','Make-vs-buy recommendation','Risk + compliance review','Executive readout + 12-month roadmap']
    },
    starter: {
      id: 'starter', name: 'AI Starter', icon: '🚀', color: '#10b981',
      priceUsd: 2500, priceKes: 200000, monthlyUsd: 350, monthlyKes: 28000,
      timeline: '2–3 weeks',
      features: ['WhatsApp or web FAQ chatbot','1 automation workflow','Knowledge base (50 docs)','Basic analytics dashboard','Multilingual (EN + SW)','2 revisions + 30 days support']
    },
    growth: {
      id: 'growth', name: 'AI Growth', icon: '📈', color: '#00d4ff',
      priceUsd: 14000, priceKes: 1100000, monthlyUsd: 3000, monthlyKes: 240000,
      timeline: '4–8 weeks',
      features: ['Production AI integrated with CRM/ERP','Multi-agent orchestration','RAG with citations','Analytics + dashboard','Team training (1 session)','3 revisions + 90 days support']
    },
    enterprise: {
      id: 'enterprise', name: 'AI Enterprise', icon: '🏢', color: '#a855f7',
      priceUsd: 50000, priceKes: 3900000, monthlyUsd: 10000, monthlyKes: 800000,
      timeline: '8–16 weeks',
      features: ['Custom multi-agent system (50+ agents)','Fine-tuned models','SLAs + 24/7 monitoring','Security + compliance review','Dedicated engineer','Unlimited revisions + 12 months support']
    }
  };

  // ── Service price add-ons (per-service fromPrice) ─────────────────
  var SERVICE_PRICES = {
    chatbots: { usd: 1500, kes: 120000 },
    rag: { usd: 4000, kes: 320000 },
    predictive: { usd: 6000, kes: 480000 },
    'computer-vision': { usd: 8000, kes: 640000 },
    automation: { usd: 3500, kes: 280000 },
    multilingual: { usd: 2000, kes: 160000 },
    agriculture: { usd: 7000, kes: 560000 },
    'multi-agent': { usd: 25000, kes: 2000000 }
  };

  var TIMELINE_MULT = { asap: 1.5, month: 1.0, quarter: 0.92, flexible: 0.85 };

  // ── DOM helpers ───────────────────────────────────────────────────
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }

  // ── Recommendation engine ─────────────────────────────────────────
  // Scores each package 0–100 based on state. Returns { packageId, score, why }
  function recommend() {
    var scores = { audit: 0, starter: 0, growth: 0, enterprise: 0 };
    var reasons = { audit: [], starter: [], growth: [], enterprise: [] };

    // Goal scoring
    if (state.goal === 'research') { scores.audit += 50; reasons.audit.push('You want to explore AI before building — an audit is the right start.'); }
    if (state.goal === 'automate') { scores.starter += 30; reasons.starter.push('Automation fits the Starter package perfectly.'); }
    if (state.goal === 'insights') { scores.growth += 30; reasons.growth.push('Data insights typically need the Growth package with real statistical models.'); }
    if (state.goal === 'product') { scores.growth += 25; scores.enterprise += 15; reasons.growth.push('Building a customer-facing AI product fits the Growth tier.'); }
    if (state.goal === 'train') { scores.audit += 20; scores.starter += 15; reasons.audit.push('Training pairs well with an audit to identify the highest-ROI topics.'); }

    // Scale scoring
    if (state.scale === 'solo') { scores.starter += 35; reasons.starter.push('Solo/micro-business — the Starter package is sized for you.'); }
    if (state.scale === 'smb') { scores.starter += 20; scores.growth += 25; reasons.growth.push('Small business with real data — Growth gives you production AI.'); }
    if (state.scale === 'midmarket') { scores.growth += 35; scores.enterprise += 15; reasons.growth.push('Mid-market — Growth is the sweet spot for integrated production AI.'); }
    if (state.scale === 'enterprise') { scores.enterprise += 50; scores.growth += 10; reasons.enterprise.push('Enterprise scale — the Enterprise package handles your SLA and security needs.'); }

    // Type scoring
    if (state.types.has('multi-agent')) { scores.enterprise += 40; scores.growth += 10; reasons.enterprise.push('Multi-agent systems are enterprise-grade by nature.'); }
    if (state.types.has('computer-vision')) { scores.growth += 15; scores.enterprise += 10; }
    if (state.types.has('predictive')) { scores.growth += 15; }
    if (state.types.has('agriculture')) { scores.growth += 15; }
    if (state.types.has('chatbots') && state.types.size === 1) { scores.starter += 20; }
    if (state.types.has('rag') && state.types.size === 1) { scores.starter += 10; scores.growth += 10; }
    if (state.types.size >= 4) { scores.enterprise += 20; scores.growth += 10; reasons.enterprise.push('You need ' + state.types.size + ' AI capabilities — that\'s an enterprise-grade scope.'); }

    // Budget scoring
    if (state.budget === 'under-3k') { scores.audit += 25; scores.starter += 30; reasons.starter.push('Your budget matches the Starter package.'); }
    if (state.budget === '3k-10k') { scores.starter += 25; scores.growth += 15; }
    if (state.budget === '10k-30k') { scores.growth += 35; reasons.growth.push('Your budget range aligns with the Growth package.'); }
    if (state.budget === '30k-plus') { scores.enterprise += 40; reasons.enterprise.push('Your budget supports the Enterprise package.'); }
    if (state.budget === 'equity') { scores.audit += 15; scores.starter += 20; reasons.starter.push('Equity-for-services is available for the Starter and Audit tiers.'); }
    if (state.budget === 'unsure') { scores.audit += 10; }

    // Timeline scoring
    if (state.timeline === 'asap') {
      scores.audit += 10; scores.starter += 15;
      reasons.starter.push('Rush timeline — Starter and Audit ship fastest (1–3 weeks).');
    }
    if (state.timeline === 'quarter' || state.timeline === 'flexible') {
      scores.growth += 10; scores.enterprise += 10;
      reasons.growth.push('Flexible timeline unlocks the Growth package (and a 15% discount).');
    }

    // Cap scores at 100
    Object.keys(scores).forEach(function (k) { scores[k] = Math.min(100, scores[k]); });

    // Pick the winner
    var winner = 'growth';
    var maxScore = -1;
    Object.keys(scores).forEach(function (k) {
      if (scores[k] > maxScore) { maxScore = scores[k]; winner = k; }
    });

    return {
      packageId: winner,
      score: scores[winner],
      scores: scores,
      why: reasons[winner].slice(0, 2).join(' ')
    };
  }

  // ── Price estimation ──────────────────────────────────────────────
  function estimate() {
    var pkg = PACKAGES[state._recommended || recommend().packageId];
    var mult = TIMELINE_MULT[state.timeline] || 1.0;
    var baseUsd = pkg.priceUsd;
    var baseKes = pkg.priceKes;

    // Add service add-ons (capped to avoid exceeding enterprise)
    var addonUsd = 0, addonKes = 0;
    if (pkg.id !== 'enterprise') {
      state.types.forEach(function (t) {
        if (SERVICE_PRICES[t]) {
          addonUsd += SERVICE_PRICES[t].usd;
          addonKes += SERVICE_PRICES[t].kes;
        }
      });
      // Cap add-ons at 60% of base for non-enterprise
      addonUsd = Math.min(addonUsd, baseUsd * 0.6);
      addonKes = Math.min(addonKes, baseKes * 0.6);
    }

    var totalUsd = Math.round((baseUsd + addonUsd) * mult);
    var totalKes = Math.round((baseKes + addonKes) * mult / 1000) * 1000;
    var monthlyUsd = pkg.monthlyUsd;
    var monthlyKes = pkg.monthlyKes;

    return {
      package: pkg,
      baseUsd: baseUsd, baseKes: baseKes,
      addonUsd: addonUsd, addonKes: addonKes,
      totalUsd: totalUsd, totalKes: totalKes,
      monthlyUsd: monthlyUsd, monthlyKes: monthlyKes,
      timeline: pkg.timeline,
      timelineMult: mult,
      timelineLabel: { asap: 'Rush (+50%)', month: 'Standard', quarter: 'This quarter (−8%)', flexible: 'Flexible (−15%)' }[state.timeline] || 'Standard'
    };
  }

  // ── Save brief to localStorage ────────────────────────────────────
  function saveBrief(recom, est) {
    var brief = {
      id: 'brief-' + Date.now(),
      createdAt: new Date().toISOString(),
      state: {
        goal: state.goal,
        types: Array.from(state.types),
        scale: state.scale,
        budget: state.budget,
        timeline: state.timeline
      },
      details: state.details,
      recommendation: { packageId: recom.packageId, score: recom.score, why: recom.why },
      estimate: {
        packageId: est.package.id,
        packageName: est.package.name,
        totalUsd: est.totalUsd, totalKes: est.totalKes,
        monthlyUsd: est.monthlyUsd, monthlyKes: est.monthlyKes,
        timeline: est.timeline
      }
    };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      arr.push(brief);
      if (arr.length > 20) arr = arr.slice(-20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) { /* ignore */ }
    return brief;
  }

  // ── Render result modal ───────────────────────────────────────────
  function showResult() {
    var recom = recommend();
    state._recommended = recom.packageId;
    var est = estimate();
    var pkg = est.package;

    var featureHtml = pkg.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');

    var html =
      '<div class="wiz-result-eyebrow"><span class="pulse-dot"></span> Recommendation ready · ' + recom.score + '% match</div>' +
      '<h2 class="wiz-result-title">Your recommended package: ' + pkg.name + '</h2>' +
      '<p class="wiz-result-sub">' + (recom.why || 'Based on your answers, this is the best fit for your goals, scale, and budget.') + '</p>' +

      '<div class="wiz-recommendation" style="border-left-color:' + pkg.color + '">' +
        '<div class="wiz-recom-label">Recommended package</div>' +
        '<div class="wiz-recom-name">' + pkg.icon + ' ' + pkg.name + '</div>' +
        '<div class="wiz-recom-why">' + (pkg.id === 'enterprise'
          ? 'Custom quote — typical build $25K–$100K+, $5K–$20K/mo. Final price scoped after a discovery call.'
          : 'One-time build + optional monthly support. The estimate below is indicative — final quote confirmed in your discovery call.') + '</div>' +
        '<div class="wiz-recom-price">' + (pkg.id === 'enterprise'
          ? 'Custom · $25K–$100K+'
          : '$' + est.totalUsd.toLocaleString() + ' · KES ' + est.totalKes.toLocaleString() + (est.monthlyUsd ? ' + $' + est.monthlyUsd + '/mo' : '')) + '</div>' +
      '</div>' +

      '<div class="wiz-estimate-grid">' +
        '<div class="wiz-estimate-cell"><div class="wiz-estimate-label">Timeline</div><div class="wiz-estimate-value">' + est.timeline + '</div></div>' +
        '<div class="wiz-estimate-cell"><div class="wiz-estimate-label">Timeline mode</div><div class="wiz-estimate-value">' + est.timelineLabel + '</div></div>' +
        '<div class="wiz-estimate-cell"><div class="wiz-estimate-label">AI capabilities</div><div class="wiz-estimate-value">' + state.types.size + ' selected</div></div>' +
        '<div class="wiz-estimate-cell"><div class="wiz-estimate-label">Match score</div><div class="wiz-estimate-value">' + recom.score + '%</div></div>' +
      '</div>' +

      '<div class="wiz-features">' +
        '<div class="wiz-features-title">What\'s included</div>' +
        '<ul>' + featureHtml + '</ul>' +
      '</div>' +

      '<div class="wiz-features">' +
        '<div class="wiz-features-title">Alternative packages</div>' +
        '<div style="display:flex;gap:0.6rem;flex-wrap:wrap">' +
          Object.keys(PACKAGES).filter(function (k) { return k !== pkg.id; }).map(function (k) {
            var p = PACKAGES[k];
            var s = recom.scores[k];
            return '<a href="/services/#packages-section" style="flex:1;min-width:120px;padding:0.875rem;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:inherit;transition:all 0.2s" onmouseover="this.style.borderColor=\'' + p.color + '\'" onmouseout="this.style.borderColor=\'var(--border)\'">' +
                   '<div style="font-size:1.25rem">' + p.icon + '</div>' +
                   '<div style="font-weight:700;font-size:0.875rem;margin-top:0.25rem">' + p.name + '</div>' +
                   '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.15rem">' + s + '% match</div>' +
                   '</a>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="wiz-result-actions">' +
        '<a href="/services/contract.html?brief=' + (state._briefId || '') + '" class="btn btn-primary" id="resultContract">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          'Generate Contract' +
        '</a>' +
        '<a href="/services/payment.html?brief=' + (state._briefId || '') + '" class="btn btn-ghost" id="resultPay">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' +
          'See Payment Plan' +
        '</a>' +
        '<a href="/services/client-dashboard.html" class="btn btn-ghost" id="resultDashboard">' +
          'Save & View Later →' +
        '</a>' +
      '</div>' +

      '<p class="wiz-save-note">Your brief is saved in your browser. No data leaves your device until you proceed.</p>';

    $('#resultContent').innerHTML = html;
    $('#resultOverlay').hidden = false;
    document.body.style.overflow = 'hidden';

    // Save brief now (with the generated ID)
    var brief = saveBrief(recom, est);
    state._briefId = brief.id;
    // Update the action links with the brief ID
    var c = $('#resultContract'); if (c) c.href = '/services/contract.html?brief=' + brief.id;
    var p = $('#resultPay'); if (p) p.href = '/services/payment.html?brief=' + brief.id;
  }

  function closeResult() {
    $('#resultOverlay').hidden = true;
    document.body.style.overflow = '';
  }

  // ── Step navigation ───────────────────────────────────────────────
  function goToStep(n) {
    if (n < 1 || n > TOTAL_STEPS) return;
    // Validate current step before going forward
    if (n > state.step) {
      if (!validateStep(state.step)) return;
    }
    state.step = n;
    $$('.wiz-step-panel').forEach(function (p) {
      p.classList.toggle('active', parseInt(p.dataset.step) === n);
      p.hidden = parseInt(p.dataset.step) !== n;
    });
    updateProgress();
    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(step) {
    if (step === 1 && !state.goal) {
      flashError('Please pick a goal to continue.');
      return false;
    }
    if (step === 2 && state.types.size === 0) {
      flashError('Pick at least one AI capability.');
      return false;
    }
    if (step === 3 && !state.scale) {
      flashError('Pick your organization\'s scale.');
      return false;
    }
    if (step === 4 && !state.budget) {
      flashError('Pick a budget range.');
      return false;
    }
    if (step === 5 && !state.timeline) {
      flashError('Pick a timeline.');
      return false;
    }
    if (step === 6) {
      var d = state.details;
      if (!d.name || !d.email || !d.consent) {
        flashError('Please fill in your name, email, and consent.');
        return false;
      }
    }
    return true;
  }

  function flashError(msg) {
    var existing = document.querySelector('.wiz-flash');
    if (existing) existing.remove();
    var f = document.createElement('div');
    f.className = 'wiz-flash';
    f.style.cssText = 'position:fixed;top:5rem;left:50%;transform:translateX(-50%);background:var(--bg-elev);border:1px solid #ef4444;color:#fca5a5;padding:0.75rem 1.25rem;border-radius:10px;font-size:0.875rem;z-index:1100;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:wizFadeIn 0.3s var(--ease)';
    f.textContent = msg;
    document.body.appendChild(f);
    setTimeout(function () {
      f.style.opacity = '0';
      f.style.transition = 'opacity 0.3s';
      setTimeout(function () { f.remove(); }, 300);
    }, 2500);
  }

  function updateProgress() {
    var pct = (state.step / TOTAL_STEPS) * 100;
    $('#progressFill').style.width = pct + '%';
    $('#progressSteps').setAttribute('aria-valuenow', state.step);
    $$('#progressSteps .wiz-step').forEach(function (s) {
      var n = parseInt(s.dataset.step);
      s.classList.toggle('active', n === state.step);
      s.classList.toggle('done', n < state.step);
    });
  }

  function updateNav() {
    $('#wizPrev').disabled = state.step === 1;
    $('#wizNavInfo').textContent = 'Step ' + state.step + ' of ' + TOTAL_STEPS;
    $('#wizNext').textContent = state.step === TOTAL_STEPS ? 'Get my recommendation →' : 'Continue →';
  }

  // ── Wire up events ────────────────────────────────────────────────
  function wireOptions() {
    // Single-select options (steps 1, 3, 4, 5)
    $$('.wiz-step-panel').forEach(function (panel) {
      var step = parseInt(panel.dataset.step);
      if (step === 2) return; // multi-select handled below
      panel.querySelectorAll('.wiz-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          panel.querySelectorAll('.wiz-option').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          var key = ['goal', null, 'scale', 'budget', 'timeline', null][step - 1];
          if (key) state[key] = btn.dataset[key];
          // Auto-advance after a short delay
          setTimeout(function () {
            if (state.step < TOTAL_STEPS) goToStep(state.step + 1);
          }, 350);
        });
      });
    });

    // Multi-select (step 2 — types)
    var step2 = $('#step2');
    if (step2) {
      step2.querySelectorAll('.wiz-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var t = btn.dataset.type;
          if (state.types.has(t)) {
            state.types.delete(t);
            btn.classList.remove('selected');
          } else {
            state.types.add(t);
            btn.classList.add('selected');
          }
        });
      });
    }
  }

  function wireForm() {
    var fields = ['name', 'email', 'company', 'phone', 'industry'];
    fields.forEach(function (f) {
      var el = document.getElementById('wf-' + f);
      if (el) {
        el.addEventListener('input', function () {
          state.details[f] = el.value;
        });
      }
    });
    var desc = $('#wf-desc');
    if (desc) {
      desc.addEventListener('input', function () { state.details.description = desc.value; });
    }
    var consent = $('#wf-consent');
    if (consent) {
      consent.addEventListener('change', function () { state.details.consent = consent.checked; });
    }
  }

  function wireNav() {
    $('#wizNext').addEventListener('click', function () {
      if (state.step === TOTAL_STEPS) {
        if (validateStep(state.step)) {
          showResult();
        }
      } else {
        goToStep(state.step + 1);
      }
    });
    $('#wizPrev').addEventListener('click', function () {
      goToStep(state.step - 1);
    });
    $('#resultClose').addEventListener('click', closeResult);
    $('#resultOverlay').addEventListener('click', function (e) {
      if (e.target === this) closeResult();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#resultOverlay').hidden) closeResult();
    });
  }

  // ── Theme + nav (inline bootstrap, mirrors services/index.html) ──
  function bootstrapTheme() {
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
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    bootstrapTheme();
    wireOptions();
    wireForm();
    wireNav();
    updateProgress();
    updateNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
