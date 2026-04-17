"""
V6 — Data Viz: Infographic-style with inline SVG charts, stat callouts,
donut rings, bar charts, and percentage meters built into each slide.
Dark-first, Outfit font, data-forward visual language.
"""
import base64, math
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#F5F5F0"
DBG = "#0A0A0A"
RED = "#FF6B6B"
AMBER = "#FBBF24"
TOTAL = 7

def pb(i, light):
    pct = ((i+1)/TOTAL)*100
    tc = "rgba(0,0,0,0.06)" if light else "rgba(255,255,255,0.08)"
    fc = B if light else B
    lc = "rgba(0,0,0,0.25)" if light else "rgba(255,255,255,0.25)"
    return f'<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;"><div style="flex:1;height:3px;background:{tc};border-radius:2px;overflow:hidden;"><div style="height:100%;width:{pct:.1f}%;background:{fc};border-radius:2px;"></div></div><span style="font-size:11px;color:{lc};font-weight:500;">{i+1}/{TOTAL}</span></div>'

def ar(light):
    bg = "rgba(0,0,0,0.04)" if light else "rgba(255,255,255,0.04)"
    st = "rgba(0,0,0,0.18)" if light else "rgba(255,255,255,0.18)"
    return f'<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="{st}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'

def donut_svg(pct, color, size=80, stroke=8, label=""):
    r = (size - stroke) / 2
    c = 2 * math.pi * r
    offset = c - (pct / 100) * c
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" style="transform:rotate(-90deg);">
        <circle cx="{size/2}" cy="{size/2}" r="{r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="{stroke}"/>
        <circle cx="{size/2}" cy="{size/2}" r="{r}" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-dasharray="{c}" stroke-dashoffset="{offset}" stroke-linecap="round"/>
    </svg>'''

def bar_h(pct, color, width=180, height=6):
    return f'<div style="width:{width}px;height:{height}px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="width:{pct}%;height:100%;background:{color};border-radius:3px;"></div></div>'

def bar_h_light(pct, color, width=180, height=6):
    return f'<div style="width:{width}px;height:{height}px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;"><div style="width:{pct}%;height:100%;background:{color};border-radius:3px;"></div></div>'

slides = []

# =============================================
# S1: HERO — Big stat hook on dark
# =============================================
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(0,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.35);">WEALTHCLAUDE</span>
        </div>
        <span style="font-size:10px;font-weight:700;letter-spacing:3px;color:{B};margin-bottom:16px;">DATA INSIGHTS</span>
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:8px;">
            <span style="font-size:72px;font-weight:800;letter-spacing:-3px;line-height:1;color:#fff;">73%</span>
            <span style="font-size:14px;color:{RED};font-weight:600;">\u2193</span>
        </div>
        <p style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.7);line-height:1.3;margin:0 0 12px;">of self-directed investors<br>underperform their benchmark</p>
        <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0;">Here are the 5 reasons why \u2192</p>
    </div>
</div>''')

# =============================================
# S2: Mistake 1 — Donut chart comparison (light)
# =============================================
donut1 = donut_svg(73, RED, 70, 7)
donut2 = donut_svg(27, B, 70, 7)

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(1,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BD};margin-bottom:16px;">MISTAKE 01</span>
        <h2 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:{DBG};margin:0 0 16px;">No Benchmark =<br>No Clue</h2>
        <p style="font-size:13px;color:rgba(0,0,0,0.45);line-height:1.5;margin:0 0 20px;">Without comparing to an index, most investors overestimate their performance.</p>
        <div style="display:flex;gap:24px;align-items:center;padding:16px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,0.06);">
            <div style="text-align:center;">
                <div style="position:relative;width:70px;height:70px;">
                    {donut1}
                    <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:700;color:{RED};">73%</span>
                </div>
                <span style="font-size:10px;color:rgba(0,0,0,0.4);margin-top:6px;display:block;">Underperform</span>
            </div>
            <div style="width:1px;height:50px;background:rgba(0,0,0,0.06);"></div>
            <div style="text-align:center;">
                <div style="position:relative;width:70px;height:70px;">
                    {donut2}
                    <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:700;color:{BD};">27%</span>
                </div>
                <span style="font-size:10px;color:rgba(0,0,0,0.4);margin-top:6px;display:block;">Beat Index</span>
            </div>
            <div style="flex:1;">
                <span style="font-size:11px;font-weight:600;color:{BD};">\u2713 Fix</span><br>
                <span style="font-size:11px;color:rgba(0,0,0,0.4);">Auto-benchmark<br>your returns</span>
            </div>
        </div>
    </div>
