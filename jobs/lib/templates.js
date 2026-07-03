/* =====================================================================
 * templates.js — Resume & cover-letter text templates + variable engine
 * ---------------------------------------------------------------------
 * Pure functions. No DOM, no PDF. They take (profile, job, context) and
 * return plain-text/HTML strings that resume.js and coverletter.js then
 * render to PDF (jsPDF / html2pdf) or pass to Gmail as the email body.
 *
 * Variable engine supports {{var}} and {{#section}}…{{/section}} with
 * simple {{var}} substitution inside sections.
 * ===================================================================== */
(function (global) {
  'use strict';

  // ── Variable substitution ────────────────────────────────────────────
  function fill(template, vars) {
    return template
      .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
        const v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), vars);
        return v == null ? '' : String(v);
      })
      .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
      .trim();
  }

  // ── Resume tailoring ─────────────────────────────────────────────────

  /**
   * Pick the N experience highlights + projects whose keywords best match
   * the job. Used by both the PDF resume and the cover letter.
   */
  function selectRelevant(profile, job, opts) {
    opts = opts || {};
    const maxBullets = opts.maxBullets || 4;
    const maxProjects = opts.maxProjects || 2;

    const JobScorer = global.JobScorer;
    const tokens = new Set([
      ...JobScorer.tokenize(job.title),
      ...JobScorer.tokenize(job.description),
      ...JobScorer.tokenize((job.tags || []).join(' ')),
      ...((job.techStack || []).map(t => t.toLowerCase())),
    ]);

    function scoreText(text) {
      const toks = JobScorer.tokenize(text);
      let s = 0;
      toks.forEach(t => { if (tokens.has(t)) s += 1; });
      return s;
    }

    // Rank experience highlights
    const expRanked = profile.experience.map(e => {
      const bullets = e.highlights.map(h => ({ text: h, score: scoreText(h) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxBullets)
        .map(b => b.text);
      return { ...e, _score: scoreText(e.role + ' ' + e.summary) + bullets.length, _bullets: bullets };
    }).sort((a, b) => b._score - a._score);

    const projectsRanked = profile.projects.map(p => ({
      ...p, _score: scoreText(p.name + ' ' + p.description + ' ' + p.tech.join(' ')),
    })).sort((a, b) => b._score - a._score).slice(0, maxProjects);

    // Rank skills: matched skills first (already weighted), then the rest by tier.
    const skillIndex = JobScorer.buildSkillIndex(profile);
    const matched = new Set();
    tokens.forEach(t => { if (t in skillIndex.index) matched.add(skillIndex.display[t]); });
    const allSkills = Object.values(profile.skills).flat()
      .sort((a, b) => (matched.has(b.name) ? 1 : 0) - (matched.has(a.name) ? 1 : 0) || b.weight - a.weight);

    return { expRanked, projectsRanked, allSkills, matched };
  }

  /** Tailored professional summary that weaves in the job's top matched skills. */
  function tailoredSummary(profile, job, matchedSkills) {
    // Accept Set or Array (selectRelevant returns a Set).
    const arr = matchedSkills instanceof Set ? [...matchedSkills]
              : Array.isArray(matchedSkills) ? matchedSkills : [];
    const top = arr.slice(0, 4).join(', ');
    const role = (job.title || 'the role').toLowerCase();
    if (top) {
      return `${profile.summary} I am particularly interested in ${role} at ${job.company} because it ` +
        `draws directly on my work in ${top}.`;
    }
    return `${profile.summary} I am excited about ${role} at ${job.company} and the chance to ` +
      `apply my engineering experience to your problems.`;
  }

  // ── Plain-text resume (for email body / quick paste) ─────────────────
  function resumePlainText(profile, job, ctx) {
    const rel = selectRelevant(profile, job);
    const summary = tailoredSummary(profile, job, rel.matched);
    const exp = rel.expRanked.map(e =>
      `${e.role} — ${e.company} (${e.period})\n${e.location}\n` +
      e._bullets.map(b => '  • ' + b).join('\n')
    ).join('\n\n');
    const skills = Object.entries(profile.skills).map(([group, list]) =>
      group.toUpperCase() + ': ' + list.map(s => s.name).join(', ')
    ).join('\n');
    const projects = rel.projectsRanked.map(p =>
      `${p.name}\n  ${p.description}\n  Tech: ${p.tech.join(', ')}`
    ).join('\n\n');
    const edu = profile.education.map(e => `${e.degree}, ${e.institution} (${e.period})`).join('\n');

    return [
      `${profile.name}`,
      `${profile.title} · ${profile.location.city}, ${profile.location.country}`,
      `${profile.contact.email} · ${profile.contact.phone} · ${profile.contact.website}`,
      `GitHub: ${profile.contact.github} · LinkedIn: ${profile.contact.linkedin}`,
      ``,
      `PROFESSIONAL SUMMARY`,
      summary,
      ``,
      `CORE SKILLS`,
      skills,
      ``,
      `EXPERIENCE`,
      exp,
      ``,
      `SELECTED PROJECTS`,
      projects,
      ``,
      `EDUCATION`,
      edu,
      ``,
      `CERTIFICATIONS`,
      profile.certifications.join('\n'),
    ].join('\n');
  }

  // ── Cover letter (plain text — also used as Gmail body) ──────────────
  const COVER_TEMPLATE = `{{date}}

{{recipientName}}
{{recipientCompany}}
{{recipientAddress}}

Dear {{hiringManager}},

I am writing to apply for the {{role}} position at {{company}}. {{openingHook}}

What draws me to {{company}} is {{companyHook}}. I am excited by the opportunity to contribute to a team focused on {{teamFocus}}.

In my current work I have delivered results directly relevant to your needs:
{{bodyParagraphs}}

A project that exemplifies my approach is {{relevantProject}} — {{projectDetail}}. {{projectOutcome}}

I would welcome the chance to discuss how my background in {{topSkills}} can help {{company}} {{closeGoal}}. I am available {{availability}} and am {{remoteNote}}.

Thank you for your time and consideration.

Sincerely,
{{name}}
{{title}} · {{location}}
{{email}} · {{phone}} · {{website}}
GitHub: {{github}} · LinkedIn: {{linkedin}}`;

  function coverLetterText(profile, job, ctx) {
    ctx = ctx || {};
    const rel = selectRelevant(profile, job, { maxBullets: 3, maxProjects: 1 });
    const matchedArr = rel.matched instanceof Set ? [...rel.matched] : (rel.matched || []);
    const topSkills = matchedArr.length
      ? matchedArr.slice(0, 4).join(', ')
      : profile.skills.core.slice(0, 4).map(s => s.name).join(', ');
    const firstSkill = topSkills.split(',')[0].trim();

    const lc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
    const bodyParagraphs = rel.expRanked.slice(0, 2).map(e =>
      `  • As ${e.role} at ${e.company}, ${lc(e._bullets[0] || e.summary)}`
    ).join('\n');

    const proj = rel.projectsRanked[0] || profile.projects[0];

    const vars = {
      date: new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
      recipientName: ctx.recipientName || (job.company + ' Hiring Team'),
      recipientCompany: job.company,
      recipientAddress: ctx.recipientAddress || job.location || '',
      hiringManager: ctx.hiringManager || ('Hiring Team at ' + job.company),
      role: job.title,
      company: job.company,
      openingHook: ctx.openingHook ||
        `Your focus on ${topSkills} aligns closely with the work I have been doing in agritech and applied ML.`,
      companyHook: ctx.companyHook ||
        `the chance to ship ${job.remote ? 'remote-first ' : ''}${firstSkill} systems that reach real users`,
      teamFocus: topSkills.split(',').slice(0, 2).map(s => s.trim()).join(' and '),
      bodyParagraphs,
      relevantProject: proj.name,
      projectDetail: String(proj.description || '').replace(/\.$/, ''),
      projectOutcome: proj.highlights ? String(proj.highlights[0]).replace(/\.$/, '') : '',
      topSkills,
      closeGoal: ctx.closeGoal || 'build reliable, user-facing ML',
      availability: /immediate/i.test(profile.preferences.availability)
        ? 'immediately'
        : profile.preferences.availability.toLowerCase(),
      remoteNote: profile.preferences.remoteEligible && job.remote
        ? 'happy to work remotely across time zones'
        : (profile.preferences.remoteEligible ? 'open to remote or onsite' : 'based in ' + profile.location.city),
      name: profile.name,
      title: profile.title,
      location: profile.location.city + ', ' + profile.location.country,
      email: profile.contact.email,
      phone: profile.contact.phone,
      website: profile.contact.website,
      github: profile.contact.github,
      linkedin: profile.contact.linkedin,
    };

    return fill(COVER_TEMPLATE, vars);
  }

  // ── Cover letter HTML (for html2pdf rendering) ───────────────────────
  function coverLetterHTML(profile, job, ctx) {
    const text = coverLetterText(profile, job, ctx);
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
    const paras = text.split(/\n\n+/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');
    return `
<div class="cl-page">
  <header class="cl-header">
    <h1>${esc(profile.name)}</h1>
    <p class="cl-sub">${esc(profile.title)} · ${esc(profile.location.city)}, ${esc(profile.location.country)}</p>
    <p class="cl-contact">${esc(profile.contact.email)} · ${esc(profile.contact.phone)} · ${esc(profile.contact.website)}</p>
  </header>
  <hr/>
  <div class="cl-body">
    ${paras}
  </div>
</div>`;
  }

  global.Templates = {
    fill,
    selectRelevant,
    tailoredSummary,
    resumePlainText,
    coverLetterText,
    coverLetterHTML,
  };
})(window);
