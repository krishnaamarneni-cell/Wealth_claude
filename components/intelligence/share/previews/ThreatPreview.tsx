'use client'

function hColor(p: number) { return p >= 75 ? '#ff3366' : p >= 50 ? '#ff6b35' : p >= 25 ? '#ffbe0b' : '#2ec4b6' }

export function ThreatPreview({ data, accent, accentDark }: { data: any; accent: string; accentDark: string }) {
  const dims = (data?.dimensions ?? []).slice(0, 7)
  const scenarios = (data?.scenario_watch ?? []).slice(0, 2)
  const avg = dims.length > 0 ? Math.round(dims.reduce((a: number, d: any) => a + d.score, 0) / dims.length) : 0
  const avgColor = hColor(avg)

  // SVG arc for gauge
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = (avg / 100) * circumference * 0.75 // 270 degree arc

  return (
    <div className="flex flex-col gap-3.5 h-full">
      <div className="flex gap-3.5">
        {/* Circular gauge */}
        <div className="relative rounded-2xl overflow-hidden shrink-0"
          style={{ background: `${avgColor}06`, border: `1px solid ${avgColor}15`, boxShadow: `0 8px 32px ${avgColor}10, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
          <div className="p-6 flex flex-col items-center">
            <svg width="128" height="110" viewBox="0 0 128 110">
              {/* Background arc */}
              <path d="M 10 100 A 52 52 0 1 1 118 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
              {/* Progress arc */}
              <path d="M 10 100 A 52 52 0 1 1 118 100" fill="none" stroke={avgColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                style={{ filter: `drop-shadow(0 0 6px ${avgColor}60)` }} />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter" style={{ color: avgColor }}>{avg}</span>
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[2px] mt-0.5">Composite</span>
            </div>
          </div>
        </div>

        {/* Dimension bars */}
        <div className="flex-1 rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
          <div className="space-y-3">
            {dims.map((d: any, i: number) => {
              const clr = d.color || hColor(d.score)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 w-20 shrink-0 font-medium">{d.name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${d.score}%`,
                      background: `linear-gradient(90deg, ${clr}55, ${clr})`,
                      boxShadow: `0 0 10px ${clr}30`,
                    }} />
                  </div>
                  <span className="text-[12px] font-black w-7 text-right" style={{ color: clr }}>{d.score}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      {scenarios.length > 0 && (
        <div className="flex gap-3">
          {scenarios.map((sc: any, i: number) => (
            <div key={i} className="flex-1 rounded-2xl p-4 relative overflow-hidden"
              style={{ background: 'rgba(255,140,66,0.04)', border: '1px solid rgba(255,140,66,0.12)' }}>
              <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,140,66,0.12), transparent)' }} />
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[9px] font-extrabold text-[#ff6b35] uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ background: 'rgba(255,107,53,0.12)' }}>Scenario</span>
                <span className="text-[10px] font-bold text-[#ffbe0b]">P: {sc.probability}</span>
              </div>
              <div className="text-[13px] font-bold text-slate-200 leading-snug">{sc.scenario}</div>
              <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{sc.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Contrarian */}
      {data?.contrarian && (
        <div className="rounded-2xl p-4 mt-auto relative overflow-hidden"
          style={{ background: 'rgba(181,163,255,0.04)', border: '1px solid rgba(181,163,255,0.12)' }}>
          <div className="text-[9px] font-extrabold text-[#b5a3ff] uppercase tracking-wider mb-2">{data.contrarian.badge || 'Contrarian View'}</div>
          <div className="text-[13px] font-bold text-slate-200">{data.contrarian.title}</div>
          <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{data.contrarian.text}</div>
        </div>
      )}
    </div>
  )
}
