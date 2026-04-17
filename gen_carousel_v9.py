"""
V9 — Storytelling Journey: A first-person story of an investor's journey
from chaos to clarity. Timeline-style with milestones, Lora + Nunito Sans.
"""
import base64
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#FAF9F7"
DBG = "#0E0D0B"
MUTED = "#8A8580"
RED = "#EF4444"
TOTAL = 7

def pb(i, light):
    pct = ((i+1)/TOTAL)*100
    tc = "rgba(0,0,0,0.06)" if light else "rgba(255,255,255,0.08)"
    fc = B if light else B
    lc = "rgba(0,0,0,0.25)" if light else "rgba(255,255,255,0.25)"
    return f'<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;"><div style="flex:1;height:3px;background:{tc};border-radius:2px;overflow:hidden;"><div style="height:100%;width:{pct:.1f}%;background:{fc};border-radius:2px;"></div></div><span class="body" style="font-size:11px;color:{lc};font-weight:500;">{i+1}/{TOTAL}</span></div>'

def ar(light):
    bg = "rgba(0,0,0,0.04)" if light else "rgba(255,255,255,0.04)"
    st = "rgba(0,0,0,0.18)" if light else "rgba(255,255,255,0.18)"
    return f'<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="{st}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'

def timeline_dot(active=False):
    if active:
        return f'<div style="width:12px;height:12px;border-radius:50%;background:{B};box-shadow:0 0 8px rgba(74,222,128,0.4);flex-shrink:0;"></div>'
    return '<div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.12);flex-shrink:0;"></div>'

def timeline_dot_light(active=False):
    if active:
        return f'<div style="width:12px;height:12px;border-radius:50%;background:{B};box-shadow:0 0 8px rgba(74,222,128,0.3);flex-shrink:0;"></div>'
    return '<div style="width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,0.08);flex-shrink:0;"></div>'

slides = []

# S1: Hero — "My story" hook
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(0,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:36px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span class="body" style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <span class="body" style="font-size:10px;font-weight:600;letter-spacing:3px;color:{B};margin-bottom:18px;">A JOURNEY</span>
        <h1 class="heading" style="font-size:34px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;font-style:italic;">How I Went From<br>5 Spreadsheets to<br>One Dashboard</h1>
        <p class="body" style="font-size:13px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0;">A self-directed investor's journey to actually understanding their portfolio.</p>
        <div style="display:flex;align-items:center;gap:6px;margin-top:20px;">
            {timeline_dot(True)}
            <div style="width:24px;height:1px;background:rgba(255,255,255,0.1);"></div>
            {timeline_dot()}
            <div style="width:24px;height:1px;background:rgba(255,255,255,0.1);"></div>
            {timeline_dot()}
            <div style="width:24px;height:1px;background:rgba(255,255,255,0.1);"></div>
            {timeline_dot()}
            <div style="width:24px;height:1px;background:rgba(255,255,255,0.1);"></div>
            {timeline_dot()}
        </div>
    </div>
</div>''')

# S2: Chapter 1 — The Chaos (light)
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(1,True)}{ar(True)}
    <div style="position:absolute;left:40px;top:0;width:1px;height:100%;background:rgba(0,0,0,0.06);"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-left:-24px;">
            {timeline_dot_light(True)}
            <span class="body" style="font-size:10px;font-weight:700;letter-spacing:2px;color:{BD};">CHAPTER 01</span>
        </div>
        <span class="body" style="font-size:10px;color:{MUTED};margin-bottom:16px;">January 2024</span>
        <h2 class="heading" style="font-size:28px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:{DBG};margin:0 0 14px;font-style:italic;">The Chaos Phase</h2>
        <p class="body" style="font-size:13px;color:rgba(0,0,0,0.5);line-height:1.55;margin:0 0 18px;">I had stocks in 3 brokers, a Google Sheet that was always outdated, and no idea if I was actually making money.</p>
        <div style="padding:14px;background:#fff;border-radius:10px;border:1px solid rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span class="body" style="font-size:11px;font-weight:600;color:{DBG};">My setup:</span>
                <span class="body" style="font-size:11px;color:{RED};font-weight:600;">Messy</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <span style="font-size:10px;padding:4px 8px;background:rgba(239,68,68,0.06);border-radius:6px;color:{RED};">Interactive Brokers</span>
                <span style="font-size:10px;padding:4px 8px;background:rgba(239,68,68,0.06);border-radius:6px;color:{RED};">Schwab</span>
                <span style="font-size:10px;padding:4px 8px;background:rgba(239,68,68,0.06);border-radius:6px;color:{RED};">Google Sheets</span>
                <span style="font-size:10px;padding:4px 8px;background:rgba(239,68,68,0.06);border-radius:6px;color:{RED};">Yahoo Finance</span>
                <span style="font-size:10px;padding:4px 8px;background:rgba(239,68,68,0.06);border-radius:6px;color:{RED};">Calculator app</span>
            </div>
        </div>
    </div>
</div>''')

