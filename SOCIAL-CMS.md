# Social Media Auto-Posting & Blog CMS Documentation

## Overview

This document describes the social media automation and blog content management system for Victor Ndunda's portfolio at [victorndunda.com](https://victorndunda.com).

## Architecture Summary

| Component | Status | Notes |
|---|---|---|
| Blog CMS | ✅ Active | File-based, 9 articles live |
| LinkedIn auto-post | ✅ Active | LinkedIn Share API |
| X (Twitter) auto-post | ✅ Active | X API v2, OAuth 1.0a |
| TikTok auto-post | ⏳ Pending | Credentials staged; video pipeline TBD |
| Facebook auto-post | ❌ Abandoned | Removed per product decision (2026-07-03) |
| Admin dashboard | ✅ Active | `/admin/` (Google OAuth, private) |
| Job portal | ✅ Active | `/jobs/` (Google OAuth, private) |

## Blog Content Management

### Architecture
The blog uses a file-based CMS approach — articles are HTML files in `/blog/articles/` (also accessible via `/articles/`). To publish a new article:

1. Create a new HTML file in `/blog/articles/` using the article template
2. Add the article metadata to the `posts` array in `/blog/index.html`
3. Push to GitHub — GitHub Pages auto-deploys within 30 seconds

### AI-Powered Article Generation
The blog CMS is designed to work with AI tools for content generation:

1. **Research**: Use web search to gather sources and data
2. **Draft**: Use LLM (GLM-4.6, GPT-4, or Claude) to write the article
3. **Format**: Convert to HTML using the article template
4. **Publish**: Push to GitHub
5. **Auto-post**: GitHub Actions triggers social media posting on push

### SEO Optimization
Each article includes:
- Unique `<title>` and `<meta description>`
- Open Graph tags (for social sharing)
- Twitter Card meta tags
- JSON-LD structured data (Article schema)
- Canonical URL
- Sitemap entry

## Social Media Auto-Posting

### Active Platforms

#### 1. LinkedIn API
- **API**: LinkedIn Share API (`w_member_social` scope)
- **Endpoint**: `POST https://api.linkedin.com/v2/ugcPosts`
- **Auth**: OAuth 2.0 Bearer Token
- **Secret stored**: `LINKEDIN_ACCESS_TOKEN`
- **To refresh token**: Visit https://developer.linkedin.com/ > My Apps > Victorndunda > Auth > Generate Access Token
- **Required scopes**: `w_member_social`, `openid`, `profile`

#### 2. X (Twitter) API v2
- **API**: X API v2
- **Endpoint**: `POST https://api.twitter.com/2/tweets`
- **Auth**: OAuth 1.0a User Context (HMAC-SHA256 signing)
- **Rate limit**: 17 posts per 24 hours (Free tier)
- **Secrets stored**: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`
- **To get OAuth 1.0a tokens**: Visit https://developer.x.com/ > App > Keys and Tokens > Generate Access Token & Secret

#### 3. TikTok Content Posting API (Staged)
- **API**: TikTok Content Posting API
- **App name**: Victorrndunda
- **Client ID**: `77z5e5d5lrrhnk` (stored as `TIKTOK_CLIENT_ID`)
- **Client Secrets**: Two active secrets (key rotation)
- **Domain verification token**: `tiktok-developers-site-verification=Vl0GJD45LLUlnpFfQ23udG6lANNqZy3R` (added to site `<meta>`)
- **Access Token TTL**: 2 months (5,184,000 seconds)
- **Endpoint**: `POST https://open.tiktokapis.com/v2/post/publish/video/init/`
- **Status**: Credentials staged in workflow; video generation pipeline (text → short video) is pending
- **Secrets to store**: `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ACCESS_TOKEN`
- **Note**: TikTok requires pre-generated video content; article auto-post will trigger when video pipeline is built

### Abandoned Platforms

#### Facebook (Abandoned 2026-07-03)
- **Reason**: Product decision to consolidate social presence on LinkedIn, X, and TikTok
- **Previous app ID**: 1005457702227257
- **Action**: Removed from `social-post.yml` workflow; `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN` secrets may remain in GitHub but are no longer used

### GitHub Actions Workflow

The auto-posting runs as a GitHub Action on every push to `main` that includes new blog articles. The workflow:

1. Detects new/modified files in `/blog/articles/`
2. Extracts title, description, and URL from each article
3. Posts to each active platform:
   - **LinkedIn**: Professional post with article summary and URL
   - **X**: Tweet with article title and URL (≤280 chars)
   - **TikTok**: Logs intent (video pipeline pending)
4. Logs results to the GitHub Action output

## Admin Dashboard (`/admin/`)

A private admin area accessible only to `mututandunda@gmail.com` via Google OAuth with **account selection** (forces the Google account picker so the right account can be chosen from many).

### Features
- **Dashboard Overview**: Site stats, recent activity, quick actions
- **Content Management**: List, view, and manage blog articles
- **Analytics**: Page views, top content, traffic sources (privacy-friendly, no third-party tracking)
- **Social Media**: View posting status, connected platforms
- **SEO Tools**: Meta tag inspector, sitemap status, structured data validator
- **Security Center**: Login attempts, session info, security headers status
- **Job Portal Stats**: Aggregated job feed stats

