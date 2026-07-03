/* =====================================================================
 * storage.js — Tiny typed wrapper around localStorage
 * ---------------------------------------------------------------------
 * Namespaces all portal data under one key prefix so it never collides
 * with the rest of victorndunda.com (theme, etc.). Adds JSON safety,
 * a fallback to in-memory when localStorage is unavailable (private
 * mode), and a small pub/sub so UI can react to changes.
 * ===================================================================== */
(function (global) {
  'use strict';

  const PREFIX = 'vn_jobs_'; // Victor Ndunda — jobs portal

  const KEYS = {
    applications: PREFIX + 'applications', // array of ApplicationRecord
    settings:     PREFIX + 'settings',     // user preferences overrides
    reminders:    PREFIX + 'reminders',    // follow-up reminders
    dismissed:    PREFIX + 'dismissed',    // job ids hidden from open list
    notes:        PREFIX + 'notes',        // interview-prep notes per job
    seen:         PREFIX + 'seen',         // job ids the user has viewed
    stats:        PREFIX + 'stats',        // aggregate counters
  };

  // In-memory fallback if localStorage throws (Safari private mode, etc.)
  const memStore = {};
  let mem = false;
  function ls() {
    if (mem) return memStore;
    try {
      const t = '__test__';
      global.localStorage.setItem(t, t);
      global.localStorage.removeItem(t);
      return global.localStorage;
    } catch (e) {
      mem = true;
      return memStore;
    }
  }

  function read(key, fallback) {
    try {
      const raw = ls().getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[storage] read failed for', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      ls().setItem(key, JSON.stringify(value));
      emit(key, value);
      return true;
    } catch (e) {
      console.warn('[storage] write failed for', key, e);
      return false;
    }
  }

  function remove(key) {
    try { ls().removeItem(key); emit(key, null); } catch (e) {}
  }

  // ── Minimal pub/sub ──────────────────────────────────────────────────
  const listeners = {};
  function on(key, fn) {
    (listeners[key] = listeners[key] || []).push(fn);
    return () => { // unsubscribe
      listeners[key] = (listeners[key] || []).filter(f => f !== fn);
    };
  }
  function emit(key, value) {
    (listeners[key] || []).forEach(fn => { try { fn(value); } catch (e) {} });
  }

  // ── Domain helpers ───────────────────────────────────────────────────

  /** Return all application records. */
  function getApplications() {
    return read(KEYS.applications, []);
  }

  /** Find one application by jobId. */
  function getApplication(jobId) {
    return getApplications().find(a => a.jobId === jobId) || null;
  }

  /** Upsert an application record. */
  function saveApplication(record) {
    const all = getApplications();
    const idx = all.findIndex(a => a.jobId === record.jobId);
    if (idx >= 0) all[idx] = { ...all[idx], ...record, updatedAt: Date.now() };
    else all.push({ ...record, createdAt: Date.now(), updatedAt: Date.now() });
    write(KEYS.applications, all);
    return record;
  }

  /** Remove an application (un-apply). */
  function removeApplication(jobId) {
    write(KEYS.applications, getApplications().filter(a => a.jobId !== jobId));
  }

  /** Is this jobId already in the applied history? */
  function isApplied(jobId) {
    return getApplications().some(a => a.jobId === jobId);
  }

  // Dismissed (hidden) jobs
  function dismiss(jobId) {
    const set = new Set(read(KEYS.dismissed, []));
    set.add(jobId);
    write(KEYS.dismissed, [...set]);
  }
  function isDismissed(jobId) {
    return read(KEYS.dismissed, []).includes(jobId);
  }
  function undismissAll() { write(KEYS.dismissed, []); }

  // Free-form notes per job (interview prep, etc.)
  function getNote(jobId) { return read(KEYS.notes, {})[jobId] || ''; }
  function setNote(jobId, text) {
    const all = read(KEYS.notes, {});
    all[jobId] = text;
    write(KEYS.notes, all);
  }

  // Reminders: { jobId, dueAt, label, done }
  function getReminders() { return read(KEYS.reminders, []); }
  function addReminder(r) {
    const all = getReminders();
    all.push({ done: false, ...r, id: r.id || ('r' + Date.now()) });
    write(KEYS.reminders, all);
  }
  function markReminderDone(id) {
    write(KEYS.reminders, getReminders().map(r => r.id === id ? { ...r, done: true } : r));
  }

  // Export/import everything (for backup)
  function exportAll() {
    const out = {};
    Object.values(KEYS).forEach(k => { out[k] = read(k, null); });
    return out;
  }
  function importAll(obj) {
    Object.entries(obj).forEach(([k, v]) => { if (v != null) write(k, v); });
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => remove(k));
  }

  global.JobStorage = {
    KEYS,
    read, write, remove, on,
    getApplications, getApplication, saveApplication, removeApplication, isApplied,
    dismiss, isDismissed, undismissAll,
    getNote, setNote,
    getReminders, addReminder, markReminderDone,
    exportAll, importAll, clearAll,
  };
})(window);
