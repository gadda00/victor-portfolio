# Verxlite — Improvement Posts (alternate angles & repurposing)

Alternate angles that didn't make the main calendar but are worth posting if engagement is low or you want to repost later in the month.

---

## A. The "AI workflow agents are the new CRUD apps" angle

> In 2015 every founder built a CRUD app.
> In 2020 every founder built a RAG chatbot.
> In 2026 every founder is building an AI workflow agent.
>
> The pattern is the same: ingest → reason → act → persist.
>
> Verxlite is my take. The difference: it's not a chatbot. It's a *trigger-based* agent. A meeting ends → a workflow runs → 6 steps execute → artifacts land in the CRM.
>
> No "hi, how can I help you?" Just work done.
>
> [link]

---

## B. The "I shipped a 281-defect code review and here's what broke" angle

> 4 things the 10-person review caught that I would have shipped to production:
>
> 1. **Hardcoded `tenant_id="test-tenant-id"` on every route.** Every user saw every tenant's data.
> 2. **The Celery worker was commented out.** Workflow runs sat in PENDING forever.
> 3. **`Fernet("default-secret-key".encode())` crashed on first encrypt.** The default key wasn't a valid Fernet key.
> 4. **Every router declared `prefix="/auth"` AND `main.include_router(prefix="/auth")`.** All routes were double-prefixed: `/auth/auth/register`.
>
> The review doc: [link]

---

## C. The "what I'd do differently" angle

> 3 things I'd do differently if I rebuilt Verxlite:
>
> 1. **Start with the worker, not the API.** The API is the easy part. The worker (Celery + retry + idempotency + observability) is where the real engineering is.
> 2. **Use Temporal instead of Celery.** Celery is fine, but Temporal's durability and replay would have saved us 2 weeks of "what if the worker crashes mid-step?".
> 3. **Type the frontend API client from day one.** We hand-wrote fetch calls for 3 weeks, then rewrote everything around a typed client. Do it first.

---

## D. The "for founders" angle (LinkedIn pulse article)

> **How to ship a multi-tenant SaaS in one week (without it being a toy)**
>
> Most "ship fast" advice produces toys. Real multi-tenant SaaS needs:
> - Auth (JWT + refresh + role-based access)
> - Multi-tenancy (every query scoped to `tenant_id`)
> - Background jobs (Celery + Redis + retry + idempotency)
> - Observability (Prometheus + tracing + structured logs)
> - Encryption (OAuth tokens at rest)
>
> Verxlite ships with all of it. Here's the architecture + the 7-day timeline.
>
> [link]

---

## E. Repurpose for dev.to / Hacker News

- **Wednesday's technical deep-dive** → dev.to article: "Threading step outputs in a Python workflow engine"
- **Thursday's code review post** → Hacker News Show post: "Show HN: I shipped a 281-defect code review with my launch"
- **Friday's OAuth post** → dev.to article: "The 3 OAuth gotchas I hit building Verxlite"

---

## F. Short-form video scripts (TikTok / YouTube Shorts / Reels)

### 60-second script: "The 12-minute tax"

> (Hook) Every sales meeting costs you 12 minutes of admin work.
> (Setup) CRM notes, follow-up email, task creation, activity log.
> (Math) 5 meetings a day × 5 days = 5–7.5 hours a week per rep. A 10-person team burns 75 hours a week on copy-paste.
> (Reveal) Verxlite automates all of it in one trigger.
> (CTA) Link in bio. github.com/gadda00/verxlite.

### 60-second script: "281 bugs"

> (Hook) I shipped a code review with 281 bugs in it.
> (Setup) 37 critical. The app didn't boot. The frontend didn't build.
> (Twist) Then I fixed all of them. In one week.
> (Lesson) Honesty wins. The review post outperformed everything else 3:1.
> (CTA) github.com/gadda00/verxlite — read the review doc yourself.
