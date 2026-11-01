# QA Report — Cycle 13 (v21 Trust Hardening)

**Date:** 2026-11-01 · **Repo:** `gadda00/victor-portfolio` · **Run environment:** clean working tree at the Cycle 13 commit, Node 24 / Python 3.12 / Playwright 1.57.0 (pinned via `package-lock.json`), system Chromium.

> **Verdict: PASS — all 8 gates green from a clean checkout (`npm ci && npm test` + `npm run test:a11y`).**

## 1. Gate results

| # | Gate | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Static site validator | `python3 scripts/validate_site.py` | ✅ PASS | 8/8 checks — 13 projects, **761 internal links** checked (up from 744; new `/trust-boundaries.html`), no duplicate IDs, no-JS fallback synchronized, metadata present |
| 2 | JS syntax | `node scripts/test_syntax.js` | ✅ PASS | **38** first-party JS files parse cleanly (`node --check`) |
| 3 | Data inventory | `node scripts/test_data_inventory.js` | ✅ PASS | **32 storage keys + 2 fetch endpoints** registered in `data-inventory.json`; zero unregistered keys; invariants declared |
| 4 | Service worker | `node scripts/test_sw_precache.js` | ✅ PASS | All **45** precache URLs → HTTP 200 locally; 9 private routes excluded from cache; no overlap between precache and never-cache; version `vnd-v27.0.0` |
| 5 | Browser smoke | `node scripts/smoke_test.js` | ✅ PASS | Project grid/filters/search, FirstLight/Hazina content, homepage checks; **zero console errors** (GitHub API rate-limit responses ignored by design); well-formed API URLs; self-hosted (no manual server needed) |
| 6 | DOM-XSS fixtures | `node scripts/test_xss_fixtures.js` | ✅ PASS | 13/13 — hostile payloads (`<img onerror>`, `</div><script>`, `javascript:`, quotes/backslash/newline, 10k string, invalid Unicode) injected into briefs, invoices, leads, job apps, login log, imported clients and the social composer all render as **text**; no execution, no injected nodes, no dialogs; payment links sanitize the contract id |
| 7 | Trust boundaries | `node scripts/test_trust_boundaries.js` | ✅ PASS | **20/20** — see §2 |
| 8 | Accessibility | `node scripts/test_a11y.js` | ✅ PASS | **14/14** page×viewport combos (7 pages × desktop 1280px + mobile 390px) with **0 serious/critical** axe violations (WCAG 2.x A/AA rules) |
| — | CI wiring | `.github/workflows/quality.yml` + gated `deploy.yml` | ✅ READY | Deploy `needs: [quality, validate]`; failure artifacts uploaded |

## 2. Security acceptance criteria (from the upgrade brief)

| Acceptance criterion | Status | Proof (test id) |
|---|---|---|
| No private dashboard/client data is protected *only* by a client-side visibility gate | **Documented + labelled** (a static site cannot meet this without a backend; the gate is now visibly labelled a browser-local demo and holds no confidential data) | Banner on `/dashboard/`; TRUST_BOUNDARIES.md §3 |
| No AES decryption key is stored in localStorage/sessionStorage | ✅ **PASS** | A2/A3/A4 — remember-me ON: key appears in no storage value; both session records are keyless |
| Snapshot imports are schema-validated, size-limited and visibly unverified unless cryptographically signed | ✅ **PASS** | C1–C7 — v2 schema+checksum+expiry+nonce+size validated; tampered payload rejected (checksum mismatch); **forged-but-checksummed code imports with payments downgraded to `reported` and `_meta.unverified=true`** (the documented unsigned limit); legacy VN1 imports with warning; duplicate nonce flagged |
| Verified payments cannot be created by a client-only function | ✅ **PASS** | D1–D4 — client `reportPayment` maxes at `reported`; verified only via the dashboard's confirm-guarded owner action, which records `source:'owner-action'` with an immutable event (idempotency key, minor units) |
| All user-controlled dynamic values render safely without executable HTML | ✅ **PASS** | XSS suite 13/13 |
| Clean checkout installs and runs every quality gate | ✅ **PASS** | `npm ci && npm test` (lockfile-pinned) |
| Public browser smoke passes with zero unexpected console errors | ✅ **PASS** | Gate 5 |
| Mobile and keyboard accessibility checks pass | ✅ **PASS** (axe desktop+mobile; keyboard/focus/reduced-motion covered by existing implementation + validator a11y metadata checks) | Gate 8 |
| Service-worker URLs are validated automatically | ✅ **PASS** | Gate 4 |
| Privacy/security claims match actual data flows | ✅ **PASS** | Privacy policy rewritten from `data-inventory.json`; SECURITY.md overclaims removed; inventory test enforces drift-free |
| Demo mode works end-to-end with synthetic data, no real email | ✅ **PASS** | Demo workspace seeds a full state machine (1 verified + 1 reported payment); `demo-*` accounts suppress Web3Forms; tests additionally abort all web3forms routes |
| Production mode fails closed with clear configuration errors | ✅ **PASS** (unit-level) | `trust-mode.js assertReady()` renders a blocking error listing each missing config value; demo default unaffected |

