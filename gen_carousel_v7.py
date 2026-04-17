"""
V7 — Before/After Split: Each mistake slide has a visual before→after
transformation. Red/gray chaos on the left, green clarity on the right.
Split-screen cards, transformation arrows, DM Sans font.
"""
import base64, math
from pathlib import Path

logo_path = Path("public/android-icon-192x192.png")
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
LOGO = f"data:image/png;base64,{logo_b64}"

B  = "#4ADE80"
BL = "#7AEEA6"
BD = "#1E7A45"
LBG = "#F4F4F0"
DBG = "#0B0B09"
RED = "#EF4444"
REDBG = "rgba(239,68,68,0.08)"
REDBR = "rgba(239,68,68,0.15)"
GBG = "rgba(74,222,128,0.08)"
GBR = "rgba(74,222,128,0.15)"
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

def before_pill():
    return '<span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;padding:3px 8px;background:rgba(239,68,68,0.1);color:#EF4444;border-radius:6px;">BEFORE</span>'

def after_pill():
    return f'<span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;padding:3px 8px;background:rgba(74,222,128,0.1);color:{BD};border-radius:6px;">AFTER</span>'

def arrow_down():
    return f'<div style="display:flex;justify-content:center;padding:6px 0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="{B}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'

slides = []

# =============================================
# S1: HERO — Dark, dramatic "before" chaos hook
# =============================================
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(0,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:36px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:20px;">
            {before_pill()}
            <span style="font-size:9px;font-weight:500;color:rgba(255,255,255,0.2);align-self:center;">\u2192</span>
            {after_pill()}
        </div>
        <h1 style="font-size:34px;font-weight:700;letter-spacing:-1px;line-height:1.05;color:#fff;margin:0 0 16px;">What Changes<br>When You Actually<br>Track Your Portfolio</h1>
        <p style="font-size:13px;color:rgba(255,255,255,0.35);line-height:1.5;margin:0;">5 transformations. Same portfolio. Different outcome.</p>
    </div>
</div>''')

# =============================================
# S2: Transform 1 — Benchmarking (light)
# =============================================
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(1,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BD};margin-bottom:14px;">TRANSFORM 01</span>
        <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:{DBG};margin:0 0 16px;">Performance Tracking</h2>

        <!-- Before card -->
        <div style="padding:14px;background:#fff;border-radius:12px;border:1px solid {REDBR};margin-bottom:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                {before_pill()}
                <span style="font-size:10px;color:{MUTED};">No benchmark</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:6px;">
                <span style="font-size:28px;font-weight:800;color:{DBG};">+12.4%</span>
                <span style="font-size:12px;color:{MUTED};">your return</span>
            </div>
            <p style="font-size:11px;color:{MUTED};margin:6px 0 0;">"I'm doing great!" \u2014 you, guessing</p>
        </div>

        {arrow_down()}

        <!-- After card -->
        <div style="padding:14px;background:#fff;border-radius:12px;border:1px solid {GBR};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                {after_pill()}
                <span style="font-size:10px;color:{BD};">vs S&P 500</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:16px;">
                <div>
                    <span style="font-size:28px;font-weight:800;color:{RED};">+12.4%</span>
                    <span style="font-size:10px;color:{MUTED};display:block;">Your return</span>
                </div>
                <span style="font-size:14px;color:{MUTED};">vs</span>
                <div>
                    <span style="font-size:28px;font-weight:800;color:{BD};">+18.7%</span>
                    <span style="font-size:10px;color:{MUTED};display:block;">S&P 500</span>
                </div>
            </div>
            <p style="font-size:11px;color:{RED};font-weight:600;margin:8px 0 0;">You're underperforming by 6.3%</p>
        </div>
    </div>
</div>''')

# =============================================
# S3: Transform 2 — Dividends (dark)
# =============================================
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(2,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BL};margin-bottom:14px;">TRANSFORM 02</span>
        <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">Dividend Visibility</h2>

        <!-- Before -->
        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(239,68,68,0.15);margin-bottom:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                {before_pill()}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span style="font-size:11px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:8px;color:rgba(255,255,255,0.25);">US: ???</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:8px;color:rgba(255,255,255,0.25);">UK: ???</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:8px;color:rgba(255,255,255,0.25);">EU: ???</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(255,255,255,0.04);border-radius:8px;color:rgba(255,255,255,0.25);">CA: ???</span>
            </div>
            <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:8px 0 0;">Total income: unknown</p>
        </div>

        {arrow_down()}

        <!-- After -->
        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(74,222,128,0.15);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                {after_pill()}
                <span style="font-size:10px;color:{BL};">6 regions tracked</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="font-size:11px;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:8px;color:{BL};">US: $3,240</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:8px;color:{BL};">UK: $890</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:8px;color:{BL};">EU: $420</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:8px;color:{BL};">CA: $310</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:8px;color:{BL};">SG: $180</span>
                <span style="font-size:11px;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:8px;color:{BL};">AU: $95</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:6px;">
                <span style="font-size:24px;font-weight:800;color:{B};">$5,135</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.4);">/year total</span>
            </div>
        </div>
    </div>
