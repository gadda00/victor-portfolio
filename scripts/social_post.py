#!/usr/bin/env python3
"""social_post.py — Auto-Post to Social Media (article announcements).

Called from .github/workflows/social-post.yml once per new/modified article.
All inputs arrive via environment variables (no shell interpolation into
Python source, so titles/descriptions with quotes or unicode are safe):

  ARTICLE_TITLE  — article <title> (site suffix already stripped)
  ARTICLE_DESC   — meta description (may be empty)
  ARTICLE_URL    — canonical public URL of the article

Credentials come from repository secrets via env:
  LINKEDIN_ACCESS_TOKEN
  X_OAUTH2_CLIENT_ID, X_OAUTH2_REFRESH_TOKEN, X_OAUTH2_CLIENT_SECRET (optional)
  X_OAUTH2_ACCESS_TOKEN (optional fallback)
  X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET (legacy OAuth 1.0a)
  TIKTOK_ACCESS_TOKEN (video pipeline stub)

Every platform is attempted independently; failures print actionable hints
but never crash the run. Exit code is always 0 unless inputs are missing.
"""
import base64
import hmac
import hashlib
import json
import os
import secrets as pysecrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TITLE = os.environ.get('ARTICLE_TITLE', 'New Article')
DESC = os.environ.get('ARTICLE_DESC', '')
URL = os.environ.get('ARTICLE_URL', '')

if not URL:
    print('FATAL: ARTICLE_URL not set — nothing to post.')
    sys.exit(1)

MESSAGE = f"New article: {TITLE}\n\n{URL}\n\n#AI #MachineLearning #Tech #Kenya"

results = {}

# ─── LinkedIn ─────────────────────────────────────────────────────────
li_token = os.environ.get('LINKEDIN_ACCESS_TOKEN', '')
if li_token:
    print('Posting to LinkedIn...')
    try:
        req = urllib.request.Request(
            'https://api.linkedin.com/v2/userinfo',
            headers={'Authorization': f'Bearer {li_token}'})
        person_id = json.loads(urllib.request.urlopen(req, timeout=15).read()).get('sub', '')
        if person_id:
            post_data = {
                'author': f'urn:li:person:{person_id}',
                'lifecycleState': 'PUBLISHED',
                'specificContent': {
                    'com.linkedin.ugc.ShareContent': {
                        'shareCommentary': {'text': MESSAGE},
                        'shareMediaCategory': 'ARTICLE',
                        'media': [{
                            'status': 'READY',
                            'description': {'text': DESC or TITLE},
                            'originalUrl': URL,
                            'title': {'text': TITLE},
                        }],
                    }
                },
                'visibility': {'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'},
            }
            req = urllib.request.Request(
                'https://api.linkedin.com/v2/ugcPosts',
                data=json.dumps(post_data).encode(),
                headers={
                    'Authorization': f'Bearer {li_token}',
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                method='POST')
            urllib.request.urlopen(req, timeout=15)
            print('  OK: LinkedIn posted!')
            results['linkedin'] = True
        else:
            print('  FAIL: could not resolve LinkedIn person ID')
            results['linkedin'] = False
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors='replace')[:500]
        print(f'  FAIL: LinkedIn HTTP {e.code}: {body}')
        if e.code == 401:
            print('  Hint: token expired or invalid. Regenerate at '
                  'https://developer.linkedin.com > My Apps > Auth')
        results['linkedin'] = False
    except Exception as e:
        print(f'  FAIL: LinkedIn error: {e}')
        results['linkedin'] = False
else:
    print('LinkedIn: LINKEDIN_ACCESS_TOKEN not set — skipping')

# ─── X (Twitter) — OAuth 2.0 with refresh ─────────────────────────────
x_refresh = os.environ.get('X_OAUTH2_REFRESH_TOKEN', '')
x_client_id = os.environ.get('X_OAUTH2_CLIENT_ID', '')
x_access = os.environ.get('X_OAUTH2_ACCESS_TOKEN', '')
x_client_secret = os.environ.get('X_OAUTH2_CLIENT_SECRET', '')

