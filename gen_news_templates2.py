"""
3 MORE news image templates using the oil/ceasefire article.
Building on A and C styles the user liked, plus new formats.
"""
import base64, math
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
DBG = "#0A0A08"
RED = "#EF4444"
AMBER = "#FBBF24"

HEADLINE = "Oil Prices Plunge Below $95 After Trump Agrees to Iran Ceasefire"
SOURCE = "CNBC"
DATE = "April 7, 2026"
CATEGORY = "COMMODITIES"

KEY_POINTS = [
    "WTI crude fell ~18% to $92.50/bbl — worst day since April 2020",
    "Brent crude dropped 16%+ to $91.25/bbl",
    "2-week ceasefire: Iran to reopen Strait of Hormuz",
    "20% of global oil supply passes through the Strait",
    "Pakistan PM brokered the deal before Trump's 8pm deadline",
]

QUOTE = "Almost all of the various points of past contention have been agreed to between the United States and Iran."
QUOTE_ATTR = "President Donald Trump"

MARKET_DATA = [
    ("\U0001F6E2\uFE0F", "WTI Crude", "-18%", "$92.50", "down"),
    ("\U0001F6E2\uFE0F", "Brent Crude", "-16%", "$91.25", "down"),
    ("\u26FD", "Gasoline", "-12%", "Expected", "down"),
    ("\U0001F4C8", "S&P 500", "+2.1%", "Futures", "up"),
]

def ig_wrapper(title, slide_html):
    return f'''
    <div style="display:inline-block;vertical-align:top;margin:20px;">
        <p style="color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;letter-spacing:1px;margin-bottom:8px;text-align:center;">{title}</p>
        <div style="width:420px;background:#000;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
            <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;">
                <div style="width:32px;height:32px;border-radius:50%;border:2px solid {B};overflow:hidden;"><img src="{LOGO}" style="width:100%;height:100%;object-fit:cover;" /></div>
                <div style="flex:1;"><div style="font-size:13px;font-weight:600;color:#fff;">wealth_claude</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">Market Analysis</div></div>
            </div>
            <div style="width:420px;height:525px;overflow:hidden;">{slide_html}</div>
            <div style="display:flex;align-items:center;padding:10px 14px;gap:16px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="1.5"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg style="margin-left:auto;" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div style="padding:6px 16px 14px;">
                <span style="font-size:13px;font-weight:600;color:#fff;">wealth_claude </span>
                <span style="font-size:13px;color:rgba(255,255,255,0.7);">oil market update \U0001F6E2\uFE0F</span>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px;">3 HOURS AGO</div>
            </div>
        </div>
    </div>'''


# ============================================
# TEMPLATE D: Ticker Tape / Data Dashboard
# Giant price move as hero, ticker-style data rows, dark
# ============================================
rows_d = ""
for icon, name, change, price, direction in MARKET_DATA:
    color = B if direction == "up" else RED
    arrow = "\u25B2" if direction == "up" else "\u25BC"
    bg = "rgba(74,222,128,0.06)" if direction == "up" else "rgba(239,68,68,0.06)"
    rows_d += f'''<div style="display:flex;align-items:center;padding:10px 14px;background:{bg};border-radius:8px;">
        <span style="font-size:14px;margin-right:10px;">{icon}</span>
        <div style="flex:1;">
            <span style="font-size:12px;font-weight:600;color:#fff;display:block;">{name}</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.3);">{price}</span>
        </div>
        <span style="font-size:16px;font-weight:800;color:{color};">{arrow} {change}</span>
    </div>'''

points_d = ""
for p in KEY_POINTS[:3]:
    points_d += f'<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;"><span style="color:{B};font-size:8px;margin-top:4px;">\u25CF</span><span style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.4;">{p}</span></div>'

