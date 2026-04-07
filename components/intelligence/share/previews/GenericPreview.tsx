'use client'

export function GenericPreview({ data, accent }: { data: any; accent: string }) {
  const desc = typeof data === 'string' ? data : data?.description || data?.analysis || data?.subtitle || ''
  const stats = data?.stats
  const sections = data?.sections

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Stats row */}
      {stats && Array.isArray(stats) && (
        <div className="flex gap-2.5">
          {stats.slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="flex-1 relative rounded-2xl overflow-hidden"
              style={{ background: `${accent}06`, border: `1px solid ${accent}15`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)` }}>
              <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}15, transparent)` }} />
              <div className="p-3.5 text-center">
                <div className="text-xl font-black" style={{ color: accent }}>{s.value}</div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">{s.label}</div>
                {s.subtitle && <div className="text-[8px] text-slate-600 mt-0.5">{s.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {sections && Array.isArray(sections) && sections.slice(0, 3).map((sec: any, i: number) => (
        <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3.5 rounded-full" style={{ background: accent }} />
            <span className="text-[13px] font-bold text-slate-200">{sec.title}</span>
            {sec.badge && (
              <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: accent, background: `${accent}12` }}>{sec.badge}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed">{String(sec.content).slice(0, 200)}</div>
          {sec.subsections && sec.subsections.slice(0, 2).map((sub: any, j: number) => (
            <div key={j} className="mt-2 pl-3 border-l border-white/[0.05]">
              <span className="text-[10px] text-slate-400">{sub.flag} {sub.label}: </span>
              <span className="text-[10px] text-slate-500">{sub.text}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Description fallback */}
      {desc && !sections && (
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[12px] text-slate-400 leading-relaxed">{String(desc).slice(0, 500)}</div>
        </div>
      )}
    </div>
  )
}
