"""
3 Instagram single-image templates for blog-to-image news posts.
All 420x525 (4:5), same export pipeline as carousels.
"""
import base64
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

# Article data
HEADLINE = "Trump Threatens Tariffs of 50% on Nations Supplying Weapons to Iran"
SOURCE = "CNBC"
DATE = "April 8, 2026"
CATEGORY = "GEOPOLITICS"

KEY_POINTS = [
    "50% tariff on all goods from any nation supplying military weapons to Iran",
    "Effective immediately — no exclusions or exemptions",
    "Follows ceasefire agreement and U.S.–Iran peace proposals",
    "U.S. and Iran to discuss tariffs and sanctions relief",
]

QUOTE = "A Country supplying Military Weapons to Iran will be immediately tariffed... 50%, effective immediately."
QUOTE_ATTR = "President Donald Trump"

MARKET_IMPACT = [
    ("\U0001F6E2\uFE0F", "Oil", "+3.2%", "up"),
    ("\U0001F4B5", "USD Index", "+0.8%", "up"),
    ("\U0001F30D", "EU Stocks", "-1.4%", "down"),
    ("\U0001F1E8\U0001F1F3", "China ETF", "-2.1%", "down"),
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
                <span style="font-size:13px;color:rgba(255,255,255,0.7);">{CATEGORY.lower()} update \U0001F4CA</span>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px;">2 HOURS AGO</div>
            </div>
        </div>
    </div>'''


# ============================================
# TEMPLATE A: Breaking News / Alert
# Red alert bar, big headline, bullet points, market impact row
# ============================================
impact_a = ""
for icon, name, change, direction in MARKET_IMPACT:
    color = B if direction == "up" else RED
    arrow = "\u25B2" if direction == "up" else "\u25BC"
    impact_a += f'''<div style="flex:1;text-align:center;padding:8px 0;">
        <span style="font-size:13px;display:block;">{icon}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.4);display:block;margin:2px 0;">{name}</span>
        <span style="font-size:13px;font-weight:700;color:{color};">{arrow} {change}</span>
    </div>'''

points_a = ""
for p in KEY_POINTS:
    points_a += f'<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;"><span style="color:{B};font-size:10px;margin-top:3px;">\u25CF</span><span style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;">{p}</span></div>'

template_a = f'''<div style="width:420px;height:525px;background:{DBG};position:relative;overflow:hidden;">
    <!-- Red alert bar -->
    <div style="background:{RED};padding:8px 16px;display:flex;align-items:center;gap:8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" stroke="#fff" stroke-width="2" fill="none"/><line x1="12" y1="10" x2="12" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1" fill="#fff"/></svg>
        <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fff;">BREAKING NEWS</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.6);">{DATE}</span>
    </div>

    <div style="padding:20px 28px 20px;">
        <!-- Category + Source -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <span style="font-size:9px;font-weight:700;letter-spacing:2px;padding:3px 8px;background:rgba(239,68,68,0.1);border-radius:6px;color:{RED};">{CATEGORY}</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.3);">via {SOURCE}</span>
        </div>

        <!-- Headline -->
        <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">{HEADLINE}</h1>

        <!-- Key points -->
        <div style="margin-bottom:16px;">
            {points_a}
        </div>

        <!-- Market impact -->
        <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.25);display:block;margin-bottom:8px;">MARKET IMPACT</span>
            <div style="display:flex;">{impact_a}</div>
        </div>

        <!-- Footer -->
        <div style="display:flex;align-items:center;gap:8px;margin-top:14px;">
            <img src="{LOGO}" style="width:20px;height:20px;border-radius:5px;" />
            <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.5px;">wealthclaude.com</span>
        </div>
    </div>
