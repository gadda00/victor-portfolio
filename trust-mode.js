/* ═══════════════════════════════════════════════════════════════════
   Victor Ndunda — Trust & Mode layer v1.0.0
   ═══════════════════════════════════════════════════════════════════
   Implements the two explicit operating modes documented in
   TRUST_BOUNDARIES.md:

   demo (default)  Browser-local tooling. Data is synthetic or stored
                   only in this browser. Sign-in gates are client-side
                   UI, not server-enforced authorization. No provider-
                   confirmed payments.

   production      Requires a server-backed boundary. Activated by
                   defining window.VN_TRUST_CONFIG = { mode: 'production',
                   backendUrl, ... } BEFORE this script loads (see
                   .env.example / IMPLEMENTATION_NOTES.md). Production
                   mode FAILS CLOSED: if the required backend
                   configuration is missing, gated apps render a clear
                   configuration error instead of silently degrading to
                   demo behaviour.

   Also injects the reusable visible trust banner on pages that opt in
   with <body data-vn-trust="dashboard|portal|payment|invoice|proposal|
   contract|wizard">. Fixed-position variant for pages with full-screen
   overlays: data-vn-trust-fixed="true".
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var config = window.VN_TRUST_CONFIG || { mode: 'demo' };
  if (config.mode !== 'production') config.mode = 'demo';

  /* ── Fail-closed production checks ─────────────────────────────── */
  var errors = [];
  if (config.mode === 'production') {
    if (!config.backendUrl || !/^https:\/\/[^\s]+$/.test(String(config.backendUrl))) {
      errors.push('VN_TRUST_CONFIG.backendUrl must be an absolute https:// URL (no backend configured).');
    }
    if (!config.ownerApiToken) {
      errors.push('VN_TRUST_CONFIG.ownerApiToken is required (server-issued owner session token).');
    }
    if (!config.sessionVerifyEndpoint) {
      errors.push('VN_TRUST_CONFIG.sessionVerifyEndpoint is required (server-side session verification).');
    }
  }

  function productionReady() {
    return { ok: config.mode !== 'production' || errors.length === 0, errors: errors.slice() };
  }

  /* Blocking error screen for gated apps running in a broken production
     config. Returns true when the app may boot, false when it must not. */
  function assertReady() {
    if (config.mode !== 'production') return true;
    var check = productionReady();
    if (check.ok) return true;
    try {
      var shade = document.createElement('div');
      shade.setAttribute('role', 'alert');
      shade.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0a0a0f;color:#e2e8f0;' +
        'font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:2rem;';
      var box = document.createElement('div');
      box.style.cssText = 'max-width:560px;background:#12121a;border:1px solid #7f1d1d;border-radius:14px;padding:2rem;';
      var h = document.createElement('h1');
      h.textContent = 'Production mode is not configured';
      h.style.cssText = 'font-size:1.25rem;margin:0 0 0.75rem;color:#f87171;';
      var p = document.createElement('p');
      p.style.cssText = 'margin:0 0 1rem;line-height:1.7;color:#8892b0;font-size:0.9rem;';
      p.textContent = 'This app was switched to production mode, but the required backend is not configured. ' +
        'It refuses to start in this state (fail closed) rather than silently running as a browser-local demo. ' +
        'Configure VN_TRUST_CONFIG before this script, or remove it to return to demo mode.';
      var ul = document.createElement('ul');
      ul.style.cssText = 'margin:0 0 1rem;padding-left:1.25rem;color:#f87171;font-size:0.85rem;line-height:1.7;';
      errors.forEach(function (e) {
        var li = document.createElement('li');
        li.textContent = e;
        ul.appendChild(li);
      });
      box.appendChild(h); box.appendChild(p); box.appendChild(ul);
      shade.appendChild(box);
      document.body.innerHTML = '';
      document.body.appendChild(shade);
    } catch (e) { /* non-fatal rendering issue */ }
    return false;
  }

  /* ── Reusable visible trust banner ─────────────────────────────── */
  var BANNER_COPY = {
    dashboard: 'Owner dashboard · browser-local demo — sign-in here is a client-side gate, not server-enforced authorization. Everything it shows lives in this browser only.',
    portal: 'Client workspace · demo — your data is AES-encrypted inside this browser. There is no server account: clearing this browser deletes it, and payments you report are not provider-confirmed.',
    payment: 'Payments page · demo — no payment provider is connected. M-Pesa details are manual instructions; Flutterwave/Stripe buttons are placeholders. Records you create stay in this browser.',
    invoice: 'Invoice tool · browser-local demo — invoices and payment records live in this browser and are not verified accounting data.',
    proposal: 'Proposal tool · browser-local demo — proposals live in this browser and are not a server-side document system.',
    contract: 'Contract tool · browser-local demo — contracts live in this browser; signatures are not e-signature verified.',
    wizard: 'Scope wizard · browser-local — your brief is stored only in this browser (and encrypted if you use the client workspace). Nothing is sent anywhere without your action.'
  };

  function injectStyle() {
    if (document.getElementById('vn-trust-style')) return;
    var st = document.createElement('style');
    st.id = 'vn-trust-style';
    st.textContent =
      '.vn-trust-banner{box-sizing:border-box;display:flex;gap:0.6rem;align-items:flex-start;width:100%;' +
        'padding:0.55rem 1rem;background:rgba(245,158,11,0.14);border-bottom:1px solid rgba(245,158,11,0.45);' +
        'color:inherit;font-size:0.78rem;line-height:1.5;z-index:10002;}' +
      '.vn-trust-banner.vn-fixed{position:fixed;top:0;left:0;right:0;}' +
      '.vn-trust-banner.vn-bottom{position:fixed;bottom:0;left:0;right:0;border-bottom:none;border-top:1px solid rgba(245,158,11,0.45);box-shadow:0 -6px 18px rgba(0,0,0,0.25);}' +
      'body.vn-has-bottom-banner{padding-bottom:42px !important;}' +
      '.vn-trust-banner .vn-tb-ic{flex:0 0 auto;font-size:0.9rem;line-height:1.3;}' +
      '.vn-trust-banner .vn-tb-tx{flex:1 1 auto;min-width:0;}' +
      '.vn-trust-banner .vn-tb-tx strong{font-weight:700;opacity:0.95;}' +
      '.vn-trust-banner a.vn-tb-lnk{flex:0 0 auto;color:inherit;text-decoration:underline;opacity:0.8;white-space:nowrap;}' +
      '.vn-trust-banner a.vn-tb-lnk:hover,:focus-visible{opacity:1;}' +
      '@media (max-width:640px){.vn-trust-banner{flex-wrap:wrap}.vn-trust-banner a.vn-tb-lnk{white-space:normal}}' +
      '@media (prefers-contrast:more){.vn-trust-banner{background:#f59e0b;color:#111;border-color:#111}}';
    document.head.appendChild(st);
  }

  function banner(kind, opts) {
    opts = opts || {};
    injectStyle();
    var b = document.createElement('div');
    b.className = 'vn-trust-banner' + (opts.fixed ? ' vn-fixed' : '') + (opts.bottom ? ' vn-bottom' : '');
    b.setAttribute('role', 'note');
    b.setAttribute('aria-label', 'Trust and mode notice');
    var ic = document.createElement('span');
    ic.className = 'vn-tb-ic';
    ic.textContent = '⚠️';
    ic.setAttribute('aria-hidden', 'true');
    var tx = document.createElement('span');
    tx.className = 'vn-tb-tx';
    var strong = document.createElement('strong');
    strong.textContent = opts.title || 'Demo · browser-local. ';
    tx.appendChild(strong);
    tx.appendChild(document.createTextNode(opts.text || BANNER_COPY[kind] || BANNER_COPY.dashboard));
    var a = document.createElement('a');
    a.className = 'vn-tb-lnk';
    a.href = '/trust-boundaries.html';
    a.textContent = 'What this means';
    b.appendChild(ic); b.appendChild(tx); b.appendChild(a);
    return b;
  }

  function mountBanners() {
    var body = document.body;
    if (!body || body.getAttribute('data-vn-trust-banner') === 'off') return;
    var kind = body.getAttribute('data-vn-trust');
    if (!kind) return;
    var fixed = body.getAttribute('data-vn-trust-fixed') === 'true';
    if (fixed) {
      // fixed variant for apps with full-screen overlays (dashboard):
      // the bar floats above everything at the very top.
      body.insertBefore(banner(kind, { fixed: fixed }), body.firstChild);
      return;
    }
    // site pages: the global nav is position:fixed at the top, so a
    // top banner would slide underneath it. Mount a fixed BOTTOM bar
    // (cookie-bar pattern) and pad the body so no content is covered.
    body.classList.add('vn-has-bottom-banner');
    body.appendChild(banner(kind, { bottom: true }));
    if (fixed) {
      // keep overlay content clear of the fixed bar
      var pad = document.createElement('div');
      pad.style.height = '0';
      pad.setAttribute('aria-hidden', 'true');
      pad.id = 'vn-trust-pad';
      body.insertBefore(pad, body.firstChild);
      try {
        var overlay = document.getElementById('authOverlay');
        if (overlay) overlay.style.paddingTop = '44px';
      } catch (e) { /* non-fatal */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBanners);
  } else {
    mountBanners();
  }

  /* ── Public API ────────────────────────────────────────────────── */
  window.VNTrust = {
    version: '1.0.0',
    mode: config.mode,
    config: config,
    productionReady: productionReady,
    assertReady: assertReady,
    banner: banner
  };
})();
