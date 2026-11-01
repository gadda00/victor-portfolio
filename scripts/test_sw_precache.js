/* Service-worker precache + private-route exclusion test (v21).
 *
 * 1. Extracts SHELL_URLS and NEVER_CACHE from sw.js.
 * 2. Serves the repo over a local static server and asserts every
 *    precache URL resolves to 200 — install now fails on missing assets,
 *    and CI catches renames before deploy.
 * 3. Asserts no private/funnel route is precached and that the private
 *    surface is covered by NEVER_CACHE.
 *
 * Run: node scripts/test_sw_precache.js   (no external server needed)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { startServer } = require('./lib/static_server');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, cond) => {
  console.log((cond ? '  ok  - ' : '  FAIL - ') + label);
  if (!cond) failures++;
};

/* ── Parse sw.js ────────────────────────────────────────────────── */
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
function extractArray(name) {
  const m = sw.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
  if (!m) throw new Error(name + ' not found in sw.js');
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}
const shellUrls = extractArray('SHELL_URLS');
const neverCache = extractArray('NEVER_CACHE');
const cacheVersion = (sw.match(/CACHE_VERSION = '([^']+)'/) || [])[1];

check(`sw.js parses: ${shellUrls.length} precache URLs, ${neverCache.length} never-cache patterns, version ${cacheVersion}`, shellUrls.length > 20 && neverCache.length > 10 && !!cacheVersion);

/* ── Private-surface expectations ───────────────────────────────── */
const PRIVATE_MUST_BE_EXCLUDED = [
  '/dashboard/', '/services/client-dashboard', '/services/payment',
  '/services/invoice', '/services/contract', '/services/proposal',
  '/services/portal-core.js', '/services/wizard', '/services/assessment',
];
for (const route of PRIVATE_MUST_BE_EXCLUDED) {
  check(`NEVER_CACHE excludes private route ${route}`, neverCache.some(n => route.includes(n) || n.includes(route)));
}
const leaked = shellUrls.filter(u => neverCache.some(n => u.includes(n)));
check('no SHELL_URL is also on the never-cache list', leaked.length === 0);
const privatePrecached = shellUrls.filter(u =>
  PRIVATE_MUST_BE_EXCLUDED.some(r => u.startsWith(r)));
check('no private/funnel route is precached', privatePrecached.length === 0);

(async () => {
  const srv = await startServer();
  const BASE = srv.url;
  let bad = 0;
  for (const u of shellUrls) {
    const resp = await fetch(BASE + u);
    if (resp.status !== 200) {
      bad++;
      console.log(`  FAIL - precache URL ${u} -> HTTP ${resp.status}`);
    }
  }
  check(`all ${shellUrls.length} precache URLs resolve to 200 locally`, bad === 0);

  await srv.close();
  console.log('');
  if (failures) { console.error(`sw-precache: ${failures} FAILURES`); process.exit(1); }
  console.log('sw-precache: all checks passed');
})();
