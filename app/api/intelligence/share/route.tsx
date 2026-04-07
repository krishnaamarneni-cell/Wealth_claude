import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const FORMATS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  linkedin: { width: 1200, height: 627 },
  whatsapp: { width: 1200, height: 630 },
}

function statusColor(s: string): string {
  const m: Record<string, string> = {
    breaking: '#ff4d6a', escalating: '#ff8c42', structural: '#ffd166',
    watch: '#4dc9f6', emerging: '#a78bfa', 'de-escalating': '#34d399',
    'peak-risk': '#ff4d6a', live: '#ff4d6a', green: '#34d399', red: '#ff4d6a',
  }
  return m[s?.toLowerCase()] ?? '#94a3b8'
}

function heatColor(pct: number): string {
  if (pct >= 75) return '#ff4d6a'
  if (pct >= 50) return '#ff8c42'
  if (pct >= 25) return '#ffd166'
  return '#34d399'
}

// ─── Decorative background elements ─────────────────────────────────────────
function BgElements({ w, h }: { w: number; h: number }) {
  return (
    <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: w, height: h, overflow: 'hidden' }}>
      {/* Large glow orb top-right */}
      <div style={{
        display: 'flex', position: 'absolute', top: -120, right: -80,
        width: 400, height: 400, borderRadius: 200,
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 70%)',
      }} />
      {/* Accent orb bottom-left */}
      <div style={{
        display: 'flex', position: 'absolute', bottom: -100, left: -60,
        width: 350, height: 350, borderRadius: 175,
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
      }} />
      {/* Small accent orb */}
      <div style={{
        display: 'flex', position: 'absolute', top: h * 0.4, right: 40,
        width: 120, height: 120, borderRadius: 60,
        background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
      }} />
      {/* Grid lines */}
      {[...Array(6)].map((_, i) => (
        <div key={`h${i}`} style={{
          display: 'flex', position: 'absolute', top: Math.round(h * (i + 1) / 7),
          left: 0, width: w, height: 1,
          background: 'rgba(255,255,255,0.03)',
        }} />
      ))}
      {[...Array(5)].map((_, i) => (
        <div key={`v${i}`} style={{
          display: 'flex', position: 'absolute', left: Math.round(w * (i + 1) / 6),
          top: 0, width: 1, height: h,
          background: 'rgba(255,255,255,0.03)',
        }} />
      ))}
    </div>
  )
}

// ─── Glass card wrapper ─────────────────────────────────────────────────────
function GlassCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? accent + '33' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16, padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      {children}
    </div>
  )
}

// ─── Tab-specific content ───────────────────────────────────────────────────

