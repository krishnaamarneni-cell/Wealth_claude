/**
 * News image HTML renderers — Premium quality.
 * Each function returns an HTML string for a single 420x525 image.
 * Logo is inlined as base64 data URI for reliable rendering everywhere.
 */

import type { NewsTemplateType, MarketImpactItem, BigStat, TimelineEvent } from '@/src/types/database'

// Brand colors
const B = '#4ADE80'
const BL = '#7AEEA6'
const BD = '#1E7A45'
const DBG = '#0A0A08'
const RED = '#EF4444'
const AMBER = '#FBBF24'

// Inlined base64 logo — works in preview, html2canvas, and Playwright
const LOGO_B64 = "data:image/png;base64,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";

const LOGO = `<img src="${LOGO_B64}" style="width:24px;height:24px;border-radius:6px;flex-shrink:0;object-fit:cover;" />`

// Subtle noise texture overlay for premium feel
const NOISE = `<div style="position:absolute;top:0;left:0;right:0;bottom:0;opacity:0.03;background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');background-size:128px;pointer-events:none;z-index:1;"></div>`

// Subtle corner glow for premium depth
function cornerGlow(color: string, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right'): string {
  const pos = {
    'top-left': 'top:0;left:0',
    'top-right': 'top:0;right:0',
    'bottom-left': 'bottom:0;left:0',
    'bottom-right': 'bottom:0;right:0',
  }[position]
  return `<div style="position:absolute;${pos};width:200px;height:200px;background:radial-gradient(circle,${color} 0%,transparent 70%);opacity:0.06;pointer-events:none;z-index:0;"></div>`
}

export interface NewsData {
  headline: string
  source?: string
  category?: string
  date?: string
  key_points?: string[]
  quote?: { text: string; attribution: string }
  market_impact?: MarketImpactItem[]
  big_stat?: BigStat
  timeline_events?: TimelineEvent[]
  context_points?: string[]
}

export function renderNewsImage(template: NewsTemplateType, data: NewsData): string {
  switch (template) {
    case 'a': return renderTemplateA(data)
    case 'c': return renderTemplateC(data)
    case 'd': return renderTemplateD(data)
    case 'e': return renderTemplateE(data)
    case 'f': return renderTemplateF(data)
    default: return '<div style="width:420px;height:525px;background:#111;color:#fff;font-family:sans-serif;padding:20px;">Unknown template</div>'
  }
}

