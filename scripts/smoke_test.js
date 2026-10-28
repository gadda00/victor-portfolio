/* Smoke-test the portfolio site before pushing:
 * - /projects/ renders all projects from projects.json (13 expected)
 * - filter buttons expose aria-pressed state and filtering works
 * - FirstLight card is present with both links; Hazina shows In Development
 * - no console errors on either page
 * Run: node scripts/smoke_test.js  (expects `python3 -m http.server 8099` on the repo root)
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:8099';
const EXPECTED = 13;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const apiRequests = [];
  let apiErrors = 0; // GitHub API rate-limits (datacenter IP) — page design treats these as background-only
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('response', r => {
    const url = r.url();
    if (url.includes('api.github.com/repos/')) apiRequests.push(url);
    if (r.status() >= 400) {
      if (url.includes('api.github.com')) { apiErrors++; return; }
      errors.push('HTTP ' + r.status() + ': ' + url);
    }
  });

  let failures = 0;
  const check = (label, cond) => {
    console.log((cond ? '  ok  - ' : '  FAIL - ') + label);
    if (!cond) failures++;
  };

  // ---- projects page ----
  await page.goto(BASE + '/projects/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500); // let client-side render + GitHub seed stats settle
  const cards = await page.$$('.bento-card');
  check('projects page renders ' + cards.length + ' cards (expected ' + EXPECTED + ')', cards.length === EXPECTED);

  const stats = await page.evaluate(() => ({
    total: document.getElementById('statTotal').textContent,
    live: document.getElementById('statProduction').textContent,
    oss: document.getElementById('statOpenSource').textContent,
  }));
  console.log('       stats:', JSON.stringify(stats));

  const filters = await page.$$('.proj-filter');
  const pressedStates = [];
  for (const f of filters) pressedStates.push(await f.getAttribute('aria-pressed'));
  check('filter buttons have aria-pressed (' + pressedStates.slice(0, 4).join(',') + '...)', pressedStates.every(p => p !== null));

  const pressedTrue = pressedStates.filter(p => p === 'true').length;
  check('exactly one filter starts pressed', pressedTrue === 1);

  // click a category filter -> aria-pressed moves + results announced
  await filters[2].click();
  const afterClick = await page.$$eval('.proj-filter', els => els.map(e => e.getAttribute('aria-pressed')));
  check('aria-pressed updates on click', afterClick.filter(p => p === 'true').length === 1 && afterClick[2] === 'true');
  const liveMsg = await page.textContent('#projectsLive');
  check('results announced to screen readers: "' + liveMsg + '"', /Showing \d+ of 13 projects/.test(liveMsg));

  // search narrows results + announces
  await page.fill('#projectsSearch', 'firstlight');
  await page.waitForTimeout(250);
  const searchCards = await page.$$('.bento-card');
  check('search "firstlight" narrows to 1 card', searchCards.length === 1);
  await page.fill('#projectsSearch', '');
  await filters[0].click();
  await page.waitForTimeout(250);

  // FirstLight + Hazina present with right content
  const html = await page.content();
  check('FirstLight card present', html.includes('FirstLight'));
  check('FirstLight demo link present', html.includes('https://gadda00.github.io/firstlight/'));
  check('Hazina Assist present with In Development badge', html.includes('Hazina Assist') && html.includes('In Development'));
  check('dev status dot rendered', (await page.$$('.card-status-dot.dev')).length >= 1);

  // evidence-led metrics chips (measurement context with dates)
  const chips = await page.$$eval('.card-metrics .metric-chip', els => els.map(e => e.textContent.trim()));
  check('metrics chips rendered (' + chips.length + ')', chips.length >= 6);
  check('client-reported labels visible on Tapi metrics', chips.some(c => c.includes('client-reported')));

  // ---- homepage ----
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(800);
  const home = await page.content();
  check('homepage archive wording says 13', home.includes('13 projects'));
  check('homepage FirstLight spot-card present', home.includes('gadda00.github.io/firstlight'));
  check('no duplicated aria-current in rendered nav', (home.match(/aria-current="page" aria-current="page"/g) || []).length === 0);

  // noscript fallback content is in source (not rendered by JS but must exist)
  await page.goto(BASE + '/projects/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(500);
  const pageSrc = await page.content();
  check('noscript fallback exists in DOM', pageSrc.includes('these links work without it'));

  // console errors: drop the bare "Failed to load resource 40x" duplicates of
  // already-counted GitHub API rate-limit responses; everything else is real.
  const realErrors = errors.filter(e =>
    !(apiErrors > 0 && /Failed to load resource.*40(1|3|4)/.test(e) && !/:\s*http/.test(e)));
  console.log('\nconsole errors:', realErrors.length ? realErrors : 'none',
              apiErrors ? '(' + apiErrors + ' GitHub API rate-limit response(s) ignored)' : '');
  check('zero console errors', realErrors.length === 0);
  const malformedApi = apiRequests.filter(u => /repos\/https?:/.test(u));
  check('all GitHub API URLs well-formed (' + apiRequests.length + ' requests)', malformedApi.length === 0);

  await browser.close();
  console.log(failures === 0 ? '\nSMOKE TEST PASSED' : '\nSMOKE TEST FAILED (' + failures + ')');
  process.exit(failures === 0 ? 0 : 1);
})();
