/* ═══════════════════════════════════════════════════════════════════
   scheduler.js — Victor Ndunda v9 own booking box
   ─────────────────────────────────────────────────────────────────
   Replaces the Cal.com inline embed with a fully first-party,
   coded scheduler. Zero third-party scripts, zero iframes.

   Flow:  date (calendar grid) → time slot → your details → confirm
   Submit → Web3Forms email (owner) + .ics download (visitor) +
   WhatsApp handoff link. Analytics events via window.__vnTrack.

   Design notes
   - Times are generated in Africa/Nairobi (EAT, UTC+3) working
     hours 09:00–16:30 Mon–Fri, 30-min slots, min lead 12h,
     max horizon 45 days. Past days + weekends are disabled.
   - The visitor's timezone is detected and shown alongside EAT.
   - This is a REQUEST box: the slot is held on the visitor's own
     calendar via .ics and emailed to the owner for confirmation —
     honestly labelled, no fake "guaranteed" claims.
   - Persistence: localStorage 'vn_booking' (draft restore) only.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WHATSAPP = '254724346971';
  var EAT_OFFSET_MIN = 3 * 60;                    // UTC+3, no DST
  var DAY_START_MIN = 9 * 60;                     // 09:00
  var DAY_END_MIN = 17 * 60;                      // 17:00 (last slot 16:30)
  var SLOT_MIN = 30;
  var MIN_LEAD_HOURS = 12;
  var MAX_DAYS_AHEAD = 45;
  var DURATION_MIN = 30;

  /* ── Element refs ── */
  var root = document.getElementById('vn-scheduler');
  if (!root) return;

  var gridEl = root.querySelector('.sc-grid');
  var monthEl = root.querySelector('.sc-month');
  var prevBtn = root.querySelector('.sc-prev');
  var nextBtn = root.querySelector('.sc-next');
  var slotsEl = root.querySelector('.sc-slots');
  var tzNote = root.querySelector('.sc-tz');
  var stepDate = root.querySelector('[data-sc-step="date"]');
  var stepTime = root.querySelector('[data-sc-step="time"]');
  var stepForm = root.querySelector('[data-sc-step="form"]');
  var stepDone = root.querySelector('[data-sc-step="done"]');
  var backBtns = root.querySelectorAll('[data-sc-back]');
  var form = root.querySelector('#sc-form');
  var picked = { date: null, slot: null };

  /* ── Time helpers ── */
  function nowUtc() { return new Date(); }

  function eatNow() {
    var n = nowUtc();
    return new Date(n.getTime() + (EAT_OFFSET_MIN + n.getTimezoneOffset()) * 60000);
  }

  /** EAT wall-clock Date for a given EAT calendar day + minutes-from-midnight */
  function eatDate(y, m, d, mins) {
    return new Date(y, m, d, Math.floor(mins / 60), mins % 60, 0, 0);
  }

  /** Convert EAT wall-clock to visitor-local wall-clock string */
  function eatToLocal(y, m, d, mins) {
    var utcMs = Date.UTC(y, m, d, Math.floor(mins / 60), mins % 60) - EAT_OFFSET_MIN * 60000;
    var l = new Date(utcMs);
    var lh = l.getHours(), lm = l.getMinutes();
    var ampm = lh >= 12 ? 'PM' : 'AM';
    var h12 = (lh % 12) || 12;
    return h12 + ':' + String(lm).padStart(2, '0') + ' ' + ampm;
  }

  function fmtEAT(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = (h % 12) || 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  }

  function fmtDay(d) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' ' +
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function visitorTzLabel() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your timezone';
      var isEat = tz === 'Africa/Nairobi';
      return isEat ? 'Times shown in East Africa Time (EAT)' :
        'Times shown in East Africa Time (EAT) · your timezone: ' + tz.replace(/_/g, ' ');
    } catch (e) { return 'Times shown in East Africa Time (EAT)'; }
  }

  /* ── Analytics bridge (same taxonomy as assistant.js) ── */
  function track(name, data) {
    try {
      var ev = { event: name, t: Date.now(), data: data || {} };
      (window.__vnEvents = window.__vnEvents || []).push(ev);
      if (typeof window.__vnTrack === 'function') window.__vnTrack(ev);
    } catch (e) { /* never break the page */ }
  }

  /* ── State ── */
  var viewYear, viewMonth;   // calendar grid being shown
  (function initView() {
    var n = eatNow();
    viewYear = n.getFullYear(); viewMonth = n.getMonth();
  })();

  function monthLabel(y, m) {
    return new Date(y, m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  function leadOkay(dateEAT, mins) {
    var slot = eatDate(dateEAT.getFullYear(), dateEAT.getMonth(), dateEAT.getDate(), mins);
    return (slot.getTime() - eatNow().getTime()) >= MIN_LEAD_HOURS * 3600000;
  }

  function maxDay() {
    var d = eatNow();
    d.setDate(d.getDate() + MAX_DAYS_AHEAD);
    return d;
  }

  /* ── Step switching ── */
  function show(step) {
    [stepDate, stepTime, stepForm, stepDone].forEach(function (el) { if (el) el.hidden = true; });
    if (step) step.hidden = false;
    if (root.scrollIntoView && step !== stepDate) {
      /* keep the box in view as its height changes */
      var r = root.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight + 80) {
        root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /* ── Calendar grid ── */
  function renderGrid() {
    if (!gridEl) return;
    if (monthEl) monthEl.textContent = monthLabel(viewYear, viewMonth);
    var first = new Date(viewYear, viewMonth, 1);
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var startPad = (first.getDay() + 6) % 7;   // Monday-first grid
    var today = eatNow();
    var maxD = maxDay();

    gridEl.innerHTML = '';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (dw) {
      var h = document.createElement('div');
      h.className = 'sc-dow';
      h.textContent = dw;
      h.setAttribute('aria-hidden', 'true');
      gridEl.appendChild(h);
    });
    for (var i = 0; i < startPad; i++) {
      var pad = document.createElement('div');
      pad.className = 'sc-day pad';
      gridEl.appendChild(pad);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'sc-day';
      cell.textContent = d;
      var wd = new Date(viewYear, viewMonth, d).getDay();
      var isPast = new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      var beyond = new Date(viewYear, viewMonth, d) > maxD;
      var weekend = wd === 0 || wd === 6;
      if (isPast || beyond || weekend) {
        cell.disabled = true;
        cell.setAttribute('aria-disabled', 'true');
        if (weekend && !isPast) cell.title = 'Weekends off';
      } else {
        (function (y, m, dd) {
          cell.addEventListener('click', function () { pickDate(y, m, dd); });
        })(viewYear, viewMonth, d);
      }
      if (picked.date && picked.date.getFullYear() === viewYear &&
          picked.date.getMonth() === viewMonth && picked.date.getDate() === d) {
        cell.classList.add('picked');
        cell.setAttribute('aria-pressed', 'true');
      }
      gridEl.appendChild(cell);
    }
    /* Month nav bounds */
    if (prevBtn) {
      var canPrev = new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
      prevBtn.disabled = !canPrev;
      prevBtn.setAttribute('aria-disabled', canPrev ? 'false' : 'true');
    }
    if (nextBtn) {
      var canNext = new Date(viewYear, viewMonth + 1, 1) <= maxD;
      nextBtn.disabled = !canNext;
      nextBtn.setAttribute('aria-disabled', canNext ? 'false' : 'true');
    }
  }

  function pickDate(y, m, d) {
    picked.date = new Date(y, m, d);
    picked.slot = null;
    track('scheduler_date', { date: y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0') });
    renderGrid();
    renderSlots();
    show(stepTime);
  }

  /* ── Time slots ── */
  function renderSlots() {
    if (!slotsEl) return;
    slotsEl.innerHTML = '';
    var y = picked.date.getFullYear(), m = picked.date.getMonth(), d = picked.date.getDate();
    var dateLabel = root.querySelector('.sc-date-label');
    if (dateLabel) dateLabel.textContent = fmtDay(picked.date);

    var any = false;
    for (var mins = DAY_START_MIN; mins + SLOT_MIN <= DAY_END_MIN; mins += SLOT_MIN) {
      if (!leadOkay(picked.date, mins)) continue;
      any = true;
      (function (mm) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lg-chip sc-slot';
        b.textContent = fmtEAT(mm) + ' · ' + eatToLocal(y, m, d, mm);
        b.title = 'EAT ' + fmtEAT(mm) + ' = ' + eatToLocal(y, m, d, mm) + ' your time';
        b.addEventListener('click', function (ev) { pickSlot(mm, ev.currentTarget); });
        slotsEl.appendChild(b);
      })(mins);
    }
    if (!any) {
      var p = document.createElement('p');
      p.className = 'sc-none';
      p.textContent = 'No slots left on this day with ' + MIN_LEAD_HOURS + 'h notice — try the next business day.';
      slotsEl.appendChild(p);
    }
  }

  function pickSlot(mins, btn) {
    picked.slot = mins;
    Array.prototype.forEach.call(slotsEl.querySelectorAll('.sc-slot'), function (b) {
      b.classList.remove('is-on');
      b.setAttribute('aria-pressed', 'false');
    });
    if (btn) { btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true'); }
    track('scheduler_slot', { slot: fmtEAT(mins) });
    setTimeout(function () { show(stepForm); }, 160);
  }

  /* ── Details form ── */
  function prefill() {
    /* Pull assistant estimate context if present (vn_last_estimate) */
    try {
      var est = JSON.parse(localStorage.getItem('vn_last_estimate') || 'null');
      var topic = form.querySelector('[name="topic"]');
      if (est && topic && !topic.value) {
        topic.value = 'Ballpark discussed: ' + est.service + ' (' + est.range + ')' +
          (est.domain ? ' — ' + est.domain + ' context' : '');
      }
      var estBox = root.querySelector('.sc-estimate-context');
      if (est && estBox) {
        estBox.hidden = false;
        estBox.textContent = 'Attached from the assistant: ' + est.service + ' · ' + est.range;
      }
    } catch (e) { /* ignore */ }
  }

  function sanitize(str, max) {
    return String(str || '').replace(/<[^>]*>/g, '').trim().slice(0, max || 500);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ── .ics generation (visitor's calendar hold) ── */
  function icsFor(name, email, company) {
    var y = picked.date.getFullYear(), m = picked.date.getMonth(), d = picked.date.getDate();
    var startUtc = new Date(Date.UTC(y, m, d, Math.floor(picked.slot / 60), picked.slot % 60) - EAT_OFFSET_MIN * 60000);
    var endUtc = new Date(startUtc.getTime() + DURATION_MIN * 60000);
    function pad(n) { return String(n).padStart(2, '0'); }
    function fmt(dt) {
      return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + 'T' +
        pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + '00Z';
    }
    var stamp = fmt(new Date());
    var uid = 'vn-book-' + Date.now() + '@victorndunda.com';
    var who = sanitize(name, 100);
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//victorndunda.com//Scheduler v9//EN',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + stamp,
      'DTSTART:' + fmt(startUtc),
      'DTEND:' + fmt(endUtc),
      'SUMMARY:AI Systems Assessment — Victor Ndunda × ' + who,
      'DESCRIPTION:30-minute call on WhatsApp. Requested via victorndunda.com/book — confirmation follows by email/WhatsApp. Contact: +254 724 346 971.',
      'LOCATION:WhatsApp call (+254 724 346 971)',
      'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY',
      'DESCRIPTION:Assessment call in 15 minutes', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return lines.join('\r\n');
  }

  function downloadIcs(ics) {
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'victor-ndunda-assessment.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  /* ── WhatsApp link with booking context ── */
  function waLink(name, topic) {
    var y = picked.date.getFullYear(), m = picked.date.getMonth(), d = picked.date.getDate();
    var msg = 'Hi Victor, I requested a 30-min assessment: ' +
      fmtDay(picked.date) + ' at ' + fmtEAT(picked.slot) + ' EAT (' + eatToLocal(y, m, d, picked.slot) + ' my time)' +
      (topic ? ' — about: ' + topic : '') +
      (name ? ' — ' + name : '') + '. Sent from victorndunda.com/book';
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  }

  /* ── Submit ── */
  function submitBooking(e) {
    e.preventDefault();
    var name = sanitize(form.querySelector('[name="name"]').value, 100);
    var email = sanitize(form.querySelector('[name="email"]').value, 254);
    var company = sanitize(form.querySelector('[name="company"]').value, 100);
    var topic = sanitize(form.querySelector('[name="topic"]').value, 300);
    var notes = sanitize(form.querySelector('[name="notes"]').value, 1000);
    var err = root.querySelector('.sc-error');

    if (name.length < 2 || !validEmail(email)) {
      if (err) { err.textContent = 'Please add your name and a valid email so the confirmation reaches you.'; err.hidden = false; }
      return;
    }
    if (err) err.hidden = true;

    var y = picked.date.getFullYear(), m = picked.date.getMonth(), d = picked.date.getDate();
    var slotEAT = fmtEAT(picked.slot);
    var slotLocal = eatToLocal(y, m, d, picked.slot);

    /* 1) Email the owner via Web3Forms (same backend as the message form) */
    var fd = new FormData();
    fd.set('access_key', window.VN_W3F_KEY || '');
    fd.set('subject', 'Booking request: ' + fmtDay(picked.date) + ' ' + slotEAT + ' — ' + name);
    fd.set('from_name', 'victorndunda.com scheduler');
    fd.set('name', name);
    fd.set('email', email);
    fd.set('company', company);
    fd.set('message',
      'BOOKING REQUEST (own scheduler v9)\n' +
      'Date: ' + fmtDay(picked.date) + '\n' +
      'Slot (EAT): ' + slotEAT + '  |  Visitor local: ' + slotLocal + '\n' +
      'Visitor timezone: ' + (Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown') + '\n' +
      'Topic: ' + (topic || '—') + '\n' +
      'Company: ' + (company || '—') + '\n' +
      'Notes: ' + (notes || '—') + '\n' +
      'Confirm on WhatsApp: https://wa.me/' + WHATSAPP);

    var sendBtn = form.querySelector('[type="submit"]');
    var oldLabel = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Requesting…';

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .catch(function () { return { success: false, offline: true }; })
      .then(function (res) {
        track('scheduler_submit', { date: fmtDay(picked.date), slot: slotEAT, emailed: !!res.success });
        var done = root.querySelector('[data-sc-step="done"]');
        var emailNote = done.querySelector('.sc-email-note');
        if (emailNote) {
          emailNote.textContent = res.success
            ? 'Request emailed — you\u2019ll get a confirmation within a few hours (business time).'
            : 'The email notification failed to send — use the WhatsApp button below so the request still reaches Victor.';
        }
        /* 2) Visitor's calendar hold */
        done.querySelector('.sc-ics-btn').addEventListener('click', function () {
          downloadIcs(icsFor(name, email, company));
          window.vnToast('Calendar hold downloaded', '📅');
        }, { once: true });
        /* 3) WhatsApp handoff */
        done.querySelector('.sc-wa-btn').href = waLink(name, topic);
        var summary = done.querySelector('.sc-summary');
        if (summary) {
          summary.innerHTML = '';
          var strong = document.createElement('strong');
          strong.textContent = fmtDay(picked.date) + ' · ' + slotEAT + ' EAT';
          summary.appendChild(strong);
          var span = document.createElement('span');
          span.textContent = ' (' + slotLocal + ' your time · 30 minutes on WhatsApp)';
          summary.appendChild(span);
        }
        show(stepDone);
        sendBtn.disabled = false;
        sendBtn.textContent = oldLabel;
      });
  }

  /* ── Wire up ── */
  if (prevBtn) prevBtn.addEventListener('click', function () {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderGrid();
  });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderGrid();
  });
  Array.prototype.forEach.call(backBtns, function (b) {
    b.addEventListener('click', function () {
      show(b.getAttribute('data-sc-back') === 'time' ? stepTime : stepDate);
    });
  });
  if (form) form.addEventListener('submit', submitBooking);

  /* Keyboard: arrow keys navigate the day grid like a native calendar */
  if (gridEl) {
    gridEl.addEventListener('keydown', function (e) {
      var days = Array.prototype.filter.call(gridEl.querySelectorAll('.sc-day:not(.pad)'), function (b) { return !b.disabled; });
      var idx = days.indexOf(document.activeElement);
      if (idx < 0) return;
      var delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 :
                  e.key === 'ArrowDown' ? 7 : e.key === 'ArrowUp' ? -7 : 0;
      if (!delta) return;
      e.preventDefault();
      var next = days[Math.max(0, Math.min(days.length - 1, idx + delta))];
      next.focus();
    });
  }

  if (tzNote) tzNote.textContent = visitorTzLabel();
  renderGrid();
  prefill();
  track('scheduler_boot', {});
})();
