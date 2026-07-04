/* Victor Ndunda — Contract Generator
   - Reads brief from localStorage by ?brief=ID
   - Renders HTML contract
   - PDF download via jsPDF
*/
(function () {
  'use strict';

  function $(s) { return document.querySelector(s); }

  // ── Theme bootstrap ───────────────────────────────────────────────
  var stored = localStorage.getItem('theme');
  var theme = stored || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
  var tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', function () {
    var cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var nxt = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.remove(cur);
    document.documentElement.classList.add(nxt);
    localStorage.setItem('theme', nxt);
  });
  var mt = $('#mobileToggle');
  var nl = $('#navLinks');
  if (mt && nl) mt.addEventListener('click', function () {
    nl.classList.toggle('open');
    mt.setAttribute('aria-expanded', nl.classList.contains('open') ? 'true' : 'false');
  });

  // ── Get brief ID from URL ─────────────────────────────────────────
  function getBriefId() {
    var params = new URLSearchParams(location.search);
    return params.get('brief');
  }

  function getBriefs() {
    try {
      var raw = localStorage.getItem('vn_client_briefs');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function getBrief(id) {
    return getBriefs().find(function (b) { return b.id === id; });
  }

  // ── Package details ───────────────────────────────────────────────
  var PACKAGES = {
    audit: { name: 'AI Audit', timeline: '1–2 weeks', features: ['Current-state assessment','Opportunity map (5–10 ranked use cases)','Quick-win pilot plan','Make-vs-buy recommendation','Risk + compliance review','Executive readout + 12-month roadmap'] },
    starter: { name: 'AI Starter', timeline: '2–3 weeks', features: ['WhatsApp or web FAQ chatbot','1 automation workflow','Knowledge base (50 docs)','Basic analytics dashboard','Multilingual (EN + SW)','2 revisions + 30 days support'] },
    growth: { name: 'AI Growth', timeline: '4–8 weeks', features: ['Production AI integrated with CRM/ERP','Multi-agent orchestration','RAG with citations','Analytics + dashboard','Team training (1 session)','3 revisions + 90 days support'] },
    enterprise: { name: 'AI Enterprise', timeline: '8–16 weeks', features: ['Custom multi-agent system (50+ agents)','Fine-tuned models','SLAs + 24/7 monitoring','Security + compliance review','Dedicated engineer','Unlimited revisions + 12 months support'] }
  };

  // ── Generate contract ─────────────────────────────────────────────
  function generateContract(brief) {
    var details = brief.details || {};
    var est = brief.estimate || {};
    var state = brief.state || {};
    var pkg = PACKAGES[est.packageId] || PACKAGES.growth;
    var today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    var contractId = 'VND-' + (brief.id || Date.now()).slice(-8).toUpperCase();

    var featuresHtml = pkg.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    var typesHtml = (state.types || []).map(function (t) { return '<li>' + t.replace(/-/g, ' ') + '</li>'; }).join('');

    var priceText = est.packageId === 'enterprise'
      ? 'Custom — to be scoped after discovery call (typical range: USD $25,000–$100,000+ build, USD $5,000–$20,000/month support)'
      : 'USD $' + (est.totalUsd || 0).toLocaleString() + ' (KES ' + (est.totalKes || 0).toLocaleString() + ') one-time' +
        (est.monthlyUsd ? ' plus USD $' + est.monthlyUsd + '/month (KES ' + (est.monthlyKes || 0).toLocaleString() + '/month) for ongoing support' : '');

    var timelineText = est.timeline || pkg.timeline;

    return '' +
    '<h1>AI Services Agreement</h1>' +
    '<div class="contract-subtitle">Contract ID: ' + contractId + ' · Generated: ' + today + '</div>' +

    '<div class="contract-meta">' +
      '<div class="contract-meta-row"><div class="contract-meta-label">Service Provider</div><div class="contract-meta-value">Victor Ndunda<br/>Nairobi, Kenya<br/>mututandunda@gmail.com<br/>+254 724 346 971</div></div>' +
      '<div class="contract-meta-row"><div class="contract-meta-label">Client</div><div class="contract-meta-value">' + (details.name || '_____') + '<br/>' + (details.company || '_____') + '<br/>' + (details.email || '_____') + '<br/>' + (details.phone || '_____') + '</div></div>' +
    '</div>' +

    '<h2>1. Project Overview</h2>' +
    '<p>This Agreement governs the provision of AI engineering services by Victor Ndunda ("Service Provider") to ' + (details.name || 'the Client') + ' ("Client"), commencing upon signature and full payment of the deposit.</p>' +
    (details.description ? '<p><strong>Client project description:</strong> ' + details.description + '</p>' : '') +

    '<h2>2. Scope of Work</h2>' +
    '<p>The Service Provider will deliver the <strong>' + pkg.name + '</strong> package, which includes:</p>' +
    '<ul>' + featuresHtml + '</ul>' +
    (typesHtml ? '<p><strong>AI capabilities in scope:</strong></p><ul>' + typesHtml + '</ul>' : '') +

    '<h2>3. Timeline</h2>' +
    '<p>Estimated delivery: <strong>' + timelineText + '</strong> from project kickoff (defined as the date the deposit is received and the discovery call is completed).</p>' +
    '<p>The timeline mode selected is <strong>' + ({ asap: 'Rush (+50% premium)', month: 'Standard', quarter: 'This quarter (−8%)', flexible: 'Flexible (−15% discount)' }[state.timeline] || 'Standard') + '</strong>. Rush timelines may require expedited scheduling.</p>' +

    '<h2>4. Fees and Payment</h2>' +
    '<p><strong>Total project fee:</strong> ' + priceText + '.</p>' +
    '<p>Payment schedule (select one — to be confirmed in discovery call):</p>' +
    '<ul>' +
      '<li><strong>50/50:</strong> 50% deposit on signature, 50% on delivery.</li>' +
      '<li><strong>Milestone-based:</strong> 30% on kickoff, 40% on midpoint review, 30% on delivery.</li>' +
      '<li><strong>Monthly retainer:</strong> One-time build fee + monthly support fee, cancelable with 30 days notice.</li>' +
    '</ul>' +
    '<p>Payment methods accepted: M-Pesa (Paybill), Flutterwave (card/bank/M-Pesa), Stripe (international cards). Invoices are due within 7 days of issuance.</p>' +

    '<h2>5. Client Responsibilities</h2>' +
    '<ul>' +
      '<li>Provide timely access to data, systems, and stakeholders needed for the project.</li>' +
      '<li>Designate a single point of contact for decisions and feedback.</li>' +
      '<li>Respond to review requests within 3 business days to keep the timeline on track.</li>' +
      '<li>Provide content (logos, brand assets, copy) in agreed formats.</li>' +
      '<li>Ensure all provided data is legally obtained and compliant with Kenya DPA 2019 (and GDPR if EU users).</li>' +
    '</ul>' +

    '<h2>6. Revisions and Acceptance</h2>' +
    '<p>The package includes the number of revision rounds specified in the package deliverables. Additional revisions are billed at USD $100/hour. Acceptance is deemed to have occurred 7 days after delivery if no written feedback is received.</p>' +

    '<h2>7. Intellectual Property</h2>' +
    '<p>On full payment, all custom code, models, and documentation created specifically for the Client become the Client\'s property. The Service Provider retains the right to reuse generic components, libraries, and patterns developed during the project. The Service Provider may list the project in their portfolio unless explicitly agreed otherwise in writing.</p>' +

    '<h2>8. Confidentiality</h2>' +
    '<p>Both parties agree to keep confidential all non-public information shared during the project. This obligation survives termination for 3 years.</p>' +

    '<h2>9. Warranties and Liability</h2>' +
    '<p>The Service Provider warrants that the delivered work will be free of material defects for 30 days post-delivery. The Service Provider\'s total liability is limited to the fees paid for the project. Neither party is liable for indirect or consequential damages.</p>' +

    '<h2>10. Termination</h2>' +
    '<p>Either party may terminate this agreement with 14 days written notice. On termination, the Client pays for work completed up to the termination date. Deposits are non-refundable once work has commenced.</p>' +

    '<h2>11. Governing Law</h2>' +
    '<p>This agreement is governed by the laws of the Republic of Kenya. Disputes shall be resolved in the courts of Kenya, unless both parties agree to arbitration in Nairobi.</p>' +

    '<div class="contract-signatures">' +
      '<div class="signature-block">' +
        '<div class="signature-line"></div>' +
        '<div class="signature-label">Victor Ndunda — Service Provider · Date: _____</div>' +
      '</div>' +
      '<div class="signature-block">' +
        '<div class="signature-line"></div>' +
        '<div class="signature-label">' + (details.name || 'Client') + ' — Client · Date: _____</div>' +
      '</div>' +
    '</div>' +

    '<div class="contract-footer">Contract ID: ' + contractId + ' · Generated from victorndunda.com/services/contract.html · This is a draft for discussion. Final agreement signed by both parties.</div>';
  }

  function renderNoBrief() {
    $('#contractPaper').innerHTML =
      '<h1>No brief selected</h1>' +
      '<p style="text-align:center;color:var(--text-muted);margin:2rem 0">It looks like you came here without a saved brief. Start the wizard to generate a contract.</p>' +
      '<div style="text-align:center"><a href="/services/wizard.html" class="btn btn-primary">Start the Wizard →</a></div>';
    var dl = $('#downloadPdf'); if (dl) dl.style.display = 'none';
    var pr = $('#printContract'); if (pr) pr.style.display = 'none';
    var gp = $('#goPayment'); if (gp) gp.style.display = 'none';
  }

  // ── PDF download ──────────────────────────────────────────────────
  function downloadPdf(brief) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library not loaded. Please refresh the page.');
      return;
    }
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF({ unit: 'pt', format: 'a4' });
    var margin = 50;
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var maxWidth = pageWidth - margin * 2;
    var y = margin;

    var details = brief.details || {};
    var est = brief.estimate || {};
    var state = brief.state || {};
    var pkg = PACKAGES[est.packageId] || PACKAGES.growth;
    var today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    var contractId = 'VND-' + (brief.id || Date.now()).slice(-8).toUpperCase();

    function addText(text, opts) {
      opts = opts || {};
      var size = opts.size || 10;
      var style = opts.style || 'normal';
      var spacing = opts.spacing || 6;
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      var lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(function (line) {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += size + spacing;
      });
      y += 4;
    }

    function addHeading(text, size) {
      y += 12;
      if (y > pageHeight - margin - 40) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size || 12);
      doc.text(text, margin, y);
      y += (size || 12) + 4;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('AI Services Agreement', pageWidth / 2, y, { align: 'center' });
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Contract ID: ' + contractId + ' · Generated: ' + today, pageWidth / 2, y, { align: 'center' });
    y += 24;
    doc.setTextColor(20);

    // Parties
    addHeading('Parties');
    addText('Service Provider: Victor Ndunda, Nairobi, Kenya, mututandunda@gmail.com, +254 724 346 971');
    addText('Client: ' + (details.name || '_____') + ', ' + (details.company || '_____') + ', ' + (details.email || '_____') + ', ' + (details.phone || '_____'));

    addHeading('1. Project Overview');
    addText('This Agreement governs the provision of AI engineering services by Victor Ndunda ("Service Provider") to ' + (details.name || 'the Client') + ' ("Client"), commencing upon signature and full payment of the deposit.');
    if (details.description) addText('Client project description: ' + details.description);

    addHeading('2. Scope of Work');
    addText('The Service Provider will deliver the ' + pkg.name + ' package, which includes:');
    pkg.features.forEach(function (f) { addText('• ' + f); });
    if (state.types && state.types.length) {
      addText('AI capabilities in scope:');
      state.types.forEach(function (t) { addText('• ' + t.replace(/-/g, ' ')); });
    }

    addHeading('3. Timeline');
    addText('Estimated delivery: ' + (est.timeline || pkg.timeline) + ' from project kickoff.');
    addText('Timeline mode: ' + ({ asap: 'Rush (+50% premium)', month: 'Standard', quarter: 'This quarter', flexible: 'Flexible' }[state.timeline] || 'Standard'));

    addHeading('4. Fees and Payment');
    var priceText = est.packageId === 'enterprise'
      ? 'Custom — to be scoped after discovery call (typical: USD $25,000-$100,000+ build)'
      : 'USD $' + (est.totalUsd || 0).toLocaleString() + ' (KES ' + (est.totalKes || 0).toLocaleString() + ') one-time' + (est.monthlyUsd ? ' plus USD $' + est.monthlyUsd + '/month support' : '');
    addText('Total project fee: ' + priceText);
    addText('Payment schedule options: 50/50 (50% deposit, 50% on delivery), Milestone-based (30/40/30), or Monthly retainer.');
    addText('Payment methods: M-Pesa, Flutterwave, Stripe. Invoices due within 7 days.');

    addHeading('5. Client Responsibilities');
    ['Provide timely access to data, systems, and stakeholders.', 'Designate a single point of contact.', 'Respond to review requests within 3 business days.', 'Provide content in agreed formats.', 'Ensure data compliance with Kenya DPA 2019 and GDPR.'].forEach(function (r) { addText('• ' + r); });

    addHeading('6. Revisions and Acceptance');
    addText('Package includes the specified revision rounds. Additional revisions billed at USD $100/hour. Acceptance deemed after 7 days without written feedback.');

    addHeading('7. Intellectual Property');
    addText('On full payment, custom code and models become the Client\'s property. Service Provider retains rights to generic components and may list the project in their portfolio unless agreed otherwise.');

    addHeading('8. Confidentiality');
    addText('Both parties keep non-public information confidential. Obligation survives termination for 3 years.');

    addHeading('9. Warranties and Liability');
    addText('30-day defect warranty post-delivery. Total liability limited to fees paid. No indirect/consequential damages.');

    addHeading('10. Termination');
    addText('14 days written notice. Client pays for work completed. Deposits non-refundable once work commenced.');

    addHeading('11. Governing Law');
    addText('Laws of the Republic of Kenya. Disputes resolved in Kenyan courts unless arbitration agreed.');

    // Signatures
    y += 20;
    if (y > pageHeight - margin - 80) { doc.addPage(); y = margin; }
    doc.line(margin, y, margin + 200, y);
    doc.line(pageWidth - margin - 200, y, pageWidth - margin, y);
    y += 14;
    doc.setFontSize(8);
    doc.text('Victor Ndunda — Service Provider · Date: _____', margin, y);
    doc.text((details.name || 'Client') + ' — Client · Date: _____', pageWidth - margin - 200, y);

    doc.save('Victor-Ndunda-Contract-' + contractId + '.pdf');
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    var briefId = getBriefId();
    var brief = briefId ? getBrief(briefId) : null;

    if (!brief) {
      // Try the most recent brief
      var briefs = getBriefs();
      if (briefs.length > 0) {
        brief = briefs[briefs.length - 1];
      }
    }

    if (!brief) {
      renderNoBrief();
      return;
    }

    $('#contractPaper').innerHTML = generateContract(brief);

    // Mark brief as contracted
    brief.status = 'contracted';
    var all = getBriefs();
    var idx = all.findIndex(function (b) { return b.id === brief.id; });
    if (idx >= 0) { all[idx] = brief; localStorage.setItem('vn_client_briefs', JSON.stringify(all)); }

    $('#downloadPdf').addEventListener('click', function () { downloadPdf(brief); });
    $('#printContract').addEventListener('click', function () { window.print(); });
    $('#goPayment').href = '/services/payment.html?brief=' + brief.id;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