// ============================================
// Template A — Breaking Alert
// Red alert bar, big headline, bullet points, market impact row
// ============================================
function renderTemplateA(data: NewsData): string {
  const impact = (data.market_impact || []).map(item => {
    const color = item.direction === 'up' ? B : RED
    const arr = item.direction === 'up' ? '▲' : '▼'
    return `<div style="flex:1;text-align:center;padding:8px 4px;">
      <span style="font-size:14px;display:block;">${item.icon}</span>
      <span style="font-size:9px;font-weight:500;color:rgba(255,255,255,0.35);display:block;margin:3px 0;text-transform:uppercase;letter-spacing:0.5px;">${item.name}</span>
      <span style="font-size:13px;font-weight:700;color:${color};letter-spacing:-0.3px;">${arr} ${item.change}</span>
    </div>`
  }).join('')

  const points = (data.key_points || []).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:10px;padding:5px 0;">
      <div style="width:5px;height:5px;border-radius:50%;background:${B};margin-top:6px;flex-shrink:0;box-shadow:0 0 4px rgba(74,222,128,0.4);"></div>
      <span style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.45;">${p}</span>
    </div>`
  ).join('')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    ${NOISE}
    ${cornerGlow(RED, 'top-right')}

    <!-- Red alert bar with logo -->
    <div style="position:relative;z-index:2;background:linear-gradient(135deg,${RED},#DC2626);padding:9px 20px;display:flex;align-items:center;gap:8px;">
      ${LOGO}
      <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:#fff;">BREAKING NEWS</span>
      <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.5);font-weight:500;">${data.date || ''}</span>
    </div>

    <div style="position:relative;z-index:2;padding:20px 28px 20px;">
      <!-- Category + Source -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;padding:4px 10px;background:rgba(239,68,68,0.12);border-radius:6px;color:${RED};border:1px solid rgba(239,68,68,0.15);">${data.category || 'MARKETS'}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.3);font-weight:500;">via ${data.source || ''}</span>
      </div>

      <!-- Headline -->
      <h1 style="font-size:23px;font-weight:800;letter-spacing:-0.5px;line-height:1.12;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>

      <!-- Key points -->
      <div style="margin-bottom:14px;">${points}</div>

      <!-- Market impact -->
      <div style="padding:12px 0 10px;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:9px;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,0.2);display:block;margin-bottom:8px;">MARKET IMPACT</span>
        <div style="display:flex;">${impact}</div>
      </div>

      <!-- Footer -->
      <div style="display:flex;align-items:center;gap:6px;margin-top:12px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template C — Editorial + Data
// Green accent top, big stat, quote box, stacked market cards
// ============================================
function renderTemplateC(data: NewsData): string {
  const stats = (data.market_impact || []).map(item => {
    const color = item.direction === 'up' ? B : RED
    return `<div style="padding:9px 14px;background:rgba(255,255,255,0.025);border-radius:10px;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:500;">${item.icon} ${item.name}</span>
      <span style="font-size:12px;font-weight:700;color:${color};letter-spacing:-0.3px;">${item.change}</span>
    </div>`
  }).join('')

  const quote = data.quote || { text: '', attribution: '' }
  const stat = data.big_stat || { number: '', label: '' }

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    ${NOISE}
    ${cornerGlow(B, 'top-left')}
    ${cornerGlow(B, 'bottom-right')}

    <!-- Green accent line top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${BD},${B},${BL});z-index:2;"></div>

    <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:20px 28px 20px;">
      <!-- Category badge + logo (always visible at top) -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-shrink:0;">
        ${LOGO}
        <span style="font-size:9px;font-weight:700;letter-spacing:2.5px;color:${B};">MARKET ANALYSIS</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);font-weight:500;">${data.date || ''}</span>
      </div>

      <!-- Headline -->
      <h1 style="font-size:21px;font-weight:800;letter-spacing:-0.5px;line-height:1.12;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>

      <!-- Big stat callout -->
      ${stat.number ? `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:16px;">
        <span style="font-size:48px;font-weight:800;letter-spacing:-2px;color:${stat.color || RED};line-height:1;text-shadow:0 0 20px ${(stat.color || RED)}33;">${stat.number}</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.35;max-width:160px;">${stat.label}</span>
      </div>` : ''}

      <!-- Quote box -->
      ${quote.text ? `<div style="padding:14px 16px;background:rgba(255,255,255,0.025);border-radius:12px;border-left:3px solid ${B};margin-bottom:16px;">
        <p style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.45;font-style:italic;margin:0 0 6px;">"${quote.text}"</p>
        <span style="font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">\u2014 ${quote.attribution}</span>
      </div>` : ''}

      <!-- Market impact grid -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">${stats}</div>

      <!-- Source -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">Source: ${data.source || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template D — Ticker Dashboard
// Logo header, giant price move, ticker rows, key points
// ============================================
function renderTemplateD(data: NewsData): string {
  const stat = data.big_stat || { number: '', label: '' }

  const tickers = (data.market_impact || []).map(item => {
    const color = item.direction === 'up' ? B : RED
    const arr = item.direction === 'up' ? '▲' : '▼'
    const bg = item.direction === 'up' ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)'
    const border = item.direction === 'up' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'
    return `<div style="display:flex;align-items:center;padding:10px 14px;background:${bg};border-radius:10px;border:1px solid ${border};">
      <span style="font-size:15px;margin-right:10px;">${item.icon}</span>
      <div style="flex:1;">
        <span style="font-size:12px;font-weight:600;color:#fff;display:block;">${item.name}</span>
        ${item.price ? `<span style="font-size:10px;color:rgba(255,255,255,0.3);font-weight:400;">${item.price}</span>` : ''}
      </div>
      <span style="font-size:16px;font-weight:800;color:${color};letter-spacing:-0.5px;">${arr} ${item.change}</span>
    </div>`
  }).join('')

  const points = (data.key_points || []).slice(0, 3).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;">
      <div style="width:4px;height:4px;border-radius:50%;background:${B};margin-top:5px;flex-shrink:0;box-shadow:0 0 3px rgba(74,222,128,0.4);"></div>
      <span style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.4;">${p}</span>
    </div>`
  ).join('')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    ${NOISE}
    ${cornerGlow(RED, 'top-right')}

    <div style="position:relative;z-index:2;padding:22px 28px 20px;">
      <!-- Header with logo -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
        ${LOGO}
        <span style="font-size:9px;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        <span style="margin-left:auto;font-size:9px;font-weight:600;padding:4px 10px;background:rgba(239,68,68,0.08);border-radius:6px;color:${RED};border:1px solid rgba(239,68,68,0.12);">${data.category || 'MARKETS'}</span>
      </div>

      <!-- Giant price move -->
      ${stat.number ? `<div style="margin-bottom:6px;">
        <div style="display:flex;align-items:baseline;gap:4px;">
          <span style="font-size:64px;font-weight:800;letter-spacing:-3px;color:${stat.color || RED};line-height:1;text-shadow:0 0 30px ${(stat.color || RED)}22;">${stat.number}</span>
        </div>
        <span style="font-size:13px;color:rgba(255,255,255,0.4);font-weight:400;">${stat.label}</span>
      </div>` : ''}

      <!-- Headline -->
      <h1 style="font-size:18px;font-weight:700;letter-spacing:-0.3px;line-height:1.15;color:#fff;margin:12px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">${data.headline || ''}</h1>

      <!-- Key context -->
      ${points ? `<div style="margin-bottom:14px;">${points}</div>` : ''}

      <!-- Ticker rows -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">${tickers}</div>

      <!-- Footer -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">${data.source || ''} \u00b7 ${data.date || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template E — Timeline
