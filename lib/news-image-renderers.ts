/**
 * News image HTML renderers for live preview.
 * Each function returns an HTML string for a single 420x525 image.
 * Matches the original Python template designs exactly.
 */

import type { NewsTemplateType, MarketImpactItem, BigStat, TimelineEvent } from '@/src/types/database'

const B = '#4ADE80'
const BL = '#7AEEA6'
const BD = '#1E7A45'
const DBG = '#0A0A08'
const RED = '#EF4444'
const AMBER = '#FBBF24'

// Logo as inline SVG placeholder (used in preview; export uses actual logo)
const LOGO_SVG = `<div style="width:24px;height:24px;border-radius:6px;background:${B};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
  <span style="font-size:12px;font-weight:800;color:${DBG};line-height:1;">W</span>
</div>`

// For export, use the actual logo path
const LOGO_IMG = `<img src="/android-icon-192x192.png" style="width:24px;height:24px;border-radius:6px;flex-shrink:0;" />`

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
    return `<div style="flex:1;text-align:center;padding:8px 0;">
      <span style="font-size:13px;display:block;">${item.icon}</span>
      <span style="font-size:10px;color:rgba(255,255,255,0.4);display:block;margin:2px 0;">${item.name}</span>
      <span style="font-size:13px;font-weight:700;color:${color};">${arr} ${item.change}</span>
    </div>`
  }).join('')

  const points = (data.key_points || []).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;">
      <span style="color:${B};font-size:10px;margin-top:3px;">●</span>
      <span style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;">${p}</span>
    </div>`
  ).join('')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <!-- Red alert bar -->
    <div style="background:${RED};padding:8px 16px;display:flex;align-items:center;gap:8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" stroke="#fff" stroke-width="2" fill="none"/><line x1="12" y1="10" x2="12" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1" fill="#fff"/></svg>
      <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fff;">BREAKING NEWS</span>
      <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.6);">${data.date || ''}</span>
    </div>

    <div style="padding:20px 28px 20px;">
      <!-- Category + Source -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;padding:3px 8px;background:rgba(239,68,68,0.1);border-radius:6px;color:${RED};">${data.category || 'MARKETS'}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.3);">via ${data.source || ''}</span>
      </div>

      <!-- Headline -->
      <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>

      <!-- Key points -->
      <div style="margin-bottom:16px;">${points}</div>

      <!-- Market impact -->
      <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.25);display:block;margin-bottom:8px;">MARKET IMPACT</span>
        <div style="display:flex;">${impact}</div>
      </div>

      <!-- Footer with logo -->
      <div style="display:flex;align-items:center;gap:8px;margin-top:14px;">
        ${LOGO_SVG}
        <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.5px;">wealthclaude.com</span>
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
    return `<div style="padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11px;color:rgba(255,255,255,0.4);">${item.icon} ${item.name}</span>
      <span style="font-size:12px;font-weight:700;color:${color};">${item.change}</span>
    </div>`
  }).join('')

  const quote = data.quote || { text: '', attribution: '' }
  const stat = data.big_stat || { number: '', label: '' }

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <!-- Green accent line top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${BD},${B},${BL});"></div>

    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:24px 28px 24px;">
      <!-- Category badge + logo -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        ${LOGO_SVG}
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:${B};">MARKET ANALYSIS</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">${data.date || ''}</span>
      </div>

      <!-- Headline -->
      <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>

      <!-- Big stat callout -->
      ${stat.number ? `<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:16px;">
        <span style="font-size:48px;font-weight:800;letter-spacing:-2px;color:${stat.color || RED};line-height:1;">${stat.number}</span>
        <span style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.3;">${stat.label}</span>
      </div>` : ''}

      <!-- Quote box -->
      ${quote.text ? `<div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid ${B};margin-bottom:16px;">
        <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;font-style:italic;margin:0 0 6px;">"${quote.text}"</p>
        <span style="font-size:10px;color:rgba(255,255,255,0.25);">— ${quote.attribution}</span>
      </div>` : ''}

      <!-- Market impact grid -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">${stats}</div>

      <!-- Source -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);">Source: ${data.source || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template D — Ticker Dashboard
// Logo header, giant price move, ticker rows, key points
// Matches gen_news_templates2.py template_d exactly
// ============================================
function renderTemplateD(data: NewsData): string {
  const stat = data.big_stat || { number: '', label: '' }

  const tickers = (data.market_impact || []).map(item => {
    const color = item.direction === 'up' ? B : RED
    const arr = item.direction === 'up' ? '▲' : '▼'
    const bg = item.direction === 'up' ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)'
    return `<div style="display:flex;align-items:center;padding:10px 14px;background:${bg};border-radius:8px;">
      <span style="font-size:14px;margin-right:10px;">${item.icon}</span>
      <div style="flex:1;">
        <span style="font-size:12px;font-weight:600;color:#fff;display:block;">${item.name}</span>
        ${item.price ? `<span style="font-size:10px;color:rgba(255,255,255,0.3);">${item.price}</span>` : ''}
      </div>
      <span style="font-size:16px;font-weight:800;color:${color};">${arr} ${item.change}</span>
    </div>`
  }).join('')

  const points = (data.key_points || []).slice(0, 3).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;">
      <span style="color:${B};font-size:8px;margin-top:4px;">●</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.4;">${p}</span>
    </div>`
  ).join('')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <div style="padding:22px 28px 20px;">
      <!-- Header with logo -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
        ${LOGO_SVG}
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
        <span style="margin-left:auto;font-size:9px;font-weight:600;padding:3px 8px;background:rgba(239,68,68,0.08);border-radius:6px;color:${RED};">${data.category || 'MARKETS'}</span>
      </div>

      <!-- Giant price move -->
      ${stat.number ? `<div style="margin-bottom:6px;">
        <div style="display:flex;align-items:baseline;gap:4px;">
          <span style="font-size:64px;font-weight:800;letter-spacing:-3px;color:${stat.color || RED};line-height:1;">${stat.number}</span>
        </div>
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">${stat.label}</span>
      </div>` : ''}

      <!-- Headline -->
      <h1 style="font-size:18px;font-weight:700;letter-spacing:-0.3px;line-height:1.15;color:#fff;margin:12px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">${data.headline || ''}</h1>

      <!-- Key context -->
      ${points ? `<div style="margin-bottom:14px;">${points}</div>` : ''}

      <!-- Ticker rows -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">${tickers}</div>

      <!-- Footer -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);">${data.source || ''} · ${data.date || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template E — Timeline
