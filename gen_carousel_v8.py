"""
V8 — Myth Busting: Each slide busts a common investing myth.
Big red MYTH stamp → green FACT reveal. Inter font, bold verdicts.
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

def myth_stamp():
    return f'<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(239,68,68,0.1);border:1.5px solid rgba(239,68,68,0.3);border-radius:8px;transform:rotate(-2deg);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="{RED}" stroke-width="2.5" stroke-linecap="round"/></svg><span style="font-size:12px;font-weight:800;color:{RED};letter-spacing:2px;">MYTH</span></div>'

def fact_stamp():
    return f'<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(74,222,128,0.1);border:1.5px solid rgba(74,222,128,0.3);border-radius:8px;transform:rotate(-1deg);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="{B}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:12px;font-weight:800;color:{BD};letter-spacing:2px;">FACT</span></div>'

slides = []

# S1: Hero
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(0,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <span style="font-size:10px;font-weight:700;letter-spacing:3px;color:{B};margin-bottom:18px;">MYTH VS FACT</span>
        <h1 style="font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.05;color:#fff;margin:0 0 16px;">5 Investing<br>Myths That Are<br>Costing You Money</h1>
        <div style="display:flex;gap:10px;margin-top:4px;">
            {myth_stamp()}
            <span style="color:rgba(255,255,255,0.2);align-self:center;font-size:16px;">\u2192</span>
            {fact_stamp()}
        </div>
    </div>
</div>''')

# Myth slides — alternating light/dark, each has myth + fact + evidence
myths = [
    {
        "bg": "light",
        "myth": '"If my portfolio is green, I\'m doing great"',
        "fact": "Green doesn't mean you're beating the market.",
        "evidence": "+12% sounds great — until you see the S&P did +19%. Without a benchmark, you're celebrating underperformance.",
        "verdict": "73% of self-directed investors underperform their index.",
        "num": "01"
    },
    {
        "bg": "dark",
        "myth": '"Dividends don\'t matter for growth investors"',
        "fact": "Dividends account for ~40% of total stock market returns since 1930.",
        "evidence": "Not tracking dividend income means ignoring nearly half your actual return. Especially across global markets.",
        "verdict": "Dividend reinvestment turns $10K into $130K+ over 30 years.",
        "num": "02"
    },
    {
        "bg": "light",
        "myth": '"I own 20 stocks, so I\'m diversified"',
        "fact": "20 tech stocks is still one sector.",
        "evidence": "Number of holdings \u2260 diversification. Without allocation tracking, you could be 40%+ in one sector and not know it.",
        "verdict": "Allocation by sector matters more than number of stocks.",
        "num": "03"
    },
    {
        "bg": "dark",
        "myth": '"My broker app shows me everything I need"',
        "fact": "Broker apps show trades, not insight.",
        "evidence": "No benchmarking. No cross-broker view. No dividend tracking. No goal progress. You're seeing 20% of the picture.",
        "verdict": "The average investor uses 3.7 tools to fill the gaps.",
        "num": "04"
    },
    {
        "bg": "light",
        "myth": '"I don\'t need a financial goal, I just invest consistently"',
        "fact": "Consistency without direction is just motion.",
        "evidence": "Without a target number and timeline, you can't optimize contributions, measure progress, or know when to adjust.",
        "verdict": "Investors with written goals accumulate 2.7x more wealth.",
        "num": "05"
    },
]

for idx, m in enumerate(myths):
    i = idx + 1
    light = m["bg"] == "light"
    bgc = LBG if light else DBG
    hc = DBG if light else "#fff"
    bc = "rgba(0,0,0,0.5)" if light else "rgba(255,255,255,0.4)"
    tc = BD if light else BL
    card_bg = "#fff" if light else "rgba(255,255,255,0.03)"
    card_br = "rgba(0,0,0,0.06)" if light else "rgba(255,255,255,0.06)"
    verdict_bg = "rgba(74,222,128,0.06)" if light else "rgba(74,222,128,0.08)"
    verdict_br = "rgba(74,222,128,0.12)" if light else "rgba(74,222,128,0.12)"

    slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{bgc};">
    {pb(i, light)}{ar(light)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{tc};margin-bottom:14px;">MYTH #{m["num"]}</span>

        <!-- Myth -->
        <div style="padding:12px 14px;background:{card_bg};border-radius:10px;border:1px solid rgba(239,68,68,0.2);margin-bottom:10px;">
            <div style="margin-bottom:8px;">{myth_stamp()}</div>
            <p style="font-size:15px;font-weight:700;color:{hc};font-style:italic;line-height:1.3;margin:0;">{m["myth"]}</p>
        </div>

        <!-- Fact -->
        <div style="padding:12px 14px;background:{card_bg};border-radius:10px;border:1px solid rgba(74,222,128,0.2);margin-bottom:10px;">
            <div style="margin-bottom:8px;">{fact_stamp()}</div>
            <p style="font-size:14px;font-weight:700;color:{B if not light else BD};line-height:1.3;margin:0 0 6px;">{m["fact"]}</p>
            <p style="font-size:12px;color:{bc};line-height:1.45;margin:0;">{m["evidence"]}</p>
        </div>

        <!-- Verdict -->
        <div style="padding:8px 12px;background:{verdict_bg};border:1px solid {verdict_br};border-radius:8px;">
            <p style="font-size:11px;font-weight:600;color:{BD if light else BL};margin:0;">\U0001F4CA {m["verdict"]}</p>
        </div>
    </div>
</div>''')

# S7: CTA
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(6,False)}
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <h2 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 10px;">Stop Believing<br>the Myths.<br>Start Seeing<br>the Data.</h2>
        <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0 0 20px;">Free portfolio tracker with benchmarks, dividends, allocation, goals — and zero guesswork.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
            <span style="font-size:10px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:16px;color:rgba(255,255,255,0.35);">160+ countries</span>
            <span style="font-size:10px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:16px;color:rgba(255,255,255,0.35);">51 markets</span>
            <span style="font-size:10px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:16px;color:rgba(255,255,255,0.35);">Free forever</span>
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{B};color:{DBG};font-weight:700;font-size:14px;border-radius:28px;align-self:flex-start;">
            Start Free \u2192
        </div>
    </div>
</div>''')

all_slides = "\n".join(slides)
dots = "".join(f'<div class="dot" style="height:6px;border-radius:3px;transition:all 0.3s;{"background:#fff;width:8px;" if i==0 else "background:rgba(255,255,255,0.3);width:6px;"}"></div>' for i in range(TOTAL))

html = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — V8 Myth Busting</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'Inter',sans-serif;}}
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
  <div class="ig-caption"><span class="handle">wealth_claude </span><span class="text">5 myths that cost investors thousands. Swipe for the facts \U0001F4CA Link in bio.</span><div class="time">2 HOURS AGO</div></div>
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

Path("carousel_v8_mythbust.html").write_text(html, encoding="utf-8")
print(f"V8 Myth Busting written ({len(html):,} bytes)")
