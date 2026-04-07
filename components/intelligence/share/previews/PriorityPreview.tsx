'use client'

export function PriorityPreview({ data, tall, accent }: { data: any; tall: boolean; accent: string }) {
  const items = (data ?? []).slice(0, tall ? 8 : 5)

  const statusColor = (s: string) => ({
    breaking: '#ff3366', escalating: '#ff6b35', structural: '#ffbe0b',
    watch: '#4cc9f0', emerging: '#b5a3ff', 'de-escalating': '#2ec4b6',
    'peak-risk': '#ff0054',
  }[s?.toLowerCase()] ?? '#64748b')

  return (
    <div className="flex flex-col gap-2.5 h-full">
      {items.map((item: any, i: number) => {
        const sc = statusColor(item.status)
        const isTop = i === 0
        return (
          <div key={i} className="relative group rounded-2xl overflow-hidden"
            style={{
              background: isTop
                ? `linear-gradient(135deg, ${accent}12, rgba(255,255,255,0.04))`
                : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
              border: isTop ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isTop ? `0 8px 32px ${accent}15, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
            {/* Top shine line */}
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,${isTop ? '0.15' : '0.06'}), transparent)` }} />

            <div className="flex items-center gap-4 p-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl text-xl font-black shrink-0"
                style={{
                  background: isTop ? `linear-gradient(135deg, ${accent}, ${accent}88)` : 'rgba(255,255,255,0.06)',
                  color: isTop ? '#fff' : '#475569',
                  boxShadow: isTop ? `0 4px 16px ${accent}40` : 'none',
                }}>
                {item.rank ?? i + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-slate-100 leading-tight truncate">{item.topic}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug truncate">{item.subtitle}</div>

                {/* Signal / Noise bars */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[8px] text-slate-600 font-semibold uppercase tracking-wider w-8">Sig</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="h-1 rounded-full" style={{
                        width: 16,
                        background: n <= (item.signal ?? 3) ? accent : 'rgba(255,255,255,0.06)',
                        boxShadow: n <= (item.signal ?? 3) ? `0 0 4px ${accent}40` : 'none',
                      }} />
                    ))}
                  </div>
                  <span className="text-[8px] text-slate-600 font-semibold uppercase tracking-wider w-10 text-right">Noise</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="h-1 rounded-full" style={{
                        width: 16,
                        background: n <= (item.noise ?? 2) ? '#475569' : 'rgba(255,255,255,0.06)',
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
                style={{ background: `${sc}12`, border: `1px solid ${sc}25` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc, boxShadow: `0 0 6px ${sc}` }} />
                <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: sc }}>{item.status}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
