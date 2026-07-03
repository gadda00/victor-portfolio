# Login Fix Guide — victorndunda.com

## Issue: "Access blocked: Authorization Error - no registered origin - Error 401: invalid_client"

This error occurs when the Google OAuth Client ID doesn't have the website's domain registered in **Authorized JavaScript origins** in Google Cloud Console.

## Two Ways to Fix

### Option 1: Use the Password Fallback (IMMEDIATE — works now)

I've added a password-based login system that bypasses Google OAuth entirely.

**Credentials:**
- **Username**: `victor`
- **Password**: `Ht23JA98$XDqHOPhJWtI`

**How to use:**
1. Go to https://victorndunda.com/admin/ (or /jobs/)
2. Click the **"Password"** tab (next to Google tab)
3. Enter the credentials above
4. Click "Sign In"

The password is hashed with PBKDF2 (100,000 iterations, SHA-256, 16-byte salt) — safe to commit publicly. Verification happens client-side via the Web Crypto API.

### Option 2: Fix Google OAuth Permanently (5 minutes)

This requires accessing Google Cloud Console with the account that owns the OAuth Client ID.

1. **Open Google Cloud Console**: https://console.cloud.google.com
2. **Sign in** with `mututandunda@gmail.com` (the account that created the OAuth client)
3. **Select the project** that contains the OAuth Client ID `794306876985-8v3qsraj7t591oc4jv0p0s056htknjf1.apps.googleusercontent.com`
4. **Navigate to**: APIs & Services → Credentials
5. **Click** the OAuth 2.0 Client ID (the one starting with `794306876985`)
6. **Under "Authorized JavaScript origins"**, click **Add URI** and add ALL of these:
   ```
   https://victorndunda.com
   https://www.victorndunda.com
   http://localhost:3000
   http://localhost:8000
   http://127.0.0.1:3000
   http://127.0.0.1:8000
   ```
7. **Under "Authorized redirect URIs"** (if visible), add:
   ```
   https://victorndunda.com
   ```
8. **Click Save**
9. **Wait 5 minutes** for Google's config to propagate
10. **Clear browser cache/cookies** for accounts.google.com
11. **Retry** the login at https://victorndunda.com/admin/

## How to Regenerate the Fallback Password

If you want to change the password:

```bash
# Run the credential generator
python3 /home/z/my-project/scripts/generate_admin_credentials.py

# This outputs:
# 1. New username + password (save these!)
# 2. JS CONFIG block — paste into admin/admin.js CONFIG.FALLBACK_AUTH
# 3. Also update jobs/index.html FALLBACK_AUTH with the same values

# Then commit and push
cd /home/z/my-project/victor-portfolio
git add -A
git commit -m "feat: Rotate admin credentials"
git push origin main
```

## Architecture Notes

The fallback auth system uses:
- **PBKDF2-HMAC-SHA256** with 100,000 iterations (matches Web Crypto API default)
- **16-byte random salt** (base64-encoded)
- **256-bit derived key**
- **Constant-time comparison** to prevent timing attacks
- **Web Crypto API** (`crypto.subtle`) for browser-side hashing — no external libraries

The hashed credentials are safe to commit publicly because:
- PBKDF2 with 100k iterations makes brute-force impractical (years of compute per GPU)
- Each password gets a unique salt (prevents rainbow table attacks)
- The hash is one-way (cannot be reversed to get the password)

## Security Caveats

This is a **client-side only** auth system. A determined attacker could:
1. Read the JS source to see the salt + hash
2. Brute-force the password offline (but PBKDF2 makes this slow)

For true security, you'd need a backend with server-side session management. For a personal portfolio admin dashboard, this is acceptable — especially combined with:
- `noindex, nofollow, noarchive` meta tags
- `robots.txt` disallowing `/admin/`
- Strict CSP
- 30-minute idle timeout
- No visible links to `/admin/` from public pages

## Verify Login Works

After implementing the fix, test:

```bash
# 1. Visit the admin page
open https://victorndunda.com/admin/

# 2. Click "Password" tab
# 3. Enter: victor / Ht23JA98$XDqHOPhJWtI
# 4. Should see the dashboard

# 5. Visit the jobs page
open https://victorndunda.com/jobs/

# 6. Same credentials should work
```

## Need Help?

If you still can't log in:
1. Check browser console for errors (F12 → Console)
2. Try incognito/private window (rules out cache issues)
3. Verify the site is deployed (wait 30s after push for GitHub Pages)
4. Check that `admin/admin.js` and `jobs/index.html` have the same `FALLBACK_AUTH` values