# S3: Chapter 2 — The Wake-Up (dark)
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(2,False)}{ar(False)}
    <div style="position:absolute;left:40px;top:0;width:1px;height:100%;background:rgba(255,255,255,0.06);"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-left:-24px;">
            {timeline_dot(True)}
            <span class="body" style="font-size:10px;font-weight:700;letter-spacing:2px;color:{BL};">CHAPTER 02</span>
        </div>
        <span class="body" style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:16px;">March 2024</span>
        <h2 class="heading" style="font-size:28px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:#fff;margin:0 0 14px;font-style:italic;">The Wake-Up Call</h2>
        <p class="body" style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.55;margin:0 0 18px;">I finally calculated my actual return. I thought I was up 15%. The S&P did 22%. I was <span style="color:{RED};font-weight:600;">underperforming by 7%</span> and had no idea.</p>
        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:8px;">
                <div><span class="body" style="font-size:24px;font-weight:800;color:{RED};">+15%</span><br><span class="body" style="font-size:10px;color:rgba(255,255,255,0.3);">My return</span></div>
                <span class="body" style="font-size:14px;color:rgba(255,255,255,0.2);">vs</span>
                <div><span class="body" style="font-size:24px;font-weight:800;color:{B};">+22%</span><br><span class="body" style="font-size:10px;color:rgba(255,255,255,0.3);">S&P 500</span></div>
            </div>
            <p class="body" style="font-size:11px;color:rgba(255,255,255,0.3);margin:0;">That's thousands of dollars left on the table.</p>
        </div>
    </div>
</div>''')

# S4: Chapter 3 — The Search (light)
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(3,True)}{ar(True)}
    <div style="position:absolute;left:40px;top:0;width:1px;height:100%;background:rgba(0,0,0,0.06);"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-left:-24px;">
            {timeline_dot_light(True)}
            <span class="body" style="font-size:10px;font-weight:700;letter-spacing:2px;color:{BD};">CHAPTER 03</span>
        </div>
        <span class="body" style="font-size:10px;color:{MUTED};margin-bottom:16px;">April 2024</span>
        <h2 class="heading" style="font-size:28px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:{DBG};margin:0 0 14px;font-style:italic;">The Search</h2>
        <p class="body" style="font-size:13px;color:rgba(0,0,0,0.5);line-height:1.55;margin:0 0 18px;">I needed one tool that could do everything. Benchmarking. Dividends. Allocation. Goals. Without linking my bank account.</p>
        <div style="padding:14px;background:#fff;border-radius:10px;border:1px solid rgba(0,0,0,0.06);">
            <span class="body" style="font-size:11px;font-weight:600;color:{DBG};display:block;margin-bottom:10px;">My checklist:</span>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="color:{B};">\u2713</span><span class="body" style="font-size:12px;color:{DBG};">Multi-broker portfolio view</span></div>
                <div style="display:flex;align-items:center;gap:8px;"><span style="color:{B};">\u2713</span><span class="body" style="font-size:12px;color:{DBG};">Benchmark comparison</span></div>
                <div style="display:flex;align-items:center;gap:8px;"><span style="color:{B};">\u2713</span><span class="body" style="font-size:12px;color:{DBG};">Global dividend tracking</span></div>
                <div style="display:flex;align-items:center;gap:8px;"><span style="color:{B};">\u2713</span><span class="body" style="font-size:12px;color:{DBG};">Goal setting & progress</span></div>
                <div style="display:flex;align-items:center;gap:8px;"><span style="color:{B};">\u2713</span><span class="body" style="font-size:12px;color:{DBG};">Privacy-first (no bank link)</span></div>
                <div style="display:flex;align-items:center;gap:8px;"><span style="color:{B};">\u2713</span><span class="body" style="font-size:12px;color:{DBG};">Free</span></div>
            </div>
        </div>
    </div>
</div>''')

