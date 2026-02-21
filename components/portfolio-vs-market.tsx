"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export default function PortfolioVsMarket() {
  const { performance } = usePortfolio()
  const [spyPercent, setSpyPercent] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Fetch SPY data
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const spyRes = await fetch(`/api/stock-info?symbol=SPY&t=${Date.now()}`, { cache: 'no-store' })
        if (spyRes.ok) {
          const spyJson = await spyRes.json()
          const pct = typeof spyJson.changePercent === 'number' && spyJson.changePercent !== 0
            ? spyJson.changePercent
            : (spyJson.returns?.['1D'] ?? 0)
          setSpyPercent(pct)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const yourPerformance = performance.todayReturn.percent || 0
  const outperformance = yourPerformance - spyPercent
  const didOutperform = outperformance > 0

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-5 w-5" />
          Portfolio vs Market (1D)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-20 bg-secondary rounded animate-pulse" />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">Your Portfolio</span>
              <span className={`font-semibold ${yourPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(yourPerformance)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">S&P 500 (SPY)</span>
              <span className={`font-semibold ${spyPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(spyPercent)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold text-foreground">
                {didOutperform ? '🎯 Outperformance' : '📉 Underperformance'}
              </span>
              <span className={`text-lg font-bold ${didOutperform ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(Math.abs(outperformance))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
