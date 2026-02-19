'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Zap, Target, PieChart } from "lucide-react"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings } from "@/lib/holdings-calculator"
import { useState, useEffect } from "react"

interface Holding {
  symbol: string
  shares: number
  averageCost: number
  value: number
  gain: number
  gainPercent: number
}

interface PortfolioMetrics {
  totalReturn: number
  totalReturnPercent: number
  winRate: number
  totalHoldings: number
  winningPositions: number
  losingPositions: number
  largestHolding: Holding | null
  topPerformers: Holding[]
  worstPerformers: Holding[]
  concentration: number
  recommendations: string[]
}

function calculateMetrics(holdings: Holding[]): PortfolioMetrics {
  if (holdings.length === 0) {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      winRate: 0,
      totalHoldings: 0,
      winningPositions: 0,
      losingPositions: 0,
      largestHolding: null,
      topPerformers: [],
      worstPerformers: [],
      concentration: 0,
      recommendations: ["Add transactions to start tracking your portfolio performance"],
    }
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.averageCost * h.shares, 0)
  const totalReturn = totalValue - totalCost
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

  const winningPositions = holdings.filter(h => h.gainPercent > 0).length
  const losingPositions = holdings.filter(h => h.gainPercent < 0).length
  const winRate = holdings.length > 0 ? (winningPositions / holdings.length) * 100 : 0

  const largestHolding = holdings.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  )

  const sortedByGain = [...holdings].sort((a, b) => (b.gainPercent ?? 0) - (a.gainPercent ?? 0))
  const topPerformers = sortedByGain.slice(0, 3)
  const worstPerformers = sortedByGain.slice(-3).reverse()

  const concentration = totalValue > 0 ? (largestHolding.value / totalValue) * 100 : 0

  // Generate recommendations
  const recommendations: string[] = []
  
  if (concentration > 30) {
    recommendations.push(`Your largest position (${largestHolding.symbol}) represents ${concentration.toFixed(1)}% of your portfolio. Consider diversifying to reduce risk.`)
  }
  
  if (winRate < 50 && holdings.length > 5) {
    recommendations.push(`Only ${winRate.toFixed(0)}% of your positions are profitable. Review your losing positions for potential exit opportunities.`)
  }
  
  if (totalReturnPercent > 20) {
    recommendations.push(`Your portfolio is up ${totalReturnPercent.toFixed(1)}%! Consider taking some profits or rebalancing.`)
  }
  
  if (totalReturnPercent < -10) {
    recommendations.push(`Your portfolio is down ${Math.abs(totalReturnPercent).toFixed(1)}%. Review your strategy and consider if changes are needed.`)
  }

  if (holdings.length < 5) {
    recommendations.push(`You have ${holdings.length} holding(s). Diversifying across more positions can help reduce portfolio volatility.`)
  }

  if (recommendations.length === 0) {
    recommendations.push("Your portfolio is well-balanced. Keep monitoring your positions regularly.")
  }

  return {
    totalReturn,
    totalReturnPercent,
    winRate,
    totalHoldings: holdings.length,
    winningPositions,
    losingPositions,
    largestHolding,
    topPerformers,
    worstPerformers,
    concentration,
    recommendations,
  }
}

export default function InsightsPage() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true)
        const transactions = getTransactionsFromStorage()
        const holdings = await calculateAndFetchHoldings(transactions)
        
        // Filter out invalid holdings (0 shares or negative values)
        const validHoldings = holdings.filter(h => h.shares > 0 && h.value > 0)
        
        const calculatedMetrics = calculateMetrics(validHoldings)
        setMetrics(calculatedMetrics)
      } catch (error) {
        console.error('Failed to load insights:', error)
        setMetrics(calculateMetrics([]))
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="h-10 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const isPositive = metrics.totalReturnPercent >= 0

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Portfolio Insights</h1>
        <p className="text-muted-foreground mt-1">Real-time analysis of your investment performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.totalReturn)}
              </p>
              <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(metrics.totalReturnPercent)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{metrics.winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                {metrics.winningPositions} winning / {metrics.losingPositions} losing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{metrics.totalHoldings}</p>
              <p className="text-xs text-muted-foreground">Active positions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Winning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">{metrics.winningPositions}</p>
              <p className="text-xs text-muted-foreground">Profitable positions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Losing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-600">{metrics.losingPositions}</p>
              <p className="text-xs text-muted-foreground">Underwater positions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top and Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.topPerformers.length > 0 ? (
              metrics.topPerformers.map((holding) => (
                <div key={holding.symbol} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold text-foreground">{holding.symbol}</p>
                    <p className="text-sm text-muted-foreground">{holding.shares.toFixed(2)} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{holding.gainPercent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(holding.gain)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No winning positions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Worst Performers */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Worst Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.worstPerformers.length > 0 ? (
              metrics.worstPerformers.map((holding) => (
                <div key={holding.symbol} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold text-foreground">{holding.symbol}</p>
                    <p className="text-sm text-muted-foreground">{holding.shares.toFixed(2)} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {holding.gainPercent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(holding.gain)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No losing positions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Position Concentration */}
      {metrics.largestHolding && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5" />
              Position Concentration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Largest Holding</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">{metrics.largestHolding.symbol}</p>
                  <p className="text-sm text-muted-foreground">{metrics.largestHolding.shares.toFixed(2)} shares</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{metrics.concentration.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">of portfolio</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-yellow-500" />
            Portfolio Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {metrics.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="text-yellow-500 flex-shrink-0 mt-1">•</span>
                <p className="text-foreground">{rec}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
