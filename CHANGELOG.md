# Changelog

All notable changes to victorndunda.com are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — v3.0 Major Enhancement Release

**New Sections:**
- **"Now" section** (`#now`) — live snapshot of 4 active projects with progress bars, status badges, and ETAs. Shows what Victor is currently building (Busara AI v3, KilimoPRO v2, GARCH research, AI workshops).
- **Interactive Tech Stack** (`#techstack`) — 18 technologies across 5 categories (Languages, AI/ML, Web & Mobile, Data & Stats, Infra & DevOps) with click-to-filter functionality and proficiency bars.
- **GitHub Activity Widget** (`#github`) — live feed of 6 most recently updated repositories via GitHub API, with language colors, star counts, and relative timestamps.
- **Newsletter signup** — privacy-friendly email subscription form (localStorage-based, no backend needed yet).

**New Features:**
- **Animated count-up stats** — hero stats (50 agents, 2 platforms, 22+ sources, 5+ years) animate from 0 on scroll.
- **Live status indicator** — rotating "currently building" messages in hero (e.g., "Training crop disease models").
- **Toast notification system** — global `showToast()` function for success/error/info/copy feedback.
- **Copy-to-clipboard** — all contact cards now have copy buttons that appear on hover.
- **Reading progress bar** — all 9 blog articles now have a fixed top progress bar that fills as you read.
- **Command palette blog search** — Cmd+K now searches blog articles in addition to navigation commands.
- **Tilt/magnetic card effect** — work cards and about cards have subtle 3D tilt on mouse hover (desktop only).
- **Custom cursor** — animated dot + ring cursor on desktop (disabled on touch devices and reduced-motion).
- **Staggered reveal animations** — sections fade in with cascading delays as they enter viewport.
- **Premium gradient mesh** — hero section now has multi-layered radial gradient background.
- **Marquee edge fades** — skills marquee now fades at both edges.
- **Keyboard shortcuts** — `?` shows shortcut hint, `Shift+D` toggles theme.

**Bug Fixes:**
- **Theme toggle className overwrite** — was using `html.className = 'dark'` which clobbered all classes; now uses `classList.add/remove` to be safe.
- **Particle system O(n²) optimization** — replaced brute-force neighbor search with spatial grid hashing, reducing complexity from O(n²) to O(n) for connection lines. ~5x faster on 70 particles.
- **Particle canvas DPR handling** — now respects devicePixelRatio for crisp rendering on retina displays.
- **Particle canvas off-screen pause** — animation pauses when hero scrolls out of view (via IntersectionObserver).
- **Scroll listener throttling** — navbar scroll handler now uses requestAnimationFrame throttling (was running on every scroll event).
- **Typewriter reduced-motion** — now respects `prefers-reduced-motion` by showing static text with slow rotation instead of character-by-character animation.
- **Service worker navigation fallback** — was serving `/index.html` for ALL offline navigation requests (including blog articles); now only falls back to home for root path, returns proper offline message for other paths.
- **Service worker cache version** — bumped to `vnd-v3.0.0` to bust old caches.
- **System theme detection** — now respects `prefers-color-scheme: dark` if user hasn't explicitly chosen a theme.
- **Theme-color meta sync** — theme-color meta tag now updates when toggling themes.
- **Mobile menu aria-expanded** — hamburger button now properly updates `aria-expanded` state.

**Performance:**
- Particle animation pauses when off-screen
- Scroll handlers throttled with rAF
- Canvas uses devicePixelRatio for crisp rendering without unnecessary redraws
- Resize handler debounced (200ms)

**Verified:**
- 0 console errors across 11 pages tested (home, blog, articles, resume, services, wizard, dashboard, guide, 404, terms, privacy)
- All 9 blog articles have working reading progress bars
- Theme toggle works correctly (dark ↔ light)
- Command palette opens with Cmd+K
- GitHub widget loads 6 repos from live API
- Tech stack filtering works (All / Languages / AI / Web / Data / Infra)
- All new sections present in DOM

## [2.5.0] — 2026-07-04

### Added — Full-fledged Services Platform + Marketing Strategy

