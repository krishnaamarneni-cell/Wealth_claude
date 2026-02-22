"use client"

import { useState } from "react"
import { TradingViewHeatmap } from "@/components/heatmaps-section"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Market Config ────────────────────────────────────────────────────────────

const MARKET_GROUPS = [
  {
    region: "🇺🇸 US",
    markets: [
      { label: "S&P 500", dataSource: "SPX500", components: "500 stocks" },
      { label: "NASDAQ 100", dataSource: "NASDAQ100", components: "100 stocks" },
      { label: "Dow Jones", dataSource: "DJ30", components: "30 stocks" },
    ],
  },
  {
    region: "🌍 Europe",
    markets: [
      { label: "FTSE 100", dataSource: "FTSE", components: "100 stocks" },
      { label: "DAX", dataSource: "DAX", components: "40 stocks" },
      { label: "CAC 40", dataSource: "CAC40", components: "40 stocks" },
    ],
  },
  {
    region: "🌏 Asia",
    markets: [
      { label: "Nikkei 225", dataSource: "NIKKEI225", components: "225 stocks" },
      { label: "ASX 200", dataSource: "ASX200", components: "200 stocks" },
      { label: "Hang Seng", dataSource: "HSI", components: "82 stocks" },
      { label: "Nifty 500", dataSource: "NIFTY500", components: "500 stocks" },
    ],
  },
  {
    region: "🪙 Crypto",
    markets: [
      { label: "Crypto", dataSource: "CRYPTO", components: "Top assets" },
    ],
  },
]

// Flatten for easy active lookup
const ALL_MARKETS = MARKET_GROUPS.flatMap((g) => g.markets)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const [activeDataSource, setActiveDataSource] = useState("SPX500")

  const activeMarket =
    ALL_MARKETS.find((m) => m.dataSource === activeDataSource) ?? ALL_MARKETS[0]

  const activeRegion =
    MARKET_GROUPS.find((g) =>
      g.markets.some((m) => m.dataSource === activeDataSource)
    )?.region ?? ""

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Heat Maps</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time market visualization of global indices
        </p>
      </div>

      {/* ── Region + Market Tabs ── */}
      <div className="flex flex-col gap-3">
        {MARKET_GROUPS.map((group) => (
          <div key={group.region} className="flex items-center gap-2 flex-wrap">
            {/* Region Label */}
            <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
              {group.region}
            </span>

            {/* Market Tabs for this region */}
            <div className="flex gap-2 flex-wrap">
              {group.markets.map((market) => {
                const isActive = activeDataSource === market.dataSource
                return (
                  <button
                    key={market.dataSource}
                    onClick={() => setActiveDataSource(market.dataSource)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {market.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
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
              {activeRegion}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Widget */}
        {/* force remount on switch */}
        <TradingViewHeatmap
          key={activeDataSource}
          dataSource={activeDataSource}
          height={620}
        />
      </div>

      {/* ── Bottom Info Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* How to Read */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">How to Read the Heat Map</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-green-600 shrink-0" />
              <span>
                <span className="font-medium text-foreground">Green</span> — Stock is up. Darker = larger gain
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-red-600 shrink-0" />
              <span>
                <span className="font-medium text-foreground">Red</span> — Stock is down. Darker = larger loss
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-muted-foreground/50 shrink-0" />
              <span>
                <span className="font-medium text-foreground">Size</span> — Rectangle size = market cap weight
              </span>
            </li>
          </ul>
        </div>

        {/* Market Overview */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Market Overview</h3>
          <dl className="space-y-1.5 text-sm">
            {[
              { label: "Index", value: activeMarket.label },
              { label: "Region", value: activeRegion },
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
