# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this portfolio, please email **mututandunda@gmail.com** with the subject line "Security Vulnerability Report" instead of using the public issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Security Best Practices

This portfolio is a static site hosted on GitHub Pages. Security measures include:

- **HTTPS Enforcement:** All traffic is encrypted via HTTPS.
- **Content Security Policy:** Restrictive CSP headers prevent XSS and injection attacks.
- **No Server-Side Code:** Static HTML/CSS/JS eliminates server-side vulnerabilities.
- **Subresource Integrity:** External resources are validated where possible.
- **Regular Updates:** Dependencies and content are kept up-to-date.

## Protected Directories

The following directories are marked as `Disallow` in `robots.txt` and should not be indexed:
- `/admin/` - Admin redirect (for internal use only)
- `/dashboard/` - Authenticated dashboard (requires credentials)
- `/jobs/` - Internal job management system

## Compliance

This site complies with:
- OWASP Top 10 security guidelines
- GDPR privacy requirements
- WCAG 2.2 accessibility standards

## Contact

For security inquiries, contact Victor Ndunda at **mututandunda@gmail.com**.

---

## v8 — Two-factor authentication (TOTP) & route consolidation

### What changed

- **Single gated area**: `/dashboard/` is now the only private page. `/admin/` and `/jobs/` are redirect stubs (their tools live inside the dashboard or were removed; git history preserves the full job portal).
- **Google sign-in now verifies ID token signatures** against Google's published JWKS (`https://www.googleapis.com/oauth2/v3/certs`) with `iss`/`aud`/`exp`/`email_verified` checks, using Web Crypto. Previously the JWT payload was only base64-decoded — a forged token with an allowlisted email could pass. Verification fails closed: if the JWKS cannot be fetched, sign-in is refused.
- **TOTP second factor (Google Authenticator compatible)**: after the first factor (Google or password), the dashboard requires a 6-digit code before a session is saved. First sign-in on a browser shows enrollment (QR + manual key); later sign-ins ask for the code. Reset from Settings.

### How the TOTP secret works (and its limits)

Per-account secrets are **derived, not stored**: `HKDF-SHA256(master_seed, salt=email, info="VN-TOTP-v1")` → 20 bytes → base32. The same email therefore produces the same secret on every browser, and enrollment works once. The master seed lives in `totp.js`.

**Honest limitation**: this is a static site on GitHub Pages — verification runs client-side, so the master seed is necessarily present in the deployed JavaScript. This raises the bar against stolen Google passwords, shared browsers, and casual access to `/dashboard/`, but it is not equivalent to server-side verification. The proper upgrade path, if stronger guarantees are needed, is **Firebase Auth with TOTP MFA** (free tier, first-party, server-side verification) — the UI flow here was designed so that swap is localized to `auth.js` + `totp.js`.

### Recovery

If the authenticator is lost: from any browser with an active session, use **Settings → Reset two-factor**. If locked out everywhere, clear localStorage key `victor_totp_enrolled` on the dashboard page and re-enroll (the authenticator entry stays valid because the secret is derived, not random).
