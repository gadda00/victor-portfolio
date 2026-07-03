# Job Portal Automation — Victor Ndunda

A smart job application portal built into [victorndunda.com/jobs/](https://victorndunda.com/jobs/) with these features:

## Features

### 1. Job-Applied Tracking
- When you click "Apply", the job **disappears from the open list** and moves to "Applied History"
- Status pipeline: `saved → applied → interview → offer → rejected → ghosted`
- All data persists in `localStorage` (no backend)
- Export/Import backup as JSON

### 2. Tailored Resume PDF (per job)
- One click generates a **customized resume PDF** highlighting the skills/experience most relevant to that specific job
- Uses keyword matching to **re-rank your experience bullets** and skills section
- Matched skills are starred with `*` and listed first
- ATS-friendly vector text (selectable, searchable)
- Generated client-side via [jsPDF](https://github.com/parallax/jsPDF) (lazy-loaded from CDN)

### 3. Tailored Cover Letter PDF (per job)
- One click generates a **customized cover letter PDF** with:
  - Auto-populated recipient, role, company
  - Opening hook based on top matched skills
  - 2 most relevant experience paragraphs (auto-selected)
  - Most relevant project showcase
  - Availability + remote-eligibility note
- Same content also available as plain text (used by Gmail compose)
- Generated client-side via [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) (lazy-loaded)

### 4. Gmail Compose Integration
- For jobs with an email apply address (auto-detected from description):
  - Click "Apply via Email" → opens Gmail compose in a new tab
  - **Subject**: `Application: {job title} — Victor Ndunda`
  - **Body**: The full tailored cover letter + resume-attached note + portfolio links
  - **To**: The detected application email
- Also triggers resume PDF download in the background
- Marks the job as "applied" → it disappears from open list
- Fallback: `mailto:` URL for users not signed into Gmail

### 5. AI-Powered Job Scoring (0–100)
Every job is scored against Victor's profile:
- **Skills match** (40 pts) — keyword overlap with weighted skills
- **Tech stack** (20 pts) — exact set intersection
- **Location** (15 pts) — same city > remote > same country > Africa-remote > global remote
- **Remote eligibility** (10 pts)
- **Experience level** (10 pts)
- **Salary** (5 pts)

Labels: 80+ Excellent · 65+ Strong · 50+ Good · 35+ Weak · <35 Poor

Click "Why this score" on any card to see the breakdown.

### 6. Skill Gap Analysis
Each card shows:
- **You match:** green tags for skills Victor has that the job needs
- **Skill gaps:** red tags for tech-stack items Victor doesn't have

### 7. Interview Prep Notes (per job)
Click "Notes" on any card to open a modal with:
- Auto-generated prep checklist based on matched skills
- Company research section
- Questions to ask
- Salary range field
- Free-form notes
- Auto-saved to localStorage

### 8. Smart Filters
- **Search** — full-text across title, company, tags, description
- **All / Remote / Onsite / Email Apply** — quick filters
- **Min Score** — only show 50+ / 65+ / 80+ matches

### 9. Application Status Pipeline
In "Applied History" view, each application has a status dropdown:
- Saved → Applied → Interview → Offer → Rejected → Ghosted
- Stats bar shows counts: total, applied, interview, offers, rejected

### 10. Backup / Restore
- **Export** — download all your applications, notes, dismissed jobs, reminders as JSON
- **Import** — restore from a backup file

## File Structure

```
jobs/
├── index.html              # Main portal (auth + UI + bootstrap loader)
└── lib/
    ├── profile.js          # Victor's master profile (single source of truth)
    ├── storage.js          # localStorage wrapper + pub/sub
    ├── scoring.js          # Job-vs-profile scoring (0-100)
    ├── templates.js        # Resume + cover letter text templates
    ├── resume.js           # PDF generator (jsPDF, lazy-loaded)
    ├── coverletter.js      # PDF generator (html2pdf, lazy-loaded)
    ├── gmail.js            # Gmail compose URL builder + apply flow
    ├── tracking.js         # Application pipeline (status flow)
    └── app.js              # Main controller (renders UI, wires events)
```

## How It Works

1. **Page loads** → auth check (Google OAuth or password fallback)
2. **Jobs fetched** from Arbeitnow + RemoteOK APIs (live, no API key)
3. **Jobs normalized** — add stable IDs, extract email/salary/tech stack
4. **Profile loaded** from `lib/profile.js`
5. **Each job scored** against Victor's profile (0–100)
6. **Open jobs rendered** ranked by score (best first)
7. **User clicks "Apply"**:
   - Job marked as applied → disappears from open list
   - Appears in "Applied History" with status dropdown
   - For email applies: Gmail compose opens + resume PDF downloads

## Customization

### Update Victor's Profile
Edit `lib/profile.js` — single source of truth for:
- Contact info, location, preferences
- Skills (grouped + weighted, with aliases)
- Experience highlights (re-ranked per job)
- Projects (re-ranked per job)
- Education, certifications

### Regenerate Fallback Password
```bash
python3 /home/z/my-project/scripts/generate_admin_credentials.py
# Paste the new salt/hash into jobs/index.html FALLBACK_AUTH
```

## Privacy

- **No tracking** — all data stays in your browser's localStorage
- **No third-party analytics**
- **No server-side storage** — your application history is private to this browser
- **CSP-protected** — scripts only load from `self`, Google Accounts, and cdnjs.cloudflare.com
- **`noindex, nofollow, noarchive`** — not indexed by search engines

## Tech Stack

- **Vanilla JS** — no frameworks, no build step
- **jsPDF 2.5.1** (CDN, lazy-loaded) — resume PDF generation
- **html2pdf.js 0.10.1** (CDN, lazy-loaded) — cover letter PDF generation
- **Google Identity Services** — OAuth 2.0 authentication
- **Web Crypto API** — PBKDF2 password fallback auth
- **localStorage** — application tracking, notes, dismissed jobs
- **Arbeitnow + RemoteOK APIs** — live job aggregation (free, no API key)

## Future Enhancements (not yet implemented)

- **Browser extension** for cross-origin form auto-fill (Greenhouse, Lever, Workday)
- **GitHub Action** for daily email alerts on new high-score jobs
- **Resume A/B testing** — generate 2 variants, track which gets more responses
- **LinkedIn Easy Apply automation** (requires LinkedIn API access)
- **Salary benchmarking** against glassdoor/levels.fyi data
- **Interview calendar integration** (Google Calendar API)