**Services Platform (full client journey):**
- **Project Scope Wizard** (`/services/wizard.html`) — intelligent 6-step multi-step wizard with a rules-based recommendation engine. Asks goal, AI type (multi-select), scale, budget, timeline, and details. Scores all 4 packages (0–100) and recommends the best fit. Saves briefs to localStorage. Includes instant price estimate with timeline multiplier and service add-ons. Auto-advances on selection. Validates each step. Result modal shows recommended package, match score, alternative packages, and CTAs to contract/payment/dashboard.
- **Client Portal** (`/services/client-dashboard.html`) — personal dashboard showing saved briefs with status badges (Draft/Contracted/In Progress/Delivered), KPI strip (briefs/contracts/payments/active), 6-step journey explainer, and data export/clear. All data local to the browser.
- **Contract Generator** (`/services/contract.html`) — auto-generates a 11-section AI Services Agreement from a brief (parties, scope, timeline, fees, client responsibilities, revisions, IP, confidentiality, warranties, termination, governing law). PDF download via jsPDF. Print-optimized CSS. Contract ID generation. Marks brief as "contracted" when viewed.
- **Payment Plan** (`/services/payment.html`) — 3 payment plans (50/50, milestone-based 30/40/30, monthly retainer) with live price breakdown. 3 payment methods (M-Pesa Paybill, Flutterwave, Stripe) with merchant details. Email/WhatsApp confirmation CTAs. Saves selected plan to brief.

**Homepage repositioning:**
- Removed "Job Portal →" CTA from hero (it was for Victor, not clients).
- Added "Start a Project" as the prominent secondary CTA (after Explore My Work).
- Added full-width "Services Journey Band" at the top of the services section — 6-step visual (Scope → Register → Contract → Pay → Track → Launch) with CTA to wizard.
- Services now has its own prominent line with the full client journey CTAs.

**Services landing page (`/services/`):**
- Hero CTA now leads with "Start the Project Wizard" (primary), then Explore packages, then Estimate your project.
- CTA banner at bottom now offers Wizard + Dashboard + Discovery call.

**Marketing Strategy doc (`MARKETING-STRATEGY.md`):**
- Comprehensive 90-day growth plan with positioning, 4 growth channels (inbound content, outbound direct, community, social media), funnel math, email marketing setup, analytics, week-by-week action plan, $176/mo budget, brand voice guide, risk mitigation, and success metrics. Targets 7 closed clients and $56K revenue in 90 days.

**Infrastructure:**
- Service worker bumped to `vnd-v2.7.0`; pre-caches all new service pages (wizard, client-dashboard, contract, payment + their CSS/JS).
- View Transitions meta tag added to all 17 blog articles and guides (was only on top-level pages).
- Service worker `NEVER_CACHE` list no longer excludes `/jobs/` (its shell is now cached).

### Verified
- 0 console errors across 11 pages tested (home, services, wizard, client-dashboard, contract, payment, resume, dashboard, blog, blog article, guide).
- Wizard end-to-end flow tested: 6 steps → result modal → correct recommendation (AI Growth for product/SMB/$3-10k/standard timeline).
- No broken internal links (32 HTML files, 46 targets).
- All images have alt text, all pages have lang/canonical/view-transition.

### Note
- Payment methods (M-Pesa Paybill 4071186, Flutterwave link, Stripe link) are placeholders. Victor must replace with his actual merchant details before going live with payments.

## [2.4.0] — 2026-07-04

### Added — Modern Web Platform + Error Fixes + Resume Enrichment

