# Contributing to victorndunda.com

Thanks for your interest in contributing! This is a personal portfolio + blog + private admin dashboard for Victor Ndunda. While primarily a solo project, suggestions and improvements are welcome.

## Ways to Contribute

- **Report bugs** — open an issue with reproduction steps
- **Suggest features** — open an issue with the `enhancement` label
- **Improve accessibility** — a11y PRs are always welcome
- **Fix typos** in blog articles or docs
- **Optimize performance** — smaller bundle, faster paint
- **Improve SEO** — better structured data, meta tags
- **Translate** content (not currently a priority but open to discussion)

## Quick Start

```bash
# Clone
git clone https://github.com/gadda00/victor-portfolio.git
cd victor-portfolio

# Serve locally (no build step)
python3 -m http.server 8000
# Open http://localhost:8000
```

For Google OAuth to work locally, add `http://localhost:8000` to Authorized JavaScript origins in Google Cloud Console → Credentials → OAuth Client ID.

## Code Style

- **HTML** — semantic, accessible, no inline styles (use CSS classes)
- **CSS** — BEM-ish, CSS custom properties for theming, mobile-first
- **JavaScript** — vanilla ES2020+, no frameworks, modular IIFE pattern
- **No build step** — the site is static and must remain buildable without npm

## Project Structure

```
victor-portfolio/
├── index.html              # Home page
├── 404.html                # Custom 404
├── blog/                   # Blog listing + 9 article HTML files
│   └── posts.json          # Single source of truth for article metadata
├── articles/               # Clean URL mirror of /blog/
├── admin/                  # Private admin dashboard (Google OAuth + password)
│   ├── admin.js            # Auth + dashboard logic
│   └── admin.css           # Admin styles
├── jobs/                   # Private job portal with automation
│   └── lib/                # 9 modular JS files (profile, storage, scoring, etc.)
├── styles.css              # Global styles
├── app.js                  # Global JS (particles, theme, command palette)
└── .github/workflows/      # GitHub Actions (deploy + social auto-post)
```

## Adding a Blog Article

1. Create `blog/articles/your-slug.html` using an existing article as template
2. Add an entry to `blog/posts.json` with metadata
3. Add the URL to `sitemap.xml`
4. Commit and push — auto-deploys + auto-posts to social media

## Before Submitting a PR

- [ ] Test on desktop AND mobile (Chrome + Firefox + Safari)
- [ ] Run Lighthouse — aim for 90+ on all categories
- [ ] Verify HTML tag balance (`python3 -c "import re; ..."`)
- [ ] Check JavaScript syntax (`node -c path/to/file.js`)
- [ ] No `console.log` in production code
- [ ] All `target="_blank"` links have `rel="noopener noreferrer"`
- [ ] All images have `alt` text
- [ ] All icon-only buttons have `aria-label`

## Commit Message Convention

```
<type>: <short description>

<optional body explaining what + why>

<optional footer>
```

Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`

## License

By contributing, you agree that your contributions will be licensed under the MIT License (see [LICENSE](./LICENSE)).

## Contact

- **Email**: [mututandunda@gmail.com](mailto:mututandunda@gmail.com)
- **GitHub**: [gadda00](https://github.com/gadda00)
- **Site**: [victorndunda.com](https://victorndunda.com)
