/* Data-inventory registration test (v21).
 *
 * Fails when a first-party script uses a localStorage/sessionStorage key
 * or fetches an outbound endpoint that is not registered in
 * data-inventory.json — the guard required by the privacy review so the
 * privacy policy can never silently drift from the implementation.
 *
 * Run: node scripts/test_data_inventory.js   (from the repo root)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, cond) => {
  console.log((cond ? '  ok  - ' : '  FAIL - ') + label);
  if (!cond) failures++;
};

/* ── Load the inventory ─────────────────────────────────────────── */
let inventory;
try {
  inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-inventory.json'), 'utf8'));
} catch (e) {
  console.error('FAIL - data-inventory.json is missing or invalid JSON: ' + e.message);
  process.exit(1);
}

/* Registered keys: exact names, plus dynamic prefixes ('vn_read:<path>'
 * style entries register the prefix before the '<'). */
const exactKeys = new Set();
const prefixKeys = [];
for (const entry of inventory.storageKeys) {
  const k = entry.key;
  const m = k.match(/^(.*?)(?:<[^>]*>|_)$/);
  if (k.includes('<')) prefixKeys.push(k.slice(0, k.indexOf('<')));
  else exactKeys.add(k);
}
const registeredEndpoints = new Set(
  inventory.outboundProcessors.flatMap(p => {
    const hosts = [];
    for (const ep of String(p.endpoint).split(',')) {
      try { hosts.push(new URL(ep.trim()).hostname); } catch (e) { /* skip */ }
    }
    return hosts;
  })
);

/* ── Collect first-party source files ───────────────────────────── */
function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === 'marketing') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      // content directories hold prose, not executed inline scripts
      if (['blog', 'resume', 'articles', 'brand-assets'].includes(name) && dir === ROOT) continue;
      walk(p, out);
    } else if (/\.(js|html)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}
const files = walk(ROOT, []);

/* ── Extract storage keys used in code ──────────────────────────── */
const usedKeys = new Set();     // exact literals at call sites
const constKeys = new Set();    // constants assigned then used indirectly
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
  const rel = path.relative(ROOT, f);

  // direct literal call sites
  let m;
  const callRe = /(localStorage|sessionStorage)\.(setItem|getItem|removeItem)\(\s*(['"])([^'"]+)\3/g;
  while ((m = callRe.exec(src))) usedKeys.add(m[4]);

  // constants: var/const/let NAME = 'value' where NAME looks like a storage-key constant
  const constRe = /(?:var|const|let)\s+([A-Za-z0-9_$]*(?:KEY|STORE|STORAGE_KEY)[A-Za-z0-9_$]*)\s*=\s*(['"])([^'"]+)\2/g;
  while ((m = constRe.exec(src))) {
    if (/^[a-z][a-z0-9_:]*$/.test(m[3])) constKeys.add(m[3]);
  }

  // dynamic prefixes: 'literal' + <expr> inside a storage call
  const dynRe = /(localStorage|sessionStorage)\.(setItem|getItem|removeItem)\(\s*(['"])([^'"]+)['"]\s*\+/g;
  while ((m = dynRe.exec(src))) prefixKeys.push(m[4]);
}
const allUsed = new Set([...usedKeys, ...constKeys]);

/* ── 1. every used key is registered ────────────────────────────── */
for (const key of [...allUsed].sort()) {
  if (key === '__vn_t') continue; // transient probe, registered anyway
  const registered = exactKeys.has(key) || prefixKeys.some(p => key.startsWith(p) && key !== p);
  // a bare prefix literal ('gh_' + user) is covered by its wildcard entry
  const isPrefixItself = inventory.storageKeys.some(e => e.key.startsWith(key + '<'));
  check(`storage key '${key}' is registered in data-inventory.json`, registered || isPrefixItself);
}

/* ── 2. dynamic-prefix uses map to a registered prefix entry ────── */
for (const p of new Set(prefixKeys)) {
  const hasEntry = inventory.storageKeys.some(e => e.key.startsWith(p));
  check(`dynamic key prefix '${p}' has a registered wildcard entry`, hasEntry);
}

/* ── 3. outbound fetch/XHR endpoints are registered ─────────────── */
const endpoints = new Set();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  const fetchRe = /fetch\(\s*(['"])(https?:\/\/[^'"]+)\1/g;
  while ((m = fetchRe.exec(src))) {
    try { endpoints.add(new URL(m[2]).hostname); } catch (e) {}
  }
}
const ALLOWED_EXTRA = new Set([]); // add only with justification
for (const host of [...endpoints].sort()) {
  check(`outbound endpoint '${host}' is registered`, registeredEndpoints.has(host) || ALLOWED_EXTRA.has(host));
}

/* ── 4. invariants documented in the inventory itself ───────────── */
check('inventory declares the keyless-session invariant',
  inventory.invariants.some(i => /[Nn]o AES\/decryption key/.test(i)));
check('inventory declares the unverified-import invariant',
  inventory.invariants.some(i => /unverified/.test(i) && /reported/.test(i)));

/* ── Result ─────────────────────────────────────────────────────── */
console.log('');
if (failures) {
  console.error(`data-inventory: ${failures} FAILURES`);
  console.error('Register the new keys/endpoints in data-inventory.json (and update the privacy policy) before committing.');
  process.exit(1);
}
console.log('data-inventory: all checks passed (' + allUsed.size + ' keys, ' + endpoints.size + ' endpoints registered)');