template_d = f'''<div style="width:420px;height:525px;background:{DBG};position:relative;overflow:hidden;">
    <div style="padding:22px 28px 20px;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
            <img src="{LOGO}" style="width:24px;height:24px;border-radius:6px;" />
            <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
            <span style="margin-left:auto;font-size:9px;font-weight:600;padding:3px 8px;background:rgba(239,68,68,0.08);border-radius:6px;color:{RED};">{CATEGORY}</span>
        </div>

        <!-- Giant price move -->
        <div style="margin-bottom:6px;">
            <div style="display:flex;align-items:baseline;gap:4px;">
                <span style="font-size:64px;font-weight:800;letter-spacing:-3px;color:{RED};line-height:1;">\u25BC18%</span>
            </div>
            <span style="font-size:13px;color:rgba(255,255,255,0.4);">WTI Crude Oil \u2014 worst day since 2020</span>
        </div>

        <!-- Headline -->
        <h1 style="font-size:18px;font-weight:700;letter-spacing:-0.3px;line-height:1.15;color:#fff;margin:12px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">{HEADLINE}</h1>

        <!-- Key context -->
        <div style="margin-bottom:14px;">{points_d}</div>

        <!-- Ticker rows -->
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
            {rows_d}
        </div>

        <!-- Footer -->
        <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:rgba(255,255,255,0.2);">{SOURCE} \u00b7 {DATE}</span>
            <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
        </div>
    </div>
</div>'''


# ============================================
# TEMPLATE E: Timeline / Sequence of Events
# Vertical timeline showing how it unfolded, dark + green accents
# ============================================
events = [
    ("8:00 AM", "War Escalation", "Trump threatens to bomb every bridge and power plant in Iran", RED),
    ("2:00 PM", "Ultimatum", '"A whole civilization will die tonight" \u2014 Trump on Truth Social', RED),
    ("5:30 PM", "Pakistan Intervenes", "PM Sharif brokers negotiations, asks Iran to reopen Strait", AMBER),
    ("6:15 PM", "Ceasefire Deal", "2-week ceasefire agreed. Iran to allow safe Strait passage", B),
    ("8:48 AM+1", "Oil Crashes", "WTI -18% to $92.50. Brent -16% to $91.25", B),
]

timeline_html = ""
for i, (time, title, desc, color) in enumerate(events):
    is_last = i == len(events) - 1
    line = "" if is_last else f'<div style="position:absolute;left:5px;top:14px;bottom:-8px;width:1px;background:rgba(255,255,255,0.06);"></div>'
    timeline_html += f'''<div style="position:relative;display:flex;gap:14px;padding-bottom:{"0" if is_last else "14px"};">
        {line}
        <div style="width:11px;height:11px;border-radius:50%;background:{color};flex-shrink:0;margin-top:3px;box-shadow:0 0 6px {"rgba(74,222,128,0.3)" if color==B else ("rgba(251,191,36,0.3)" if color==AMBER else "rgba(239,68,68,0.3)")};"></div>
        <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                <span style="font-size:10px;font-weight:700;color:{color};">{time}</span>
                <span style="font-size:11px;font-weight:700;color:#fff;">{title}</span>
            </div>
            <p style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.35;margin:0;">{desc}</p>
        </div>
    </div>'''

template_e = f'''<div style="width:420px;height:525px;background:{DBG};position:relative;overflow:hidden;">
    <!-- Green accent top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,{RED},{AMBER},{B});"></div>

    <div style="display:flex;flex-direction:column;height:100%;padding:22px 28px 20px;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <img src="{LOGO}" style="width:24px;height:24px;border-radius:6px;" />
            <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:{B};">HOW IT UNFOLDED</span>
            <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">{DATE}</span>
        </div>

        <!-- Headline -->
        <h1 style="font-size:20px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">{HEADLINE}</h1>

        <!-- Timeline -->
        <div style="flex:1;overflow:hidden;">
            {timeline_html}
        </div>

        <!-- Bottom stat -->
        <div style="display:flex;gap:12px;padding:12px 0 0;border-top:1px solid rgba(255,255,255,0.06);margin-top:12px;">
            <div style="flex:1;text-align:center;">
                <span style="font-size:20px;font-weight:800;color:{B};display:block;">-18%</span>
                <span style="font-size:9px;color:rgba(255,255,255,0.3);">WTI CRUDE</span>
            </div>
            <div style="width:1px;background:rgba(255,255,255,0.06);"></div>
            <div style="flex:1;text-align:center;">
                <span style="font-size:20px;font-weight:800;color:{B};display:block;">-16%</span>
                <span style="font-size:9px;color:rgba(255,255,255,0.3);">BRENT CRUDE</span>
            </div>
            <div style="width:1px;background:rgba(255,255,255,0.06);"></div>
            <div style="flex:1;text-align:center;">
                <span style="font-size:20px;font-weight:800;color:{AMBER};display:block;">20%</span>
                <span style="font-size:9px;color:rgba(255,255,255,0.3);">GLOBAL SUPPLY</span>
            </div>
        </div>
    </div>
</div>'''


