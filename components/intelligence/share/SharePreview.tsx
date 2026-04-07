'use client'

import { forwardRef } from 'react'
import type { TabId } from '@/types/intelligence'
import { PriorityPreview } from './previews/PriorityPreview'
import { WarRoomPreview } from './previews/WarRoomPreview'
import { MarketsPreview } from './previews/MarketsPreview'
import { ThreatPreview } from './previews/ThreatPreview'
import { SignalsPreview } from './previews/SignalsPreview'
import { GenericPreview } from './previews/GenericPreview'

interface Props {
  tab: TabId
  data: any
  date?: string
  format: string
  dims: { width: number; height: number }
}

const TAB_META: Record<string, { title: string; subtitle: string; accent: string; accentDark: string }> = {
  priority:    { title: 'PRIORITY INDEX',  subtitle: 'Global risk ranking by signal strength',         accent: '#818cf8', accentDark: '#4f46e5' },
  warroom:     { title: 'WAR ROOM',        subtitle: 'Active conflicts & escalation tracker',          accent: '#fb7185', accentDark: '#be123c' },
  markets:     { title: 'MARKETS INTEL',   subtitle: 'Commodities, positions & safe haven allocation', accent: '#34d399', accentDark: '#047857' },
  techai:      { title: 'TECH + AI',       subtitle: 'AI race, regulation & breakthrough tracker',     accent: '#c084fc', accentDark: '#7c3aed' },
  foodclimate: { title: 'FOOD + CLIMATE',  subtitle: 'Climate cascade & tipping point monitor',        accent: '#fbbf24', accentDark: '#b45309' },
  threat:      { title: 'THREAT INDEX',    subtitle: 'Multi-dimensional threat composite',             accent: '#fb923c', accentDark: '#c2410c' },
  signals:     { title: 'EARLY SIGNALS',   subtitle: 'Early warning detection & timeline',             accent: '#38bdf8', accentDark: '#0369a1' },
}

export const SharePreview = forwardRef<HTMLDivElement, Props>(
  ({ tab, data, date, format, dims }, ref) => {
    const meta = TAB_META[tab] || TAB_META.priority
    const isTall = dims.height > 1000
    const dateStr = date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const renderContent = () => {
      switch (tab) {
        case 'priority': return <PriorityPreview data={data} tall={isTall} accent={meta.accent} />
        case 'warroom': return <WarRoomPreview data={data} tall={isTall} accent={meta.accent} />
        case 'markets': return <MarketsPreview data={data} accent={meta.accent} />
        case 'threat': return <ThreatPreview data={data} accent={meta.accent} accentDark={meta.accentDark} />
        case 'signals': return <SignalsPreview data={data} tall={isTall} accent={meta.accent} accentDark={meta.accentDark} />
        default: return <GenericPreview data={data} accent={meta.accent} />
      }
    }

    return (
      <div
        ref={ref}
        style={{ width: dims.width, height: dims.height, position: 'absolute', left: '-9999px', top: 0 }}
        className="overflow-hidden"
      >
        {/* ── Base background ── */}
        <div className="relative w-full h-full" style={{ background: 'linear-gradient(155deg, #05060f 0%, #0a0e23 25%, #100b28 50%, #0d0a1f 75%, #060810 100%)' }}>

          {/* ── Decorative layers ── */}
          {/* Large gradient orbs */}
          <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full opacity-50"
            style={{ background: `radial-gradient(circle, ${meta.accent}30 0%, transparent 60%)` }} />
          <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />
          <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 60%)' }} />

          {/* Geometric rings */}
          <div className="absolute top-12 right-16 w-48 h-48 rounded-full border border-white/[0.03]" />
          <div className="absolute top-16 right-20 w-40 h-40 rounded-full border border-white/[0.02]" />
          <div className="absolute bottom-24 left-12 w-28 h-28 rounded-full border border-white/[0.03]" />

          {/* Diagonal accent beam */}
          <div className="absolute top-0 h-full w-px origin-top"
            style={{ right: '35%', background: `linear-gradient(180deg, transparent, ${meta.accent}10 30%, ${meta.accent}05 70%, transparent)`, transform: 'rotate(12deg)' }} />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px 128px' }} />

          {/* Corner accents */}
          <div className="absolute top-5 left-5 w-10 h-px" style={{ background: `${meta.accent}25` }} />
          <div className="absolute top-5 left-5 h-10 w-px" style={{ background: `${meta.accent}25` }} />
          <div className="absolute bottom-5 right-5 w-10 h-px" style={{ background: `${meta.accent}15` }} />
          <div className="absolute bottom-5 right-5 h-10 w-px" style={{ background: `${meta.accent}15` }} />

          {/* ── Content ── */}
          <div className="relative flex flex-col h-full" style={{ padding: isTall ? 52 : 40 }}>

            {/* Top bar */}
            <div className="flex items-center mb-6">
              {/* Logo */}
              <div className="flex items-center justify-center w-11 h-11 rounded-[14px] text-white text-sm font-black tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${meta.accent}, ${meta.accentDark})`,
                  boxShadow: `0 4px 24px ${meta.accent}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}>
                WC
              </div>
              <div className="ml-3.5">
                <div className="text-[15px] font-black text-slate-200 tracking-wide">WealthClaude</div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-[3px]">Global Intelligence</div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                  style={{ background: 'rgba(255,51,102,0.08)', borderColor: 'rgba(255,51,102,0.2)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff3366] animate-pulse" style={{ boxShadow: '0 0 8px rgba(255,51,102,0.8)' }} />
                  <span className="text-[9px] font-extrabold text-[#ff3366] uppercase tracking-wider">Live</span>
                </div>
                <span className="text-[11px] text-slate-700 font-semibold">{dateStr}</span>
              </div>
            </div>

            {/* Section title */}
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${meta.accent}, transparent)` }} />
                <h2 className="font-black text-slate-100 tracking-tight" style={{ fontSize: isTall ? 34 : 28, letterSpacing: -0.5 }}>{meta.title}</h2>
              </div>
              <p className="text-[12px] text-slate-600 font-medium ml-4 mt-1">{meta.subtitle}</p>
            </div>

            {/* Dynamic content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-px" style={{ background: `linear-gradient(90deg, ${meta.accent}, transparent)` }} />
                <span className="text-[11px] text-slate-700 font-semibold tracking-wide">www.wealthclaude.com</span>
              </div>
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-4 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02]">
                AI-Powered Intelligence
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

SharePreview.displayName = 'SharePreview'
