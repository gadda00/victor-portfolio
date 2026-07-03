/* =====================================================================
 * scoring.js — Job-vs-Profile scoring + skill-gap analysis
 * ---------------------------------------------------------------------
 * Scores any normalised job against window.VICTOR_PROFILE on a 0–100
 * scale and returns the matched/missing skills so the UI can surface a
 * "why this score" explanation and a skill-gap report.
 *
 * Score breakdown (100 pts):
 *   Skill/keyword match   40 pts
 *   Tech-stack match      20 pts
 *   Location match        15 pts
 *   Remote eligibility    10 pts
 *   Experience-level fit  10 pts
 *   Salary match           5 pts
 * ===================================================================== */
(function (global) {
  'use strict';

  // ── Text utilities ───────────────────────────────────────────────────
  const STOPWORDS = new Set([
    'the','and','for','with','you','our','we','are','will','this','that','from','your',
    'have','has','a','an','to','of','in','on','at','as','is','be','or','by','it','their',
    'they','all','who','can','must','should','strong','experience','years','year','plus',
    'work','working','role','team','company','across','etc','into','using','use','including',
    'ability','good','excellent','able','well','any','new','one','two','three','four','five',
  ]);

  function tokenize(text) {
    if (!text) return [];
    return String(text)
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')          // strip HTML
      .replace(/[^a-z0-9+#.]+/g, ' ')    // keep letters, digits, c++, c#, .net
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOPWORDS.has(t));
  }

  function unique(arr) { return [...new Set(arr)]; }

  // Build a flat map of profile skills -> weight, including aliases.
  // Returns { skillLower: weight } and the ordered list for display.
  function buildSkillIndex(profile) {
    const index = {};        // lowercased skill/alias -> weight
    const display = {};      // lowercased -> canonical display name
    Object.values(profile.skills).forEach(group => {
      group.forEach(s => {
        const names = [s.name, ...(s.aliases || [])].map(n => n.toLowerCase());
        names.forEach(n => {
          if (!(n in index) || s.weight > index[n]) {
            index[n] = s.weight;
            display[n] = s.name;
          }
        });
      });
    });
    return { index, display };
  }

  // ── Score components ─────────────────────────────────────────────────

  function scoreSkills(job, skillIndex) {
    // Build the job's keyword set from title + description + tags.
    const jobTokens = unique([
      ...tokenize(job.title),
      ...tokenize(job.description),
      ...tokenize((job.tags || []).join(' ')),
    ]);
    const jobTokenSet = new Set(jobTokens);

    // Which profile skills appear in the job? Weight by tier.
    // Dedupe by canonical DISPLAY name so aliases (e.g. "ML" + "Machine Learning")
    // don't double-count the same skill.
    let matchedWeight = 0;
    const matched = [];
    const seenDisplay = new Set();
    const contributions = {}; // display -> best weight seen
    Object.entries(skillIndex.index).forEach(([skill, weight]) => {
      // match either as a standalone token or as a substring within a token
      // (e.g. "tensorflow" inside "tensorflow-lite" already tokenised)
      const hit = jobTokenSet.has(skill) ||
        jobTokens.some(t => (t.includes(skill) || (skill.includes(t) && t.length > 3)));
      if (!hit) return;
      const display = skillIndex.display[skill];
      if (!contributions[display] || weight > contributions[display]) {
        contributions[display] = weight;
      }
    });
    Object.entries(contributions).forEach(([display, weight]) => {
      if (!seenDisplay.has(display)) {
        seenDisplay.add(display);
        matchedWeight += weight;
        matched.push({ skill: display, weight });
      }
    });

    // Reference: a job that matches ~12 weight-points of core skills is "full".
    // Scale to 40 pts, cap at 40.
    const REFERENCE = 12;
    const pts = Math.min(40, Math.round((matchedWeight / REFERENCE) * 40));
    matched.sort((a, b) => b.weight - a.weight);
    return { pts, matched };
  }

  function scoreTechStack(job, skillIndex) {
    const stack = job.techStack || [];
    if (!stack.length) return { pts: 10, matched: [], missing: [] }; // unknown -> neutral
    const matched = [];
    const missing = [];
    stack.forEach(t => {
      const tlow = t.toLowerCase();
      if (tlow in skillIndex.index) matched.push(t);
      else missing.push(t);
    });
    const ratio = matched.length / stack.length;
    return { pts: Math.round(ratio * 20), matched, missing };
  }

  function scoreLocation(job, profile) {
    const ploc = profile.location;
    const jloc = (job.location || '').toLowerCase();
    const sameCity = jloc.includes(ploc.city.toLowerCase());
    const sameCountry = jloc.includes(ploc.country.toLowerCase()) || jloc.includes('kenya');
    const africa = /africa|remote.*africa|nigeria|uganda|tanzania|ghana|south africa|egypt/.test(jloc);
    const remote = job.remote === true || /remote/.test(jloc);

    if (sameCity && !remote) return { pts: 15, reason: 'Same city (Nairobi)' };
    if (remote && profile.preferences.remoteEligible) return { pts: 13, reason: 'Remote + you accept remote' };
    if (sameCity) return { pts: 15, reason: 'Same city (Nairobi)' };
    if (sameCountry) return { pts: 10, reason: 'Same country (Kenya)' };
    if (africa && remote) return { pts: 8, reason: 'Africa-remote' };
    if (remote) return { pts: 7, reason: 'Global remote' };
    if (profile.preferences.willingToRelocate) return { pts: 6, reason: 'Relocation accepted' };
    return { pts: 3, reason: 'Relocation required (you opted out)' };
  }

  function scoreRemote(job, profile) {
    if (job.remote) {
      return profile.preferences.remoteEligible
        ? { pts: 10, reason: 'Remote role — eligible' }
        : { pts: 0, reason: 'Remote role — you opted out of remote' };
    }
    // Onsite
    const jloc = (job.location || '').toLowerCase();
    return jloc.includes(profile.location.city.toLowerCase())
      ? { pts: 10, reason: 'Onsite in your city' }
      : { pts: 2, reason: 'Onsite elsewhere' };
  }

  function scoreExperience(job, profile) {
    const req = job.experienceYears;
    const have = profile.preferences.yearsExperience;
    if (!req) return { pts: 5, reason: 'Experience not specified' };
    if (have >= req) return { pts: 10, reason: `You have ${have}y vs ${req}y required` };
    const ratio = have / req;
    return { pts: Math.round(ratio * 10), reason: `You have ${have}y vs ${req}y required (junior)` };
  }

  function scoreSalary(job, profile) {
    const exp = profile.preferences.salaryExpectation;
    if (!job.salaryMin && !job.salaryMax) return { pts: 3, reason: 'Salary undisclosed' };
    const top = job.salaryMax || job.salaryMin;
    const floor = job.salaryMin || 0;
    if (top >= exp.targetAnnualUSD) return { pts: 5, reason: `Top ${top}k ≥ target ${exp.targetAnnualUSD}k` };
    if (top >= exp.minAnnualUSD) return { pts: 4, reason: `Top ${top}k ≥ floor ${exp.minAnnualUSD}k` };
    if (floor > 0 && floor < exp.minAnnualUSD * 0.6) return { pts: 1, reason: 'Below your floor' };
    return { pts: 2, reason: 'Below target' };
  }

  // ── Main entry ───────────────────────────────────────────────────────
  function scoreJob(job, profile) {
    profile = profile || global.VICTOR_PROFILE;
    if (!profile) throw new Error('VICTOR_PROFILE not loaded');

    const skillIndex = buildSkillIndex(profile);
    const skills = scoreSkills(job, skillIndex);
    const tech = scoreTechStack(job, skillIndex);
    const loc = scoreLocation(job, profile);
    const rem = scoreRemote(job, profile);
    const exp = scoreExperience(job, profile);
    const sal = scoreSalary(job, profile);

    const total = Math.max(0, Math.min(100,
      skills.pts + tech.pts + loc.pts + rem.pts + exp.pts + sal.pts
    ));

    // Skill gap = tech-stack items Victor doesn't have + notable job tokens
    // that look like skills but aren't in his profile.
    const missing = tech.missing.slice();

    const label =
      total >= 80 ? 'Excellent' :
      total >= 65 ? 'Strong' :
      total >= 50 ? 'Good' :
      total >= 35 ? 'Weak' : 'Poor';

    return {
      total,
      label,
      breakdown: {
        skills: skills.pts,
        tech: tech.pts,
        location: loc.pts,
        remote: rem.pts,
        experience: exp.pts,
        salary: sal.pts,
      },
      reasons: [loc.reason, rem.reason, exp.reason, sal.reason].filter(Boolean),
      matchedSkills: skills.matched.map(m => m.skill),
      matchedTech: tech.matched,
      missingSkills: unique(missing),
      weight: total, // alias for sorting
    };
  }

  /** Score + sort an array of jobs; returns [{job, score}]. */
  function rankJobs(jobs, profile) {
    return jobs
      .map(job => ({ job, score: scoreJob(job, profile) }))
      .sort((a, b) => b.score.total - a.score.total);
  }

  global.JobScorer = { scoreJob, rankJobs, tokenize, buildSkillIndex };
})(window);
