/**
 * News image HTML renderers for live preview.
 * Each function returns an HTML string for a single 420x525 image.
 */

import type { NewsTemplateType, MarketImpactItem, BigStat, TimelineEvent } from '@/src/types/database'

const B = '#4ADE80'
const BD = '#1E7A45'
const DBG = '#0A0A08'
const RED = '#EF4444'
const AMBER = '#FBBF24'

interface NewsData {
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
    <div style="background:${RED};padding:8px 16px;display:flex;align-items:center;gap:8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" stroke="#fff" stroke-width="2" fill="none"/><line x1="12" y1="10" x2="12" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1" fill="#fff"/></svg>
      <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#fff;">BREAKING NEWS</span>
      <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.6);">${data.date || ''}</span>
    </div>
    <div style="padding:20px 28px 20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;padding:3px 8px;background:rgba(239,68,68,0.1);border-radius:6px;color:${RED};">${data.category || 'MARKETS'}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.3);">via ${data.source || ''}</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>
      <div style="margin-bottom:16px;">${points}</div>
      <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.25);display:block;margin-bottom:8px;">MARKET IMPACT</span>
        <div style="display:flex;">${impact}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:14px;">
        <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.5px;">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template C — Editorial + Data
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
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${BD},${B},#7AEEA6);"></div>
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:24px 28px 24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:${B};">MARKET ANALYSIS</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">${data.date || ''}</span>
      </div>
      <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>
      ${stat.number ? `<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:16px;">
        <span style="font-size:48px;font-weight:800;letter-spacing:-2px;color:${stat.color || RED};line-height:1;">${stat.number}</span>
        <span style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.3;">${stat.label}</span>
      </div>` : ''}
      ${quote.text ? `<div style="padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid ${B};margin-bottom:16px;">
        <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;font-style:italic;margin:0 0 6px;">"${quote.text}"</p>
        <span style="font-size:10px;color:rgba(255,255,255,0.25);">— ${quote.attribution}</span>
      </div>` : ''}
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">${stats}</div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);">Source: ${data.source || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template D — Ticker Dashboard
// ============================================
function renderTemplateD(data: NewsData): string {
  const stat = data.big_stat || { number: '', label: '' }
  const tickers = (data.market_impact || []).map(item => {
    const color = item.direction === 'up' ? B : RED
    const arr = item.direction === 'up' ? '▲' : '▼'
    return `<div style="display:flex;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:16px;margin-right:10px;">${item.icon}</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:#fff;">${item.name}</div>
        ${item.price ? `<div style="font-size:11px;color:rgba(255,255,255,0.35);">${item.price}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <span style="font-size:14px;font-weight:700;color:${color};">${arr} ${item.change}</span>
      </div>
    </div>`
  }).join('')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${RED},${AMBER},${B});"></div>
    <div style="display:flex;flex-direction:column;height:100%;padding:24px 28px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:${B};">MARKET UPDATE</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">${data.date || ''}</span>
      </div>
      <span style="font-size:9px;font-weight:700;letter-spacing:2px;padding:3px 8px;background:rgba(239,68,68,0.1);border-radius:6px;color:${RED};align-self:flex-start;margin-bottom:12px;">${data.category || 'MARKETS'}</span>
      <h1 style="font-size:20px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>
      ${stat.number ? `<div style="text-align:center;padding:16px;background:rgba(255,255,255,0.02);border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:16px;">
        <div style="font-size:52px;font-weight:800;letter-spacing:-2px;color:${stat.color || RED};line-height:1;">${stat.number}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">${stat.label}</div>
      </div>` : ''}
      <div style="display:flex;flex-direction:column;gap:6px;flex:1;">${tickers}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:12px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);">Source: ${data.source || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template E — Timeline
// ============================================
function renderTemplateE(data: NewsData): string {
  const events = (data.timeline_events || []).map((evt, i) => {
    return `<div style="display:flex;gap:14px;padding:10px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;width:16px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${evt.color || B};flex-shrink:0;"></div>
        ${i < (data.timeline_events?.length || 0) - 1 ? `<div style="width:2px;flex:1;background:rgba(255,255,255,0.08);margin-top:4px;"></div>` : ''}
      </div>
      <div style="flex:1;padding-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:10px;font-weight:600;color:${evt.color || B};">${evt.time}</span>
        </div>
        <h3 style="font-size:14px;font-weight:700;color:#fff;margin:0 0 4px;">${evt.title}</h3>
        <p style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.4;margin:0;">${evt.description}</p>
      </div>
    </div>`
  }).join('')

  const stat = data.big_stat || { number: '', label: '' }

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${RED},${AMBER},${B});"></div>
    <div style="display:flex;flex-direction:column;height:100%;padding:24px 28px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:${B};">TIMELINE</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.25);">${data.date || ''}</span>
      </div>
      <h1 style="font-size:20px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 16px;">${data.headline || ''}</h1>
      <div style="flex:1;overflow:hidden;">${events}</div>
      ${stat.number ? `<div style="display:flex;gap:8px;margin-top:12px;">
        <div style="flex:1;text-align:center;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:20px;font-weight:700;color:${B};">${stat.number}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px;">${stat.label}</div>
        </div>
      </div>` : ''}
      <div style="display:flex;align-items:center;gap:6px;margin-top:12px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.2);">Source: ${data.source || ''}</span>
        <span style="margin-left:auto;font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
      </div>
    </div>
  </div>`
}

// ============================================
// Template F — Split Stat + Context
// ============================================
function renderTemplateF(data: NewsData): string {
  const stat = data.big_stat || { number: '', label: '' }
  const quote = data.quote || { text: '', attribution: '' }
  const context = (data.context_points || []).map(p =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;">
      <span style="color:${B};font-size:10px;margin-top:3px;">●</span>
      <span style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.4;">${p}</span>
    </div>`
  ).join('')

  return `<div style="width:420px;height:525px;background:${DBG};position:relative;overflow:hidden;font-family:'Inter',sans-serif;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${BD},${B});"></div>
    <div style="display:flex;flex-direction:column;height:100%;">
      <!-- Top zone: stat -->
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:${B};margin-bottom:8px;">${data.category || 'MARKETS'}</span>
        ${stat.number ? `<div style="font-size:64px;font-weight:800;letter-spacing:-3px;color:${stat.color || B};line-height:1;">${stat.number}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">${stat.label}</div>` : ''}
        <h1 style="font-size:18px;font-weight:700;text-align:center;color:#fff;margin:12px 0 0;line-height:1.2;">${data.headline || ''}</h1>
        <span style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:6px;">${data.source || ''} · ${data.date || ''}</span>
      </div>
      <!-- Bottom zone: quote + context -->
      <div style="padding:16px 28px 20px;">
        ${quote.text ? `<div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid ${B};margin-bottom:12px;">
          <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;font-style:italic;margin:0 0 4px;">"${quote.text}"</p>
          <span style="font-size:10px;color:rgba(255,255,255,0.25);">— ${quote.attribution}</span>
        </div>` : ''}
        ${context}
        <div style="display:flex;align-items:center;gap:6px;margin-top:10px;">
          <span style="font-size:10px;color:rgba(255,255,255,0.2);">wealthclaude.com</span>
        </div>
      </div>
    </div>
  </div>`
}
