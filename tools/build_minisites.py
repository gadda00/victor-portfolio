#!/usr/bin/env python3
"""Generate static mini-sites for Victor's systems and deploy them to Vercel.

Each mini-site is a single self-contained index.html matching the main
portfolio's design language (dark, acid accent, editorial type).
"""
import json
import html as H
from pathlib import Path

ROOT = Path("/home/z/my-project")
DATA = json.loads((ROOT / "scripts/minisites/data.json").read_text())
OUT = ROOT / "minisites"

def esc(s: str) -> str:
    return H.escape(s, quote=True)

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__NAME__ — __TAGLINE__</title>
<meta name="description" content="__SUMMARY_ATTR__">
<meta property="og:title" content="__NAME__ — a system by Victor Ndunda">
<meta property="og:description" content="__SUMMARY_ATTR__">
<meta property="og:type" content="website">
<link rel="icon" href="__BASE__/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --base:#070808; --raised:#0c0e0d; --panel:#121514;
  --ink:#eceee9; --dim:#9aa29a; --faint:#646c64;
  --line:rgba(236,238,233,.09); --acid:#c8f24f; --accent:__ACCENT__;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--base);color:var(--ink);font-family:Inter,system-ui,sans-serif;overflow-x:clip;-webkit-font-smoothing:antialiased}
::selection{background:var(--acid);color:var(--base)}
a{color:inherit;text-decoration:none}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.wrap{max-width:72rem;margin-inline:auto;padding-inline:1.25rem}
@media(min-width:640px){.wrap{padding-inline:2rem}}
.grain{position:fixed;inset:0;z-index:50;pointer-events:none;opacity:.055;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:240px}
.dots{position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(rgba(236,238,233,.06) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(to bottom,black,transparent 80%)}
/* header */
.top{position:fixed;inset-x:0;top:0;z-index:40;border-bottom:1px solid transparent;transition:.5s}
.top.scrolled{background:rgba(7,8,8,.85);backdrop-filter:blur(12px);border-color:var(--line)}
.top-in{display:flex;align-items:center;justify-content:space-between;height:64px}
.mark{display:flex;align-items:center;gap:12px}
.mark .v{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;background:var(--acid);color:var(--base);font-family:'Bricolage Grotesque',sans-serif;font-weight:800}
.mark .nm{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.22em;color:var(--ink)}
.top-cta{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);border:1px solid var(--line);padding:9px 16px;border-radius:99px;transition:.3s}
.top-cta:hover{border-color:var(--acid);color:var(--acid)}
/* hero */
.hero{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding-top:96px;padding-bottom:56px}
.kicker{display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--dim)}
.kicker .dot{width:6px;height:6px;border-radius:99px;background:var(--acid);box-shadow:0 0 0 0 rgba(200,242,79,.45);animation:pulse 2.6s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(200,242,79,.45)}75%{box-shadow:0 0 0 8px rgba(200,242,79,0)}100%{box-shadow:0 0 0 0 rgba(200,242,79,0)}}
h1{margin-top:36px;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:-.02em;line-height:.95;font-size:clamp(2.6rem,8vw,6.4rem);max-width:16ch}
h1 .hl{color:var(--accent)}
.hero p.sub{margin-top:28px;max-width:38rem;font-size:15px;line-height:1.75;color:var(--dim)}
.ctas{margin-top:36px;display:flex;flex-wrap:wrap;gap:14px}
.btn{display:inline-flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:16px 26px;transition:.3s}
.btn.p{background:var(--acid);color:var(--base)}
.btn.p:hover{background:#d8ff6e;transform:translateY(-2px)}
.btn.o{border:1px solid var(--line);color:var(--ink)}
.btn.o:hover{border-color:var(--acid);color:var(--acid)}
.btn .ar{transition:.3s}
.btn:hover .ar{transform:translate(2px,-2px)}
/* metrics */
.metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:56px}
@media(min-width:768px){.metrics{grid-template-columns:repeat(4,1fr)}}
.metric{background:rgba(7,8,8,.8);backdrop-filter:blur(4px);padding:22px 20px}
.metric .v{font-family:'Bricolage Grotesque',sans-serif;font-size:2.1rem;font-weight:700;color:var(--accent)}
.metric .l{margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint)}
/* sections */
section.block{padding:88px 0 0}
.slabel{display:flex;align-items:center;gap:16px}
.slabel .n{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--acid)}
.slabel .t{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--dim)}
.slabel .ln{flex:1;height:1px;background:var(--line)}
h2{margin-top:26px;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;letter-spacing:-.01em;line-height:1.05;font-size:clamp(1.9rem,4.5vw,3.4rem)}
/* features */
.feats{margin-top:52px;display:grid;gap:1px;background:var(--line);border:1px solid var(--line)}
@media(min-width:768px){.feats{grid-template-columns:1fr 1fr}}
.feat{background:var(--base);padding:30px;transition:background .3s}
.feat:hover{background:var(--raised)}
.feat .fn{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--acid)}
.feat h3{margin-top:16px;font-family:'Bricolage Grotesque',sans-serif;font-size:1.28rem;font-weight:700}
.feat p{margin-top:10px;font-size:14px;line-height:1.7;color:var(--dim)}
/* flow */
.flow{margin-top:44px;display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.chip{border:1px solid __ACCENT__44;border-radius:10px;padding:11px 15px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.far{color:var(--faint);font-family:'JetBrains Mono',monospace}
/* stack */
.stack{margin-top:44px;display:flex;flex-wrap:wrap;gap:8px}
.stack span{border:1px solid var(--line);border-radius:99px;padding:7px 14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dim);transition:.3s}
.stack span:hover{border-color:var(--accent);color:var(--ink)}
/* cta band */
.band{margin-top:96px;border-top:1px solid var(--line);padding:72px 0}
.band h2{max-width:22ch}
.band .ctas{margin-top:34px}
/* footer */
footer{border-top:1px solid var(--line)}
.f-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding:22px 0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint)}
.f-in a:hover{color:var(--acid)}
/* reveal */
.rv{opacity:0;transform:translateY(26px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
.rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}.kicker .dot{animation:none}}
</style>
</head>
<body>
<div class="grain"></div>
<div class="dots"></div>