// Logo header, vertical timeline with colored dots + glow, 3-stat bottom
// ============================================
function renderTemplateE(data: NewsData): string {
  const events = (data.timeline_events || []).map((evt, i) => {
    const isLast = i === (data.timeline_events?.length || 0) - 1
    const evtColor = evt.color || B
    const glow = evtColor === B ? 'rgba(74,222,128,0.35)' : evtColor === AMBER ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)'
    const line = isLast ? '' : `<div style="position:absolute;left:5px;top:14px;bottom:-8px;width:1px;background:rgba(255,255,255,0.06);"></div>`
    return `<div style="position:relative;display:flex;gap:14px;padding-bottom:${isLast ? '0' : '14px'};">
      ${line}
      <div style="width:11px;height:11px;border-radius:50%;background:${evtColor};flex-shrink:0;margin-top:3px;box-shadow:0 0 8px ${glow};"></div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span style="font-size:10px;font-weight:700;color:${evtColor};">${evt.time}</span>
          <span style="font-size:11px;font-weight:700;color:#fff;">${evt.title}</span>
        </div>
        <p style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.35;margin:0;">${evt.description}</p>
      </div>
    </div>`
  }).join('')

  // Bottom stats row
  const bottomStats = (data.market_impact || []).slice(0, 3).map(item => {
    const color = item.direction === 'up' ? B : item.direction === 'down' ? RED : AMBER
    return `<div style="flex:1;text-align:center;">
      <span style="font-size:20px;font-weight:800;color:${color};display:block;letter-spacing:-0.5px;text-shadow:0 0 12px ${color}22;">${item.change}</span>
      <span style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;letter-spacing:1px;">${item.name.toUpperCase()}</span>
    </div>`
  }).join('<div style="width:1px;background:rgba(255,255,255,0.06);"></div>')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    ${NOISE}
    ${cornerGlow(AMBER, 'top-right')}

    <!-- Color accent top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${RED},${AMBER},${B});z-index:2;"></div>

    <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:22px 28px 20px;">
      <!-- Header with logo -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        ${LOGO}
        <span style="font-size:9px;font-weight:700;letter-spacing:2.5px;color:${B};">HOW IT UNFOLDED</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);font-weight:500;">${data.date || ''}</span>
      </div>

      <!-- Headline -->
      <h1 style="font-size:20px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>

      <!-- Timeline -->
      <div style="flex:1;overflow:hidden;">${events}</div>

      <!-- Bottom stat row -->
      ${bottomStats ? `<div style="display:flex;gap:12px;padding:12px 0 0;border-top:1px solid rgba(255,255,255,0.06);margin-top:12px;">
        ${bottomStats}
      </div>` : ''}
    </div>
  </div>`
}

// ============================================
// Template F — Split Stat + Context
// Logo + category badge header, giant price + change badge, headline, quote, context
// ============================================
function renderTemplateF(data: NewsData): string {
  const stat = data.big_stat || { number: '', label: '' }
  const quote = data.quote || { text: '', attribution: '' }
  const context = (data.context_points || []).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;">
      <div style="width:4px;height:4px;border-radius:50%;background:${B};margin-top:5px;flex-shrink:0;box-shadow:0 0 3px rgba(74,222,128,0.4);"></div>
      <span style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.4;">${p}</span>
    </div>`
  ).join('')

  // Parse stat for split layout (e.g., "$92.50" -> "$92" + ".50")
  const statNum = stat.number || ''
  const dotIdx = statNum.indexOf('.')
  const mainNum = dotIdx > -1 ? statNum.substring(0, dotIdx) : statNum
  const decimal = dotIdx > -1 ? statNum.substring(dotIdx) : ''

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    ${NOISE}
    ${cornerGlow(B, 'top-right')}

    <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;">
      <!-- Top: Giant stat zone -->
      <div style="padding:28px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <!-- Header with logo + category badge -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          ${LOGO}
          <span style="font-size:9px;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
          <span style="margin-left:auto;font-size:9px;font-weight:600;padding:4px 10px;background:rgba(74,222,128,0.08);border-radius:6px;color:${B};border:1px solid rgba(74,222,128,0.12);">${data.category || 'MARKETS'}</span>
        </div>

        <!-- Stat label -->
        <span style="font-size:11px;color:rgba(255,255,255,0.3);display:block;margin-bottom:4px;font-weight:500;letter-spacing:0.5px;">${stat.label || ''}</span>

        <!-- Giant price + change badge -->
        <div style="display:flex;align-items:flex-end;gap:16px;">
          <div>
            <div style="display:flex;align-items:baseline;gap:0;">
              <span style="font-size:52px;font-weight:800;letter-spacing:-2px;color:#fff;line-height:1;">${mainNum}${decimal ? `<span style="font-size:28px;">${decimal}</span>` : ''}</span>
            </div>
          </div>
          ${stat.number ? `<div style="padding:6px 14px;background:rgba(74,222,128,0.08);border-radius:10px;margin-bottom:8px;border:1px solid rgba(74,222,128,0.12);">
            <span style="font-size:20px;font-weight:800;color:${B};">\u25BC 18%</span>
          </div>` : ''}
        </div>
      </div>

      <!-- Bottom: Context -->
      <div style="flex:1;padding:18px 28px 20px;display:flex;flex-direction:column;">
        <h1 style="font-size:19px;font-weight:700;letter-spacing:-0.3px;line-height:1.15;color:#fff;margin:0 0 14px;">${data.headline || ''}</h1>

        <!-- Quote -->
        ${quote.text ? `<div style="padding:12px 14px;background:rgba(255,255,255,0.025);border-radius:10px;border-left:3px solid ${B};margin-bottom:14px;">
          <p style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.35;font-style:italic;margin:0;">"${quote.text}"</p>
          <span style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px;display:block;font-weight:500;">\u2014 ${quote.attribution}</span>
        </div>` : ''}

        <!-- Context bullets -->
        ${context}

        <!-- Footer -->
        <div style="display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">${data.source || ''} \u00b7 ${data.date || ''}</span>
          <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);font-weight:500;">wealthclaude.com</span>
        </div>
      </div>
    </div>
  </div>`
}
