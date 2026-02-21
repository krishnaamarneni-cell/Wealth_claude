"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Info } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

// Static reference S&P 500 sector weights (approximate)
const MARKET_SECTOR_WEIGHTS: Record<string, number> = {
  'Technology': 28.5,
  'Healthcare': 13.2,
  'Financials': 12.8,
  'Consumer Discretionary': 10.5,
  'Communication Services': 8.9,
  'Industrials': 8.4,
  'Consumer Staples': 6.8,
  'Energy': 4.2,
  'Utilities': 2.8,
  'Real Estate': 2.5,
  'Materials': 2.4,
}

// Sector performance (will wire to real sector ETFs later)
const MOCK_SECTOR_PERFORMANCE: Record<string, number> = {
  'Technology': -8.0,
  'Energy': -6.4,
  'Communication Services': -5.5,
  'Consumer Discretionary': -4.0,
  'Financials': -3.5,
  'Industrials': -2.5,
  'Materials': -1.5,
  'Real Estate': 0.5,
  'Healthcare': 1.0,
  'Consumer Staples': 2.0,
  'Utilities': 2.5,
}

const SPY_CACHE_KEY = 'spyTodayCache'
const SPY_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function PortfolioVsMarket() {
  const { holdings, performance } = usePortfolio()

  // Fresh SPY data fetched independently (bypasses 3-hour portfolio cache)
  const [spyPercent, setSpyPercent] = useState<number | null>(null)
  const [spyLoading, setSpyLoading] = useState(true)

  useEffect(() => {
    async function fetchSpy() {
      try {
        // Check short-lived session cache first (5 minutes)
        const cached = sessionStorage.getItem(SPY_CACHE_KEY)
        if (cached) {
          const { value, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < SPY_CACHE_DURATION) {
            setSpyPercent(value)
            setSpyLoading(false)
            return
          }
        }

        const res = await fetch('/api/stock-info?symbol=SPY')
        if (res.ok) {
          const data = await res.json()
          // Try changePercent first, then returns['1D']
          const pct =
            (typeof data.changePercent === 'number' && data.changePercent !== 0)
              ? data.changePercent
              : (data.returns?.['1D'] ?? 0)

          setSpyPercent(pct)
          sessionStorage.setItem(SPY_CACHE_KEY, JSON.stringify({ value: pct, timestamp: Date.now() }))
        }
      } catch (e) {
        console.error('[PortfolioVsMarket] Failed to fetch SPY:', e)
      } finally {
        setSpyLoading(false)
      }
    }

    fetchSpy()
  }, [])

  // Your portfolio's today performance (real, from holdings)
  const yourPerformance = performance.todayReturn.percent || 0

  // Market performance — fresh SPY fetch, fallback to 0 while loading
  const marketPerformance = spyPercent ?? 0

  // Outperformance
  const outperformance = yourPerformance - marketPerformance
  const didOutperform = outperformance > 0

  // Your real sector allocation
  const yourSectorAllocation: Record<string, number> = {}
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

  holdings.forEach(holding => {
    const sector = holding.sector || 'Other'
    yourSectorAllocation[sector] = (yourSectorAllocation[sector] || 0) +
      (holding.marketValue / totalValue) * 100
  })

  // Allocation differences vs S&P 500 reference weights
  const allocationDifferences = Object.keys(MARKET_SECTOR_WEIGHTS)
    .map(sector => {
      const yourWeight = yourSectorAllocation[sector] || 0
      const marketWeight = MARKET_SECTOR_WEIGHTS[sector] || 0
      const diff = yourWeight - marketWeight
      const sectorPerf = MOCK_SECTOR_PERFORMANCE[sector] || 0
      return {
        sector,
        yourWeight,
        marketWeight,
        diff,
        sectorPerf,
        impact: diff * sectorPerf / 100,
      }
    })
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  const topReasons = allocationDifferences.slice(0, 3)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Your Portfolio vs Market Today
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How your allocation affected performance vs S&P 500
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Performance Comparison */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Market (SPY) */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Market (S&P 500 / SPY)</p>
            {spyLoading ? (
              <div className="h-9 w-24 bg-secondary animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-2">
                {marketPerformance >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-3xl font-bold ${marketPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(marketPerformance)}
                </span>
              </div>
            )}
          </div>

          {/* Your Portfolio */}
          <div className={`p-4 rounded-lg border-2 ${yourPerformance >= 0
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
            }`}>
            <p className="text-sm text-muted-foreground mb-1">Your Portfolio</p>
            <div className="flex items-center gap-2">
              {yourPerformance >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-3xl font-bold ${yourPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(yourPerformance)}
              </span>
            </div>
          </div>
        </div>

        {/* Outperformance Banner */}
        {!spyLoading && (
          <div className={`p-4 rounded-lg border-2 ${didOutperform
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-orange-500/10 border-orange-500/30'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${didOutperform ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                {didOutperform ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">
                  {didOutperform ? (
                    <span className="text-green-500">
                      🎯 You Outperformed by {formatPercent(Math.abs(outperformance))}
                    </span>
                  ) : (
                    <span className="text-orange-500">
                      📉 You Underperformed by {formatPercent(Math.abs(outperformance))}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {didOutperform
                    ? "Your sector allocation helped you beat the market today."
                    : "Market headwinds affected your holdings more than average."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Why? Sector Allocation Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <h4 className="font-bold text-base">Why? Key allocation differences:</h4>
          </div>

          {topReasons.map((reason) => {
            const isOverweight = reason.diff > 0
            const helpedOrHurt =
              (isOverweight && reason.sectorPerf > 0) || (!isOverweight && reason.sectorPerf < 0)

            return (
              <div
                key={reason.sector}
                className="p-4 rounded-lg bg-secondary/30 border border-border"
              >
                {/* Top row: sector name + badge + sector perf */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{reason.sector}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isOverweight
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                      }`}>
                      {isOverweight ? 'Overweight' : 'Underweight'}
                    </span>
                  </div>
                  <span className={`text-base font-bold ${reason.sectorPerf >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(reason.sectorPerf)}
                  </span>
                </div>

                {/* Bottom row: allocation details + helped/hurt */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    You:{' '}
                    <span className="font-semibold text-foreground">
                      {reason.yourWeight.toFixed(1)}%
                    </span>
                    {' '}vs Market:{' '}
                    <span className="font-semibold text-foreground">
                      {reason.marketWeight.toFixed(1)}%
                    </span>
                    <span className={`ml-2 font-bold ${Math.abs(reason.diff) > 5 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      ({reason.diff > 0 ? '+' : ''}{reason.diff.toFixed(1)}% diff)
                    </span>
                  </span>
                  <span className={`text-sm font-bold ${helpedOrHurt ? 'text-green-500' : 'text-red-500'}`}>
                    {helpedOrHurt ? '✓ Helped' : '✗ Hurt'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Bottom line:</strong>{' '}
            {didOutperform ? (
              <>
                Your overweight positions in more defensive sectors and underweight in
                more volatile growth sectors helped your portfolio relative to the market today.
              </>
            ) : (
              <>
                Your portfolio was hit harder than the market due to higher exposure to
                sectors that underperformed today. Consider rebalancing if this pattern continues.
              </>
            )}
          </p>
        </div>

      </CardContent>
    </Card>
  )
}