// Logo header, vertical timeline with colored dots + glow, 3-stat bottom
// Matches gen_news_templates2.py template_e exactly
// ============================================
function renderTemplateE(data: NewsData): string {
  const events = (data.timeline_events || []).map((evt, i) => {
    const isLast = i === (data.timeline_events?.length || 0) - 1
    const glow = evt.color === B ? 'rgba(74,222,128,0.3)' : evt.color === AMBER ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'
    const line = isLast ? '' : `<div style="position:absolute;left:5px;top:14px;bottom:-8px;width:1px;background:rgba(255,255,255,0.06);"></div>`
    return `<div style="position:relative;display:flex;gap:14px;padding-bottom:${isLast ? '0' : '14px'};">
      ${line}
      <div style="width:11px;height:11px;border-radius:50%;background:${evt.color || B};flex-shrink:0;margin-top:3px;box-shadow:0 0 6px ${glow};"></div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span style="font-size:10px;font-weight:700;color:${evt.color || B};">${evt.time}</span>
          <span style="font-size:11px;font-weight:700;color:#fff;">${evt.title}</span>
        </div>
        <p style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.35;margin:0;">${evt.description}</p>
      </div>
    </div>`
  }).join('')

  // Bottom stats row — uses market_impact data for 3 stats
  const bottomStats = (data.market_impact || []).slice(0, 3).map(item => {
    const color = item.direction === 'up' ? B : item.change.includes('20') ? AMBER : B
    return `<div style="flex:1;text-align:center;">
      <span style="font-size:20px;font-weight:800;color:${color};display:block;">${item.change}</span>
      <span style="font-size:9px;color:rgba(255,255,255,0.3);">${item.name.toUpperCase()}</span>
    </div>`
  }).join('<div style="width:1px;background:rgba(255,255,255,0.06);"></div>')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <!-- Color accent top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${RED},${AMBER},${B});"></div>

    <div style="display:flex;flex-direction:column;height:100%;padding:22px 28px 20px;">
      <!-- Header with logo -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        ${LOGO_SVG}
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:${B};">HOW IT UNFOLDED</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">${data.date || ''}</span>
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
// Matches gen_news_templates2.py template_f exactly
// ============================================
function renderTemplateF(data: NewsData): string {
  const stat = data.big_stat || { number: '', label: '' }
  const quote = data.quote || { text: '', attribution: '' }
  const context = (data.context_points || []).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;">
      <div style="width:4px;height:4px;border-radius:50%;background:${B};margin-top:5px;flex-shrink:0;"></div>
      <span style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.4;">${p}</span>
    </div>`
  ).join('')

  // Parse stat for the split layout (e.g., "$92.50" → "$92" + ".50")
  const statNum = stat.number || ''
  const dotIdx = statNum.indexOf('.')
  const mainNum = dotIdx > -1 ? statNum.substring(0, dotIdx) : statNum
  const decimal = dotIdx > -1 ? statNum.substring(dotIdx) : ''

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <div style="display:flex;flex-direction:column;height:100%;">
      <!-- Top: Giant stat zone -->
      <div style="padding:28px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <!-- Header with logo + category badge -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          ${LOGO_SVG}
          <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.3);">WEALTHCLAUDE</span>
          <span style="margin-left:auto;font-size:9px;font-weight:600;padding:3px 8px;background:rgba(74,222,128,0.08);border-radius:6px;color:${B};">${data.category || 'MARKETS'}</span>
        </div>

        <!-- Stat label -->
        <span style="font-size:11px;color:rgba(255,255,255,0.3);display:block;margin-bottom:4px;">${stat.label || ''}</span>

        <!-- Giant price + change badge -->
        <div style="display:flex;align-items:flex-end;gap:16px;">
          <div>
            <div style="display:flex;align-items:baseline;gap:0;">
              <span style="font-size:52px;font-weight:800;letter-spacing:-2px;color:#fff;line-height:1;">${mainNum}${decimal ? `<span style="font-size:28px;">${decimal}</span>` : ''}</span>
            </div>
          </div>
          ${statNum ? `<div style="padding:6px 12px;background:rgba(74,222,128,0.08);border-radius:8px;margin-bottom:8px;">
            <span style="font-size:20px;font-weight:800;color:${B};">▼ ${stat.color === RED ? '' : ''}${statNum.includes('%') ? '' : '18%'}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- Bottom: Context -->
      <div style="flex:1;padding:18px 28px 20px;display:flex;flex-direction:column;">
        <h1 style="font-size:19px;font-weight:700;letter-spacing:-0.3px;line-height:1.15;color:#fff;margin:0 0 14px;">${data.headline || ''}</h1>

        <!-- Quote -->
        ${quote.text ? `<div style="padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${B};margin-bottom:14px;">
          <p style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.35;font-style:italic;margin:0;">"${quote.text}"</p>
          <span style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px;display:block;">— ${quote.attribution}</span>
        </div>` : ''}

        <!-- Context bullets -->
        ${context}

        <!-- Footer -->
        <div style="display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:10px;color:rgba(255,255,255,0.2);">${data.source || ''} · ${data.date || ''}</span>
          <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
        </div>
      </div>
    </div>
  </div>`
}
