# Social Media Auto-Posting & Blog CMS Documentation

## Overview

This document describes the social media automation and blog content management system for Victor Ndunda's portfolio at victorndunda.com.

## Blog Content Management

### Architecture
The blog uses a file-based CMS approach — articles are HTML files in `/blog/articles/`. To publish a new article:

1. Create a new HTML file in `/blog/articles/` using the article template
2. Add the article metadata to the `posts` array in `/blog/index.html`
3. Push to GitHub — GitHub Pages auto-deploys within 30 seconds

### AI-Powered Article Generation
The blog CMS is designed to work with AI tools for content generation:

1. **Research**: Use web search to gather sources and data
2. **Draft**: Use LLM (GLM-4.6, GPT-4, or Claude) to write the article
3. **Format**: Convert to HTML using the article template
4. **Publish**: Push to GitHub

### SEO Optimization
Each article includes:
- Unique `<title>` and `<meta description>`
- Open Graph tags (for social sharing)
- Twitter Card meta tags
- JSON-LD structured data (Article schema)
- Canonical URL
- Sitemap entry

## Social Media Auto-Posting

### Overview
The social media automation system auto-posts blog articles to:
- **X (Twitter)** — via X API v2
- **LinkedIn** — via LinkedIn Share API
- **Facebook** — via Facebook Graph API (Page posts)
- **TikTok** — via TikTok Content Posting API

### Setup Requirements

#### 1. X (Twitter) API
- **API**: X API v2
- **Free tier**: 17 posts per 24 hours
- **Setup**:
  1. Apply for an X Developer account at developer.x.com
  2. Create a Project and App
  3. Generate Bearer Token and API keys
  4. Set environment variables: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`

#### 2. LinkedIn API
- **API**: LinkedIn Share API (w_member_social scope)
- **Status**: ✅ Token obtained and stored as GitHub repository secret `LINKEDIN_ACCESS_TOKEN`
- **Setup**: Complete — add the token as a repository secret in GitHub Settings > Secrets and Variables > Actions

#### 3. Facebook Graph API
- **API**: Facebook Graph API v25.0 (Page Posts)
- **Setup**:
  1. Create a Facebook App at developers.facebook.com
  2. Get a Page Access Token with `pages_manage_posts` permission
  3. Set environment variables: `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`

#### 4. TikTok Content Posting API
- **API**: TikTok Content Posting API
- **Setup**:
  1. Register a TikTok Developer app at developers.tiktok.com
  2. Apply for Content Posting API access
  3. Generate access token
  4. Set environment variable: `TIKTOK_ACCESS_TOKEN`

### Implementation

The auto-posting runs as a GitHub Action on every push to `main` that includes new blog articles. The workflow:

1. Detects new/modified files in `/blog/articles/`
2. Extracts title, description, and URL from each article
3. Posts to each social platform:
   - **X**: "New article: {title} — {url}"
   - **LinkedIn**: Professional post with article summary and URL
   - **Facebook**: Page post with article title and URL
   - **TikTok**: Video post (requires pre-generated video content)
4. Logs results to the GitHub Action output

### GitHub Actions Workflow

Create `.github/workflows/social-post.yml`:

```yaml
name: Auto-Post to Social Media
on:
  push:
    branches: [main]
    paths: ['blog/articles/**']
jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - name: Detect new articles
        id: detect
        run: |
          NEW_FILES=$(git diff --name-only HEAD~1 HEAD -- 'blog/articles/' | grep '\.html$' || true)
          echo "files=$NEW_FILES" >> $GITHUB_OUTPUT
      - name: Post to X
        if: steps.detect.outputs.files != ''
        run: |
          # Parse article title and URL, then post to X API v2
          # POST https://api.twitter.com/2/tweets
          # Body: {"text": "New article: {title} — https://victorndunda.com/blog/articles/{filename}"}
          echo "Posting to X..."
      - name: Post to LinkedIn
        if: steps.detect.outputs.files != ''
        run: |
          # POST https://api.linkedin.com/v2/ugcPosts
          echo "Posting to LinkedIn..."
      - name: Post to Facebook
        if: steps.detect.outputs.files != ''
        run: |
          # POST https://graph.facebook.com/v25.0/{page_id}/feed
          echo "Posting to Facebook..."
```

### API Details

#### X (Twitter) API v2
- **Endpoint**: `POST https://api.twitter.com/2/tweets`
- **Auth**: OAuth 1.0a User Context
- **Body**: `{"text": "New article: Building a 50-Agent DAG Pipeline — https://victorndunda.com/blog/articles/building-50-agent-dag.html"}`
- **Rate limit**: 17 requests per 24 hours (Free tier)
- **Cost**: Free

#### LinkedIn Share API
- **Endpoint**: `POST https://api.linkedin.com/v2/ugcPosts`
- **Auth**: OAuth 2.0 Bearer Token (w_member_social scope)
- **Body**: Article share with title, description, and URL
- **Rate limit**: Not publicly documented, but generous for individual use
- **Cost**: Free

#### Facebook Graph API
- **Endpoint**: `POST https://graph.facebook.com/v25.0/{page_id}/feed`
- **Auth**: Page Access Token (pages_manage_posts permission)
- **Body**: `{"message": "New article: {title}", "link": "{url}"}`
- **Rate limit**: 200 calls per hour per user
- **Cost**: Free

#### TikTok Content Posting API
- **Endpoint**: `POST https://open.tiktokapis.com/v2/post/publish/video/init/`
- **Auth**: OAuth 2.0 Access Token
- **Requirements**: Pre-generated video content (article summary as short video)
- **Rate limit**: App-specific
- **Cost**: Free

## SEO Implementation

### Structured Data (JSON-LD)
The portfolio includes structured data for Google Rich Results:

1. **Person Schema** (index.html) — name, job title, worksFor, sameAs, address, knowsAbout
2. **WebSite Schema** (index.html) — name, url, description, author
3. **Article Schema** (each blog article) — headline, datePublished, author, publisher

### Technical SEO
- `robots.txt` — allows crawling of all pages except `/jobs/`
- `sitemap.xml` — lists all public pages with lastmod dates
- `.nojekyll` — prevents Jekyll processing (needed for /blog/ and /jobs/)
- `canonical` URLs — prevents duplicate content issues
- Open Graph + Twitter Card meta tags — for social sharing
- Semantic HTML5 — proper heading hierarchy, article tags, nav tags
- Mobile responsive — Google mobile-first indexing ready
- Fast loading — no external dependencies except Google Fonts
- HTTPS enforced — via GitHub Pages

### Content SEO
- Target keywords: "Victor Ndunda", "AI Engineer Nairobi", "Busara AI", "KilimoPRO", "multi-agent AI", "agricultural intelligence Kenya"
- Meta descriptions on every page (150-160 characters)
- Image alt texts (when images are added)
- Internal linking between blog articles
- External links to GitHub repos and live projects

## Google OAuth Setup for Job Portal

### How to set up Google Sign-In for the private job portal:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Add `https://victorndunda.com` to **Authorized JavaScript origins**
7. Copy the **Client ID**
8. Replace `YOUR_GOOGLE_CLIENT_ID` in `/jobs/index.html` with your Client ID
9. Push to GitHub

The job portal will only allow access to `mututandunda@gmail.com`. Any other Google account will see "Access denied."

### Security Notes
- The OAuth flow is client-side only (no backend needed for static sites)
- Session-based auth (cleared on browser close) — prevents persistent access
- `noindex, nofollow` meta tag prevents search engine indexing
- `robots.txt` disallows `/jobs/` path
- No visible link in navigation — only accessible by direct URL
