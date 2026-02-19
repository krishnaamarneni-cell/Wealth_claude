"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Target,
  PieChart,
  BarChart3,
  Zap,
} from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { useState, useEffect } from "react"

export default function InsightsPage() {
  const {
    holdings,
    portfolioValue,
    totalCost,
    totalGain,
    totalGainPercent,
    transactions,
    performance,
  } = usePortfolio()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  // Calculate insights
  const topPerformer = holdings.length > 0
    ? holdings.reduce((prev, current) => {
        const prevGain = prev.gainPercent ?? 0
        const currentGain = current.gainPercent ?? 0
        return prevGain > currentGain ? prev : current
      })
    : null

  const worstPerformer = holdings.length > 0
    ? holdings.reduce((prev, current) => {
        const prevGain = prev.gainPercent ?? 0
        const currentGain = current.gainPercent ?? 0
        return prevGain < currentGain ? prev : current
      })
    : null

  const concentration =
    holdings.length > 0
      ? Math.max(...holdings.map((h) => (h.value / portfolioValue) * 100))
      : 0

  const winningPositions = holdings.filter((h) => (h.gainPercent ?? 0) > 0).length
  const losingPositions = holdings.filter((h) => (h.gainPercent ?? 0) < 0).length

  const volatility = holdings.length > 0
    ? Math.sqrt(
        holdings.reduce((sum, h) => sum + Math.pow((h.gainPercent ?? 0) - totalGainPercent, 2), 0) /
          holdings.length
      )
    : 0

  const diversificationScore = Math.min(
    100,
    Math.round((holdings.length / 10) * 100 + (100 - concentration))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Insights</h1>
        <p className="text-muted-foreground mt-1">
          Detailed analysis of your portfolio performance and composition
        </p>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2">
              <div className="text-2xl font-bold">
                {totalGainPercent >= 0 ? "+" : ""}
                {totalGainPercent.toFixed(2)}%
              </div>
              <div
                className={`text-sm font-medium ${
                  totalGainPercent >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalGainPercent >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ${totalGain >= 0 ? "+" : ""}
              {totalGain.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {holdings.length > 0
                ? Math.round((winningPositions / holdings.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {winningPositions} winning / {losingPositions} losing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diversification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diversificationScore}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {diversificationScore > 75
                ? "Well diversified"
                : diversificationScore > 50
                ? "Moderately diversified"
                : "Concentrated"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volatility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volatility.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {volatility > 20
                ? "High volatility"
                : volatility > 10
                ? "Moderate volatility"
                : "Low volatility"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top & Bottom Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top & Bottom Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformer && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Top Performer</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{topPerformer.symbol}</span>
                  <span className="text-sm font-semibold text-green-600">
                    +{(topPerformer.gainPercent ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {worstPerformer && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-red-600">Worst Performer</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{worstPerformer.symbol}</span>
                  <span className="text-sm font-semibold text-red-600">
                    {(worstPerformer.gainPercent ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {holdings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No holdings to compare
              </p>
            )}
          </CardContent>
        </Card>

        {/* Position Concentration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Position Concentration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Largest Position</span>
                <span className="font-semibold">{concentration.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`bg-primary rounded-full h-2 transition-all ${
                    concentration > 50 ? "bg-yellow-600" : "bg-primary"
                  }`}
                  style={{ width: `${concentration}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {concentration > 50
                  ? "High concentration risk"
                  : "Well balanced portfolio"}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Holdings Breakdown</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Holdings</span>
                  <span className="font-semibold">{holdings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Winning Positions</span>
                  <span className="font-semibold text-green-600">
                    {winningPositions}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Losing Positions</span>
                  <span className="font-semibold text-red-600">
                    {losingPositions}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diversificationScore < 60 && (
            <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-yellow-900 dark:text-yellow-200">
                  Improve Diversification
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-1">
                  Consider expanding into new sectors or positions to reduce concentration risk
                </p>
              </div>
            </div>
          )}

          {concentration > 50 && (
            <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-red-900 dark:text-red-200">
                  High Concentration Risk
                </p>
                <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                  Your largest position represents {concentration.toFixed(1)}% of your portfolio. Consider rebalancing.
                </p>
              </div>
            </div>
          )}

          {totalGainPercent > 20 && (
            <div className="flex gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-green-900 dark:text-green-200">
                  Strong Performance
                </p>
                <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                  Your portfolio is performing well with a {totalGainPercent.toFixed(2)}% return
                </p>
              </div>
            </div>
          )}

          {winningPositions / holdings.length > 0.7 && (
            <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-900 dark:text-blue-200">
                  High Win Rate
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  {((winningPositions / holdings.length) * 100).toFixed(0)}% of your positions are in profit
                </p>
              </div>
            </div>
          )}

          {holdings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add transactions to get personalized recommendations
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
