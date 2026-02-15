"use client"

import { ArrowDown, ArrowUp, TrendingUp, DollarSign, Percent, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { portfolioSummary, keyStats } from "@/lib/portfolio-data"
import { cn } from "@/lib/utils"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function PortfolioSummary() {
  const isPositive = portfolioSummary.totalGain >= 0
  const isTodayPositive = portfolioSummary.todayChange >= 0

  return (
    <div className="space-y-6">
      {/* Main Portfolio Value */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Portfolio Value</p>
            <p className="text-4xl font-bold tracking-tight text-foreground">
              {formatCurrency(portfolioSummary.totalValue)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <div className={cn("flex items-center gap-1", isTodayPositive ? "text-primary" : "text-destructive")}>
                {isTodayPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span>{formatCurrency(Math.abs(portfolioSummary.todayChange))}</span>
                <span>({formatPercent(portfolioSummary.todayChangePercent)})</span>
                <span className="text-muted-foreground">TODAY</span>
              </div>
              <div className={cn("flex items-center gap-1", portfolioSummary.yesterdayChange >= 0 ? "text-primary" : "text-destructive")}>
                {portfolioSummary.yesterdayChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span>{formatCurrency(Math.abs(portfolioSummary.yesterdayChange))}</span>
                <span>({formatPercent(portfolioSummary.yesterdayChangePercent)})</span>
                <span className="text-muted-foreground">YESTERDAY</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Last Updated: {portfolioSummary.lastUpdated}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain</CardTitle>
            <TrendingUp className={cn("h-4 w-4", isPositive ? "text-primary" : "text-destructive")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", isPositive ? "text-primary" : "text-destructive")}>
              {formatCurrency(portfolioSummary.totalGain)}
            </div>
            <p className={cn("text-xs", isPositive ? "text-primary" : "text-destructive")}>
              {formatPercent(portfolioSummary.totalGainPercent)} All-Time
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized Gains</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              +{formatCurrency(portfolioSummary.unrealizedGains)}
            </div>
            <p className="text-xs text-muted-foreground">Paper profit on holdings</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Realized Gains</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              +{formatCurrency(portfolioSummary.realizedGains)}
            </div>
            <p className="text-xs text-muted-foreground">Profit from closed positions</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dividends</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              +{formatCurrency(portfolioSummary.dividends)}
            </div>
            <p className="text-xs text-muted-foreground">Total dividends received</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Gains & Costs Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unrealized Gains</span>
              <span className="font-medium text-primary">+{formatCurrency(portfolioSummary.unrealizedGains)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Realized Gains</span>
              <span className="font-medium text-primary">+{formatCurrency(portfolioSummary.realizedGains)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dividends</span>
              <span className="font-medium text-primary">+{formatCurrency(portfolioSummary.dividends)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interests</span>
              <span className="font-medium text-primary">+{formatCurrency(portfolioSummary.interests)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fees</span>
              <span className="font-medium text-destructive">{formatCurrency(portfolioSummary.fees)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-medium text-foreground">{formatCurrency(portfolioSummary.taxes)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Key Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">All-Time High</span>
              <span className="font-medium text-foreground">{formatCurrency(keyStats.allTimeHigh)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">52-Week High</span>
              <span className="font-medium text-foreground">{formatCurrency(keyStats.weekHigh52)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dividend Yield</span>
              <span className="font-medium text-foreground">{keyStats.dividendYield}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-destructive">{keyStats.maxDrawdown}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Drawdown Duration</span>
              <span className="font-medium text-foreground">{keyStats.maxDrawdownDuration} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span className="font-medium text-foreground">{keyStats.sharpeRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beta</span>
              <span className="font-medium text-foreground">{keyStats.beta}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
