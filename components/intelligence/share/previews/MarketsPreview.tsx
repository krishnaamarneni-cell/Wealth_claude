'use client'

export function MarketsPreview({ data, accent }: { data: any; accent: string }) {
  const HIDDEN = ['wheat', 'bonds', 'agg', 'dollar', 'uup', 'us dollar']
  const commodities = (data?.commodities ?? []).filter((c: any) => !HIDDEN.some(h => c.name.toLowerCase().includes(h))).slice(0, 6)
  const buys = (data?.strong_buy ?? []).slice(0, 3)
  const avoids = (data?.avoid ?? []).slice(0, 3)
  const safeHaven = (data?.safe_haven ?? []).slice(0, 4)

  return (
    <div className="flex flex-col gap-3.5 h-full">
      {/* Commodities grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {commodities.map((c: any, i: number) => {
          const isUp = c.change_color === 'green'
          const isDown = c.change_color === 'red'
          const clr = isUp ? '#2ec4b6' : isDown ? '#ff3366' : '#64748b'
          return (
            <div key={i} className="relative rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${clr}15`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)` }}>
              <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)` }} />
              {/* Accent bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${clr}40, transparent)` }} />
              <div className="p-3.5">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{c.name}</div>
                <div className="text-[22px] font-black text-slate-100 mt-1 tracking-tight">{c.price}</div>
                <div className="flex items-center gap-1 mt-1">
                  {/* Arrow */}
                  <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
                    {isUp ? (
                      <path d="M5 1L9 6H1Z" fill={clr} />
                    ) : isDown ? (
                      <path d="M5 9L1 4H9Z" fill={clr} />
                    ) : (
                      <path d="M1 5H9" stroke={clr} strokeWidth="2" />
                    )}
                  </svg>
                  <span className="text-[12px] font-bold" style={{ color: clr }}>{c.change}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Buy / Avoid */}
      <div className="flex gap-3">
        {buys.length > 0 && (
          <div className="flex-1 rounded-2xl overflow-hidden relative"
            style={{ background: 'rgba(46,196,182,0.04)', border: '1px solid rgba(46,196,182,0.12)' }}>
            <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(46,196,182,0.15), transparent)' }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#2ec4b6]" />
                <span className="text-[10px] font-extrabold text-[#2ec4b6] uppercase tracking-[2px]">Strong Buy</span>
              </div>
              {buys.map((b: any, i: number) => (
                <div key={i} className="mt-2.5">
                  <div className="text-[13px] font-bold text-slate-200">{b.ticker_or_label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{b.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {avoids.length > 0 && (
          <div className="flex-1 rounded-2xl overflow-hidden relative"
            style={{ background: 'rgba(255,51,102,0.04)', border: '1px solid rgba(255,51,102,0.12)' }}>
            <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,51,102,0.12), transparent)' }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#ff3366]" />
                <span className="text-[10px] font-extrabold text-[#ff3366] uppercase tracking-[2px]">Avoid</span>
              </div>
              {avoids.map((a: any, i: number) => (
                <div key={i} className="mt-2.5">
                  <div className="text-[13px] font-bold text-slate-200">{a.ticker_or_label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{a.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Safe haven */}
      {safeHaven.length > 0 && (
        <div className="rounded-2xl p-4 mt-auto relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3">Safe Haven Allocation</div>
          <div className="space-y-2.5">
            {safeHaven.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 w-16 shrink-0">{item.asset}</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${item.allocation_pct}%`,
                    background: `linear-gradient(90deg, ${accent}66, ${accent})`,
                    boxShadow: `0 0 8px ${accent}30`,
                  }} />
                </div>
                <span className="text-[11px] font-bold text-slate-300 w-8 text-right">{item.allocation_pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
