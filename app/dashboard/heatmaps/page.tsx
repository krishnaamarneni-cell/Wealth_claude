"use client"

import { useState } from "react"
import { TradingViewHeatmap } from "@/components/heatmaps-section"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MARKETS = [
  { label: "S&P 500", dataSource: "SPX500", components: "500 stocks", region: "🇺🇸 US" },
  { label: "NASDAQ 100", dataSource: "NASDAQ100", components: "100 stocks", region: "🇺🇸 US" },
  { label: "Crypto", dataSource: "CRYPTO", components: "Top assets", region: "🪙 Crypto" },
]


export default function HeatmapPage() {
  const [active, setActive] = useState("SPX500")

  const activeMarket = MARKETS.find((m) => m.dataSource === active) ?? MARKETS[0]

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Heat Maps</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time market visualization of major indices
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {MARKETS.map((market) => {
          const isActive = active === market.dataSource
          return (
            <button
              key={market.dataSource}
              onClick={() => setActive(market.dataSource)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all border cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              )}
            >
              {market.label}
            </button>
          )
        })}
      </div>

      {/* ── Heatmap Card ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {activeMarket.label} Heat Map
            </span>
            <Badge variant="outline" className="text-xs">
              {activeMarket.region}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        {/* 
          ALL 4 widgets mount at page load.
          Switching is pure CSS show/hide — no re-render, no caching, guaranteed correct data. 
        */}
        <div style={{ width: "100%" }}>
          {MARKETS.map((market) => (
            <div
              key={market.dataSource}
              style={{
                display: active === market.dataSource ? "block" : "none",
                width: "100%",
              }}
            >
              <TradingViewHeatmap
                dataSource={market.dataSource}
                height={620}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Info Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">How to Read the Heat Map</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-green-600 shrink-0" />
              <span><span className="font-medium text-foreground">Green</span> — Up. Darker = larger gain</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-red-600 shrink-0" />
              <span><span className="font-medium text-foreground">Red</span> — Down. Darker = larger loss</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-muted-foreground/40 shrink-0" />
              <span><span className="font-medium text-foreground">Size</span> — Rectangle = market cap weight</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Market Overview</h3>
          <dl className="space-y-1.5 text-sm">
            {[
              { label: "Index", value: activeMarket.label },
              { label: "Region", value: activeMarket.region },
              { label: "Components", value: activeMarket.components },
              { label: "Data", value: "Real-time" },
              { label: "Grouping", value: "By Sector" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

      </div>
    </div>
  )
}
