"""
V10 — This vs That Comparison: WealthClaude vs The Old Way.
Split-screen slides, Sora/Geist-style with clear winner indicators.
"""
import base64
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#F5F5F0"
DBG = "#0A0A08"
RED = "#EF4444"
MUTED = "#8A8580"
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

slides = []

# S1: Hero — VS title slide
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(0,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <span style="font-size:10px;font-weight:700;letter-spacing:3px;color:{B};margin-bottom:18px;">COMPARISON</span>
        <h1 style="font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1.05;color:#fff;margin:0 0 20px;">The Old Way<br><span style="color:rgba(255,255,255,0.2);">vs</span><br>WealthClaude</h1>
        <div style="display:flex;gap:12px;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(239,68,68,0.08);border-radius:8px;">
                <span style="font-size:14px;">\U0001F4C9</span>
                <span style="font-size:11px;font-weight:600;color:{RED};">The Old Way</span>
            </div>
            <span style="font-size:14px;color:rgba(255,255,255,0.15);">vs</span>
            <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(74,222,128,0.08);border-radius:8px;">
                <img src="{LOGO}" style="width:16px;height:16px;border-radius:4px;" />
                <span style="font-size:11px;font-weight:600;color:{B};">WealthClaude</span>
            </div>
        </div>
    </div>
</div>''')

# Comparison slides — split layout
comparisons = [
    {
        "bg": "light",
        "category": "PERFORMANCE TRACKING",
        "left_title": "The Old Way",
        "left_items": [
            ("\u2718", "Check broker app", "Trades only, no benchmarks"),
            ("\u2718", "Open spreadsheet", "Manually update prices"),
            ("\u2718", "Google the index", "Compare by memory"),
            ("\u2718", "Guess if you're winning", "No actual data"),
        ],
        "left_time": "25 min/day",
        "right_title": "WealthClaude",
        "right_items": [
            ("\u2713", "Open dashboard", "All brokers, one view"),
            ("\u2713", "Auto-benchmarked", "vs S&P, FTSE, any index"),
            ("\u2713", "Real-time P&L", "Exact gain/loss per holding"),
            ("\u2713", "Know instantly", "Data, not guessing"),
        ],
        "right_time": "30 seconds",
    },
    {
        "bg": "dark",
        "category": "DIVIDEND INCOME",
        "left_title": "The Old Way",
        "left_items": [
            ("\u2718", "Check each broker", "One at a time"),
            ("\u2718", "Manual spreadsheet", "Miss payments constantly"),
            ("\u2718", "No global view", "Ignore international divs"),
        ],
        "left_time": "Partial data",
        "right_title": "WealthClaude",
        "right_items": [
            ("\u2713", "All dividends", "Auto-tracked across brokers"),
            ("\u2713", "6 regions covered", "US, UK, EU, CA, SG, AU"),
            ("\u2713", "Annual projection", "See your dividend income grow"),
        ],
        "right_time": "$5,135/yr found",
    },
    {
        "bg": "light",
        "category": "PORTFOLIO ALLOCATION",
        "left_title": "The Old Way",
        "left_items": [
            ("\u2718", "No allocation view", "Just a list of stocks"),
            ("\u2718", "Hidden concentration", "40%+ in one sector"),
            ("\u2718", "React to crashes", "Too late to diversify"),
        ],
        "left_time": "Flying blind",
        "right_title": "WealthClaude",
        "right_items": [
            ("\u2713", "Visual allocation", "Sector, region, asset type"),
            ("\u2713", "Alerts if unbalanced", "Catch concentration early"),
            ("\u2713", "Rebalance confidently", "Data-driven decisions"),
        ],
        "right_time": "Full clarity",
    },
    {
        "bg": "dark",
        "category": "DAILY WORKFLOW",
        "left_title": "The Old Way",
        "left_items": [
            ("\u2718", "4 different apps", "Broker + sheet + news + calc"),
            ("\u2718", "Context switching", "Nothing talks to each other"),
            ("\u2718", "45 min wasted", "Every single day"),
        ],
        "left_time": "4 tools / 45 min",
        "right_title": "WealthClaude",
        "right_items": [
            ("\u2713", "One platform", "Portfolio + markets + news"),
            ("\u2713", "AI-powered briefs", "Summarized market insights"),
            ("\u2713", "2 minutes", "Check and done"),
        ],
        "right_time": "1 tool / 2 min",
    },
    {
        "bg": "light",
        "category": "FINANCIAL GOALS",
        "left_title": "The Old Way",
        "left_items": [
            ("\u2718", "No target set", "Just 'invest more'"),
            ("\u2718", "No progress tracking", "Hope for the best"),
            ("\u2718", "No timeline", "When is 'enough'?"),
        ],
        "left_time": "No plan",
        "right_title": "WealthClaude",
        "right_items": [
            ("\u2713", "Set concrete goals", "Retirement, house, etc."),
            ("\u2713", "Progress tracking", "See % completion live"),
            ("\u2713", "On-track alerts", "Stay on schedule"),
        ],
        "right_time": "Clear roadmap",
    },
]

for idx, c in enumerate(comparisons):
    i = idx + 1
    light = c["bg"] == "light"
    bgc = LBG if light else DBG

    # Colors
    cat_color = BD if light else BL
    left_bg = "#fff" if light else "rgba(255,255,255,0.02)"
    left_br = "rgba(239,68,68,0.12)" if light else "rgba(239,68,68,0.1)"
    right_bg = "#fff" if light else "rgba(255,255,255,0.02)"
    right_br = "rgba(74,222,128,0.15)" if light else "rgba(74,222,128,0.12)"
    x_color = RED
    check_color = B if not light else BD
    item_color = DBG if light else "#fff"
    desc_color = MUTED if light else "rgba(255,255,255,0.3)"
    time_left_color = RED
    time_right_color = BD if light else B

    left_items_html = ""
    for icon, title, desc in c["left_items"]:
        left_items_html += f'''<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;">
            <span style="color:{x_color};font-size:11px;font-weight:700;margin-top:1px;">{icon}</span>
            <div><span style="font-size:11px;font-weight:600;color:{item_color};display:block;">{title}</span><span style="font-size:9px;color:{desc_color};">{desc}</span></div>
        </div>'''

    right_items_html = ""
    for icon, title, desc in c["right_items"]:
        right_items_html += f'''<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;">
            <span style="color:{check_color};font-size:11px;font-weight:700;margin-top:1px;">{icon}</span>
            <div><span style="font-size:11px;font-weight:600;color:{item_color};display:block;">{title}</span><span style="font-size:9px;color:{desc_color};">{desc}</span></div>
        </div>'''

    divider_color = "rgba(0,0,0,0.06)" if light else "rgba(255,255,255,0.06)"

    slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{bgc};">
    {pb(i, light)}{ar(light) if i < TOTAL - 1 else ""}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 28px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{cat_color};margin-bottom:12px;">{c["category"]}</span>

        <div style="display:flex;gap:10px;">
            <!-- Left: Old Way -->
            <div style="flex:1;padding:12px;background:{left_bg};border-radius:10px;border:1px solid {left_br};">
                <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">
                    <span style="font-size:10px;">\U0001F4C9</span>
                    <span style="font-size:10px;font-weight:700;color:{RED};">{c["left_title"]}</span>
                </div>
                {left_items_html}
                <div style="margin-top:8px;padding-top:6px;border-top:1px solid {divider_color};">
                    <span style="font-size:10px;font-weight:700;color:{time_left_color};">{c["left_time"]}</span>
                </div>
            </div>

            <!-- Divider -->
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">
                <div style="width:1px;flex:1;background:{divider_color};"></div>
                <span style="font-size:9px;font-weight:700;color:{"rgba(0,0,0,0.15)" if light else "rgba(255,255,255,0.12)"};padding:4px 0;">VS</span>
                <div style="width:1px;flex:1;background:{divider_color};"></div>
            </div>

            <!-- Right: WealthClaude -->
            <div style="flex:1;padding:12px;background:{right_bg};border-radius:10px;border:1px solid {right_br};">
                <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">
                    <img src="{LOGO}" style="width:12px;height:12px;border-radius:3px;" />
                    <span style="font-size:10px;font-weight:700;color:{BD if light else B};">{c["right_title"]}</span>
                </div>
                {right_items_html}
                <div style="margin-top:8px;padding-top:6px;border-top:1px solid {divider_color};">
                    <span style="font-size:10px;font-weight:700;color:{time_right_color};">{c["right_time"]}</span>
                </div>
            </div>
        </div>
    </div>
</div>''')

