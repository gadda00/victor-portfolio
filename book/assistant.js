/* ═══════════════════════════════════════════════════════════════════
   Enquiry Assistant — /book/
   Instant answers + estimates from published rates (services/data.json).
   Deterministic intent engine: no external AI calls, no API keys, no
   cookies — everything runs in the visitor's browser.
   Handoffs: Cal.com (schedule tab), Web3Forms (message form), WhatsApp.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WA_NUMBER = '254724346971';
  var WA_BASE = 'https://wa.me/' + WA_NUMBER;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Published data (fallback if /services/data.json fetch fails) ── */
  var FALLBACK = {
    packages: [
      { id: 'audit', name: 'AI Audit', price: { usdOneTime: 4500, kesOneTime: 350000 }, timeline: '1–2 weeks' },
      { id: 'starter', name: 'AI Starter', price: { usdOneTime: 2500, kesOneTime: 200000, usdMonthly: 350, kesMonthly: 28000 }, timeline: '2–3 weeks' },
      { id: 'growth', name: 'AI Growth', price: { usdOneTime: 14000, kesOneTime: 1100000, usdMonthly: 3000, kesMonthly: 240000 }, timeline: '6–10 weeks' },
      { id: 'enterprise', name: 'AI Enterprise', price: { usdOneTime: 'Custom', kesOneTime: 'Custom' }, timeline: '12–24 weeks' }
    ],
    services: [
      { id: 'chatbots', name: 'AI Chatbots & Virtual Assistants', fromPrice: { usd: 1500, kes: 120000 } },
      { id: 'rag', name: 'RAG Knowledge Systems', fromPrice: { usd: 4000, kes: 320000 } },
      { id: 'document-ai', name: 'Document AI & OCR', fromPrice: { usd: 3000, kes: 240000 } },
      { id: 'computer-vision', name: 'Computer Vision', fromPrice: { usd: 8000, kes: 650000 } },
      { id: 'predictive', name: 'Predictive Analytics & Forecasting', fromPrice: { usd: 5000, kes: 400000 } },
      { id: 'automation', name: 'AI Automation & Workflows', fromPrice: { usd: 2500, kes: 200000 } },
      { id: 'fine-tuning', name: 'LLM Fine-Tuning & Customization', fromPrice: { usd: 12000, kes: 950000 } },
      { id: 'voice-ai', name: 'Voice AI & Speech', fromPrice: { usd: 6000, kes: 480000 } },
      { id: 'multilingual', name: 'Multilingual AI (Swahili & Local)', fromPrice: { usd: 3500, kes: 280000 } },
      { id: 'agriculture', name: 'AI for Agriculture', fromPrice: { usd: 8000, kes: 650000 } },
      { id: 'strategy', name: 'AI Strategy & Training', fromPrice: { usd: 2000, kes: 160000 } },
      { id: 'smb', name: 'AI for Small Business', fromPrice: { usd: 1500, kes: 120000 } }
    ]
  };

  var DATA = null; // populated by load()
  var estimate = null; // active estimate flow state

  /* ── DOM ─────────────────────────────────────────────────────────── */
  var log, chipsBox, form, field;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function track(name) {
    try { (window.__vnEvents = window.__vnEvents || []).push({ t: Date.now(), e: name }); } catch (e) { /* private, no network */ }
  }

  /* ── Rendering ───────────────────────────────────────────────────── */
  function addUser(text) {
    log.appendChild(el('div', 'msg user', esc(text)));
    scrollLog();
  }
  function addBot(html, opts) {
    opts = opts || {};
    var m = el('div', 'msg bot', html);
    if (opts.assumptions) {
      var ul = el('ul', 'msg-assumptions');
      opts.assumptions.forEach(function (a) { ul.appendChild(el('li', null, a)); });
      m.appendChild(ul);
    }
    if (opts.actions) {
      var row = el('div', 'msg-actions');
      opts.actions.forEach(function (a) {
        var n;
        if (a.href) {
          n = el('a', a.primary ? 'primary' : null);
          n.href = a.href;
          if (a.newTab) { n.target = '_blank'; n.rel = 'noopener noreferrer'; }
        } else {
          n = el('button', a.primary ? 'primary' : null);
          n.type = 'button';
          n.addEventListener('click', a.onClick);
        }
        n.innerHTML = a.label;
        if (a.track) n.setAttribute('data-track', a.track);
        row.appendChild(n);
      });
      m.appendChild(row);
    }
    log.appendChild(m);
    scrollLog();
  }
  function setChips(list) {
    chipsBox.innerHTML = '';
    (list || []).forEach(function (c) {
      var b = el('button', 'chip', esc(c.label));
      b.type = 'button';
      b.addEventListener('click', function () { handle(c.value !== undefined ? c.value : c.label, c.label); });
      chipsBox.appendChild(b);
    });
  }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function botReply(html, opts, chips) {
    if (REDUCED) { addBot(html, opts); setChips(chips); return; }
    var t = el('div', 'msg bot typing', '<span></span><span></span><span></span>');
    log.appendChild(t); scrollLog();
    setTimeout(function () { t.remove(); addBot(html, opts); setChips(chips); }, 420);
  }

  /* ── Handoffs ────────────────────────────────────────────────────── */
  function waLink(text) { return WA_BASE + '?text=' + encodeURIComponent(text); }
  function goTab(name) {
    var tab = document.querySelector('.book-tab[data-tab="' + name + '"]');
    if (tab) { tab.click(); tab.closest('.book-options')?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); }
  }
  function prefillForm(summary) {
    var msgField = document.getElementById('qf-message');
    if (msgField) msgField.value = summary;
    goTab('form');
    setTimeout(function () { document.getElementById('qf-name')?.focus(); }, REDUCED ? 0 : 500);
  }

  function estimateSummary() {
    if (!estimate || !estimate.result) return '';
    var r = estimate.result;
    return 'Estimate request (from the booking page assistant):\n' +
      '- Service: ' + r.service + '\n' +
      '- Volume: ' + r.volume + '\n' +
      '- Integrations: ' + r.integrations + '\n' +
      '- Languages: ' + r.languages + '\n' +
      '- Ballpark: ' + r.range + '\n' +
      'A few more details: ';
  }

  /* ── Package answers ─────────────────────────────────────────────── */
  function money(n, cur) {
    if (typeof n !== 'number') return String(n);
    return cur === 'usd' ? '$' + n.toLocaleString('en-US') : 'KES ' + n.toLocaleString('en-US');
  }
  function pkgLine(p) {
    var pr = p.price || {};
    var one = pr.usdOneTime !== undefined ? money(pr.usdOneTime, 'usd') + (typeof pr.usdOneTime === 'number' ? ' / ' + money(pr.kesOneTime, 'kes') : '') : '';
    var mo = pr.usdMonthly ? ' + ' + money(pr.usdMonthly, 'usd') + '/mo' : '';
    var tl = p.timeline ? ' · ' + p.timeline : '';
    return '<strong>' + esc(p.name) + '</strong> — ' + one + mo + tl;
  }
  function packagesAnswer() {
    var lines = (DATA.packages || []).map(function (p) { return '<li>' + pkgLine(p) + '</li>'; }).join('');
    botReply(
      'Four published packages (USD / KES):<ul class="msg-assumptions">' + lines + '</ul>' +
      'For custom systems, my per-service rates start at <strong>$1,500 (chatbots)</strong> up to <strong>$12,000 (LLM fine-tuning)</strong> — want a ballpark for your case?',
      { actions: [
        { label: 'Get my estimate →', primary: true, onClick: startEstimate, track: 'assistant-estimate-pkg' },
        { label: 'See all services', href: '/services/', newTab: false }
      ] },
      DEFAULT_CHIPS
    );
  }

  /* ── Estimate flow ───────────────────────────────────────────────── */
  function startEstimate() {
    estimate = { step: 'service', volume: null, integrations: null, languages: null, service: null };
    var cats = (DATA.services || []).slice(0, 8).map(function (s) {
      return { label: s.name.replace(/ &.*$/, ''), value: 'est:' + s.id };
    });
    botReply('Sure — three quick questions. <strong>First: what are you exploring?</strong>',
      { actions: [{ label: 'Not sure yet', onClick: function () { handle('not sure'); }, track: 'assistant-estimate-unsure' }] },
      cats.concat([{ label: 'More services…', value: 'est:more' }]));
  }

  function estMore() {
    var rest = (DATA.services || []).slice(8).map(function (s) {
      return { label: s.name.replace(/ &.*$/, ''), value: 'est:' + s.id };
    });
    botReply('Remaining catalogue services:', null, rest.concat([{ label: '← Back', value: 'estimate' }]));
  }

  function pickService(id) {
    var s = null;
    (DATA.services || []).forEach(function (x) { if (x.id === id) s = x; });
    if (!s) { startEstimate(); return; }
    estimate.service = s;
    estimate.step = 'volume';
    botReply('Got it — <strong>' + esc(s.name) + '</strong>. How much volume will it handle?',
      null,
      [{ label: 'Under 500 users/docs a month', value: 'est:vol:0' },
       { label: '500–5,000', value: 'est:vol:1' },
       { label: '5,000+', value: 'est:vol:2' }]);
  }

  function pickVolume(i) {
    estimate.volume = ['Under 500 / month', '500–5,000 / month', '5,000+ / month'][i];
    estimate.volMult = [1, 1.3, 1.8][i];
    estimate.step = 'integrations';
    botReply('How many systems should it connect to (CRM, email, ERP, WhatsApp…)?',
      null,
      [{ label: '1–2', value: 'est:int:0' }, { label: '3–5', value: 'est:int:1' }, { label: '6+', value: 'est:int:2' }]);
  }

  function pickIntegrations(i) {
    estimate.integrations = ['1–2 systems', '3–5 systems', '6+ systems'][i];
    estimate.intMult = [1, 1.25, 1.5][i];
    estimate.step = 'languages';
    botReply('Last one — which languages does it need to work in?',
      null,
      [{ label: 'English only', value: 'est:lang:0' }, { label: 'English + Swahili or French', value: 'est:lang:1' }]);
  }

  function finishEstimate(i) {
    estimate.languages = i === 0 ? 'English only' : 'English + Swahili/French';
    estimate.langMult = i === 0 ? 1 : 1.2;

    var base = estimate.service.fromPrice || {};
    var usdLow = Math.round((base.usd * estimate.volMult * estimate.intMult * estimate.langMult) / 100) * 100;
    var kesLow = Math.round((base.kes * estimate.volMult * estimate.intMult * estimate.langMult) / 5000) * 5000;
    var usdHigh = Math.round((usdLow * 1.4) / 100) * 100;
    var kesHigh = Math.round((kesLow * 1.4) / 5000) * 5000;

    estimate.result = {
      service: estimate.service.name,
      volume: estimate.volume,
      integrations: estimate.integrations,
      languages: estimate.languages,
      range: '$' + usdLow.toLocaleString('en-US') + '–$' + usdHigh.toLocaleString('en-US') + ' (KES ' + kesLow.toLocaleString('en-US') + '–' + kesHigh.toLocaleString('en-US') + ')'
    };
    track('assistant-estimate-complete');

    botReply(
      '<strong>Ballpark: $' + usdLow.toLocaleString('en-US') + '–$' + usdHigh.toLocaleString('en-US') + ' · KES ' + kesLow.toLocaleString('en-US') + '–' + kesHigh.toLocaleString('en-US') + '</strong> for ' + esc(estimate.service.name) + '.',
      {
        assumptions: [
          'Starting from my published rate of ' + money(base.usd, 'usd') + ' / ' + money(base.kes, 'kes'),
          'Volume: ' + estimate.volume,
          'Integrations: ' + estimate.integrations,
          'Languages: ' + estimate.languages,
          'The exact quote comes out of the free assessment — scoped in writing before any build.'
        ],
        actions: [
          { label: '📅 Book the free assessment', primary: true, onClick: function () { track('assistant-cta-book'); goTab('schedule'); }, track: 'assistant-cta-book' },
          { label: '💬 Continue on WhatsApp', href: waLink('Hi Victor — I got an estimate on your site for ' + estimate.service.name + ' (' + estimate.result.range + '). Can we talk it through?'), newTab: true, track: 'assistant-cta-whatsapp' },
          { label: '📧 Send this as a brief', onClick: function () { track('assistant-cta-brief'); prefillForm(estimateSummary()); }, track: 'assistant-cta-brief' }
        ]
      },
      DEFAULT_CHIPS
    );
  }

  /* ── Intent engine ───────────────────────────────────────────────── */
  function has(text, words) {
    return words.some(function (w) { return text.indexOf(w) !== -1; });
  }

  var DEFAULT_CHIPS = [
    { label: '💰 Get a price estimate', value: 'estimate' },
    { label: '🕐 How long does a build take?', value: 'timeline' },
    { label: '🛠️ How do you work?', value: 'process' },
    { label: '🌍 Swahili / multilingual?', value: 'swahili' },
    { label: '💬 Talk to Victor on WhatsApp', value: 'whatsapp' }
  ];

  function answer(text) {
    var t = text.toLowerCase();

    if (has(t, ['price', 'cost', 'estimate', 'how much', 'rate', 'fee', 'budget', 'charge', 'pricing', 'quote'])) { packagesAnswer(); return; }
    if (has(t, ['estimate'])) { startEstimate(); return; }
    if (has(t, ['how long', 'timeline', 'duration', 'when can', 'how fast', 'how quick', 'delivery', 'weeks', 'months'])) {
      botReply('Published timelines: <strong>AI Audit 1–2 weeks</strong> · <strong>AI Starter 2–3 weeks</strong> · <strong>AI Growth 6–10 weeks</strong> · <strong>Enterprise 12–24 weeks</strong>. Custom builds scale with scope — we agree the timeline in writing before starting.',
        { actions: [{ label: '📅 Book the free assessment', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-tl' }] }, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['how do you work', 'process', 'engagement', 'steps', 'what happens', 'methodology', 'how it works'])) {
      botReply('Three stages: <strong>Diagnose</strong> — the free 30-minute assessment plus optional audit: workflow map, data readiness, build/no-build call. <strong>Prove</strong> — a scoped sprint with an evaluation suite and observability, so quality is measured, not assumed. <strong>Ship</strong> — production handover with docs, monitoring, and a path for what comes next.',
        { actions: [{ label: 'Read the engagement model', href: '/#engagement', track: 'assistant-cta-process' }] }, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['swahili', 'multilingual', 'language', 'french', 'kiswahili'])) {
      botReply('Yes — multilingual AI is a published service (from <strong>$3,500 / KES 280K</strong>). Shipped products run in <strong>English · Français · Kiswahili</strong>, and I build for low-bandwidth and offline contexts.');
      return;
    }
    if (has(t, ['where', 'located', 'based', 'remote', 'nairobi', 'kenya'])) {
      botReply('I\'m based in <strong>Nairobi, Kenya</strong> and work with clients <strong>remotely</strong> across time zones — published service areas cover Kenya, East Africa, and international remote work.');
      return;
    }
    if (has(t, ['assessment', 'free call', 'what happens on the call', 'first call', 'consult'])) {
      botReply('The free 30 minutes: <strong>0–10 min</strong> your context (workflow, users, constraint) · <strong>10–20 min</strong> where AI fits and what data you\'d need · <strong>20–30 min</strong> build/no-build view and the smallest useful first step. Useful whether or not we work together.',
        { actions: [{ label: '📅 Pick a time', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-agenda' }] }, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['tech', 'stack', 'tools', 'technolog', 'framework', 'langchain', 'llm'])) {
      botReply('Core stack: <strong>Python + TypeScript</strong>, LangChain/LangGraph/CrewAI for agents, RAG with pgvector/Pinecone, TFLite for on-device ML, Next.js frontends, PostgreSQL. Forecasting and fraud models (Holt-Winters, GARCH/VaR, K-Means++, Granger) implemented from scratch.');
      return;
    }
    if (has(t, ['payment', 'pay', 'vat', 'equity', 'invoice', 'installment', 'plan'])) {
      botReply('Pricing is in <strong>USD or KES</strong>; KES prices include 16% VAT where applicable. <strong>Equity-for-services</strong> is available for startups, and payment plans exist for larger builds — details on the services page.',
        { actions: [{ label: 'See packages & payment notes', href: '/services/#packages-section', track: 'assistant-cta-pay' }] });
      return;
    }
    if (has(t, ['privacy', 'data protection', 'secure', 'security', 'gdpr', 'confidential'])) {
      botReply('Data privacy is handled per engagement: data stays in your infrastructure where possible, access is least-privilege, and regulated work follows the controls relevant to your deployment (PCI/PSD2/GDPR-informed, verified against the actual production environment). This site itself sets no tracking cookies.');
      return;
    }
    if (has(t, ['small business', 'startup', 'smb', 'sme'])) {
      botReply('Yes — there\'s a dedicated <strong>AI for Small Business</strong> service from <strong>$1,500 / KES 120K</strong>, and the <strong>AI Starter</strong> package ($2,500 + $350/mo) is built for first AI projects.');
      return;
    }
    if (has(t, ['training', 'workshop', 'team', 'upskill', 'coach'])) {
      botReply('Yes — <strong>AI Strategy & Training</strong> from $2,000, plus workshops from half-day to 5-day intensive cohorts. Details on the services page.',
        { actions: [{ label: 'See training options', href: '/services/', track: 'assistant-cta-training' }] });
      return;
    }
    if (has(t, ['whatsapp', 'call', 'phone', 'talk', 'speak', 'voice'])) {
      botReply('Calls and chat run through <strong>WhatsApp: +254 724 346 971</strong> — open the chat and tap the call icon for a voice or video call. For scheduled calls, the calendar below is best.',
        { actions: [
          { label: '💬 Open WhatsApp', primary: true, href: waLink('Hi Victor — a question from your booking page: '), newTab: true, track: 'assistant-cta-wa' },
          { label: '📅 Schedule a call instead', onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-wa' }
        ] });
      return;
    }
    if (has(t, ['email', 'mail', 'message'])) {
      botReply('Email works too: <strong>mututandunda@gmail.com</strong> — replies within 24 hours. Or use the message form on this page.',
        { actions: [{ label: '✍️ Use the form', onClick: function () { goTab('form'); }, track: 'assistant-cta-form' }] });
      return;
    }
    if (has(t, ['book', 'schedule', 'calendar', 'meeting', 'appointment', 'slot', 'available'])) {
      botReply('The calendar is right below — pick any 30-minute slot; you\'ll get an instant calendar invite.',
        { actions: [{ label: '📅 Go to the calendar', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book' }] });
      return;
    }
    if (has(t, ['job', 'hiring', 'employ', 'vacancy', 'recruit', 'intern'])) {
      botReply('I\'m not currently looking for employment, but partnerships and contract work are welcome — LinkedIn or the free assessment call are the right channels.',
        { actions: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/victor-ndunda', newTab: true }] });
      return;
    }
    if (has(t, ['not sure', 'don\'t know', 'dont know', 'idea', 'where to start', 'start'])) {
      botReply('That\'s exactly what the free assessment is for — bring the workflow or the idea, and you\'ll leave with an honest build/no-build read and the smallest useful first step. If you\'d rather explore package prices first, I can walk you through them.',
        { actions: [
          { label: '📅 Book the free assessment', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-unsure' },
          { label: '💰 Show packages', onClick: packagesAnswer, track: 'assistant-cta-pkg-unsure' }
        ] });
      return;
    }
    if (has(t, ['hi', 'hello', 'hey', 'habari', 'jambo', 'good morning', 'good afternoon'])) {
      botReply('Habari! Ask me anything about services, pricing, or timelines — or pick a shortcut below.', null, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['thank', 'asante', 'great', 'perfect', 'awesome'])) {
      botReply('Karibu! Anything else — or shall we get a time in the calendar?', null, [{ label: '📅 Book a time', value: 'book' }, { label: '💰 Get an estimate', value: 'estimate' }]);
      return;
    }

    // FAQ match from published services data
    if (DATA.faqs) {
      for (var i = 0; i < DATA.faqs.length; i++) {
        var f = DATA.faqs[i];
        var q = (f.q || f.question || '').toLowerCase();
        var words = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 4; });
        if (words.length && has(t, words.slice(0, 4))) {
          botReply(esc(f.a || f.answer || 'See the services FAQ.'),
            { actions: [{ label: 'Full FAQ', href: '/services/#faq', track: 'assistant-cta-faq' }] }, DEFAULT_CHIPS);
          return;
        }
      }
    }

    // fallback
    botReply('That one\'s beyond my scripted answers — I cover <strong>services, pricing, estimates, timelines, process, and logistics</strong>. For anything else, WhatsApp or the free 30-minute call gets you a direct answer from Victor.',
      { actions: [
        { label: '💬 Ask on WhatsApp', primary: true, href: waLink('Hi Victor — question from your booking page: '), newTab: true, track: 'assistant-cta-wa-fb' },
        { label: '📅 Book the free call', onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-fb' }
      ] },
      DEFAULT_CHIPS);
  }

  /* ── Input routing ───────────────────────────────────────────────── */
  var SERVICE_KEYWORDS = {
    'chatbots': ['chatbot', 'chat bot', 'assistant', 'faq bot', 'helpdesk'],
    'rag': ['rag', 'knowledge', 'search', 'documents', 'retrieval'],
    'document-ai': ['ocr', 'document ai', 'invoice', 'receipt', 'paperwork'],
    'computer-vision': ['vision', 'camera', 'image', 'detection', 'photo'],
    'predictive': ['forecast', 'predict', 'analytics', 'trend'],
    'automation': ['automation', 'workflow', 'automate', 'zapier', 'pipeline'],
    'fine-tuning': ['fine-tun', 'finetun', 'custom model', 'train a model', 'tuning'],
    'voice-ai': ['voice', 'speech', 'transcribe', 'audio'],
    'multilingual': ['swahili', 'multilingual', 'kiswahili', 'french'],
    'agriculture': ['agric', 'farm', 'crop', 'kilimo'],
    'strategy': ['strategy', 'training', 'workshop', 'consult'],
    'smb': ['small business', 'smb', 'sme']
  };

  function handle(value, label) {
    if (label) addUser(label);
    else addUser(value);
    track('assistant-msg');

    // estimate-flow chip values (est:…)
    if (value.indexOf('est:') === 0) {
      var rest = value.slice(4);
      if (rest === 'more') return estMore();
      if (rest.indexOf('vol:') === 0) return pickVolume(+rest.slice(4));
      if (rest.indexOf('int:') === 0) return pickIntegrations(+rest.slice(4));
      if (rest.indexOf('lang:') === 0) return finishEstimate(+rest.slice(5));
      return pickService(rest);
    }
    if (value === 'estimate' || value === 'Get a price estimate') {
      if (!estimate || !estimate.result) return startEstimate();
      return packagesAnswer();
    }

    // estimate flow — typed answers (only if the text plausibly answers the current question)
    if (estimate && estimate.step === 'service') {
      var ids = Object.keys(SERVICE_KEYWORDS);
      for (var i = 0; i < ids.length; i++) {
        if (t_has(value, SERVICE_KEYWORDS[ids[i]])) return pickService(ids[i]);
      }
    }
    if (estimate && estimate.step === 'volume') {
      if (t_has(value, ['5,000', '5000', 'thousand', 'large', 'big'])) return pickVolume(2);
      if (t_has(value, ['500', 'medium'])) return pickVolume(1);
      if (t_has(value, ['under', 'less', 'small', '100', '200', '300'])) return pickVolume(0);
    }
    if (estimate && estimate.step === 'integrations') {
      if (t_has(value, ['6', 'six', 'many', 'lots'])) return pickIntegrations(2);
      if (t_has(value, ['3', '4', '5', 'three', 'four', 'five', 'few'])) return pickIntegrations(1);
      if (t_has(value, ['1', '2', 'one', 'two', 'couple', 'none'])) return pickIntegrations(0);
    }
    if (estimate && estimate.step === 'languages') {
      if (t_has(value, ['swahili', 'french', 'both', 'multi', 'kiswahili'])) return finishEstimate(1);
      if (t_has(value, ['english', 'only', 'one'])) return finishEstimate(0);
    }

    answer(value);
  }
  function t_has(v, words) { var s = v.toLowerCase(); return words.some(function (w) { return s.indexOf(w) !== -1; }); }

  /* ── Boot ────────────────────────────────────────────────────────── */
  function load(cb) {
    fetch('/services/data.json').then(function (r) { return r.json(); }).then(function (d) {
      DATA = d && (d.packages || d.services) ? d : FALLBACK;
      cb();
    }).catch(function () { DATA = FALLBACK; cb(); });
  }

  function init() {
    log = document.getElementById('assistantLog');
    chipsBox = document.getElementById('assistantChips');
    form = document.getElementById('assistantForm');
    field = document.getElementById('assistantField');
    if (!log || !form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = field.value.trim();
      if (!v) return;
      field.value = '';
      handle(v);
    });

    load(function () {
      botReply(
        'Karibu! I can answer questions about <strong>services, pricing, and timelines</strong> — and give you a <strong>ballpark estimate</strong> from my published rates. Where should we start?',
        null,
        DEFAULT_CHIPS
      );
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