## 3. Visual verification (VLM panel)

| Surface | Verdict |
|---|---|
| Homepage dark (post contrast-token changes) | 9/10 — "no text hard to read… muted secondary text maintains sufficient legibility… layout flawless" |
| Homepage light | 9/10 — "excellent contrast… flawless layout… muted labels look natural" |
| Services dark | 9/10 — "highly legible… secondary grey body text clear… no overlapping" |
| Trust banner — payment page | Visible (fixed bottom), readable |
| Trust banner — client portal | Visible, readable, copy confirmed verbatim by the panel |
| Trust banner — dashboard (over auth overlay) | Visible fixed-top; login card still centered and readable |
| `/trust-boundaries.html` | Clean layout, well-formed capability table |

## 4. Defects found & fixed during this cycle's QA

1. **Data-inventory test caught 2 unregistered keys** (`vn_proposals`, `vn_roi_inputs`) → registered with full metadata.
2. **Booking day picker `role="grid"` without rows** (axe critical) → `role="group"`.
3. **Muted text below 4.5:1 on tinted panels** (`--text-dim` #64748b ≈ 3.86–4.28:1) → bumped to #8292b1 (dark) / #4f5e75 (light), verified ≥4.5:1 including stacked-glass backgrounds; services `.duration` purple → #b16aff.
4. **Accent links inside text blocks** without underline (booking page) → underlined.
5. **Trust banner initially invisible** — mounted as body-first child it slid under the `position:fixed` nav → switched to the fixed-bottom pattern for site pages (fixed-top kept for the dashboard overlay).
6. **a11y gate initially measured pre-reveal animation states** (opacity mid-fade → false contrast failures) → the audit now freezes animations, forces reveals and scrolls the page before running axe.

## 5. Remaining risks (accepted + documented)

- The dashboard gate, TOTP seed and meta-tag CSP limits are unchanged physics of a static site — now stated in `SECURITY.md`, `TRUST_BOUNDARIES.md`, the dashboard Security section and the public trust page.
- Snapshot forgery (recompute-then-edit) remains possible by design; mitigated by always-unverified imports and payment downgrades.
- `verified`/`refunded` in demo mode are browser-local owner records — an explicit banner note says so at the point of action.
- GitHub Pages cannot serve HTTP security headers; the required header set for the future production host is tabled in TRUST_BOUNDARIES.md §1.

## 6. Intentionally unimplemented integrations

Backend identity/database (Supabase/Firebase), payment providers (Flutterwave, Stripe, M-Pesa Daraja), server-signed snapshot tokens, HTTP security headers, transactional email provider, timezone-aware booking calendar, lead dedup/CRM export, proposal versioning + e-signatures. Reasons and integration points: `IMPLEMENTATION_NOTES.md` §6 and `TRUST_BOUNDARIES.md` §7.

## 7. Reproduction

```bash
git clone https://github.com/gadda00/victor-portfolio && cd victor-portfolio
npm ci && npx playwright install chromium
npm test && npm run test:a11y
```

CI runs the identical chain on every push to `main` and every PR; the Pages deploy is blocked until it passes.