</div>''')

# =============================================
# S4: Transform 3 — Allocation (light)
# =============================================
def mini_bar(pct, color, w=120):
    return f'<div style="width:{w}px;height:6px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden;"><div style="width:{pct}%;height:100%;background:{color};border-radius:3px;"></div></div>'

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(3,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BD};margin-bottom:14px;">TRANSFORM 03</span>
        <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:{DBG};margin:0 0 16px;">Portfolio Allocation</h2>

        <!-- Before -->
        <div style="padding:14px;background:#fff;border-radius:12px;border:1px solid {REDBR};margin-bottom:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                {before_pill()}
                <span style="font-size:10px;color:{MUTED};">No visibility</span>
            </div>
            <div style="display:flex;height:24px;border-radius:6px;overflow:hidden;">
                <div style="width:44%;background:{RED};"></div>
                <div style="width:20%;background:#FBBF24;"></div>
                <div style="width:15%;background:#94A3B8;"></div>
                <div style="width:21%;background:#CBD5E1;"></div>
            </div>
            <p style="font-size:11px;color:{RED};font-weight:600;margin:8px 0 0;">44% in one sector \u2014 hidden risk</p>
        </div>

        {arrow_down()}

        <!-- After -->
        <div style="padding:14px;background:#fff;border-radius:12px;border:1px solid {GBR};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                {after_pill()}
                <span style="font-size:10px;color:{BD};">Rebalanced</span>
            </div>
            <div style="display:flex;height:24px;border-radius:6px;overflow:hidden;margin-bottom:10px;">
                <div style="width:22%;background:{BD};"></div>
                <div style="width:20%;background:{B};"></div>
                <div style="width:18%;background:{BL};"></div>
                <div style="width:15%;background:#94A3B8;"></div>
                <div style="width:13%;background:#CBD5E1;"></div>
                <div style="width:12%;background:#E2E8F0;"></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <span style="font-size:10px;color:{BD};font-weight:600;">Tech 22%</span>
                <span style="font-size:10px;color:{MUTED};">\u00b7</span>
                <span style="font-size:10px;color:{BD};font-weight:600;">Finance 20%</span>
                <span style="font-size:10px;color:{MUTED};">\u00b7</span>
                <span style="font-size:10px;color:{BD};font-weight:600;">Health 18%</span>
                <span style="font-size:10px;color:{MUTED};">\u00b7</span>
                <span style="font-size:10px;color:{MUTED};">+3 more</span>
            </div>
            <p style="font-size:11px;color:{BD};font-weight:600;margin:8px 0 0;">\u2713 Balanced. No single-sector risk.</p>
        </div>
    </div>
</div>''')

# =============================================
# S5: Transform 4 — Tool consolidation (dark)
# =============================================
slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(4,False)}{ar(False)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BL};margin-bottom:14px;">TRANSFORM 04</span>
        <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">Your Daily Workflow</h2>

        <!-- Before -->
        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(239,68,68,0.15);margin-bottom:8px;">
            <div style="margin-bottom:10px;">{before_pill()}</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;">1\uFE0F\u20E3</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.4);text-decoration:line-through;">Open broker app</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;">2\uFE0F\u20E3</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.4);text-decoration:line-through;">Update spreadsheet</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;">3\uFE0F\u20E3</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.4);text-decoration:line-through;">Check news app</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;">4\uFE0F\u20E3</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.4);text-decoration:line-through;">Calculate dividends</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:16px;font-weight:800;color:{RED};">45 min</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.3);">/ day wasted</span>
            </div>
        </div>

        {arrow_down()}

        <!-- After -->
        <div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(74,222,128,0.15);">
            <div style="margin-bottom:10px;">{after_pill()}</div>
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="{LOGO}" style="width:36px;height:36px;border-radius:8px;" />
                <div>
                    <span style="font-size:13px;font-weight:700;color:#fff;">Open WealthClaude</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.35);display:block;">Everything. One screen.</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:16px;font-weight:800;color:{B};">2 min</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.3);">/ day. Done.</span>
            </div>
        </div>
    </div>
