"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { getMockMarketData } from "@/lib/mockData"
import { COUNTRY_INDEX_MAP } from "@/lib/countryIndexMap"
import { pctToColor, pctToTextClass, LEGEND_STOPS } from "@/lib/colorScale"
import { CountryPanel } from "@/components/CountryPanel"

// Dynamic import — Globe.gl requires browser APIs
const GlobeWrapper = dynamic(
  () => import("@/components/GlobeWrapper").then(m => ({ default: m.GlobeWrapper })),
  {
    ssr: false, loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#060a10]">
        <div className="text-white/30 text-sm tracking-widest uppercase animate-pulse">Initializing Globe…</div>
      </div>
    )
  }
)

export default function GlobePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [today, setToday] = useState("")

  const marketData = useMemo(() => getMockMarketData(), [])
  const selectedData = selectedCountry ? marketData[selectedCountry] ?? null : null

  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }))
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060a10] select-none">

      {/* ── SPACE BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Galaxy glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(30,58,95,0.15) 0%, rgba(6,10,16,0) 70%)" }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(16,185,129,0.03) 0%, transparent 70%)" }} />
      </div>

      {/* ── GLOBE (full screen) ── */}
      <div className="absolute inset-0 z-10" style={{ height: "100vh", width: "100vw" }}>
        <GlobeWrapper
          marketData={marketData}
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
        />
      </div>

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4">
          {/* Logo + title */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-base">🌍</div>
            <div>
              <div className="text-sm font-extrabold text-white leading-none">Global Stock Globe</div>
              <div className="text-[10px] text-white/30 mt-0.5">by WealthClaude</div>
            </div>
          </div>

          {/* Date + refresh badge */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              MOCK DATA — Step 1
            </div>
            <div className="text-[10px] text-white/25 hidden md:block">{today}</div>
          </div>
        </div>
      </div>

      {/* ── LEFT STATS BAR ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Summary */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1117]/90 backdrop-blur-sm px-4 py-3 min-w-[130px] space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Markets Today</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Gaining</span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">{gainers}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Falling</span>
            <span className="text-sm font-bold text-red-400 tabular-nums">{losers}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Total</span>
            <span className="text-sm font-bold text-white tabular-nums">{countries.length}</span>
          </div>
        </div>

        {/* Top gainer */}
        {topGainer && (
          <div
            className="rounded-2xl border border-emerald-500/20 bg-[#0d1117]/90 backdrop-blur-sm px-4 py-3 cursor-pointer hover:border-emerald-500/40 transition-colors"
            onClick={() => handleCountrySelect(topGainer.countryCode, COUNTRY_INDEX_MAP[topGainer.countryCode]?.name ?? topGainer.countryCode)}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-1">Top Gainer</div>
            <div className="text-xs font-bold text-white">{topGainer.indexName}</div>
            <div className="text-sm font-extrabold text-emerald-400">+{topGainer.changePct.toFixed(2)}%</div>
          </div>
        )}

        {/* Top loser */}
        {topLoser && (
          <div
            className="rounded-2xl border border-red-500/20 bg-[#0d1117]/90 backdrop-blur-sm px-4 py-3 cursor-pointer hover:border-red-500/40 transition-colors"
            onClick={() => handleCountrySelect(topLoser.countryCode, COUNTRY_INDEX_MAP[topLoser.countryCode]?.name ?? topLoser.countryCode)}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 mb-1">Top Loser</div>
            <div className="text-xs font-bold text-white">{topLoser.indexName}</div>
            <div className="text-sm font-extrabold text-red-400">{topLoser.changePct.toFixed(2)}%</div>
          </div>
        )}
      </div>

      {/* ── LEGEND (bottom) ── */}
      {showLegend && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="rounded-2xl border border-white/8 bg-[#0d1117]/90 backdrop-blur-sm px-5 py-3 flex items-center gap-4">
            <span className="text-[10px] text-white/30 uppercase tracking-widest shrink-0">Daily Change</span>
            {/* Gradient bar */}
            <div className="flex items-center gap-1">
              {LEGEND_STOPS.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <div
                      className="w-8 h-3 rounded"
                      style={{
                        background: `linear-gradient(to right, ${LEGEND_STOPS[i - 1].color}, ${s.color})`
                      }}
                    />
                  )}
                  <span className="text-[10px] tabular-nums" style={{ color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-l border-white/8 pl-3">
              <span className="w-3 h-3 rounded-sm bg-[#374151] border border-white/15" />
              <span className="text-[10px] text-white/30">No Exchange</span>
            </div>
            <button onClick={() => setShowLegend(false)} className="text-white/20 hover:text-white/50 transition-colors text-sm ml-1">×</button>
          </div>
        </div>
      )}

      {/* ── BOTTOM RIGHT CONTROLS ── */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="rounded-xl border border-white/8 bg-[#0d1117]/90 backdrop-blur-sm px-3 py-2 text-[10px] text-white/40 hover:text-white transition-colors"
          >
            Show Legend
          </button>
        )}
        <a
          href="/"
          className="rounded-xl border border-white/8 bg-[#0d1117]/90 backdrop-blur-sm px-3 py-2 text-[10px] text-white/40 hover:text-white transition-colors text-center"
        >
          ← WealthClaude
        </a>
      </div>

      {/* ── MOBILE HINT ── */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none sm:hidden">
        <div className="text-[10px] text-white/20 text-center">Pinch to zoom · Drag to rotate · Tap a country</div>
      </div>

      {/* ── SIDE PANEL ── */}
      <div className="z-50">
        <CountryPanel
          data={selectedData}
          countryName={selectedName}
          onClose={() => handleCountrySelect(null, null)}
        />
      </div>
    </div>
  )
}
