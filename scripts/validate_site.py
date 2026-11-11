#!/usr/bin/env python3
"""Site quality gate for victor-portfolio (stdlib only — runs in CI and locally).

Checks:
  1. projects.json is valid JSON with required fields and unique project ids
  2. No duplicated aria-current (or other duplicated) attributes in HTML
  3. No duplicate element ids in static HTML markup
  4. The <noscript> fallback on the projects page lists every project (by name)
     -> keeps the no-JS/crawler fallback in sync with projects.json
  5. Internal links resolve to files that exist in the repo
  6. The projects page fetch path is relative (no absolute /projects/... URL)
  7. Homepage project-count wording matches projects.json (count-sync guard)
  8. Main pages have <title> and meta description

Exit code 1 with a report on any failure. Intended to gate GitHub Pages deploys.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = []
warnings = []


def fail(msg):
    failures.append(msg)


def ok(msg):
    print("  ok  -", msg)


def html_files():
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", "brand-assets")]
        for fn in filenames:
            if fn.endswith(".html"):
                out.append(os.path.join(dirpath, fn))
    return out


# ---------- 1. projects.json ----------
print("[1/8] projects.json")
try:
    with open(os.path.join(ROOT, "projects", "projects.json"), encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:  # noqa: BLE001
    print("  FAIL - projects.json is not valid JSON:", e)
    sys.exit(1)

projects = data.get("projects", [])
required = {"id", "name", "tagline", "description", "category", "status", "featured", "priority"}
ids = [p.get("id") for p in projects]
if len(ids) != len(set(ids)):
    fail("projects.json: duplicate project ids")
for p in projects:
    missing = required - set(p.keys())
    if missing:
        fail("projects.json: project '%s' missing fields: %s" % (p.get("id"), sorted(missing)))
valid_status = {"production", "active", "trial", "demo", "shipped", "dev"}
for p in projects:
    if p.get("status") not in valid_status:
        fail("projects.json: project '%s' has unknown status '%s'" % (p.get("id"), p.get("status")))
ok("%d projects, ids unique, required fields present, statuses valid" % len(projects))

# ---------- 2/3. duplicated attributes & ids ----------
print("[2/8] duplicated aria-current attributes")
dup_count = 0
for path in html_files():
    src = open(path, encoding="utf-8", errors="replace").read()
    for m in re.finditer(r"<a\s[^>]*>", src):
        if m.group(0).count("aria-current") > 1:
            fail("%s: duplicated aria-current in nav: %s" % (os.path.relpath(path, ROOT), m.group(0)[:70]))
            dup_count += 1
if dup_count == 0:
    ok("none found in any HTML page")

print("[3/8] duplicate element ids")
for path in html_files():
    src = open(path, encoding="utf-8", errors="replace").read()
    # strip JS template strings before counting (they produce false positives)
    src = re.sub(r"<script>.*?</script>", "", src, flags=re.S)
    ids = re.findall(r'(?<![-\w])id="([^"]+)"', src)
    seen, dups = set(), set()
    for i in ids:
        if i in seen:
            dups.add(i)
        seen.add(i)
    for i in sorted(dups):
        fail("%s: duplicate id '%s'" % (os.path.relpath(path, ROOT), i))
if not any("duplicate id" in f for f in failures):
    ok("none found")

# ---------- 4. static-first project cards ----------
print("[4/8] projects index ships all cards in static HTML (no-JS/crawler safe)")
projects_page = open(os.path.join(ROOT, "projects", "index.html"), encoding="utf-8").read()
static_cards = projects_page.count('class="bento-card')
if static_cards != len(projects):
    fail("projects/index.html has %d static .bento-card elements, projects.json has %d" % (static_cards, len(projects)))
elif "Loading projects" in projects_page:
    fail("projects/index.html still contains a 'Loading projects' placeholder")
else:
    ok("all %d project cards are baked into the initial HTML" % len(projects))
# noscript belt-and-suspenders: every project still listed
noscript_m = re.search(r"<noscript>(.*?)</noscript>", projects_page, re.S)
if not noscript_m:
    warnings.append("projects/index.html: no <noscript> plain-links fallback (optional now that cards are static)")
else:
    block = noscript_m.group(1)
    missing = [p["name"] for p in projects if p["name"].split(" (")[0] not in block]
    if missing:
        warnings.append("noscript plain-links fallback missing: %s" % ", ".join(missing))
    else:
        ok("noscript plain-links fallback lists all %d projects" % len(projects))

# ---------- 5. internal links ----------
print("[5/8] internal link targets exist")
link_re = re.compile(r'(?:href|src)="(/[^"#?]*)"')
checked, broken = 0, 0
for path in html_files():
    src = open(path, encoding="utf-8", errors="replace").read()
    for m in link_re.finditer(src):
        target = m.group(1)
        if target.startswith("//"):
            continue
        local = target.lstrip("/") or "index.html"
        if local.endswith("/"):
            local += "index.html"
        if not os.path.exists(os.path.join(ROOT, local)):
            fail("%s: broken internal link '%s'" % (os.path.relpath(path, ROOT), target))
            broken += 1
        checked += 1
if broken == 0:
    ok("%d internal links checked, none broken" % checked)

# ---------- 6. no runtime data fetching on the projects index ----------
print("[6/8] projects index requires no runtime fetch (static-first)")
if "fetch(" in projects_page:
    fail("projects/index.html still calls fetch() — the index must be self-contained")
elif "api.github.com" in projects_page:
    fail("projects/index.html still references the GitHub API (403 spray source)")
else:
    ok("no fetch(), no third-party API — filters enhance the static DOM")

# ---------- 7. homepage count sync ----------
print("[7/8] homepage project-count wording matches projects.json")
home = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
m = re.search(r"(?:archive — (\d+) projects|(\d+)-project archive)", home)
if m:
    m = m.group(1) or m.group(2)
if not m:
    warnings.append("index.html: archive-count sentence not found — update the validator if wording changed")
else:
    stated = int(m)
    if stated != len(projects):
        fail("index.html says '%d projects' but projects.json has %d — update the wording" % (stated, len(projects)))
    else:
        ok("homepage says %d, projects.json has %d" % (stated, len(projects)))

# ---------- 8. page metadata ----------
print("[8/8] title + meta description on main pages")
main_pages = ["index.html", "projects/index.html", "services/index.html",
              "resume/index.html", "blog/index.html", "book/index.html", "404.html"]
for pg in main_pages:
    fp = os.path.join(ROOT, pg)
    if not os.path.exists(fp):
        warnings.append("expected main page missing: %s" % pg)
        continue
    src = open(fp, encoding="utf-8", errors="replace").read()
    if not re.search(r"<title>[^<]{3,}</title>", src):
        fail("%s: missing or empty <title>" % pg)
    if not re.search(r'<meta\s+name="description"\s+content="[^"]{20,}"', src):
        fail("%s: missing or too-short meta description" % pg)
checked_meta = [p for p in main_pages if os.path.exists(os.path.join(ROOT, p))]
if not any(": missing" in f for f in failures):
    ok("%d main pages have title + meta description" % len(checked_meta))

# ---------- report ----------
print()
for w in warnings:
    print("WARN -", w)
if failures:
    print("VALIDATION FAILED (%d error%s)" % (len(failures), "s" if len(failures) != 1 else ""))
    for f in failures:
        print("  FAIL -", f)
    sys.exit(1)
print("VALIDATION PASSED — site is safe to deploy")
