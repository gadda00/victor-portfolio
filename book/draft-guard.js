/* Victor Ndunda — Booking form draft guard (v12)
   A crashed tab or accidental refresh used to silently kill a
   half-filled booking form — and the lead with it. This remembers
   every field of BOTH book-page forms (scheduler #sc-form + message
   #quickForm), debounced into localStorage, restores on return, and
   clears on successful submit. Restore is announced with a toast so
   it never feels like spooky persistence.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function guard(form, key) {
    if (!form) return;

    function readDraft() {
      try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
    }
    function writeDraft(data) {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    }
    function clearDraft() {
      try { localStorage.removeItem(key); } catch (e) {}
    }
    function fields() {
      return Array.prototype.slice.call(form.querySelectorAll(
        'input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=password]), select, textarea'));
    }
    function snapshot() {
      var o = { t: Date.now() };
      fields().forEach(function (f) { if (f.name || f.id) o[f.name || f.id] = f.value; });
      return o;
    }

    /* ── Restore (once, on load) ─────────────────────────────────── */
    var draft = readDraft();
    if (draft && draft.t && Date.now() - draft.t < 7 * 24 * 3600 * 1000) {
      var restored = 0;
      fields().forEach(function (f) {
        var k = f.name || f.id;
        if (k && draft[k] && !f.value) { f.value = draft[k]; restored++; }
      });
      if (restored > 0 && typeof window.vnToast === 'function') {
        window.vnToast('Restored your unfinished booking draft ✓', 3200);
      }
    }

    /* ── Save (debounced 600ms) ──────────────────────────────────── */
    var timer = null;
    form.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { writeDraft(snapshot()); }, 600);
    });
    form.addEventListener('change', function () { writeDraft(snapshot()); });

    /* ── Clear on submit ─────────────────────────────────────────── */
    form.addEventListener('submit', function () { clearDraft(); });

    /* ── Privacy: "start over" affordance on the form footer ─────── */
    var foot = form.querySelector('.form-foot, .book-form-foot, p.form-note, .sc-note');
    if (!foot) {
      foot = document.createElement('p');
      foot.className = 'form-note';
      foot.style.cssText = 'margin:.6rem 0 0;font-size:.72rem;color:var(--text-dim,#64748b)';
      form.appendChild(foot);
    }
    var note = document.createElement('span');
    note.innerHTML = ' · <a href="#" role="button" data-draft-clear style="color:inherit;text-decoration:underline">start over</a> (clears saved draft)';
    foot.appendChild(note);
    note.querySelector('[data-draft-clear]').addEventListener('click', function (e) {
      e.preventDefault();
      clearDraft();
      form.reset();
      if (typeof window.vnToast === 'function') window.vnToast('Draft cleared');
    });
  }

  guard(document.getElementById('sc-form'), 'vn_book_draft_sc');
  guard(document.getElementById('quickForm'), 'vn_book_draft_qf');
})();
