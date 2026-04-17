"""
Variation A: Dark-First Premium — matches WealthClaude's website dark aesthetic.
Glassmorphism cards, neon green on dark, starts dark instead of light.
"""
import base64
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

# Color tokens — darker, more contrast
B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#F2F7F4"
LBR = "#DDE8E1"
DBG = "#060A10"       # Matching the actual website bg
CARD = "rgba(74,222,128,0.06)"
CARD_BORDER = "rgba(74,222,128,0.12)"

TOTAL = 7

def progress_bar(i, total, is_light):
    pct = ((i + 1) / total) * 100
    tc = "rgba(0,0,0,0.08)" if is_light else "rgba(255,255,255,0.1)"
    fc = B if is_light else B
    lc = "rgba(0,0,0,0.3)" if is_light else "rgba(255,255,255,0.3)"
    return f'''<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
        <div style="flex:1;height:3px;background:{tc};border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:{pct:.1f}%;background:{fc};border-radius:2px;"></div>
        </div>
        <span class="sans" style="font-size:11px;color:{lc};font-weight:500;">{i+1}/{total}</span>
    </div>'''

def arrow(is_light):
    bg = "rgba(0,0,0,0.06)" if is_light else "rgba(255,255,255,0.06)"
    st = "rgba(0,0,0,0.25)" if is_light else "rgba(255,255,255,0.25)"
    return f'''<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="{st}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>'''

def lockup(light=False):
    c = DBG if light else "#fff"
    return f'''<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <img src="{LOGO}" style="width:36px;height:36px;border-radius:10px;" />
        <span class="sans" style="font-size:13px;font-weight:600;letter-spacing:0.5px;color:{c};">WealthClaude</span>
    </div>'''

slides = []

# --- SLIDE 1: Hero — DARK (website style) ---
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {progress_bar(0, TOTAL, False)}{arrow(False)}
    <div style="position:absolute;top:-60px;right:-60px;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.15) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        {lockup()}
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{B};margin-bottom:20px;">INVESTING TIPS</span>
        <h1 class="serif" style="font-size:36px;font-weight:600;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 16px;">5 Mistakes<br>Self-Directed<br>Investors Make</h1>
        <p class="sans" style="font-size:15px;color:rgba(255,255,255,0.5);line-height:1.5;margin:0;">And how to fix every single one.</p>
    </div>
</div>''')

# --- MISTAKES 2-6: Alternating dark/light with glass cards ---
mistakes = [
    ("01", "Not Benchmarking\nYour Returns",
     "You think you're doing well — but compared to what? Without measuring against the S&P 500, you have no idea if you're winning.",
     "Track performance vs. benchmarks automatically.", "light"),
    ("02", "Ignoring Your\nDividend Income",
     "Dividends compound silently. If you're not tracking payouts globally, you're missing a huge piece of your total return.",
     "Monitor dividends across 6 regions in one view.", "dark"),
    ("03", "Over-Concentrated\nWithout Knowing It",
     "Many investors unknowingly hold 40%+ in one sector. Without allocation tracking, concentration risk hides in plain sight.",
     "See your real allocation with one click.", "light"),
    ("04", "Scattered Across\nToo Many Tools",
     "Broker app. Spreadsheet. News app. Dividend calculator. Fragmented tools = fragmented decisions.",
     "One platform for portfolio, markets & news.", "dark"),
    ("05", "No Financial Goal\nor Timeline",
     "Investing without a target is like driving without a destination. No milestones — just hoping it works out.",
     "Set goals and track your progress over time.", "light"),
]

for idx, (num, heading, body, fix, bg) in enumerate(mistakes):
    i = idx + 1
    is_light = bg == "light"
    bg_css = LBG if is_light else DBG
    h_color = DBG if is_light else "#fff"
    b_color = "#5A5550" if is_light else "rgba(255,255,255,0.55)"
    tag_color = B if is_light else BL
    num_color = B if is_light else "rgba(74,222,128,0.08)"
    num_opacity = "0.08" if is_light else "1"
    fix_bg = "rgba(74,222,128,0.06)" if is_light else CARD
    fix_border = "rgba(74,222,128,0.12)" if is_light else CARD_BORDER
    fix_color = BD if is_light else BL
    heading_html = heading.replace("\n", "<br>")

    glow = ""
    if not is_light:
        glow = f'<div style="position:absolute;bottom:-40px;left:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.08) 0%,transparent 70%);pointer-events:none;"></div>'

    slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{bg_css};">
    {progress_bar(i, TOTAL, is_light)}{arrow(is_light)}
    {glow}
    <div style="position:absolute;top:16px;right:20px;font-size:130px;font-weight:700;color:{num_color};opacity:{num_opacity};line-height:1;pointer-events:none;" class="serif">{num}</div>
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{tag_color};margin-bottom:14px;">MISTAKE #{num}</span>
        <h2 class="serif" style="font-size:30px;font-weight:600;letter-spacing:-0.3px;line-height:1.1;color:{h_color};margin:0 0 12px;">{heading_html}</h2>
        <p class="sans" style="font-size:14px;color:{b_color};line-height:1.55;margin:0 0 16px;">{body}</p>
        <div style="padding:10px 14px;background:{fix_bg};border:1px solid {fix_border};border-radius:10px;backdrop-filter:blur(8px);">
            <p class="sans" style="font-size:12px;font-weight:600;color:{fix_color};margin:0;">\u2713 {fix}</p>
        </div>
    </div>
</div>''')

