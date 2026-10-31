/* ═════════════════════════════════════════════════════════
 * Hero proof chip (v18 → v19) — victorndunda.com homepage
 * Reads /projects/projects.json, gathers LIVE projects (priority,
 * liveUrl set, not archived) and cycles through them with a soft
 * crossfade every 5s. Reduced motion: static first project.
 * Silent no-op when fetch fails — the chip simply stays hidden.
 * ═════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function label(p) {
    return p.name + (p.tagline ? ' — ' + String(p.tagline).slice(0, 60) : '');
  }
  function init() {
    var chip = document.getElementById('heroProofChip');
    var nameEl = document.getElementById('heroProofName');
    if (!chip || !nameEl) return;
    fetch('/projects/projects.json?v=19')
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
        nameEl.textContent = label(live[0]);
        chip.hidden = false;
        if (REDUCED || live.length < 2) return;
        /* cycle: fade → swap → fade in, paused when tab hidden */
        var idx = 0;
        setInterval(function () {
          if (document.hidden) return;
          chip.classList.add('proof-fading');
          setTimeout(function () {
            idx = (idx + 1) % live.length;
            nameEl.textContent = label(live[idx]);
            chip.classList.remove('proof-fading');
          }, 320);
        }, 5200);
      })
      .catch(function () { /* chip stays hidden — no error surface */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