# ============================================
# TEMPLATE F: Split Stat + Context
# Left: massive stat. Right: headline + context. Horizontal split feel.
# ============================================
context_points = [
    "Strait of Hormuz handles 20% of global oil",
    "Ceasefire brokered by Pakistan PM Sharif",
    "Iran agrees to safe passage during 2-week period",
    "Worst single-day oil crash since April 2020",
]
ctx_html = ""
for p in context_points:
    ctx_html += f'''<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;">
        <div style="width:4px;height:4px;border-radius:50%;background:{B};margin-top:5px;flex-shrink:0;"></div>
        <span style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.4;">{p}</span>
    </div>'''

template_f = f'''<div style="width:420px;height:525px;background:{DBG};position:relative;overflow:hidden;">
    <div style="display:flex;flex-direction:column;height:100%;">
        <!-- Top: Giant stat zone -->
        <div style="padding:28px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
                <img src="{LOGO}" style="width:24px;height:24px;border-radius:6px;" />
                <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
                <span style="margin-left:auto;font-size:9px;font-weight:600;padding:3px 8px;background:rgba(74,222,128,0.08);border-radius:6px;color:{B};">CEASEFIRE</span>
            </div>
            <div style="display:flex;align-items:flex-end;gap:16px;">
                <div>
                    <span style="font-size:11px;color:rgba(255,255,255,0.3);display:block;margin-bottom:4px;">WTI CRUDE OIL</span>
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-size:52px;font-weight:800;letter-spacing:-2px;color:#fff;line-height:1;">$92<span style="font-size:28px;">.50</span></span>
                    </div>
                </div>
                <div style="padding:6px 12px;background:rgba(74,222,128,0.08);border-radius:8px;margin-bottom:8px;">
                    <span style="font-size:20px;font-weight:800;color:{B};">\u25BC 18%</span>
                </div>
            </div>
        </div>

        <!-- Bottom: Context -->
        <div style="flex:1;padding:18px 28px 20px;display:flex;flex-direction:column;">
            <h1 style="font-size:19px;font-weight:700;letter-spacing:-0.3px;line-height:1.15;color:#fff;margin:0 0 14px;">{HEADLINE}</h1>

            <!-- Quote -->
            <div style="padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid {B};margin-bottom:14px;">
                <p style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.35;font-style:italic;margin:0;">"{QUOTE}"</p>
                <span style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px;display:block;">\u2014 {QUOTE_ATTR}</span>
            </div>

            <!-- Context bullets -->
            {ctx_html}

            <!-- Footer -->
            <div style="display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:10px;color:rgba(255,255,255,0.2);">{SOURCE} \u00b7 {DATE}</span>
                <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
            </div>
        </div>
    </div>
</div>'''


# Build comparison page
html = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — News Templates Set 2</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;min-height:100vh;padding:40px 20px;font-family:'Inter',sans-serif;}}
</style>
</head>
<body>
{ig_wrapper("TEMPLATE D \u2014 Ticker Dashboard", template_d)}
{ig_wrapper("TEMPLATE E \u2014 Timeline / How It Unfolded", template_e)}
{ig_wrapper("TEMPLATE F \u2014 Split Stat + Context", template_f)}
</body></html>'''

Path("news_templates2_preview.html").write_text(html, encoding="utf-8")
print(f"News templates set 2 written ({len(html):,} bytes)")