</div>''')

# =============================================
# S3: Mistake 2 — Bar chart showing missed dividends (dark)
# =============================================
regions = [("US", 85, B), ("UK", 62, BL), ("Europe", 48, BL), ("Canada", 35, BL), ("Singapore", 28, "rgba(255,255,255,0.15)"), ("Australia", 22, "rgba(255,255,255,0.15)")]
bars_html = ""
for region, pct, color in regions:
    bars_html += f'''<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.4);width:55px;text-align:right;">{region}</span>
        {bar_h(pct, color, 200, 8)}
        <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.5);">{pct}%</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(2,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BL};margin-bottom:16px;">MISTAKE 02</span>
        <h2 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 10px;">Dividend Income<br>You're Missing</h2>
        <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0 0 18px;">% of investors not tracking dividends by region</p>
        <div style="padding:16px 14px;background:rgba(255,255,255,0.03);border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
            {bars_html}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:14px;">
            <div style="width:16px;height:2px;background:{B};border-radius:1px;"></div>
            <span style="font-size:11px;font-weight:600;color:{BL};">Track all 6 regions in one view</span>
        </div>
    </div>
</div>''')

# =============================================
# S4: Mistake 3 — Pie/donut allocation viz (light)
# =============================================
donut_big = donut_svg(42, RED, 100, 10)

alloc_items = [
    ("Tech", "42%", RED, "Overweight"),
    ("Finance", "18%", B, "OK"),
    ("Healthcare", "15%", B, "OK"),
    ("Energy", "12%", AMBER, "Watch"),
    ("Other", "13%", "rgba(0,0,0,0.15)", "OK"),
]
alloc_html = ""
for name, pct, color, status in alloc_items:
    status_color = RED if status == "Overweight" else (AMBER if status == "Watch" else "rgba(0,0,0,0.3)")
    alloc_html += f'''<div style="display:flex;align-items:center;gap:8px;padding:5px 0;">
        <div style="width:8px;height:8px;border-radius:2px;background:{color};"></div>
        <span style="font-size:12px;font-weight:500;color:{DBG};flex:1;">{name}</span>
        <span style="font-size:12px;font-weight:600;color:{DBG};">{pct}</span>
        <span style="font-size:9px;font-weight:600;padding:2px 6px;border-radius:8px;background:{'rgba(255,107,107,0.1)' if status=='Overweight' else ('rgba(251,191,36,0.1)' if status=='Watch' else 'rgba(0,0,0,0.04)')};color:{status_color};">{status}</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(3,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BD};margin-bottom:16px;">MISTAKE 03</span>
        <h2 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:{DBG};margin:0 0 10px;">You're More<br>Concentrated<br>Than You Think</h2>
        <p style="font-size:12px;color:rgba(0,0,0,0.4);margin:0 0 16px;">Example: typical "diversified" portfolio</p>
        <div style="display:flex;gap:16px;align-items:center;padding:14px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,0.06);">
            <div style="position:relative;width:100px;height:100px;flex-shrink:0;">
                {donut_big}
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
                    <span style="font-size:18px;font-weight:800;color:{RED};display:block;line-height:1;">42%</span>
                    <span style="font-size:8px;color:rgba(0,0,0,0.3);letter-spacing:0.5px;">TECH</span>
                </div>
            </div>
            <div style="flex:1;">{alloc_html}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
            <div style="width:16px;height:2px;background:{B};border-radius:1px;"></div>
            <span style="font-size:11px;font-weight:600;color:{BD};">See true allocation instantly</span>
        </div>
    </div>