function PriorityContent({ data, tall }: { data: any; tall: boolean }) {
  const items = (data ?? []).slice(0, tall ? 8 : 5)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {items.map((item: any, i: number) => (
        <GlassCard key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.15))',
              border: '1px solid rgba(99,102,241,0.3)',
              fontSize: 20, fontWeight: 800, color: '#a5b4fc',
            }}>
              {item.rank ?? i + 1}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
              <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{item.topic}</div>
              <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', lineHeight: 1.3 }}>{item.subtitle}</div>
            </div>
            <div style={{
              display: 'flex', fontSize: 10, fontWeight: 700, color: statusColor(item.status),
              background: statusColor(item.status) + '18',
              border: `1px solid ${statusColor(item.status)}44`,
              borderRadius: 8, padding: '5px 12px',
              textTransform: 'uppercase' as const, letterSpacing: 0.5,
            }}>
              {item.status}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function WarRoomContent({ data, tall }: { data: any; tall: boolean }) {
  const conflicts = (data?.conflicts ?? []).slice(0, tall ? 5 : 3)
  const stats = data?.stats
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {stats && (
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { val: stats.active_conflicts, label: 'Active Conflicts', color: '#ff4d6a', bg: 'rgba(255,77,106,0.1)', border: 'rgba(255,77,106,0.25)' },
            { val: stats.key_deadline, label: stats.key_deadline_label, color: '#ffd166', bg: 'rgba(255,209,102,0.08)', border: 'rgba(255,209,102,0.25)' },
            { val: stats.doomsday_metric, label: stats.doomsday_label, color: '#ff8c42', bg: 'rgba(255,140,66,0.08)', border: 'rgba(255,140,66,0.25)' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', flex: 1,
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: 16,
              boxShadow: `0 4px 20px ${s.bg}`,
            }}>
              <div style={{ display: 'flex', fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ display: 'flex', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {conflicts.map((c: any, i: number) => (
        <GlassCard key={i} accent={c.is_live ? '#ff4d6a' : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {c.is_live && (
              <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 5, background: '#ff4d6a', boxShadow: '0 0 8px rgba(255,77,106,0.6)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{c.name}</div>
              <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{c.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: heatColor(c.escalation_pct) }}>{c.escalation_pct}%</div>
              <div style={{ display: 'flex', width: 70, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', width: `${c.escalation_pct}%`, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${heatColor(c.escalation_pct)}88, ${heatColor(c.escalation_pct)})` }} />
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function MarketsContent({ data }: { data: any }) {
  const commodities = (data?.commodities ?? []).slice(0, 6)
  const buys = (data?.strong_buy ?? []).slice(0, 3)
  const avoids = (data?.avoid ?? []).slice(0, 2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {commodities.map((c: any, i: number) => {
          const clr = statusColor(c.change_color)
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', flex: '1 1 140px',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${clr}22`,
              borderRadius: 16, padding: '14px 18px',
              boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}>
              <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{c.name}</div>
              <div style={{ display: 'flex', fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginTop: 4 }}>{c.price}</div>
              <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: clr, marginTop: 2 }}>{c.change}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {buys.length > 0 && (
          <GlassCard accent="#34d399">
            <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Strong Buy</div>
            {buys.map((b: any, i: number) => (
              <div key={i} style={{ display: 'flex', fontSize: 13, color: '#e2e8f0', marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>{b.ticker_or_label}</span>
                <span style={{ color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>{b.reason}</span>
              </div>
            ))}
          </GlassCard>
        )}
        {avoids.length > 0 && (
          <GlassCard accent="#ff4d6a">
            <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: '#ff4d6a', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Avoid</div>
            {avoids.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', fontSize: 13, color: '#e2e8f0', marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>{a.ticker_or_label}</span>
                <span style={{ color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>{a.reason}</span>
              </div>
            ))}
          </GlassCard>
        )}
      </div>
    </div>
  )
}

function ThreatContent({ data }: { data: any }) {
  const dims = (data?.dimensions ?? []).slice(0, 7)
  const scenarios = (data?.scenario_watch ?? []).slice(0, 2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{data?.subtitle}</div>
      <GlassCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dims.map((d: any, i: number) => {
            const clr = d.color || heatColor(d.score)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#cbd5e1', width: 110, fontWeight: 500 }}>{d.name}</div>
                <div style={{ display: 'flex', flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', width: `${d.score}%`, height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${clr}88, ${clr})`, boxShadow: `0 0 12px ${clr}44` }} />
                </div>
                <div style={{ display: 'flex', fontSize: 14, fontWeight: 800, color: clr, width: 32 }}>{d.score}</div>
              </div>
            )
          })}
        </div>
      </GlassCard>
      {scenarios.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {scenarios.map((s: any, i: number) => (
            <GlassCard key={i} accent="#ff8c42">
              <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#ffd166' }}>{s.scenario}</div>
              <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.description}</div>
              <div style={{ display: 'flex', fontSize: 10, fontWeight: 700, color: '#ff8c42', marginTop: 6 }}>P: {s.probability}</div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

function SignalsContent({ data }: { data: any }) {
  const items = (data?.items ?? []).slice(0, 5)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 13, color: '#94a3b8' }}>{data?.subtitle}</div>
      {items.map((item: any, i: number) => (
        <GlassCard key={i}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(139,92,246,0.1))',
              border: '1px solid rgba(56,189,248,0.2)',
              fontSize: 14, fontWeight: 800, color: '#7dd3fc',
            }}>
              {item.rank}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
              <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{item.signal}</div>
              <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{item.description}</div>
            </div>
            {item.timeline && (
              <div style={{ display: 'flex', fontSize: 10, color: '#7dd3fc', fontWeight: 600, background: 'rgba(56,189,248,0.1)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' as const }}>
                {item.timeline}
              </div>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function GenericContent({ data, title }: { data: any; title: string }) {
  const desc = typeof data === 'string' ? data : data?.description || data?.analysis || ''
  const stats = data?.stats
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {stats && Array.isArray(stats) && (
        <div style={{ display: 'flex', gap: 10 }}>
          {stats.slice(0, 4).map((s: any, i: number) => (
            <GlassCard key={i}>
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>{s.value}</div>
              <div style={{ display: 'flex', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
            </GlassCard>
          ))}
        </div>
      )}
      {desc && (
        <GlassCard>
          <div style={{ display: 'flex', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{String(desc).slice(0, 500)}</div>
        </GlassCard>
      )}
    </div>
  )
}

// ─── Tab metadata ───────────────────────────────────────────────────────────
const TAB_META: Record<string, { title: string; icon: string; accent: string }> = {
  priority: { title: 'Priority Index', icon: '|||', accent: '#6366f1' },
  warroom: { title: 'War Room', icon: '////', accent: '#ff4d6a' },
  markets: { title: 'Markets', icon: '||||', accent: '#34d399' },
  techai: { title: 'Tech + AI', icon: '</>',  accent: '#a78bfa' },
  foodclimate: { title: 'Food + Climate', icon: '~~~', accent: '#fbbf24' },
  threat: { title: 'Threat Index', icon: '/!\\', accent: '#ff8c42' },
  signals: { title: 'Signals', icon: '((o))', accent: '#38bdf8' },
}

// ─── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tab, format = 'linkedin', data, date } = body

    const dims = FORMATS[format] || FORMATS.linkedin
    const isStory = format === 'story'
    const isTall = dims.height > 1000
    const meta = TAB_META[tab] || TAB_META.priority
    const pad = isStory ? 56 : 44

    const renderContent = () => {
      switch (tab) {
        case 'priority': return <PriorityContent data={data} tall={isTall} />
        case 'warroom': return <WarRoomContent data={data} tall={isTall} />
        case 'markets': return <MarketsContent data={data} />
        case 'threat': return <ThreatContent data={data} />
        case 'signals': return <SignalsContent data={data} />
        default: return <GenericContent data={data} title={meta.title} />
      }
    }

    const image = new ImageResponse(
      (
        <div style={{
          display: 'flex', flexDirection: 'column', position: 'relative',
          width: dims.width, height: dims.height,
          background: 'linear-gradient(160deg, #080c1a 0%, #0d1333 30%, #150d2e 60%, #0a0e1f 100%)',
          fontFamily: 'sans-serif', overflow: 'hidden',
        }}>
          <BgElements w={dims.width} h={dims.height} />

          {/* Content layer */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: pad, position: 'relative' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: isTall ? 32 : 20 }}>
              {/* Logo mark */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 42, height: 42, borderRadius: 12,
                background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}88)`,
                boxShadow: `0 4px 16px ${meta.accent}44`,
                fontSize: 16, fontWeight: 900, color: '#fff',
              }}>
                WC
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: 15, fontWeight: 800, color: '#e2e8f0', letterSpacing: 0.5 }}>
                  WealthClaude
                </div>
                <div style={{ display: 'flex', fontSize: 10, fontWeight: 600, color: meta.accent, textTransform: 'uppercase' as const, letterSpacing: 2 }}>
                  Intelligence Brief
                </div>
              </div>
              <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', width: 7, height: 7, borderRadius: 4, background: '#ff4d6a', boxShadow: '0 0 8px rgba(255,77,106,0.6)' }} />
                <div style={{ display: 'flex', fontSize: 10, fontWeight: 700, color: '#ff4d6a', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                  Live
                </div>
                <div style={{ display: 'flex', fontSize: 11, color: '#475569', marginLeft: 8 }}>
                  {date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Section title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isTall ? 24 : 16 }}>
              <div style={{
                display: 'flex', width: 4, height: 28, borderRadius: 2,
                background: `linear-gradient(180deg, ${meta.accent}, transparent)`,
              }} />
              <div style={{ display: 'flex', fontSize: isTall ? 28 : 24, fontWeight: 900, color: '#f1f5f9', letterSpacing: -0.5 }}>
                {meta.title}
              </div>
            </div>

            {/* Dynamic content */}
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
              {renderContent()}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: isTall ? 32 : 20, paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', fontSize: 12, color: '#475569', fontWeight: 500 }}>
                www.wealthclaude.com
              </div>
              <div style={{
                display: 'flex', fontSize: 10, color: '#475569', fontWeight: 600,
                background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                AI-Powered Global Intelligence
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
