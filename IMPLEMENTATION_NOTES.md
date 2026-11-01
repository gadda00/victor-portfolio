# Implementation Notes — Cycle 13 (v21 Trust Hardening)

**Date:** 2026-11-01 · **Baseline commit:** `57cd23c` · **Scope driver:** the 2026-11-01 deep technical re-review + upgrade brief.

## 1. The decision this cycle makes explicit

The review's central question: *is this a transparent browser-local demo, or a real backend-backed product?*

**Chosen: (a) transparent browser-local demo now, with a designed production path.**

Rationale: the public site is a static GitHub Pages portfolio; the private tooling exists to demonstrate product thinking, not to hold real client records. Shipping a half-integrated backend (no credentials, no migrations, dead code paths) would be *less* honest than the demo it replaces. Everything this cycle does follows from that choice: label the truth, enforce the truth in code, and make the upgrade path explicit and fail-closed.

## 2. Architecture changes

### 2.1 Trust & mode layer (`trust-mode.js`, new)
- `window.VNTrust` with two modes: `demo` (default) and `production`.
- **Production fails closed:** `VN_TRUST_CONFIG = { mode: 'production', backendUrl, ownerApiToken, sessionVerifyEndpoint }` must be complete before the script loads; otherwise gated apps render a blocking configuration error instead of silently degrading (acceptance criterion: "production mode fails closed").
- Reusable visible banner component injected on every private/funnel page via `<body data-vn-trust="…">`: fixed-top over the dashboard auth overlay, fixed-bottom (cookie-bar pattern) on site pages where the global nav is `position:fixed`.
- Public visitor-facing page: `/trust-boundaries.html` (capability matrix with live / demo / browser-local / manual / not-implemented labels).

### 2.2 Vault key: memory-only (`services/portal-core.js`, P0)
- `startSession()` now writes a **keyless** session marker (`{v:3, email, lastActivity}`) to sessionStorage and a **keyless** remember record (`{v:3, email, expiresAt}`) to localStorage. The AES key lives only in the closure.
- `restoreSession()` always returns `false` — a page load can never auto-unlock. `getRememberedSession()` exposes the remembered email for the login form; `login()` re-derives the key from the stored salt.
- `lockSession()` wipes the in-memory key + decrypted vault; wired to a `visibilitychange` idle check (>30 min hidden → lock) and dispatched as `vnportal:locked` (portal.js drops to the auth gate without a reload).
- **Legacy migration:** `purgeLegacyKeyMaterial()` strips `vaultKey` from any v2 remember record / tab session on boot, preserving email+expiry.
- Funnel pages that sync into the vault (`data-vn-portal-sync`) show a "workspace locked — unlock to sync" hint instead of silently skipping.

### 2.3 Snapshot codes v2 (`VN2.<base64url>`, P0/P1)
- Schema: `{ v:2, kind, issuedAt, expiresAt (+7d), nonce(24 hex), payload:{project,client}, checksum }`, `checksum = SHA-256(canonicalJSON(payload))`.
- Import validates: prefix/version/kind, base64url JSON parse, size ≤ 256 KB, ISO timestamps, expiry (with 5-min clock skew tolerance), nonce presence, checksum format + match.
- `normalizeSnapshot()` whitelists + clamps every field (arrays capped, strings clamped), and **downgrades every payment to `reported`** regardless of the claimed status (claim preserved as `claimedStatus`).
- Replay: `registerSnapshotNonce()` keeps the last 200 nonces (owner browser); duplicates are flagged in the import UI.
- Legacy `VN1.` codes still import with a loud warning (no integrity metadata at all).
- **Documented limit:** codes are unsigned — a motivated client can recompute the checksum after editing. This is why imports are *always* marked unverified; the checksum catches corruption, not forgery. The production path (server-signed HMAC/Ed25519 tokens) is specified in TRUST_BOUNDARIES.md §7.

### 2.4 Payment state machine (P0)
```
due → sent → reported → submitted → verified | rejected
                       (verified → refunded)
```
- `reportPayment()` (client): the highest state a client can set. The old `markPaymentPaid()` is a compat alias → `reportPayment`.
- `ownerTransitionPayment()` (owner/demo-seed): submitted/verified/rejected/refunded with an immutable event append.
- Event shape: `{ id, at, actor, source, from, to, currency:'USD', amountMinor, kesMinor, provider, providerRef, idempotencyKey, note }`.
- `totals()`: `paidUsd` **== verifiedUsd**; `reportedUsd` tracked separately; outstanding excludes verified+reported.
- Dashboard: imported clients render per-payment badges + **✓ Verify / ✗ Reject / ↩ Refund** owner actions (confirm-guarded), writing the same event shape into the imported record.
- Invoice tool payments now record `{actor:'owner', source:'owner-recorded', currency, amountMinor}` — honest that "paid" there is an owner's manual record, not a provider confirmation.
- UI copy everywhere distinguishes verified / reported (awaiting verification) / placeholders.

### 2.5 DOM-XSS elimination (P1)
- Single audited escape function (`esc2`) hoisted to the top of `dashboard/dashboard.js`; duplicate definitions removed.
- **DOM-API rewrites** of the highest-risk surfaces: dashboard invoice table, leads list, social composer results, and the entire payment page render (`services/payment.js`) — user-controlled values (package name, client name, timeline, brief/contract ids) go through `textContent` only.
- Template-string surfaces that remain (jobs, content, security log, settings, analytics, activity, clients) escape every interpolated value with `esc2`.
- GitHub repo links built from user data are sanitized (`safePath` + `encodeURIComponent`); mailto/WhatsApp hrefs use `encodeURIComponent` with a sanitized contract id.
- Injection fixture suite: `scripts/test_xss_fixtures.js` (payloads: `<img onerror>`, `</div><script>`, `javascript:`, quote/backslash/newline, 10k string, invalid Unicode) across payment page + five dashboard sections + social composer.

