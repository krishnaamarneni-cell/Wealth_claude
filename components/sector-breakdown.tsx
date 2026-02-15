"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react"

interface Sector {
  name: string
  symbol: string
  price: string
  change: number
  changePercent: number
  note?: string
}

// Mock data - represents which sectors led the market move
// This would sync with the Money Flow Dashboard's stock performance
const MOCK_SECTORS: Sector[] = [
  {
    name: 'Technology',
    symbol: 'XLK',
    price: '$185.20',
    change: -14.82,
    changePercent: -8.0,
    note: 'Biggest drag on market'
  },
  {
    name: 'Energy',
    symbol: 'XLE',
    price: '$82.40',
    change: -5.28,
    changePercent: -6.4
  },
  {
    name: 'Communication Services',
    symbol: 'XLC',
    price: '$68.50',
    change: -3.77,
    changePercent: -5.5
  },
  {
    name: 'Consumer Discretionary',
    symbol: 'XLY',
    price: '$172.80',
    change: -6.91,
    changePercent: -4.0
  },
  {
    name: 'Financials',
    symbol: 'XLF',
    price: '$38.50',
    change: -1.35,
    changePercent: -3.5
  },
  {
    name: 'Industrials',
    symbol: 'XLI',
    price: '$115.30',
    change: -2.88,
    changePercent: -2.5
  },
  {
    name: 'Materials',
    symbol: 'XLB',
    price: '$82.90',
    change: -1.24,
    changePercent: -1.5
  },
  {
    name: 'Real Estate',
    symbol: 'XLRE',
    price: '$38.20',
    change: 0.19,
    changePercent: 0.5
  },
  {
    name: 'Healthcare',
    symbol: 'XLV',
    price: '$142.80',
    change: 1.43,
    changePercent: 1.0,
    note: 'Defensive strength'
  },
  {
    name: 'Consumer Staples',
    symbol: 'XLP',
    price: '$75.60',
    change: 1.51,
    changePercent: 2.0,
    note: 'Flight to safety'
  },
  {
    name: 'Utilities',
    symbol: 'XLU',
    price: '$64.20',
    change: 1.60,
    changePercent: 2.5,
    note: 'Safe haven'
  },
]

function formatCurrency(value: string): string {
  return value
}

function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export default function SectorBreakdown() {
  const [isExpanded, setIsExpanded] = useState(false)

  // Split into winners and losers
  const losers = MOCK_SECTORS.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent)
  const winners = MOCK_SECTORS.filter(s => s.changePercent >= 0).sort((a, b) => b.changePercent - a.changePercent)

  // Show top 3 losers and top 3 winners by default
  const displayedSectors = isExpanded
    ? MOCK_SECTORS
    : [...losers.slice(0, 3), ...winners.slice(0, 3)]

  // Calculate offensive vs defensive
  const offensiveSectors = ['Technology', 'Consumer Discretionary', 'Financials', 'Energy', 'Communication Services']
  const defensiveSectors = ['Healthcare', 'Utilities', 'Consumer Staples', 'Real Estate']

  const offensiveAvg = MOCK_SECTORS
    .filter(s => offensiveSectors.includes(s.name))
    .reduce((sum, s) => sum + s.changePercent, 0) / offensiveSectors.length

  const defensiveAvg = MOCK_SECTORS
    .filter(s => defensiveSectors.includes(s.name))
    .reduce((sum, s) => sum + s.changePercent, 0) / defensiveSectors.length

  const marketSentiment = offensiveAvg > defensiveAvg ? 'risk-on' : 'risk-off'

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              📊 Stock Sector Breakdown
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Within S&P 500 (<span className="text-red-500 font-semibold">-5.2%</span> today)
            </p>
          </div>

          {/* Offensive vs Defensive Summary */}
          <div className="flex gap-3 text-sm">
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-muted-foreground">Offensive Sectors</p>
              <p className={`font-bold ${offensiveAvg >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatChange(offensiveAvg)}
              </p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground">Defensive Sectors</p>
              <p className={`font-bold ${defensiveAvg >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatChange(defensiveAvg)}
              </p>
            </div>
          </div>
        </div>

        {/* Market Sentiment Indicator */}
        <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Market Sentiment:</p>
          <p className="text-sm font-semibold">
            {marketSentiment === 'risk-off' ? (
              <>
                <span className="text-red-500">⚠️ Risk-Off</span> — Investors rotating to defensive sectors (utilities, staples, healthcare)
              </>
            ) : (
              <>
                <span className="text-green-500">✅ Risk-On</span> — Strong appetite for growth sectors (tech, discretionary, financials)
              </>
            )}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sector List */}
        <div className="space-y-2">
          {displayedSectors
            .sort((a, b) => a.changePercent - b.changePercent)
            .map((sector) => {
              const isPositive = sector.changePercent >= 0
              const isTop = sector.note !== undefined

              return (
                <div
                  key={sector.symbol}
                  className={`p-4 rounded-lg border transition-all ${isTop
                      ? isPositive
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                      : 'bg-secondary/30 border-border hover:bg-secondary/60'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Sector Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{sector.name}</span>
                        <span className="text-xs text-muted-foreground">({sector.symbol})</span>
                        {sector.note && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border">
                            {sector.note}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{sector.price}</p>
                    </div>

                    {/* Right: Performance */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-bold text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {formatChange(sector.changePercent)}
                        </span>
                      </div>
                      <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show All 11 Sectors
            </>
          )}
        </Button>

        {/* Legend */}
        {isExpanded && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Sector Categories:</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-secondary/30">
                <p className="font-semibold mb-1">🔥 Offensive (Growth)</p>
                <p className="text-muted-foreground">Tech, Consumer Discretionary, Financials, Energy, Communication</p>
              </div>
              <div className="p-2 rounded bg-secondary/30">
                <p className="font-semibold mb-1">🛡️ Defensive (Safety)</p>
                <p className="text-muted-foreground">Healthcare, Utilities, Consumer Staples, Real Estate</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