</div>''')

# =============================================
# S5: Mistake 4 — Icon grid showing tool sprawl (dark)
# =============================================
tools = [
    ("\U0001F4C8", "Broker App", "Trades only"),
    ("\U0001F4CA", "Spreadsheet", "Manual entry"),
    ("\U0001F4F0", "News App", "No portfolio link"),
    ("\U0001F522", "Calculator", "No history"),
]
tools_html = ""
for icon, name, desc in tools:
    tools_html += f'''<div style="flex:1;min-width:140px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;text-align:center;">
        <span style="font-size:22px;display:block;margin-bottom:6px;">{icon}</span>
        <span style="font-size:11px;font-weight:600;color:#fff;display:block;text-decoration:line-through;opacity:0.5;">{name}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.3);display:block;margin-top:2px;">{desc}</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(4,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BL};margin-bottom:16px;">MISTAKE 04</span>
        <h2 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 8px;">4 Tools. 0 Clarity.</h2>
        <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0 0 18px;">The average DIY investor juggles these daily:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
            {tools_html}
        </div>
        <div style="padding:12px 16px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.15);border-radius:10px;text-align:center;">
            <span style="font-size:18px;display:block;margin-bottom:4px;">\u2192</span>
            <span style="font-size:12px;font-weight:700;color:{B};">Replace all 4 with WealthClaude</span>
        </div>
    </div>
</div>''')

# =============================================
# S6: Mistake 5 — Goal progress meter (light)
# =============================================
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(5,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 36px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BD};margin-bottom:16px;">MISTAKE 05</span>
        <h2 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:{DBG};margin:0 0 10px;">No Goal.<br>No Progress Bar.</h2>
        <p style="font-size:12px;color:rgba(0,0,0,0.4);line-height:1.5;margin:0 0 18px;">Only 12% of investors set a concrete retirement target. The rest? Just hoping.</p>
        <div style="padding:18px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
                <span style="font-size:11px;font-weight:600;color:{DBG};">Retirement Goal</span>
                <span style="font-size:11px;color:rgba(0,0,0,0.35);">$1,000,000</span>
            </div>
            {bar_h_light(34, B, 310, 10)}
            <div style="display:flex;justify-content:space-between;margin-top:6px;">
                <span style="font-size:18px;font-weight:800;color:{BD};">$340,000</span>
                <span style="font-size:10px;color:rgba(0,0,0,0.3);align-self:flex-end;">34% there</span>
            </div>
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.06);">
                <div style="display:flex;justify-content:space-between;">
                    <div><span style="font-size:9px;color:rgba(0,0,0,0.3);display:block;">Monthly</span><span style="font-size:13px;font-weight:700;color:{DBG};">+$2,400</span></div>
                    <div><span style="font-size:9px;color:rgba(0,0,0,0.3);display:block;">Timeline</span><span style="font-size:13px;font-weight:700;color:{DBG};">2041</span></div>
                    <div><span style="font-size:9px;color:rgba(0,0,0,0.3);display:block;">On Track</span><span style="font-size:13px;font-weight:700;color:{B};">Yes \u2713</span></div>
                </div>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
            <div style="width:16px;height:2px;background:{B};border-radius:1px;"></div>
            <span style="font-size:11px;font-weight:600;color:{BD};">Set goals. See progress. Stay on track.</span>
        </div>
    </div>
</div>''')

# =============================================
# S7: CTA — Stats summary + CTA (dark)
# =============================================
stats = [
    ("160+", "Countries"),
    ("51", "Markets"),
    ("50+", "Brokers"),
    ("$0", "Forever"),
]
stats_html = ""
for val, label in stats:
    stats_html += f'''<div style="flex:1;text-align:center;padding:12px 0;">
        <span style="font-size:24px;font-weight:800;color:#fff;display:block;line-height:1;">{val}</span>
        <span style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;margin-top:4px;display:block;">{label}</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(6,False)}
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.08) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.35);">WEALTHCLAUDE</span>
        </div>
        <h2 style="font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 10px;">Stop Guessing.<br>Start Tracking.</h2>
        <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0 0 20px;">One free platform to fix all 5 mistakes.</p>
        <div style="display:flex;gap:0;margin-bottom:22px;padding:4px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
            {stats_html}
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{B};color:{DBG};font-weight:700;font-size:14px;border-radius:28px;align-self:flex-start;">
            Start Free \u2192
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
dots = "".join(f'<div class="dot" style="height:6px;border-radius:3px;transition:all 0.3s;{"background:#fff;width:8px;" if i==0 else "background:rgba(255,255,255,0.3);width:6px;"}"></div>' for i in range(TOTAL))

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — V6 Data Viz</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Outfit',sans-serif;}}
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
    <span class="text">73% of investors underperform. Here's why \u2014 and the data to fix it \U0001F4CA Free forever. Link in bio.</span>
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

Path("carousel_v6_dataviz.html").write_text(html, encoding="utf-8")
print(f"V6 Data Viz written ({len(html):,} bytes)")