**Modern Web Platform (2025 baseline):**
- **View Transitions API** — smooth cross-page navigation with fade+scale transition (Chrome 115+, Safari 18+). Meta `view-transition` tag added to home, resume, dashboard. Reduced-motion respected.
- **Modern CSS features** — `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs, `color-mix()` for hover states, `:has()` selector for nav state, container queries for about-cards, scroll-driven animations for section reveals (all behind `@supports` — progressive enhancement).
- **PWA install prompt** — `beforeinstallprompt` handler with dismissible banner (7-day cooldown in localStorage). Skips admin/jobs pages.
- **Scroll progress indicator** — gradient bar at top of viewport showing reading position.
- **Back-to-top button** — appears after 600px scroll, smooth-scrolls to top.
- **Active section tracking** — IntersectionObserver highlights the nav link for the section currently in view.
- **RSS feed** (`/feed.xml`) — full RSS 2.0 + Atom self-link, 9 blog posts, auto-generated from posts.json.
- **Enhanced structured data** — added `ProfilePage` JSON-LD with `alumniOf` (University of Embu), `email`, `telephone`, `knowsLanguage`, expanded `knowsAbout`. WebSite schema now has `SearchAction` potential action.
- **Performance hints** — `dns-prefetch` for fonts.googleapis.com, fonts.gstatic.com, busaraai.com, kilimo.pro, github.com.
- **PWA manifest shortcuts** — added Resume, Dashboard Hub, Jobs Portal shortcuts with icons.

**Error Fixes:**
- **Resume PDF bullet bug** — bullets were rendering as `(cid:127)` due to font encoding issue with ListFlowable. Replaced with table-based bullet renderer using literal `●` glyph. Verified via PDF text extraction.
- **CSP in jobs/admin** — added `https://accounts.google.com` to `style-src` directive so Google Identity Services stylesheet loads without violation. Removed `frame-ancestors 'none'` from meta (ignored in meta anyway).
- **Missing canonical links** — added `<link rel="canonical">` to privacy-policy.html and terms-of-service.html.

**Resume Content Enrichment:**
- Added **Open Source & Writing** section to resume PDF and HTML — documents open-source projects, 9 technical blog articles, and 8 SMB AI guides.
- Added quantified achievements to experience bullets — "~40% latency reduction", "runs on $80 Android phones", "models in production for 12+ months".
- Mirrored all PDF content changes to the HTML resume page.

### Changed
- Service worker bumped to `vnd-v2.6.0`; pre-caches `/enhancements.js`, `/feed.xml`.
- `enhancements.js` loaded on home, resume, and dashboard pages.
- View Transitions meta tag on home, resume, dashboard.
- Homepage `<head>` now has 5 `dns-prefetch` hints + RSS alternate link.
- Blog page has RSS alternate link.

### Verified
- 0 console errors on home, resume, dashboard, blog, feed.xml.
- All internal links valid (28 HTML files, 33 unique targets checked).
- All images have alt text or aria-hidden.
- All pages have lang, title, meta description, canonical, viewport.
- RSS feed validates as well-formed XML.

## [2.3.0] — 2026-07-04

### Added — Portfolio Review Plan Implementation
- **Resume page** (`/resume/`) — full HTML resume with education, experience, skills matrix, selected projects, certifications, and languages. Print-optimized CSS produces a clean printed PDF.
- **Downloadable resume PDF** (`/resume/Victor-Ndunda-Resume.pdf`) — generated via ReportLab, embedded in hero CTA, FAB, jobs portal, and dashboard.
- **Education section** on homepage About — University of Embu (2014–2018) B.Sc. Computer Science, plus continuous-learning entry. Timeline UI with course tags.
- **Resume download button** in hero CTA (alongside Explore My Work) and as a floating action button site-wide.
- **Unified dashboard hub** (`/dashboard/`) — single entry point linking admin, jobs, services, research, analytics, and resume modules. Includes KPI strip (visits, resume downloads, job applications, last visit) powered by localStorage, plus a unified recent-activity feed.
- **Testimonials / social proof section** on homepage — three testimonial cards with avatar, quote, and author metadata.
- **Swahili / English language toggle** (`/i18n.js`) — persisted in localStorage, swaps `body[data-lang]`, translates elements with `data-i18n-key`. Toggle chip in nav.
- **Floating action buttons** (resume + contact) on homepage — mobile-friendly, always-visible quick actions.
- **Admin sidebar "Hub" section** — quick links to Dashboard Hub, Resume Page, and Jobs Portal from admin.
- **Jobs portal polish** — added Resume + Dashboard nav links, redesigned hero with gradient background and inline CTA buttons (Download resume, My Dashboard).

