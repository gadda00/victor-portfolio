/* =============================================================
   Victor Ndunda — Services Page Logic
   Loads services/data.json, renders all sections, currency toggle,
   interactive quote calculator
   ============================================================= */

(function (global) {
  'use strict';

  let DATA = null;
  let currency = 'usd'; // 'usd' or 'kes'

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function fmtMoney(n, curr) {
    if (typeof n !== 'number') return n;
    if (curr === 'kes') return 'KES ' + n.toLocaleString();
    return '$' + n.toLocaleString();
  }

  // ─── Init ──────────────────────────────────────────────────
  async function init() {
    try {
      const resp = await fetch('/services/data.json');
      if (!resp.ok) throw new Error('Failed to load services data');
      DATA = await resp.json();
      renderAll();
      initCalculator();
      initCurrencyToggle();
      initFAQ();
    } catch (err) {
      console.error('[services] init failed:', err);
      $('#packages').innerHTML = '<div class="svc-calc-disclaimer">Failed to load services data. Please refresh.</div>';
    }
  }

  // ─── Render all sections ───────────────────────────────────
  function renderAll() {
    renderPackages();
    renderServices();
    renderCaseStudies();
    renderTraining();
    renderGuides();
    renderPricingModels();
    renderFAQs();
    applyCurrency();
  }

  // ─── Packages ──────────────────────────────────────────────
  function renderPackages() {
    const html = DATA.packages.map(p => {
      const oneTime = currency === 'kes' ? p.price.kesOneTime : p.price.usdOneTime;
      const monthly = currency === 'kes' ? p.price.kesMonthly : p.price.usdMonthly;
      const oneTimeStr = typeof oneTime === 'number' ? fmtMoney(oneTime, currency) : oneTime || 'Custom';
      const monthlyStr = monthly ? (typeof monthly === 'number' ? fmtMoney(monthly, currency) : monthly) : null;

      return `
        <div class="svc-package" style="--pkg-color:${p.color}">
          <div class="icon">${p.icon}</div>
          <div class="name">${esc(p.name)}</div>
          <div class="tagline">${esc(p.tagline)}</div>
          <div class="best-for"><strong>Best for:</strong> ${esc(p.bestFor)}</div>
          <div class="price-block" data-pkg="${p.id}">
            <div class="price-row">
              <span class="price-label">${p.tier === 'discovery' ? 'One-time' : 'Build'}</span>
              <span class="price-value usd">${oneTimeStr}</span>
            </div>
            ${monthlyStr ? `
              <div class="price-row">
                <span class="price-label">Monthly</span>
                <span class="price-value">${monthlyStr}</span>
              </div>
            ` : ''}
            ${p.price.note ? `<div class="price-note">${esc(p.price.note)}</div>` : ''}
          </div>
          <div class="timeline">⏱ ${esc(p.timeline)}</div>
          <ul class="deliverables">
            ${p.deliverables.map(d => `<li>${esc(d)}</li>`).join('')}
          </ul>
          <div class="outcome"><strong>Outcome:</strong> ${esc(p.outcome)}</div>
          <a href="/#contact" class="pkg-cta" data-pkg-cta="${p.id}">Get started →</a>
        </div>
      `;
    }).join('');
    $('#packages').innerHTML = html;
  }

  // ─── Services ──────────────────────────────────────────────
  function renderServices() {
    const html = DATA.services.map(s => `
      <a href="/#contact" class="svc-service" data-svc="${s.id}">
        <div class="icon">${s.icon}</div>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.description)}</p>
        <div class="examples">
          ${s.examples.map(e => `<span class="example-tag">${esc(e)}</span>`).join('')}
        </div>
        <div class="from-price" data-svc-price="${s.id}">
          From <span class="usd-val">${fmtMoney(s.fromPrice.usd, 'usd')}</span>
          <small>(${fmtMoney(s.fromPrice.kes, 'kes')} local)</small>
        </div>
      </a>
    `).join('');
    $('#services-list').innerHTML = html;
  }

  // ─── Case studies ──────────────────────────────────────────
  function renderCaseStudies() {
    const html = DATA.caseStudies.map(c => `
      <div class="svc-case">
        <div class="svc-case-header">
          <div class="svc-case-name">${esc(c.name)} <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" title="Visit live site">↗</a></div>
          <div class="svc-case-tagline">${esc(c.tagline)}</div>
        </div>
        <div class="svc-case-stats">
          ${c.stats.map(s => `
            <div class="svc-case-stat">
              <div class="v">${esc(s.value)}</div>
              <div class="l">${esc(s.label)}</div>
            </div>
          `).join('')}
        </div>
        <div class="svc-case-body">
          <p>${esc(c.description)}</p>
          <div class="what-title">What I built</div>
          <ul>${c.whatIBuilt.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
          <div class="svc-case-tech">
            ${c.tech.map(t => `<span class="tech-tag">${esc(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
    $('#cases').innerHTML = html;
  }

  // ─── Training ──────────────────────────────────────────────
  function renderTraining() {
    const html = DATA.training.map(t => {
      const priceFrom = currency === 'kes'
        ? (t.price.kesPerPerson ? fmtMoney(t.price.kesPerPerson, 'kes') + '/person' : fmtMoney(t.price.kesPerTeam, 'kes') + '/team')
        : (t.price.usdPerPerson ? fmtMoney(t.price.usdPerPerson, 'usd') + '/person' : fmtMoney(t.price.usdPerTeam, 'usd') + '/team');
      return `
        <div class="svc-train-card">
          <span class="duration">${esc(t.duration)}</span>
          <h3>${esc(t.name)}</h3>
          <div class="audience">${esc(t.audience)}</div>
          <ul>${t.topics.map(topic => `<li>${esc(topic)}</li>`).join('')}</ul>
          <div class="price-from" data-train="${t.id}">From ${priceFrom}</div>
          <div class="format">📍 ${esc(t.format)}</div>
        </div>
      `;
    }).join('');
    $('#training').innerHTML = html;
  }

  // ─── Guides ────────────────────────────────────────────────
  function renderGuides() {
    const html = DATA.guides.map(g => `
      <a href="${g.free ? '/blog/' : '/#contact'}" class="svc-guide" data-guide="${g.id}">
        <div class="cat-row">
          <span class="cat ${esc(g.category)}">${esc(g.category)}</span>
          <span class="duration">${esc(g.duration)}</span>
        </div>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.summary)}</p>
        <div class="audience">👥 ${esc(g.audience)}</div>
        <div class="price-row">
          ${g.free
            ? '<span class="free">✓ Free</span>'
            : `<span class="paid" data-guide-price="${g.id}">${fmtMoney(g.price.usd, 'usd')} (${fmtMoney(g.price.kes, 'kes')})</span>`
          }
          <span style="font-size:0.75rem;color:var(--text-dim)">${g.free ? 'Read →' : 'Enroll →'}</span>
        </div>
      </a>
    `).join('');
    $('#guides').innerHTML = html;
  }

  // ─── Pricing models ────────────────────────────────────────
  function renderPricingModels() {
    const html = DATA.pricingModels.map(m => `
      <div class="svc-model">
        <h4>${esc(m.name)}</h4>
        <p>${esc(m.description)}</p>
        <div class="best-for"><strong>Best for:</strong> ${m.best.map(b => esc(b)).join(', ')}</div>
      </div>
    `).join('');
    $('#models').innerHTML = html;
  }

  // ─── FAQs ──────────────────────────────────────────────────
  function renderFAQs() {
    const html = DATA.faqs.map(f => `
      <details class="svc-faq">
        <summary>${esc(f.q)}</summary>
        <div class="svc-faq-body">${esc(f.a)}</div>
      </details>
    `).join('');
    $('#faqs').innerHTML = html;
  }

  // ─── Currency toggle ───────────────────────────────────────
  function initCurrencyToggle() {
    $$('.svc-currency-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        currency = btn.dataset.curr;
        $$('.svc-currency-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyCurrency();
      });
    });
  }

  function applyCurrency() {
    // Update packages
    DATA.packages.forEach(p => {
      const block = $(`.price-block[data-pkg="${p.id}"]`);
      if (!block) return;
      const rows = $$('.price-row', block);
      const oneTime = currency === 'kes' ? p.price.kesOneTime : p.price.usdOneTime;
      const monthly = currency === 'kes' ? p.price.kesMonthly : p.price.usdMonthly;
      if (rows[0]) {
        const v = $('.price-value', rows[0]);
        v.textContent = typeof oneTime === 'number' ? fmtMoney(oneTime, currency) : (oneTime || 'Custom');
      }
      if (rows[1] && monthly) {
        const v = $('.price-value', rows[1]);
        v.textContent = typeof monthly === 'number' ? fmtMoney(monthly, currency) : monthly;
      }
    });

    // Update services "from" prices
    DATA.services.forEach(s => {
      const el = $(`.from-price[data-svc-price="${s.id}"]`);
      if (!el) return;
      const val = currency === 'kes' ? s.fromPrice.kes : s.fromPrice.usd;
      const otherVal = currency === 'kes' ? s.fromPrice.usd : s.fromPrice.kes;
      const otherCurr = currency === 'kes' ? 'usd' : 'kes';
      el.innerHTML = `From <span class="usd-val">${fmtMoney(val, currency)}</span> <small>(${fmtMoney(otherVal, otherCurr)} ${otherCurr === 'kes' ? 'local' : 'global'})</small>`;
    });

    // Update training
    DATA.training.forEach(t => {
      const el = $(`.price-from[data-train="${t.id}"]`);
      if (!el) return;
      const priceFrom = currency === 'kes'
        ? (t.price.kesPerPerson ? fmtMoney(t.price.kesPerPerson, 'kes') + '/person' : fmtMoney(t.price.kesPerTeam, 'kes') + '/team')
        : (t.price.usdPerPerson ? fmtMoney(t.price.usdPerPerson, 'usd') + '/person' : fmtMoney(t.price.usdPerTeam, 'usd') + '/team');
      el.textContent = 'From ' + priceFrom;
    });

    // Update guides
    DATA.guides.forEach(g => {
      if (g.free) return;
      const el = $(`[data-guide-price="${g.id}"]`);
      if (!el) return;
      const val = currency === 'kes' ? g.price.kes : g.price.usd;
      el.textContent = fmtMoney(val, currency);
    });

    // Update calculator result
    updateCalcResult();
  }

  // ─── FAQ accordion (close others on open) ──────────────────
  function initFAQ() {
    $$('.svc-faq').forEach(faq => {
      faq.addEventListener('toggle', () => {
        if (faq.open) {
          $$('.svc-faq').forEach(other => {
            if (other !== faq) other.open = false;
          });
        }
      });
    });
  }

  // ─── Interactive quote calculator ──────────────────────────
  const calc = {
    package: 'starter',
    services: new Set(['chatbots']),
    timeline: 'standard',
    support: 'monthly',
  };

  function initCalculator() {
    // Package buttons
    $$('[data-calc-pkg]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-calc-pkg]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calc.package = btn.dataset.calcPkg;
        updateCalcResult();
      });
    });

    // Service toggles
    $$('[data-calc-svc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const svc = btn.dataset.calcSvc;
        if (calc.services.has(svc)) {
          calc.services.delete(svc);
          btn.classList.remove('active');
        } else {
          calc.services.add(svc);
          btn.classList.add('active');
        }
        updateCalcResult();
      });
    });

    // Timeline
    $$('[data-calc-timeline]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-calc-timeline]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calc.timeline = btn.dataset.calcTimeline;
        updateCalcResult();
      });
    });

    // Support
    $$('[data-calc-support]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-calc-support]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calc.support = btn.dataset.calcSupport;
        updateCalcResult();
      });
    });

    updateCalcResult();
  }

  function updateCalcResult() {
    const pkg = DATA.packages.find(p => p.id === calc.package);
    if (!pkg) return;

    // Base price from package
    let base = currency === 'kes' ? (pkg.price.kesOneTime || 0) : (pkg.price.usdOneTime || 0);
    if (typeof base !== 'number') base = 0; // Custom

    // Add services (fromPrice)
    let servicesTotal = 0;
    calc.services.forEach(svcId => {
      const svc = DATA.services.find(s => s.id === svcId);
      if (svc) servicesTotal += currency === 'kes' ? svc.fromPrice.kes : svc.fromPrice.usd;
    });

    // Timeline multiplier
    const timelineMult = { rush: 1.5, standard: 1.0, flexible: 0.85 }[calc.timeline] || 1.0;

    // Subtotal
    let subtotal = (base + servicesTotal) * timelineMult;

    // Support (monthly)
    let monthly = 0;
    if (calc.support === 'monthly' && pkg.price.usdMonthly) {
      monthly = currency === 'kes' ? (pkg.price.kesMonthly || 0) : (pkg.price.usdMonthly || 0);
      if (typeof monthly !== 'number') monthly = 0;
    }

    const el = $('#calcResult');
    if (!el) return;

    if (pkg.id === 'enterprise') {
      el.innerHTML = `
        <div class="est-label">Estimated Range</div>
        <div class="est-value">Custom</div>
        <div class="est-detail">Enterprise engagements typically start at ${currency === 'kes' ? 'KES 3.2M' : '$25K'} build + ${currency === 'kes' ? 'KES 650K/mo' : '$5K/mo'}</div>
        <a href="/#contact" class="est-cta">Book a discovery call →</a>
      `;
    } else {
      const total = Math.round(subtotal);
      el.innerHTML = `
        <div class="est-label">Estimated One-Time Cost</div>
        <div class="est-value">${fmtMoney(total, currency)}</div>
        <div class="est-detail">
          ${monthly > 0 ? `+ ${fmtMoney(monthly, currency)}/mo managed support` : 'No monthly retainer'}
          <br/><small>Includes: ${pkg.name}${calc.services.size > 0 ? ' + ' + calc.services.size + ' service' + (calc.services.size > 1 ? 's' : '') : ''} · ${calc.timeline} timeline</small>
        </div>
        <a href="/#contact" class="est-cta">Get a detailed quote →</a>
      `;
    }
  }

  // ─── Boot ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.ServicesPage = { init, renderAll };
})(window);