</div>'''


# ============================================
# TEMPLATE B: Clean Analysis Card
# White card on dark bg, structured data, clean hierarchy
# ============================================
points_b = ""
for idx, p in enumerate(KEY_POINTS):
    points_b += f'''<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;{"border-bottom:1px solid rgba(0,0,0,0.06);" if idx < len(KEY_POINTS)-1 else ""}">
        <span style="font-size:10px;font-weight:700;color:{BD};margin-top:2px;">0{idx+1}</span>
        <span style="font-size:12px;color:rgba(0,0,0,0.6);line-height:1.4;">{p}</span>
    </div>'''

impact_b = ""
for icon, name, change, direction in MARKET_IMPACT:
    color = BD if direction == "up" else RED
    arrow = "\u25B2" if direction == "up" else "\u25BC"
    impact_b += f'''<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;">
        <span style="font-size:11px;color:rgba(0,0,0,0.5);">{icon} {name}</span>
        <span style="font-size:12px;font-weight:700;color:{color};">{arrow} {change}</span>
    </div>'''

template_b = f'''<div style="width:420px;height:525px;background:{DBG};position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:20px 24px;">
    <!-- Floating white card -->
    <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <img src="{LOGO}" style="width:24px;height:24px;border-radius:6px;" />
            <span style="font-size:10px;font-weight:600;letter-spacing:0.5px;color:rgba(0,0,0,0.35);">WEALTHCLAUDE</span>
            <span style="margin-left:auto;font-size:9px;font-weight:600;padding:3px 8px;background:rgba(239,68,68,0.08);border-radius:6px;color:{RED};">{CATEGORY}</span>
        </div>

        <!-- Headline -->
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#111;margin:0 0 4px;">{HEADLINE}</h1>
        <span style="font-size:10px;color:rgba(0,0,0,0.3);">{SOURCE} \u00b7 {DATE}</span>

        <!-- Divider -->
        <div style="width:32px;height:2px;background:{B};border-radius:1px;margin:14px 0;"></div>

        <!-- Key points -->
        {points_b}

        <!-- Market impact -->
        <div style="margin-top:14px;padding:12px;background:rgba(0,0,0,0.02);border-radius:10px;">
            <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(0,0,0,0.25);display:block;margin-bottom:6px;">MARKET IMPACT</span>
            {impact_b}
        </div>
    </div>
</div>'''


# ============================================
# TEMPLATE C: Editorial / Quote-Forward + Data Sidebar
# Big quote, stat highlights, dark premium
# ============================================
stats_c = ""
for icon, name, change, direction in MARKET_IMPACT:
    color = B if direction == "up" else RED
    stats_c += f'''<div style="padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;color:rgba(255,255,255,0.4);">{icon} {name}</span>
        <span style="font-size:12px;font-weight:700;color:{color};">{change}</span>
    </div>'''

template_c = f'''<div style="width:420px;height:525px;background:{DBG};position:relative;overflow:hidden;">
    <!-- Green accent line top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,{BD},{B},{BL});"></div>

    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:24px 28px 24px;">
        <!-- Category badge -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <img src="{LOGO}" style="width:24px;height:24px;border-radius:6px;" />
            <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:{B};">MARKET ANALYSIS</span>
            <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">{DATE}</span>
        </div>

        <!-- Headline -->
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">{HEADLINE}</h1>

        <!-- Big stat callout -->
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:16px;">
            <span style="font-size:48px;font-weight:800;letter-spacing:-2px;color:{RED};line-height:1;">50%</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.3;">tariff on all goods<br>from supplying nations</span>
        </div>

        <!-- Quote box -->
        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid {B};margin-bottom:16px;">
            <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;font-style:italic;margin:0 0 6px;">"{QUOTE}"</p>
            <span style="font-size:10px;color:rgba(255,255,255,0.25);">\u2014 {QUOTE_ATTR}</span>
        </div>

        <!-- Market impact grid -->
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
            {stats_c}
        </div>

        <!-- Source -->
        <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:rgba(255,255,255,0.2);">Source: {SOURCE}</span>
            <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
        </div>
    </div>
</div>'''


# Build the comparison page
html = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WealthClaude — News Image Templates</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;min-height:100vh;padding:40px 20px;font-family:'Inter',sans-serif;gap:0;}}
</style>
</head>
<body>
{ig_wrapper("TEMPLATE A — Breaking Alert", template_a)}
{ig_wrapper("TEMPLATE B — Clean Analysis Card", template_b)}
{ig_wrapper("TEMPLATE C — Editorial + Data", template_c)}
</body></html>'''

Path("news_templates_preview.html").write_text(html, encoding="utf-8")
print(f"News templates written ({len(html):,} bytes)")
