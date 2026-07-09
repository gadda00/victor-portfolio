/* =====================================================================
 * gmail.js — Gmail compose URL builder + one-click apply flow
 * ---------------------------------------------------------------------
 * Builds the canonical Gmail compose URL:
 *   https://mail.google.com/mail/?view=cm&fs=1&to=EMAIL&su=SUBJECT&body=BODY
 *
 * The Gmail compose web UI caps the body at ~ 2000 chars reliably (the
 * URL length limit is the constraint). For longer bodies we still send
 * it; Gmail will truncate. We therefore keep the cover letter concise.
 *
 * We also support a "mailto:" fallback for users not signed into Gmail.
 * ===================================================================== */
(function (global) {
  'use strict';

  const BASE = 'https://mail.google.com/mail/?view=cm&fs=1';

  function buildSubject(job, profile) {
    profile = profile || global.VICTOR_PROFILE;
    return `Application: ${job.title} — ${profile.name}`;
  }

  function buildBody(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    const Templates = global.Templates;
    const letter = Templates.coverLetterText(profile, job, ctx);
    // Attach a short "resume attached" note + contact block.
    const resumeNote =
      `\n\n—\nAttached: my tailored resume (PDF). ` +
      `Portfolio: ${profile.contact.website} · GitHub: ${profile.contact.github} · LinkedIn: ${profile.contact.linkedin}`;
    return letter + resumeNote;
  }

  /** Build the full Gmail compose URL. */
  function composeURL(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    const to = job.applyEmail || '';
    const su = buildSubject(job, profile);
    const body = buildBody(job, profile, ctx);
    return `${BASE}&to=${encodeURIComponent(to)}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;
  }

  /** Build a mailto: URL (fallback). */
  function mailtoURL(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    const to = job.applyEmail || '';
    const su = buildSubject(job, profile);
    const body = buildBody(job, profile, ctx);
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;
  }

  /** Open Gmail compose in a new tab. Returns the URL used. */
  function openCompose(job, profile, ctx) {
    const url = composeURL(job, profile, ctx);
    global.open(url, '_blank', 'noopener,noreferrer');
    return url;
  }

  /**
   * Full "Apply via Email" flow:
   *   1. Record the application (status: applied) via storage
   *   2. Optionally trigger resume PDF download (async — doesn't block Gmail)
   *   3. Open Gmail compose prefilled
   * Returns a small result object.
   */
  function applyViaEmail(job, opts) {
    opts = opts || {};
    const profile = opts.profile || global.VICTOR_PROFILE;
    const downloadResume = opts.downloadResume !== false; // default true

    // 1. Track
    if (global.JobStorage) {
      global.JobStorage.saveApplication({
        jobId: job.id,
        job,
        status: 'applied',
        channel: 'email',
        appliedAt: new Date().toISOString(),
        to: job.applyEmail,
      });
    }

    // 2. Resume PDF (best-effort, non-blocking — fire and forget)
    if (downloadResume && global.ResumeGen) {
      global.ResumeGen.generate(job, profile).catch(e => console.warn('resume gen failed', e));
    }

    // 3. Gmail compose
    const url = openCompose(job, profile, opts.ctx);
    return { ok: true, url, tracked: !!global.JobStorage };
  }

  global.GmailApply = { composeURL, mailtoURL, openCompose, applyViaEmail, buildSubject, buildBody };
})(window);
