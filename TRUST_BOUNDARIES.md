# Trust Boundaries — victorndunda.com

> **Status:** living document. Last reviewed 2026-11-01 (Cycle 13).
> Companion page for visitors: **[/trust-boundaries.html](https://victorndunda.com/trust-boundaries.html)**

This repository runs a **public static portfolio** (GitHub Pages) plus a set of
**browser-local business tools** (owner dashboard, client workspace, proposal /
contract / invoice / payment pages). This document states exactly what those
tools are and are not, so that no claim on the site overstates the
implementation. It is the source of truth referenced by `SECURITY.md`,
`privacy-policy.html`, `data-inventory.json` and the visible trust banners
(`trust-mode.js`).

---

## 1. The two operating modes

| | **Demo mode (default — what ships today)** | **Production mode (designed, not deployed)** |
|---|---|---|
| Identity | Client-side gate: Google ID-token verification (JWKS) + PBKDF2 password fallback + client-side TOTP. **Runs in the visitor's browser — it is a UI gate, not server-enforced authorization.** | Supabase/Firebase Auth (or equivalent) with Google OAuth, server-side session verification, provider-managed MFA, allowlist enforced server-side. |
| Data | `localStorage` / `sessionStorage` in one browser. Not durable, not synchronized, lost on browser clear. | Postgres (or equivalent) with CRUD, backups, audit log, object-level authorization. |
| Payments | `reported` by the client, at most. M-Pesa = manual Paybill instructions. Flutterwave/Stripe = **placeholder** buttons (mailto). No provider webhooks. | `verified` only via signed provider webhook or authorized owner action against a server-side ledger. |
| Client "snapshot codes" | `VN2.…` base64url JSON: versioned, expiry-dated, nonce-stamped, SHA-256-checksummed — but **unsigned**, so integrity checks catch corruption, not forgery. Always imported as *unverified, client-reported*. | Server-issued HMAC/Ed25519-signed, expiring tokens with replay protection. |
| Email notifications | Web3Forms (third-party form relay). Demo workspaces (`demo-*` accounts) never email. | Provider API with authenticated domain, templates, retry queue, delivery status. |
| Security headers | Meta-tag CSP only (GitHub Pages cannot set response headers). | HSTS, CSP, frame protection, Referrer-Policy, Permissions-Policy, nosniff via a header-capable host. |

Mode is selected in `trust-mode.js` via `window.VN_TRUST_CONFIG` (see
`.env.example`). **Production mode fails closed**: if the config is incomplete,
gated apps render a configuration error instead of silently behaving like a
demo.

## 2. Capability labels used across the site

- **live** — working, provider-backed, verifiable (e.g. the public site, RSS, sitemap, booking emails via Web3Forms).
- **demo** — works end-to-end with synthetic data; not backed by a server.
- **browser-local** — real data, but stored only in one browser's storage.
- **manual** — a human process with tooling support (e.g. M-Pesa Paybill reconciliation by hand).
- **client-reported** — asserted by the client, never verified by a provider or the owner until explicitly marked.
- **provider-confirmed** — confirmed by a signed webhook from a payment provider. **None exist in demo mode.**
- **not implemented** — placeholder UI only (e.g. Flutterwave/Stripe buttons).

## 3. Per-page truth table

| Surface | What it actually is | Banner |
|---|---|---|
| `/dashboard/` | Client-side gated workspace. All auth code (allowlist, PBKDF2 verifier, TOTP derivation) ships to the browser; a visitor who modifies the page or storage can bypass the gate. Holds no secrets; treat as an obscured personal console. | ✅ `data-vn-trust="dashboard"` |
| `/services/client-dashboard.html` (client workspace) | AES-GCM-256 encrypted vault in the client's browser. **The vault key is held in memory only** — reloading always requires the password again (remember-me remembers only the email + expiry). One browser = one account; no multi-device. | ✅ `data-vn-trust="portal"` |
| `/services/payment.html` | Manual/demo path. No payment provider integration. | ✅ `data-vn-trust="payment"` |
| `/services/invoice.html`, `/proposal.html`, `/contract.html` | Browser-local document tools. Export/download works; nothing is stored server-side; signatures are not e-signature verified. | ✅ banners |
| `/services/wizard.html` | Browser-local scope wizard; briefs sync into the encrypted workspace when unlocked. | ✅ `data-vn-trust="wizard"` |
| Public pages, blog, projects, booking | Live static content + Web3Forms email relay. | n/a |

## 4. Payment state machine (v21)

`draft → due → sent → reported → submitted → verified | rejected` and
`verified → refunded`.

- **reported** — set by the client ("I've paid via M-Pesa, code QGH…"). Stored
  in their encrypted vault and relayed to the owner by email / snapshot code.
- **submitted / verified / rejected / refunded** — owner-side actions in the
  dashboard (source: `owner-action`). In demo mode these are honest, explicit,
  browser-local owner confirmations — **not** provider-confirmed.
- Every transition appends an immutable event:
  `{ at, actor, source, from, to, currency, amountMinor, provider, providerRef, idempotencyKey, note }`.
- `totals()` counts **only `verified`** as paid; `reported` amounts display
  separately as "reported, awaiting verification".
- Snapshot imports **can never produce `verified`**: any claimed status is
  downgraded to `reported` (the original claim is preserved as
  `claimedStatus`).

## 5. Snapshot codes (client → owner bridge)

- **v2 (`VN2.<base64url>`)** — `{ v, kind, issuedAt, expiresAt (7 days), nonce, payload, checksum }`.
  `checksum = SHA-256(canonicalJSON(payload))`. Import validates schema, size
  (≤ 256 KB), expiry, and checksum; duplicate nonces are flagged as replays.
  **No signature** — a motivated client can recompute the checksum after
  editing. This is corruption protection, not forgery protection, which is why
  imports are always labelled unverified.
- **v1 (`VN1.<base64url>`)** — legacy, still importable, flagged as having no
  integrity metadata at all.

## 6. What is deliberately NOT claimed

- No server-side authentication, sessions, or authorization anywhere today.
- No GDPR / OWASP / WCAG *compliance* claims. The site follows good practice
  (semantic HTML, keyboard support, reduced-motion, honest privacy policy,
  escaped rendering, CSP meta) — "compliance" implies audited evidence that
  does not exist for a static site.
- No secure payments, no zero-knowledge storage (the vault key exists in
  memory during a session), no confidential client record storage.
- The TOTP second factor derives from a seed that ships in deployed
  JavaScript — it raises the bar against casual access, it is not a second
  factor against a code-reading attacker.

## 7. Production upgrade path (summary)

Chosen direction: **transparent browser-local demo now**, backend later. The
smallest honest production boundary, when needed:

1. Supabase (Auth + Postgres + RLS + Edge Functions) behind the existing pages.
2. Move the allowlist, session verification and MFA to the provider.
3. Server-issued signed snapshot tokens replacing `VN2`.
4. Payment provider adapters with signed webhooks as the only path to
   `verified`.
5. Header-capable hosting (Cloudflare/Vercel) for the private routes with
   HSTS/CSP/frame protection.

Details, migrations and rollback: `IMPLEMENTATION_NOTES.md`.
