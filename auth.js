/* ═══════════════════════════════════════════════════════════════════
   Shared Auth Module — Victor Ndunda Portfolio
   Google OAuth 2.0 + PBKDF2 password fallback
   Used by: /dashboard/, /jobs/, (formerly /admin/)
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
    location.reload();
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
  }

  function renderGoogleButton(elementId) {
    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(() => renderGoogleButton(elementId), 200);
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

  async function handleCredentialResponse(response) {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email = payload.email;
      if (!AUTH_CONFIG.ALLOWED_EMAILS.includes(email)) {
        logLoginAttempt(email, false);
        if (onAuthError) onAuthError('Unauthorized email: ' + email);
        try { google.accounts.id.disableAutoSelect(); } catch {}
        return;
      }
      logLoginAttempt(email, true);
      const user = {
        email,
        name: payload.name,
        picture: payload.picture,
      };
      saveSession(user);
      logActivity('auth', `Signed in as ${email}`);
      if (onAuthSuccess) onAuthSuccess(user);
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
      saveSession(user);
      logLoginAttempt(user.email, true);
      logActivity('auth', `Signed in with password (${user.email})`);
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
    logActivity,
    getActivityLog,
    getLoginLog,
    clearLogs,
    getUser: () => state.user,
    getSessionStart: () => state.sessionStart,
    getLastActivity: () => state.lastActivity,
  };
})();
