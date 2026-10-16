/* ═══════════════════════════════════════════════════════════════════
 * Hero proof chip (v18) — victorndunda.com homepage
 * Reads /projects/projects.json, picks the newest LIVE project
 * (priority order, liveUrl set, not archived), and reveals the chip.
 * Silent no-op when fetch fails — the chip simply stays hidden.
 * ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function init() {
    var chip = document.getElementById('heroProofChip');
    var nameEl = document.getElementById('heroProofName');
    if (!chip || !nameEl) return;
    fetch('/projects/projects.json?v=18')
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (d) {
        var projects = Array.isArray(d) ? d : (d.projects || []);
        var live = projects.filter(function (p) { return p.liveUrl && p.status !== 'archived'; });
        if (!live.length) return;
        live.sort(function (a, b) {
          var pa = Number(a.priority) || 99, pb = Number(b.priority) || 99;
          if (pa !== pb) return pa - pb;
          return String(b.date || b.year || '').localeCompare(String(a.date || a.year || ''));
        });
        var p = live[0];
        nameEl.textContent = p.name + (p.tagline ? ' — ' + String(p.tagline).slice(0, 60) : '');
        chip.hidden = false;
      })
      .catch(function () { /* chip stays hidden — no error surface */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
