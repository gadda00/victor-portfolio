/* Syntax gate: node --check every first-party JS file.
 * Run: node scripts/test_syntax.js
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'marketing', 'blog', 'resume', 'articles', 'brand-assets']);

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(ROOT, []);
let failures = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
    console.log('  ok  - ' + path.relative(ROOT, f));
  } catch (e) {
    failures++;
    console.error('  FAIL - ' + path.relative(ROOT, f) + '\n' + String(e.stderr || e.message));
  }
}
console.log('');
if (failures) { console.error(`syntax: ${failures} FAILURES`); process.exit(1); }
console.log(`syntax: all ${files.length} first-party JS files parse cleanly`);