if x_refresh and x_client_id:
    print('Posting to X (OAuth 2.0)...')
    access_token = None
    try:
        refresh_data = {
            'refresh_token': x_refresh,
            'grant_type': 'refresh_token',
            'client_id': x_client_id,
        }
        refresh_headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        if x_client_secret:
            basic = base64.b64encode(f'{x_client_id}:{x_client_secret}'.encode()).decode()
            refresh_headers['Authorization'] = f'Basic {basic}'
            del refresh_data['client_id']
        refresh_req = urllib.request.Request(
            'https://api.twitter.com/2/oauth2/token',
            data=urllib.parse.urlencode(refresh_data).encode(),
            headers=refresh_headers,
            method='POST')
        refresh_json = json.loads(urllib.request.urlopen(refresh_req, timeout=15).read().decode())
        access_token = refresh_json.get('access_token')
        print('  OK: refreshed X access token' if access_token
              else f'  WARN: refresh returned no access token: {refresh_json}')
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors='replace')[:500]
        print(f'  WARN: X refresh failed (HTTP {e.code}): {body}')
        if e.code == 400 and 'invalid_client' in body:
            print('  Hint: app is a "Confidential Client" — set X_OAUTH2_CLIENT_SECRET too.')
    except Exception as e:
        print(f'  WARN: X refresh error: {e}')

    if not access_token and x_access:
        print('  Trying stored access token (may still be valid < 2h)...')
        access_token = x_access

    if access_token:
        try:
            body = json.dumps({'text': MESSAGE[:280]}).encode()
            req = urllib.request.Request(
                'https://api.twitter.com/2/tweets',
                data=body,
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json',
                },
                method='POST')
            post_json = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
            tweet_id = post_json.get('data', {}).get('id', 'unknown')
            print(f'  OK: X posted! Tweet ID: {tweet_id}')
            print(f'  URL: https://x.com/victor_ndunda/status/{tweet_id}')
            results['twitter'] = True
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors='replace')[:500]
            print(f'  FAIL: X post HTTP {e.code}: {body}')
            if e.code == 401:
                print('  Hint: access token expired AND refresh failed. Regenerate at '
                      'https://developer.x.com > App > OAuth 2.0 > Generate tokens')
            elif e.code == 403:
                print('  Hint: app may lack tweet write permission. Check '
                      'https://developer.x.com > App settings > Permissions '
                      '(needs tweet.read + tweet.write)')
            results['twitter'] = False
        except Exception as e:
            print(f'  FAIL: X post error: {e}')
            results['twitter'] = False
    else:
        print('  FAIL: no valid X access token')
        results['twitter'] = False
else:
    # Legacy OAuth 1.0a fallback
    x_key = os.environ.get('X_API_KEY', '')
    x_secret = os.environ.get('X_API_SECRET', '')
    x_token = os.environ.get('X_ACCESS_TOKEN', '')
    x_token_secret = os.environ.get('X_ACCESS_SECRET', '')
    if all([x_key, x_secret, x_token, x_token_secret]):
        print('Posting to X (OAuth 1.0a legacy)...')
        try:
            method = 'POST'
            base_url = 'https://api.twitter.com/2/tweets'
            oauth_params = {
                'oauth_consumer_key': x_key,
                'oauth_nonce': pysecrets.token_hex(16),
                'oauth_signature_method': 'HMAC-SHA256',
                'oauth_timestamp': str(int(time.time())),
                'oauth_token': x_token,
                'oauth_version': '1.0',
            }
            body = json.dumps({'text': MESSAGE[:280]}).encode()
            q = urllib.parse.quote
            params_str = '&'.join(f'{q(k, safe="")}={q(v, safe="")}'
                                  for k, v in sorted(oauth_params.items()))
            base_string = f'{method}&{q(base_url, safe="")}&{q(params_str, safe="")}'
            signing_key = f'{q(x_secret, safe="")}&{q(x_token_secret, safe="")}'
            signature = base64.b64encode(
                hmac.new(signing_key.encode(), base_string.encode(),
                         hashlib.sha256).digest()).decode()
            oauth_params['oauth_signature'] = signature
            auth_header = 'OAuth ' + ', '.join(
                f'{k}="{q(v, safe="")}"' for k, v in sorted(oauth_params.items()))
            req = urllib.request.Request(
                base_url, data=body,
                headers={'Authorization': auth_header, 'Content-Type': 'application/json'},
                method='POST')
            urllib.request.urlopen(req, timeout=15)
            print('  OK: X posted!')
            results['twitter'] = True
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors='replace')[:500]
            print(f'  FAIL: X HTTP {e.code}: {body}')
            results['twitter'] = False
        except Exception as e:
            print(f'  FAIL: X error: {e}')
            results['twitter'] = False
    else:
        print('X: no OAuth 2.0 refresh token or OAuth 1.0a credentials set — skipping')

# ─── TikTok (Content Posting API) ─────────────────────────────────────
# TikTok requires pre-generated video content; this stub logs intent.
tt_token = os.environ.get('TIKTOK_ACCESS_TOKEN', '')
if tt_token:
    print('TikTok: article logged for video pipeline (text-to-video not automated yet).')
    print(f'  Title: {TITLE}')
    print(f'  URL: {URL}')
    results['tiktok'] = 'pending-video-pipeline'
else:
    print('TikTok: TIKTOK_ACCESS_TOKEN not set — skipping')

print('\n=== Summary ===')
for platform, success in results.items():
    status = 'OK' if success is True else ('PENDING' if success == 'pending-video-pipeline' else 'FAIL')
    print(f'  {platform}: {status}')
sys.exit(0)
