import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const FORMATS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  linkedin: { width: 1200, height: 627 },
  whatsapp: { width: 1200, height: 630 },
}

const ACCENT: Record<string, { primary: string; secondary: string; glow: string }> = {
  priority: { primary: '#818cf8', secondary: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
  warroom:  { primary: '#fb7185', secondary: '#e11d48', glow: 'rgba(225,29,72,0.4)' },
  markets:  { primary: '#34d399', secondary: '#059669', glow: 'rgba(5,150,105,0.4)' },
  techai:   { primary: '#c084fc', secondary: '#9333ea', glow: 'rgba(147,51,234,0.4)' },
  foodclimate: { primary: '#fbbf24', secondary: '#d97706', glow: 'rgba(217,119,6,0.4)' },
  threat:   { primary: '#fb923c', secondary: '#ea580c', glow: 'rgba(234,88,12,0.4)' },
  signals:  { primary: '#38bdf8', secondary: '#0284c7', glow: 'rgba(2,132,199,0.4)' },
}

const TAB_TITLE: Record<string, string> = {
  priority: 'PRIORITY INDEX', warroom: 'WAR ROOM', markets: 'MARKETS INTEL',
  techai: 'TECH + AI', foodclimate: 'FOOD + CLIMATE',
  threat: 'THREAT INDEX', signals: 'EARLY SIGNALS',
}

const TAB_SUBTITLE: Record<string, string> = {
  priority: 'Global risk ranking by signal strength',
  warroom: 'Active conflicts & escalation tracker',
  markets: 'Commodities, positions & safe haven allocation',
  techai: 'AI race, regulation & breakthrough tracker',
  foodclimate: 'Climate cascade & tipping point monitor',
  threat: 'Multi-dimensional threat composite score',
  signals: 'Early warning detection & timeline analysis',
}

function sColor(s: string): string {
  return ({ breaking:'#ff3366', escalating:'#ff6b35', structural:'#ffbe0b', watch:'#4cc9f0', emerging:'#b5a3ff', 'de-escalating':'#2ec4b6', 'peak-risk':'#ff0054', green:'#2ec4b6', red:'#ff3366' })[s?.toLowerCase()] ?? '#64748b'
}

function hColor(p: number) { return p >= 75 ? '#ff3366' : p >= 50 ? '#ff6b35' : p >= 25 ? '#ffbe0b' : '#2ec4b6' }

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════
function PremiumBg({ w, h, accent }: { w: number; h: number; accent: { primary: string; secondary: string; glow: string } }) {
  return (
    <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: w, height: h }}>
      {/* Main mesh gradient */}
      <div style={{ display: 'flex', position: 'absolute', top: -200, right: -150, width: 600, height: 600, borderRadius: 300, background: `radial-gradient(circle, ${accent.glow} 0%, transparent 65%)`, opacity: 0.6 }} />
      <div style={{ display: 'flex', position: 'absolute', bottom: -250, left: -100, width: 500, height: 500, borderRadius: 250, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)' }} />
      <div style={{ display: 'flex', position: 'absolute', top: h * 0.3, left: w * 0.5, width: 300, height: 300, borderRadius: 150, background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 60%)' }} />

      {/* Floating geometric rings */}
      <div style={{ display: 'flex', position: 'absolute', top: 60, right: 80, width: 180, height: 180, borderRadius: 90, border: '1px solid rgba(255,255,255,0.04)' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 75, right: 95, width: 150, height: 150, borderRadius: 75, border: '1px solid rgba(255,255,255,0.03)' }} />
      <div style={{ display: 'flex', position: 'absolute', bottom: 120, left: 60, width: 100, height: 100, borderRadius: 50, border: '1px solid rgba(255,255,255,0.03)' }} />

      {/* Diagonal accent line */}
      <div style={{ display: 'flex', position: 'absolute', top: 0, right: w * 0.35, width: 1, height: h, background: `linear-gradient(180deg, transparent 0%, ${accent.primary}15 30%, ${accent.primary}08 70%, transparent 100%)`, transform: 'rotate(15deg)', transformOrigin: 'top center' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 0, right: w * 0.36, width: 1, height: h, background: `linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 40%, transparent 100%)`, transform: 'rotate(15deg)', transformOrigin: 'top center' }} />

      {/* Dot grid pattern */}
      {[...Array(8)].map((_, row) =>
        [...Array(12)].map((_, col) => (
          <div key={`${row}-${col}`} style={{
            display: 'flex', position: 'absolute',
            top: 40 + row * (h / 9), left: 40 + col * (w / 13),
            width: 2, height: 2, borderRadius: 1,
            background: 'rgba(255,255,255,0.04)',
          }} />
        ))
      )}

      {/* Horizontal scan lines */}
      <div style={{ display: 'flex', position: 'absolute', top: h * 0.15, left: 0, width: w, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent 100%)' }} />
      <div style={{ display: 'flex', position: 'absolute', top: h * 0.85, left: 0, width: w, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 80%, transparent 100%)' }} />

      {/* Corner accents */}
      <div style={{ display: 'flex', position: 'absolute', top: 20, left: 20, width: 40, height: 1, background: `${accent.primary}33` }} />
      <div style={{ display: 'flex', position: 'absolute', top: 20, left: 20, width: 1, height: 40, background: `${accent.primary}33` }} />
      <div style={{ display: 'flex', position: 'absolute', bottom: 20, right: 20, width: 40, height: 1, background: `${accent.primary}22` }} />
      <div style={{ display: 'flex', position: 'absolute', bottom: 20, right: 20, width: 1, height: 40, background: `${accent.primary}22` }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD
// ═══════════════════════════════════════════════════════════════════════════
function G({ children, glow, noPad }: { children: React.ReactNode; glow?: string; noPad?: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', position: 'relative',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: noPad ? 0 : '16px 20px',
      boxShadow: glow
        ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
        : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      {/* Top shine */}
      <div style={{ display: 'flex', position: 'absolute', top: 0, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT PILL
// ═══════════════════════════════════════════════════════════════════════════
function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <G glow={`${color}22`}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0' }}>
        <div style={{ display: 'flex', fontSize: 26, fontWeight: 900, color, letterSpacing: -1 }}>{value}</div>
        <div style={{ display: 'flex', fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>{label}</div>
      </div>
    </G>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB CONTENT RENDERERS
// ═══════════════════════════════════════════════════════════════════════════

function PriorityContent({ data, tall, accent }: { data: any; tall: boolean; accent: any }) {
  const items = (data ?? []).slice(0, tall ? 8 : 5)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {items.map((item: any, i: number) => (
        <G key={i} glow={i === 0 ? accent.glow : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Rank badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: 14,
              background: i === 0
                ? `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`
                : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              boxShadow: i === 0 ? `0 4px 16px ${accent.glow}` : 'none',
              fontSize: 20, fontWeight: 900, color: i === 0 ? '#fff' : '#64748b',
            }}>
              {item.rank ?? i + 1}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
              <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>{item.topic}</div>
              <div style={{ display: 'flex', fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>{item.subtitle}</div>
            </div>
            {/* Status chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 9, fontWeight: 800, color: sColor(item.status),
              background: `${sColor(item.status)}15`,
              border: `1px solid ${sColor(item.status)}30`,
              borderRadius: 10, padding: '6px 14px',
              textTransform: 'uppercase' as const, letterSpacing: 1,
            }}>
              <div style={{ display: 'flex', width: 5, height: 5, borderRadius: 3, background: sColor(item.status), boxShadow: `0 0 6px ${sColor(item.status)}` }} />
              {item.status}
            </div>
          </div>
          {/* Signal strength mini bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', fontSize: 9, color: '#475569', width: 40 }}>SIGNAL</div>
            <div style={{ display: 'flex', flex: 1, gap: 3 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{ display: 'flex', flex: 1, height: 4, borderRadius: 2, background: n <= (item.signal ?? 3) ? accent.primary : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', fontSize: 9, color: '#475569', width: 40, justifyContent: 'flex-end' }}>NOISE</div>
            <div style={{ display: 'flex', flex: 1, gap: 3 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{ display: 'flex', flex: 1, height: 4, borderRadius: 2, background: n <= (item.noise ?? 2) ? '#475569' : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          </div>
        </G>
      ))}
    </div>
  )
}

function WarRoomContent({ data, tall, accent }: { data: any; tall: boolean; accent: any }) {
  const conflicts = (data?.conflicts ?? []).slice(0, tall ? 5 : 3)
  const s = data?.stats
  const heat = (data?.escalation_heat ?? []).slice(0, 6)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {s && (
        <div style={{ display: 'flex', gap: 10 }}>
          <Stat value={s.active_conflicts} label="Active Conflicts" color="#ff3366" />
          <Stat value={s.commodity_price || '—'} label={s.commodity_label || 'Key Commodity'} color="#ffbe0b" />
          <Stat value={s.doomsday_metric || '—'} label={s.doomsday_label || 'Risk Metric'} color="#ff6b35" />
        </div>
      )}
      {conflicts.map((c: any, i: number) => (
        <G key={i} glow={c.is_live ? 'rgba(255,51,102,0.15)' : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {c.is_live && <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 5, background: '#ff3366', boxShadow: '0 0 12px rgba(255,51,102,0.8)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{c.name}</div>
              <div style={{ display: 'flex', fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ display: 'flex', fontSize: 18, fontWeight: 900, color: hColor(c.escalation_pct) }}>{c.escalation_pct}%</div>
              <div style={{ display: 'flex', width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', width: `${c.escalation_pct}%`, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${hColor(c.escalation_pct)}66, ${hColor(c.escalation_pct)})`, boxShadow: `0 0 8px ${hColor(c.escalation_pct)}44` }} />
              </div>
            </div>
          </div>
        </G>
      ))}
      {heat.length > 0 && (
        <G>
          <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10 }}>Regional Escalation Heat</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {heat.map((h: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 12px' }}>
                <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 4, background: hColor(h.heat_pct), boxShadow: `0 0 6px ${hColor(h.heat_pct)}66` }} />
                <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8' }}>{h.region}</div>
                <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: hColor(h.heat_pct) }}>{h.heat_pct}%</div>
              </div>
            ))}
          </div>
        </G>
      )}
    </div>
  )
}

function MarketsContent({ data, accent }: { data: any; accent: any }) {
  const commodities = (data?.commodities ?? []).filter((c: any) => !['wheat','bonds','agg','dollar','uup','us dollar'].some((h: string) => c.name.toLowerCase().includes(h))).slice(0, 6)
  const buys = (data?.strong_buy ?? []).slice(0, 3)
  const avoids = (data?.avoid ?? []).slice(0, 2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {commodities.map((c: any, i: number) => {
          const clr = c.change_color === 'green' ? '#2ec4b6' : c.change_color === 'red' ? '#ff3366' : '#64748b'
          return (
            <G key={i} glow={`${clr}11`}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 130, gap: 2 }}>
                <div style={{ display: 'flex', fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 1 }}>{c.name}</div>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 900, color: '#f1f5f9', letterSpacing: -0.5 }}>{c.price}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: clr }}>
                  <div style={{ display: 'flex', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', ...(c.change_color === 'green' ? { borderBottom: `6px solid ${clr}` } : c.change_color === 'red' ? { borderTop: `6px solid ${clr}` } : {}) }} />
                  {c.change}
                </div>
              </div>
            </G>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {buys.length > 0 && (
          <G glow="rgba(46,196,182,0.1)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', width: 3, height: 16, borderRadius: 2, background: '#2ec4b6' }} />
              <div style={{ display: 'flex', fontSize: 10, fontWeight: 800, color: '#2ec4b6', textTransform: 'uppercase' as const, letterSpacing: 2 }}>Strong Buy</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {buys.map((b: any, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{b.ticker_or_label}</div>
                  <div style={{ display: 'flex', fontSize: 10, color: '#64748b', marginTop: 2 }}>{b.reason}</div>
                </div>
              ))}
            </div>
          </G>
        )}
        {avoids.length > 0 && (
          <G glow="rgba(255,51,102,0.08)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', width: 3, height: 16, borderRadius: 2, background: '#ff3366' }} />
              <div style={{ display: 'flex', fontSize: 10, fontWeight: 800, color: '#ff3366', textTransform: 'uppercase' as const, letterSpacing: 2 }}>Avoid</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {avoids.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{a.ticker_or_label}</div>
                  <div style={{ display: 'flex', fontSize: 10, color: '#64748b', marginTop: 2 }}>{a.reason}</div>
                </div>
              ))}
            </div>
          </G>
        )}
      </div>
    </div>
  )
}

function ThreatContent({ data, accent }: { data: any; accent: any }) {
  const dims = (data?.dimensions ?? []).slice(0, 7)
  const scenarios = (data?.scenario_watch ?? []).slice(0, 2)
  // Compute composite score
  const avg = dims.length > 0 ? Math.round(dims.reduce((a: number, d: any) => a + d.score, 0) / dims.length) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        {/* Big composite score */}
        <G glow={accent.glow}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 24px' }}>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 900, color: hColor(avg), letterSpacing: -2 }}>{avg}</div>
            <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 2 }}>Composite</div>
          </div>
        </G>
        {/* Dimension bars */}
        <G>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
            {dims.map((d: any, i: number) => {
              const clr = d.color || hColor(d.score)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', fontSize: 10, color: '#94a3b8', width: 80, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ display: 'flex', flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', width: `${d.score}%`, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${clr}55, ${clr})`, boxShadow: `0 0 10px ${clr}33` }} />
                  </div>
                  <div style={{ display: 'flex', fontSize: 12, fontWeight: 900, color: clr, width: 28 }}>{d.score}</div>
                </div>
              )
            })}
          </div>
        </G>
      </div>
      {scenarios.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {scenarios.map((sc: any, i: number) => (
            <G key={i} glow="rgba(255,140,66,0.08)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', fontSize: 9, fontWeight: 800, color: '#ff6b35', background: 'rgba(255,107,53,0.15)', borderRadius: 6, padding: '3px 10px', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Scenario</div>
                <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, color: '#ffbe0b' }}>P: {sc.probability}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{sc.scenario}</div>
              <div style={{ display: 'flex', fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{sc.description}</div>
            </G>
          ))}
        </div>
      )}
    </div>
  )
}

function SignalsContent({ data, tall, accent }: { data: any; tall: boolean; accent: any }) {
  const items = (data?.items ?? []).slice(0, tall ? 6 : 4)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {items.map((item: any, i: number) => (
        <G key={i} glow={i === 0 ? accent.glow : undefined}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 42, height: 42, borderRadius: 12,
              background: i === 0
                ? `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`
                : 'rgba(255,255,255,0.06)',
              fontSize: 16, fontWeight: 900, color: i === 0 ? '#fff' : '#475569',
            }}>
              {item.rank}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
              <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{item.signal}</div>
              <div style={{ display: 'flex', fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>{item.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {item.timeline && (
                <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, color: accent.primary, background: `${accent.primary}15`, border: `1px solid ${accent.primary}30`, borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap' as const }}>
                  {item.timeline}
                </div>
              )}
              {item.category && (
                <div style={{ display: 'flex', fontSize: 8, color: '#475569', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  {item.category}
                </div>
              )}
            </div>
          </div>
        </G>
      ))}
    </div>
  )
}

function GenericContent({ data, accent }: { data: any; accent: any }) {
  const desc = typeof data === 'string' ? data : data?.description || data?.analysis || data?.subtitle || ''
  const stats = data?.stats
  const sections = data?.sections
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {stats && Array.isArray(stats) && (
        <div style={{ display: 'flex', gap: 10 }}>
          {stats.slice(0, 4).map((s: any, i: number) => (
            <Stat key={i} value={s.value} label={s.label} color={accent.primary} />
          ))}
        </div>
      )}
      {sections && Array.isArray(sections) && sections.slice(0, 3).map((sec: any, i: number) => (
        <G key={i}>
          <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{sec.title}</div>
          <div style={{ display: 'flex', fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{String(sec.content).slice(0, 200)}</div>
        </G>
      ))}
      {desc && !sections && (
        <G>
          <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{String(desc).slice(0, 500)}</div>
        </G>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tab, format = 'linkedin', data, date } = body

    const dims = FORMATS[format] || FORMATS.linkedin
    const isTall = dims.height > 1000
    const accent = ACCENT[tab] || ACCENT.priority
    const pad = isTall ? 52 : 40
    const title = TAB_TITLE[tab] || 'INTELLIGENCE'
    const subtitle = TAB_SUBTITLE[tab] || ''

    const renderContent = () => {
      switch (tab) {
        case 'priority': return <PriorityContent data={data} tall={isTall} accent={accent} />
        case 'warroom': return <WarRoomContent data={data} tall={isTall} accent={accent} />
        case 'markets': return <MarketsContent data={data} accent={accent} />
        case 'threat': return <ThreatContent data={data} accent={accent} />
        case 'signals': return <SignalsContent data={data} tall={isTall} accent={accent} />
        default: return <GenericContent data={data} accent={accent} />
      }
    }

    const dateStr = date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const image = new ImageResponse(
      (
        <div style={{
          display: 'flex', flexDirection: 'column', position: 'relative',
          width: dims.width, height: dims.height,
          background: 'linear-gradient(155deg, #05060f 0%, #0a0e23 20%, #0f0b24 45%, #0d0a1f 65%, #060810 100%)',
          fontFamily: 'sans-serif', overflow: 'hidden',
        }}>
          <PremiumBg w={dims.width} h={dims.height} accent={accent} />

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: pad, position: 'relative' }}>
            {/* ── Top bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: isTall ? 28 : 18 }}>
              {/* Logo */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, borderRadius: 14,
                background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
                boxShadow: `0 4px 20px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: -0.5,
              }}>
                WC
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 14 }}>
                <div style={{ display: 'flex', fontSize: 16, fontWeight: 900, color: '#e2e8f0', letterSpacing: 0.3 }}>WealthClaude</div>
                <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 3 }}>Global Intelligence</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: 8, padding: '5px 12px' }}>
                  <div style={{ display: 'flex', width: 6, height: 6, borderRadius: 3, background: '#ff3366', boxShadow: '0 0 8px rgba(255,51,102,0.8)' }} />
                  <div style={{ display: 'flex', fontSize: 9, fontWeight: 800, color: '#ff3366', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Live</div>
                </div>
                <div style={{ display: 'flex', fontSize: 11, color: '#334155', fontWeight: 600 }}>{dateStr}</div>
              </div>
            </div>

            {/* ── Section title ── */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: isTall ? 24 : 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', width: 4, height: 32, borderRadius: 2, background: `linear-gradient(180deg, ${accent.primary}, ${accent.secondary}55)` }} />
                <div style={{ display: 'flex', fontSize: isTall ? 32 : 26, fontWeight: 900, color: '#f1f5f9', letterSpacing: -0.5 }}>{title}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 12, color: '#475569', marginLeft: 16, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>
            </div>

            {/* ── Content ── */}
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
              {renderContent()}
            </div>

            {/* ── Footer ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: isTall ? 28 : 16, paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', width: 20, height: 1, background: `linear-gradient(90deg, ${accent.primary}, transparent)` }} />
                <div style={{ display: 'flex', fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: 0.5 }}>www.wealthclaude.com</div>
              </div>
              <div style={{
                display: 'flex', fontSize: 9, fontWeight: 700, color: '#334155',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '5px 14px', letterSpacing: 1,
                textTransform: 'uppercase' as const,
              }}>
                AI-Powered Intelligence
              </div>
            </div>
          </div>
        </div>
      ),
      { width: dims.width, height: dims.height },
    )

    return image
  } catch (err: any) {
    console.error('[share] Image generation failed:', err?.message)
    return NextResponse.json({ error: err?.message || 'Image generation failed' }, { status: 500 })
  }
}