<header class="top" id="top">
  <div class="wrap top-in">
    <a class="mark" href="__BASE__">
      <span class="v">V</span>
      <span class="nm">__NAME__</span>
    </a>
    <a class="top-cta" href="__BASE__">victorndunda.com</a>
  </div>
</header>

<main>
  <section class="hero wrap">
    <p class="kicker"><span class="dot"></span> __DOMAIN__ · __YEAR__ · __STATUS__</p>
    <h1>__TAGLINE_HTML__</h1>
    <p class="sub">__SUMMARY_HTML__</p>
    <div class="ctas">
      __CTAS__
    </div>
    <dl class="metrics">
      __METRICS__
    </dl>
  </section>

  <section class="block wrap">
    <div class="slabel rv"><span class="n">01</span><span class="t">What it does</span><span class="ln"></span></div>
    <h2 class="rv">The system, piece by piece.</h2>
    <div class="feats">
      __FEATURES__
    </div>
  </section>

  <section class="block wrap">
    <div class="slabel rv"><span class="n">02</span><span class="t">How it runs</span><span class="ln"></span></div>
    <h2 class="rv">One loop, end to end.</h2>
    <div class="flow rv">
      __FLOW__
    </div>
    <div class="stack rv">
      __STACK__
    </div>
  </section>

  <section class="band wrap">
    <div class="slabel rv"><span class="n">03</span><span class="t">The engineer behind it</span><span class="ln"></span></div>
    <h2 class="rv">Built by Victor Ndunda — AI systems engineer, Nairobi.</h2>
    <p class="sub rv" style="margin-top:22px;max-width:38rem;font-size:15px;line-height:1.75;color:var(--dim)">
      __NAME__ is one of thirteen production systems — client platforms in public trial,
      owned products and open-source tools. See the full portfolio and the case study
      behind this one.
    </p>
    <div class="ctas rv">
      <a class="btn p" href="__CASE_STUDY__">Read the case study <span class="ar">→</span></a>
      <a class="btn o" href="__GITHUB_PROFILE__">GitHub <span class="ar">↗</span></a>
      <a class="btn o" href="__LINKEDIN__">LinkedIn <span class="ar">↗</span></a>
    </div>
  </section>
