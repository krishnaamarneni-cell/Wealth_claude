"""
Variation B: Bold Editorial — large type, split layouts, Libre Baskerville + Work Sans.
Color-block sections with strong visual hierarchy.
"""
import base64
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#F7F5F2"      # Warm cream
LBR = "#E8E4DF"
DBG = "#141210"       # Warm near-black

TOTAL = 7

def progress_bar(i, total, is_light):
    pct = ((i + 1) / total) * 100
    tc = "rgba(0,0,0,0.08)" if is_light else "rgba(255,255,255,0.1)"
    fc = B if is_light else "#fff"
    lc = "rgba(0,0,0,0.25)" if is_light else "rgba(255,255,255,0.3)"
    return f'''<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
        <div style="flex:1;height:3px;background:{tc};border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:{pct:.1f}%;background:{fc};border-radius:2px;"></div>
        </div>
        <span class="sans" style="font-size:11px;color:{lc};font-weight:500;">{i+1}/{total}</span>
    </div>'''

def arrow(is_light):
    bg = "rgba(0,0,0,0.04)" if is_light else "rgba(255,255,255,0.05)"
    st = "rgba(0,0,0,0.2)" if is_light else "rgba(255,255,255,0.2)"
    return f'''<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="{st}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>'''

slides = []

# --- SLIDE 1: HERO — Split layout, green accent bar ---
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {progress_bar(0, TOTAL, True)}{arrow(True)}
    <div style="position:absolute;left:0;top:0;width:6px;height:100%;background:{B};"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px 46px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
            <img src="{LOGO}" style="width:36px;height:36px;border-radius:10px;" />
            <span class="sans" style="font-size:12px;font-weight:600;letter-spacing:0.5px;color:{DBG};">WealthClaude</span>
        </div>
        <div style="width:40px;height:3px;background:{B};border-radius:2px;margin-bottom:20px;"></div>
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2.5px;color:{B};margin-bottom:14px;">INVESTING TIPS</span>
        <h1 class="serif" style="font-size:38px;font-weight:700;letter-spacing:-0.8px;line-height:1.05;color:{DBG};margin:0 0 18px;">5 Mistakes<br>Investors<br>Keep Making</h1>
        <p class="sans" style="font-size:14px;color:#8A8580;line-height:1.5;margin:0;">And the one platform that fixes them all.</p>
    </div>
</div>''')

# --- MISTAKES — Alternating with bold number + divider style ---
mistakes = [
    ("01", "Not Benchmarking\nYour Returns",
     "Without measuring against the S&P 500 or your target index, you have zero idea if your strategy is working.",
     "Track performance vs. benchmarks.", "dark"),
    ("02", "Ignoring Dividend\nIncome",
     "Dividends compound silently across markets. Not tracking them means missing a critical piece of total return.",
     "Monitor dividends across 6 regions.", "light"),
    ("03", "Hidden\nConcentration Risk",
     "40%+ in one sector without knowing it. Real diversification requires real allocation data.",
     "See your true allocation instantly.", "dark"),
    ("04", "Too Many Tools,\nToo Little Clarity",
     "Broker. Spreadsheet. News app. Calculator. When your tools are fragmented, your decisions are too.",
     "One platform. Every insight.", "light"),
    ("05", "Investing Without\na Target",
     "No retirement number. No milestones. No timeline. Just hope \u2014 and that's not a strategy.",
     "Set goals. Track progress.", "dark"),
]

for idx, (num, heading, body, fix, bg) in enumerate(mistakes):
    i = idx + 1
    is_light = bg == "light"
    bg_css = LBG if is_light else DBG
    h_color = DBG if is_light else "#fff"
    b_color = "#6B6560" if is_light else "rgba(255,255,255,0.5)"
    tag_color = BD if is_light else BL
    heading_html = heading.replace("\n", "<br>")

    # Number styling — large, left-aligned, editorial
    num_style = f"font-size:80px;font-weight:700;line-height:1;letter-spacing:-3px;color:{B};opacity:{'0.15' if is_light else '0.2'};"

    divider_color = LBR if is_light else "rgba(255,255,255,0.08)"
    fix_color = BD if is_light else BL
    accent_bar = f'<div style="position:absolute;left:0;top:0;width:6px;height:100%;background:{B};"></div>' if is_light else ""

    slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{bg_css};">
    {progress_bar(i, TOTAL, is_light)}{arrow(is_light)}
    {accent_bar}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:{'0 40px 52px 46px' if is_light else '0 36px 52px'};">
        <span class="serif" style="{num_style}">{num}</span>
        <div style="width:100%;height:1px;background:{divider_color};margin:12px 0 16px;"></div>
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{tag_color};margin-bottom:12px;">MISTAKE #{num}</span>
        <h2 class="serif" style="font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:{h_color};margin:0 0 12px;">{heading_html}</h2>
        <p class="sans" style="font-size:13px;color:{b_color};line-height:1.55;margin:0 0 14px;">{body}</p>
        <p class="sans" style="font-size:12px;font-weight:600;color:{fix_color};margin:0;">\u2713 {fix}</p>
    </div>
</div>''')

# --- SLIDE 7: CTA — Green bg, white text, bold ---
features = [
    "Portfolio Tracking & Benchmarks",
    "Global Dividend Monitoring",
    "51 Markets \u00b7 3D Globe",
    "No Bank Account Required",
    "Free Forever",
]
feat_html = ""
for label in features:
    feat_html += f'<span style="display:inline-block;font-size:11px;padding:5px 12px;background:rgba(255,255,255,0.15);border-radius:20px;color:#fff;margin:3px 4px 3px 0;">{label}</span>'

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{B};">
    {progress_bar(6, TOTAL, True)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
            <img src="{LOGO}" style="width:36px;height:36px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
            <span class="sans" style="font-size:13px;font-weight:600;letter-spacing:0.5px;color:{DBG};">WealthClaude</span>
        </div>
        <h2 class="serif" style="font-size:32px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:{DBG};margin:0 0 12px;">Fix All 5.<br>One Platform.<br>Zero Cost.</h2>
        <p class="sans" style="font-size:13px;color:rgba(0,0,0,0.5);line-height:1.5;margin:0 0 20px;">Join investors in 160+ countries.</p>
        <div style="display:flex;flex-wrap:wrap;margin-bottom:24px;">{feat_html}</div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{DBG};color:{B};font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14px;border-radius:28px;align-self:flex-start;">
            Start Free \u2192 wealthclaude.com
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
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
<title>WealthClaude Carousel — V3 Bold Editorial</title>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{{margin:0;padding:0;box-sizing:border-box;}}
  body{{background:#1a1a1a;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Work Sans',sans-serif;}}
  .serif{{font-family:'Libre Baskerville','Georgia',serif;}}
  .sans{{font-family:'Work Sans','Segoe UI',sans-serif;}}
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
    <span class="text">Are you making these mistakes? Fix all 5 with one free platform \U0001F4C8 Link in bio</span>
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

Path("carousel_v3_editorial.html").write_text(html, encoding="utf-8")
print(f"V3 Bold Editorial written ({len(html):,} bytes)")