# --- SLIDE 7: CTA — Dark with green glow ---
features = [
    ("\U0001F4CA", "Portfolio Tracking & Benchmarks"),
    ("\U0001F4B0", "Global Dividend Monitoring"),
    ("\U0001F30D", "51 Markets on a 3D Globe"),
    ("\U0001F512", "No Bank Account Required"),
    ("\u26A1", "Free Forever Plan"),
]
feat_html = ""
for icon, label in features:
    feat_html += f'''<div style="display:flex;align-items:center;gap:10px;padding:5px 0;">
        <span style="font-size:13px;">{icon}</span>
        <span class="sans" style="font-size:12px;color:rgba(255,255,255,0.75);font-weight:500;">{label}</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {progress_bar(6, TOTAL, False)}
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.12) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        {lockup()}
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{B};margin-bottom:14px;">THE FIX</span>
        <h2 class="serif" style="font-size:28px;font-weight:600;letter-spacing:-0.3px;line-height:1.1;color:#fff;margin:0 0 10px;">Fix All 5 With<br>One Free Platform</h2>
        <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5;margin:0 0 18px;">Join investors in 160+ countries who track, analyze, and invest smarter.</p>
        <div style="margin-bottom:20px;">{feat_html}</div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{B};color:{DBG};font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14px;border-radius:28px;align-self:flex-start;">
            Start Free \u2192 wealthclaude.com
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)

# Dots
dots = ""
for i in range(TOTAL):
    s = "height:6px;border-radius:3px;transition:all 0.3s;"
    s += "background:#fff;width:8px;" if i == 0 else "background:rgba(255,255,255,0.3);width:6px;"
    dots += f'<div class="dot" data-index="{i}" style="{s}"></div>'

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WealthClaude Carousel — V2 Dark Premium</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&display=swap" rel="stylesheet">
<style>
  *{{margin:0;padding:0;box-sizing:border-box;}}
  body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;}}
  .serif{{font-family:'Fraunces','Georgia',serif;}}
  .sans{{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;}}
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
  .ig-actions svg{{cursor:pointer;}}
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
  <div class="carousel-viewport" id="viewport">
    <div class="carousel-track" id="track">{all_slides}</div>
  </div>
  <div class="ig-dots" id="dots">{dots}</div>
  <div class="ig-actions">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="1.5"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg class="right" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div class="ig-caption">
    <span class="handle">wealth_claude </span>
    <span class="text">Stop making these 5 investing mistakes. Track smarter — free forever. Link in bio \U0001F517</span>
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

Path("carousel_v2_dark.html").write_text(html, encoding="utf-8")
print(f"V2 Dark Premium written ({len(html):,} bytes)")
