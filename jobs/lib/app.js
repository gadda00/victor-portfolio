/* =====================================================================
 * app.js — Main controller: wires storage + scoring + generators + UI
 * ---------------------------------------------------------------------
 * Renders the open-jobs list (ranked by score), the applied-history
 * pipeline, and wires the Apply / Resume / Cover-letter / Gmail buttons.
 *
 * Uses SAMPLE_JOBS for offline demo. To use live API jobs instead, set
 * window.PORTAL_JOBS before app.js loads (the real /jobs/ page already
 * builds an `allJobs` array from Arbeitnow + RemoteOK — see README).
 * ===================================================================== */
(function (global) {
  'use strict';

  const state = {
    jobs: [],
    view: 'open',          // 'open' | 'history'
    search: '',
    minScore: 0,
    filter: 'all',         // 'all' | 'remote' | 'onsite' | 'email'
    source: '',            // '' | 'arbeitnow' | 'remoteok' | 'remotive' | 'jobicy' | 'himalayas'
    searchDebounce: null,
  };

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    state.jobs = global.PORTAL_JOBS || global.SAMPLE_JOBS || [];
    bindControls();
    render();
    // Re-render when storage changes elsewhere
    global.JobStorage.on(global.JobStorage.KEYS.applications, render);
    global.JobStorage.on(global.JobStorage.KEYS.dismissed, render);
  }

  // ── Rendering ────────────────────────────────────────────────────────
  function rankedOpenJobs() {
    const { open } = global.Tracking.partition(state.jobs);
    return global.JobScorer.rankJobs(open, global.VICTOR_PROFILE)
      .map(r => ({ ...r.job, _score: r.score }));
  }

  function applyFilters(list) {
    return list.filter(j => {
      if (state.filter === 'remote' && !j.remote) return false;
      if (state.filter === 'onsite' && j.remote) return false;
      if (state.filter === 'email' && !j.applyEmail) return false;
      if (state.source && j.source !== state.source) return false;
      if (state.minScore && (j._score ? j._score.total : 0) < state.minScore) return false;
      if (state.search) {
        const t = (j.title + ' ' + j.company + ' ' + (j.tags || []).join(' ') + ' ' + j.description).toLowerCase();
        if (!t.includes(state.search.toLowerCase())) return false;
      }
      return true;
    });
  }

  // ── Source stats ─────────────────────────────────────────────────────
  function renderSourceStats() {
    const el = document.getElementById('sourceStats');
    if (!el) return;
    const counts = {};
    state.jobs.forEach(j => { counts[j.source] = (counts[j.source] || 0) + 1; });
    const sources = ['arbeitnow', 'remoteok', 'remotive', 'jobicy', 'himalayas'];
    el.innerHTML = sources.map(s => {
      const c = counts[s] || 0;
      if (c === 0) return '';
      return '<button class="source-pill' + (state.source === s ? ' active' : '') + '" data-source="' + s + '">' +
             s.charAt(0).toUpperCase() + s.slice(1) + ' <span class="count">' + c + '</span></button>';
    }).join('') + (state.source ? '<button class="source-pill" data-source="">Clear filter</button>' : '');

    el.querySelectorAll('[data-source]').forEach(b => {
      b.addEventListener('click', () => {
        state.source = b.dataset.source;
        // Sync the select dropdown
        const sel = document.getElementById('sourceFilter');
        if (sel) sel.value = state.source;
        render();
      });
    });
  }

  function scoreBadge(score) {
    const cls =
      score.total >= 80 ? 'excellent' :
      score.total >= 65 ? 'strong' :
      score.total >= 50 ? 'good' :
      score.total >= 35 ? 'weak' : 'poor';
    return `<span class="score ${cls}" title="${score.reasons.join(' · ')}">${score.total} · ${score.label}</span>`;
  }

  function jobCardHTML(j) {
    const score = j._score || global.JobScorer.scoreJob(j, global.VICTOR_PROFILE);
    const daysAgo = Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000);
    const tags = (j.tags || []).slice(0, 6).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const matched = (score.matchedSkills || []).slice(0, 5)
      .map(s => `<span class="tag matched">${esc(s)}</span>`).join('');
    const missing = (score.missingSkills || []).slice(0, 4)
      .map(s => `<span class="tag missing" title="Skill gap">${esc(s)}</span>`).join('');
    const emailBtn = j.applyEmail
      ? `<button class="btn primary" data-act="apply-email" data-id="${esc(j.id)}">Apply via Email →</button>`
      : `<a class="btn primary" data-act="apply-link" data-id="${esc(j.id)}" href="${esc(j.url || '#')}" target="_blank" rel="noopener noreferrer">Apply →</a>`;

    return `<article class="card">
      <div class="card-head">
        <div>
          <div class="title">${esc(j.title)}<span class="job-source-badge ${esc(j.source || '')}">${esc(j.source || '')}</span></div>
          <div class="company">${esc(j.company)} · ${esc(j.location || 'Remote')} · ${daysAgo === 0 ? 'today' : daysAgo + 'd ago'}</div>
        </div>
        ${scoreBadge(score)}
      </div>
      <div class="tags">${tags}</div>
      ${matched ? `<div class="matched-row"><span class="lbl">You match:</span> ${matched}</div>` : ''}
      ${missing ? `<div class="matched-row"><span class="lbl">Skill gaps:</span> ${missing}</div>` : ''}
      ${j.salaryMin ? `<div class="salary">💰 ${j.salaryCurrency || 'USD'} ${j.salaryMin}k${j.salaryMax ? '–' + j.salaryMax + 'k' : ''}</div>` : ''}
      <div class="card-actions">
        ${emailBtn}
        <button class="btn ghost" data-act="resume" data-id="${esc(j.id)}" title="Download tailored resume PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Resume PDF
        </button>
        <button class="btn ghost" data-act="cover" data-id="${esc(j.id)}" title="Download tailored cover letter PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Cover Letter
        </button>
        <button class="btn ghost" data-act="notes" data-id="${esc(j.id)}" title="Interview prep notes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Notes
        </button>
        <button class="btn ghost" data-act="dismiss" data-id="${esc(j.id)}" title="Hide this job" aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <details class="why"><summary>Why this score</summary>
        <ul>${score.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      </details>
    </article>`;
  }

  function historyCardHTML(a) {
    const st = global.Tracking.STATUS_BY_ID[a.status] || { label: a.status, color: '#888' };
    const date = new Date(a.appliedAt || a.updatedAt).toLocaleDateString();
    const opts = global.Tracking.STATUSES.map(s =>
      `<option value="${s.id}" ${s.id === a.status ? 'selected' : ''}>${s.label}</option>`
    ).join('');
    return `<article class="card history">
      <div class="card-head">
        <div>
          <div class="title">${esc(a.job.title)}</div>
          <div class="company">${esc(a.job.company)} · applied ${date} via ${esc(a.channel || 'link')}</div>
        </div>
        <span class="status-pill" style="background:${st.color}">${st.label}</span>
      </div>
      <div class="card-actions">
        <select class="status-select" data-act="status" data-id="${esc(a.jobId)}" aria-label="Update application status">${opts}</select>
        <button class="btn ghost" data-act="resume" data-id="${esc(a.jobId)}" data-from-history="1">Resume PDF</button>
        <button class="btn ghost" data-act="cover" data-id="${esc(a.jobId)}" data-from-history="1">Cover Letter</button>
        <button class="btn ghost" data-act="notes" data-id="${esc(a.jobId)}" data-from-history="1">Notes</button>
        ${a.job.applyEmail ? `<button class="btn ghost" data-act="reemail" data-id="${esc(a.jobId)}">Re-open Gmail</button>` : ''}
        <button class="btn danger" data-act="unapply" data-id="${esc(a.jobId)}">Remove</button>
      </div>
    </article>`;
  }

  function render() {
    // Stats bar
    const counts = global.Tracking.counts();
    const statsEl = document.getElementById('stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span>📂 <b>${state.jobs.length}</b> total</span>
        <span>🟢 <b>${counts.applied || 0}</b> applied</span>
        <span>🟣 <b>${counts.interview || 0}</b> interview</span>
        <span>🟢 <b>${counts.offer || 0}</b> offers</span>
        <span>🔴 <b>${counts.rejected || 0}</b> rejected</span>`;
    }
    // Source stats pills
    renderSourceStats();

    if (state.view === 'history') {
      const hist = global.Tracking.history();
      document.getElementById('grid').innerHTML = hist.length
        ? hist.map(historyCardHTML).join('')
        : `<div class="empty">No applications tracked yet. Apply to a job to start your history.</div>`;
      return;
    }

    const list = applyFilters(rankedOpenJobs());
    document.getElementById('grid').innerHTML = list.length
      ? list.map(jobCardHTML).join('')
      : `<div class="empty">No open jobs match your filters.</div>`;
  }

  // ── Event handling (event delegation on the grid) ────────────────────
  function findJob(id, fromHistory) {
    if (fromHistory) {
      const app = global.JobStorage.getApplication(id);
      return app ? app.job : null;
    }
    return state.jobs.find(j => j.id === id);
  }

  function onGridClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const fromHistory = btn.dataset.fromHistory === '1';
    const job = findJob(id, fromHistory);
    if (!job) return;
    const act = btn.dataset.act;

    switch (act) {
      case 'apply-email':
        global.GmailApply.applyViaEmail(job);
        toast(`Applied to ${job.company} — Gmail compose opened, resume downloaded.`);
        // Re-render after a small delay so the user sees the change
        setTimeout(render, 300);
        break;
      case 'apply-link':
        // The anchor's default href + target=_blank opens the URL in a new tab.
        // We only mark the job as applied here (don't call applyExternal which
        // would call window.open(url) a second time — bug fix).
        global.Tracking.markApplied(job, { via: 'external-link' });
        toast(`Marked applied & opened application page for ${job.company}.`);
        setTimeout(render, 300);
        break;
      case 'resume':
        toast('Generating resume PDF…');
        global.ResumeGen.generate(job)
          .then(() => toast('Resume PDF generated.'))
          .catch(err => { console.warn(err); toast('Resume gen failed: ' + err.message, true); });
        break;
      case 'cover':
        toast('Generating cover letter PDF…');
        global.CoverLetter.downloadPDF(job)
          .then(() => toast('Cover letter PDF generated.'))
          .catch(err => { console.warn(err); toast('Cover letter failed, opening print preview.', true); global.CoverLetter.printPreview(job); });
        break;
      case 'dismiss':
        global.JobStorage.dismiss(id);
        toast('Job hidden.');
        render();
        break;
      case 'unapply':
        if (confirm('Remove this application from history?')) {
          global.Tracking.unapply(id);
          toast('Removed from history.');
          render();
        }
        break;
      case 'reemail':
        global.GmailApply.openCompose(job);
        break;
      case 'notes':
        openNotesModal(job);
        break;
    }
  }

  function onGridChange(e) {
    const sel = e.target.closest('select[data-act="status"]');
    if (!sel) return;
    global.Tracking.setStatus(sel.dataset.id, sel.value);
    toast('Status updated.');
  }

  // ── Controls ─────────────────────────────────────────────────────────
  function bindControls() {
    const grid = document.getElementById('grid');
    grid.addEventListener('click', onGridClick);
    grid.addEventListener('change', onGridChange);

    // Search with 150ms debounce (perf fix for 100+ jobs)
    document.getElementById('search').addEventListener('input', e => {
      clearTimeout(state.searchDebounce);
      state.searchDebounce = setTimeout(() => {
        state.search = e.target.value; render();
      }, 150);
    });
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.filter = b.dataset.filter; render();
      });
    });
    document.querySelectorAll('[data-view]').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.view = b.dataset.view; render();
      });
    });
    document.getElementById('minScore').addEventListener('change', e => {
      state.minScore = parseInt(e.target.value, 10) || 0; render();
    });
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) {
      sourceFilter.addEventListener('change', e => {
        state.source = e.target.value; render();
      });
    }
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        // Reload the page to refetch all sources
        setTimeout(() => location.reload(), 400);
      });
    }
    document.getElementById('exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(global.JobStorage.exportAll(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `job-portal-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      toast('Backup exported.');
    });
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { global.JobStorage.importAll(JSON.parse(r.result)); toast('Backup imported.'); render(); }
          catch (err) { toast('Import failed: ' + err.message, true); }
        };
        r.readAsText(f);
      });
    }
  }

  // ── Notes modal (interview prep) ─────────────────────────────────────
  function openNotesModal(job) {
    const existing = document.getElementById('notesModal');
    if (existing) existing.remove();

    const notes = global.JobStorage.getNote(job.id) || '';
    const score = global.JobScorer.scoreJob(job, global.VICTOR_PROFILE);
    const matchedSkills = (score.matchedSkills || []).slice(0, 5).join(', ');
    const missingSkills = (score.missingSkills || []).slice(0, 5).join(', ');

    // Auto-generate a prep checklist from matched skills
    const checklist = (score.matchedSkills || []).slice(0, 5).map(s =>
      `□ Be ready to discuss ${s} — prepare 1-2 concrete examples from past work.`
    ).join('\n');
    const defaultNotes = `INTERVIEW PREP — ${job.title} @ ${job.company}\n` +
      `Applied: ${new Date().toLocaleDateString()}\n\n` +
      `KEY MATCHED SKILLS: ${matchedSkills || 'None detected'}\n` +
      `SKILL GAPS: ${missingSkills || 'None'}\n\n` +
      `PREP CHECKLIST:\n${checklist}\n\n` +
      `COMPANY RESEARCH:\n- \n- \n\n` +
      `QUESTIONS TO ASK:\n- \n- \n\n` +
      `SALARY RANGE (if discussed): \n\n` +
      `NOTES:`;

    const modal = document.createElement('div');
    modal.id = 'notesModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;max-width:640px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,0.5)">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:1rem">Interview Prep Notes</div>
            <div style="font-size:0.8125rem;color:var(--text-muted);margin-top:0.125rem">${esc(job.title)} @ ${esc(job.company)}</div>
          </div>
          <button id="closeNotes" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.5rem;padding:0.25rem 0.5rem" aria-label="Close">×</button>
        </div>
        <div style="padding:1rem 1.5rem;flex:1;overflow-y:auto">
          <textarea id="notesText" style="width:100%;min-height:340px;padding:0.875rem;border-radius:10px;background:var(--glass);border:1px solid var(--border);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;line-height:1.6;resize:vertical;outline:none" aria-label="Notes">${esc(notes || defaultNotes)}</textarea>
          <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--text-dim)">
            Auto-saved to your browser. Will persist across sessions.
          </div>
        </div>
        <div style="padding:0.875rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:0.5rem">
          <button id="clearNotes" class="btn danger">Clear</button>
          <button id="saveNotes" class="btn primary">Save & Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#closeNotes').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
    modal.querySelector('#saveNotes').onclick = () => {
      global.JobStorage.setNote(job.id, modal.querySelector('#notesText').value);
      toast('Notes saved.');
      close();
    };
    modal.querySelector('#clearNotes').onclick = () => {
      if (confirm('Clear notes for this job?')) {
        global.JobStorage.setNote(job.id, '');
        modal.querySelector('#notesText').value = '';
        toast('Notes cleared.');
      }
    };
    // Auto-save on Escape
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && document.getElementById('notesModal')) {
        global.JobStorage.setNote(job.id, modal.querySelector('#notesText').value);
        close();
        document.removeEventListener('keydown', esc);
      }
    });
  }

  // ── Tiny toast ───────────────────────────────────────────────────────
  let toastTimer;
  function toast(msg, isError) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' error' : '');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  global.JobPortal = { init, state, render };
  document.addEventListener('DOMContentLoaded', init);
})(window);
