/* =====================================================================
 * coverletter.js — Tailored cover-letter PDF + plain-text generator
 * ---------------------------------------------------------------------
 * PDF path: html2pdf.js (wraps jsPDF + html2canvas) so we can use a
 * nicely styled HTML template. Plain-text path returns the same letter
 * as a string for the Gmail body / quick paste.
 *
 * html2pdf loaded via CDN in index.html: window.html2pdf
 * ===================================================================== */
(function (global) {
  'use strict';

  const PRINT_CSS = `
  .cl-page { font-family: 'Inter', 'Helvetica', Arial, sans-serif; color:#1f2937;
             padding: 0; width: 100%; }
  .cl-header { text-align: center; margin-bottom: 6px; }
  .cl-header h1 { font-size: 22px; margin: 0; color:#0f172a; letter-spacing: 0.5px; }
  .cl-sub { font-size: 11px; color:#475569; margin: 2px 0; }
  .cl-contact { font-size: 9.5px; color:#64748b; margin: 0; }
  .cl-page hr { border: none; border-top: 1px solid #cbd5e1; margin: 8px 0 14px; }
  .cl-body p { font-size: 10.5px; line-height: 1.5; margin: 0 0 9px; text-align: justify; }
  .cl-body p:first-child { white-space: pre-line; }
  @page { size: A4; margin: 18mm 16mm; }
  `;

  /** Plain-text cover letter (same content the PDF shows). */
  function text(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    return global.Templates.coverLetterText(profile, job, ctx);
  }

  /** HTML cover letter (styled, for html2pdf). */
  function html(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    return global.Templates.coverLetterHTML(profile, job, ctx);
  }

  // Lazy-load html2pdf from CDN on first use
  function loadHtml2PDF() {
    if (typeof global.html2pdf === 'function') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load html2pdf from CDN'));
      document.head.appendChild(s);
    });
  }

  /** Render the cover letter to a PDF download via html2pdf. */
  async function downloadPDF(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    await loadHtml2PDF();
    if (typeof global.html2pdf !== 'function') {
      throw new Error('html2pdf failed to load');
    }
    const htmlStr = html(job, profile, ctx);

    // Build an off-screen container so we don't disturb the page.
    const holder = document.createElement('div');
    holder.style.position = 'fixed';
    holder.style.left = '-9999px';
    holder.style.top = '0';
    holder.style.width = '210mm';
    holder.innerHTML = `<style>${PRINT_CSS}</style>` + htmlStr;
    document.body.appendChild(holder);

    const safe = (job.company || 'company').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const filename = `Cover Letter - ${profile.name} - ${job.title} @ ${safe}.pdf`;

    const opt = {
      margin: [18, 16, 18, 16],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    return global.html2pdf().set(opt).from(holder).save().then(() => {
      document.body.removeChild(holder);
      return { filename, text: text(job, profile, ctx) };
    });
  }

  /** Open a print-preview window (fallback if html2pdf unavailable). */
  function printPreview(job, profile, ctx) {
    profile = profile || global.VICTOR_PROFILE;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Cover Letter — ${job.title} @ ${job.company}</title>
      <style>${PRINT_CSS} body{padding:18mm 16mm;}</style>
      </head><body>${html(job, profile, ctx)}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  global.CoverLetter = { text, html, downloadPDF, printPreview };
})(window);
