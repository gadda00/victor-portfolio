/* =====================================================================
 * resume.js — Tailored resume PDF generator (jsPDF, client-side, vector text)
 * ---------------------------------------------------------------------
 * Uses jsPDF's programmatic text API (not html2canvas) so the resulting
 * PDF has selectable/searchable text and a tiny file size — what a real
 * ATS-friendly resume should be.
 *
 * jsPDF is loaded via CDN in index.html: window.jspdf.jsPDF
 * ===================================================================== */
(function (global) {
  'use strict';

  const MM = 210;   // A4 width
  const PAGE_H = 297;
  const M = 15;     // margin
  const CW = MM - M * 2;

  function getJsPDF() {
    const j = global.jspdf || (global.jsPDF ? { jsPDF: global.jsPDF } : null);
    if (!j || !j.jsPDF) throw new Error('jsPDF not loaded. Include the CDN script.');
    return j.jsPDF;
  }

  // Lazy-load jsPDF from CDN on first use
  function loadJsPDF() {
    if (global.jspdf || global.jsPDF) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
      document.head.appendChild(s);
    });
  }

  function buildDoc() {
    const JsPDF = getJsPDF();
    return new JsPDF({ unit: 'mm', format: 'a4' });
  }

  function ResumeBuilder(doc) {
    let y = M;

    function ensure(space) {
      if (y + space > PAGE_H - M) { doc.addPage(); y = M; }
    }

    function heading(text) {
      ensure(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 30, 60);
      doc.text(text, M, y);
      y += 4;
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.3);
      doc.line(M, y, M + CW, y);
      y += 5;
    }

    function para(text, opts) {
      opts = opts || {};
      doc.setFont('helvetica', opts.style || 'normal');
      doc.setFontSize(opts.size || 9.5);
      doc.setTextColor(opts.color || 40);
      const lines = doc.splitTextToSize(text, CW - (opts.indent || 0));
      lines.forEach(line => {
        ensure(5);
        doc.text(line, M + (opts.indent || 0), y);
        y += 4.4;
      });
    }

    function bullet(text) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40);
      const lines = doc.splitTextToSize('• ' + text, CW - 4);
      lines.forEach((line, i) => {
        ensure(5);
        doc.text(line, i === 0 ? M : M + 4, y);
        y += 4.4;
      });
    }

    function gap(mm) { y += (mm || 3); }

    return { heading, para, bullet, gap, ensure, getY: () => y };
  }

  /**
   * Generate a tailored resume PDF for `job` and trigger a download.
   * @param {object} job      Normalised job object.
   * @param {object} profile  Victor's profile (defaults to window.VICTOR_PROFILE).
   * @returns {Promise<object>} the doc + the tailored text blob (for debugging/preview).
   */
  async function generate(job, profile) {
    profile = profile || global.VICTOR_PROFILE;
    const Templates = global.Templates;
    if (!Templates) throw new Error('templates.js required');

    // Lazy-load jsPDF on first use
    await loadJsPDF();

    const rel = Templates.selectRelevant(profile, job, { maxBullets: 4, maxProjects: 2 });
    const summary = Templates.tailoredSummary(profile, job, rel.matched);

    const doc = buildDoc();
    const b = ResumeBuilder(doc);

    // ── Header ─────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(profile.name, M, M + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(
      `${profile.title} · ${profile.location.city}, ${profile.location.country}`,
      M, M + 11
    );
    doc.setFontSize(8.5);
    doc.setTextColor(110);
    const contactLine = `${profile.contact.email} · ${profile.contact.phone} · ${profile.contact.website}`;
    doc.text(contactLine, M, M + 15);
    const linksLine = `GitHub: ${profile.contact.github} · LinkedIn: ${profile.contact.linkedin}`;
    doc.text(doc.splitTextToSize(linksLine, CW), M, M + 18.5);

    b.gap(8);
    doc.setDrawColor(180, 190, 210);
    doc.setLineWidth(0.3);
    doc.line(M, b.getY(), M + CW, b.getY());
    b.gap(4);

    // ── Tailored for {role} @ {company} ────────────────────────────────
    b.para(`Tailored for: ${job.title} — ${job.company}`, { style: 'italic', color: 90, size: 8.5 });
    b.gap(2);

    // ── Summary ────────────────────────────────────────────────────────
    b.heading('PROFESSIONAL SUMMARY');
    b.para(summary);
    b.gap(2);

    // ── Skills (matched first) ─────────────────────────────────────────
    b.heading('CORE SKILLS');
    Object.entries(profile.skills).forEach(([group, list]) => {
      const ordered = list.slice().sort((a, c) =>
        (rel.matched.has(b_name(a)) ? 1 : 0) - (rel.matched.has(b_name(c)) ? 1 : 0) || c.weight - a.weight
      );
      const names = ordered.map(s => rel.matched.has(s.name) ? `${s.name}*` : s.name).join(', ');
      b.para(`${group.toUpperCase()}: ${names}`, { size: 9 });
    });
    b.para('* = directly relevant to this role', { size: 7.5, color: 130, style: 'italic' });
    b.gap(2);

    // ── Experience ─────────────────────────────────────────────────────
    b.heading('EXPERIENCE');
    rel.expRanked.forEach(e => {
      b.para(`${e.role} — ${e.company}`, { style: 'bold', size: 10 });
      b.para(`${e.location} · ${e.period}`, { size: 8.5, color: 110 });
      e._bullets.forEach(bl => b.bullet(bl));
      b.gap(2);
    });

    // ── Projects ───────────────────────────────────────────────────────
    b.heading('SELECTED PROJECTS');
    rel.projectsRanked.forEach(p => {
      b.para(`${p.name}`, { style: 'bold', size: 10 });
      b.para(`${p.description}`, { size: 9 });
      b.para(`Tech: ${p.tech.join(', ')}${p.url ? ' · ' + p.url : ''}`, { size: 8.5, color: 110 });
      b.gap(1);
    });

    // ── Education + Certs ──────────────────────────────────────────────
    b.heading('EDUCATION');
    profile.education.forEach(e => {
      b.para(`${e.degree}, ${e.institution} (${e.period})`, { style: 'bold', size: 9.5 });
      if (e.details) b.para(e.details, { size: 9 });
    });
    b.gap(2);
    b.heading('CERTIFICATIONS');
    profile.certifications.forEach(c => b.bullet(c));

    // ── Save ───────────────────────────────────────────────────────────
    const safe = (job.company || 'company').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const fname = `Resume - ${profile.name} - ${job.title} @ ${safe}.pdf`;
    doc.save(fname);
    return { doc, summary };
  }

  function b_name(s) { return s.name; }

  global.ResumeGen = { generate };
})(window);