### 2.6 Testability & CI (P1)
- `package.json` + `package-lock.json` (playwright 1.57.0, axe-core 4.10.2, Node 20–24 engines) — `npm ci && npm test` reproduces every gate from a clean checkout (the review's reproducibility finding).
- `scripts/lib/static_server.js` — shared ephemeral static server; **every** browser test is now self-contained (smoke_test.js no longer needs a manually-started `python3 -m http.server`).
- `.github/workflows/quality.yml` — 8 gated steps (validator, syntax, inventory, SW, smoke, XSS, trust, a11y) with failure artifacts; `deploy.yml` now `needs: [quality, validate]` — deploys are blocked on the full suite.

### 2.7 Data inventory & privacy (P1)
- `data-inventory.json`: 32 storage keys (purpose, PII category, retention, encryption, visibility, deletion path) + 10 outbound processors + invariants.
- `scripts/test_data_inventory.js` fails CI on any unregistered storage key or fetch endpoint (it caught two missed keys — `vn_proposals`, `vn_roi_inputs` — during development).
- `privacy-policy.html` rewritten from the inventory: complete storage list, corrected Google-auth description (signature verification, not "decode the JWT"), corrected rights section (browser-local data is directly erasable), honest header caveat.

### 2.8 Service worker & deployment (P2)
- `sw.js` → **vnd-v27.0.0**; `NEVER_CACHE` now covers the entire private funnel (dashboard, portal, payment, invoice, contract, proposal, assessment, wizard, portal scripts, trust-mode.js).
- Install **fails** on any missing precache asset (the swallow-and-warn `catch` is gone).
- `scripts/test_sw_precache.js` validates all 45 precache URLs against a local server + asserts private-route exclusion.

### 2.9 Accessibility (P2 / discovered)
- New `scripts/test_a11y.js`: axe-core at 1280px and 390px across 7 public pages, failing on serious/critical, measuring the final rendered state (animations frozen, reveals forced, page scrolled).
- Real fixes shipped: `--text-dim` / `--v6-text-dim` bumped to ≥4.5:1 on tinted/glass panels in both themes (dark `#8292b1`, light `#4f5e75`), services `.duration` purple → `#b16aff`, `role="grid"` → `role="group"` on the booking day picker (critical), inline accent links underlined.
- Result: 14/14 page-viewport combinations with zero serious/critical violations.

## 3. Migrations & rollback

| Change | Migration | Rollback |
|---|---|---|
| Vault key removal | Automatic on boot: v2 records containing `vaultKey` are stripped (email/expiry kept); the user re-enters the password once. | Revert `portal-core.js`; v3 keyless records are ignored by v2 code (it falls back to password login). |
| Payment states | Old `paid` values map on read: totals/nextPayment treat legacy `paid` as… not verified (shows as reported-equivalent in KPIs). Demo seed demonstrates both states. | Revert `portal-core.js` + `portal.js`; `markPaymentPaid` alias keeps old callers working. |
| Snapshot v2 | `VN1.` codes still import (legacy path with warning). | Revert `portal-core.js`; VN2 codes simply fail validation under old decoders with a clear "not a valid share code" message. |
| SW v27 | Standard version-bump activation; old caches purged on activate. | Revert `sw.js` → vnd-v26; activate cleans v27 caches. |
| CSS dim tokens | None needed (pure color values). | Revert `styles.css` / `home.css` token lines. |

## 4. Known limitations (deliberate, documented)

1. **Dashboard auth remains a client-side gate.** The banners, docs and security page now say so; no confidential data should be stored behind it until the production backend exists.
2. **TOTP master seed still ships in deployed JS** (documented in SECURITY.md; upgrade path: provider MFA).
3. **Snapshot codes are unsigned** — integrity ≠ authenticity. Imports are unverified by construction.
4. **`verified` in demo mode is an owner's browser-local action** — honest, recorded as `owner-action`, never a provider webhook.
5. **Security headers remain meta-tag only** on GitHub Pages (documented; header table for the future host is in TRUST_BOUNDARIES.md).
6. **axe contrast gate measures the 7 key public pages**; the private tools (behind auth/state) are covered by the XSS/trust suites instead.

## 5. Exact verification commands

```bash
npm ci && npx playwright install chromium
npm test                # 1 validator · 2 syntax · 3 inventory · 4 SW · 5 smoke · 6 XSS · 7 trust
npm run test:a11y       # 8 axe-core desktop + mobile
```

CI: `.github/workflows/quality.yml` runs the same chain on every push/PR; `deploy.yml` gates on it.

## 6. Intentionally not implemented (with reasons)

- **Backend (Supabase/Firebase)** — requires real provider accounts/secrets; the fail-closed mode boundary + `.env.example` + §7 architecture in TRUST_BOUNDARIES.md define the integration point instead.
- **Payment provider integrations (Flutterwave/Stripe/M-Pesa Daraja)** — no merchant credentials; buttons are labelled placeholders, M-Pesa stays manual.
- **Server-signed snapshot tokens** — depends on the backend above.
- **HTTP security headers** — impossible on GitHub Pages; documented + planned for the production host.
- **P2 product functionality** (timezone-aware booking calendar, lead dedup, proposal versioning, e-signatures, email retry queue) — not started this cycle; the payment state machine, data inventory and trust layer were the higher-value changes the review ranked above them.
