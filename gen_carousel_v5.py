"""
V5 — Bold Type: oversized display headings that fill the slide,
high contrast, numbers as massive design elements, Bricolage Grotesque.
"""
import base64
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#F0F0EC"
DBG = "#0C0C0A"
TOTAL = 7

def pb(i, light):
    pct = ((i+1)/TOTAL)*100
    tc = "rgba(0,0,0,0.06)" if light else "rgba(255,255,255,0.08)"
    fc = B if light else B
    lc = "rgba(0,0,0,0.25)" if light else "rgba(255,255,255,0.25)"
    return f'<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;"><div style="flex:1;height:3px;background:{tc};border-radius:2px;overflow:hidden;"><div style="height:100%;width:{pct:.1f}%;background:{fc};border-radius:2px;"></div></div><span style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:11px;color:{lc};font-weight:500;">{i+1}/{TOTAL}</span></div>'

def ar(light):
    bg = "rgba(0,0,0,0.04)" if light else "rgba(255,255,255,0.04)"
    st = "rgba(0,0,0,0.18)" if light else "rgba(255,255,255,0.18)"
    return f'<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="{st}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'

slides = []

# S1: Hero — dark, massive type
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(0, False)}{ar(False)}
    <div style="display:flex;flex-direction:column;height:100%;padding:0;">
        <div style="padding:28px 32px 0;display:flex;align-items:center;gap:8px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.4);">WEALTHCLAUDE</span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 32px 52px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:3px;color:{B};margin-bottom:20px;">INVESTING TIPS</span>
            <h1 style="font-size:48px;font-weight:800;letter-spacing:-2px;line-height:0.95;color:#fff;margin:0 0 20px;text-transform:uppercase;">5 Costly<br>Investor<br>Mistakes</h1>
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:32px;height:3px;background:{B};border-radius:2px;"></div>
                <span style="font-size:12px;color:rgba(255,255,255,0.3);font-weight:400;">Swipe to learn \u2192</span>
            </div>
        </div>
    </div>
</div>''')

# Mistakes — alternating, bold numbers as hero element
mistakes = [
    ("01", "NO\nBENCHMARK",
     "You think you're winning. But compared to what? Without an index comparison, it's just a guess.",
     "Auto-benchmark your returns", "light"),
    ("02", "DIVIDEND\nBLIND SPOT",
     "Dividends compound silently across 6+ regions. Missing them distorts your entire picture.",
     "Track global dividends", "dark"),
    ("03", "HIDDEN\nCONCENTRATION",
     "40% in one sector and you don't even know. Diversification without data is an illusion.",
     "Real allocation, one click", "light"),
    ("04", "TOOL\nSPRAWL",
     "Broker. Spreadsheet. News app. Calculator. Four tools. Zero clarity.",
     "One platform replaces all", "dark"),
    ("05", "NO GOAL\nNO PLAN",
     "Investing without a target is gambling with a spreadsheet. Set the number. Track the path.",
     "Set goals, track progress", "light"),
]

for idx, (num, heading, body, fix, bg) in enumerate(mistakes):
    i = idx + 1
    light = bg == "light"
    bgc = LBG if light else DBG
    hc = DBG if light else "#fff"
    bc = "rgba(0,0,0,0.45)" if light else "rgba(255,255,255,0.4)"
    fc = BD if light else B
    h = heading.replace("\n", "<br>")

    # Big number — fills the top portion
    num_color = "rgba(0,0,0,0.04)" if light else "rgba(255,255,255,0.04)"

    slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{bgc};">
    {pb(i, light)}{ar(light)}
    <div style="position:absolute;top:-30px;left:24px;font-size:220px;font-weight:800;color:{num_color};line-height:1;pointer-events:none;letter-spacing:-12px;">{num}</div>
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <div style="width:8px;height:8px;border-radius:50%;background:{B};"></div>
            <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{fc};">MISTAKE {num}</span>
        </div>
        <h2 style="font-size:38px;font-weight:800;letter-spacing:-1.5px;line-height:0.95;color:{hc};margin:0 0 14px;text-transform:uppercase;">{h}</h2>
        <p style="font-size:13px;font-weight:400;color:{bc};line-height:1.5;margin:0 0 16px;">{body}</p>
        <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:2px;background:{B};border-radius:1px;"></div>
            <span style="font-size:11px;font-weight:600;color:{fc};letter-spacing:0.3px;">{fix}</span>
        </div>
    </div>
</div>''')

# CTA — green bg, black bold type
features = ["Benchmarks", "Dividends", "Allocation", "51 Markets", "Free"]
tags = "".join(f'<span style="font-size:10px;font-weight:700;padding:5px 12px;background:rgba(0,0,0,0.08);border-radius:20px;color:rgba(0,0,0,0.5);letter-spacing:1px;text-transform:uppercase;">{f}</span> ' for f in features)

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{B};">
    {pb(6, True)}
    <div style="display:flex;flex-direction:column;height:100%;padding:0;">
        <div style="padding:28px 32px 0;display:flex;align-items:center;gap:8px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(0,0,0,0.4);">WEALTHCLAUDE</span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 32px 52px;">
            <h2 style="font-size:44px;font-weight:800;letter-spacing:-2px;line-height:0.95;color:{DBG};margin:0 0 16px;text-transform:uppercase;">Fix all<br>five.<br>Pay<br>nothing.</h2>
            <p style="font-size:13px;color:rgba(0,0,0,0.45);line-height:1.5;margin:0 0 22px;">160+ countries. 51 markets.</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:26px;">{tags}</div>
            <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{DBG};color:{B};font-weight:700;font-size:14px;border-radius:28px;align-self:flex-start;letter-spacing:0.5px;">
                START FREE \u2192
            </div>
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
dots = "".join(f'<div class="dot" style="height:6px;border-radius:3px;transition:all 0.3s;{"background:#fff;width:8px;" if i==0 else "background:rgba(255,255,255,0.3);width:6px;"}"></div>' for i in range(TOTAL))

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — V5 Bold Type</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Bricolage Grotesque',sans-serif;}}
.ig-frame{{width:420px;background:#000;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);}}
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
    <span class="text">5 COSTLY MISTAKES. 1 FREE FIX. Link in bio \U0001F517</span>
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

Path("carousel_v5_bold.html").write_text(html, encoding="utf-8")
print(f"V5 Bold Type written ({len(html):,} bytes)")
