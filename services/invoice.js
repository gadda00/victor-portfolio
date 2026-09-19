/* ═══════════════════════════════════════════════════════════════════
   invoice.js — Victor Ndunda v9 invoicing system
   ─────────────────────────────────────────────────────────────────
   First-party, fully client-side invoicing that closes the engagement
   pipeline: enquiry (assistant) → estimate → call (scheduler) →
   proposal → INVOICE → payment tracking → done.

   - Draft invoices with line items, USD/KES dual currency (FX editable)
   - Optional 16% VAT, discounts, notes, due dates
   - Statuses: draft → sent → paid (or overdue by date), with
     partial payments (amount + method + reference + date)
   - Auto numbering VN-YYYY-### per calendar year
   - Persisted in localStorage 'vn_invoices' (owner device — same
     model as the dashboard's jobs & client briefs)
   - Import the last assistant estimate (vn_last_estimate) or a
     wizard brief (vn_client_briefs) as a starting line item
   - Share via WhatsApp deep link / email; Print/Save-as-PDF via a
     print stylesheet that isolates the invoice document
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE = 'vn_invoices';
  var WHATSAPP = '254724346971';
  var MPESA_PAYBILL = '4071186';           // live merchant detail (payment.js)
  var VAT_RATE = 0.16;                     // Kenya VAT, applied only when toggled
  var DEFAULT_FX = 78;                     // KES per USD implied by published catalogue

  /* ── Utilities ── */
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function money(n, cur) {
    var v = Number(n) || 0;
    if (cur === 'KES') return 'KES ' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function addDaysISO(days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return iso; }
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(STORE, JSON.stringify(list)); return true; }
    catch (e) { if (window.vnToast) window.vnToast('Storage full — export a backup first', '⚠️'); return false; }
  }
  function nextNumber(list) {
    var year = new Date().getFullYear();
    var max = 0;
    list.forEach(function (inv) {
      var m = /^VN-(\d{4})-(\d+)$/.exec(inv.number || '');
      if (m && +m[1] === year) max = Math.max(max, +m[2]);
    });
    return 'VN-' + year + '-' + String(max + 1).padStart(3, '0');
  }
  function statusOf(inv) {
    if (inv.status === 'paid') return 'paid';
    if (inv.status === 'sent' && inv.due && inv.due < todayISO()) return 'overdue';
    return inv.status || 'draft';
  }

  /* ── State ── */
  var state = {
    number: null,           // set on first save
    client: { name: '', email: '', company: '', address: '' },
    items: [{ desc: '', qty: 1, rateUsd: 0 }],
    currency: 'USD',
    fx: DEFAULT_FX,
    vatOn: false,
    discountPct: 0,
    issue: todayISO(),
    due: addDaysISO(7),
    notes: 'Thank you — payment details below. Deposit schedules available on request.',
    status: 'draft',
    payments: [],
    editingId: null
  };

  /* ── Computation ── */
  function totals() {
    var subtotalUsd = 0;
    state.items.forEach(function (it) {
      subtotalUsd += (Number(it.qty) || 0) * (Number(it.rateUsd) || 0);
    });
    var discount = subtotalUsd * ((Number(state.discountPct) || 0) / 100);
    var taxable = subtotalUsd - discount;
    var vat = state.vatOn ? taxable * VAT_RATE : 0;
    var totalUsd = taxable + vat;
    var paid = (state.payments || []).reduce(function (s, p) { return s + (Number(p.usd) || 0); }, 0);
    return {
      subtotalUsd: subtotalUsd, discount: discount, vat: vat,
      totalUsd: totalUsd, totalKes: totalUsd * state.fx,
      paidUsd: paid, balanceUsd: totalUsd - paid
    };
  }

  /* ── Rendering: builder summary ── */
  function renderSummary() {
    var t = totals();
    var rows = [
      ['Subtotal', money(t.subtotalUsd, 'USD')],
      t.discount > 0 ? ['Discount (' + state.discountPct + '%)', '−' + money(t.discount, 'USD')] : null,
      state.vatOn ? ['VAT (16%)', money(t.vat, 'USD')] : null,
      ['Total', money(t.totalUsd, 'USD') + (state.currency === 'KES' ? '' : ' · ' + money(t.totalKes, 'KES'))],
      t.paidUsd > 0 ? ['Paid', '−' + money(t.paidUsd, 'USD')] : null,
      t.paidUsd > 0 ? ['Balance due', money(t.balanceUsd, 'USD')] : null
    ].filter(Boolean);
    $('#invSummary').innerHTML = rows.map(function (r, i) {
      var isTotal = i === rows.length - 1 && /Total|Balance/.test(r[0]);
      return '<div class="line' + (isTotal ? ' total' : '') + '"><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>';
    }).join('');
  }

  /* ── Rendering: invoice document preview ── */
  function renderDoc() {
    var t = totals();
    var st = state.status === 'draft' ? 'draft' : statusOf(state);
    var who = [state.client.name, state.client.company].filter(Boolean).join('\n') || 'Client name';
    var contact = [state.client.email, state.client.address].filter(Boolean).join('\n');
    var itemRows = state.items.map(function (it) {
      var amt = (Number(it.qty) || 0) * (Number(it.rateUsd) || 0);
      return '<tr><td>' + esc(it.desc || 'Item description') + '</td>' +
        '<td class="qty">' + esc(it.qty || 1) + '</td>' +
        '<td class="num">' + esc(money(it.rateUsd, 'USD')) + '</td>' +
        '<td class="num">' + esc(money(amt, 'USD')) + '</td></tr>';
    }).join('');

    var totalRows = [
      '<div class="line"><span>Subtotal</span><span>' + esc(money(t.subtotalUsd, 'USD')) + '</span></div>'
    ];
    if (t.discount > 0) totalRows.push('<div class="line"><span>Discount (' + esc(state.discountPct) + '%)</span><span>−' + esc(money(t.discount, 'USD')) + '</span></div>');
    if (state.vatOn) totalRows.push('<div class="line"><span>VAT (16%)</span><span>' + esc(money(t.vat, 'USD')) + '</span></div>');
    totalRows.push('<div class="line grand"><span>Total</span><span>' + esc(money(t.totalUsd, 'USD')) + '</span></div>');
    if (state.currency === 'USD') {
      totalRows.push('<div class="line"><span>≈ Kenya Shillings (FX ' + esc(state.fx) + ')</span><span>' + esc(money(t.totalKes, 'KES')) + '</span></div>');
    }
    if (t.paidUsd > 0) {
      totalRows.push('<div class="line"><span>Paid to date</span><span>−' + esc(money(t.paidUsd, 'USD')) + '</span></div>');
      totalRows.push('<div class="line grand"><span>Balance due</span><span>' + esc(money(t.balanceUsd, 'USD')) + '</span></div>');
    }

    var pays = (state.payments || []).map(function (p) {
      return '<li>' + esc(fmtDate(p.date)) + ' — ' + esc(money(p.usd, 'USD')) + ' via ' + esc(p.method) + (p.ref ? ' (ref ' + esc(p.ref) + ')' : '') + '</li>';
    }).join('');

    var number = state.number || nextNumber(load());

    $('#invDoc').innerHTML =
      '<div class="inv-doc-head">' +
        '<div class="inv-doc-brand"><div class="mark">V</div><div>' +
          '<div class="nm">Victor Ndunda</div>' +
          '<div class="sm">AI Systems · victorndunda.com · +254 724 346 971</div>' +
        '</div></div>' +
        '<div class="inv-doc-meta">' +
          '<div class="ttl">Invoice' + (st === 'paid' || st === 'overdue' || st === 'sent' ? '<span class="inv-doc-status-stamp ' + st + '">' + st + '</span>' : '') + '</div>' +
          '<div class="no">' + esc(number) + '</div>' +
          '<div class="dt">Issued ' + esc(fmtDate(state.issue)) + '<br>Due ' + esc(fmtDate(state.due)) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="inv-doc-parties">' +
        '<div><h4>From</h4><div class="p">Victor Ndunda\nNairobi, Kenya\nmututandunda@gmail.com</div></div>' +
        '<div><h4>Billed to</h4><div class="p">' + esc(who) + (contact ? '\n' + esc(contact) : '') + '</div></div>' +
      '</div>' +
      '<table class="inv-doc-items"><thead><tr><th>Description</th><th>Qty</th><th>Rate (USD)</th><th>Amount</th></tr></thead>' +
      '<tbody>' + itemRows + '</tbody></table>' +
      '<div class="inv-doc-totals">' + totalRows.join('') + '</div>' +
      '<div class="inv-doc-pay"><strong>Payment</strong> — ' +
        '<span class="mth">📱 M-Pesa Paybill <strong>' + MPESA_PAYBILL + '</strong> · Account: <strong>' + esc(number) + '</strong></span>' +
        '<span class="mth">✉️ mututandunda@gmail.com</span><br>' +
        'Card & international transfers: request a secure link by email. Bank details on request.<br>' +
        esc(state.notes || '') +
        (pays ? '<ul class="inv-pays">' + pays + '</ul>' : '') +
      '</div>' +
      '<div class="inv-doc-foot">Generated by victorndunda.com/services/invoice.html — figure in KES is indicative at FX ' + esc(state.fx) + ' KES/USD; the payable amount is the USD figure unless agreed otherwise.</div>';
  }

  /* ── Rendering: saved list ── */
  function renderSaved() {
    var list = load();
    var box = $('#invSaved');
    if (!list.length) {
      box.innerHTML = '<div class="inv-empty">No invoices yet — draft one on the left and save it. Invoices are stored on this device (export backups below).</div>';
      return;
    }
    var revenue = { paid: 0, pending: 0, overdue: 0 };
    list.forEach(function (inv) {
      var t2 = invTotals(inv);
      var st = statusOf(inv);
      if (st === 'paid') revenue.paid += t2.totalUsd;
      else if (st === 'overdue') revenue.overdue += t2.balanceUsd || t2.totalUsd;
      else revenue.pending += t2.balanceUsd || t2.totalUsd;
    });
    box.innerHTML =
      '<div class="inv-summary" style="margin-bottom:0.75rem">' +
        '<div class="line"><span>Paid (all time)</span><strong>' + esc(money(revenue.paid, 'USD')) + '</strong></div>' +
        '<div class="line"><span>Pending</span><strong>' + esc(money(revenue.pending, 'USD')) + '</strong></div>' +
        '<div class="line"><span>Overdue</span><strong>' + esc(money(revenue.overdue, 'USD')) + '</strong></div>' +
      '</div>' +
      list.slice().reverse().map(function (inv) {
        var t2 = invTotals(inv);
        var st = statusOf(inv);
        return '<div class="inv-saved">' +
          '<span class="no">' + esc(inv.number) + '</span>' +
          '<span class="who">' + esc(inv.client.name || inv.client.company || 'No client') + '</span>' +
          '<span class="amt">' + esc(money(t2.totalUsd, 'USD')) + '</span>' +
          '<span class="st ' + st + '">' + st + '</span>' +
          '<span class="act">' +
            '<button type="button" data-load="' + esc(inv.id) + '" title="Open in builder" aria-label="Open ' + esc(inv.number) + '">✏️</button>' +
            '<button type="button" data-mark="' + esc(inv.id) + '" title="Mark as sent" aria-label="Mark ' + esc(inv.number) + ' as sent">📤</button>' +
            '<button type="button" data-paid="' + esc(inv.id) + '" title="Record payment" aria-label="Record payment for ' + esc(inv.number) + '">💰</button>' +
            '<button type="button" data-del="' + esc(inv.id) + '" title="Delete" aria-label="Delete ' + esc(inv.number) + '">🗑️</button>' +
          '</span></div>';
      }).join('');
  }
  function invTotals(inv) {
    var subtotal = 0;
    (inv.items || []).forEach(function (it) { subtotal += (Number(it.qty) || 0) * (Number(it.rateUsd) || 0); });
    var discount = subtotal * ((Number(inv.discountPct) || 0) / 100);
    var vat = inv.vatOn ? (subtotal - discount) * VAT_RATE : 0;
    var totalUsd = subtotal - discount + vat;
    var paid = (inv.payments || []).reduce(function (s, p) { return s + (Number(p.usd) || 0); }, 0);
    return { subtotal: subtotal, totalUsd: totalUsd, paidUsd: paid, balanceUsd: totalUsd - paid };
  }

  /* ── Items editor ── */
  function renderItems() {
    $('#invItems').innerHTML = state.items.map(function (it, i) {
      return '<div class="inv-item">' +
        '<input type="text" data-i="' + i + '" data-f="desc" value="' + esc(it.desc) + '" placeholder="e.g. AI Chatbot & Virtual Assistant — build + deploy" aria-label="Item ' + (i + 1) + ' description" />' +
        '<input type="number" data-i="' + i + '" data-f="qty" value="' + esc(it.qty) + '" min="0" step="0.5" class="qty" aria-label="Item ' + (i + 1) + ' quantity" />' +
        '<input type="number" data-i="' + i + '" data-f="rateUsd" value="' + esc(it.rateUsd) + '" min="0" step="10" class="rate" aria-label="Item ' + (i + 1) + ' rate USD" />' +
        '<button type="button" class="inv-del" data-rm="' + i + '" title="Remove item" aria-label="Remove item ' + (i + 1) + '">×</button>' +
      '</div>';
    }).join('');
  }

  /* ── Bind builder inputs ── */
  function bind() {
    ['name', 'email', 'company', 'address'].forEach(function (f) {
      $('#cl-' + f).addEventListener('input', function (e) { state.client[f] = e.target.value; renderDoc(); });
    });
    $('#invItems').addEventListener('input', function (e) {
      var i = +e.target.getAttribute('data-i'), f = e.target.getAttribute('data-f');
      if (f == null) return;
      state.items[i][f] = f === 'desc' ? e.target.value : e.target.value;
      renderSummary(); renderDoc();
    });
    $('#invItems').addEventListener('click', function (e) {
      var rm = e.target.getAttribute('data-rm');
      if (rm == null) return;
      state.items.splice(+rm, 1);
      if (!state.items.length) state.items.push({ desc: '', qty: 1, rateUsd: 0 });
      renderItems(); renderSummary(); renderDoc();
    });
    $('#invAdd').addEventListener('click', function () {
      state.items.push({ desc: '', qty: 1, rateUsd: 0 });
      renderItems();
      var inputs = $('#invItems').querySelectorAll('[data-f="desc"]');
      inputs[inputs.length - 1].focus();
    });
    $('#invVat').addEventListener('change', function (e) { state.vatOn = e.target.checked; renderSummary(); renderDoc(); });
    $('#invDiscount').addEventListener('input', function (e) { state.discountPct = e.target.value; renderSummary(); renderDoc(); });
    $('#invIssue').addEventListener('input', function (e) { state.issue = e.target.value; renderDoc(); });
    $('#invDue').addEventListener('input', function (e) { state.due = e.target.value; renderDoc(); });
    $('#invNotes').addEventListener('input', function (e) { state.notes = e.target.value; renderDoc(); });
    $('#invFx').addEventListener('input', function (e) { state.fx = Number(e.target.value) || DEFAULT_FX; renderSummary(); renderDoc(); });

    /* Actions */
    $('#invSave').addEventListener('click', saveCurrent);
    $('#invNew').addEventListener('click', function () { resetState(); renderAll(); window.vnToast('Started a fresh draft', '🆕'); });
    $('#invPrint').addEventListener('click', function () { window.print(); });
    $('#invShareWa').addEventListener('click', shareWhatsApp);
    $('#invShareMail').addEventListener('click', shareEmail);
    $('#invExport').addEventListener('click', exportJson);
    $('#invImport').addEventListener('click', importJson);
    $('#invEstimate').addEventListener('click', importEstimate);
    $('#invBrief').addEventListener('click', importBrief);
    $('#invSaved').addEventListener('click', savedClick);
  }

  /* ── Actions: save / share / export ── */
  function currentInvoice() {
    var list = load();
    var id = state.editingId || ('inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
    return {
      id: id, number: state.number || nextNumber(list),
      client: JSON.parse(JSON.stringify(state.client)),
      items: JSON.parse(JSON.stringify(state.items)),
      vatOn: state.vatOn, discountPct: Number(state.discountPct) || 0,
      issue: state.issue, due: state.due, notes: state.notes,
      fx: state.fx, status: state.status, payments: JSON.parse(JSON.stringify(state.payments || [])),
      saved: new Date().toISOString()
    };
  }
  function saveCurrent() {
    var list = load();
    var inv = currentInvoice();
    if (!inv.client.name && !inv.client.company) { window.vnToast('Add the client name first', '⚠️'); $('#cl-name').focus(); return; }
    if (!inv.items.some(function (it) { return it.desc && (Number(it.rateUsd) || 0) > 0; })) { window.vnToast('Add at least one line item with a rate', '⚠️'); return; }
    var idx = list.findIndex(function (x) { return x.id === inv.id; });
    if (idx >= 0) list[idx] = inv; else list.push(inv);
    if (save(list)) {
      state.editingId = inv.id; state.number = inv.number;
      window.vnToast('Invoice ' + inv.number + ' saved', '💾');
      renderSaved(); renderDoc();
    }
  }
  function shareWhatsApp() {
    var t = totals();
    var number = state.number || nextNumber(load());
    var items = state.items.filter(function (it) { return it.desc; }).map(function (it, i) {
      return (i + 1) + '. ' + it.desc + ' — ' + money((Number(it.qty) || 0) * (Number(it.rateUsd) || 0), 'USD');
    }).join('\n');
    var msg = 'Invoice ' + number + ' from Victor Ndunda\n' +
      'For: ' + (state.client.name || state.client.company || '-') + '\n' +
      'Issued: ' + fmtDate(state.issue) + ' · Due: ' + fmtDate(state.due) + '\n\n' +
      (items || '—') + '\n' +
      'VAT: ' + (state.vatOn ? money(t.vat, 'USD') + ' (16%)' : 'not applicable') + '\n' +
      'TOTAL: ' + money(t.totalUsd, 'USD') + ' (≈ ' + money(t.totalKes, 'KES') + ')\n\n' +
      'Pay via M-Pesa Paybill ' + MPESA_PAYBILL + ', Account ' + number + '.\n' +
      'Full invoice PDF: victorndunda.com/services/invoice.html\n' +
      'Thank you!';
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }
  function shareEmail() {
    var t = totals();
    var number = state.number || nextNumber(load());
    var subject = 'Invoice ' + number + ' — Victor Ndunda (' + money(t.totalUsd, 'USD') + ')';
    var body = 'Hi ' + (state.client.name || 'there') + ',\n\n' +
      'Invoice ' + number + ' is attached to this engagement.\n\n' +
      'Amount: ' + money(t.totalUsd, 'USD') + (state.vatOn ? ' (incl. 16% VAT)' : '') + '\n' +
      'Issued: ' + fmtDate(state.issue) + '\nDue: ' + fmtDate(state.due) + '\n\n' +
      'Payment: M-Pesa Paybill ' + MPESA_PAYBILL + ' — Account ' + number + '\n' +
      'Card / international transfer link available on request.\n\n' +
      'Thank you,\nVictor Ndunda\nvictorndunda.com';
    window.location.href = 'mailto:' + encodeURIComponent(state.client.email || '') +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function exportJson() {
    var blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'victor-ndunda-invoices-' + todayISO() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 600);
    window.vnToast('Invoices backup downloaded', '📦');
  }
  function importJson() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.addEventListener('change', function () {
      var file = input.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!Array.isArray(data)) throw new Error('not a list');
          var existing = load();
          var added = 0;
          data.forEach(function (inv) {
            if (inv && inv.id && inv.number && inv.items && !existing.some(function (x) { return x.id === inv.id; })) {
              existing.push(inv); added++;
            }
          });
          save(existing); renderSaved();
          window.vnToast('Imported ' + added + ' invoice' + (added === 1 ? '' : 's'), '📥');
        } catch (e) { window.vnToast('That file is not a valid invoice backup', '⚠️'); }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /* ── Imports: assistant estimate / wizard brief ── */
  function importEstimate() {
    try {
      var est = JSON.parse(localStorage.getItem('vn_last_estimate') || 'null');
      if (!est) { window.vnToast('No estimate found — run one on /book/ first', 'ℹ️'); return; }
      state.items = [{
        desc: est.service + ' — ballpark ' + est.range +
          (est.domain ? ' (' + est.domain + ' context)' : '') +
          ' · volume ' + est.volume + ' · integrations ' + est.integrations + ' · languages ' + est.languages,
        qty: 1,
        rateUsd: Math.round((est.usdLow + est.usdHigh) / 2 / 50) * 50
      }];
      state.notes = 'Scope as discussed — generated from the site estimate tool (' + est.range + '). Final scope confirmed in writing before any build.';
      renderItems(); renderSummary(); renderDoc();
      window.vnToast('Estimate imported — adjust the rate before sending', '💰');
    } catch (e) { window.vnToast('Could not read the saved estimate', '⚠️'); }
  }
  function importBrief() {
    try {
      var briefs = JSON.parse(localStorage.getItem('vn_client_briefs') || '[]');
      var b = briefs[briefs.length - 1];
      if (!b) { window.vnToast('No brief found — the scope wizard saves one', 'ℹ️'); return; }
      if (b.details) {
        state.client.name = b.details.name || '';
        state.client.email = b.details.email || '';
        state.client.company = b.details.company || '';
        $('#cl-name').value = state.client.name;
        $('#cl-email').value = state.client.email;
        $('#cl-company').value = state.client.company;
      }
      state.items = [{ desc: 'AI engagement — ' + (b.recommendation ? b.recommendation.name + ' package' : 'scoped build') + (b.estimate ? ' (' + b.estimate + ')' : ''), qty: 1, rateUsd: b.priceUsd || 0 }];
      renderItems(); renderSummary(); renderDoc();
      window.vnToast('Brief imported — check details before sending', '📋');
    } catch (e) { window.vnToast('Could not read the saved brief', '⚠️'); }
  }

  /* ── Saved-list interactions ── */
  function savedClick(e) {
    var loadId = e.target.getAttribute('data-load');
    var markId = e.target.getAttribute('data-mark');
    var paidId = e.target.getAttribute('data-paid');
    var delId = e.target.getAttribute('data-del');
    var list = load();
    if (loadId) {
      var inv = list.find(function (x) { return x.id === loadId; });
      if (inv) {
        state = JSON.parse(JSON.stringify(inv));
        state.editingId = inv.id;
        syncInputs(); renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.vnToast('Loaded ' + inv.number, '✏️');
      }
    } else if (markId) {
      var inv2 = list.find(function (x) { return x.id === markId; });
      if (inv2) {
        inv2.status = inv2.status === 'sent' ? 'draft' : 'sent';
        save(list); renderSaved();
        if (state.editingId === inv2.id) { syncFromSaved(inv2.id); renderAll(); }
        window.vnToast(inv2.number + ' → ' + inv2.status, inv2.status === 'sent' ? '📤' : '↩️');
      }
    } else if (paidId) {
      var inv3 = list.find(function (x) { return x.id === paidId; });
      if (inv3) {
        var amt = prompt('Payment amount (USD)\n\nBalance: ' + money(invTotals(inv3).balanceUsd, 'USD'), String(invTotals(inv3).balanceUsd.toFixed(2)));
        if (amt == null) return;
        var val = Number(amt);
        if (!val || val <= 0) { window.vnToast('Enter a positive amount', '⚠️'); return; }
        var method = prompt('Method (M-Pesa / Bank / Card / Other):', 'M-Pesa') || 'Other';
        var ref = prompt('Reference code (e.g. M-Pesa confirmation code) — optional:', '') || '';
        inv3.payments = inv3.payments || [];
        inv3.payments.push({ usd: val, method: method, ref: ref, date: todayISO() });
        if (invTotals(inv3).balanceUsd <= 0.005) inv3.status = 'paid';
        save(list); renderSaved();
        if (state.editingId === inv3.id) { syncFromSaved(inv3.id); renderAll(); }
        window.vnToast('Payment recorded for ' + inv3.number, '💰');
      }
    } else if (delId) {
      if (!confirm('Delete this invoice? This cannot be undone (export a backup first if unsure).')) return;
      save(list.filter(function (x) { return x.id !== delId; }));
      if (state.editingId === delId) { resetState(); renderAll(); }
      else renderSaved();
      window.vnToast('Invoice deleted', '🗑️');
    }
  }

  /* ── Sync + reset ── */
  function syncFromSaved(id) {
    var inv = load().find(function (x) { return x.id === id; });
    if (!inv) return;
    state = JSON.parse(JSON.stringify(inv));
    state.editingId = inv.id;
    syncInputs();
  }
  function syncInputs() {
    $('#cl-name').value = state.client.name;
    $('#cl-email').value = state.client.email;
    $('#cl-company').value = state.client.company;
    $('#cl-address').value = state.client.address;
    $('#invVat').checked = state.vatOn;
    $('#invDiscount').value = state.discountPct;
    $('#invIssue').value = state.issue;
    $('#invDue').value = state.due;
    $('#invNotes').value = state.notes;
    $('#invFx').value = state.fx;
    renderItems();
  }
  function resetState() {
    state = {
      number: null,
      client: { name: '', email: '', company: '', address: '' },
      items: [{ desc: '', qty: 1, rateUsd: 0 }],
      currency: 'USD', fx: DEFAULT_FX, vatOn: false, discountPct: 0,
      issue: todayISO(), due: addDaysISO(7),
      notes: 'Thank you — payment details below. Deposit schedules available on request.',
      status: 'draft', payments: [], editingId: null
    };
    syncInputs();
  }
  function renderAll() { renderItems(); renderSummary(); renderDoc(); renderSaved(); }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('#invDoc')) return;
    resetState();
    renderAll();
    bind();
    /* Offer the last estimate proactively */
    try {
      var est = JSON.parse(localStorage.getItem('vn_last_estimate') || 'null');
      if (est) {
        var box = $('#invEstimateHint');
        box.hidden = false;
        $('#invEstimateHintText').textContent = 'Assistant estimate found: ' + est.service + ' · ' + est.range + ' — one click turns it into a line item.';
      }
    } catch (e) { /* ignore */ }
  });
})();
