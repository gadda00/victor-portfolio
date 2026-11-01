# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email **mututandunda@gmail.com** with the subject line "Security Vulnerability Report" instead of using the public issue tracker.

Please include: description, steps to reproduce, potential impact, and a suggested fix if available.

## Read this first: what this site actually is

**The trust boundary documentation lives in [`TRUST_BOUNDARIES.md`](TRUST_BOUNDARIES.md)** (visitor-facing version: [/trust-boundaries.html](https://victorndunda.com/trust-boundaries.html)). Summary of the boundaries that matter to any security assessment:

- This is a **static site on GitHub Pages**. There is no server-side code, no server-side sessions, and no database.
- The **owner dashboard** is protected by a *client-side gate* — Google ID-token verification (JWKS-checked), a PBKDF2 password fallback, and a client-side TOTP step. All of that code ships to the browser, so a visitor who modifies the page or their storage can bypass the gate. It is an obscured personal console, **not** server-enforced authorization, and it deliberately holds no confidential records.
- The **client workspace** encrypts data with AES-GCM-256 in the visitor's browser. Since v21 the vault key is held **in memory only** — never in localStorage or sessionStorage (enforced by `scripts/test_trust_boundaries.js`). One browser = one account; there is no multi-device sync.
- **Payments** follow an explicit state machine (`reported → submitted → verified | rejected → refunded`). `verified` requires an explicit owner action; no payment provider is connected, so nothing is provider-confirmed. M-Pesa is a manual Paybill; Flutterwave/Stripe are labelled placeholders.
- **Snapshot codes** (`VN2.…`) are versioned, expiring, nonce-stamped and SHA-256-checksummed, but unsigned (no server). Checksums catch corruption, not forgery — imports are always marked unverified and payments are downgraded to `reported`.

## What we do NOT claim

- We do **not** claim OWASP Top 10, GDPR, or WCAG *compliance* — compliance is an audited state and none of these systems have been audited. The site follows good practice (semantic HTML, keyboard support, reduced-motion support, escaped rendering, CSP meta tags, honest privacy documentation) and ships an axe-core a11y gate in CI.
- We do **not** claim secure payment processing, zero-knowledge storage, or confidential client record storage. Real engagements run in clients' own infrastructure.
- Security headers are delivered as **meta tags only** — GitHub Pages cannot set HTTP response headers. See the deployment notes below.

## Security measures that do exist

- HTTPS enforced (GitHub Pages).
- Restrictive CSP delivered via meta tags on key pages (`default-src 'self'`, `object-src 'none'`, `base-uri 'self'`); Google OAuth/JWKS/fonts/webhooks allowlisted per page.
- Google sign-in verifies ID-token **signatures against Google's JWKS** with `iss`/`aud`/`exp`/`email_verified` checks — fails closed if JWKS cannot be fetched.
- PBKDF2 password fallback (100k iterations, constant-time comparison).
- Client-side TOTP second factor (see honest limitations below).
- AES-GCM-256 client vault with split salts; key in memory only.
- DOM-XSS hardening: a single audited escape function plus DOM-API rendering on the highest-risk surfaces, with an injection fixture suite (`scripts/test_xss_fixtures.js`) covering `<img onerror>`, `</script>` breaks, `javascript:` URLs, quote/backslash/newline payloads, oversized strings and invalid Unicode.
- Service worker never caches private/funnel routes; precache integrity is CI-tested (`scripts/test_sw_precache.js`).
- Every browser-storage key and outbound endpoint is inventoried in `data-inventory.json`; CI fails if an unregistered one appears.

## Protected directories

Marked `Disallow` in `robots.txt` and `noindex` on the page:
- `/admin/` — redirect stub
- `/dashboard/` — owner console (client-side gate)
- `/jobs/` — redirect stub

## TOTP — how it works and its limits

Per-account secrets are **derived, not stored**: `HKDF-SHA256(master_seed, salt=email, info="VN-TOTP-v1")` → 20 bytes → base32.

**Honest limitation:** this is a static site — verification runs client-side, so the master seed is necessarily present in the deployed JavaScript. This raises the bar against stolen Google passwords, shared browsers and casual access to `/dashboard/`; it is **not** a second factor against an attacker who reads the code. The proper upgrade is provider-side MFA (e.g. Firebase Auth TOTP MFA); the UI flow was designed so that swap is localized to `auth.js` + `totp.js`.

**Recovery:** from any browser with an active session, use **Settings → Reset two-factor**. If locked out everywhere, clear the localStorage key `victor_totp_enrolled` on the dashboard page and re-enroll (the authenticator entry stays valid because the secret is derived).

## Deployment notes (headers)

GitHub Pages serves static files and **cannot** set response headers such as `Strict-Transport-Security`, `Content-Security-Policy` (HTTP), `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` or `X-Content-Type-Options`. The meta-tag equivalents shipped here are best-effort browser hints, not equivalent protections. When the private tooling moves to production mode, it must be hosted on a header-capable platform (Cloudflare Pages/Workers, Vercel, Netlify) with the header set from the table in `TRUST_BOUNDARIES.md` §1, verified in CI against the deployed URL.

## Contact

For security inquiries, contact Victor Ndunda at **mututandunda@gmail.com**.

---

## Changelog of security-relevant changes

- **v21 (2026-11-01, Cycle 13)** — Trust hardening: vault key never persisted (memory-only, keyless remember-me, legacy key purge); VN2 snapshot codes (schema, expiry, nonce, SHA-256 checksum, size limits, replay flag, unverified imports with payment downgrade); explicit payment state machine with immutable owner-action event ledger; DOM-XSS fixes + fixture suite; visible trust banners; `TRUST_BOUNDARIES.md` + `/trust-boundaries.html`; `data-inventory.json` + registration test; SW install fails on missing precache assets and never caches private routes; full reproducible CI quality suite gating deploy; compliance overclaims removed.
- **v8** — Google ID-token signature verification (JWKS), TOTP second factor, route consolidation.
