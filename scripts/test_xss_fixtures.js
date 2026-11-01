/* DOM-XSS fixture tests (v21).
 *
 * Injects hostile payloads into every user-controlled storage surface
 * (briefs, invoices, leads, job applications, login log, imported
 * clients) and asserts the pages render them as TEXT — never as HTML.
 *
 * Payloads cover the review's required set: <img onerror>, </div><script>,
 * javascript: URLs, quote/backslash/newline breaks, oversized strings and
 * invalid Unicode.
 *
 * Run: node scripts/test_xss_fixtures.js
 * (expects nothing else — starts its own static server on an ephemeral port)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { startServer } = require('./lib/static_server');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, cond) => {
  console.log((cond ? '  ok  - ' : '  FAIL - ') + label);
  if (!cond) failures++;
};

/* ── Payloads (the review's required fixture set) ───────────────── */
const XSS = {
  img: '"><img src=x onerror="window.__xssFired=\'img\'">',
  scriptClose: '</div><script>window.__xssFired=2</script>',
  jsUrl: 'javascript:alert(3)',
  quotes: "'\"\\ \n<script>window.__xssFired=4</script>",
  big: ('A').repeat(10000) + '<img src=x onerror="window.__xssFired=5">',
  unicode: '￿�\u0000<img src=x onerror="window.__xssFired=6">'
};
const ALL_PAYLOADS = Object.values(XSS);

