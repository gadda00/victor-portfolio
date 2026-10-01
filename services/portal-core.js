/* ═══════════════════════════════════════════════════════════════════
   Victor Ndunda — Client Portal CORE v2.0 (v13 "Client Workspace")
   ═══════════════════════════════════════════════════════════════════
   Zero-backend, zero-knowledge client workspace for a static site:

   AUTH     PBKDF2-SHA256 (210,000 iters) with SPLIT SALTS —
            saltAuth derives the stored verifier (login check),
            saltKey derives the AES vault key (never stored).
            Stealing localStorage yields ciphertext + a hash that
            cannot decrypt anything.

   VAULT    AES-GCM-256, fresh 96-bit IV on every save. All project,
            payment, retainer and message data is encrypted at rest
            in the client's browser. Nothing readable leaves the
            device except what the client explicitly shares.

   ENGINE   7-stage project pipeline, payment schedules (50/50,
            milestone, monthly), retainer lifecycle, receipts.

   EVENTS   Every meaningful client action notifies the owner via
            Web3Forms (email) + logs locally for the owner dashboard.
            Share codes (VN1.<b64>) bridge client → owner dashboard.

   Modules: window.VNPortalCore (auth + vault + engine + notify)
   UI:      services/portal.js (renders everything)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────── */
  var AUTH_KEY = 'vn_portal_auth';
  var SESSION_KEY = 'vn_portal_session';
  var REMEMBER_KEY = 'vn_portal_remember';
  var EVENTS_KEY = 'vn_portal_events';
  var LEGACY_BRIEFS_KEY = 'vn_client_briefs'; // pre-v13 plaintext briefs
  var WEB3FORMS_KEY = '4bf37d31-374a-4f3e-add6-3d2e36f7b784';
  var OWNER_EMAIL = 'mututandunda@gmail.com';
  var PBKDF2_ITERS = 210000;
  var SESSION_IDLE_MS = 30 * 60 * 1000;      // 30 minutes
  var REMEMBER_DAYS = 7;

  var STORAGE = (function () {
    try { localStorage.setItem('__vn_t', '1'); localStorage.removeItem('__vn_t'); return localStorage; }
    catch (e) { return null; } // private mode — degrade gracefully
  })();

  /* ── The 7-stage delivery pipeline ─────────────────────────────── */
  var STAGES = [
    { id: 'discovery', label: 'Discovery', icon: '🔎', desc: 'Goals, scope and success metrics locked' },
    { id: 'design', label: 'Solution Design', icon: '📐', desc: 'Architecture and delivery plan agreed' },
    { id: 'contract', label: 'Contract & Deposit', icon: '📝', desc: 'Terms agreed, deposit invoice issued' },
    { id: 'build', label: 'Build', icon: '🛠️', desc: 'Development sprints with weekly demos' },
    { id: 'review', label: 'Review & QA', icon: '✅', desc: 'UAT, feedback rounds, hardening' },
    { id: 'launch', label: 'Launch', icon: '🚀', desc: 'Go-live, handover and team training' },
    { id: 'support', label: 'Support & Growth', icon: '🛡️', desc: 'Retainer, monitoring, iterations' }
  ];

  /* ── Bytes ↔ base64 helpers ────────────────────────────────────── */
  function b64FromBytes(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function bytesFromB64(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function randomB64(n) { return b64FromBytes(crypto.getRandomValues(new Uint8Array(n))); }

  /* ── PBKDF2-SHA256 → 256-bit key (base64) ──────────────────────── */
  async function derive(password, saltB64, iterations) {
    var keyMaterial = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: bytesFromB64(saltB64), iterations: iterations, hash: 'SHA-256' },
      keyMaterial, 256);
    return b64FromBytes(new Uint8Array(bits));
  }

  /* ── AES-GCM-256 (iv prepended to ciphertext) ──────────────────── */
  async function aesEncrypt(keyB64, plaintext) {
    var key = await crypto.subtle.importKey('raw', bytesFromB64(keyB64), 'AES-GCM', false, ['encrypt']);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plaintext)));
    var out = new Uint8Array(iv.length + ct.length);
    out.set(iv, 0); out.set(ct, iv.length);
    return b64FromBytes(out);
  }
  async function aesDecrypt(keyB64, blobB64) {
    var key = await crypto.subtle.importKey('raw', bytesFromB64(keyB64), 'AES-GCM', false, ['decrypt']);
    var all = bytesFromB64(blobB64);
    var iv = all.slice(0, 12);
    var ct = all.slice(12);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new TextDecoder().decode(pt);
  }

  /* ── Storage primitives (all fail-safe) ────────────────────────── */
  function storeGet(key) {
    if (!STORAGE) return null;
    try { return STORAGE.getItem(key); } catch (e) { return null; }
  }
  function storeSet(key, val) {
    if (!STORAGE) return false;
    try { STORAGE.setItem(key, val); return true; } catch (e) { return false; }
  }
  function storeDel(key) {
    if (!STORAGE) return;
    try { STORAGE.removeItem(key); } catch (e) {}
  }

  /* ── Auth record ───────────────────────────────────────────────── */
  function getAuthRecord() {
    try { return JSON.parse(storeGet(AUTH_KEY) || 'null'); } catch (e) { return null; }
  }
  function setAuthRecord(rec) { storeSet(AUTH_KEY, JSON.stringify(rec)); }

  var session = { email: null, name: null, vaultKey: null, lastActivity: 0 };

  /* ── Vault (encrypted project store) ───────────────────────────── */
  function emptyVault(rec) {
    return {
      version: 2,
      profile: { name: rec.name, email: rec.email, company: rec.company || '', phone: '', createdAt: new Date().toISOString() },
      projects: [],
      notifications: [],
      createdAt: new Date().toISOString()
    };
  }

  var vault = null; // decrypted in-memory vault

  async function persistVault() {
    if (!vault || !session.vaultKey) return;
    var rec = getAuthRecord();
    if (!rec) return;
    try {
      rec.vault = await aesEncrypt(session.vaultKey, JSON.stringify(vault));
      rec.vaultSavedAt = new Date().toISOString();
      // never keep PII in the cleartext record — name/company live in the vault
      delete rec.name;
      delete rec.company;
      setAuthRecord(rec);
    } catch (e) { /* storage failure — session continues in memory */ }
  }

  async function unlockVault(key) {
    var rec = getAuthRecord();
    if (!rec || !rec.vault) { vault = emptyVault(rec); return vault; }
    try {
      vault = JSON.parse(await aesDecrypt(key, rec.vault));
    } catch (e) {
      throw new Error('Vault could not be decrypted. Wrong password or corrupted data.');
    }
    return vault;
  }

  /* ── Signup / login / logout ───────────────────────────────────── */
  function validateSignup(name, email, password) {
    if (!name || name.trim().length < 2) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return 'Please enter a valid email address.';
    if (!password || password.length < 8) return 'Password must be at least 8 characters.';
    if (getAuthRecord() && getAuthRecord().email && getAuthRecord().email.toLowerCase() === email.toLowerCase()) {
      return 'An account for ' + email + ' already exists on this device. Sign in instead.';
    }
    return null;
  }

  async function signup(name, email, company, password, remember) {
    var err = validateSignup(name, email, password);
    if (err) throw new Error(err);

    var saltAuth = randomB64(16);
    var saltKey = randomB64(16);
    var authHash = await derive(password, saltAuth, PBKDF2_ITERS);
    var vaultKey = await derive(password, saltKey, PBKDF2_ITERS);

    var rec = {
      v: 2,
      email: email.toLowerCase(),   // only the email is stored in the clear
      saltAuth: saltAuth,
      authHash: authHash,
      saltKey: saltKey,
      vault: null,
      createdAt: new Date().toISOString()
    };

    vault = emptyVault({ name: name, email: email.toLowerCase(), company: company });

    // persistVault reads the stored record, so save it first — then set the
    // session key explicitly so the first vault write is encrypted immediately.
    setAuthRecord(rec);
    session.vaultKey = vaultKey;
    await persistVault();

    migrateLegacyBriefs();
    startSession(remember);
    notifyOwner('New client portal signup', {
      'Client Name': name,
      'Email': email,
      'Company': company || '—',
      'Device': navigator.userAgent.substring(0, 90)
    });
    logEvent('auth', 'Account created for ' + email);
    return vault;
  }

  async function login(email, password, remember) {
    var rec = getAuthRecord();
    if (!rec || !rec.email) throw new Error('No account found on this device. Create one first.');
    if (rec.email.toLowerCase() !== (email || '').toLowerCase()) {
      throw new Error('This browser holds an account for ' + rec.email + '. Use that email, or clear the portal data in Settings.');
    }
    var authHash = await derive(password, rec.saltAuth, PBKDF2_ITERS);
    // constant-time compare
    var a = authHash, b = rec.authHash, diff = 0;
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    if (diff !== 0) throw new Error('Incorrect password.');

    session.vaultKey = await derive(password, rec.saltKey, PBKDF2_ITERS);
    await unlockVault(session.vaultKey);
    migrateLegacyBriefs();
    startSession(remember);
    logEvent('auth', 'Signed in');
    return vault;
  }

  function startSession(remember) {
    var rec = getAuthRecord();
    session.email = rec.email;
    session.name = vault ? vault.profile.name : rec.email;
    session.lastActivity = Date.now();

    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      email: session.email, vaultKey: session.vaultKey, lastActivity: session.lastActivity
    })); } catch (e) {}

    if (remember) {
      storeSet(REMEMBER_KEY, JSON.stringify({
        email: session.email, vaultKey: session.vaultKey,
        expiresAt: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
      }));
    }
  }

  /* Restores a session if it is still valid. Returns true when the
     vault is unlocked and ready. */
  async function restoreSession() {
    // 1) live tab session
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (s && Date.now() - s.lastActivity < SESSION_IDLE_MS) {
        session.email = s.email; session.vaultKey = s.vaultKey; session.lastActivity = s.lastActivity;
        await unlockVault(s.vaultKey);
        return true;
      }
      if (s) sessionStorage.removeItem(SESSION_KEY);
    } catch (e) { /* fallthrough */ }

    // 2) remember-me (7 days)
    try {
      var r = JSON.parse(storeGet(REMEMBER_KEY) || 'null');
      if (r && Date.now() < r.expiresAt) {
        session.email = r.email; session.vaultKey = r.vaultKey; session.lastActivity = Date.now();
        await unlockVault(r.vaultKey);
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          email: r.email, vaultKey: r.vaultKey, lastActivity: Date.now()
        })); } catch (e) {}
        return true;
      }
      if (r) storeDel(REMEMBER_KEY);
    } catch (e) { /* fallthrough */ }

    return false;
  }

  function touchSession() {
    session.lastActivity = Date.now();
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (s) { s.lastActivity = Date.now(); sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
    } catch (e) {}
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    storeDel(REMEMBER_KEY);
    session.email = null; session.name = null; session.vaultKey = null;
    vault = null;
    logEvent('auth', 'Signed out');
  }

  /* ── Legacy brief migration (pre-v13 plaintext) ────────────────── */
  function migrateLegacyBriefs() {
    if (!vault) return 0;
    try {
      var raw = storeGet(LEGACY_BRIEFS_KEY);
      if (!raw) return 0;
      var briefs = JSON.parse(raw);
      if (!Array.isArray(briefs) || !briefs.length) return 0;
      var imported = 0;
      briefs.forEach(function (b) {
        if (!b || !b.id) return;
        if (vault.projects.some(function (p) { return p.briefId === b.id; })) return;
        vault.projects.push(projectFromBrief(b));
        imported++;
      });
      if (imported > 0) {
        persistVault();
        notifyOwner('Legacy briefs migrated to encrypted portal', {
          'Client': vault.profile.email, 'Briefs migrated': String(imported)
        });
      }
      return imported;
    } catch (e) { return 0; }
  }

  /* ── Project engine ────────────────────────────────────────────── */
  function freshStages() {
    return STAGES.map(function (s) {
      return { id: s.id, status: 'pending', doneAt: null, note: '' };
    });
  }

  function projectFromBrief(b) {
    var est = b.estimate || {};
    var p = {
      id: 'P-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10),
      briefId: b.id || null,
      createdAt: new Date().toISOString(),
      name: est.packageName ? est.packageName + ' — ' + (est.timeline || 'AI Engagement')
                            : 'AI Engagement',
      packageId: est.packageId || 'custom',
      packageName: est.packageName || 'Custom',
      estimate: {
        totalUsd: est.totalUsd || 0, totalKes: est.totalKes || 0,
        monthlyUsd: est.monthlyUsd || 0, monthlyKes: est.monthlyKes || 0,
        timeline: est.timeline || ''
      },
      brief: b,
      status: 'scoping',        // scoping | contracted | active | delivered
      stages: freshStages(),
      payments: [],
      paymentPlanType: null,
      retainer: null,
      documents: [],
      messages: [],
      activity: [{ at: new Date().toISOString(), text: 'Project created from scope wizard brief' }]
    };
    completeStage(p, 'discovery');
    return p;
  }

  function getProject(id) {
    if (!vault) return null;
    return vault.projects.find(function (p) { return p.id === id; }) || null;
  }
  function findProjectByBrief(briefId) {
    if (!vault) return null;
    return vault.projects.find(function (p) { return p.briefId === briefId; }) || null;
  }

  function addProject(brief) {
    if (!vault) return null;
    var existing = brief ? findProjectByBrief(brief.id) : null;
    if (existing) return existing;
    var p = projectFromBrief(brief);
    vault.projects.push(p);
    persistVault();
    notifyOwner('New project in client portal', {
      'Client': vault.profile.email,
      'Package': p.packageName,
      'Estimate (USD)': '$' + (p.estimate.totalUsd || 0).toLocaleString(),
      'Estimate (KES)': 'KES ' + (p.estimate.totalKes || 0).toLocaleString()
    });
    logEvent('project', 'Project created: ' + p.packageName);
    return p;
  }

  function completeStage(p, stageId, note) {
    var st = (p.stages || []).find(function (s) { return s.id === stageId; });
    if (!st || st.status === 'done') return;
    st.status = 'done';
    st.doneAt = new Date().toISOString();
    if (note) st.note = note;
    var labels = {};
    STAGES.forEach(function (s) { labels[s.id] = s.label; });
    p.activity.push({ at: new Date().toISOString(), text: 'Stage completed: ' + (labels[stageId] || stageId) + (note ? ' — ' + note : '') });
    deriveStatus(p);
    persistVault();
  }
  function activeStage(p, stageId) {
    var st = (p.stages || []).find(function (s) { return s.id === stageId; });
    if (!st || st.status === 'done') return;
    st.status = 'active';
    persistVault();
  }

  function deriveStatus(p) {
    var done = (p.stages || []).filter(function (s) { return s.status === 'done'; }).length;
    if (p.status === 'delivered') return;
    if (done >= 6) p.status = 'delivered';
    else if (done >= 4) p.status = 'active';
    else if (done >= 3) p.status = 'contracted';
    else p.status = 'scoping';
  }

  function progress(p) {
    var stages = p.stages || [];
    if (!stages.length) return 0;
    var score = stages.reduce(function (acc, s) {
      return acc + (s.status === 'done' ? 1 : s.status === 'active' ? 0.5 : 0);
    }, 0);
    return Math.round((score / stages.length) * 100);
  }

  /* ── Payment engine ────────────────────────────────────────────── */
  function dayISO(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + (offsetDays || 0));
    return d.toISOString().slice(0, 10);
  }

  function buildPaymentPlan(p, type) {
    var usd = p.estimate.totalUsd || 0;
    var kes = p.estimate.totalKes || 0;
    var installments;
    if (type === 'milestone') {
      installments = [
        { n: 1, label: 'Kickoff (30%)', share: 0.30, dueOffset: 0 },
        { n: 2, label: 'Midpoint (40%)', share: 0.40, dueOffset: 21 },
        { n: 3, label: 'Delivery (30%)', share: 0.30, dueOffset: 42 }
      ];
    } else if (type === 'monthly') {
      installments = [
        { n: 1, label: 'Build (100%)', share: 1.0, dueOffset: 0 }
      ];
    } else { // fifty-fifty (default)
      installments = [
        { n: 1, label: 'Deposit (50%)', share: 0.50, dueOffset: 0 },
        { n: 2, label: 'On delivery (50%)', share: 0.50, dueOffset: 30 }
      ];
    }
    p.paymentPlanType = type;
    p.payments = installments.map(function (i) {
      return {
        n: i.n, label: i.label,
        usd: Math.round(usd * i.share),
        kes: Math.round(kes * i.share),
        dueDate: dayISO(i.dueOffset),
        status: 'due',        // due | sent | paid
        paidAt: null, method: null, ref: null
      };
    });
    p.activity.push({ at: new Date().toISOString(), text: 'Payment plan selected: ' + type });
    completeStage(p, 'contract', 'Payment plan: ' + type);

    if (type === 'monthly') startRetainer(p);
    persistVault();
    notifyOwner('Payment plan selected', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Plan': type,
      'Total': '$' + usd.toLocaleString() + ' / KES ' + kes.toLocaleString()
    });
    logEvent('payment', 'Payment plan chosen (' + type + ')');
    return p.payments;
  }

  function markPaymentPaid(p, n, method, ref) {
    var pay = (p.payments || []).find(function (x) { return x.n === n; });
    if (!pay || pay.status === 'paid') return null;
    pay.status = 'paid';
    pay.paidAt = new Date().toISOString();
    pay.method = method || '';
    pay.ref = (ref || '').trim();

    p.activity.push({ at: pay.paidAt, text: 'Payment marked paid: ' + pay.label + ' ($' + pay.usd.toLocaleString() + ')' + (pay.ref ? ' ref ' + pay.ref : '') });

    if (n === 1) {
      completeStage(p, 'build', 'Deposit received' + (pay.ref ? ' — ref ' + pay.ref : ''));
    }
    var all = p.payments || [];
    if (all.length && all.every(function (x) { return x.status === 'paid'; })) {
      completeStage(p, 'review');
      completeStage(p, 'launch');
    }
    persistVault();

    notifyOwner('PAYMENT marked paid — please verify & issue receipt', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Installment': pay.label,
      'Amount': '$' + pay.usd.toLocaleString() + ' / KES ' + pay.kes.toLocaleString(),
      'Method': method || '—',
      'Client ref / M-Pesa code': pay.ref || '—',
      'Paid at': pay.paidAt
    });
    logEvent('payment', 'Installment marked paid (' + pay.label + ')');
    return pay;
  }

  function totals(p) {
    var pays = p.payments || [];
    var paidUsd = pays.filter(function (x) { return x.status === 'paid'; }).reduce(function (a, x) { return a + (x.usd || 0); }, 0);
    var totalUsd = pays.reduce(function (a, x) { return a + (x.usd || 0); }, 0) || (p.estimate.totalUsd || 0);
    var dueUsd = Math.max(0, totalUsd - paidUsd);
    return { paidUsd: paidUsd, totalUsd: totalUsd, dueUsd: dueUsd, pct: totalUsd ? Math.round((paidUsd / totalUsd) * 100) : 0 };
  }

  function nextPayment(p) {
    var pays = (p.payments || []).filter(function (x) { return x.status !== 'paid'; });
    if (!pays.length) return null;
    return pays.slice().sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; })[0];
  }

  /* ── Retainer engine (after-sales) ─────────────────────────────── */
  function startRetainer(p) {
    if (!p.estimate.monthlyUsd) return null;
    var now = new Date();
    var next = new Date(now); next.setMonth(next.getMonth() + 1);
    p.retainer = {
      active: true,
      monthlyUsd: p.estimate.monthlyUsd,
      monthlyKes: p.estimate.monthlyKes || 0,
      startedAt: now.toISOString(),
      nextRenewal: next.toISOString().slice(0, 10),
      cycle: 'monthly',
      requestsThisCycle: 0,
      history: []
    };
    completeStage(p, 'support', 'Retainer started at $' + p.estimate.monthlyUsd + '/mo');
    persistVault();
    notifyOwner('Retainer started', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Monthly': '$' + p.estimate.monthlyUsd + '/mo',
      'Next renewal': p.retainer.nextRenewal
    });
    logEvent('retainer', 'Retainer started');
    return p.retainer;
  }

  function retainerDaysLeft(r) {
    if (!r || !r.active) return null;
    var days = Math.ceil((new Date(r.nextRenewal + 'T00:00:00') - Date.now()) / 86400000);
    return days;
  }

  function logRetainerRequest(p, summary) {
    if (!p.retainer || !p.retainer.active) return null;
    p.retainer.requestsThisCycle++;
    p.retainer.history.push({ at: new Date().toISOString(), summary: summary || 'Support request' });
    p.activity.push({ at: new Date().toISOString(), text: 'Retainer request: ' + (summary || 'support') });
    persistVault();
    notifyOwner('Retainer support request', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Request': summary || 'Support request',
      'SLA': '4-hour response (business hours)'
    });
    logEvent('retainer', 'Support request logged');
    return p.retainer;
  }

  function cancelRetainer(p, reason) {
    if (!p.retainer) return;
    p.retainer.active = false;
    p.retainer.cancelledAt = new Date().toISOString();
    p.retainer.cancelReason = reason || '';
    p.activity.push({ at: p.retainer.cancelledAt, text: 'Retainer cancelled (30-day notice)' });
    persistVault();
    notifyOwner('Retainer cancellation notice', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Reason': reason || '—',
      'Notice policy': '30 days — ends ' + dayISO(30)
    });
    logEvent('retainer', 'Retainer cancelled');
  }

  /* ── Documents ─────────────────────────────────────────────────── */
  function recordDocument(p, type, summary) {
    p.documents = p.documents || [];
    p.documents.push({ type: type, summary: summary || '', createdAt: new Date().toISOString() });
    if (type === 'contract') completeStage(p, 'contract', 'Contract generated');
    p.activity.push({ at: new Date().toISOString(), text: 'Document generated: ' + type });
    persistVault();
  }

  /* ── Messages ──────────────────────────────────────────────────── */
  function addMessage(p, text) {
    var msg = { id: 'M' + Date.now().toString(36), from: 'client', text: text, at: new Date().toISOString() };
    p.messages = p.messages || [];
    p.messages.push(msg);
    persistVault();
    notifyOwner('New client message', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Message': text.substring(0, 500)
    });
    logEvent('message', 'Message sent to Victor');
    return msg;
  }

  /* ── Owner notifications (Web3Forms → email) ───────────────────── */
  function notifyOwner(subject, fields) {
    try {
      var fd = new FormData();
      fd.append('access_key', WEB3FORMS_KEY);
      fd.append('subject', '[PORTAL] ' + subject);
      fd.append('from_name', 'Victor Ndunda — Client Portal');
      var lines = [];
      Object.keys(fields || {}).forEach(function (k) { lines.push(k + ': ' + fields[k]); });
      fd.append('message', lines.join('\n'));
      fd.append('replyto', (vault && vault.profile && vault.profile.email) || OWNER_EMAIL);
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .catch(function () { /* never block the UX */ });
    } catch (e) { /* non-fatal */ }
  }

  /* ── Event log (owner dashboard + share codes) ─────────────────── */
  function logEvent(type, text) {
    try {
      var arr = JSON.parse(storeGet(EVENTS_KEY) || '[]');
      arr.unshift({ at: new Date().toISOString(), type: type, text: text, email: session.email || (vault && vault.profile.email) || null });
      if (arr.length > 100) arr.length = 100;
      storeSet(EVENTS_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  /* ── Share codes: client → owner dashboard bridge ──────────────── */
  function b64urlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }

  function makeShareCode(projectId) {
    var p = getProject(projectId);
    if (!p) return null;
    var snap = {
      v: 1,
      kind: 'vn-portal-project',
      exportedAt: new Date().toISOString(),
      project: {
        id: p.id, name: p.name, packageId: p.packageId, packageName: p.packageName,
        status: p.status, progress: progress(p),
        estimate: p.estimate,
        paymentPlanType: p.paymentPlanType,
        payments: (p.payments || []).map(function (x) {
          return { label: x.label, usd: x.usd, kes: x.kes, status: x.status, paidAt: x.paidAt, ref: x.ref, method: x.method };
        }),
        retainer: p.retainer ? { active: p.retainer.active, monthlyUsd: p.retainer.monthlyUsd, nextRenewal: p.retainer.nextRenewal } : null,
        stages: p.stages, activity: (p.activity || []).slice(-10),
        documents: p.documents
      },
      client: vault.profile
    };
    return 'VN1.' + b64urlEncode(JSON.stringify(snap));
  }

  function decodeShareCode(code) {
    try {
      var s = String(code || '').trim();
      if (s.indexOf('VN1.') !== 0) throw new Error('Not a portal share code');
      var obj = JSON.parse(b64urlDecode(s.slice(4)));
      if (obj.kind !== 'vn-portal-project') throw new Error('Wrong code type');
      return obj;
    } catch (e) { return null; }
  }

  /* ── Settings / data control ───────────────────────────────────── */
  async function changePassword(currentPw, newPw) {
    var rec = getAuthRecord();
    if (!rec) throw new Error('No account.');
    if (newPw.length < 8) throw new Error('New password must be at least 8 characters.');

    var curHash = await derive(currentPw, rec.saltAuth, PBKDF2_ITERS);
    var diff = 0, a = curHash, b = rec.authHash;
    for (var i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    if (diff !== 0) throw new Error('Current password is incorrect.');

    // rotate salts + re-encrypt vault under new key
    var oldKey = session.vaultKey || await derive(currentPw, rec.saltKey, PBKDF2_ITERS);
    if (!vault) await unlockVault(oldKey);

    rec.saltAuth = randomB64(16);
    rec.saltKey = randomB64(16);
    rec.authHash = await derive(newPw, rec.saltAuth, PBKDF2_ITERS);
    var newKey = await derive(newPw, rec.saltKey, PBKDF2_ITERS);
    session.vaultKey = newKey;
    await persistVault();       // encrypt with new key (rec already has new salts)
    setAuthRecord(rec);
    // refresh stored sessions with the new key
    storeDel(REMEMBER_KEY);
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    startSession(false);
    logEvent('auth', 'Password changed');
    return true;
  }

  function exportBackup() {
    if (!vault) return null;
    return JSON.stringify({ exportedAt: new Date().toISOString(), vault: vault }, null, 2);
  }

  function deleteAccount() {
    storeDel(AUTH_KEY); storeDel(REMEMBER_KEY); storeDel(EVENTS_KEY);
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    session.email = null; session.name = null; session.vaultKey = null; vault = null;
  }

  /* ── Public API ────────────────────────────────────────────────── */
  window.VNPortalCore = {
    STAGES: STAGES,
    PBKDF2_ITERS: PBKDF2_ITERS,
    SESSION_IDLE_MS: SESSION_IDLE_MS,
    signup: signup,
    login: login,
    restoreSession: restoreSession,
    logout: logout,
    touchSession: touchSession,
    isAuthed: function () { return !!vault && !!session.vaultKey; },
    session: session,

    // vault access
    vault: function () { return vault; },
    profile: function () { return vault ? vault.profile : null; },
    persistVault: persistVault,
    migrateLegacyBriefs: migrateLegacyBriefs,

    // projects
    addProject: addProject,
    getProject: getProject,
    findProjectByBrief: findProjectByBrief,
    completeStage: completeStage,
    activeStage: activeStage,
    progress: progress,

    // payments
    buildPaymentPlan: buildPaymentPlan,
    markPaymentPaid: markPaymentPaid,
    totals: totals,
    nextPayment: nextPayment,

    // retainer
    startRetainer: startRetainer,
    retainerDaysLeft: retainerDaysLeft,
    logRetainerRequest: logRetainerRequest,
    cancelRetainer: cancelRetainer,

    // docs & messages
    recordDocument: recordDocument,
    addMessage: addMessage,

    // notifications & share
    notifyOwner: notifyOwner,
    logEvent: logEvent,
    makeShareCode: makeShareCode,
    decodeShareCode: decodeShareCode,
    getEvents: function () { try { return JSON.parse(storeGet(EVENTS_KEY) || '[]'); } catch (e) { return []; } },

    // settings
    changePassword: changePassword,
    exportBackup: exportBackup,
    deleteAccount: deleteAccount,
    getAuthEmail: function () { var r = getAuthRecord(); return r ? r.email : null; }
  };

  /* ── Self-boot ─────────────────────────────────────────────────────
     Restore any saved session on every page that loads this module, so
     contract / payment / invoice / wizard pages can silently sync into
     the vault. The portal page's own boot() is idempotent — a second
     restore just re-reads the same stored session. */
  try { restoreSession().catch(function () {}); } catch (e) { /* non-fatal */ }
})();
