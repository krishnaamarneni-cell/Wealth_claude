'use client'

export function SignalsPreview({ data, tall, accent, accentDark }: { data: any; tall: boolean; accent: string; accentDark: string }) {
  const items = (data?.items ?? []).slice(0, tall ? 7 : 4)

  return (
    <div className="flex flex-col gap-2.5 h-full">
      {items.map((item: any, i: number) => {
        const isTop = i === 0
        return (
          <div key={i} className="relative rounded-2xl overflow-hidden"
            style={{
              background: isTop ? `${accent}08` : 'rgba(255,255,255,0.03)',
              border: isTop ? `1px solid ${accent}20` : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isTop ? `0 6px 24px ${accent}12, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,${isTop ? '0.12' : '0.04'}), transparent)` }} />
            <div className="flex gap-3.5 p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-sm font-black"
                style={{
                  background: isTop ? `linear-gradient(135deg, ${accent}, ${accentDark})` : 'rgba(255,255,255,0.05)',
                  color: isTop ? '#fff' : '#475569',
                  boxShadow: isTop ? `0 4px 12px ${accent}40` : 'none',
                }}>
                {item.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-slate-100 leading-tight">{item.signal}</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">{item.description}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {item.timeline && (
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                    style={{ color: accent, background: `${accent}12`, border: `1px solid ${accent}20` }}>
                    {item.timeline}
                  </span>
                )}
                {item.category && (
                  <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-wider">{item.category}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