### Access
- URL: `https://victorndunda.com/admin/`
- Auth: Google OAuth 2.0 (GIS) with `prompt: 'select_account'`
- Allowed email: `mututandunda@gmail.com`
- Session: 30-minute idle timeout, persisted in `sessionStorage`
- robots.txt: `Disallow: /admin/`
- Meta: `noindex, nofollow, noarchive, nosnippet`

## Job Portal (`/jobs/`)

Private job aggregation portal (existing). Same Google OAuth as admin.

## SEO Implementation

### Structured Data (JSON-LD)
The portfolio includes structured data for Google Rich Results:

1. **Person Schema** (index.html) — name, job title, worksFor, sameAs, address, knowsAbout
2. **WebSite Schema** (index.html) — name, url, description, author
3. **Article Schema** (each blog article) — headline, datePublished, author, publisher
4. **BreadcrumbList** (blog + articles)

### Technical SEO
- `robots.txt` — allows crawling; disallows `/admin/`, `/jobs/`
- `sitemap.xml` — lists all public pages with lastmod dates
- `.nojekyll` — prevents Jekyll processing
- `canonical` URLs — prevents duplicate content issues
- Open Graph + Twitter Card meta tags — for social sharing
- Semantic HTML5 — proper heading hierarchy, article tags, nav tags
- Mobile responsive — Google mobile-first indexing ready
- Fast loading — minimal external dependencies (Google Fonts only)
- HTTPS enforced — via GitHub Pages
- TikTok site verification meta tag

### Content SEO
- Target keywords: "Victor Ndunda", "AI Engineer Nairobi", "Busara AI", "KilimoPRO", "multi-agent AI", "agricultural intelligence Kenya"
- Meta descriptions on every page (150-160 characters)
- Internal linking between blog articles
- External links to GitHub repos and live projects

## Security Implementation

### Headers & Meta Tags
- `Content-Security-Policy` — restricts script/style/img/font/connect sources
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — restricts camera, microphone, geolocation
- `X-UA-Compatible: IE=edge`

> Note: GitHub Pages does not allow setting HTTP response headers via `.htaccess` or `_headers` files. We use `<meta http-equiv>` equivalents where possible. For full HTTP header control, consider moving to Netlify/Cloudflare Pages.

### Authentication Security
- Google OAuth 2.0 via Google Identity Services (GIS)
- Authorized email allowlist (single user: `mututandunda@gmail.com`)
- Account selection forced (`prompt: 'select_account'`) — prevents wrong-account lockout
- Session storage (not localStorage) — cleared on browser close
- 30-minute idle timeout on admin
- `noindex, nofollow, noarchive, nosnippet` on all private pages
- robots.txt disallows private paths
- No visible links to private areas in public navigation

### Content Security Policy (CSP)
The site uses a strict CSP that only allows:
- Scripts from Google Accounts (GIS) and inline (with nonce)
- Styles from Google Fonts and inline
- Images from self and data: URIs
- Fonts from Google Fonts
- Connects to Google APIs and public job APIs

## Google OAuth Setup

### How Google Sign-In works (with account selection)

1. User navigates to `/admin/` or `/jobs/`
2. Google Identity Services loads
3. `google.accounts.id.prompt()` is called with `prompt_parent_id` and select_account hint
4. **Account picker appears** — user selects which Google account to use
5. On credential response, JWT is decoded client-side
6. Email is checked against allowlist
7. If authorized → dashboard loads; session stored in `sessionStorage`
8. If unauthorized → access denied message; auto-select disabled

### Setup Steps (already done)
1. ✅ Google Cloud project created
2. ✅ OAuth 2.0 Client ID: `794306876985-8v3qsraj7t591oc4jv0p0s056htknjf1.apps.googleusercontent.com`
3. ✅ Authorized JavaScript origins: `https://victorndunda.com`, `https://www.victorndunda.com`, `http://localhost:3000`
4. ✅ GIS script loaded on `/admin/` and `/jobs/`
5. ✅ `prompt: 'select_account'` configured for account picker

## File Structure

```
victor-portfolio/
├── index.html              # Home page
├── styles.css              # Global styles
├── app.js                  # Global JS (theme, nav, particles)
├── blog/
│   ├── index.html          # Blog listing
│   └── articles/           # 9 article HTML files
├── articles/               # Clean URL mirror of /blog/articles/
├── admin/                  # Private admin dashboard (Google OAuth)
│   ├── index.html          # Admin SPA
│   ├── admin.css           # Admin-specific styles
│   └── admin.js            # Admin logic
├── jobs/                   # Private job portal (Google OAuth)
│   └── index.html
├── terms-of-service.html
├── privacy-policy.html
├── robots.txt
├── sitemap.xml
├── CNAME                   # victorndunda.com
└── .github/workflows/
    ├── deploy.yml          # GitHub Pages deploy
    └── social-post.yml     # Auto-post on new articles
```