### Changed
- Refactored homepage services "Packages quick view" — extracted all inline `style=""` attributes into classed `.svc-quick-*` selectors in `styles.css`. Same visual, now maintainable.
- Refactored homepage services CTA button — replaced inline styles with `.services-cta-btn` class.
- Service worker bumped to `vnd-v2.5.0`; pre-caches `/resume/`, `/dashboard/`, `/i18n.js`, and the resume PDF. Removed `/jobs/` from `NEVER_CACHE` so the jobs portal shell is now offline-capable.
- Sitemap updated with `/resume/` and `/resume/Victor-Ndunda-Resume.pdf`.

### Fixed
- Resume download tracking now writes to `vn_resume_downloads` localStorage key, which the dashboard reads and surfaces in the activity feed.

## [2.2.0] — 2026-07-04

### Added — Job Portal Automation
- **Job-applied tracking** — applied jobs disappear from open list, move to Applied History
- **Tailored resume PDF** per job (jsPDF, keyword-matched bullets/skills, lazy-loaded)
- **Tailored cover letter PDF** per job (html2pdf, auto-populated template)
- **Gmail compose integration** — prefilled subject + body + attachments note
- **AI-powered job scoring** (0–100) — skills, tech, location, remote, experience, salary
- **Skill gap analysis** — green matched tags, red missing tags
- **Interview prep notes** modal per job (auto-saved to localStorage)
- **Application status pipeline** — saved → applied → interview → offer → rejected → ghosted
- **Smart filters** — search, remote/onsite/email, min score
- **Export/Import backup** as JSON
- `jobs/lib/` — 9 modular JS files (profile, storage, scoring, templates, resume, coverletter, gmail, tracking, app)
- `jobs/README.md` — comprehensive documentation

## [2.1.0] — 2026-07-03

### Added — Auth + Brand Assets
- **Password fallback auth** (PBKDF2, Web Crypto API) for when Google OAuth fails
- **Dual auth UI** — Google tab + Password tab on `/admin/` and `/jobs/`
- **Universal brand assets** — logo, favicon (SVG + PNG), apple-touch-icon, OG image, PWA manifest
- **Profile pictures** (400/800/1024px) and **banners** (LinkedIn/X/TikTok dimensions)
- **404 page** with branded design + smart redirect suggestions
- `LOGIN-FIX.md` — Google OAuth fix instructions + password fallback docs

### Fixed
- XSS vulnerability in jobs portal (replaced `innerHTML` with safe DOM API)
- `social-post.yml` workflow multiline `$GITHUB_OUTPUT` bug
- Color contrast — `--text-dim` #4a5568 → #64748b (now passes WCAG AA)
- Heading hierarchy — blog cards use `<h2>` instead of `<h3>`

### Changed
- All 9 blog articles now have full SEO (canonical, OG, Twitter Card, JSON-LD Article + BreadcrumbList)
- All 17 HTML files have new favicons + manifest + apple-touch-icon + PWA meta tags
- README.md rewritten from scratch (was significantly out of date)
- Skip-to-content link, `:focus-visible` outlines, `aria-label` on icon buttons
- `BLOG_POSTS` extracted to `blog/posts.json` (single source of truth)
- `app.js` deferred, preconnect for fonts.gstatic.com, preload critical resources

## [2.0.0] — 2026-07-03

### Added — Admin Dashboard + Articles
- **Private `/admin/` dashboard** with Google OAuth (account selection)
  - 8 sections: Overview, Content, Analytics, Social, SEO, Security, Jobs, Settings
  - 30-minute idle timeout, login attempt logging, activity feed
  - Strict CSP, `noindex/noarchive/nosnippet`
- **`/articles/`** clean URL path (mirrors `/blog/`)
- **TikTok domain verification** meta tag
- **Facebook abandoned** — removed from `social-post.yml` workflow

