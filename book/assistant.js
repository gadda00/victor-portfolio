/* ═══════════════════════════════════════════════════════════════════
   Enquiry Assistant v2 — /book/
   Instant answers + estimates from published rates (services/data.json).
   Deterministic intent engine: no external AI calls, no API keys, no
   cookies — everything runs in the visitor's browser.

   v2 upgrades:
   · Domain intelligence: open-ended questions ("AI for a hospital",
     "restaurant ordering", "sacco loans") are mapped to the published
     service catalogue — no more "beyond scripted answers" dead ends.
   · Estimate multipliers recalibrated (volume 1.0/1.35/1.9,
     integrations 1.0/1.3/1.6, languages 1.0/1.15, compound cap 3.2×,
     range ×1.35) and shown transparently in the assumptions.
   · Structured analytics events (window.__vnEvents + window.__vnTrack
     provider bridge — same shape as app.js CTA events, zero network).
   · Privacy-safe owner notifications: estimate completions and
     assistant hand-offs email Victor via the site's existing Web3Forms
     channel (estimate configuration only — no chat text, no PII).
   Handoffs: first-party scheduler (schedule tab), Web3Forms (message
   form), WhatsApp. Estimate completions persist to localStorage
   (vn_last_estimate) so the scheduler pre-fills and the invoice tool
   can import the same numbers.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WA_NUMBER = '254724346971';
  var WA_BASE = 'https://wa.me/' + WA_NUMBER;
  // Centralized in book/index.html (single rotation point). Fallback for safety.
  var WEB3FORMS_KEY = (typeof window.VN_W3F_KEY === 'string' && window.VN_W3F_KEY)
    ? window.VN_W3F_KEY
    : 'f695c261-e59a-4b77-a6cf-55f4b4883427';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Estimate calibration (tuned v2) ────────────────────────────── */
  var VOL_MULTS = [1.0, 1.35, 1.9];
  var INT_MULTS = [1.0, 1.3, 1.6];
  var LANG_MULTS = [1.0, 1.15];
  var MULT_CAP = 3.2;      // compound ceiling — beyond this it's Enterprise territory
  var RANGE_SPREAD = 1.35; // high = low × 1.35
  var PING_MIN_GAP = 4 * 60 * 1000; // owner-notification rate limit per event kind

  /* ── Published data (fallback if /services/data.json fetch fails) ── */
  var FALLBACK = {
    packages: [
      { id: 'audit', name: 'AI Audit', price: { usdOneTime: 2000, kesOneTime: 160000 }, timeline: '1–2 weeks' },
      { id: 'starter', name: 'AI Starter', price: { usdOneTime: 10000, kesOneTime: 800000, usdMonthly: 1400, kesMonthly: 112000 }, timeline: '2–3 weeks' },
      { id: 'growth', name: 'AI Growth', price: { usdOneTime: 28000, kesOneTime: 2200000, usdMonthly: 6000, kesMonthly: 480000 }, timeline: '6–10 weeks' },
      { id: 'enterprise', name: 'AI Enterprise', price: { usdOneTime: 20000, kesOneTime: 1600000 }, timeline: '12–24 weeks' }
    ],
    services: [
      { id: 'chatbots', name: 'AI Chatbots & Virtual Assistants', fromPrice: { usd: 3000, kes: 240000 } },
      { id: 'rag', name: 'RAG Knowledge Systems', fromPrice: { usd: 8000, kes: 640000 } },
      { id: 'document-ai', name: 'Document AI & OCR', fromPrice: { usd: 6000, kes: 480000 } },
      { id: 'computer-vision', name: 'Computer Vision', fromPrice: { usd: 16000, kes: 1300000 } },
      { id: 'predictive', name: 'Predictive Analytics & Forecasting', fromPrice: { usd: 10000, kes: 800000 } },
      { id: 'automation', name: 'AI Automation & Workflows', fromPrice: { usd: 5000, kes: 400000 } },
      { id: 'fine-tuning', name: 'LLM Fine-Tuning & Customization', fromPrice: { usd: 24000, kes: 1900000 } },
      { id: 'voice-ai', name: 'Voice AI & Speech', fromPrice: { usd: 12000, kes: 960000 } },
      { id: 'multilingual', name: 'Multilingual AI (Swahili & Local)', fromPrice: { usd: 7000, kes: 560000 } },
      { id: 'agriculture', name: 'AI for Agriculture', fromPrice: { usd: 16000, kes: 1300000 } },
      { id: 'strategy', name: 'AI Strategy & Training', fromPrice: { usd: 4000, kes: 320000 } },
      { id: 'smb', name: 'AI for Small Business', fromPrice: { usd: 3000, kes: 240000 } }
    ]
  };

  var DATA = null; // populated by load()
  var estimate = null;
  var lastDomain = null; // active estimate flow state

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

  /* ── Analytics events (structured, provider-ready, zero network) ── */
  // Same event shape as the site-wide CTA hooks in app.js — a provider
  // wired via window.__vnTrack receives both automatically.
  function track(event, props) {
    var ev = {
      event: event,
      id: event,
      props: props || null,
      page: '/book/',
      ts: new Date().toISOString()
    };
    try { (window.__vnEvents = window.__vnEvents || []).push(ev); } catch (e) { /* private buffer */ }
    if (typeof window.__vnTrack === 'function') {
      try { window.__vnTrack(ev); } catch (e) { /* provider errors must never break the page */ }
    }
    if (window.console && console.debug) console.debug('[vn-event]', event, props || '');
  }

  /* ── Owner notifications (email via Web3Forms, privacy-safe) ────── */
  // Sends Victor a minimal heads-up when a visitor completes an estimate
  // or picks a hand-off. Payload = estimate configuration + channel only.
  // No chat text, no personal data, no cookies. Rate-limited per kind.
  function notifyOwner(kind, lines) {
    try {
      var last = parseInt(sessionStorage.getItem('vn_ping_' + kind) || '0', 10);
      if (Date.now() - last < PING_MIN_GAP) return;
      sessionStorage.setItem('vn_ping_' + kind, String(Date.now()));
    } catch (e) { /* storage blocked — still send, it is a user-triggered signal */ }
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: '🔔 ' + kind + ' — booking assistant (victorndunda.com)',
        from_name: 'Portfolio Assistant',
        name: 'Booking Assistant',
        message: lines.join('\n') +
          '\n\n—\nPrivacy-safe ping: estimate configuration and channel only. ' +
          'No chat text, no personal data, no cookies.'
      })
    }).then(function (r) { return r.json(); })
      .then(function (j) { track('assistant_notify_' + (j && j.success ? 'sent' : 'failed'), { kind: kind }); })
      .catch(function () { track('assistant_notify_failed', { kind: kind }); });
  }
  function notifyHandoff(channel) {
    var ctx = estimate && estimate.result
      ? ' after an estimate for ' + estimate.result.service + ' (' + estimate.result.range + ')'
      : '';
    notifyOwner('Handoff: ' + channel, [
      'A visitor chose to continue via ' + channel + ctx + '.',
      'Time: ' + new Date().toLocaleString()
    ]);
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
          if (a.onClick) n.addEventListener('click', a.onClick);
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

  /* ── Catalogue helpers ───────────────────────────────────────────── */
  function money(n, cur) {
    if (typeof n !== 'number') return String(n);
    return cur === 'usd' ? '$' + n.toLocaleString('en-US') : 'KES ' + n.toLocaleString('en-US');
  }
  function svcById(id) {
    var s = null;
    (DATA.services || []).forEach(function (x) { if (x.id === id) s = x; });
    return s;
  }
  function shortName(id) {
    var s = svcById(id);
    return s ? s.name.replace(/ &.*$/, '') : id;
  }
  function pkgLine(p) {
    var pr = p.price || {};
    var one = pr.usdOneTime !== undefined ? money(pr.usdOneTime, 'usd') + (typeof pr.usdOneTime === 'number' ? ' / ' + money(pr.kesOneTime, 'kes') : '') : '';
    var mo = typeof pr.usdMonthly === 'number' ? ' + ' + money(pr.usdMonthly, 'usd') + '/mo' : '';
    var tl = p.timeline ? ' · ' + p.timeline : '';
    return '<strong>' + esc(p.name) + '</strong> — ' + one + mo + tl;
  }
  function packagesAnswer() {
    var lines = (DATA.packages || []).map(function (p) { return '<li>' + pkgLine(p) + '</li>'; }).join('');
    botReply(
      'Four published packages (USD / KES):<ul class="msg-assumptions">' + lines + '</ul>' +
      'For custom systems, my per-service rates start at <strong>$3,000 (chatbots)</strong> up to <strong>$24,000 (LLM fine-tuning)</strong> — want a ballpark for your case?',
      { actions: [
        { label: 'Get my estimate →', primary: true, onClick: function () { startEstimate(); }, track: 'assistant-estimate-pkg' },
        { label: 'See all services', href: '/services/', newTab: false }
      ] },
      DEFAULT_CHIPS
    );
  }

  /* ── Domain intelligence ─────────────────────────────────────────── */
  // Open-ended questions ("I want an AI hospital system") map to the
  // published catalogue. No fabricated experience: closest shipped work
  // is cited only where it actually exists.
  var DOMAINS = [
    {
      id: 'health',
      kw: ['hospital', 'health', 'clinic', 'medical', 'patient', 'nursing', 'dispensary', 'pharmacy', 'doctor'],
      label: 'a hospital or health system',
      intro: 'Health builds usually start where the paperwork hurts most — and every piece below is a published service:',
      combos: [
        { id: 'document-ai', why: 'intake forms, records and referral paperwork — extracted and structured instead of retyped' },
        { id: 'rag', why: 'a staff-facing knowledge base over policies, protocols and clinical guidelines' },
        { id: 'chatbots', why: 'appointment booking and patient FAQs on WhatsApp, answered 24/7' },
        { id: 'automation', why: 'billing, claims and follow-up workflows that run themselves' }
      ],
      note: 'Health data gets the strictest handling: your infrastructure, least-privilege access, controls verified against the actual deployment — nothing gets trained on patient data.'
    },
    {
      id: 'education',
      kw: ['school', 'universit', 'college', 'educat', 'elearn', 'e-learn', 'student', 'learner', 'teach', 'academy', 'tuition', 'campus'],
      label: 'a school, college or e-learning platform',
      intro: 'Education is the closest thing to home turf — a shipped client product in this space runs in three languages:',
      combos: [
        { id: 'chatbots', why: 'admissions and student-service FAQs, multilingual, on the channels families already use' },
        { id: 'rag', why: 'course materials and institutional knowledge as a searchable assistant' },
        { id: 'predictive', why: 'at-risk learner flagging and enrolment forecasting from real data' },
        { id: 'strategy', why: 'staff AI literacy and workflow training' }
      ],
      note: 'Closest shipped work: Tapi Learn (client product) — multilingual AI learning used by 11K+ learners across 38 countries.'
    },
    {
      id: 'realestate',
      kw: ['real estate', 'propert', 'landlord', 'rental', 'tenant', 'apartment', 'keja', 'housing', 'mortgage', 'house', 'land'],
      label: 'a real-estate or property platform',
      intro: 'Property platforms live or die on trust and paperwork — both are catalogue services:',
      combos: [
        { id: 'document-ai', why: 'title deeds, leases and agreements — verified and extracted automatically' },
        { id: 'rag', why: 'a listings-and-processes assistant ("Ask Keja"-style) for buyers, tenants and agents' },
        { id: 'predictive', why: 'price and market analytics on every listing' },
        { id: 'chatbots', why: 'viewing scheduling and enquiries on WhatsApp' }
      ],
      note: 'Closest shipped work: Keja AI (client platform for CHACADOM INVESTMENTS) — the full Discover→Manage lifecycle with verified titles and investment scoring, live in public trial at keja.app.'
    },
    {
      id: 'fintech',
      kw: ['bank', 'fintech', 'sacco', 'loan', 'credit', 'insur', 'microfinance', 'm-pesa', 'payment'],
      label: 'a bank, SACCO, lender or fintech',
      intro: 'Regulated finance is where the shipped proof is strongest:',
      combos: [
        { id: 'predictive', why: 'real-time fraud scoring and credit risk models — with the evaluation to satisfy risk teams' },
        { id: 'document-ai', why: 'KYC paperwork, statements and ID extraction' },
        { id: 'rag', why: 'compliance and product knowledge for staff and support' },
        { id: 'automation', why: 'reconciliation and case-management workflows' }
      ],
      note: 'Closest shipped work: a production fraud-detection system in Go (PCI/PSD2-informed controls), plus forecasting tools used in regulated markets.'
    },
    {
      id: 'ecommerce',
      kw: ['ecommerce', 'e-commerce', 'shop', 'retail', 'store', 'inventory', 'marketplace', 'supermarket', 'vendor', 'boutique', 'duka'],
      label: 'a shop or e-commerce operation',
      intro: 'Retail AI pays for itself fastest in three places:',
      combos: [
        { id: 'chatbots', why: 'order status, product questions and returns on WhatsApp — the channel Kenyan shoppers already use' },
        { id: 'predictive', why: 'demand forecasting so stock matches reality' },
        { id: 'document-ai', why: 'supplier invoices and receipts processed automatically' },
        { id: 'automation', why: 'order-to-fulfilment workflows without copy-paste' }
      ]
    },
    {
      id: 'hospitality',
      kw: ['hotel', 'lodge', 'airbnb', 'hostel', 'guest house', 'hospitality', 'reservation', 'booking flow'],
      label: 'a hotel, lodge or guest house',
      intro: 'Guest-facing AI that answers before the front desk has to:',
      combos: [
        { id: 'chatbots', why: 'reservations, amenities and late-night guest questions in English, French and Swahili' },
        { id: 'predictive', why: 'occupancy and seasonal demand forecasting for pricing' },
        { id: 'automation', why: 'booking confirmations, follow-ups and review requests on autopilot' }
      ]
    },
    {
      id: 'restaurant',
      kw: ['restaurant', 'cafe', 'café', 'food', 'menu', 'bakery', 'catering', 'pizzeria', 'butchery', 'kibanda'],
      label: 'a restaurant or food business',
      intro: 'The highest-impact builds for food businesses are usually:',
      combos: [
        { id: 'chatbots', why: 'WhatsApp ordering and menu questions — no app download, no phone tag' },
        { id: 'predictive', why: 'daily demand forecasting so you prep the right amount' },
        { id: 'automation', why: 'order routing, stock counts and supplier reordering' }
      ]
    },
    {
      id: 'agriculture',
      kw: ['farm', 'agric', 'crop', 'kilimo', 'livestock', 'greenhouse', 'dairy', 'shamba', 'agronom'],
      label: 'an agricultural operation or agritech product',
      intro: 'Agricultural AI is a published specialty — and there is shipped work behind it:',
      combos: [
        { id: 'agriculture', why: 'the dedicated Agriculture service: crop intelligence, advisories and field data pipelines' },
        { id: 'computer-vision', why: 'crop-disease and produce-quality detection from phone photos' },
        { id: 'predictive', why: 'yield and price forecasting' }
      ],
      note: 'Closest shipped work: KilimoPRO — agricultural intelligence serving smallholders across 8 IGAD countries.'
    },
    {
      id: 'ngo',
      kw: ['ngo', 'nonprofit', 'non-profit', 'charity', 'donor', 'foundation', 'humanitarian', 'cbo', 'monitoring'],
      label: 'an NGO or nonprofit programme',
      intro: 'Programme work has three classic bottlenecks, all catalogue services:',
      combos: [
        { id: 'document-ai', why: 'M&E and beneficiary paperwork processed instead of hand-tabulated' },
        { id: 'chatbots', why: 'beneficiary and field-team FAQs in local languages' },
        { id: 'predictive', why: 'programme outcome and uptake analytics from your own data' },
        { id: 'strategy', why: 'staff training and AI-readiness workshops' }
      ]
    },
    {
      id: 'legal',
      kw: ['legal', 'lawy', 'law firm', 'lawfirm', 'advocat', 'attorney', 'contract', 'compliance', 'litigat'],
      label: 'a law firm or legal team',
      intro: 'Legal AI that respects confidentiality and actually ships:',
      combos: [
        { id: 'document-ai', why: 'contract review and clause extraction — first-pass analysis, lawyer keeps judgment' },
        { id: 'rag', why: 'an internal knowledge base over your own precedents and documents' },
        { id: 'automation', why: 'intake, filing and deadline workflows' }
      ],
      note: 'Client data stays in your infrastructure — least-privilege access, nothing leaves without written scope.'
    },
    {
      id: 'logistics',
      kw: ['logistics', 'transport', 'fleet', 'delivery', 'dispatch', 'courier', 'boda', 'matatu', 'trucking', 'supply chain', 'warehouse'],
      label: 'a logistics, transport or delivery operation',
      intro: 'Movement is data — the catalogue fits it well:',
      combos: [
        { id: 'predictive', why: 'demand and route forecasting across the day and week' },
        { id: 'automation', why: 'dispatch, proof-of-delivery and exception handling without phone calls' },
        { id: 'computer-vision', why: 'damage and condition inspection from photos' },
        { id: 'rag', why: 'rates, SOPs and customer knowledge for the ops desk' }
      ]
    },
    {
      id: 'manufacturing',
      kw: ['manufactur', 'factory', 'production line', 'quality control', 'industrial'],
      label: 'a factory or manufacturing line',
      intro: 'Production AI that earns its keep on quality and downtime:',
      combos: [
        { id: 'computer-vision', why: 'defect detection on the line — the shipped CV work runs at 91% accuracy' },
        { id: 'predictive', why: 'maintenance and throughput forecasting' },
        { id: 'automation', why: 'shift reports, QC records and ERP glue' }
      ]
    },
    {
      id: 'government',
      kw: ['government', 'county', 'ministry', 'public sector', 'civil service', 'parastatal', 'kra', 'huduma'],
      label: 'a government or public-sector unit',
      intro: 'Public-service builds usually combine citizen reach with document load:',
      combos: [
        { id: 'document-ai', why: 'permits, records and forms — processed and searchable' },
        { id: 'multilingual', why: 'citizen assistants in English and Kiswahili (dedicated published service)' },
        { id: 'rag', why: 'internal policy and procedure knowledge for staff' }
      ],
      note: 'Multilingual and low-bandwidth delivery is a published specialty — built for $80 phones and weak connectivity.'
    },
    {
      id: 'church',
      kw: ['church', 'mosque', 'temple', 'congregation', 'parish', 'pastor', 'imam', 'faith'],
      label: 'a church or ministry',
      intro: 'Congregation-facing AI is mostly communication at scale:',
      combos: [
        { id: 'chatbots', why: 'service times, events and FAQs answered instantly, in English or Swahili' },
        { id: 'automation', why: 'event registration, follow-ups and volunteer coordination' }
      ]
    },
    {
      id: 'fitness',
      kw: ['gym', 'fitness', 'salon', 'barber', 'spa', 'wellness', 'yoga', 'kinyozi'],
      label: 'a gym, salon or studio',
      intro: 'Booking-and-retention businesses get the fastest wins from:',
      combos: [
        { id: 'chatbots', why: 'WhatsApp bookings, class schedules and no-show reminders' },
        { id: 'predictive', why: 'member-churn flags while there is still time to act' },
        { id: 'smb', why: 'the dedicated Small Business service — from $3,000' }
      ]
    },
    {
      id: 'travel',
      kw: ['travel', 'tour', 'safari', 'airline', 'itinerary', 'trip'],
      label: 'a travel, tour or safari company',
      intro: 'Guests ask the same forty questions — in four languages:',
      combos: [
        { id: 'chatbots', why: 'itinerary and trip FAQs in English, French and Swahili, pre and during trip' },
        { id: 'rag', why: 'your packages, parks and policies as an assistant that quotes accurately' },
        { id: 'predictive', why: 'seasonal demand forecasting for pricing and staffing' }
      ]
    },
    {
      id: 'recruitment',
      kw: ['recruit', 'hr', 'payroll', 'talent', 'onboarding', 'staffing', 'cv screen'],
      label: 'an HR or recruitment function',
      intro: 'Hiring pipelines drown in documents and scheduling:',
      combos: [
        { id: 'document-ai', why: 'CV and application extraction into structured, comparable data — with human decisions kept human' },
        { id: 'automation', why: 'interview scheduling and candidate communication' },
        { id: 'chatbots', why: 'applicant FAQs: status, process, requirements' }
      ],
      note: 'Screening models are built with documented fairness checks — the human shortlist decision stays yours.'
    }
  ];

  function domainAnswer(d, rawText) {
    track('assistant_domain', { d: d.id });
    lastDomain = d.label;
    var combos = d.combos.map(function (c) {
      var s = svcById(c.id);
      var price = s && s.fromPrice ? ' (from ' + money(s.fromPrice.usd, 'usd') + ' / ' + money(s.fromPrice.kes, 'kes') + ')' : '';
      return '<li><strong>' + esc(s ? s.name : c.id) + '</strong>' + price + ' — ' + c.why + '</li>';
    }).join('');
    botReply(
      '<strong>For ' + esc(d.label) + ':</strong> ' + esc(d.intro) +
      '<ul class="msg-assumptions">' + combos + '</ul>' +
      (d.note ? esc(d.note) + ' ' : '') +
      'Want a ballpark for the piece that matches your biggest bottleneck?',
      { actions: [
        { label: '💰 Ballpark for ' + esc(shortName(d.combos[0].id)), primary: true, onClick: function () { startEstimate(d.combos[0].id); }, track: 'assistant-domain-estimate' },
        { label: '💬 Ask Victor directly', href: waLink('Hi Victor — I\'m exploring ' + d.label + '. ' + (rawText ? 'Context: ' + rawText : 'Where would we start?')), newTab: true, track: 'assistant-domain-wa' },
        { label: '📅 Book the free assessment', onClick: function () { goTab('schedule'); }, track: 'assistant-domain-book' }
      ] },
      DEFAULT_CHIPS
    );
  }
  function matchDomain(t) {
    for (var i = 0; i < DOMAINS.length; i++) {
      var d = DOMAINS[i];
      for (var j = 0; j < d.kw.length; j++) {
        if (new RegExp('\\b' + d.kw[j].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t)) return d;
      }
    }
    return null;
  }

  /* ── Estimate flow (tuned multipliers) ───────────────────────────── */
  function startEstimate(presetId) {
    estimate = { step: 'service', volume: null, integrations: null, languages: null, service: null, domain: lastDomain };
    track('assistant_estimate_start', presetId ? { preset: presetId } : null);
    if (presetId && svcById(presetId)) { pickService(presetId); return; }
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
    var s = svcById(id);
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
    estimate.volMult = VOL_MULTS[i];
    estimate.step = 'integrations';
    botReply('How many systems should it connect to (CRM, email, ERP, WhatsApp…)?',
      null,
      [{ label: '1–2', value: 'est:int:0' }, { label: '3–5', value: 'est:int:1' }, { label: '6+', value: 'est:int:2' }]);
  }

  function pickIntegrations(i) {
    estimate.integrations = ['1–2 systems', '3–5 systems', '6+ systems'][i];
    estimate.intMult = INT_MULTS[i];
    estimate.step = 'languages';
    botReply('Last one — which languages does it need to work in?',
      null,
      [{ label: 'English only', value: 'est:lang:0' }, { label: 'English + Swahili or French', value: 'est:lang:1' }]);
  }

  function finishEstimate(i) {
    estimate.languages = i === 0 ? 'English only' : 'English + Swahili/French';
    estimate.langMult = LANG_MULTS[i];

    var base = estimate.service.fromPrice || {};
    var m = estimate.volMult * estimate.intMult * estimate.langMult;
    var capped = m > MULT_CAP;
    if (capped) m = MULT_CAP;
    var usdLow = Math.round((base.usd * m) / 100) * 100;
    var kesLow = Math.round((base.kes * m) / 5000) * 5000;
    var usdHigh = Math.round((usdLow * RANGE_SPREAD) / 100) * 100;
    var kesHigh = Math.round((kesLow * RANGE_SPREAD) / 5000) * 5000;

    estimate.result = {
      service: estimate.service.name,
      volume: estimate.volume,
      integrations: estimate.integrations,
      languages: estimate.languages,
      range: '$' + usdLow.toLocaleString('en-US') + '–$' + usdHigh.toLocaleString('en-US') + ' (KES ' + kesLow.toLocaleString('en-US') + '–' + kesHigh.toLocaleString('en-US') + ')'
    };
    track('assistant_estimate_complete', {
      service: estimate.service.name,
      volume: estimate.volume,
      integrations: estimate.integrations,
      languages: estimate.languages,
      usd: usdLow + '-' + usdHigh
    });
    /* Persist for cross-tool handoffs (scheduler prefill + invoice import) */
    try {
      localStorage.setItem('vn_last_estimate', JSON.stringify({
        service: estimate.service.name,
        volume: estimate.volume,
        integrations: estimate.integrations,
        languages: estimate.languages,
        usdLow: usdLow, usdHigh: usdHigh,
        kesLow: kesLow, kesHigh: kesHigh,
        range: estimate.result.range,
        domain: estimate.domain || null,
        t: Date.now()
      }));
    } catch (e) { /* storage unavailable — handoffs still work */ }
    notifyOwner('Estimate completed', [
      'A visitor completed the estimate flow on /book/:',
      'Service: ' + estimate.service.name,
      'Volume: ' + estimate.volume,
      'Integrations: ' + estimate.integrations,
      'Languages: ' + estimate.languages,
      'Ballpark: $' + usdLow.toLocaleString('en-US') + '–$' + usdHigh.toLocaleString('en-US') + ' · KES ' + kesLow.toLocaleString('en-US') + '–' + kesHigh.toLocaleString('en-US'),
      'Time: ' + new Date().toLocaleString()
    ]);

    var assumptions = [
      'Starting from my published rate of ' + money(base.usd, 'usd') + ' / ' + money(base.kes, 'kes'),
      'Multipliers: volume ×' + estimate.volMult + ' · integrations ×' + estimate.intMult + ' · languages ×' + estimate.langMult,
      'Volume: ' + estimate.volume,
      'Integrations: ' + estimate.integrations,
      'Languages: ' + estimate.languages,
      'The exact quote comes out of the free assessment — scoped in writing before any build.',
      'Optional support retainer from $1,400/mo (published package rates).'
    ];
    if (capped) assumptions.push('Scope exceeds standard multipliers — Enterprise-class territory (custom quote, from $20,000 scaling to $200K+).');

    botReply(
      '<strong>Ballpark: $' + usdLow.toLocaleString('en-US') + '–$' + usdHigh.toLocaleString('en-US') + ' · KES ' + kesLow.toLocaleString('en-US') + '–' + kesHigh.toLocaleString('en-US') + '</strong> for ' + esc(estimate.service.name) + '.',
      {
        assumptions: assumptions,
        actions: [
          { label: '📅 Book the free assessment', primary: true, onClick: function () { track('assistant_cta_book'); notifyHandoff('calendar'); goTab('schedule'); }, track: 'assistant-cta-book' },
          { label: '💬 Continue on WhatsApp', href: waLink('Hi Victor — I got an estimate on your site for ' + estimate.service.name + ' (' + estimate.result.range + '). Can we talk it through?'), newTab: true, onClick: function () { notifyHandoff('WhatsApp'); }, track: 'assistant-cta-whatsapp' },
          { label: '📧 Send this as a brief', onClick: function () { track('assistant_cta_brief'); notifyHandoff('brief form'); prefillForm(estimateSummary()); }, track: 'assistant-cta-brief' }
        ]
      },
      DEFAULT_CHIPS.concat([{ label: '🔁 New estimate', value: 'newestimate' }])
    );
  }

  /* ── Intent engine ───────────────────────────────────────────────── */
  // Word-boundary matcher: fixes substring false positives the v1 engine
  // had ("which" used to trigger the greeting via its "hi" substring).
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function has(text, words) {
    return words.some(function (w) { return new RegExp('\\b' + rx(w) + '\\b').test(text); });
  }
  function t_has(v, words) { var s = v.toLowerCase(); return words.some(function (w) { return s.indexOf(w) !== -1; }); }

  // A query gets the domain treatment when it mentions an industry AND
  // reads like a project description (or is short enough to be one).
  var PROJECT_SIGNALS = ['ai', 'system', 'build', 'platform', 'app', 'automat', 'software', 'chatbot', 'portal', 'dashboard', 'database', 'website', 'product', 'solution', 'workflow', 'intelligen', 'digitiz', 'manage'];
  function wantsDomainAnswer(t, d) {
    if (!d) return false;
    var words = t.split(/\s+/).filter(Boolean).length;
    if (words <= 3) return true;
    if (PROJECT_SIGNALS.some(function (w) { return new RegExp('\\b' + rx(w)).test(t); })) return true;
    return t_has(t, [' for my ', ' for our ', ' for a ', ' for the ']);
  }

  var DEFAULT_CHIPS = [
    { label: '💰 Get a price estimate', value: 'estimate' },
    { label: '🕐 How long does a build take?', value: 'timeline' },
    { label: '🛠️ How do you work?', value: 'process' },
    { label: '🌍 Swahili / multilingual?', value: 'swahili' },
    { label: '💬 Talk to Victor on WhatsApp', value: 'whatsapp' }
  ];

  /* ── Domain-agnostic answers (new intents) ─────────────────────── */
  function kejaAnswer() {
    track('assistant_keja');
    botReply(
      '<strong>Keja AI</strong> — a client platform I built for CHACADOM INVESTMENTS, live in public trial at <a href="https://keja.app" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">keja.app</a>. Real-estate intelligence covering the full transaction lifecycle — <strong>Discover → Verify → Analyse → Finance → Invest → Transact → Manage</strong> — with verified titles, investment scoring on every listing, market data, and dedicated workspaces for 8 stakeholder types (buyers, sellers, landlords, tenants, investors, developers, banks, institutions).',
      { actions: [
        { label: '🌐 Visit keja.app', primary: true, href: 'https://keja.app', newTab: true, track: 'assistant-keja-visit' },
        { label: '📦 See all case studies', href: '/projects/', track: 'assistant-keja-cases' }
      ] },
      DEFAULT_CHIPS
    );
  }

  function casesAnswer() {
    track('assistant_cases');
    botReply(
      'Six shipped systems, each with the constraint that made it hard: <ul class="msg-assumptions">' +
      '<li><strong>Tapi Learn (client)</strong> — multilingual AI learning product, 11K+ learners across 38 countries</li>' +
      '<li><strong>Keja AI (client)</strong> — real-estate trust platform, 7-stage transaction lifecycle, public trial at keja.app</li>' +
      '<li><strong>Fraud Detection System</strong> — real-time scoring in Go, PCI/PSD2-informed controls</li>' +
      '<li><strong>KilimoPRO</strong> — agricultural intelligence across 8 IGAD countries</li>' +
      '<li><strong>Verxlite</strong> — universal AI workflow agent for sales &amp; ops</li>' +
      '<li><strong>AgentReplay</strong> — open-source deterministic agent replay, zero model calls</li>' +
      '</ul>Full details — constraints, evidence, links — on the Case Studies page.',
      { actions: [
        { label: '📦 Open case studies', primary: true, href: '/projects/', track: 'assistant-cases-open' },
        { label: '📅 Book the free assessment', onClick: function () { goTab('schedule'); }, track: 'assistant-cases-book' }
      ] },
      DEFAULT_CHIPS
    );
  }

  function aboutAnswer() {
    track('assistant_about');
    botReply(
      '<strong>Victor Ndunda</strong> — a production AI systems engineer based in Nairobi. I turn high-value workflows into reliable AI systems: RAG knowledge tools, agents, automation, forecasting, fraud detection. Six systems shipped, including client products used by 11K+ learners (Tapi Learn) and a real-estate platform in public trial (Keja AI). I work in English, French and Swahili, build for low-bandwidth and offline contexts, and write up the engineering so it can be judged on evidence.',
      { actions: [
        { label: '📦 Case studies', href: '/projects/', track: 'assistant-about-cases' },
        { label: '📄 Resume', href: '/resume/', track: 'assistant-about-resume' },
        { label: '📅 Book the free assessment', onClick: function () { goTab('schedule'); }, track: 'assistant-about-book' }
      ] },
      DEFAULT_CHIPS
    );
  }

  function supportAnswer() {
    track('assistant_support');
    botReply(
      'Every build hands over with <strong>documentation, monitoring, and an observability baseline</strong> — quality is measured, not assumed. After that: <strong>support retainers from $1,400/mo</strong> (the published Starter rate; Growth runs $6,000/mo) cover fixes, tuning and small improvements. Bigger changes become a scoped sprint. The free assessment output includes what ongoing support your specific system would need.',
      { actions: [{ label: 'See packages & retainers', href: '/services/#packages-section', track: 'assistant-support-pkg' }] },
      DEFAULT_CHIPS
    );
  }

  function hostingAnswer() {
    track('assistant_hosting');
    botReply(
      'Where it runs is your call: <strong>your infrastructure where possible</strong> (cloud or on-premise), with least-privilege access and deployment-specific controls. Where the workload allows, I also build <strong>on-device and offline-first</strong> — shipped work includes TFLite models running on $80 Android phones with no connectivity. The deployment target is agreed in the written scope before any build.',
      { actions: [{ label: '📅 Discuss your deployment', onClick: function () { goTab('schedule'); }, track: 'assistant-hosting-book' }] },
      DEFAULT_CHIPS
    );
  }

  function offlineAnswer() {
    track('assistant_offline');
    botReply(
      'Yes — <strong>offline-first is a shipped specialty, not a slideware claim</strong>: on-device TFLite models on $80 Android phones, syncing when connectivity returns. Products run in <strong>English · Français · Kiswahili</strong> on low-bandwidth connections. If your users have weak connectivity, say so in the assessment — it changes the architecture.',
      { actions: [{ label: '📅 Book the free assessment', onClick: function () { goTab('schedule'); }, track: 'assistant-offline-book' }] },
      DEFAULT_CHIPS
    );
  }

  function deliverablesAnswer() {
    track('assistant_deliverables');
    botReply(
      'What lands in your hands: <strong>working software in your infrastructure</strong>, source code, deployment and run documentation, an <strong>evaluation suite</strong> proving quality on your data, monitoring/observability setup, and a written next-steps path. Ownership stays yours — no lock-in by design.',
      { actions: [{ label: 'How the engagement runs', href: '/#engagement', track: 'assistant-deliv-process' }] },
      DEFAULT_CHIPS
    );
  }

  function teamAnswer() {
    track('assistant_team');
    botReply(
      'You work with <strong>me directly</strong> — the same person scopes, builds, and ships. Engagements are structured so delivery never depends on a big team: the <strong>AI Audit</strong> (1–2 weeks) defines the scope in writing, then <strong>Starter or Growth</strong> packages deliver in stages with evaluation gates. For larger builds, the work plan names every dependency up front.',
      { actions: [{ label: 'See the engagement model', href: '/#engagement', track: 'assistant-team-process' }] },
      DEFAULT_CHIPS
    );
  }

  function capabilitiesAnswer() {
    track('assistant_capabilities');
    botReply(
      'I can answer <strong>services, pricing, estimates, timelines, process, and logistics</strong> from Victor\'s published rates — and map a project idea to the catalogue ("AI for a hospital", "WhatsApp ordering", "sacco loan scoring"). I\'m a catalogue assistant, not a general chatbot: anything outside that goes to Victor directly.',
      null,
      [{ label: '💰 Get a price estimate', value: 'estimate' },
       { label: '🏥 AI for my industry', value: 'industry' },
       { label: '📦 Case studies', value: 'case studies' },
       { label: '💬 WhatsApp', value: 'whatsapp' }]
    );
  }

  function serviceAnswer(id) {
    var s = svcById(id);
    if (!s) return false;
    track('assistant_service', { s: id });
    botReply(
      '<strong>' + esc(s.name) + '</strong> — from ' + money(s.fromPrice.usd, 'usd') + ' / ' + money(s.fromPrice.kes, 'kes') +
      '. The exact scope and price come out of the free assessment, in writing, before any build.',
      { actions: [
        { label: '💰 Ballpark for my case', primary: true, onClick: function () { startEstimate(id); }, track: 'assistant-service-estimate' },
        { label: 'See full service details', href: '/services/', track: 'assistant-service-details' },
        { label: '💬 Ask on WhatsApp', href: waLink('Hi Victor — about ' + s.name + ': '), newTab: true, track: 'assistant-service-wa' }
      ] },
      DEFAULT_CHIPS
    );
    return true;
  }

  /* ── Main answer router ─────────────────────────────────────────── */
  function answer(text) {
    var t = text.toLowerCase();

    if (has(t, ['price', 'cost', 'estimate', 'how much', 'rate', 'fee', 'budget', 'charge', 'pricing', 'quote'])) { track('assistant_intent', { i: 'pricing' }); packagesAnswer(); return; }
    if (has(t, ['which service', 'what services', 'which package', 'what do you offer', 'what do you build', 'services do you', 'what kind of', 'what can you build', 'recommend'])) {
      track('assistant_intent', { i: 'services' });
      botReply('The full catalogue runs twelve services — <strong>chatbots, RAG knowledge systems, document AI, computer vision, predictive analytics, automation, LLM fine-tuning, voice AI, multilingual (Swahili), agriculture, strategy & training, and small business</strong>. Most engagements start from a package though:',
        { actions: [
          { label: '💰 Show packages & prices', primary: true, onClick: packagesAnswer, track: 'assistant-services-pkg' },
          { label: '📋 Browse the catalogue', href: '/services/', track: 'assistant-services-browse' },
          { label: '🗓️ Tell me your project — I\'ll match it', onClick: function () { handle('industry'); }, track: 'assistant-services-match' }
        ] },
        DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['estimate'])) { startEstimate(); return; }
    if (has(t, ['how long', 'timeline', 'duration', 'when can', 'how fast', 'how quick', 'delivery', 'weeks', 'months'])) {
      track('assistant_intent', { i: 'timeline' });
      botReply('Published timelines: <strong>AI Audit 1–2 weeks</strong> · <strong>AI Starter 2–3 weeks</strong> · <strong>AI Growth 6–10 weeks</strong> · <strong>Enterprise 12–24 weeks</strong>. Custom builds scale with scope — we agree the timeline in writing before starting.',
        { actions: [{ label: '📅 Book the free assessment', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-tl' }] }, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['how do you work', 'process', 'engagement', 'steps', 'what happens', 'methodology', 'how it works'])) {
      track('assistant_intent', { i: 'process' });
      botReply('Three stages: <strong>Diagnose</strong> — the free 30-minute assessment plus optional audit: workflow map, data readiness, build/no-build call. <strong>Prove</strong> — a scoped sprint with an evaluation suite and observability, so quality is measured, not assumed. <strong>Ship</strong> — production handover with docs, monitoring, and a path for what comes next.',
        { actions: [{ label: 'Read the engagement model', href: '/#engagement', track: 'assistant-cta-process' }] }, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['swahili', 'multilingual', 'language', 'french', 'kiswahili'])) {
      track('assistant_intent', { i: 'multilingual' });
      botReply('Yes — multilingual AI is a published service (from <strong>$7,000 / KES 560K</strong>). Shipped products run in <strong>English · Français · Kiswahili</strong>, and I build for low-bandwidth and offline contexts.');
      return;
    }
    if (has(t, ['where', 'located', 'based', 'remote', 'nairobi', 'kenya'])) {
      track('assistant_intent', { i: 'location' });
      botReply('I\'m based in <strong>Nairobi, Kenya</strong> and work with clients <strong>remotely</strong> across time zones — published service areas cover Kenya, East Africa, and international remote work.');
      return;
    }
    if (has(t, ['assessment', 'free call', 'what happens on the call', 'first call', 'consult'])) {
      track('assistant_intent', { i: 'assessment' });
      botReply('The free 30 minutes: <strong>0–10 min</strong> your context (workflow, users, constraint) · <strong>10–20 min</strong> where AI fits and what data you\'d need · <strong>20–30 min</strong> build/no-build view and the smallest useful first step. Useful whether or not we work together.',
        { actions: [{ label: '📅 Pick a time', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-agenda' }] }, DEFAULT_CHIPS);
      return;
    }

    // Domain intelligence — project-shaped industry queries ("AI for a hospital")
    var dom = matchDomain(t);
    if (dom && wantsDomainAnswer(t, dom)) { domainAnswer(dom, text); return; }

    if (has(t, ['tech', 'stack', 'tools', 'technolog', 'framework', 'langchain', 'llm'])) {
      track('assistant_intent', { i: 'stack' });
      botReply('Core stack: <strong>Python + TypeScript</strong>, LangChain/LangGraph/CrewAI for agents, RAG with pgvector/Pinecone, TFLite for on-device ML, Next.js frontends, PostgreSQL. Forecasting and fraud models (Holt-Winters, GARCH/VaR, K-Means++, Granger) implemented from scratch.');
      return;
    }
    if (has(t, ['payment', 'pay', 'vat', 'equity', 'invoice', 'installment', 'plan'])) {
      track('assistant_intent', { i: 'payment' });
      botReply('Pricing is in <strong>USD or KES</strong>; KES prices include 16% VAT where applicable. <strong>Equity-for-services</strong> is available for startups, and payment plans exist for larger builds — details on the services page.',
        { actions: [{ label: 'See packages & payment notes', href: '/services/#packages-section', track: 'assistant-cta-pay' }] });
      return;
    }
    if (has(t, ['privacy', 'data protection', 'secure', 'security', 'gdpr', 'confidential'])) {
      track('assistant_intent', { i: 'privacy' });
      botReply('Data privacy is handled per engagement: data stays in your infrastructure where possible, access is least-privilege, and regulated work follows the controls relevant to your deployment (PCI/PSD2/GDPR-informed, verified against the actual production environment). This site itself sets no tracking cookies.');
      return;
    }
    if (has(t, ['small business', 'startup', 'smb', 'sme', 'chama'])) {
      track('assistant_intent', { i: 'smb' });
      botReply('Yes — there\'s a dedicated <strong>AI for Small Business</strong> service from <strong>$3,000 / KES 240K</strong>, and the <strong>AI Starter</strong> package ($10,000 + $1,400/mo) is built for first AI projects.');
      return;
    }
    if (has(t, ['training', 'workshop', 'team', 'upskill', 'coach'])) {
      track('assistant_intent', { i: 'training' });
      botReply('Yes — <strong>AI Strategy & Training</strong> from $4,000, plus workshops from half-day to 5-day intensive cohorts. Details on the services page.',
        { actions: [{ label: 'See training options', href: '/services/', track: 'assistant-cta-training' }] });
      return;
    }
    if (has(t, ['keja'])) { kejaAnswer(); return; }
    if (has(t, ['case stud', 'portfolio', 'your work', 'past work', 'projects', 'examples', 'proof', 'worked with', 'worked for', 'references', 'built before', 'have you built', 'what have you built', 'show me your', 'tapi', 'kilimo', 'verxlite', 'fraud', 'agentreplay', 'busara', 'clients'])) { casesAnswer(); return; }
    if (has(t, ['who are you', 'who is victor', 'about victor', 'about you', 'experience', 'background', 'bio', 'resume'])) { aboutAnswer(); return; }
    if (has(t, ['whatsapp', 'call', 'phone', 'talk', 'speak', 'voice'])) {
      track('assistant_intent', { i: 'whatsapp' });
      botReply('Calls and chat run through <strong>WhatsApp: +254 724 346 971</strong> — open the chat and tap the call icon for a voice or video call. For scheduled calls, the calendar below is best.',
        { actions: [
          { label: '💬 Open WhatsApp', primary: true, href: waLink('Hi Victor — a question from your booking page: '), newTab: true, track: 'assistant-cta-wa' },
          { label: '📅 Schedule a call instead', onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-wa' }
        ] });
      return;
    }
    if (has(t, ['email', 'mail', 'message'])) {
      track('assistant_intent', { i: 'email' });
      botReply('Email works too: <strong>mututandunda@gmail.com</strong> — replies within 24 hours. Or use the message form on this page.',
        { actions: [{ label: '✍️ Use the form', onClick: function () { goTab('form'); }, track: 'assistant-cta-form' }] });
      return;
    }
    if (has(t, ['book', 'schedule', 'calendar', 'meeting', 'appointment', 'slot', 'available'])) {
      track('assistant_intent', { i: 'book' });
      botReply('The calendar is right below — pick any 30-minute slot; you\'ll get an instant calendar invite.',
        { actions: [{ label: '📅 Go to the calendar', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book' }] });
      return;
    }
    if (has(t, ['job', 'vacancy', 'intern', 'employment', 'employ', 'recruit'])) {
      track('assistant_intent', { i: 'jobs' });
      botReply('I\'m not currently looking for employment, but partnerships and contract work are welcome — LinkedIn or the free assessment call are the right channels.',
        { actions: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/victor-ndunda', newTab: true }] });
      return;
    }
    if (has(t, ['not sure', "don't know", 'dont know', 'idea', 'where to start', 'start'])) {
      track('assistant_intent', { i: 'unsure' });
      botReply('That\'s exactly what the free assessment is for — bring the workflow or the idea, and you\'ll leave with an honest build/no-build read and the smallest useful first step. If you\'d rather explore package prices first, I can walk you through them.',
        { actions: [
          { label: '📅 Book the free assessment', primary: true, onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-unsure' },
          { label: '💰 Show packages', onClick: packagesAnswer, track: 'assistant-cta-pkg-unsure' }
        ] });
      return;
    }
    if (has(t, ['guarantee', 'warranty', 'refund', 'support', 'maintenance', 'after delivery', 'after the build', 'retainer', 'sla'])) { supportAnswer(); return; }
    if (has(t, ['hosting', 'cloud', 'server', 'deploy', 'infrastructure', 'on-premise', 'on premise'])) { hostingAnswer(); return; }
    if (has(t, ['offline', 'low bandwidth', 'no internet', 'edge device', 'cheap phone', 'low-end'])) { offlineAnswer(); return; }
    if (has(t, ['deliverable', 'what do i get', 'handover', 'documentation', 'source code', 'who owns'])) { deliverablesAnswer(); return; }
    if (has(t, ['your team', 'work alone', 'solo', 'who else', 'your company', 'agency'])) { teamAnswer(); return; }
    if (has(t, ['what can you do', 'help', 'options', 'commands'])) { capabilitiesAnswer(); return; }
    if (has(t, ['hi', 'hello', 'hey', 'habari', 'jambo', 'good morning', 'good afternoon'])) {
      track('assistant_intent', { i: 'greeting' });
      botReply('Habari! Ask me anything about services, pricing, or timelines — or describe what you want to build ("AI for a hospital", "WhatsApp ordering for my restaurant") and I\'ll map it to the catalogue.', null, DEFAULT_CHIPS);
      return;
    }
    if (has(t, ['thank', 'asante', 'great', 'perfect', 'awesome'])) {
      botReply('Karibu! Anything else — or shall we get a time in the calendar?', null, [{ label: '📅 Book a time', value: 'book' }, { label: '💰 Get an estimate', value: 'newestimate' }]);
      return;
    }

    // FAQ match — scored keyword overlap (v2: recall, not just first-4-words AND)
    if (DATA.faqs) {
      var best = null, bestScore = 0;
      DATA.faqs.forEach(function (f) {
        var q = (f.q || f.question || '').toLowerCase();
        var words = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 3; });
        var score = 0;
        words.forEach(function (w) { if (t.indexOf(w) !== -1) score++; });
        var ratio = words.length ? score / words.length : 0;
        if (score >= 2 && ratio >= 0.34 && score > bestScore) { best = f; bestScore = score; }
      });
      if (best) {
        track('assistant_faq', { score: bestScore });
        botReply(esc(best.a || best.answer || 'See the services FAQ.'),
          { actions: [{ label: 'Full FAQ', href: '/services/#faq', track: 'assistant-cta-faq' }] }, DEFAULT_CHIPS);
        return;
      }
    }

    // Service keyword match — "I need a chatbot for …" / "computer vision for …"
    var ids = Object.keys(SERVICE_KEYWORDS);
    for (var i2 = 0; i2 < ids.length; i2++) {
      if (t_has(t, SERVICE_KEYWORDS[ids[i2]])) { serviceAnswer(ids[i2]); return; }
    }

    // Domain match without project signal — short industry mention still maps
    if (dom) { domainAnswer(dom, text); return; }

    // Fallback — the visitor's question travels with them (v2: no dead ends)
    track('assistant_fallback');
    botReply(
      'I don\'t have a scripted answer for that one — but it goes <strong>straight to Victor, question included</strong>. Or try a project angle like "AI for a hospital" or "WhatsApp ordering":',
      { actions: [
        { label: '💬 Ask on WhatsApp (question attached)', primary: true, href: waLink('Hi Victor — question from your booking page assistant: "' + text + '"'), newTab: true, onClick: function () { notifyHandoff('WhatsApp (unanswered question)'); }, track: 'assistant-cta-wa-fb' },
        { label: '✍️ Send it as a message', onClick: function () { notifyHandoff('brief form (unanswered question)'); prefillForm('Question from the booking assistant:\n"' + text + '"\n\nContext: '); }, track: 'assistant-cta-brief-fb' },
        { label: '📅 Book the free call', onClick: function () { goTab('schedule'); }, track: 'assistant-cta-book-fb' }
      ] },
      DEFAULT_CHIPS
    );
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
    'smb': ['small business', 'smb', 'sme', 'chama']
  };

  function handle(value, label) {
    if (label) addUser(label);
    else addUser(value);
    track('assistant_msg');

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
    if (value === 'newestimate') return startEstimate();
    if (value === 'industry') {
      botReply('Describe your world — <strong>hospital, school, sacco, hotel, farm, NGO, law firm, logistics, real estate…</strong> — and I\'ll map it to the published catalogue with from-prices.', null, []);
      return;
    }
    if (value === 'case studies') { casesAnswer(); return; }

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

  /* ── Boot ────────────────────────────────────────────────────────── */
  function load(cb) {
    fetch('/services/data.json?v=1.3').then(function (r) { return r.json(); }).then(function (d) {
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
      track('assistant_boot');
      botReply(
        'Karibu! I can answer <strong>services, pricing, and timelines</strong> — give you a <strong>ballpark estimate</strong> from published rates — or map a project idea to the catalogue ("AI for a hospital", "WhatsApp ordering", "sacco loan scoring"). Where should we start?',
        null,
        DEFAULT_CHIPS
      );
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
