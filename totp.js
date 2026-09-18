/* ═══════════════════════════════════════════════════════════════════
   VNTotp — TOTP two-factor authentication (RFC 6238) for /dashboard/
   Works with Google Authenticator and any standard TOTP app.

   Design notes (read before changing):
   - Per-account secrets are DERIVED, not stored: HKDF-SHA256(MASTER_SEED,
     salt=email, info="VN-TOTP-v1") → 20 raw bytes → base32 for the app.
     The same account therefore produces the same secret on every browser,
     so enrollment works once and verification works everywhere.
   - Verification runs client-side (static site, no server). This raises
     the bar against stolen Google passwords, shared browsers and casual
     access to /dashboard/, but it cannot be as strong as server-side
     verification — documented in SECURITY.md with the Firebase Auth
     upgrade path.
   - Requires a secure context (https) for crypto.subtle — production is
     https://victorndunda.com; localhost is also secure.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MASTER_SEED = '1780c47db49e26482296e83b0aed6c9566bf17b26afacc47a36d2e06458f7300';
  var ENROLLED_KEY = 'victor_totp_enrolled';
  var ISSUER = 'VictorNdunda';
  var STEP_SECONDS = 30;
  var DIGITS = 6;
  var WINDOW = 1; // accept ±1 step of clock drift

  var enc = new TextEncoder();

  /* ── Base32 (RFC 4648, no padding — as authenticator apps expect) ── */
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function base32Encode(bytes) {
    var out = '', bits = 0, val = 0;
    for (var i = 0; i < bytes.length; i++) {
      val = (val << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        out += B32[(val >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
  }

  /* ── Secret derivation (deterministic per account) ───────────────── */
  function deriveSecretBytes(email) {
    return crypto.subtle.importKey('raw', enc.encode(MASTER_SEED), 'HKDF', false, ['deriveBits']).then(function (key) {
      return crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(String(email).toLowerCase()), info: enc.encode('VN-TOTP-v1') },
        key, 160 // 20 bytes = RFC 4226 recommended secret length
      );
    }).then(function (bits) { return new Uint8Array(bits); });
  }

  function getSecret(email) {
    return deriveSecretBytes(email).then(base32Encode);
  }

  /* ── HOTP / TOTP (RFC 4226 / RFC 6238) ───────────────────────────── */
  function hotp(secretBytes, counter) {
    var msg = new Uint8Array(8);
    var c = counter;
    for (var i = 7; i >= 0; i--) { msg[i] = c & 0xff; c = Math.floor(c / 256); }
    return crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']).then(function (key) {
      return crypto.subtle.sign('HMAC', key, msg);
    }).then(function (sigBuf) {
      var sig = new Uint8Array(sigBuf);
      var off = sig[sig.length - 1] & 0xf;
      var bin = ((sig[off] & 0x7f) << 24) | (sig[off + 1] << 16) | (sig[off + 2] << 8) | sig[off + 3];
      var code = String(bin % Math.pow(10, DIGITS));
      while (code.length < DIGITS) code = '0' + code;
      return code;
    });
  }

  function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function currentCounter() { return Math.floor(Date.now() / 1000 / STEP_SECONDS); }

  /* ── Public API ──────────────────────────────────────────────────── */
  function isEnrolled(email) {
    try {
      var m = JSON.parse(localStorage.getItem(ENROLLED_KEY) || '{}');
      return Object.prototype.hasOwnProperty.call(m, String(email).toLowerCase());
    } catch (e) { return false; }
  }

  function markEnrolled(email) {
    var m = {};
    try { m = JSON.parse(localStorage.getItem(ENROLLED_KEY) || '{}'); } catch (e) { m = {}; }
    m[String(email).toLowerCase()] = new Date().toISOString();
    localStorage.setItem(ENROLLED_KEY, JSON.stringify(m));
  }

  function reset() { localStorage.removeItem(ENROLLED_KEY); }

  function getOtpauthUri(email) {
    return getSecret(email).then(function (secret) {
      return 'otpauth://totp/' + ISSUER + ':' + encodeURIComponent(email) +
        '?secret=' + secret + '&issuer=' + ISSUER + '&algorithm=SHA1&digits=' + DIGITS + '&period=' + STEP_SECONDS;
    });
  }

  function verify(email, code) {
    code = String(code || '').replace(/\s+/g, '');
    if (!/^[0-9]{6}$/.test(code)) return Promise.resolve(false);
    return deriveSecretBytes(email).then(function (secret) {
      var counter = currentCounter();
      var checks = [];
      for (var w = -WINDOW; w <= WINDOW; w++) checks.push(hotp(secret, counter + w));
      return Promise.all(checks).then(function (codes) {
        return codes.some(function (c) { return timingSafeEqual(c, code); });
      });
    }).catch(function () { return false; });
  }

  /* ── QR rendering (uses vendored /qr.min.js — qrcode-generator, MIT) ── */
  function renderQr(container, uri) {
    try {
      var qr = window.qrcode(0, 'M');
      qr.addData(uri);
      qr.make();
      container.innerHTML = qr.createSvgTag(4, 0);
      var svg = container.querySelector('svg');
      if (svg) { svg.style.width = '180px'; svg.style.height = '180px'; svg.style.background = '#fff'; svg.style.borderRadius = '8px'; svg.style.padding = '8px'; }
      return true;
    } catch (e) {
      container.textContent = '';
      return false;
    }
  }

  window.VNTotp = {
    isEnrolled: isEnrolled,
    markEnrolled: markEnrolled,
    reset: reset,
    getSecret: getSecret,
    getOtpauthUri: getOtpauthUri,
    verify: verify,
    renderQr: renderQr,
    // exposed for owner-side testing only (never used by the login flow)
    _debugCode: function (email) { return deriveSecretBytes(email).then(function (s) { return hotp(s, currentCounter()); }); }
  };
})();
