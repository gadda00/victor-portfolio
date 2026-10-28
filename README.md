# Victor Ndunda — Portfolio

> Personal portfolio, blog, and private admin dashboard for **Victor Ndunda** — AI Systems Engineer, creator of Busara AI, KilimoPRO & AgentReplay, with client platforms Tapi Learn (11K+ learners) and Keja AI (award-nominated) in production. Built in Nairobi, Kenya 🇰🇪.

**Live**: [victorndunda.com](https://victorndunda.com)

## Conversion Architecture (v7 — Sept 2026)

The public site is organized as a client-acquisition system, not just a capability catalogue:

- **Positioning**: "AI that works beyond the demo." — production AI systems engineer for founders and product teams.
- **Primary CTA (everywhere, one label family)**: *Book a 30-Minute AI Systems Assessment* → `/book/` (free, first-party scheduler).
- **Three services** on the homepage and services page (v16, owner-directed): **Needs Assessment** ($2,500, merged pre-build assessment + reliability audit for shipped systems), **Starter Build** ($12,000 + $1,400/mo care, or 3 instalments of $4,200 — v18 optimized from $10,000), **Big Projects** (from $35,000 + from $5,000/mo care — v18 optimized from $28,000/$6,000, quarterly care −10%) — one source of truth in `services/data.json` v1.5.0, propagated through the wizard, readiness assessment, proposal/contract/invoice/payment generators, booking assistant, i18n, and every guide page. Pricing re-verified against 2026 market data in v17 — the ladder holds.
- **Featured case studies**: Tapi Learn (ACLA client product), Verxlite, Fraud Detection — with constraint + validation framing. Full directory at `/projects/` ("Case Studies").
- **Navigation**: Home · Services · Case Studies · Insights · About · Resume · Book an Assessment.
- **Analytics-ready**: CTAs carry `data-track="..."` attributes; `app.js` queues click events to `window.__vnEvents` with zero network calls. Wire Plausible/Umami later via `window.__vnTrack = fn`.
- **First-party engagement pipeline (v9–v11, all 7 stages first-party)**: enquiry assistant → estimate (persists `vn_last_estimate`) → own scheduler (`.ics` hold + Web3Forms email + WhatsApp handoff) → **proposal generator** at `/services/proposal.html` (v11: branded print-mirrored proposal from the same estimate/brief, PRP-YYYY-###, draft/sent/accepted) → contract generator → invoicing tool at `/services/invoice.html` (USD/KES, VAT, partial payments, print-to-PDF, M-Pesa Paybill 4071186) → payment plans → delivery. Dashboard Invoicing section tracks revenue. No third-party scheduler, proposal, or billing service in the loop.
- **Liquid Glass layer (v9)**: `liquid.css` + `liquid.js` — glass surfaces, aurora blobs, shimmer sweeps, toasts (`vnToast`), clipboard (`vnCopy`), count-up stats. Progressive enhancement, reduced-motion safe. (Scroll progress + back-to-top come from `enhancements.js` site-wide — one provider, no duplicates.)
- **v9.1 reliability pass**: social-post workflow fixed (multiline file list crashed bash — posting logic now in `scripts/social_post.py`, env-var driven); homepage + services stats bars centered (3-col grids); theme-toggle crash removed from blog/articles/guides (it had killed their mobile menus); duplicate progress bars / back-to-top buttons / double count-up animations consolidated.
- **v18 cycle-2 wave (Oct 2026, senior-team)**: optimized ladder (Starter $12,000 with 3×$4,200 instalments · Big Projects from $35,000 + care from $5,000/mo, quarterly −10% · Assessment $2,500 + Express +$1,000) propagated through 22 files; **4 new pages** — `/services/roi.html` (shareable ROI & payback calculator), `/services/rate-card.html` (all rates + alternatives comparison, print-inverts to paper), `/services/care.html` (retainer itemized + plain-language rules), `/services/faq.html` (18 searchable FAQs + FAQPage JSON-LD); **proposal e-signature** (typed name + date printed on the doc, persists with the saved proposal); **instalment plans** in proposal/payment/portal; **wizard "email me this estimate"** (Web3Forms lead); **client-portal demo mode** (`?demo=1` — real encrypted account, seeded sample project, owner-email hard-silenced, one-click wipe); 404 smart "did you mean" fuzzy suggestions; homepage "currently live" proof chip; blog newsletter capture; booking gains a Google-Calendar one-tap link; services page gains the "★ Most popular" badge, a 9-row comparison matrix rendered from data.json, and a pricing-tools hub; command palette indexes the new pages; aria-current across 23 pages; sitemap +4 URLs; `sw.js` → `vnd-v18.0.0`. Full QA evidence in CHANGELOG (v18).
- **v17 QA sweep (Oct 2026, senior-team review)**: dashboard CSP now allows the Google Sign-In stylesheet (`style-src` + `accounts.google.com` — the button rendered unstyled for every client visit); proposal generator's package-change handler falls back to `PACKAGES.custom` instead of crashing on legacy/unknown ids; 12 client-facing pages (proposal/contract/invoice/payment/wizard/assessment/client-dashboard/privacy/terms/404/articles/guide) gained Open-Graph + Twitter cards so WhatsApp/email link previews show a proper card with the 1200×630 `og-image.png` instead of a raw URL; `sw.js` → `vnd-v17.0.0`. QA evidence: 41 pages crawled headlessly (0 broken anchors/links/dup-ids, all JS + JSON valid), wizard walked end-to-end, proposal survives all package ids, VLM visual pass CLEAN. Pricing re-verified against 2026 benchmarks — no changes needed.
- **v16 three-service simplification + pricing research + error fixes (Oct 2026, owner-directed)**: the four-package ladder (Audit $2K / Starter $10K / Growth $28K / Enterprise "from $20K") is consolidated into three services priced from 2026 market research (scoped audits $500–5K; productized builds $10K+; retainers $2K–15K/mo). Needs Assessment **$2,500 / KES 200K** (strategy work bills above implementation; 50% credited; absorbs the old Reliability Audit as a second mode). Starter Build **$10,000 / KES 800K + $1,400/mo care** (market-validated entry price for a production build). Big Projects **from $28,000 / KES 2.2M + from $6,000/mo care** (fixes the old inverted ladder where "Enterprise from $20,000" undercut Growth $28,000; custom-scoped after a Needs Assessment, 6–24 weeks, equity-for-services still available). Error fixes: invalid `<meta http-equiv="X-Frame-Options">` removed from the homepage (console error on every visit — GH Pages cannot set it), "Case Studies" nav link no longer wraps to two lines (white-space: nowrap), 404 skip-link anchor repaired (`#main` target added), projects page GitHub stats now seed from `projects.json` (`ghStats`) and fetch sequentially with 6h cache + 1h rate-limit backoff (was 16 parallel unauthenticated API calls spraying 403 console errors), calculator Big Projects shows "from" estimates, `sw.js` → `vnd-v16.0.0`, asset cache-busts bumped.
- **v13 Client Workspace** (see `CHANGELOG.md`): the client portal at `/services/client-dashboard.html` was rebuilt from localStorage-only into a real **encrypted workspace** — `services/portal-core.js` (PBKDF2-SHA256 split-salt auth, AES-256-GCM vault, 30-min idle / 7-day remember-me sessions), 7-stage delivery pipeline, payment plans (50/50, milestone, monthly) with M-Pesa reference capture, retainer lifecycle, per-project messages, and `VN1.*` share codes so the owner's dashboard can import client state. Owner command center lives in `/dashboard/`. **Consistency pass (Oct 2026)**: sitemap `lastmod` is now evidence-based (per-file git history, not a blanket weekly rewrite — see `.github/workflows/update-sitemap.yml`); Busara AI copy corrected to a 6-stage / 50-agent DAG everywhere (was mis-stated as 7-stage, conflated with the v7.0 version number); `MARKETING-STRATEGY.md` and `IMPROVEMENTS.md` now carry historical-document banners so stale figures ($5,000 Starter, Calendly, 19 sitemap URLs) can't be mistaken for current. **Truth & clarity pass (v15, Oct 2026)**: wizard/assessment package data reconciled to data.json (timelines, Enterprise monthly = Custom, deliverables); payment ×1000 and training-card render bugs fixed; projects directory carries honest roles/badges/metric qualifiers + Eco Africa Awards entry; blog reading times recomputed from actual text; article lastmod sourced from posts.json dateModified; social auto-post trigger removed (manual dispatch only); a11y fixes (reduced-motion delays, focus rings, light contrast, mobile language toggle, skip-link order); services page gained the engagement-terms block and KES local-schedule explanation. See CHANGELOG "Truth, Proof & Clarity Pass" for the full list incl. owner-decision flags.
- **v12 depth layer**: **site-wide command palette** — ⌘K or `/` on every public page searches all pages, services, packages, guides, articles and FAQs, with recent-pages memory and context actions (resume estimate / readiness score); the old homepage-only palette was retired. **Long-form reading layer** on articles + guides: auto-TOC with scroll-spy, per-heading anchor copy-links, share row, resume-where-you-left-off scroll memory, and related reading. **Trust signals**: `/ai-policy.html` (AI transparency policy — data handling, DPA 2019, human-review gates), `victor-ndunda.vcf` save-contact, and honest `availability.js` booking signals ("Now booking {Month} · N slots"). **Reliability**: booking-form draft autosave (`book/draft-guard.js`) and Speculation-Rules prefetch on 32 content pages. `sw.js` → `vnd-v12.0.0`.
- **v11 pricing & pipeline pass**: service pricing raised site-wide then tuned to the owner's final ladder (below); proposal generator completes the 7-stage pipeline; premium dark-brand resume PDF at `/resume/`; `/services/` now injects ProfessionalService + FAQPage JSON-LD generated from `data.json` (schema prices can never drift from published prices).
- **v11.1 owner-directed pricing**: AI Audit repositioned as a consulting gateway at **$2,000 / KES 160K** (50% still credited toward builds; the AI Reliability Audit aligned to the same consulting class); AI Starter **$10,000 / KES 800K + $1,400/mo**; AI Enterprise anchored **from $20,000 / KES 1.6M** (scales to $200K+); budget bands realigned (Under $3K / $3–10K / $10–30K / $30K+); wizard SERVICE_PRICES synced to published catalogue rates; Busara case-study duplicate stat fixed; FAQ + guide copy synced; data.json fetches cache-busted.
- **v11.2 intelligence layer**: new **AI Readiness Assessment** at `/services/assessment.html` — 12 questions, 4 dimensions, 0–100 score, weakest-link insight, package recommendation mapped to the price ladder (with an honest budget-reality bridge), a built-in cost-of-doing-nothing ROI calculator, shareable result URLs, print-to-PDF, and consent-gated lead email. The lead's score then travels through the funnel: `/book/` shows an "assessment on file" chip, scheduler emails carry the score in subject + body, assistant pings append it. Also: Web3Forms pipeline re-keyed and live end-to-end, `/.well-known/security.txt`, branded `/offline.html` served by the SW, `sw.js` → `vnd-v11.2.0`.
- **v10 smoothness & hierarchy pass**: `/book/` scheduler moved directly under the hero (was buried ~1900px down); services stats bar removed and replaced with a glass quick-anchor nav to every key section; homepage hero compacted so CTAs + stats fit the first laptop screen; `content-visibility: auto` on all below-fold sections; scroll progress bar now compositor-only (`scaleX`); font payload trimmed (Inter 7→5 weights, no more faux-bold mono); animated nav underlines, button press physics, `text-wrap: balance` headings, thin gradient scrollbar.
- **Notes for the owner**:
  - v16: the Reliability Audit is now a **mode of the Needs Assessment** ($2,500) rather than a separate service — pre-build opportunity mapping and post-ship reliability diagnosis share the engagement shape, timeline, and 50% build credit.
  - `/book/` uses the first-party scheduler (v9) — no third-party embed. Booking requests email via Web3Forms (rotate `window.VN_W3F_KEY` in `book/index.html` when needed — the assessment page in `services/assessment.html` carries the twin rotation line).
  - The Web3Forms key was rotated 2026-09-21 (owner-provided). If emails stop arriving, the dashboard → Notifications panel has a live self-test and step-by-step rotation instructions.
  - `articles/index.html` is a noindex redirect stub to `/blog/` (retired duplicate route).
  - Booking capacity is configured in `availability.js` (top of file: `PROJECT_SLOTS`, `CALLS_OPEN`) — the home/booking/services "Now booking…" line updates site-wide from those two constants.
  - The command palette index refreshes from `data.json` + `posts.json` (12h localStorage cache) — new services/articles appear in ⌘K automatically.
  - When adding a blog article: update `blog/posts.json` **and** the `<noscript>` list in `blog/index.html`, then let `update-sitemap.yml` refresh `sitemap.xml`.

## What's Here

A multi-page static site (no build step) deployed on GitHub Pages with a custom domain. Features:

- **Public site** — Home, About, Work, Services, Contact sections + Blog + Articles listing
- **Blog** — 10 long-form technical articles on multi-agent AI, agricultural intelligence, statistical engineering, and agent reliability research
- **Admin dashboard** (`/admin/`) — Private Google OAuth-protected dashboard with content management, analytics, social media monitoring, SEO tools, and security center
- **Job portal** (`/jobs/`) — Private Google OAuth-protected remote job aggregator (Arbeitnow + RemoteOK APIs)
- **404 page** — Custom branded 404 with smart redirect suggestions
- **Legal pages** — Terms of Service + Privacy Policy

## Tech Stack

- **HTML5 + CSS3 + vanilla JavaScript** (no frameworks, no build step, no npm install)
- **Google Fonts** — Inter (body) + JetBrains Mono (code/numbers)
- **Google Identity Services** — OAuth 2.0 for `/admin/` and `/jobs/` authentication
- **GitHub Actions** — Auto-deploy to GitHub Pages + auto-post to social media on new blog articles
- **Static JSON** — `blog/posts.json` is the single source of truth for article metadata

## Features

### Public Site
- Dark glassmorphism design with animated particle canvas (network graph aesthetic)
- Theme toggle (dark default, persisted in localStorage)
- Command palette (Cmd+K) for navigation and search
- Typewriter tagline cycling through roles
- Animated DAG visualization showing Busara AI's 7-stage agent pipeline
- 6 sections: Hero, About, Work, Skills marquee, Services, Contact
- Mobile responsive with hamburger menu
- Skip-to-content link + ARIA labels + visible focus styles + reduced-motion support

### Blog / Articles
- File-based CMS — articles are HTML files in `/blog/articles/`
- Single source of truth: `/blog/posts.json` (loaded via `fetch()` on blog listing + admin dashboard)
- Per-article SEO: canonical URL, Open Graph, Twitter Card, JSON-LD Article + BreadcrumbList schemas
- Per-article CSP, security headers, theme-color, robots meta
- Tagged (AI / Agriculture / Research / Engineering) with color coding
- Reading time + word count per article

### Admin Dashboard (`/admin/`)
- **Google OAuth 2.0** with account selection (forces Google account picker so user can choose which account)
- **Email allowlist**: `mututandunda@gmail.com`, `torv54@gmail.com`
- **30-minute idle timeout** with 5-min warning
- **8 sections**: Overview, Content, Analytics, Social, SEO, Security, Jobs, Settings
- **Activity feed** + login attempt log (stored in localStorage)
- **Strict CSP** with `frame-ancestors 'none'`, `noindex/noarchive/nosnippet`
- **Privacy-friendly analytics** — no third-party tracking; simulated data with disclaimer (integrate Plausible/Umami for production)

### Job Portal (`/jobs/`)
- Live job aggregation from Arbeitnow + RemoteOK APIs (no API key required)
- XSS-safe rendering using DOM API (no `innerHTML` with user data)
- URL validation (only http/https protocols allowed in Apply links)
- Filters: All / AI/ML / Data / Full-Stack / Remote
- Search + "Clear filters" empty state
- Same Google OAuth as admin

### Security
- **Content-Security-Policy** on all pages (strict, scoped per page)
- **X-Content-Type-Options: nosniff**, **Referrer-Policy**, **Permissions-Policy**
- **`rel="noopener noreferrer"`** on all `target="_blank"` links
- **`noindex, nofollow, noarchive, nosnippet, noimageindex`** on private pages
- **robots.txt** disallows `/admin/` and `/jobs/`
- **sessionStorage** (not localStorage) for auth — cleared on browser close
- **Idle timeout** — auto-logout after 30 minutes inactivity
- **No third-party tracking** — privacy-friendly

### Notifications & analytics (v8.1)
- **Booking assistant → email**: estimate completions and hand-off choices email you via Web3Forms (privacy-safe: estimate configuration only — no chat text, no PII; rate-limited; disclosed in the privacy policy).
- **⚠️ Web3Forms access key**: the key on the `window.VN_W3F_KEY` line in `book/index.html` is THE single rotation point for the message form and assistant notifications. If emails stop arriving (or the dashboard Notifications panel reports the key invalid), create a free key at web3forms.com and paste it there, then commit to `main`.
- **Dashboard → Notifications panel**: routing table + a one-click pipeline test that validates the live key and shows rotation steps if it's dead.
- **Analytics events**: the assistant and all `data-track` CTAs emit structured events to `window.__vnEvents` (in-memory only, zero network). Wire any provider by setting `window.__vnTrack = fn(ev)` before page scripts run — full taxonomy documented in the dashboard Analytics section.
- **Session restore fix**: restoring a live session on `/dashboard/` previously crashed at `switchSection()` (sideLinks not yet initialized); the restore call now runs after all renderers are defined.

### SEO
- **JSON-LD structured data**: Person, WebSite, Blog, Article (×9), BreadcrumbList (×11), ProfessionalService + 16 Offers + FAQPage (auto-generated from `services/data.json` on `/services/`)
- **Open Graph** + **Twitter Card** on all public pages
- **Canonical URLs** on all pages
- **Sitemap.xml** + **robots.txt**
- **Semantic HTML5** — proper heading hierarchy, `<main>`, `<article>`, `<nav>`, `<footer>`
- **Mobile-first responsive** — Google mobile-first indexing ready
- **HTTPS enforced** via GitHub Pages
- **Fast loading** — minimal dependencies (Google Fonts + GIS only)

### Social Media Auto-Posting
GitHub Actions workflow (`.github/workflows/social-post.yml`) auto-posts new blog articles to:
- **LinkedIn** — via LinkedIn Share API (w_member_social scope)
- **X (Twitter)** — via X API v2 with OAuth 1.0a HMAC-SHA256 signing
- **TikTok** — credentials staged; video pipeline pending

**Facebook** was abandoned (removed from workflow on 2026-07-03).

## File Structure

```
victor-portfolio/
├── index.html              # Home page (Hero, About, Work, Skills, Services, Contact)
├── 404.html                # Custom 404 page with redirects for common typos
├── styles.css              # Global styles (dark/light themes, a11y, focus-visible, skip-link)
├── app.js                  # Global JS (particle canvas, theme, nav, command palette)
├── og-image.png            # 1200×630 social sharing image
├── blog/
│   ├── index.html          # Blog listing (loads posts.json)
│   ├── posts.json          # Single source of truth for article metadata
│   └── articles/           # 9 article HTML files (each with full SEO + JSON-LD)
├── articles/
│   └── index.html          # Clean URL mirror of /blog/
├── admin/                  # Private admin dashboard
│   ├── index.html          # Admin shell with 8 sections
│   ├── admin.css           # Admin-specific styles
│   └── admin.js            # Admin logic (Google OAuth, section renderers)
├── jobs/
│   └── index.html          # Private job portal
├── terms-of-service.html
├── privacy-policy.html
├── robots.txt              # Disallow /admin/, /jobs/
├── sitemap.xml             # 14 URLs
├── CNAME                   # victorndunda.com
├── .nojekyll               # Prevent Jekyll processing
└── .github/workflows/
    ├── deploy.yml          # GitHub Pages deploy
    └── social-post.yml     # Auto-post to LinkedIn + X + TikTok on new articles
```

## Local Development

No build step required. To preview locally:

```bash
# Option 1: Python
python3 -m http.server 8000
# Open http://localhost:8000

# Option 2: Node
npx serve .

# Option 3: VS Code Live Server extension
```

> **Note on Google OAuth locally**: For `/admin/` and `/jobs/` to work locally, add `http://localhost:8000` (or your port) to **Authorized JavaScript origins** in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID.

## Adding a New Blog Article

1. Create `blog/articles/your-slug.html` using an existing article as template
2. Add an entry to `blog/posts.json` with metadata (title, description, date, readTime, slug, tags, etc.)
3. Add the URL to `sitemap.xml`
4. Commit and push to `main` — GitHub Actions auto-deploys + auto-posts to social media

## Deployment

Auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

### Custom Domain Setup (already done)

DNS configuration at registrar:
```
A     @        185.199.108.153
A     @        185.199.109.153
A     @        185.199.110.153
A     @        185.199.111.153
CNAME www      gadda00.github.io.
```

GitHub repo settings → Settings → Pages → Custom domain → `victorndunda.com` → Enforce HTTPS.

## GitHub Secrets (for social media auto-posting)

Set these in repo → Settings → Secrets and variables → Actions:

| Secret | Purpose |
|---|---|
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn Share API |
| `X_API_KEY` | X API v2 consumer key |
| `X_API_SECRET` | X API v2 consumer secret |
| `X_ACCESS_TOKEN` | X API v2 OAuth 1.0a user token |
| `X_ACCESS_SECRET` | X API v2 OAuth 1.0a user secret |
| `TIKTOK_CLIENT_ID` | TikTok developer app client ID |
| `TIKTOK_CLIENT_SECRET` | TikTok developer app client secret |
| `TIKTOK_ACCESS_TOKEN` | TikTok content posting token |

> **Helper script**: Run `python3 scripts/set_github_secrets.py --token ghp_xxx` to set TikTok secrets via the GitHub API.

## Contact

- **Email**: [mututandunda@gmail.com](mailto:mututandunda@gmail.com)
- **LinkedIn**: [victor-ndunda](https://www.linkedin.com/in/victor-ndunda)
- **GitHub**: [gadda00](https://github.com/gadda00)
- **Busara AI**: [busaraai.com](https://busaraai.com)
- **KilimoPRO**: [kilimo.pro](https://kilimo.pro)
- **AgentReplay**: [github.com/gadda00/agentreplay](https://github.com/gadda00/agentreplay) — open-source deterministic replay & counterfactual debugging for AI agents (whitepaper: [victorndunda.com/blog/articles/agentreplay-deterministic-replay.html](https://victorndunda.com/blog/articles/agentreplay-deterministic-replay.html))

---

Built in Nairobi, Kenya 🇰🇪
