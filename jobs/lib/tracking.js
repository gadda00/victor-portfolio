/* =====================================================================
 * tracking.js — Application tracking pipeline (Feature 1 + status flow)
 * ---------------------------------------------------------------------
 * Wraps JobStorage with domain logic for the apply → applied → interview
 * → offer/rejected lifecycle. Exposes render helpers that the UI calls.
 *
 * Status values:  'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'ghosted'
 * ===================================================================== */
(function (global) {
  'use strict';

  const STATUSES = [
    { id: 'saved',     label: 'Saved',      color: '#64748b', order: 0 },
    { id: 'applied',   label: 'Applied',    color: '#3b82f6', order: 1 },
    { id: 'interview', label: 'Interview',  color: '#8b5cf6', order: 2 },
    { id: 'offer',     label: 'Offer',      color: '#16a34a', order: 3 },
    { id: 'rejected',  label: 'Rejected',   color: '#ef4444', order: 4 },
    { id: 'ghosted',   label: 'Ghosted',    color: '#9ca3af', order: 5 },
  ];
  const STATUS_BY_ID = Object.fromEntries(STATUSES.map(s => [s.id, s]));

  /** Mark a job as applied (status: applied). Used by Apply button. */
  function markApplied(job, extra) {
    global.JobStorage.saveApplication({
      jobId: job.id,
      job,
      status: 'applied',
      channel: extra && extra.channel || (job.applyEmail ? 'email' : 'link'),
      appliedAt: new Date().toISOString(),
      ...(extra || {}),
    });
  }

  /** Advance/Change status of a tracked application. */
  function setStatus(jobId, status) {
    const app = global.JobStorage.getApplication(jobId);
    if (!app) return null;
    const next = { ...app, status, [`at_${status}`]: new Date().toISOString() };
    global.JobStorage.saveApplication(next);
    return next;
  }

  /** "Apply" handler for jobs that link out (not email). Tracks + opens url. */
  function applyExternal(job) {
    markApplied(job, { channel: 'link' });
    // Validate URL protocol before opening (defense in depth — page also checks)
    let url = '#';
    try {
      const u = new URL(job.url);
      if (u.protocol === 'http:' || u.protocol === 'https:') url = u.href;
    } catch (e) { /* keep # */ }
    if (url !== '#') global.open(url, '_blank', 'noopener,noreferrer');
    return { ok: url !== '#', url };
  }

  /** Remove from history (un-apply). */
  function unapply(jobId) {
    global.JobStorage.removeApplication(jobId);
  }

  /** All applied/tracked jobs, newest first. */
  function history() {
    return global.JobStorage.getApplications()
      .sort((a, b) => new Date(b.appliedAt || b.updatedAt) - new Date(a.appliedAt || a.updatedAt));
  }

  /** Filter history by status. */
  function byStatus(status) {
    return history().filter(a => a.status === status);
  }

  /** Quick counts for dashboard. */
  function counts() {
    const c = { total: 0 };
    STATUSES.forEach(s => { c[s.id] = 0; });
    history().forEach(a => {
      c.total++;
      c[a.status] = (c[a.status] || 0) + 1;
    });
    return c;
  }

  /**
   * Split a raw job list into { open, applied, dismissed } using storage state.
   * `open` excludes anything already applied OR dismissed.
   */
  function partition(jobs) {
    const appliedIds = new Set(global.JobStorage.getApplications().map(a => a.jobId));
    const dismissedIds = new Set(global.JobStorage.read(global.JobStorage.KEYS.dismissed, []));
    const open = [];
    const applied = [];
    const dismissed = [];
    jobs.forEach(j => {
      if (appliedIds.has(j.id)) applied.push(j);
      else if (dismissedIds.has(j.id)) dismissed.push(j);
      else open.push(j);
    });
    return { open, applied, dismissed };
  }

  global.Tracking = {
    STATUSES, STATUS_BY_ID,
    markApplied, setStatus, applyExternal, unapply,
    history, byStatus, counts, partition,
  };
})(window);