# S5: Chapter 4 — The Switch (dark)
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(4,False)}{ar(False)}
    <div style="position:absolute;left:40px;top:0;width:1px;height:100%;background:rgba(255,255,255,0.06);"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-left:-24px;">
            {timeline_dot(True)}
            <span class="body" style="font-size:10px;font-weight:700;letter-spacing:2px;color:{BL};">CHAPTER 04</span>
        </div>
        <span class="body" style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:16px;">May 2024</span>
        <h2 class="heading" style="font-size:28px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:#fff;margin:0 0 14px;font-style:italic;">Found WealthClaude</h2>
        <p class="body" style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.55;margin:0 0 18px;">Signed up in 2 minutes. Connected my brokers. Instantly saw my entire portfolio on one screen with benchmarks, dividends, and allocation data.</p>
        <div style="padding:16px;background:rgba(74,222,128,0.06);border-radius:12px;border:1px solid rgba(74,222,128,0.12);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <img src="{LOGO}" style="width:28px;height:28px;border-radius:7px;" />
                <span class="body" style="font-size:13px;font-weight:700;color:#fff;">WealthClaude</span>
                <span style="font-size:9px;padding:2px 6px;background:rgba(74,222,128,0.15);border-radius:6px;color:{BL};font-weight:600;">FREE</span>
            </div>
            <p class="body" style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.4;margin:0;font-style:italic;">"Everything I needed. Nothing I didn't. And it was free."</p>
        </div>
    </div>
</div>''')

# S6: Chapter 5 — The Results (light)
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(5,True)}{ar(True)}
    <div style="position:absolute;left:40px;top:0;width:1px;height:100%;background:rgba(0,0,0,0.06);"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px 56px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;margin-left:-24px;">
            {timeline_dot_light(True)}
            <span class="body" style="font-size:10px;font-weight:700;letter-spacing:2px;color:{BD};">CHAPTER 05</span>
        </div>
        <span class="body" style="font-size:10px;color:{MUTED};margin-bottom:16px;">12 months later</span>
        <h2 class="heading" style="font-size:28px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:{DBG};margin:0 0 14px;font-style:italic;">The Results</h2>
        <p class="body" style="font-size:13px;color:rgba(0,0,0,0.5);line-height:1.55;margin:0 0 18px;">One year of actually seeing my data changed everything.</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="padding:12px 14px;background:#fff;border-radius:10px;border:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
                <span class="body" style="font-size:12px;color:{MUTED};">Tools used</span>
                <div><span class="body" style="font-size:11px;color:{RED};text-decoration:line-through;margin-right:8px;">5 apps</span><span class="body" style="font-size:14px;font-weight:800;color:{BD};">1</span></div>
            </div>
            <div style="padding:12px 14px;background:#fff;border-radius:10px;border:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
                <span class="body" style="font-size:12px;color:{MUTED};">Time spent daily</span>
                <div><span class="body" style="font-size:11px;color:{RED};text-decoration:line-through;margin-right:8px;">45 min</span><span class="body" style="font-size:14px;font-weight:800;color:{BD};">3 min</span></div>
            </div>
            <div style="padding:12px 14px;background:#fff;border-radius:10px;border:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
                <span class="body" style="font-size:12px;color:{MUTED};">Return vs benchmark</span>
                <div><span class="body" style="font-size:11px;color:{RED};text-decoration:line-through;margin-right:8px;">-7%</span><span class="body" style="font-size:14px;font-weight:800;color:{BD};">+1.2%</span></div>
            </div>
            <div style="padding:12px 14px;background:#fff;border-radius:10px;border:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;">
                <span class="body" style="font-size:12px;color:{MUTED};">Dividends tracked</span>
                <div><span class="body" style="font-size:11px;color:{RED};text-decoration:line-through;margin-right:8px;">$0</span><span class="body" style="font-size:14px;font-weight:800;color:{BD};">$5,135/yr</span></div>
            </div>
        </div>
    </div>
</div>''')

# S7: CTA
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(6,False)}
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 40px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span class="body" style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <h2 class="heading" style="font-size:30px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 12px;font-style:italic;">Your Journey<br>Starts Here</h2>
        <p class="body" style="font-size:13px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0 0 22px;">From scattered to structured. From guessing to knowing. Free forever, no bank account needed.</p>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{B};color:{DBG};font-weight:700;font-size:14px;border-radius:28px;align-self:flex-start;">
            Start Your Journey \u2192
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
dots = "".join(f'<div class="dot" style="height:6px;border-radius:3px;transition:all 0.3s;{"background:#fff;width:8px;" if i==0 else "background:rgba(255,255,255,0.3);width:6px;"}"></div>' for i in range(TOTAL))

html = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — V9 Story Journey</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Nunito+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Nunito Sans',sans-serif;}}
.heading{{font-family:'Lora','Georgia',serif;}}
.body{{font-family:'Nunito Sans','Segoe UI',sans-serif;}}
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
  <div class="ig-caption"><span class="handle">wealth_claude </span><span class="text">From 5 spreadsheets to 1 dashboard. Here's how it happened \U0001F4C8 Link in bio.</span><div class="time">2 HOURS AGO</div></div>
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

Path("carousel_v9_story.html").write_text(html, encoding="utf-8")
print(f"V9 Story Journey written ({len(html):,} bytes)")
