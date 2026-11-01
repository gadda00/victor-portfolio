/* Accessibility audit (v21) — axe-core at desktop and mobile widths.
 *
 * Runs axe-core against the key public pages at 2 viewport sizes and fails
 * on serious/critical violations. The public site targets WCAG-aligned
 * good practice; this gate keeps regressions out. (No "WCAG certified"
 * claim is made — see TRUST_BOUNDARIES.md.)
 *
 * Run: node scripts/test_a11y.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./lib/static_server');

const AXE_SOURCE = path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js');

const PAGES = ['/', '/projects/', '/blog/', '/services/', '/book/', '/privacy-policy.html', '/trust-boundaries.html'];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 }
];

let failures = 0;
const check = (label, cond) => {
  console.log((cond ? '  ok  - ' : '  FAIL - ') + label);
  if (!cond) failures++;
};

(async () => {
  if (!fs.existsSync(AXE_SOURCE)) {
    console.error('FAIL - axe-core is not installed. Run: npm ci (devDependency).');
    process.exit(1);
  }
  const srv = await startServer();
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      try {
        await page.goto(srv.url + p, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(700);
        // Measure the FINAL rendered state, not mid-animation frames:
        // scroll-reveal elements start at low opacity and axe would score
        // the faded pre-reveal colors. Freeze animations + force reveals.
        await page.addStyleTag({ content: `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
          .reveal, [class*="reveal"], .fade-in, .animate {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        ` });
        await page.evaluate(async () => {
          // scroll through the page to trigger any JS-driven reveals
          await new Promise(resolve => {
            let y = 0;
            const step = () => {
              y += 600;
              window.scrollTo(0, y);
              if (y < document.body.scrollHeight + 600) setTimeout(step, 40);
              else { window.scrollTo(0, 0); setTimeout(resolve, 150); }
            };
            step();
          });
        });
        await page.addScriptTag({ path: AXE_SOURCE });
        const result = await page.evaluate(async () => {
          const r = await window.axe.run(document, {
            resultTypes: ['violations'],
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
          });
          return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
        });
        const serious = result.filter(v => ['serious', 'critical'].includes(v.impact));
        check(`${vp.name} ${p}: ${result.length} violation(s), 0 serious/critical`,
          serious.length === 0);
        for (const v of serious) console.log(`         ! ${v.impact} ${v.id} (${v.nodes} nodes)`);
      } catch (e) {
        check(`${vp.name} ${p}: audit ran`, false);
        console.log('         ' + String(e.message).slice(0, 140));
      }
    }
    await ctx.close();
  }

  await browser.close();
  await srv.close();
  console.log('');
  if (failures) { console.error(`a11y: ${failures} FAILURES`); process.exit(1); }
  console.log('a11y: all checks passed');
})();
