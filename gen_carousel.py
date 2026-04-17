import base64
from pathlib import Path

# Encode logo
logo_path = Path("public/android-icon-192x192.png")
logo_bytes = logo_path.read_bytes()
logo_b64 = base64.b64encode(logo_bytes).decode()
logo_data_uri = f"data:image/png;base64,{logo_b64}"

# Color system
B  = "#4ADE80"       # BRAND_PRIMARY
BL = "#7AEEA6"       # BRAND_LIGHT
BD = "#1E7A45"       # BRAND_DARK
LBG = "#F2F7F4"      # LIGHT_BG
LBR = "#DDE8E1"      # LIGHT_BORDER
DBG = "#0A1A14"      # DARK_BG

TOTAL = 7

slides_data = [
    {
        "type": "hero", "bg": "light",
        "tag": "INVESTING TIPS",
        "heading": "5 Mistakes<br>Self-Directed<br>Investors Make",
        "sub": "And how to fix every single one."
    },
    {
        "type": "mistake", "bg": "dark", "num": "01",
        "tag": "MISTAKE #1",
        "heading": "Not Benchmarking<br>Your Returns",
        "body": 'You think you\'re doing well \u2014 but compared to what? Without measuring against the S&P 500 or your target index, you have no idea if you\'re actually winning.',
        "fix": "Track performance vs. benchmarks automatically."
    },
    {
        "type": "mistake", "bg": "light", "num": "02",
        "tag": "MISTAKE #2",
        "heading": "Ignoring Your<br>Dividend Income",
        "body": 'Dividends compound silently. If you\'re not tracking payouts across your holdings \u2014 especially globally \u2014 you\'re missing a huge piece of your total return.',
        "fix": "Monitor dividends across 6 regions in one view."
    },
    {
        "type": "mistake", "bg": "dark", "num": "03",
        "tag": "MISTAKE #3",
        "heading": "Over-Concentrated<br>Without Knowing It",
        "body": "Think you're diversified? Many investors unknowingly hold 40%+ in a single sector. Without allocation tracking, concentration risk hides in plain sight.",
        "fix": "See your real allocation with one click."
    },
    {
        "type": "mistake", "bg": "light", "num": "04",
        "tag": "MISTAKE #4",
        "heading": "Scattered Across<br>Too Many Tools",
        "body": "Broker app for trades. Spreadsheet for tracking. Another app for news. A calculator for dividends. Fragmented tools lead to fragmented decisions.",
        "fix": "One platform for portfolio, markets & news."
    },
    {
        "type": "mistake", "bg": "dark", "num": "05",
        "tag": "MISTAKE #5",
        "heading": "No Financial Goal<br>or Timeline",
        "body": "Investing without a target is like driving without a destination. No retirement number, no milestones \u2014 just hoping it works out.",
        "fix": "Set goals and track your progress over time."
    },
    {
        "type": "cta", "bg": "gradient",
        "tag": "THE FIX",
        "heading": "Fix All 5 With<br>One Free Platform",
        "sub": "Join investors in 160+ countries who track, analyze, and invest smarter.",
        "cta": "Start Free \u2192 wealthclaude.com"
    }
]


def progress_bar(index, total, is_light):
    pct = ((index + 1) / total) * 100
    track_c = "rgba(0,0,0,0.08)" if is_light else "rgba(255,255,255,0.12)"
    fill = B if is_light else "#fff"
    label = "rgba(0,0,0,0.3)" if is_light else "rgba(255,255,255,0.4)"
    return f'''<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
        <div style="flex:1;height:3px;background:{track_c};border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:{pct:.1f}%;background:{fill};border-radius:2px;"></div>
        </div>
        <span class="sans" style="font-size:11px;color:{label};font-weight:500;">{index+1}/{total}</span>
    </div>'''


def swipe_arrow(is_light):
    bg = "rgba(0,0,0,0.06)" if is_light else "rgba(255,255,255,0.08)"
    stroke = "rgba(0,0,0,0.25)" if is_light else "rgba(255,255,255,0.35)"
    return f'''<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="{stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>'''


def logo_lockup(is_light, is_gradient=False):
    name_color = DBG if is_light else "#fff"
    if is_gradient:
        name_color = "#fff"
    return f'''<div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <img src="{logo_data_uri}" style="width:40px;height:40px;border-radius:10px;" />
        <span class="sans" style="font-size:13px;font-weight:600;letter-spacing:0.5px;color:{name_color};">WealthClaude</span>
    </div>'''


