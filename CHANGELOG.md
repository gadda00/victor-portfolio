# Changelog

All notable changes to victorndunda.com are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Service worker for PWA/offline support (in progress)
- Auto-update sitemap.xml lastmod dates via GitHub Action (in progress)

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
