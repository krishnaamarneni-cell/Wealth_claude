"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
} from "lucide-react"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings, type Holding } from "@/lib/holdings-calculator"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "NaN%"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export default function InsightsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const txns = getTransactionsFromStorage()
        if (txns.length > 0) {
          const holdingsData = await calculateAndFetchHoldings(txns)
          setHoldings(holdingsData)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    const txns = getTransactionsFromStorage()
    const holdingsData = await calculateAndFetchHoldings(txns)
    setHoldings(holdingsData)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const insights = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        totalReturn: 0,
        totalReturnAmount: 0,
        winningPositions: 0,
        losingPositions: 0,
        winRate: 0,
        totalHoldings: 0,
        portfolioValue: 0,
        topPerformer: null,
        worstPerformer: null,
        largestPosition: null,
        top3Concentration: 0,
        avgPositionSize: 0,
        bestPeriod: { period: "N/A", return: 0 },
        worstPeriod: { period: "N/A", return: 0 },
        dominantSector: { name: "Unknown", percentage: 0 },
        volatility: 0,
        diversification: "N/A",
      }
    }

    const portfolioValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
    const totalReturn = totalCost > 0 ? ((portfolioValue - totalCost) / totalCost) * 100 : 0
    const totalReturnAmount = portfolioValue - totalCost

    const winningPositions = holdings.filter((h) => h.totalGain > 0).length
    const losingPositions = holdings.filter((h) => h.totalGain < 0).length
    const winRate = holdings.length > 0 ? (winningPositions / holdings.length) * 100 : 0

    const sortedByGain = [...holdings].sort((a, b) => b.totalGainPercent - a.totalGainPercent)
    const topPerformer = sortedByGain[0]
    const worstPerformer = sortedByGain[sortedByGain.length - 1]

    const sortedByAllocation = [...holdings].sort((a, b) => b.allocation - a.allocation)
    const largestPosition = sortedByAllocation[0]
    const top3Concentration = sortedByAllocation.slice(0, 3).reduce((sum, h) => sum + h.allocation, 0)

    const avgPositionSize = portfolioValue / holdings.length

    // Period returns
    const periods = ["1D", "1W", "1M", "3M", "6M", "1Y"]
    const periodReturns = periods.map((p) => ({
      period: p,
      value: holdings.reduce((sum, h) => {
        const weight = h.allocation / 100
        const ret = h.returns?.[p] || 0
        return sum + weight * ret
      }, 0),
    }))
    const bestPeriod = periodReturns.sort((a, b) => b.value - a.value)[0]
    const worstPeriod = periodReturns.sort((a, b) => a.value - b.value)[0]

    // Sector analysis
    const sectorMap = holdings.reduce((acc, h) => {
      const sector = h.sector || "Unknown"
      acc[sector] = (acc[sector] || 0) + h.allocation
      return acc
    }, {} as Record<string, number>)
    const dominantSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0]

    // Volatility (standard deviation of returns)
    const returns = holdings.map((h) => h.totalGainPercent)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance)

    // Diversification score
    const uniqueSectors = Object.keys(sectorMap).length
    const diversification =
      uniqueSectors >= 5 ? "Well diversified" : uniqueSectors >= 3 ? "Concentrated" : "Highly concentrated"

    return {
      totalReturn,
      totalReturnAmount,
      winningPositions,
      losingPositions,
      winRate,
      totalHoldings: holdings.length,
      portfolioValue,
      topPerformer,
      worstPerformer,
      largestPosition,
      top3Holdings: sortedByAllocation.slice(0, 3),
      top3Concentration,
      avgPositionSize,
      bestPeriod,
      worstPeriod,
      dominantSector: { name: dominantSector?.[0] || "Unknown", percentage: dominantSector?.[1] || 0 },
      volatility,
      diversification,
      uniqueSectors,
    }
  }, [holdings])

  const recommendations = useMemo(() => {
    const recs = []

    if (insights.top3Concentration > 60) {
      recs.push({
        type: "warning",
        title: "High Concentration Risk",
        message: `Your top 3 positions make up ${insights.top3Concentration.toFixed(1)}% of your portfolio. Consider diversifying.`,
      })
    }

    if (insights.uniqueSectors < 3) {
      recs.push({
        type: "warning",
        title: "Limited Sector Diversification",
        message: `You're only invested in ${insights.uniqueSectors} sector(s). Consider adding exposure to other sectors.`,
      })
    }

    if (insights.winRate < 40) {
      recs.push({
        type: "alert",
        title: "Low Win Rate",
        message: `Only ${insights.winRate.toFixed(0)}% of your positions are profitable. Review underperforming holdings.`,
      })
    }

    if (insights.volatility > 20) {
      recs.push({
        type: "info",
        title: "High Volatility Portfolio",
        message: `Portfolio volatility is ${insights.volatility.toFixed(1)}%. Consider adding stable, dividend-paying stocks.`,
      })
    }

    if (insights.bestPeriod.value > 15) {
      recs.push({
        type: "success",
        title: "Strong Performance",
        message: `Your ${insights.bestPeriod.period} return of ${formatPercent(insights.bestPeriod.value)} is excellent!`,
      })
    }

    if (recs.length === 0) {
      recs.push({
        type: "success",
        title: "Portfolio Looks Healthy",
        message: "Your portfolio is well-balanced with good diversification and performance.",
      })
    }

    return recs
  }, [insights])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-primary mr-3" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No portfolio data available. Upload transactions to get started.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed analysis of your portfolio performance and composition
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${insights.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(insights.totalReturn)}
              {insights.totalReturn >= 0 ? (
                <TrendingUp className="inline-block ml-2 h-5 w-5" />
              ) : (
                <TrendingDown className="inline-block ml-2 h-5 w-5" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(insights.totalReturnAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.winRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.winningPositions} winning / {insights.losingPositions} losing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diversification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.diversification}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.uniqueSectors} sector{insights.uniqueSectors !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.volatility.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.volatility < 10 ? "Low" : insights.volatility < 20 ? "Moderate" : "High"} volatility
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Position Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(insights.avgPositionSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per holding</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{insights.bestPeriod.period}</div>
            <p className="text-sm font-semibold text-green-600 mt-1">{formatPercent(insights.bestPeriod.value)}</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Worst Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{insights.worstPeriod.period}</div>
            <p className="text-sm font-semibold text-red-600 mt-1">{formatPercent(insights.worstPeriod.value)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dominant Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{insights.dominantSector.name}</div>
            <p className="text-sm font-semibold text-primary mt-1">{insights.dominantSector.percentage.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Top & Bottom Performers + Position Concentration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top & Bottom Performers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>Top & Bottom Performers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Top Performer</p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div>
                  <p className="font-bold text-lg">{insights.topPerformer?.symbol}</p>
                  <p className="text-xs text-muted-foreground">{insights.topPerformer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{formatPercent(insights.topPerformer?.totalGainPercent)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(insights.topPerformer?.totalGain || 0)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Worst Performer</p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div>
                  <p className="font-bold text-lg">{insights.worstPerformer?.symbol}</p>
                  <p className="text-xs text-muted-foreground">{insights.worstPerformer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {formatPercent(insights.worstPerformer?.totalGainPercent)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(insights.worstPerformer?.totalGain || 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Concentration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <CardTitle>Position Concentration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Largest Position</p>
                <Badge variant={insights.largestPosition && insights.largestPosition.allocation > 30 ? "destructive" : "secondary"}>
                  {insights.largestPosition?.allocation.toFixed(1)}%
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{insights.largestPosition?.symbol}</span>
                  <span className="text-muted-foreground">{formatCurrency(insights.largestPosition?.marketValue || 0)}</span>
                </div>
                <Progress value={insights.largestPosition?.allocation || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">of balanced portfolio</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Holdings Breakdown</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Holdings</span>
                  <span className="text-xl font-bold">{insights.totalHoldings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Winning Positions</span>
                  <span className="text-xl font-bold text-green-600">{insights.winningPositions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Losing Positions</span>
                  <span className="text-xl font-bold text-red-600">{insights.losingPositions}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Top 3 Concentration</p>
                <Badge variant={insights.top3Concentration > 60 ? "destructive" : "secondary"}>
                  {insights.top3Concentration.toFixed(1)}%
                </Badge>
              </div>
              <div className="space-y-2">
                {insights.top3Holdings?.map((holding, index) => (
                  <div key={holding.symbol} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <span className="text-sm font-medium flex-1">{holding.symbol}</span>
                    <span className="text-sm text-muted-foreground">{holding.allocation.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle>Recommendations</CardTitle>
          </div>
          <CardDescription>AI-powered insights based on your portfolio analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`flex gap-3 p-4 rounded-lg border ${rec.type === "warning"
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : rec.type === "alert"
                      ? "bg-red-500/10 border-red-500/30"
                      : rec.type === "success"
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-blue-500/10 border-blue-500/30"
                  }`}
              >
                {rec.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                ) : rec.type === "alert" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                ) : rec.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Activity className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{rec.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