def build_slide(i, s):
    is_light = s["bg"] == "light"
    is_gradient = s["bg"] == "gradient"
    is_last = i == TOTAL - 1

    if is_light:
        bg_style = f"background:{LBG};"
        heading_color = DBG
        body_color = "#5A5550"
        tag_color = B
    elif is_gradient:
        bg_style = f"background:linear-gradient(165deg, {BD} 0%, {B} 50%, {BL} 100%);"
        heading_color = "#fff"
        body_color = "rgba(255,255,255,0.8)"
        tag_color = "rgba(255,255,255,0.6)"
    else:
        bg_style = f"background:{DBG};"
        heading_color = "#fff"
        body_color = "rgba(255,255,255,0.6)"
        tag_color = BL

    parts = []
    parts.append(f'<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;{bg_style}">')

    # Progress bar
    parts.append(progress_bar(i, TOTAL, is_light))

    # Swipe arrow (not on last slide)
    if not is_last:
        parts.append(swipe_arrow(is_light))

    # --- HERO ---
    if s["type"] == "hero":
        parts.append(f'''
        <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
            {logo_lockup(True)}
            <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{tag_color};margin-bottom:16px;">{s["tag"]}</span>
            <h1 class="serif" style="font-size:34px;font-weight:600;letter-spacing:-0.5px;line-height:1.1;color:{heading_color};margin:0 0 16px;">{s["heading"]}</h1>
            <p class="sans" style="font-size:15px;color:{body_color};line-height:1.5;margin:0;">{s["sub"]}</p>
        </div>''')

    # --- MISTAKE ---
    elif s["type"] == "mistake":
        num_color = B if is_light else BL
        fix_bg = "rgba(74,222,128,0.08)" if is_light else "rgba(74,222,128,0.1)"
        fix_border = "rgba(74,222,128,0.15)"
        fix_color = BD if is_light else BL

        parts.append(f'''
        <div style="position:absolute;top:20px;right:24px;font-size:120px;font-weight:700;color:{num_color};opacity:0.06;line-height:1;pointer-events:none;" class="serif">{s["num"]}</div>
        <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
            <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{tag_color};margin-bottom:16px;">{s["tag"]}</span>
            <h2 class="serif" style="font-size:30px;font-weight:600;letter-spacing:-0.3px;line-height:1.1;color:{heading_color};margin:0 0 14px;">{s["heading"]}</h2>
            <p class="sans" style="font-size:14px;color:{body_color};line-height:1.55;margin:0 0 16px;">{s["body"]}</p>
            <div style="padding:10px 14px;background:{fix_bg};border:1px solid {fix_border};border-radius:10px;">
                <p class="sans" style="font-size:12px;font-weight:600;color:{fix_color};margin:0;">\u2713 {s["fix"]}</p>
            </div>
        </div>''')

    # --- CTA ---
    elif s["type"] == "cta":
        features = [
            ("\U0001F4CA", "Portfolio Tracking & Benchmarks"),
            ("\U0001F4B0", "Global Dividend Monitoring"),
            ("\U0001F30D", "51 Markets on a 3D Globe"),
            ("\U0001F512", "No Bank Account Required"),
            ("\u26A1", "Free Forever Plan"),
        ]
        feat_html = ""
        for icon, label in features:
            feat_html += f'''<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
                <span style="font-size:14px;">{icon}</span>
                <span class="sans" style="font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;">{label}</span>
            </div>'''

        parts.append(f'''
        <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
            {logo_lockup(False, True)}
            <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{tag_color};margin-bottom:16px;">{s["tag"]}</span>
            <h2 class="serif" style="font-size:30px;font-weight:600;letter-spacing:-0.3px;line-height:1.1;color:{heading_color};margin:0 0 12px;">{s["heading"]}</h2>
            <p class="sans" style="font-size:13px;color:{body_color};line-height:1.5;margin:0 0 20px;">{s["sub"]}</p>
            <div style="margin-bottom:22px;">
                {feat_html}
            </div>
            <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{LBG};color:{BD};font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14px;border-radius:28px;align-self:flex-start;">
                {s["cta"]}
            </div>
        </div>''')

    parts.append('</div>')
    return '\n'.join(parts)


# Build all slides
all_slides = '\n'.join(build_slide(i, s) for i, s in enumerate(slides_data))

