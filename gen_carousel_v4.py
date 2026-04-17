"""
V4 — Ultra Minimal: maximum whitespace, whisper-thin accents,
Space Grotesk mono-family, green used sparingly as a single dot/line accent.
"""
import base64
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BD = "#1E7A45"
LBG = "#FAFAF9"
DBG = "#111110"
TOTAL = 7

def pb(i, light):
    pct = ((i+1)/TOTAL)*100
    tc = "rgba(0,0,0,0.06)" if light else "rgba(255,255,255,0.08)"
    fc = B if light else "rgba(255,255,255,0.4)"
    lc = "rgba(0,0,0,0.2)" if light else "rgba(255,255,255,0.2)"
    return f'<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 32px 22px;z-index:10;display:flex;align-items:center;gap:10px;"><div style="flex:1;height:2px;background:{tc};border-radius:1px;overflow:hidden;"><div style="height:100%;width:{pct:.1f}%;background:{fc};border-radius:1px;"></div></div><span style="font-size:10px;color:{lc};font-weight:400;letter-spacing:1px;">{i+1}/{TOTAL}</span></div>'

def ar(light):
    st = "rgba(0,0,0,0.12)" if light else "rgba(255,255,255,0.12)"
    return f'<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="{st}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'

slides = []

# S1: Hero — light, ultra clean
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(0,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 40px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:48px;">
            <img src="{LOGO}" style="width:28px;height:28px;border-radius:7px;" />
            <span style="font-size:11px;font-weight:500;letter-spacing:0.8px;color:rgba(0,0,0,0.35);">WEALTHCLAUDE</span>
        </div>
        <h1 style="font-size:36px;font-weight:300;letter-spacing:-1px;line-height:1.05;color:{DBG};margin:0 0 20px;">5 mistakes<br>investors<br>keep making</h1>
        <div style="width:24px;height:2px;background:{B};border-radius:1px;margin-bottom:16px;"></div>
        <p style="font-size:13px;font-weight:400;color:rgba(0,0,0,0.35);line-height:1.5;margin:0;">And how to fix every one.</p>
    </div>
</div>''')

# Mistakes
mistakes = [
    ("01", "Not benchmarking\nyour returns",
     "Without measuring against an index, you don't know if your strategy works.",
     "Benchmark automatically", "dark"),
    ("02", "Ignoring\ndividend income",
     "Dividends compound silently across markets. Not tracking them distorts your real return.",
     "Track across 6 regions", "light"),
    ("03", "Hidden\nconcentration risk",
     "40%+ in one sector without realizing. Diversification requires allocation data.",
     "See true allocation", "dark"),
    ("04", "Too many tools",
     "Broker. Spreadsheet. News app. Calculator. Fragmented tools, fragmented thinking.",
     "One platform", "light"),
    ("05", "No target,\nno timeline",
     "Investing without a goal is hoping. Set a number. Track the path.",
     "Set & track goals", "dark"),
]

for idx, (num, heading, body, fix, bg) in enumerate(mistakes):
    i = idx + 1
    light = bg == "light"
    bgc = LBG if light else DBG
    hc = DBG if light else "#fff"
    bc = "rgba(0,0,0,0.4)" if light else "rgba(255,255,255,0.35)"
    nc = "rgba(0,0,0,0.04)" if light else "rgba(255,255,255,0.04)"
    fc = BD if light else B
    h = heading.replace("\n", "<br>")
    dot_color = B

    slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{bgc};">
    {pb(i, light)}{ar(light)}
    <div style="position:absolute;top:-10px;right:20px;font-size:160px;font-weight:200;color:{nc};line-height:1;pointer-events:none;letter-spacing:-8px;">{num}</div>
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 40px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <div style="width:6px;height:6px;border-radius:50%;background:{dot_color};"></div>
            <span style="font-size:10px;font-weight:500;letter-spacing:2px;color:{fc};">MISTAKE {num}</span>
        </div>
        <h2 style="font-size:30px;font-weight:300;letter-spacing:-0.8px;line-height:1.08;color:{hc};margin:0 0 14px;">{h}</h2>
        <p style="font-size:13px;font-weight:400;color:{bc};line-height:1.55;margin:0 0 18px;">{body}</p>
        <p style="font-size:11px;font-weight:500;color:{fc};margin:0;letter-spacing:0.5px;">\u2192 {fix}</p>
    </div>
</div>''')

