/* ═══════════════════════════════════════════════════════════════════
 * ROI Calculator — victorndunda.com/services/roi.html (v18)
 * Runs 100% client-side. Supports shareable URL params:
 *   ?team=5&hours=8&rate=12&cur=usd&cov=70&care=1
 * Persisted to localStorage ('vn_roi_inputs') so returning visitors
 * keep their numbers.
 * ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE = 'vn_roi_inputs';
  var WEEKS_PER_MONTH = 4.33;

  // Prices mirror services/data.json v1.5.0 (single source of truth)
  var SERVICES = [
    { id: 'audit', name: 'Needs Assessment', icon: '🔍', priceUsd: 2500, monthlyUsd: 0,
      note: 'Maps which work is worth automating first — 50% of the fee is credited toward any build.' },
    { id: 'starter', name: 'Starter Build', icon: '🚀', priceUsd: 12000, monthlyUsd: 1400, popular: true,
      note: 'One workflow automated end-to-end — chatbot, knowledge base, 1 integration.' },
    { id: 'growth', name: 'Big Projects', icon: '🏗️', priceUsd: 35000, monthlyUsd: 5000, from: true,
      note: 'Multi-system programs: RAG platform, agents, integrations, SLA-backed.' }
  ];

  var KES_PER_USD_LOCAL = 80; // published local-market convention

  var els = {};
  function $(s) { return document.querySelector(s); }

  function state() {
    return {
      team: clamp(Number(els.team.value) || 1, 1, 500),
      hours: clamp(Number(els.hours.value) || 1, 1, 60),
      rate: clamp(Number(els.rate.value) || 1, 0.5, 500),
      cur: els.currency.value === 'kes' ? 'kes' : 'usd',
      cov: clamp(Number(els.coverage.value) || 70, 10, 90),
      care: els.care.checked
    };
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function fmtMoney(v, cur) {
    if (cur === 'kes') return 'KES ' + Math.round(v).toLocaleString('en-US');
    return '$' + Math.round(v).toLocaleString('en-US');
  }
  function fmtHours(v) {
    var r = Math.round(v);
    return r.toLocaleString('en-US') + (r === 1 ? ' hr' : ' hrs');
  }
  function fmtMonths(m) {
    if (!isFinite(m)) return 'never';
    if (m < 1) return 'same month';
    if (m < 10) return m.toFixed(1).replace(/\.0$/, '') + ' mo';
    return Math.round(m) + ' mo';
  }

  function compute(s) {
    var routineHours = s.team * s.hours * WEEKS_PER_MONTH;
    var savedHours = routineHours * s.cov / 100;
    var monthlyValue = savedHours * s.rate;
    // prices are USD; if user works in KES, convert service prices to KES
    var k = s.cur === 'kes' ? KES_PER_USD_LOCAL : 1;
    return {
      routineHours: routineHours,
      savedHours: savedHours,
      monthlyValue: monthlyValue,
      yearlyValue: monthlyValue * 12,
      services: SERVICES.map(function (svc) {
        var price = svc.priceUsd * k;
        var care = s.care ? svc.monthlyUsd * k : 0;
        var payback = monthlyValue > 0 ? (price + care) / monthlyValue : Infinity;
        var net12 = monthlyValue * 12 - price - care * 12;
        return { svc: svc, price: price, care: care, payback: payback, net12: net12 };
      })
    };
  }

  function render() {
    var s = state();
    var r = compute(s);
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* private mode */ }

    $('#roi-hours-out').textContent = fmtHours(r.savedHours);
    $('#roi-hours-sub').innerHTML = 'of <span>' + fmtHours(r.routineHours) + '</span> routine hours currently spent';
    $('#roi-value-out').textContent = fmtMoney(r.monthlyValue, s.cur);
    $('#roi-value-sub').textContent = s.cov + '% of ' + s.hours + ' hrs × ' + s.team + (s.team === 1 ? ' person' : ' people') + ' × ' + fmtMoney(s.rate, s.cur).replace(/^KES /, 'KES ') + '/hr';
    $('#roi-year-out').textContent = fmtMoney(r.yearlyValue, s.cur);

    var grid = $('#roi-payback-grid');
    grid.innerHTML = r.services.map(function (x) {
      var fast = isFinite(x.payback) && x.payback <= 12;
      var never = !isFinite(x.payback) || x.payback > 120;
      var monthsCls = never ? 'roi-pay-months never' : (fast ? 'roi-pay-months fast' : 'roi-pay-months');
      var monthsTxt = never ? (r.monthlyValue <= 0 ? 'no payback at these inputs' : '>10 years — reassess scope') : fmtMonths(x.payback);
      return '' +
        '<div class="roi-pay-card' + (x.svc.popular ? ' popular' : '') + '">' +
          (x.svc.popular ? '<span class="roi-pay-badge">★ Most popular</span>' : '') +
          '<div class="roi-pay-name">' + x.svc.icon + ' ' + x.svc.name + '</div>' +
          '<div class="roi-pay-price">' + (x.svc.from ? 'from ' : '') + fmtMoney(x.price, s.cur) + (s.care && x.care ? ' + ' + fmtMoney(x.care, s.cur) + '/mo care' : '') + '</div>' +
          '<div class="' + monthsCls + '">↩ ' + monthsTxt + '</div>' +
          '<div class="roi-pay-net">12-month net: <b>' + (x.net12 >= 0 ? '+' : '−') + fmtMoney(Math.abs(x.net12), s.cur) + '</b></div>' +
          '<div class="roi-pay-price" style="font-size:0.74rem;line-height:1.5">' + x.svc.note + '</div>' +
        '</div>';
    }).join('');
  }

  function syncSliders() {
    var s = state();
    els.teamRange.value = clamp(s.team, 1, 50);
    els.hoursRange.value = clamp(s.hours, 1, 40);
    els.coverageRange.value = clamp(s.cov, 10, 90);
  }

  function shareLink() {
    var s = state();
    var u = new URL(location.href.split('?')[0]);
    u.searchParams.set('team', s.team);
    u.searchParams.set('hours', s.hours);
    u.searchParams.set('rate', s.rate);
    u.searchParams.set('cur', s.cur);
    u.searchParams.set('cov', s.cov);
    u.searchParams.set('care', s.care ? '1' : '0');
    return u.toString();
  }

  function toast(msg) {
    if (window.vnToast) { window.vnToast(msg, '🔗'); return; }
    var t = document.createElement('div');
    t.textContent = msg;
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 18px;border-radius:999px;font-size:0.85rem;font-weight:600;z-index:99';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function init() {
    els = {
      team: $('#roi-team'), hours: $('#roi-hours'), rate: $('#roi-rate'),
      currency: $('#roi-currency'), coverage: $('#roi-coverage'), care: $('#roi-care'),
      teamRange: $('#roi-team-range'), hoursRange: $('#roi-hours-range'), coverageRange: $('#roi-coverage-range')
    };
    if (!els.team) return; // noscript / malformed page

    // restore: URL params take precedence, then localStorage
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { /* ignore */ }
    var q = new URLSearchParams(location.search);
    var src = {
      team: q.get('team'), hours: q.get('hours'), rate: q.get('rate'),
      cur: q.get('cur'), cov: q.get('cov'), care: q.get('care')
    };
    if (src.team || src.hours || src.rate) {
      s = { team: src.team, hours: src.hours, rate: src.rate, cur: src.cur, cov: src.cov, care: src.care !== '0' };
    }
    if (s) {
      if (s.team) els.team.value = clamp(Number(s.team) || 5, 1, 500);
      if (s.hours) els.hours.value = clamp(Number(s.hours) || 8, 1, 60);
      if (s.rate) els.rate.value = clamp(Number(s.rate) || 12, 0.5, 500);
      if (s.cur === 'kes') els.currency.value = 'kes';
      if (s.cov) els.coverage.value = clamp(Number(s.cov) || 70, 10, 90);
      if (s.care === false || s.care === '0') els.care.checked = false;
    }

    [els.team, els.hours, els.rate, els.coverage].forEach(function (i) {
      i.addEventListener('input', function () { syncSliders(); render(); });
    });
    els.currency.addEventListener('change', render);
    els.care.addEventListener('change', render);
    els.teamRange.addEventListener('input', function () { els.team.value = this.value; render(); });
    els.hoursRange.addEventListener('input', function () { els.hours.value = this.value; render(); });
    els.coverageRange.addEventListener('input', function () { els.coverage.value = this.value; render(); });

    document.querySelectorAll('.roi-presets button').forEach(function (b) {
      b.addEventListener('click', function () {
        els.rate.value = b.dataset.rate;
        if (b.dataset.cur) els.currency.value = b.dataset.cur;
        render();
      });
    });

    var share = $('#roi-share');
    if (share) share.addEventListener('click', function () {
      var url = shareLink();
      var done = function () { toast('Link copied — your numbers are in it'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { location.href = url; });
      } else { location.href = url; }
    });

    var reset = $('#roi-reset');
    if (reset) reset.addEventListener('click', function () {
      try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
      location.href = location.pathname;
    });

    syncSliders();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
