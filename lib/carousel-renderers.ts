/**
 * Carousel HTML renderers for live preview.
 * Each function returns an HTML string for a single slide at 420x525.
 */

import type { CarouselTemplateType } from '@/src/types/database'

const B = '#4ADE80'
const BL = '#7AEEA6'
const BD = '#1E7A45'
const DBG = '#0A0A08'
const LBG = '#F7F5F2'
const RED = '#EF4444'

function progressBar(i: number, total: number, isLight: boolean): string {
  const pct = ((i + 1) / total) * 100
  const tc = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'
  const fc = isLight ? B : '#fff'
  const lc = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'
  return `<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:${tc};border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:${pct.toFixed(1)}%;background:${fc};border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:${lc};font-weight:500;font-family:sans-serif;">${i + 1}/${total}</span>
  </div>`
}

function arrow(isLight: boolean): string {
  const st = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
  const bg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'
  return `<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,${bg});">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="${st}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>`
}

export function renderCarouselSlide(
  template: CarouselTemplateType,
  slide: any,
  index: number,
  total: number,
): string {
  if (!slide) return '<div style="width:420px;height:525px;background:#111;display:flex;align-items:center;justify-content:center;color:#666;font-family:sans-serif;">No slide data</div>'

  switch (template) {
    case 'v3': return renderV3(slide, index, total)
    case 'v5': return renderV5(slide, index, total)
    case 'v6': return renderV6(slide, index, total)
    case 'v7': return renderV7(slide, index, total)
    case 'v8': return renderV8(slide, index, total)
    case 'v9': return renderV9(slide, index, total)
    case 'v10': return renderV10(slide, index, total)
    default: return '<div style="width:420px;height:525px;background:#111;color:#fff;font-family:sans-serif;padding:20px;">Unknown template</div>'
  }
}

// ============================================
// V3 — Bold Editorial
// ============================================
function renderV3(slide: any, index: number, total: number): string {
  const isLight = index % 2 === 0
  const bg = isLight ? LBG : DBG
  const hColor = isLight ? DBG : '#fff'
  const bColor = isLight ? '#6B6560' : 'rgba(255,255,255,0.5)'
  const tagColor = isLight ? BD : BL
  const numColor = isLight ? '0.15' : '0.2'
  const num = String(index + 1).padStart(2, '0')
  const heading = (slide.heading || '').replace(/\n/g, '<br>')
  const fixColor = isLight ? BD : BL
  const accentBar = isLight ? `<div style="position:absolute;left:0;top:0;width:6px;height:100%;background:${B};"></div>` : ''

  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${bg};font-family:'Work Sans',sans-serif;">
    ${progressBar(index, total, isLight)}${arrow(isLight)}
    ${accentBar}
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:${isLight ? '0 40px 52px 46px' : '0 36px 52px'};">
      <span style="font-family:'Libre Baskerville',Georgia,serif;font-size:80px;font-weight:700;line-height:1;letter-spacing:-3px;color:${B};opacity:${numColor};">${num}</span>
      <div style="width:100%;height:1px;background:${isLight ? '#E8E4DF' : 'rgba(255,255,255,0.08)'};margin:12px 0 16px;"></div>
      <span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:${tagColor};margin-bottom:12px;">${slide.tag || ''}</span>
      <h2 style="font-family:'Libre Baskerville',Georgia,serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.08;color:${hColor};margin:0 0 12px;">${heading}</h2>
      <p style="font-size:13px;color:${bColor};line-height:1.55;margin:0 0 14px;">${slide.body || ''}</p>
      ${slide.fix ? `<p style="font-size:12px;font-weight:600;color:${fixColor};margin:0;">✓ ${slide.fix}</p>` : ''}
    </div>
  </div>`
}

// ============================================
// V5 — Bold Type
// ============================================
function renderV5(slide: any, index: number, total: number): string {
  const isLight = index % 2 !== 0
  const bg = isLight ? LBG : DBG
  const hColor = isLight ? DBG : '#fff'
  const bColor = isLight ? '#6B6560' : 'rgba(255,255,255,0.5)'
  const tagColor = isLight ? BD : BL
  const ghostNum = String(index + 1).padStart(2, '0')
  const heading = (slide.heading || '').replace(/\n/g, '<br>')

  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${bg};font-family:'Bricolage Grotesque','Inter',sans-serif;">
    ${progressBar(index, total, isLight)}${arrow(isLight)}
    <div style="position:absolute;right:-20px;top:50%;transform:translateY(-50%);font-size:220px;font-weight:800;color:${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'};line-height:1;pointer-events:none;">${ghostNum}</div>
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 36px 52px;position:relative;z-index:1;">
      <span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:${tagColor};margin-bottom:16px;">${slide.tag || ''}</span>
      <h2 style="font-size:38px;font-weight:800;text-transform:uppercase;letter-spacing:-0.5px;line-height:1.05;color:${hColor};margin:0 0 16px;">${heading}</h2>
      <p style="font-size:14px;color:${bColor};line-height:1.5;margin:0;">${slide.body || ''}</p>
    </div>
  </div>`
}

