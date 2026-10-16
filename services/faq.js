/* ═══════════════════════════════════════════════════════════════════
 * FAQ page — victorndunda.com/services/faq.html (v18)
 * Loads FAQs from services/data.json (the source of truth), adds
 * v18 pricing FAQs, renders searchable accordion + FAQPage JSON-LD.
 * ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // v18 additions — priced questions the data.json FAQ set doesn't cover yet
  var EXTRA_FAQS = [
    {
      q: 'Can I pay the Starter Build in instalments?',
      a: 'Yes — 3 payments of $4,200 (KES 336K), no fees. The first instalment books the kickoff, the second lands at the mid-build checkpoint, the third on delivery. Same total as paying upfront; the option exists because SMB cashflow is real. Bigger programs default to milestone billing (30/40/30).'
    },
    {
      q: 'Is there a faster Needs Assessment option?',
      a: 'Yes — Express. Standard delivery is 1–2 weeks; Express compresses it to 1 week for +$1,000. Same deliverables, tighter interview scheduling, you get the readout and roadmap in days. Worth it when a board meeting or funding decision is waiting on the roadmap.'
    },
    {
      q: 'Why did Big Project care drop from $6,000 to $5,000/mo while the build floor rose to $35,000?',
      a: 'Because the two numbers do different jobs. The build floor signals what class of program it is ($15K–$60K is the 2026 market band for real agent programs — a $28K floor under-sold it). The care entry price gates the ongoing relationship — $5,000/mo is friendlier to sign, and quarterly billing (10% off) locks in longer commitments. Net effect: a stronger anchor up front, lower friction to keep the system healthy for years.'
    },
    {
      q: 'What is the ROI calculator actually assuming?',
      a: 'Your inputs, nothing else: team size × hours per week on routine work × your hourly cost × the share you believe AI can take over. Payback = investment ÷ monthly value recovered. It deliberately does NOT invent industry averages — conservative inputs from you beat optimistic defaults from me. The free assessment replaces the estimate with a scoped, written ROI model.'
    },
    {
      q: 'What happens if I cancel my care plan?',
      a: 'It stops at the end of the paid month. No exit fees, no notice period. You keep everything — code, prompts, data, infrastructure. Monitoring and alerting stop, so an outage becomes your page, not mine; most clients pause instead (monitoring stays on, releases and billing pause). Full terms are on the care plans page.'
    },
    {
      q: 'Do you discount the care plan if I pay quarterly?',
      a: 'Yes — Big Project care bills at 10% less when paid quarterly ($45K/year instead of $50K at the entry tier). Starter care stays monthly because it is priced for SMB budgets already.'
    }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(faqs) {
    var list = document.getElementById('faq-list');
    if (!list) return;

    list.innerHTML = faqs.map(function (f, i) {
      return '' +
        '<details class="faq-item" id="faq-' + i + '">' +
          '<summary><span>' + esc(f.q) + '</span><span class="faq-chev" aria-hidden="true">▾</span></summary>' +
          '<div class="faq-a">' + esc(f.a).replace(/(\$\d[\d,]*|KES [\dKM]+)/g, '<strong>$1</strong>') + '</div>' +
        '</details>';
    }).join('');

    // count line
    var count = document.getElementById('faq-count');
    var updateCount = function (shown) {
      if (!count) return;
      count.textContent = shown + (shown === 1 ? ' answer' : ' answers');
    };
    updateCount(faqs.length);
    window.__faqUpdateCount = updateCount;

    // FAQPage JSON-LD (rich results) — uses the full unfiltered set
    try {
      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(function (f) {
          return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } };
        })
      });
      document.head.appendChild(ld);
    } catch (e) { /* structured data must never break the page */ }

    // ── Instant search ──
    var input = document.getElementById('faq-search');
    if (!input) return;
    var items = [].slice.call(list.querySelectorAll('.faq-item'));
    var empty = document.getElementById('faq-empty');

    var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); };
    var QUERY_CACHE = faqs.map(function (f) { return norm(f.q + ' ' + f.a); });

    input.addEventListener('input', function () {
      var q = norm(input.value);
      var shown = 0;
      items.forEach(function (el, i) {
        var hit = !q || QUERY_CACHE[i].indexOf(q) !== -1;
        el.hidden = !hit;
        if (hit) { shown++; if (q) el.open = true; }
        if (!q) el.open = false;
      });
      if (window.__faqUpdateCount) window.__faqUpdateCount(shown);
      if (empty) empty.hidden = shown > 0;
    });

    // deep-link: /services/faq.html?q=swahili pre-fills the search
    var pre = new URLSearchParams(location.search).get('q');
    if (pre) { input.value = pre; input.dispatchEvent(new Event('input')); }
  }

  function init() {
    var cacheBust = '?v=18';
    fetch('/services/data.json' + cacheBust)
      .then(function (r) { return r.json(); })
      .then(function (d) { render(EXTRA_FAQS.concat(d.faqs || [])); })
      .catch(function () { render(EXTRA_FAQS); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
