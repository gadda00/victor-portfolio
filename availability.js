/* Victor Ndunda — Availability signals (v12)
   Honest, config-driven booking scarcity. No fake countdowns: the owner
   edits CAPACITY below and every [data-availability] hook site-wide
   updates. Renders "Now booking {Month YYYY} · {n} project slots" and
   degrades to nothing without JS.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Owner config: edit these two lines only ───────────────────── */
  var PROJECT_SLOTS = 2;   // concurrent project slots per month
  var CALLS_OPEN = true;   // free assessment calls currently open?

  function monthName(d) {
    return ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()];
  }

  document.querySelectorAll('[data-availability]').forEach(function (el) {
    var kind = el.getAttribute('data-availability');
    var now = new Date();
    var month = monthName(now) + ' ' + now.getFullYear();
    if (kind === 'slots') {
      el.textContent = 'Now booking ' + month + ' · ' + PROJECT_SLOTS + ' project ' + (PROJECT_SLOTS === 1 ? 'slot' : 'slots');
    } else if (kind === 'calls') {
      el.textContent = CALLS_OPEN ? 'Calls open this week · replies within 24h' : 'Call calendar briefly closed — email still fast';
    } else if (kind === 'full') {
      el.textContent = 'Now booking ' + month + ' · ' + PROJECT_SLOTS + ' ' + (PROJECT_SLOTS === 1 ? 'slot' : 'slots') + (CALLS_OPEN ? ' · calls open' : '');
    }
    /* hooks are authored [hidden] so no-JS never shows a dangling label */
    if (el.hasAttribute('hidden')) el.removeAttribute('hidden');
  });
})();