// ============================================
// V6 — Data Viz
// ============================================
function renderV6(slide: any, index: number, total: number): string {
  const stats = slide.stats || []
  const chartData = slide.chart_data || []
  const heading = (slide.heading || '').replace(/\n/g, '<br>')

  let statsHtml = ''
  for (const s of stats) {
    statsHtml += `<div style="text-align:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);flex:1;">
      <div style="font-size:22px;font-weight:700;color:${B};line-height:1;">${s.value}${s.suffix || ''}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">${s.label}</div>
    </div>`
  }

  // Simple bar chart
  let chartHtml = ''
  if (chartData.length > 0) {
    const maxVal = Math.max(...chartData.map((d: any) => d.value))
    for (const d of chartData) {
      const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0
      chartHtml += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,0.4);width:50px;text-align:right;">${d.label}</span>
        <div style="flex:1;height:16px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${d.color || B};border-radius:4px;"></div>
        </div>
        <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.6);width:30px;">${d.value}%</span>
      </div>`
    }
  }

  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${DBG};font-family:'Outfit','Inter',sans-serif;">
    ${progressBar(index, total, false)}${arrow(false)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 28px 52px;">
      <span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:${B};margin-bottom:14px;">${slide.tag || ''}</span>
      <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:#fff;margin:0 0 14px;">${heading}</h2>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5;margin:0 0 18px;">${slide.body || ''}</p>
      ${stats.length > 0 ? `<div style="display:flex;gap:8px;margin-bottom:14px;">${statsHtml}</div>` : ''}
      ${chartHtml ? `<div style="margin-top:4px;">${chartHtml}</div>` : ''}
    </div>
  </div>`
}

