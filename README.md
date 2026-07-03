# Victor Ndunda — Portfolio

> Personal portfolio, blog, and private admin dashboard for **Victor Ndunda** — AI Engineer & Founder of Busara AI and KilimoPRO. Built in Nairobi, Kenya 🇰🇪.

**Live**: [victorndunda.com](https://victorndunda.com)

## What's Here

A multi-page static site (no build step) deployed on GitHub Pages with a custom domain. Features:

- **Public site** — Home, About, Work, Services, Contact sections + Blog + Articles listing
- **Blog** — 9 long-form technical articles on multi-agent AI, agricultural intelligence, and statistical engineering
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

### SEO
- **JSON-LD structured data**: Person, WebSite, Blog, Article (×9), BreadcrumbList (×11)
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

---

Built in Nairobi, Kenya 🇰🇪
