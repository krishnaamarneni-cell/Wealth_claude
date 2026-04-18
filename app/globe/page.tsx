"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { getMockMarketData, type MarketDataMap } from "@/lib/mockData"
import { COUNTRY_INDEX_MAP } from "@/lib/countryIndexMap"
import { pctToColor, pctToTextClass, LEGEND_STOPS } from "@/lib/colorScale"
import { CountryPanel } from "@/components/CountryPanel"
import { TradingViewHeatmap } from "@/components/heatmaps-section"

type ViewMode = "globe" | "map" | "heatmap"
type HeatmapSource = "SPX500" | "NASDAQ100" | "CRYPTO"

// Dynamic imports — both require browser APIs
const GlobeWrapper = dynamic(
  () => import("@/components/GlobeWrapper").then(m => ({ default: m.GlobeWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#060a10]">
        <div className="text-white/30 text-sm tracking-widest uppercase animate-pulse">Initializing Globe…</div>
      </div>
    ),
  }
)

const FlatMapWrapper = dynamic(
  () => import("@/components/FlatMapWrapper").then(m => ({ default: m.FlatMapWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#060a10]">
        <div className="text-white/30 text-sm tracking-widest uppercase animate-pulse">Loading Map…</div>
      </div>
    ),
  }
)

export default function GlobePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("globe")
  const [heatmapSource, setHeatmapSource] = useState<HeatmapSource>("SPX500")
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [today, setToday] = useState("")

  const [marketState, setMarketState] = useState<{
    data: MarketDataMap
    fetchedAt: string | null
    isLive: boolean
    isLoading: boolean
  }>({
    data: getMockMarketData(),
    fetchedAt: null,
    isLive: false,
    isLoading: true,
  })

  const marketData = marketState.data

  useEffect(() => {
    const load = async () => {
      const { fetchMarketData } = await import("@/lib/marketDataFetcher")
      const result = await fetchMarketData()
      setMarketState({
        data: result.data,
        fetchedAt: result.fetchedAt,
        isLive: result.isLive,
        isLoading: false,
      })
    }
    load()
    const interval = setInterval(load, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const selectedData = selectedCountry ? marketData[selectedCountry] ?? null : null

  const handleCountrySelect = (iso: string | null, name: string | null) => {
    setSelectedCountry(iso)
    setSelectedName(name)
  }

  const countries = Object.values(marketData)
  const gainers = countries.filter(c => c.changePct > 0).length
  const losers = countries.filter(c => c.changePct < 0).length
  const topGainer = [...countries].sort((a, b) => b.changePct - a.changePct)[0]
  const topLoser = [...countries].sort((a, b) => a.changePct - b.changePct)[0]

  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    }))
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-black" />

      {/* Globe (always mounted, hidden when map or heatmap active) */}
      <div
        className="absolute inset-0 z-10"
        style={{
          height: "100vh",
          width: "100vw",
          visibility: viewMode === "globe" ? "visible" : "hidden",
          pointerEvents: viewMode === "globe" ? "auto" : "none",
        }}
      >
        <GlobeWrapper
          marketData={marketData}
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
          showShips={false}
        />
      </div>

      {/* Flat map (only rendered when active) */}
      {viewMode === "map" && (
        <div className="absolute inset-0 z-10" style={{ height: "100vh", width: "100vw" }}>
          <FlatMapWrapper
            marketData={marketData}
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
          />
        </div>
      )}

      {/* Heat map (only rendered when active) */}
      {viewMode === "heatmap" && (
        <div className="absolute inset-0 z-10 pt-20 px-4 pb-4" style={{ height: "100vh", width: "100vw" }}>
          {/* Heatmap source tabs */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center rounded-full border border-white/10 bg-[#0d1117]/90 backdrop-blur-sm p-0.5">
            {(["SPX500", "NASDAQ100", "CRYPTO"] as HeatmapSource[]).map((src) => (
              <button
                key={src}
                onClick={() => setHeatmapSource(src)}
                className={`text-[11px] rounded-full px-4 py-1.5 transition-all ${
                  heatmapSource === src
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {src === "SPX500" ? "S&P 500" : src === "NASDAQ100" ? "Nasdaq 100" : "Crypto"}
              </button>
            ))}
          </div>

          <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
            {(["SPX500", "NASDAQ100", "CRYPTO"] as HeatmapSource[]).map((src) => (
              <div
                key={src}
                style={{
                  display: heatmapSource === src ? "block" : "none",
                  width: "100%",
                  height: "100%",
                }}
              >
                <TradingViewHeatmap dataSource={src} height={900} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4">

          {/* Logo */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-base">
              🌍
            </div>
            <div>
              <div className="text-sm font-extrabold text-white leading-none">Global Stock Globe</div>
              <div className="text-[10px] text-white/30 mt-0.5">by WealthClaude</div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 pointer-events-auto">

            {/* Globe / Map / Heat Map toggle */}
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
              <button
                onClick={() => setViewMode("globe")}
                className={`flex items-center gap-1.5 text-[10px] rounded-full px-3 py-1.5 transition-all ${viewMode === "globe"
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/30 hover:text-white/60"
                  }`}
              >
                <span className="text-sm">🌍</span>
                Globe
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 text-[10px] rounded-full px-3 py-1.5 transition-all ${viewMode === "map"
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/30 hover:text-white/60"
                  }`}
              >
                <span className="text-sm">🗺️</span>
                Map
              </button>
              <button
                onClick={() => setViewMode("heatmap")}
                className={`flex items-center gap-1.5 text-[10px] rounded-full px-3 py-1.5 transition-all ${viewMode === "heatmap"
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/30 hover:text-white/60"
                  }`}
              >
                <span className="text-sm">🔥</span>
                Heat Map
              </button>
            </div>

            {/* Live data indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${marketState.isLoading
                  ? "bg-amber-400 animate-pulse"
                  : marketState.isLive
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`} />
              {marketState.isLoading ? "Loading Data…" : marketState.isLive ? "Live Data" : "Mock Data"}
            </div>

            {marketState.fetchedAt && (
              <div className="text-[10px] text-white/20 hidden md:block">
                Updated {new Date(marketState.fetchedAt).toLocaleTimeString()}
              </div>
            )}
            <div className="text-[10px] text-white/25 hidden md:block">{today}</div>
          </div>
        </div>
      </div>

      {/* LEFT STATS BAR (hidden on heatmap) */}
      {viewMode !== "heatmap" && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
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

        {topGainer && (
          <div
            className="rounded-2xl border border-emerald-500/20 bg-[#0d1117]/90 backdrop-blur-sm px-4 py-3 cursor-pointer hover:border-emerald-500/40 transition-colors"
            onClick={() => handleCountrySelect(
              topGainer.countryCode,
              COUNTRY_INDEX_MAP[topGainer.countryCode]?.name ?? topGainer.countryCode
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-1">Top Gainer</div>
            <div className="text-xs font-bold text-white">{topGainer.indexName}</div>
            <div className="text-sm font-extrabold text-emerald-400">+{topGainer.changePct.toFixed(2)}%</div>
          </div>
        )}

        {topLoser && (
          <div
            className="rounded-2xl border border-red-500/20 bg-[#0d1117]/90 backdrop-blur-sm px-4 py-3 cursor-pointer hover:border-red-500/40 transition-colors"
            onClick={() => handleCountrySelect(
              topLoser.countryCode,
              COUNTRY_INDEX_MAP[topLoser.countryCode]?.name ?? topLoser.countryCode
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 mb-1">Top Loser</div>
            <div className="text-xs font-bold text-white">{topLoser.indexName}</div>
            <div className="text-sm font-extrabold text-red-400">{topLoser.changePct.toFixed(2)}%</div>
          </div>
        )}
      </div>
      )}

      {/* LEGEND (hidden on heatmap) */}
      {viewMode !== "heatmap" && showLegend && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="rounded-2xl border border-white/8 bg-[#0d1117]/90 backdrop-blur-sm px-5 py-3 flex items-center gap-4">
            <span className="text-[10px] text-white/30 uppercase tracking-widest shrink-0">Daily Change</span>
            <div className="flex items-center gap-1">
              {LEGEND_STOPS.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <div
                      className="w-8 h-3 rounded"
                      style={{
                        background: `linear-gradient(to right, ${LEGEND_STOPS[i - 1].color}, ${s.color})`,
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
            <button
              onClick={() => setShowLegend(false)}
              className="text-white/20 hover:text-white/50 transition-colors text-sm ml-1"
            >×</button>
          </div>
        </div>
      )}

      {/* BOTTOM RIGHT CONTROLS */}
      <div
        style={{ position: "fixed", bottom: "24px", right: "16px", zIndex: 9999 }}
        className="flex flex-col gap-2 pointer-events-auto"
      >
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
        {viewMode === "globe" && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("skipGlobeIntro"))}
            className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-sm px-3 py-2 text-[10px] text-white/50 hover:text-white hover:border-white/40 transition-all tracking-widest uppercase"
          >
            Skip Intro →
          </button>
        )}
      </div>

      {/* MOBILE HINT */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none sm:hidden">
        <div className="text-[10px] text-white/20 text-center">
          {viewMode === "globe"
            ? "Pinch to zoom · Drag to rotate · Tap a country"
            : "Pinch to zoom · Drag to pan · Tap a country"}
        </div>
      </div>

      {/* SIDE PANEL */}
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