(async () => {
  const srv = await startServer();
  const BASE = srv.url;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  let dialogCount = 0;
  page.on('dialog', async d => { dialogCount++; await d.dismiss(); });
  // never let a test actually hit third-party endpoints
  await ctx.route('**api.web3forms.com**', r => r.abort());
  await ctx.route('**accounts.google.com**', r => r.abort());
  await ctx.route('**api.github.com**', r => r.abort());

  /* XSS-detection probe: no injected img/script node, no __xssFired,
     no javascript: href anywhere in the rendered DOM. */
  const probe = () => page.evaluate(() => {
    const bad = {
      fired: window.__xssFired || null,
      imgX: !!document.querySelector('img[src="x"]'),
      jsHref: !!document.querySelector('a[href^="javascript:"]'),
      strayScript: [...document.querySelectorAll('script')].some(s => s.textContent.includes('__xssFired'))
    };
    return bad;
  });
  const assertClean = async (where) => {
    const bad = await probe();
    const clean = !bad.fired && !bad.imgX && !bad.jsHref && !bad.strayScript && dialogCount === 0;
    check(`${where}: rendered as text, no execution (fired=${bad.fired}, imgX=${bad.imgX}, jsHref=${bad.jsHref}, dialogs=${dialogCount})`, clean);
  };

  /* ── 1. Payment page (brief data from localStorage) ─────────────── */
  await page.goto(BASE + '/services/payment.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((p) => {
    localStorage.setItem('vn_client_briefs', JSON.stringify([{
      id: 'xss-brief-1',
      createdAt: new Date().toISOString(),
      estimate: { packageId: 'starter', packageName: p.img, totalUsd: 9000, totalKes: 700000, timeline: p.scriptClose },
      details: { name: p.quotes, company: p.jsUrl, email: 'x@y.z' },
      status: 'contracted'
    }]));
  }, XSS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const payText = await page.evaluate(() => document.body.innerText.includes('No brief selected'));
  check('payment page rendered the hostile brief (not the empty state)', !payText);
  await assertClean('payment page (packageName/timeline/client/quotes)');
  const mailtoOk = await page.evaluate(() =>
    [...document.querySelectorAll('#paymentContent a[href]')].every(a => {
      const h = a.getAttribute('href') || '';
      return h.startsWith('mailto:') || h.startsWith('https://wa.me') || h.startsWith('https://') || h.startsWith('/');
    }));
  check('payment page: all generated links are mailto/https/root-relative (contract id sanitized)', mailtoOk);

  /* ── 2. Dashboard sections (storage-seeded hostile data) ───────── */
  await page.evaluate((p) => {
    sessionStorage.setItem('victor_session', JSON.stringify({
      email: 'owner@test', name: 'Owner', sessionStart: Date.now(), lastActivity: Date.now()
    }));
    localStorage.setItem('vn_invoices', JSON.stringify([{
      id: 'inv1', number: p.img, due: '2026-01-01', status: 'sent', vatOn: false, discountPct: 0,
      client: { name: p.scriptClose, company: p.quotes, email: 'a@b.c' },
      items: [{ desc: p.img, qty: 1, rateUsd: 100 }]
    }]));
    localStorage.setItem('vn_leads', JSON.stringify([
      { name: p.img, source: p.scriptClose, status: 'contacted', date: new Date().toISOString() },
      { name: p.quotes, source: p.jsUrl, status: 'won', date: new Date().toISOString() }
    ]));
    localStorage.setItem('vn_jobs_applications', JSON.stringify([{
      title: p.img, company: p.scriptClose, status: 'applied', appliedAt: new Date().toISOString()
    }]));
    localStorage.setItem('victor_login_log', JSON.stringify([{
      email: p.img, success: true, timestamp: new Date().toISOString()
    }]));
    localStorage.setItem('vn_portal_clients', JSON.stringify([{
      client: { name: p.scriptClose, email: p.img, company: p.quotes },
      project: {
        id: 'P-XSS', name: p.img, packageName: p.scriptClose, status: 'active', progress: 40,
        estimate: { totalUsd: 5000, totalKes: 400000 },
        payments: [
          { n: 1, label: p.img, usd: 2500, kes: 200000, dueDate: '2026-01-01', status: 'reported', claimedStatus: 'paid', ref: p.quotes, events: [] }
        ],
        retainer: null
      },
      importedAt: new Date().toISOString(), unverified: true
    }]));
  }, XSS);
  await page.goto(BASE + '/dashboard/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  check('dashboard signed in via seeded session (client-side gate — documented limitation)', await page.evaluate(() => document.getElementById('dashApp').style.display === 'block'));

  for (const section of ['invoicing', 'findclients', 'jobs', 'security', 'clients']) {
    await page.click(`.side-link[data-section="${section}"]`);
    await page.waitForTimeout(400);
    await assertClean(`dashboard ${section} section`);
  }
  // clients section must show the hostile imported data as escaped text
  const clientsShown = await page.evaluate(() => document.body.innerText.includes('client claimed'));
  check('dashboard clients: imported claimed-status note rendered', clientsShown);

  /* ── 3. Social composer (topic is free user input) ─────────────── */
  await page.click('.side-link[data-section="social"]');
  await page.waitForTimeout(300);
  await page.fill('#socialTopic', XSS.scriptClose);
  await page.click('#genSocial');
  await page.waitForTimeout(300);
  await assertClean('dashboard social composer (topic)');
  const postRendered = await page.evaluate(() => document.querySelectorAll('.post-card').length);
  check('social composer rendered 4 post cards from the hostile topic', postRendered === 4);

  /* ── 4. Oversized / invalid-unicode sweep on the invoice table ─── */
  await page.evaluate((payloads) => {
    localStorage.setItem('vn_invoices', JSON.stringify([{
      id: 'inv2', number: payloads.big, due: '2026-01-01', status: 'draft',
      client: { name: payloads.unicode, company: '', email: '' }, items: [], payments: []
    }]));
  }, XSS);
  await page.click('.side-link[data-section="invoicing"]');
  await page.waitForTimeout(400);
  await assertClean('dashboard invoicing (10k string + invalid unicode)');

  await browser.close();
  await srv.close();
  console.log('');
  if (failures) { console.error(`xss-fixtures: ${failures} FAILURES`); process.exit(1); }
  console.log('xss-fixtures: all checks passed');
})();
