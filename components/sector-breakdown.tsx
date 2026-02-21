"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react"

interface Sector {
  name: string
  symbol: string
  price: number
  change: number
  changePercent: number
}

function LoadingSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />
        ))}
      </CardContent>
    </Card>
  )
}

export default function SectorBreakdown() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isExpanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(data => {
        setSectors(data.sectors ?? [])
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || sectors.length === 0) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center text-muted-foreground">
        Unable to load sector data
      </CardContent>
    </Card>
  )

  // Sort worst → best
  const sorted = [...sectors].sort((a, b) => a.changePercent - b.changePercent)
  const losers = sorted.filter(s => s.changePercent < 0)
  const winners = sorted.filter(s => s.changePercent >= 0).reverse()

  const displayed = isExpanded
    ? sorted
    : [...losers.slice(0, 3), ...winners.slice(0, 3)].sort((a, b) => a.changePercent - b.changePercent)

  // Offensive vs Defensive sentiment
  const offensive = ['Technology', 'Consumer Discretionary', 'Financials', 'Energy', 'Communication Services']
  const defensive = ['Healthcare', 'Utilities', 'Consumer Staples', 'Real Estate']

  const avg = (names: string[]) => {
    const matches = sectors.filter(s => names.includes(s.name))
    if (!matches.length) return 0
    return matches.reduce((sum, s) => sum + s.changePercent, 0) / matches.length
  }

  const offAvg = avg(offensive)
  const defAvg = avg(defensive)
  const isRiskOn = offAvg > defAvg

  // Get S&P 500 proxy from SPY
  const spyInSectors = sectors.find(s => s.symbol === 'SPY')

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              📊 Stock Sector Breakdown
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              S&P 500 sector ETF performance today
            </p>
          </div>

          {/* Offensive vs Defensive */}
          <div className="flex gap-3 text-sm">
            <div className={`px-3 py-2 rounded-lg border ${offAvg >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <p className="text-xs text-muted-foreground">Offensive Sectors</p>
              <p className={`font-bold ${offAvg >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {offAvg >= 0 ? '+' : ''}{offAvg.toFixed(2)}%
              </p>
            </div>
            <div className={`px-3 py-2 rounded-lg border ${defAvg >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <p className="text-xs text-muted-foreground">Defensive Sectors</p>
              <p className={`font-bold ${defAvg >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {defAvg >= 0 ? '+' : ''}{defAvg.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Sentiment indicator */}
        <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Market Sentiment:</p>
          <p className="text-sm font-semibold">
            {isRiskOn
              ? <><span className="text-green-500">✅ Risk-On</span> — Investors rotating into growth sectors (tech, discretionary, financials)</>
              : <><span className="text-red-500">⚠️ Risk-Off</span> — Investors rotating into defensive sectors (utilities, staples, healthcare)</>
            }
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {displayed.map(sector => {
            const isPos = sector.changePercent >= 0
            return (
              <div
                key={sector.symbol}
                className="p-4 rounded-lg border bg-secondary/30 border-border hover:bg-secondary/60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{sector.name}</span>
                      <span className="text-xs text-muted-foreground">({sector.symbol})</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      ${sector.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {isPos
                        ? <TrendingUp className="h-4 w-4 text-green-500" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />
                      }
                      <span className={`font-bold text-lg ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                        {isPos ? '+' : ''}{sector.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <p className={`text-xs ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                      {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Button variant="outline" className="w-full" onClick={() => setExpanded(!isExpanded)}>
          {isExpanded
            ? <><ChevronUp className="h-4 w-4 mr-2" />Show Less</>
            : <><ChevronDown className="h-4 w-4 mr-2" />Show All {sectors.length} Sectors</>
          }
        </Button>

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
