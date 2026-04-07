'use client'

function hColor(p: number) { return p >= 75 ? '#ff3366' : p >= 50 ? '#ff6b35' : p >= 25 ? '#ffbe0b' : '#2ec4b6' }

export function WarRoomPreview({ data, tall, accent }: { data: any; tall: boolean; accent: string }) {
  const conflicts = (data?.conflicts ?? []).slice(0, tall ? 5 : 3)
  const s = data?.stats
  const heat = (data?.escalation_heat ?? []).slice(0, 6)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Stat row */}
      {s && (
        <div className="flex gap-3">
          {[
            { v: s.active_conflicts, l: 'Active Conflicts', c: '#ff3366' },
            { v: s.key_deadline, l: s.key_deadline_label || 'Key Deadline', c: '#ffbe0b' },
            { v: s.doomsday_metric || '—', l: s.doomsday_label || 'Risk', c: '#ff6b35' },
          ].map((st, i) => (
            <div key={i} className="flex-1 relative rounded-2xl overflow-hidden"
              style={{ background: `${st.c}08`, border: `1px solid ${st.c}20`, boxShadow: `0 8px 24px ${st.c}10, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
              <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${st.c}20, transparent)` }} />
              <div className="p-4 text-center">
                <div className="text-2xl font-black" style={{ color: st.c }}>{st.v}</div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">{st.l}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflicts */}
      {conflicts.map((c: any, i: number) => {
        const clr = hColor(c.escalation_pct)
        return (
          <div key={i} className="relative rounded-2xl overflow-hidden"
            style={{
              background: c.is_live ? 'rgba(255,51,102,0.04)' : 'rgba(255,255,255,0.03)',
              border: c.is_live ? '1px solid rgba(255,51,102,0.15)' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: c.is_live ? '0 4px 20px rgba(255,51,102,0.08), inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
            <div className="flex items-center gap-3.5 p-4">
              {c.is_live && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366] shrink-0" style={{ boxShadow: '0 0 12px rgba(255,51,102,0.8), 0 0 24px rgba(255,51,102,0.4)' }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-slate-100">{c.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">{c.description}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-lg font-black" style={{ color: clr }}>{c.escalation_pct}%</span>
                <div className="w-20 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${c.escalation_pct}%`,
                    background: `linear-gradient(90deg, ${clr}66, ${clr})`,
                    boxShadow: `0 0 8px ${clr}40`,
                  }} />
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Heat map */}
      {heat.length > 0 && (
        <div className="rounded-2xl p-4 mt-auto" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3">Regional Escalation</div>
          <div className="flex flex-wrap gap-2">
            {heat.map((h: any, i: number) => {
              const c = hColor(h.heat_pct)
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${c}08`, border: `1px solid ${c}15` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}60` }} />
                  <span className="text-[11px] text-slate-400">{h.region}</span>
                  <span className="text-[11px] font-bold" style={{ color: c }}>{h.heat_pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