</main>

<footer>
  <div class="wrap f-in">
    <span>© 2026 Victor Ndunda · Nairobi, Kenya</span>
    <span><a href="__BASE__">victorndunda.com</a></span>
  </div>
</footer>

<script>
(function(){
  var top=document.getElementById('top');
  var on=function(){top.classList.toggle('scrolled',window.scrollY>24)};
  on();window.addEventListener('scroll',on,{passive:true});
  var els=document.querySelectorAll('.rv');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.1});
  els.forEach(function(e){io.observe(e)});
})();
</script>
</body>
</html>
"""

def build_site(site: dict) -> str:
    base = DATA["portfolio_base"]
    case_study = f"{base}/work/{site.get('case_slug', site['dir'])}"

    ctas = []
    if site.get("github_repo"):
        ctas.append(
            f'<a class="btn p" href="{esc(site["github_repo"])}" target="_blank" rel="noopener noreferrer">View source on GitHub <span class="ar">↗</span></a>'
        )
    if site.get("extra_link"):
        ctas.append(
            f'<a class="btn o" href="{esc(site["extra_link"]["url"])}" target="_blank" rel="noopener noreferrer">{esc(site["extra_link"]["label"])} <span class="ar">↗</span></a>'
        )
    ctas.append(
        f'<a class="btn o" href="{esc(case_study)}">Case study <span class="ar">→</span></a>'
    )

    metrics = "\n      ".join(
        f'<div class="metric"><dd class="v">{esc(m["value"])}</dd><dt class="l">{esc(m["label"])}</dt></div>'
        for m in site["metrics"]
    )

    features = "\n      ".join(
        f'<article class="feat rv"><span class="fn">{esc(str(i+1).zfill(2))}</span><h3>{esc(f["title"])}</h3><p>{esc(f["body"])}</p></article>'
        for i, f in enumerate(site["features"])
    )

    flow_items = site["flow"]
    flow = "\n      ".join(
        (f'<span class="chip">{esc(item)}</span>' if i == 0 else f'<span class="far">→</span><span class="chip">{esc(item)}</span>')
        for i, item in enumerate(flow_items)
    )

    stack = "\n      ".join(f"<span>{esc(s)}</span>" for s in site["stack"])

    page = (
        TEMPLATE
        .replace("__NAME__", esc(site["name"]))
        .replace("__TAGLINE_HTML__", esc(site["tagline"]))
        .replace("__TAGLINE__", esc(site["tagline"]))
        .replace("__SUMMARY_ATTR__", esc(site["summary"])[:160])
        .replace("__SUMMARY_HTML__", esc(site["summary"]))
        .replace("__ACCENT__", site["accent"])
        .replace("__DOMAIN__", esc(site["domain"]))
        .replace("__YEAR__", esc(site["year"]))
        .replace("__STATUS__", esc(site["status"]))
        .replace("__BASE__", base)
        .replace("__CASE_STUDY__", case_study)
        .replace("__GITHUB_PROFILE__", DATA["github"])
        .replace("__LINKEDIN__", DATA["linkedin"])
        .replace("__CTAS__", "\n      ".join(ctas))
        .replace("__METRICS__", metrics)
        .replace("__FEATURES__", features)
        .replace("__FLOW__", flow)
        .replace("__STACK__", stack)
    )

    # highlight the first clause of the tagline in the accent color
    words = esc(site["tagline"]).split(". ")
    if len(words) > 1:
        hl = esc(words[0]) + "."
        rest = ". ".join(esc(w) for w in words[1:])
        page = page.replace(
            f">{esc(site['tagline'])}<", f'>{hl}<span class="hl"> {rest}</span><', 1
        )

    return page


def main():
    for site in DATA["sites"]:
        out_dir = OUT / site["dir"]
        out_dir.mkdir(parents=True, exist_ok=True)
        page = build_site(site)
        (out_dir / "index.html").write_text(page)
        print(f"built {site['dir']}/index.html ({len(page)} bytes)")


if __name__ == "__main__":
    main()