### Security
- Content-Security-Policy on all pages
- `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- `rel="noopener noreferrer"` on all `target="_blank"` links
- `noindex, nofollow, noarchive, nosnippet, noimageindex` on private pages
- `sessionStorage` (not localStorage) for auth
- 30-minute idle timeout on admin

## [1.0.0] — 2026-07-01

### Initial Release
- Multi-page static site (Home, Blog, Jobs, Terms, Privacy)
- Dark glassmorphism design with particle canvas
- Theme toggle (dark default)
- Command palette (Cmd+K)
- Google OAuth for private job portal
- 9 technical articles on multi-agent AI + agricultural intelligence
- GitHub Actions: auto-deploy + social auto-post (LinkedIn, X, Facebook)
- Custom domain: victorndunda.com

[Unreleased]: https://github.com/gadda00/victor-portfolio/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/gadda00/victor-portfolio/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/gadda00/victor-portfolio/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/gadda00/victor-portfolio/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/gadda00/victor-portfolio/releases/tag/v1.0.0

## [3.1.0] — 2026-07-09

### Major Restructure & Feature Additions

**Section Reorder & About Rewrite:**
- Moved Services ("What I can build for you") to right after About — better flow for visitors
- Rewrote About section to be warmer, more approachable, less intimidating
  - Old: "Turning data into intelligence" (technical, jargon-heavy)
  - New: "Hi, I'm Victor — nice to meet you" (conversational, human)
- Updated about-cards: Practical AI, Multi-Agent Systems, Impact-Driven, Always Learning

**Blog/Articles/Feed Consolidation:**
- `/articles/` now redirects to `/blog/` (was a near-duplicate with stale nav)
- `feed.xml` now auto-generated from `posts.json` (prevents drift)
- GitHub Action `update-sitemap.yml` now also regenerates `feed.xml` on every blog content push
- Removed duplicate "Articles" nav link, consolidated to single "Blog"

**Dashboard Overhaul (replaces /admin/):**
- New `/dashboard/` with Google OAuth 2.0 login + PBKDF2 password fallback
- Login overlay with Google Sign-In button + password form
- 9 sections: Overview, Content, Client Briefs, Analytics, Jobs, Social Composer, SEO, Security, Settings
- Transferred ALL admin features: activity logging, login attempt log, session timeout (30min idle), social composer, SEO checklist, security center
- Client Briefs section: view all briefs from services wizard, status tracking
- Jobs section: application pipeline tracking (saved/applied/interview/offer)
- `/admin/` now redirects to `/dashboard/`
- Shared `auth.js` module (eliminates duplicated OAuth code)

**Job Portal Expansion:**
- Added 5 new job sources (10 total): RemoteOK AI, Remotive Data, Remotive DevOps, Jobicy Engineering, RemoteInTech (GitHub community)
- Updated source filter dropdown with all 10 sources
- CSP updated to allow `raw.githubusercontent.com` for RemoteInTech
- Global remote jobs, not just German/European

**Booking System (`/book/`):**
- New dedicated booking page with 3 tabs:
  1. **Schedule a Call** — Cal.com embed (lazy-loaded, replaces Calendly)
  2. **Send a Message** — Web3Forms backend (no server needed)
  3. **Direct Contact** — WhatsApp, Email, Phone, LinkedIn cards
- "What you get" section: AI audit, roadmap, budget reality, pilot ideas, no pressure, follow-up
- Homepage hero CTA now "Book a Free Call" → /book/
- Nav bar "Book a Call" button (gradient highlight)
- Replaced Calendly embed on homepage with link to /book/

**Performance Optimizations:**
- GitHub Activity Widget now lazy-loads via IntersectionObserver (was fetching on page load)
- Command palette blog posts now lazy-load on first open (was fetching on page load)
- All scripts already deferred; service worker cache bumped to v3.1.0
- New pages added to service worker pre-cache (auth.js, /book/)

**Infrastructure:**
- `robots.txt` now disallows `/dashboard/`
- Service worker cache version bumped to `vnd-v3.1.0`
- GitHub Action auto-generates feed.xml from posts.json on every push

### Verified
- 0 console errors across home, book, dashboard, blog pages
- Articles redirect to blog successfully
- Dashboard login overlay displays correctly (Google button + password form)
- Book page 3 tabs work correctly
- All JS syntax validated
- All pages return HTTP 200