</div>''')

# =============================================
# S6: Transform 5 — Goals (light)
# =============================================
def prog_ring(pct, color, size=56, stroke=5):
    r = (size - stroke) / 2
    c = 2 * math.pi * r
    offset = c - (pct / 100) * c
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" style="transform:rotate(-90deg);"><circle cx="{size/2}" cy="{size/2}" r="{r}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="{stroke}"/><circle cx="{size/2}" cy="{size/2}" r="{r}" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-dasharray="{c}" stroke-dashoffset="{offset}" stroke-linecap="round"/></svg>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{LBG};">
    {pb(5,True)}{ar(True)}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:0 32px 52px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{BD};margin-bottom:14px;">TRANSFORM 05</span>
        <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:{DBG};margin:0 0 16px;">Financial Goals</h2>

        <!-- Before -->
        <div style="padding:14px;background:#fff;border-radius:12px;border:1px solid {REDBR};margin-bottom:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                {before_pill()}
            </div>
            <div style="text-align:center;padding:10px 0;">
                <span style="font-size:36px;">🤷</span>
                <p style="font-size:12px;color:{MUTED};margin:8px 0 0;">"I'll figure it out eventually"</p>
                <p style="font-size:11px;color:{RED};font-weight:600;margin:4px 0 0;">No target. No timeline. No tracking.</p>
            </div>
        </div>

        {arrow_down()}

        <!-- After -->
        <div style="padding:14px;background:#fff;border-radius:12px;border:1px solid {GBR};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                {after_pill()}
            </div>
            <div style="display:flex;gap:12px;">
                <div style="text-align:center;">
                    <div style="position:relative;width:56px;height:56px;">
                        {prog_ring(34, B)}
                        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px;font-weight:700;color:{BD};">34%</span>
                    </div>
                    <span style="font-size:9px;color:{MUTED};display:block;margin-top:4px;">Retirement</span>
                </div>
                <div style="text-align:center;">
                    <div style="position:relative;width:56px;height:56px;">
                        {prog_ring(72, B)}
                        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px;font-weight:700;color:{BD};">72%</span>
                    </div>
                    <span style="font-size:9px;color:{MUTED};display:block;margin-top:4px;">House Fund</span>
                </div>
                <div style="text-align:center;">
                    <div style="position:relative;width:56px;height:56px;">
                        {prog_ring(91, B)}
                        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px;font-weight:700;color:{BD};">91%</span>
                    </div>
                    <span style="font-size:9px;color:{MUTED};display:block;margin-top:4px;">Emergency</span>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
                    <span style="font-size:11px;font-weight:700;color:{BD};display:block;">\u2713 On track</span>
                    <span style="font-size:10px;color:{MUTED};display:block;margin-top:2px;">3 goals set<br>& monitored</span>
                </div>
            </div>
        </div>
    </div>
</div>''')

# =============================================
# S7: CTA — The full transformation summary (dark)
# =============================================
transforms = [
    ("No benchmarks", "Auto-benchmarked", "\U0001F4C8"),
    ("Missing dividends", "$5,135/yr tracked", "\U0001F4B0"),
    ("44% in one sector", "Balanced allocation", "\U0001F3AF"),
    ("45 min / 4 tools", "2 min / 1 platform", "\u26A1"),
    ("No goals", "3 goals on track", "\U0001F3C1"),
]
rows = ""
for before, after, icon in transforms:
    rows += f'''<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <span style="font-size:14px;width:20px;text-align:center;">{icon}</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:line-through;flex:1;">{before}</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.2);">\u2192</span>
        <span style="font-size:11px;color:{BL};font-weight:600;flex:1;text-align:right;">{after}</span>
    </div>'''

slides.append(f'''<div class="slide" style="width:420px;height:525px;position:relative;flex-shrink:0;overflow:hidden;background:{DBG};">
    {pb(6,False)}
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 32px 52px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
            <img src="{LOGO}" style="width:32px;height:32px;border-radius:8px;" />
            <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        </div>
        <h2 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:#fff;margin:0 0 6px;">Your Portfolio,<br>Transformed</h2>
        <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0 0 16px;">Same investments. Completely different visibility.</p>
        <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:20px;">
            {rows}
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
<title>WealthClaude — V7 Before/After</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;font-family:'DM Sans',sans-serif;}}
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
    <span class="text">Same portfolio. Completely different visibility. See the transformation \U0001F525 Free forever. Link in bio.</span>
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

Path("carousel_v7_beforeafter.html").write_text(html, encoding="utf-8")
print(f"V7 Before/After written ({len(html):,} bytes)")
