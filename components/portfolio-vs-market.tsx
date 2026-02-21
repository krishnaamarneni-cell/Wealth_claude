"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Info } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

// Static reference S&P 500 sector weights (approximate, doesn't change daily)
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

// Mock sector performance today (will wire to real sector ETFs later)
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

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default function PortfolioVsMarket() {
  const { holdings, performance, benchmarks } = usePortfolio()

  // Your portfolio's today performance (real)
  const yourPerformance = performance.todayReturn.percent || 0

  // Market performance (S&P 500) – real from Finnhub via PortfolioContext
  const marketTodayPercent =
    benchmarks?.allBenchmarks?.spy?.changePercent ??
    benchmarks?.allBenchmarks?.spy?.returns?.['1D'] ??
    0

  const marketPerformance = marketTodayPercent

  // Calculate outperformance
  const outperformance = yourPerformance - marketPerformance
  const didOutperform = outperformance > 0

  // Calculate your sector allocation (real)
  const yourSectorAllocation: Record<string, number> = {}
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

  holdings.forEach(holding => {
    const sector = holding.sector || 'Other'
    if (!yourSectorAllocation[sector]) {
      yourSectorAllocation[sector] = 0
    }
    yourSectorAllocation[sector] += (holding.marketValue / totalValue) * 100
  })

  // Find key differences in allocation
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
        impact: diff * sectorPerf / 100 // How this allocation diff impacted your performance
      }
    })
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  // Top 3 reasons for outperformance/underperformance
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
          {/* Market Performance */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Market (S&P 500)</p>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">
                {formatPercent(marketPerformance)}
              </span>
            </div>
          </div>

          {/* Your Portfolio Performance */}
          <div className={`p-4 rounded-lg border-2 ${yourPerformance >= 0
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
            }`}>
            <p className="text-xs text-muted-foreground mb-1">Your Portfolio</p>
            <div className="flex items-center gap-2">
              {yourPerformance >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-2xl font-bold ${yourPerformance >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                {formatPercent(yourPerformance)}
              </span>
            </div>
          </div>
        </div>

        {/* Outperformance Banner */}
        <div className={`p-4 rounded-lg border-2 ${didOutperform
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-orange-500/10 border-orange-500/30'
          }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${didOutperform ? 'bg-green-500/20' : 'bg-orange-500/20'
              }`}>
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

        {/* Why? Sector Allocation Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <h4 className="font-semibold text-sm">Why? Key allocation differences:</h4>
          </div>

          {topReasons.map((reason) => {
            const isOverweight = reason.diff > 0
            const helpedOrHurt = (isOverweight && reason.sectorPerf > 0) || (!isOverweight && reason.sectorPerf < 0)

            return (
              <div
                key={reason.sector}
                className="p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{reason.sector}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isOverweight
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-purple-500/20 text-purple-500'
                      }`}>
                      {isOverweight ? 'Overweight' : 'Underweight'}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${reason.sectorPerf >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {formatPercent(reason.sectorPerf)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    You: {reason.yourWeight.toFixed(1)}% vs Market: {reason.marketWeight.toFixed(1)}%
                    <span className={`ml-2 font-semibold ${Math.abs(reason.diff) > 5 ? 'text-foreground' : ''
                      }`}>
                      ({reason.diff > 0 ? '+' : ''}{reason.diff.toFixed(1)}% diff)
                    </span>
                  </span>
                  <span className={helpedOrHurt ? 'text-green-500' : 'text-red-500'}>
                    {helpedOrHurt ? '✓ Helped' : '✗ Hurt'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
          <p className="text-muted-foreground">
            <strong>Bottom line:</strong>{' '}
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