// ============================================
// V7 — Before/After
// ============================================
function renderV7(slide: any, index: number, total: number): string {
  const before = slide.before || { title: 'Before', items: [] }
  const after = slide.after || { title: 'After', items: [] }
  const heading = (slide.heading || '').replace(/\n/g, '<br>')

  const renderItems = (items: string[], color: string) =>
    items.map(item => `<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;">
      <span style="color:${color};font-size:10px;margin-top:3px;">●</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;">${item}</span>
    </div>`).join('')

  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${DBG};font-family:'DM Sans','Inter',sans-serif;">
    ${progressBar(index, total, false)}${arrow(false)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 28px 52px;">
      <span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:${B};margin-bottom:12px;">${slide.tag || ''}</span>
      <h2 style="font-size:22px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:#fff;margin:0 0 16px;">${heading}</h2>

      <!-- Before card -->
      <div style="padding:12px 14px;border-radius:10px;border:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.05);margin-bottom:10px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:${RED};display:block;margin-bottom:8px;">${before.title?.toUpperCase() || 'BEFORE'}</span>
        ${renderItems(before.items || [], RED)}
      </div>

      <!-- Arrow -->
      <div style="text-align:center;margin:4px 0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="display:inline-block;"><path d="M12 5v14M19 12l-7 7-7-7" stroke="${B}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>

      <!-- After card -->
      <div style="padding:12px 14px;border-radius:10px;border:1px solid rgba(74,222,128,0.2);background:rgba(74,222,128,0.05);">
        <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:${B};display:block;margin-bottom:8px;">${after.title?.toUpperCase() || 'AFTER'}</span>
        ${renderItems(after.items || [], B)}
      </div>
    </div>
  </div>`
}

// ============================================
// V8 — Myth Busting
// ============================================
function renderV8(slide: any, index: number, total: number): string {
  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${DBG};font-family:'Inter',sans-serif;">
    ${progressBar(index, total, false)}${arrow(false)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 28px 52px;">
      <span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-bottom:16px;">${slide.tag || ''}</span>

      <!-- Myth -->
      <div style="padding:14px;border-radius:10px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="${RED}" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="${RED}" stroke-width="2" stroke-linecap="round"/></svg>
          <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${RED};">MYTH</span>
        </div>
        <p style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.8);line-height:1.4;margin:0;">"${slide.myth || ''}"</p>
      </div>

      <!-- Fact -->
      <div style="padding:14px;border-radius:10px;background:rgba(74,222,128,0.05);border:1px solid rgba(74,222,128,0.15);margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="${B}" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="${B}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${B};">FACT</span>
        </div>
        <p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.45;margin:0;">${slide.fact || ''}</p>
      </div>

      <!-- Evidence -->
      <p style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.4;margin:0 0 10px;font-style:italic;">${slide.evidence || ''}</p>

      <!-- Verdict -->
      <div style="padding:8px 14px;background:rgba(74,222,128,0.08);border-radius:8px;">
        <span style="font-size:11px;font-weight:600;color:${B};">✓ ${slide.verdict || ''}</span>
      </div>
    </div>
  </div>`
}

// ============================================
// V9 — Story Journey
// ============================================
function renderV9(slide: any, index: number, total: number): string {
  const heading = (slide.heading || '').replace(/\n/g, '<br>')
  const chapter = slide.chapter || index + 1

  let cardHtml = ''
  if (slide.card_data && slide.card_data.length > 0) {
    const cards = slide.card_data.map((c: any) => `<div style="text-align:center;flex:1;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:16px;font-weight:700;color:${B};">${c.value}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px;">${c.label}</div>
    </div>`).join('')
    cardHtml = `<div style="display:flex;gap:8px;margin-top:14px;">${cards}</div>`
  }

  // Timeline dots on left
  const dots = Array.from({ length: total }, (_, i) =>
    `<div style="width:8px;height:8px;border-radius:50%;background:${i === index ? B : 'rgba(255,255,255,0.1)'};${i < index ? `background:${BD};` : ''}"></div>`
  ).join('<div style="width:1px;height:16px;background:rgba(255,255,255,0.08);margin:2px auto;"></div>')

  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${DBG};font-family:'Nunito Sans','Inter',sans-serif;">
    ${progressBar(index, total, false)}${arrow(false)}
    <div style="display:flex;height:100%;padding:24px 0 52px;">
      <!-- Timeline -->
      <div style="width:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 0 0 16px;">
        ${dots}
      </div>
      <!-- Content -->
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 28px 0 16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:${B};">${slide.tag || `CHAPTER ${chapter}`}</span>
          ${slide.date ? `<span style="font-size:10px;color:rgba(255,255,255,0.25);">${slide.date}</span>` : ''}
        </div>
        <h2 style="font-family:'Lora',Georgia,serif;font-size:24px;font-weight:700;letter-spacing:-0.3px;line-height:1.1;color:#fff;margin:0 0 14px;">${heading}</h2>
        <p style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;margin:0;">${slide.body || ''}</p>
        ${cardHtml}
      </div>
    </div>
  </div>`
}

// ============================================
// V10 — This vs That
// ============================================
function renderV10(slide: any, index: number, total: number): string {
  const leftItems = slide.left_items || []
  const rightItems = slide.right_items || []

  const renderCheckItems = (items: string[], isLeft: boolean) =>
    items.filter((i: string) => i.trim()).map((item: string) => {
      const icon = isLeft
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="${B}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/></svg>`
      return `<div style="display:flex;align-items:flex-start;gap:6px;padding:3px 0;">
        <span style="flex-shrink:0;margin-top:1px;">${icon}</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;">${item}</span>
      </div>`
    }).join('')

  return `<div style="width:420px;height:525px;position:relative;overflow:hidden;background:${DBG};font-family:'Plus Jakarta Sans','Inter',sans-serif;">
    ${progressBar(index, total, false)}${arrow(false)}
    <div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 24px 52px;">
      <!-- Category header -->
      <div style="text-align:center;margin-bottom:16px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.3);">${slide.category?.toUpperCase() || ''}</span>
      </div>

      <!-- VS Split -->
      <div style="display:flex;gap:12px;">
        <!-- Left -->
        <div style="flex:1;padding:14px;border-radius:10px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.12);">
          <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:${B};display:block;margin-bottom:10px;">${slide.left_summary || 'LEFT'}</span>
          ${renderCheckItems(leftItems, true)}
        </div>

        <!-- VS divider -->
        <div style="display:flex;align-items:center;">
          <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;">
            <span style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.4);">VS</span>
          </div>
        </div>

        <!-- Right -->
        <div style="flex:1;padding:14px;border-radius:10px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.12);">
          <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:${RED};display:block;margin-bottom:10px;">${slide.right_summary || 'RIGHT'}</span>
          ${renderCheckItems(rightItems, false)}
        </div>
      </div>
    </div>
  </div>`
}