# Dots
dots = ''
for i in range(TOTAL):
    if i == 0:
        style = "height:6px;border-radius:3px;transition:all 0.3s;background:#fff;width:8px;"
    else:
        style = "height:6px;border-radius:3px;transition:all 0.3s;background:rgba(255,255,255,0.3);width:6px;"
    dots += f'<div class="dot" data-index="{i}" style="{style}"></div>'

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WealthClaude Carousel</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&display=swap" rel="stylesheet">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#1a1a1a; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; font-family:'Plus Jakarta Sans',sans-serif; }}
  .serif {{ font-family:'Fraunces','Georgia',serif; }}
  .sans {{ font-family:'Plus Jakarta Sans','Segoe UI',sans-serif; }}
  .ig-frame {{ width:420px; background:#000; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.5); }}
  .ig-header {{ display:flex; align-items:center; gap:10px; padding:14px 16px; }}
  .ig-header .avatar {{ width:32px; height:32px; border-radius:50%; border:2px solid {B}; overflow:hidden; }}
  .ig-header .avatar img {{ width:100%; height:100%; object-fit:cover; }}
  .ig-header .info {{ flex:1; }}
  .ig-header .handle {{ font-size:13px; font-weight:600; color:#fff; }}
  .ig-header .subtitle {{ font-size:11px; color:rgba(255,255,255,0.4); }}
  .carousel-viewport {{ width:420px; aspect-ratio:4/5; overflow:hidden; position:relative; cursor:grab; }}
  .carousel-viewport:active {{ cursor:grabbing; }}
  .carousel-track {{ display:flex; transition:transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94); }}
  .ig-dots {{ display:flex; justify-content:center; gap:4px; padding:12px 0; }}
  .ig-actions {{ display:flex; align-items:center; padding:8px 14px; gap:16px; }}
  .ig-actions svg {{ cursor:pointer; }}
  .ig-actions .right {{ margin-left:auto; }}
  .ig-caption {{ padding:6px 16px 14px; }}
  .ig-caption .handle {{ font-size:13px; font-weight:600; color:#fff; }}
  .ig-caption .text {{ font-size:13px; color:rgba(255,255,255,0.7); }}
  .ig-caption .time {{ font-size:11px; color:rgba(255,255,255,0.3); margin-top:6px; }}
</style>
</head>
<body>
<div class="ig-frame">
  <div class="ig-header">
    <div class="avatar"><img src="{logo_data_uri}" /></div>
    <div class="info">
      <div class="handle">wealth_claude</div>
      <div class="subtitle">Portfolio Tracker</div>
    </div>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="12" cy="19" r="1.5" fill="rgba(255,255,255,0.5)"/></svg>
  </div>

  <div class="carousel-viewport" id="viewport">
    <div class="carousel-track" id="track">
      {all_slides}
    </div>
  </div>

  <div class="ig-dots" id="dots">{dots}</div>

  <div class="ig-actions">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg class="right" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>

  <div class="ig-caption">
    <span class="handle">wealth_claude </span>
    <span class="text">Stop making these 5 investing mistakes. Track smarter with WealthClaude \u2014 free forever. Link in bio \U0001F517</span>
    <div class="time">2 HOURS AGO</div>
  </div>
</div>

<script>
const track = document.getElementById('track');
const viewport = document.getElementById('viewport');
const dots = document.querySelectorAll('.dot');
const SLIDE_W = 420;
const TOTAL_S = {TOTAL};
let current = 0, startX = 0, deltaX = 0, dragging = false;

function goTo(idx) {{
  current = Math.max(0, Math.min(idx, TOTAL_S - 1));
  track.style.transform = 'translateX(' + (-current * SLIDE_W) + 'px)';
  dots.forEach((d, i) => {{
    d.style.background = i === current ? '#fff' : 'rgba(255,255,255,0.3)';
    d.style.width = i === current ? '8px' : '6px';
  }});
}}

viewport.addEventListener('pointerdown', e => {{
  dragging = true; startX = e.clientX;
  track.style.transition = 'none';
  viewport.setPointerCapture(e.pointerId);
}});
viewport.addEventListener('pointermove', e => {{
  if (!dragging) return;
  deltaX = e.clientX - startX;
  track.style.transform = 'translateX(' + (-current * SLIDE_W + deltaX) + 'px)';
}});
viewport.addEventListener('pointerup', () => {{
  if (!dragging) return;
  dragging = false;
  track.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)';
  if (deltaX < -50) goTo(current + 1);
  else if (deltaX > 50) goTo(current - 1);
  else goTo(current);
  deltaX = 0;
}});
document.addEventListener('keydown', e => {{
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft') goTo(current - 1);
}});
</script>
</body>
</html>'''

output = Path("carousel_mistakes.html")
output.write_text(html, encoding="utf-8")
print(f"Carousel written to {output} ({len(html):,} bytes)")
