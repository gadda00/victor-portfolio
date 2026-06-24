# Victor Ndunda — Portfolio

> Personal portfolio for Victor Ndunda — AI Engineer & Founder of Akili.

Live at **[victorndunda.com](https://victorndunda.com)** (coming soon) · Currently deployed at **[gadda00.github.io/victor-portfolio](https://gadda00.github.io/victor-portfolio/)**

## What's Here

A single, self-contained `index.html` — no build step, no dependencies, no external resources. Just open it in a browser.

## Features

- **Dark glassmorphism design** with animated gradient mesh background
- **Animated neural network canvas** in the hero (32 drifting nodes with proximity lines)
- **Typewriter tagline** cycling through roles
- **Count-up stats** triggered on scroll
- **Animated DAG visualization** showing Akili's 6-stage agent pipeline
- **7 sections**: Hero, About, Skills, Akili (featured), Projects, Experience, Contact
- **Theme toggle** (dark/light, dark is default)
- **Fully responsive** with mobile hamburger menu
- **Zero dependencies** — system fonts, inline SVG icons, vanilla JS

## Tech

- HTML5 + CSS3 (inline) + vanilla JavaScript (inline)
- Intersection Observer for scroll animations
- Canvas API for neural network animation
- No frameworks, no build tools, no npm install

## Deploy

The portfolio auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

### Custom Domain Setup

To use `victorndunda.com`:

1. **GitHub repo settings** → Settings → Pages → Custom domain → enter `victorndunda.com`
2. **DNS configuration** at your domain registrar:
   ```
   A    @    185.199.108.153
   A    @    185.199.109.153
   A    @    185.199.110.153
   A    @    185.199.111.153
   CNAME www    gadda00.github.io.
   ```
3. Wait for DNS to propagate (5-30 minutes)
4. Enable "Enforce HTTPS" in GitHub Pages settings

## Update

Just edit `index.html` and push to `main`. The workflow handles the rest.

## Contact

- **Email**: victor.ndunda@email.com
- **LinkedIn**: [victor-ndunda](https://www.linkedin.com/in/victor-ndunda)
- **GitHub**: [gadda00](https://github.com/gadda00)
- **Twitter**: [@victor_ndunda](https://twitter.com/victor_ndunda)

---

Built in Nairobi 🇰🇪