# S7: CTA — Verdict slide
scores = [
    ("Performance", "\u2718", "\u2713"),
    ("Dividends", "\u2718", "\u2713"),
    ("Allocation", "\u2718", "\u2713"),
    ("Workflow", "\u2718", "\u2713"),
    ("Goals", "\u2718", "\u2713"),
]
score_rows = ""
for label, old, wc in scores:
    score_rows += f'''<div style="display:flex;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <span style="font-size:11px;color:rgba(255,255,255,0.5);flex:1;">{label}</span>
        <span style="font-size:13px;color:{RED};width:50px;text-align:center;font-weight:700;">{old}</span>
        <span style="font-size:13px;color:{B};width:50px;text-align:center;font-weight:700;">{wc}</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(6,False)}
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 32px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <h2 style="font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 6px;">The Verdict</h2>
        <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0 0 16px;">5 categories. 1 clear winner.</p>

        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:18px;">
            <div style="display:flex;align-items:center;padding:0 0 8px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px;">
                <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.3);flex:1;"></span>
                <span style="font-size:9px;font-weight:700;color:{RED};width:50px;text-align:center;letter-spacing:1px;">OLD</span>
                <span style="font-size:9px;font-weight:700;color:{B};width:50px;text-align:center;letter-spacing:1px;">WC</span>
            </div>
            {score_rows}
            <div style="display:flex;align-items:center;padding:8px 0 0;margin-top:4px;">
                <span style="font-size:11px;font-weight:700;color:#fff;flex:1;">Score</span>
                <span style="font-size:14px;font-weight:800;color:{RED};width:50px;text-align:center;">0/5</span>
                <span style="font-size:14px;font-weight:800;color:{B};width:50px;text-align:center;">5/5</span>
            </div>
        </div>

        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{B};color:{DBG};font-weight:700;font-size:14px;border-radius:28px;align-self:flex-start;">
            Switch Free \u2192
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
dots = "".join(f'<div class="dot" style="height:6px;border-radius:3px;transition:all 0.3s;{"background:#fff;width:8px;" if i==0 else "background:rgba(255,255,255,0.3);width:6px;"}"></div>' for i in range(TOTAL))

html = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — V10 This vs That</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;}}
.ig-frame{{width:420px;background:#000;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);}}
.ig-header{{display:flex;align-items:center;gap:10px;padding:14px 16px;}}
.ig-header .avatar{{width:32px;height:32px;border-radius:50%;border:2px solid {B};overflow:hidden;}}
.ig-header .avatar img{{width:100%;height:100%;object-fit:cover;}}
.ig-header .info{{flex:1;}}.ig-header .handle{{font-size:13px;font-weight:600;color:#fff;}}
.ig-header .subtitle{{font-size:11px;color:rgba(255,255,255,0.4);}}
.carousel-viewport{{width:420px;aspect-ratio:4/5;overflow:hidden;position:relative;cursor:grab;}}
.carousel-viewport:active{{cursor:grabbing;}}
.carousel-track{{display:flex;transition:transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);}}
.ig-dots{{display:flex;justify-content:center;gap:4px;padding:12px 0;}}
.ig-actions{{display:flex;align-items:center;padding:8px 14px;gap:16px;}}.ig-actions .right{{margin-left:auto;}}
.ig-caption{{padding:6px 16px 14px;}}.ig-caption .handle{{font-size:13px;font-weight:600;color:#fff;}}
.ig-caption .text{{font-size:13px;color:rgba(255,255,255,0.7);}}.ig-caption .time{{font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px;}}
</style></head><body>
<div class="ig-frame">
  <div class="ig-header"><div class="avatar"><img src="{LOGO}" /></div><div class="info"><div class="handle">wealth_claude</div><div class="subtitle">Portfolio Tracker</div></div>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="12" cy="19" r="1.5" fill="rgba(255,255,255,0.5)"/></svg></div>
  <div class="carousel-viewport" id="viewport"><div class="carousel-track" id="track">{all_slides}</div></div>
  <div class="ig-dots" id="dots">{dots}</div>
  <div class="ig-actions">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="1.5"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg class="right" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div class="ig-caption"><span class="handle">wealth_claude </span><span class="text">The old way vs WealthClaude. 5 rounds. 1 winner \U0001F3C6 Free forever. Link in bio.</span><div class="time">2 HOURS AGO</div></div>
</div>
<script>
const track=document.getElementById('track'),viewport=document.getElementById('viewport'),dots=document.querySelectorAll('.dot'),SW=420,T={TOTAL};
let cur=0,sx=0,dx=0,drag=false;
function goTo(n){{cur=Math.max(0,Math.min(n,T-1));track.style.transform='translateX('+(-cur*SW)+'px)';dots.forEach((d,i)=>{{d.style.background=i===cur?'#fff':'rgba(255,255,255,0.3)';d.style.width=i===cur?'8px':'6px';}});}}
viewport.addEventListener('pointerdown',e=>{{drag=true;sx=e.clientX;track.style.transition='none';viewport.setPointerCapture(e.pointerId);}});
viewport.addEventListener('pointermove',e=>{{if(!drag)return;dx=e.clientX-sx;track.style.transform='translateX('+(-cur*SW+dx)+'px)';}});
viewport.addEventListener('pointerup',()=>{{if(!drag)return;drag=false;track.style.transition='transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)';if(dx<-50)goTo(cur+1);else if(dx>50)goTo(cur-1);else goTo(cur);dx=0;}});
document.addEventListener('keydown',e=>{{if(e.key==='ArrowRight')goTo(cur+1);if(e.key==='ArrowLeft')goTo(cur-1);}});
</script></body></html>'''

Path("carousel_v10_comparison.html").write_text(html, encoding="utf-8")
print(f"V10 This vs That written ({len(html):,} bytes)")
