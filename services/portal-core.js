/* ═══════════════════════════════════════════════════════════════════
   Victor Ndunda — Client Portal CORE v3.0 (v21 trust hardening)
   ═══════════════════════════════════════════════════════════════════
   Browser-local encrypted client workspace (DEMO MODE — see
   /trust-boundaries.html and TRUST_BOUNDARIES.md):

   AUTH     PBKDF2-SHA256 (210,000 iters) with SPLIT SALTS —
            saltAuth derives the stored verifier (login check),
            saltKey derives the AES vault key. **The vault key is
            held in memory only** (v21): it is never written to
            localStorage or sessionStorage. Reloading always
            requires the password again; "remember me" remembers
            only the email + expiry. Stealing browser storage yields
            ciphertext + a hash that cannot decrypt anything.

   VAULT    AES-GCM-256, fresh 96-bit IV on every save. All project,
            payment, retainer and message data is encrypted at rest
            in the client's browser. One browser = one account;
            there is no server and no multi-device sync.

   PAYMENTS Explicit state machine (v21):
            due → sent → reported → submitted → verified | rejected
                       (verified → refunded)
            "reported" is the highest state a CLIENT can set.
            verified/rejected/refunded are owner-side actions with
            an immutable per-payment event ledger (minor units,
            provider ref, idempotency key). See TRUST_BOUNDARIES.md.

   SNAPSHOT Snapshot codes (v21, "VN2.<b64url>") bridge client →
           owner dashboard: versioned schema, 7-day expiry, nonce,
           SHA-256 checksum over a canonical payload. UNSIGNED by
           design (no server) — checksums catch corruption, not
           forgery, so imports are ALWAYS marked unverified /
           client-reported. Legacy VN1 codes still import with a
           loud warning.

   EVENTS   Meaningful client actions notify the owner via Web3Forms
            (email; demo-* workspaces never email) and log locally.

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

  /* Snapshot-code (v2) hardening limits */
  var SNAPSHOT_TTL_DAYS = 7;
  var SNAPSHOT_MAX_BYTES = 262144;           // 256 KB encoded
  var NONCES_KEY = 'vn_snapshot_nonces';     // owner-side replay registry

  /* Payment lifecycle — see header. 'due'/'sent' precede a report. */
  var PAYMENT_STATES = ['due', 'sent', 'reported', 'submitted', 'verified', 'rejected', 'refunded'];
  var OWNER_ONLY_STATES = ['submitted', 'verified', 'rejected', 'refunded'];

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

    /* v21 trust hardening: the AES vault key is NEVER written to any
       persistent store. sessionStorage keeps a KEYLESS session marker
       (email + activity time) so the UI can greet a returning tab;
       remember-me keeps only email + expiry so the login form can be
       pre-filled. Unlocking always requires the password again. */
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      v: 3, email: session.email, lastActivity: session.lastActivity
    })); } catch (e) {}

    if (remember) {
      storeSet(REMEMBER_KEY, JSON.stringify({
        v: 3, email: session.email,
        expiresAt: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
      }));
    }
  }

  /* v21: a page load can never auto-unlock the vault (the key is not
     persisted anywhere). restoreSession() therefore always returns
     false; use getRememberedSession() to pre-fill the login form and
     login() to re-derive the key from the stored salt. */
  async function restoreSession() {
    purgeLegacyKeyMaterial();
    return false;
  }

  /* Returns { email, expiresAt } when a remember-me record is still
     valid, or { email, tab: true } for a live keyless tab session. */
  function getRememberedSession() {
    try {
      var r = JSON.parse(storeGet(REMEMBER_KEY) || 'null');
      if (r && r.email && Date.now() < (r.expiresAt || 0)) {
        return { email: r.email, expiresAt: r.expiresAt };
      }
      if (r) storeDel(REMEMBER_KEY);
    } catch (e) { /* fallthrough */ }
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.email && Date.now() - (s.lastActivity || 0) < SESSION_IDLE_MS) {
        return { email: s.email, tab: true };
      }
      if (s) sessionStorage.removeItem(SESSION_KEY);
    } catch (e) { /* fallthrough */ }
    return null;
  }

  function hasAccount() {
    var rec = getAuthRecord();
    return !!(rec && rec.email);
  }

  /* Wipes the in-memory key + decrypted vault (idle while hidden,
     explicit lock, or pre-logout). The keyless remember-me record is
     kept so the client can unlock again with their password. */
  function lockSession() {
    var wasAuthed = !!session.vaultKey;
    session.vaultKey = null;
    session.name = null;
    vault = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    if (wasAuthed) {
      logEvent('auth', 'Workspace locked (key wiped from memory)');
      try { window.dispatchEvent(new CustomEvent('vnportal:locked')); } catch (e) {}
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) return;
    if (session.vaultKey && Date.now() - (session.lastActivity || 0) > SESSION_IDLE_MS) {
      lockSession();
    }
  });

  /* v2 records stored the raw vault key in remember-me (localStorage)
     and the tab session (sessionStorage). v3 never persists it. On
     boot, strip any legacy key material and force a fresh password
     unlock — the email/expiry are preserved for the login form. */
  function purgeLegacyKeyMaterial() {
    try {
      var r = JSON.parse(storeGet(REMEMBER_KEY) || 'null');
      if (r && (r.vaultKey || !r.v)) {
        storeSet(REMEMBER_KEY, JSON.stringify({
          v: 3, email: r.email, expiresAt: r.expiresAt
        }));
      }
    } catch (e) { storeDel(REMEMBER_KEY); }
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.vaultKey) sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
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
    logEvent('auth', 'Signed out (in-memory key wiped)');
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
    } else if (type === 'instalments') { // v18: 3 × 33%, no fees
      installments = [
        { n: 1, label: 'Instalment 1 · kickoff (33%)', share: 0.3333, dueOffset: 0 },
        { n: 2, label: 'Instalment 2 · mid-build (33%)', share: 0.3333, dueOffset: 14 },
        { n: 3, label: 'Instalment 3 · delivery (34%)', share: 0.3334, dueOffset: 30 }
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
        status: 'due',        // due | sent | reported | submitted | verified | rejected | refunded
        events: [],           // immutable transition ledger (v21)
        reportedAt: null, verifiedAt: null, method: null, ref: null
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

  /* ── Payment state machine (v21) ────────────────────────────────
     due → sent → reported → submitted → verified | rejected
                          (verified → refunded)

     'reported' is the highest state a CLIENT can set: it means "I
     believe I paid this" and is never treated as received money.
     submitted/verified/rejected/refunded are owner-side actions
     (dashboard / demo seeding) and each appends an immutable event
     with currency, integer minor units, provider reference and an
     idempotency key. There is no payment provider connected in demo
     mode — see TRUST_BOUNDARIES.md. */

  function paymentEvent(p, pay, from, to, opts) {
    opts = opts || {};
    pay.events = Array.isArray(pay.events) ? pay.events : [];
    pay.events.push({
      id: 'PE' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10),
      at: new Date().toISOString(),
      actor: opts.actor || 'client',
      source: opts.source || 'client-reported',
      from: from, to: to,
      currency: 'USD',
      amountMinor: Math.round((pay.usd || 0) * 100),
      kesMinor: Math.round((pay.kes || 0) * 100),
      provider: opts.provider || pay.method || null,
      providerRef: opts.providerRef || pay.ref || null,
      idempotencyKey: (p.id || 'P') + ':' + (pay.n || 0) + ':' + to + ':' + Date.now().toString(36),
      note: opts.note || ''
    });
    return pay;
  }

  /* Client action: "I've paid this installment" → reported. */
  function reportPayment(p, n, method, ref) {
    var pay = (p.payments || []).find(function (x) { return x.n === n; });
    if (!pay) return null;
    if (['reported', 'submitted', 'verified', 'rejected', 'refunded'].indexOf(pay.status) !== -1) return null;
    var from = pay.status || 'due';
    pay.status = 'reported';
    pay.reportedAt = new Date().toISOString();
    pay.method = method || '';
    pay.ref = (ref || '').trim();
    paymentEvent(p, pay, from, 'reported', {
      actor: 'client', source: 'client-reported',
      note: 'Client reported this payment. Awaiting owner verification.'
    });
    p.activity.push({ at: pay.reportedAt, text: 'Payment reported by client: ' + pay.label + ' ($' + (pay.usd || 0).toLocaleString() + ')' + (pay.ref ? ' ref ' + pay.ref : '') + ' — awaiting verification' });
    persistVault();
    notifyOwner('PAYMENT reported by client — verify before issuing a receipt', {
      'Client': vault.profile.email,
      'Project': p.name,
      'Installment': pay.label,
      'Amount': '$' + (pay.usd || 0).toLocaleString() + ' / KES ' + (pay.kes || 0).toLocaleString(),
      'Method': method || '—',
      'Client ref / M-Pesa code': pay.ref || '—',
      'Reported at': pay.reportedAt,
      'Status': 'CLIENT-REPORTED (not verified) — reconcile against your M-Pesa / bank statement before marking verified.'
    });
    logEvent('payment', 'Installment reported (' + pay.label + ') — awaiting verification');
    return pay;
  }

  /* Owner-side transition (dashboard verify tooling / demo seeding).
     In demo mode this is an explicit, honest owner action recorded in
     the browser — NOT a provider-confirmed webhook. */
  function ownerTransitionPayment(p, n, to, note) {
    var pay = (p.payments || []).find(function (x) { return x.n === n; });
    if (!pay) return null;
    if (OWNER_ONLY_STATES.indexOf(to) === -1) return null;
    var from = pay.status || 'due';
    if (from === to) return null;
    if (from === 'due' && to !== 'submitted') return null; // verify from reported/submitted
    pay.status = to;
    if (to === 'verified') pay.verifiedAt = new Date().toISOString();
    if (to === 'rejected') pay.rejectedAt = new Date().toISOString();
    if (to === 'refunded') pay.refundedAt = new Date().toISOString();
    paymentEvent(p, pay, from, to, { actor: 'owner', source: 'owner-action', note: note || '' });
    p.activity.push({ at: new Date().toISOString(), text: 'Payment ' + to + ' by owner: ' + pay.label + (note ? ' — ' + note : '') });
    if (to === 'verified' && pay.n === 1) {
      completeStage(p, 'build', 'Deposit verified' + (pay.ref ? ' — ref ' + pay.ref : ''));
    }
    var all = p.payments || [];
    if (to === 'verified' && all.length && all.every(function (x) { return x.status === 'verified' || x.status === 'refunded'; })) {
      completeStage(p, 'review');
      completeStage(p, 'launch');
    }
    persistVault();
    return pay;
  }

  /* v13 compat alias — old callers meant "the client says this is paid". */
  function markPaymentPaid(p, n, method, ref) { return reportPayment(p, n, method, ref); }

  function totals(p) {
    var pays = p.payments || [];
    var verifiedUsd = pays.filter(function (x) { return x.status === 'verified'; }).reduce(function (a, x) { return a + (x.usd || 0); }, 0);
    var reportedUsd = pays.filter(function (x) { return x.status === 'reported' || x.status === 'submitted'; }).reduce(function (a, x) { return a + (x.usd || 0); }, 0);
    var refundedUsd = pays.filter(function (x) { return x.status === 'refunded'; }).reduce(function (a, x) { return a + (x.usd || 0); }, 0);
    var totalUsd = pays.reduce(function (a, x) { return a + (x.usd || 0); }, 0) || (p.estimate.totalUsd || 0);
    var dueUsd = Math.max(0, totalUsd - verifiedUsd - reportedUsd);
    return {
      paidUsd: verifiedUsd, verifiedUsd: verifiedUsd,   // paid == verified, always
      reportedUsd: reportedUsd, refundedUsd: refundedUsd,
      totalUsd: totalUsd, dueUsd: dueUsd,
      pct: totalUsd ? Math.round((verifiedUsd / totalUsd) * 100) : 0
    };
  }

  function nextPayment(p) {
    var pays = (p.payments || []).filter(function (x) { return x.status !== 'verified' && x.status !== 'refunded'; });
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
    // v18: demo workspaces never email the owner
    try {
      if (vault && vault.profile && String(vault.profile.email).indexOf('demo-') === 0) return;
    } catch (e) { /* fall through */ }
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

  /* ── Snapshot codes: client → owner dashboard bridge (v21) ──────
     VN2.<base64url(json)>
       { v: 2, kind: 'vn-portal-project', issuedAt, expiresAt,
         nonce, payload: { project, client }, checksum }
     checksum = SHA-256 hex of canonicalJSON(payload).

     HONEST LIMIT: the code is UNSIGNED (there is no server to sign
     it). The checksum detects truncation/corruption and accidental
     edits; a motivated client can recompute it after tampering.
     Imports are therefore ALWAYS marked unverified / client-reported
     and payments are downgraded to 'reported' regardless of what the
     payload claims. Legacy VN1 codes import with a louder warning. */
  function b64urlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }

  function canonicalJSON(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function (k) {
      return JSON.stringify(k) + ':' + canonicalJSON(v[k]);
    }).join(',') + '}';
  }

  async function sha256Hex(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function hexRandom(nBytes) {
    return Array.from(crypto.getRandomValues(new Uint8Array(nBytes))).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function clampStr(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n) : s;
  }

  /* Owner-side replay registry: records nonces of imported snapshots
     so a re-pasted code is visibly flagged as a duplicate. */
  function registerSnapshotNonce(nonce) {
    if (!nonce) return 'fresh';
    try {
      var arr = JSON.parse(storeGet(NONCES_KEY) || '[]');
      var dup = arr.some(function (e) { return e && e.n === nonce; });
      if (!dup) {
        arr.push({ n: String(nonce), at: new Date().toISOString() });
        if (arr.length > 200) arr = arr.slice(-200);
        storeSet(NONCES_KEY, JSON.stringify(arr));
      }
      return dup ? 'duplicate' : 'fresh';
    } catch (e) { return 'fresh'; }
  }

  /* Whitelists + clamps an imported payload. Every payment arrives as
     'reported' (client-reported) no matter what the code claimed; the
     claim is preserved as claimedStatus for the audit trail. */
  function normalizeSnapshot(snap) {
    var p = snap && snap.project;
    if (!p || typeof p !== 'object') return null;
    var est = (p.estimate && typeof p.estimate === 'object') ? p.estimate : {};
    var proj = {
      id: clampStr(p.id, 64),
      name: clampStr(p.name || p.packageName, 200),
      packageId: clampStr(p.packageId, 64),
      packageName: clampStr(p.packageName, 200),
      status: clampStr(p.status, 40),
      progress: Math.max(0, Math.min(100, Number(p.progress) || 0)),
      estimate: {
        totalUsd: Number(est.totalUsd) || 0, totalKes: Number(est.totalKes) || 0,
        monthlyUsd: Number(est.monthlyUsd) || 0, monthlyKes: Number(est.monthlyKes) || 0,
        timeline: clampStr(est.timeline, 120)
      },
      paymentPlanType: clampStr(p.paymentPlanType, 40),
      payments: Array.isArray(p.payments) ? p.payments.slice(0, 24).map(function (x) {
        x = (x && typeof x === 'object') ? x : {};
        return {
          n: Number(x.n) || 0, label: clampStr(x.label, 120),
          usd: Number(x.usd) || 0, kes: Number(x.kes) || 0,
          dueDate: clampStr(x.dueDate, 10),
          status: 'reported',
          claimedStatus: clampStr(x.status, 20) || 'paid',
          reportedAt: clampStr(x.reportedAt || x.paidAt, 40) || null,
          method: clampStr(x.method, 40), ref: clampStr(x.ref, 80),
          events: Array.isArray(x.events) ? x.events.slice(0, 40) : []
        };
      }) : [],
      retainer: (p.retainer && typeof p.retainer === 'object') ? {
        active: !!p.retainer.active, monthlyUsd: Number(p.retainer.monthlyUsd) || 0,
        nextRenewal: clampStr(p.retainer.nextRenewal, 10)
      } : null,
      stages: Array.isArray(p.stages) ? p.stages.slice(0, 12) : [],
      activity: Array.isArray(p.activity) ? p.activity.slice(-10) : [],
      documents: Array.isArray(p.documents) ? p.documents.slice(0, 20) : []
    };
    var c = (snap.client && typeof snap.client === 'object') ? snap.client : {};
    return {
      v: 2, kind: 'vn-portal-project',
      project: proj,
      client: {
        name: clampStr(c.name, 200), email: clampStr(c.email, 200),
        company: clampStr(c.company, 200), phone: clampStr(c.phone, 40)
      },
      _meta: {
        unverified: true,
        legacy: snap.v === 1,
        importedFrom: 'snapshot-code',
        claimedPaid: Array.isArray(p.payments) && p.payments.some(function (x) {
          return x && (x.status === 'paid' || x.status === 'verified');
        })
      }
    };
  }

  async function makeShareCode(projectId) {
    var p = getProject(projectId);
    if (!p) return null;
    if (!window.crypto || !crypto.subtle || !crypto.getRandomValues) {
      throw new Error('Snapshot codes need a secure (https) context.');
    }
    var payload = {
      project: {
        id: p.id, name: p.name, packageId: p.packageId, packageName: p.packageName,
        status: p.status, progress: progress(p),
        estimate: p.estimate,
        paymentPlanType: p.paymentPlanType,
        payments: (p.payments || []).map(function (x) {
          return {
            label: x.label, usd: x.usd, kes: x.kes, status: x.status,
            reportedAt: x.reportedAt || x.paidAt || null, ref: x.ref, method: x.method,
            events: (x.events || []).slice(-20)
          };
        }),
        retainer: p.retainer ? { active: p.retainer.active, monthlyUsd: p.retainer.monthlyUsd, nextRenewal: p.retainer.nextRenewal } : null,
        stages: p.stages, activity: (p.activity || []).slice(-10),
        documents: p.documents
      },
      client: {
        name: vault.profile.name, email: vault.profile.email,
        company: vault.profile.company || ''
      }
    };
    var snap = {
      v: 2,
      kind: 'vn-portal-project',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SNAPSHOT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      nonce: hexRandom(12),
      payload: payload
    };
    snap.checksum = await sha256Hex(canonicalJSON(payload));
    if (!snap.checksum) throw new Error('Checksum could not be computed.');
    return 'VN2.' + b64urlEncode(JSON.stringify(snap));
  }

  /* Validates + normalizes a snapshot code. Returns:
     { ok: true, snapshot, meta, warning? } | { ok: false, error } */
  async function decodeShareCode(code) {
    var s = String(code || '').trim();
    function fail(error) { return { ok: false, error: error }; }

    if (s.indexOf('VN2.') === 0) {
      if (s.length > SNAPSHOT_MAX_BYTES) {
        return fail('Snapshot code is too large (over ' + (SNAPSHOT_MAX_BYTES / 1024) + ' KB).');
      }
      var snap;
      try { snap = JSON.parse(b64urlDecode(s.slice(4))); }
      catch (e) { return fail('Snapshot code is not valid base64url JSON.'); }
      if (!snap || snap.kind !== 'vn-portal-project') return fail('Wrong code type.');
      if (snap.v !== 2) return fail('Unsupported snapshot version (' + snap.v + ').');
      if (!snap.payload || typeof snap.payload !== 'object') return fail('Missing payload.');
      if (!/^\d{4}-\d{2}-\d{2}T/.test(String(snap.issuedAt || '')) ||
          !/^\d{4}-\d{2}-\d{2}T/.test(String(snap.expiresAt || ''))) {
        return fail('Missing issue/expiry timestamps.');
      }
      var now = Date.now();
      if (new Date(snap.expiresAt).getTime() < now) {
        return fail('Snapshot code expired on ' + String(snap.expiresAt).slice(0, 10) + '. Ask the client for a fresh one.');
      }
      if (new Date(snap.issuedAt).getTime() > now + 5 * 60 * 1000) {
        return fail('Snapshot issue time is in the future — check this device\u2019s clock.');
      }
      if (!snap.nonce || String(snap.nonce).length < 8) return fail('Missing nonce.');
      if (!/^[0-9a-f]{64}$/.test(String(snap.checksum || ''))) return fail('Missing or malformed checksum.');
      var actual;
      try { actual = await sha256Hex(canonicalJSON(snap.payload)); }
      catch (e) { return fail('Checksum could not be computed (needs HTTPS).'); }
      if (actual !== snap.checksum) {
        return fail('Checksum mismatch — the code was truncated or edited in transit. Ask the client to re-copy it.');
      }
      var norm = normalizeSnapshot({ v: 2, project: snap.payload.project, client: snap.payload.client });
      if (!norm) return fail('Snapshot payload has no project.');
      return {
        ok: true, snapshot: norm,
        meta: {
          version: 2, nonce: snap.nonce,
          issuedAt: snap.issuedAt, expiresAt: snap.expiresAt,
          replay: registerSnapshotNonce(snap.nonce)
        }
      };
    }

    if (s.indexOf('VN1.') === 0) {
      var obj;
      try { obj = JSON.parse(b64urlDecode(s.slice(4))); }
      catch (e) { return fail('Not a valid legacy share code.'); }
      if (!obj || obj.kind !== 'vn-portal-project' || !obj.project) {
        return fail('That is not a valid portal share code.');
      }
      var norm1 = normalizeSnapshot(obj);
      if (!norm1) return fail('Snapshot payload has no project.');
      return {
        ok: true, snapshot: norm1,
        meta: { version: 1, legacy: true, replay: 'fresh' },
        warning: 'Legacy v1 code: no expiry, size limit, or integrity check. Treated as unverified client-reported data.'
      };
    }

    return fail('Not a portal snapshot code (expected VN2. or legacy VN1.).');
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
    reportPayment: reportPayment,
    markPaymentPaid: markPaymentPaid,        // v13 compat alias → reportPayment
    ownerTransitionPayment: ownerTransitionPayment,
    PAYMENT_STATES: PAYMENT_STATES,
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
    makeShareCode: makeShareCode,          // async → 'VN2.…' (or throws)
    decodeShareCode: decodeShareCode,      // async → { ok, snapshot|error }
    registerSnapshotNonce: registerSnapshotNonce,
    SNAPSHOT_TTL_DAYS: SNAPSHOT_TTL_DAYS,
    SNAPSHOT_MAX_BYTES: SNAPSHOT_MAX_BYTES,
    getEvents: function () { try { return JSON.parse(storeGet(EVENTS_KEY) || '[]'); } catch (e) { return []; } },

    // settings
    changePassword: changePassword,
    exportBackup: exportBackup,
    deleteAccount: deleteAccount,
    getAuthEmail: function () { var r = getAuthRecord(); return r ? r.email : null; },

    // session / trust (v21)
    getRememberedSession: getRememberedSession,
    hasAccount: hasAccount,
    lockSession: lockSession
  };

  /* ── Self-boot ─────────────────────────────────────────────────────
     v21: the vault key is never persisted, so a page load can never
     auto-unlock the vault. On every load we (1) purge legacy key
     material, (2) surface a "workspace locked" hint on funnel pages
     that sync into the vault (data-vn-portal-sync), and (3) leave the
     remembered email available for login pre-fill. Unlocking always
     requires the password again. */
  function mountPortalSyncHint() {
    var body = document.body;
    if (!body || !body.hasAttribute('data-vn-portal-sync')) return;
    if ((vault && session.vaultKey) || !hasAccount()) return;
    try {
      if (document.getElementById('vn-portal-hint')) return;
      var st = document.createElement('style');
      st.id = 'vn-portal-hint-style';
      st.textContent = '.vn-portal-hint{display:flex;gap:0.6rem;align-items:flex-start;margin:0.75rem auto;max-width:1080px;padding:0.6rem 0.9rem;' +
        'border:1px solid rgba(0,212,255,0.35);border-radius:10px;background:rgba(0,212,255,0.08);font-size:0.8rem;line-height:1.5}' +
        '.vn-portal-hint a{color:inherit;font-weight:600;text-decoration:underline;white-space:nowrap}';
      document.head.appendChild(st);
      var div = document.createElement('div');
      div.id = 'vn-portal-hint';
      div.className = 'vn-portal-hint';
      div.setAttribute('role', 'note');
      var tx = document.createElement('span');
      tx.textContent = 'Your encrypted client workspace is on this device but locked — re-enter your password on the portal to sync this into it. (Keys are never stored: reloading always asks for your password.)';
      var a = document.createElement('a');
      a.href = '/services/client-dashboard.html';
      a.textContent = 'Unlock →';
      div.appendChild(tx); div.appendChild(a);
      var main = document.querySelector('main') || body;
      main.insertBefore(div, main.firstChild);
    } catch (e) { /* non-fatal */ }
  }

  try {
    purgeLegacyKeyMaterial();
    restoreSession().catch(function () {});
    mountPortalSyncHint();
  } catch (e) { /* non-fatal */ }
})();
