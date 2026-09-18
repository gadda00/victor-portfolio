/* ═══════════════════════════════════════════════════════════════════
   Shared Auth Module — Victor Ndunda Portfolio
   Google OAuth 2.0 (ID token signature verified against Google JWKS)
   + PBKDF2 password fallback + optional TOTP 2FA (see totp.js)
   Used by: /dashboard/ (sole gated area since v8)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const AUTH_CONFIG = {
    GOOGLE_CLIENT_ID: '794306876985-8v3qsraj7t591oc4jv0p0s056htknjf1.apps.googleusercontent.com',
    ALLOWED_EMAILS: ['mututandunda@gmail.com', 'torv54@gmail.com'],
    SESSION_KEY: 'victor_session',
    SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes idle
    LOGIN_LOG_KEY: 'victor_login_log',
    ACTIVITY_LOG_KEY: 'victor_activity_log',
    // Fallback credentials (PBKDF2 hashed — safe to commit publicly)
    FALLBACK_AUTH: {
      username: 'victor',
      salt: 'XjM/ry7o546lbe5j/a4qwQ==',
      hash: '5HcZqnTGEmtDHF0Z1+KiBwKzXHVtgs9EVVw8reCcB9Y=',
      iterations: 100000,
    },
  };

  // ─── State ─────────────────────────────────────────────────────────
  let state = {
    user: null,
    sessionStart: null,
    lastActivity: null,
  };

  // ─── Activity logging ──────────────────────────────────────────────
  function logActivity(type, message) {
    try {
      const log = JSON.parse(localStorage.getItem(AUTH_CONFIG.ACTIVITY_LOG_KEY) || '[]');
      log.unshift({
        type, message,
        timestamp: new Date().toISOString(),
        email: state.user?.email || 'unknown',
      });
      // Keep last 50 entries
      if (log.length > 50) log.length = 50;
      localStorage.setItem(AUTH_CONFIG.ACTIVITY_LOG_KEY, JSON.stringify(log));
    } catch {}
  }

  function logLoginAttempt(email, success) {
    try {
      const log = JSON.parse(localStorage.getItem(AUTH_CONFIG.LOGIN_LOG_KEY) || '[]');
      log.unshift({
        email, success,
        timestamp: new Date().toISOString(),
        ip: 'client-side', // Can't get real IP client-side
        userAgent: navigator.userAgent.substring(0, 100),
      });
      if (log.length > 20) log.length = 20;
      localStorage.setItem(AUTH_CONFIG.LOGIN_LOG_KEY, JSON.stringify(log));
    } catch {}
  }

  function getActivityLog() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_CONFIG.ACTIVITY_LOG_KEY) || '[]');
    } catch { return []; }
  }

  function getLoginLog() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_CONFIG.LOGIN_LOG_KEY) || '[]');
    } catch { return []; }
  }

  function clearLogs() {
    localStorage.removeItem(AUTH_CONFIG.ACTIVITY_LOG_KEY);
    localStorage.removeItem(AUTH_CONFIG.LOGIN_LOG_KEY);
  }

  // ─── Session management ────────────────────────────────────────────
  function checkSession() {
    const saved = sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
    if (!saved) return false;
    try {
      const session = JSON.parse(saved);
      const now = Date.now();
      if (now - session.lastActivity > AUTH_CONFIG.SESSION_TIMEOUT_MS) {
        sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        return false;
      }
      state.user = { email: session.email, name: session.name, picture: session.picture };
      state.sessionStart = session.sessionStart;
      state.lastActivity = now;
      // Update lastActivity
      sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify({
        ...session, lastActivity: now,
      }));
      return true;
    } catch {
      return false;
    }
  }

  function saveSession(user) {
    state.user = user;
    state.sessionStart = Date.now();
    state.lastActivity = Date.now();
    const session = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      sessionStart: state.sessionStart,
      lastActivity: state.lastActivity,
    };
    sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
  }

  function logout() {
    logActivity('auth', `Signed out (${state.user?.email || 'unknown'})`);
    sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    state.user = null;
    state.sessionStart = null;
    state.lastActivity = null;
    // Try Google sign-out too
    if (typeof google !== 'undefined' && google.accounts) {
      try { google.accounts.id.disableAutoSelect(); } catch {}
    }
    // Force a full page reload with cache-bust to avoid SW serving cached dashboard
    if ('caches' in window) {
      caches.keys().then(keys => {
        Promise.all(keys.map(k => caches.delete(k))).then(() => {
          window.location.href = '/dashboard/?logout=' + Date.now();
        });
      }).catch(() => {
        window.location.href = '/dashboard/?logout=' + Date.now();
      });
    } else {
      window.location.href = '/dashboard/?logout=' + Date.now();
    }
  }

  // ─── Activity monitor (idle timeout) ───────────────────────────────
  function startActivityMonitor(onTimeout, onWarning) {
    const updateActivity = () => {
      state.lastActivity = Date.now();
      const saved = sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
      if (saved) {
        try {
          const session = JSON.parse(saved);
          session.lastActivity = Date.now();
          sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
        } catch {}
      }
    };

    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, updateActivity, { passive: true });
    });

    setInterval(() => {
      if (!state.user) return;
      const idle = Date.now() - state.lastActivity;
      if (idle > AUTH_CONFIG.SESSION_TIMEOUT_MS) {
        if (onTimeout) onTimeout();
        else logout();
      } else if (idle > AUTH_CONFIG.SESSION_TIMEOUT_MS - 5 * 60 * 1000) {
        if (onWarning) onWarning();
      }
    }, 60000);
  }

  // ─── Google OAuth ──────────────────────────────────────────────────
  let onAuthSuccess = null;
  let onAuthError = null;
  let googleInitialized = false; // guards renderButton-before-initialize race

  function initGoogleAuth(successCb, errorCb) {
    onAuthSuccess = successCb;
    onAuthError = errorCb;

    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(() => initGoogleAuth(successCb, errorCb), 200);
      return;
    }

    google.accounts.id.initialize({
      client_id: AUTH_CONFIG.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
    });
    googleInitialized = true;
  }

  function renderGoogleButton(elementId, _tries) {
    _tries = _tries || 0;
    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(() => renderGoogleButton(elementId), 200);
      return;
    }
    // GIS requires initialize() to have completed first — otherwise it logs
    // "Failed to render button before calling initialize()" and renders nothing.
    if (!googleInitialized && _tries < 50) {
      setTimeout(() => renderGoogleButton(elementId, _tries + 1), 100);
      return;
    }
    const el = document.getElementById(elementId);
    if (!el) return;
    google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 280,
      locale: 'en',
    });
    google.accounts.id.prompt();
  }

  // ─── Google ID token verification (fail closed) ────────────────────
  // v8: the credential is no longer trusted after base64-decoding alone —
  // a forged JWT could previously pass with an allowlisted email. The
  // RS256 signature is now verified against Google's published JWKS and
  // iss/aud/exp are checked. If the JWKS cannot be fetched, login FAILS.
  let jwksCache = null, jwksCacheAt = 0;
  const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
  const JWKS_TTL = 60 * 60 * 1000;

  function b64uToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function getJwks() {
    if (jwksCache && Date.now() - jwksCacheAt < JWKS_TTL) return Promise.resolve(jwksCache);
    return fetch(JWKS_URL).then(r => {
      if (!r.ok) throw new Error('JWKS HTTP ' + r.status);
      return r.json();
    }).then(j => {
      jwksCache = j; jwksCacheAt = Date.now();
      return j;
    });
  }

  async function verifyGoogleCredential(credential) {
    const parts = String(credential).split('.');
    if (parts.length !== 3) throw new Error('Malformed credential');
    const header = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])));
    const sig = b64uToBytes(parts[2]);
    const signed = new TextEncoder().encode(parts[0] + '.' + parts[1]);

    if (header.alg !== 'RS256') throw new Error('Unexpected algorithm');
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') throw new Error('Bad issuer');
    if (payload.aud !== AUTH_CONFIG.GOOGLE_CLIENT_ID) throw new Error('Bad audience');
    if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('Credential expired');
    if (payload.email_verified === false) throw new Error('Email not verified');

    const jwks = await getJwks();
    const jwk = (jwks.keys || []).find(k => k.kid === header.kid && k.use === 'sig' && k.alg === 'RS256');
    if (!jwk) throw new Error('Unknown signing key');

    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, signed);
    if (!ok) throw new Error('Invalid signature');
    return payload;
  }

  // ─── Post-authentication TOTP gate ─────────────────────────────────
  // Called after the first factor succeeds. If TOTP is enrolled, the
  // session is NOT saved yet — the UI layer must collect a valid code and
  // call finalizeLogin(user). If TOTP is not yet enrolled, the UI should
  // run enrollment first. Without totp.js present, auth degrades to the
  // single-factor flow (e.g. local development without the script).
  function gateTotp(user) {
    if (onAuthSuccess) onAuthSuccess(user, {
      totpAvailable: !!window.VNTotp,
      totpEnrolled: !!(window.VNTotp && window.VNTotp.isEnrolled(user.email)),
    });
  }

  function finalizeLogin(user) {
    saveSession(user);
    logActivity('auth', `Signed in as ${user.email} (2FA completed)`);
    return true;
  }

  async function handleCredentialResponse(response) {
    let payload;
    try {
      payload = await verifyGoogleCredential(response.credential);
    } catch (err) {
      logLoginAttempt('unverified-credential', false);
      if (onAuthError) onAuthError('Sign-in could not be verified: ' + err.message);
      return;
    }
    try {
      const email = payload.email;
      if (!AUTH_CONFIG.ALLOWED_EMAILS.includes(email)) {
        logLoginAttempt(email, false);
        if (onAuthError) onAuthError('Unauthorized email: ' + email);
        try { google.accounts.id.disableAutoSelect(); } catch {}
        return;
      }
      logLoginAttempt(email, true);
      const user = { email, name: payload.name, picture: payload.picture };
      logActivity('auth', `First factor passed: ${email} (Google, signature verified)`);
      gateTotp(user);
    } catch (err) {
      if (onAuthError) onAuthError('Authentication failed: ' + err.message);
    }
  }

  // ─── PBKDF2 password fallback ──────────────────────────────────────
  async function verifyPassword(username, password) {
    if (username !== AUTH_CONFIG.FALLBACK_AUTH.username) {
      return { success: false, error: 'Invalid username or password' };
    }
    try {
      const saltBytes = Uint8Array.from(atob(AUTH_CONFIG.FALLBACK_AUTH.salt), c => c.charCodeAt(0));
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
      const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: AUTH_CONFIG.FALLBACK_AUTH.iterations, hash: 'SHA-256' },
        keyMaterial, 256);
      const derivedB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
      // Constant-time comparison
      const expected = AUTH_CONFIG.FALLBACK_AUTH.hash;
      let diff = 0;
      for (let i = 0; i < derivedB64.length; i++) {
        diff |= derivedB64.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      if (diff !== 0) return { success: false, error: 'Invalid username or password' };
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Authentication error' };
    }
  }

  async function loginWithPassword(username, password) {
    const result = await verifyPassword(username, password);
    if (result.success) {
      const user = {
        email: username + '@local',
        name: 'Victor Ndunda',
        picture: null,
      };
      logLoginAttempt(user.email, true);
      logActivity('auth', `First factor passed: ${user.email} (password)`);
      result.user = user;
      // v8: session is NOT saved here — the caller must complete the TOTP
      // gate (if active) and call VNAuth.finalizeLogin(user).
    } else {
      logLoginAttempt(username, false);
    }
    return result;
  }

  // ─── Public API ────────────────────────────────────────────────────
  window.VNAuth = {
    CONFIG: AUTH_CONFIG,
    checkSession,
    logout,
    startActivityMonitor,
    initGoogleAuth,
    renderGoogleButton,
    loginWithPassword,
    finalizeLogin,
    logActivity,
    getActivityLog,
    getLoginLog,
    clearLogs,
    getUser: () => state.user,
    getSessionStart: () => state.sessionStart,
    getLastActivity: () => state.lastActivity,
  };
})();