# CTA — light with green accent only
features = ["Benchmarks", "Dividends", "Allocation", "51 Markets", "Free Forever"]
tags = " ".join(f'<span style="font-size:10px;padding:4px 10px;border:1px solid rgba(0,0,0,0.08);border-radius:16px;color:rgba(0,0,0,0.4);letter-spacing:0.5px;">{f}</span>' for f in features)

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(6, True)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:40px;">
            <img src="{LOGO}" style="width:28px;height:28px;border-radius:7px;" />
            <span style="font-size:11px;font-weight:500;letter-spacing:0.8px;color:rgba(0,0,0,0.35);">WEALTHCLAUDE</span>
        </div>
        <h2 style="font-size:32px;font-weight:300;letter-spacing:-0.8px;line-height:1.08;color:{DBG};margin:0 0 14px;">Fix all five.<br>One platform.<br>Zero cost.</h2>
        <div style="width:24px;height:2px;background:{B};border-radius:1px;margin-bottom:16px;"></div>
        <p style="font-size:13px;color:rgba(0,0,0,0.35);line-height:1.5;margin:0 0 24px;">160+ countries. 51 markets. Free forever.</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:28px;">{tags}</div>
        <div style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;background:{DBG};color:#fff;font-size:13px;font-weight:500;border-radius:24px;align-self:flex-start;letter-spacing:0.3px;">
            Start free \u2192
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
dots = "".join(f'<div class="dot" style="height:6px;border-radius:3px;transition:all 0.3s;{"background:#fff;width:8px;" if i==0 else "background:rgba(255,255,255,0.3);width:6px;"}"></div>' for i in range(TOTAL))

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — V4 Ultra Minimal</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#1a1a1a;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Space Grotesk',sans-serif;}}
.ig-frame{{width:420px;background:#000;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);}}
.ig-header{{display:flex;align-items:center;gap:10px;padding:14px 16px;}}
.ig-header .avatar{{width:32px;height:32px;border-radius:50%;border:2px solid {B};overflow:hidden;}}
.ig-header .avatar img{{width:100%;height:100%;object-fit:cover;}}
.ig-header .info{{flex:1;}}
.ig-header .handle{{font-size:13px;font-weight:600;color:#fff;}}
.ig-header .subtitle{{font-size:11px;color:rgba(255,255,255,0.4);}}
.carousel-viewport{{width:420px;aspect-ratio:4/5;overflow:hidden;position:relative;cursor:grab;}}
.carousel-viewport:active{{cursor:grabbing;}}
.carousel-track{{display:flex;transition:transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);}}
.ig-dots{{display:flex;justify-content:center;gap:4px;padding:12px 0;}}
.ig-actions{{display:flex;align-items:center;padding:8px 14px;gap:16px;}}
.ig-actions .right{{margin-left:auto;}}
.ig-caption{{padding:6px 16px 14px;}}
.ig-caption .handle{{font-size:13px;font-weight:600;color:#fff;}}
.ig-caption .text{{font-size:13px;color:rgba(255,255,255,0.7);}}
.ig-caption .time{{font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px;}}
</style>
</head>
<body>
<div class="ig-frame">
  <div class="ig-header">
    <div class="avatar"><img src="{LOGO}" /></div>
    <div class="info"><div class="handle">wealth_claude</div><div class="subtitle">Portfolio Tracker</div></div>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="12" cy="19" r="1.5" fill="rgba(255,255,255,0.5)"/></svg>
  </div>
  <div class="carousel-viewport" id="viewport"><div class="carousel-track" id="track">{all_slides}</div></div>
  <div class="ig-dots" id="dots">{dots}</div>
  <div class="ig-actions">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="1.5"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg class="right" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div class="ig-caption">
    <span class="handle">wealth_claude </span>
    <span class="text">5 investing mistakes. 1 fix. Free forever. Link in bio.</span>
    <div class="time">2 HOURS AGO</div>
  </div>
</div>
<script>
const track=document.getElementById('track'),viewport=document.getElementById('viewport'),dots=document.querySelectorAll('.dot'),SW=420,T={TOTAL};
let cur=0,sx=0,dx=0,drag=false;
function goTo(n){{cur=Math.max(0,Math.min(n,T-1));track.style.transform='translateX('+(-cur*SW)+'px)';dots.forEach((d,i)=>{{d.style.background=i===cur?'#fff':'rgba(255,255,255,0.3)';d.style.width=i===cur?'8px':'6px';}});}}
viewport.addEventListener('pointerdown',e=>{{drag=true;sx=e.clientX;track.style.transition='none';viewport.setPointerCapture(e.pointerId);}});
viewport.addEventListener('pointermove',e=>{{if(!drag)return;dx=e.clientX-sx;track.style.transform='translateX('+(-cur*SW+dx)+'px)';}});
viewport.addEventListener('pointerup',()=>{{if(!drag)return;drag=false;track.style.transition='transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)';if(dx<-50)goTo(cur+1);else if(dx>50)goTo(cur-1);else goTo(cur);dx=0;}});
document.addEventListener('keydown',e=>{{if(e.key==='ArrowRight')goTo(cur+1);if(e.key==='ArrowLeft')goTo(cur-1);}});
</script>
</body>
</html>'''

Path("carousel_v4_minimal.html").write_text(html, encoding="utf-8")
print(f"V4 Ultra Minimal written ({len(html):,} bytes)")
