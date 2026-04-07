import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// ─── Format Dimensions ─────────────────────────────────────────────────────
const FORMATS: Record<string, { width: number; height: number; label: string }> = {
  instagram: { width: 1080, height: 1080, label: 'Instagram Post' },
  story: { width: 1080, height: 1920, label: 'Instagram Story' },
  linkedin: { width: 1200, height: 627, label: 'LinkedIn' },
  whatsapp: { width: 1200, height: 630, label: 'WhatsApp' },
}

// ─── Color helpers ──────────────────────────────────────────────────────────
function statusColor(status: string): string {
  const map: Record<string, string> = {
    breaking: '#ef4444', escalating: '#f97316', structural: '#eab308',
    watch: '#3b82f6', emerging: '#8b5cf6', 'de-escalating': '#22c55e',
    'peak-risk': '#dc2626', live: '#ef4444', green: '#10b981', red: '#ef4444',
  }
  return map[status?.toLowerCase()] ?? '#94a3b8'
}

function heatColor(pct: number): string {
  if (pct >= 75) return '#ef4444'
  if (pct >= 50) return '#f97316'
  if (pct >= 25) return '#eab308'
  return '#22c55e'
}

// ─── Card renderers (return JSX for satori) ─────────────────────────────────

function PriorityCard({ data, dims }: { data: any; dims: { width: number; height: number } }) {
  const items = (data ?? []).slice(0, dims.height > 1200 ? 8 : 5)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
        Priority Index — Top Stories
      </div>
      {items.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, color: '#6366f1', width: 36 }}>
            {item.rank ?? i + 1}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
            <div style={{ display: 'flex', fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>{item.topic}</div>
            <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8' }}>{item.subtitle}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 600, color: statusColor(item.status), background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase' as const }}>
            {item.status}
          </div>
        </div>
      ))}
    </div>
  )
}

function WarRoomCard({ data, dims }: { data: any; dims: { width: number; height: number } }) {
  const conflicts = (data?.conflicts ?? []).slice(0, 4)
  const stats = data?.stats
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
        War Room — Global Conflicts
      </div>
      {stats && (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{stats.active_conflicts}</div>
            <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8' }}>Active Conflicts</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', fontSize: 16, fontWeight: 700, color: '#eab308' }}>{stats.key_deadline}</div>
            <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8' }}>{stats.key_deadline_label}</div>
          </div>
        </div>
      )}
      {conflicts.map((c: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
          {c.is_live && <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 4, background: '#ef4444' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{c.name}</div>
            <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8' }}>{c.description}</div>
          </div>
          <div style={{ display: 'flex', width: 60, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', width: `${c.escalation_pct}%`, height: 6, borderRadius: 3, background: heatColor(c.escalation_pct) }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MarketsCard({ data }: { data: any }) {
  const commodities = (data?.commodities ?? []).slice(0, 6)
  const buys = (data?.strong_buy ?? []).slice(0, 3)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Markets — Commodities & Calls</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {commodities.map((c: any, i: number) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', minWidth: 140 }}>
            <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8' }}>{c.name}</div>
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{c.price}</div>
            <div style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: statusColor(c.change_color) }}>{c.change}</div>
          </div>
        ))}
      </div>
      {buys.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 14, fontWeight: 600, color: '#10b981' }}>Strong Buy</div>
          {buys.map((b: any, i: number) => (
            <div key={i} style={{ display: 'flex', fontSize: 14, color: '#e2e8f0' }}>
              <span style={{ fontWeight: 600 }}>{b.ticker_or_label}</span>
              <span style={{ color: '#94a3b8', marginLeft: 8 }}>— {b.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ThreatCard({ data }: { data: any }) {
  const dims = (data?.dimensions ?? []).slice(0, 7)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Threat Index</div>
      <div style={{ display: 'flex', fontSize: 14, color: '#94a3b8' }}>{data?.subtitle}</div>
      {dims.map((d: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', fontSize: 13, color: '#cbd5e1', width: 120 }}>{d.name}</div>
          <div style={{ display: 'flex', flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', width: `${d.score}%`, height: 10, borderRadius: 5, background: d.color || heatColor(d.score) }} />
          </div>
          <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: '#f1f5f9', width: 30 }}>{d.score}</div>
        </div>
      ))}
    </div>
  )
}

function GenericCard({ data, title }: { data: any; title: string }) {
  const text = typeof data === 'string' ? data
    : data?.description || data?.analysis || data?.subtitle || JSON.stringify(data).slice(0, 300)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{String(text).slice(0, 400)}</div>
    </div>
  )
}

// ─── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tab, format = 'linkedin', data, date } = body

    const dims = FORMATS[format] || FORMATS.linkedin
    const isStory = format === 'story'

    const TAB_TITLES: Record<string, string> = {
      priority: 'Priority Index', warroom: 'War Room', markets: 'Markets',
      techai: 'Tech + AI', foodclimate: 'Food + Climate',
      threat: 'Threat Index', signals: 'Signals',
    }

    const renderContent = () => {
      switch (tab) {
        case 'priority': return <PriorityCard data={data} dims={dims} />
        case 'warroom': return <WarRoomCard data={data} dims={dims} />
        case 'markets': return <MarketsCard data={data} />
        case 'threat': return <ThreatCard data={data} />
        default: return <GenericCard data={data} title={TAB_TITLES[tab] || tab} />
      }
    }

    const image = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: dims.width,
            height: dims.height,
            background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            padding: isStory ? 60 : 48,
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isStory ? 40 : 24 }}>
            <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 6, background: '#6366f1' }} />
            <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase' as const }}>
              WealthClaude Intelligence
            </div>
            <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
              {date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            {renderContent()}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: isStory ? 40 : 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', fontSize: 13, color: '#64748b' }}>
              www.wealthclaude.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', width: 6, height: 6, borderRadius: 3, background: '#ef4444' }} />
              <div style={{ display: 'flex', fontSize: 11, color: '#ef4444', fontWeight: 600, textTransform: 'uppercase' as const }}>
                Live Intelligence
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
