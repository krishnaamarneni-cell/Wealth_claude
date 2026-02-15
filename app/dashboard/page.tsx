"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Clock
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import PortfolioChart from "@/components/portfolio-chart"
import MarketMovers from "@/components/market-movers"
import SectorPerformance from "@/components/sector-performance"
import { usePortfolio } from "@/lib/portfolio-context"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00%'
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="h-20 bg-secondary rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-secondary rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-secondary rounded-lg animate-pulse" />
      <div className="h-96 bg-secondary rounded-lg animate-pulse" />
      <div className="h-96 bg-secondary rounded-lg animate-pulse" />
    </div>
  )
}

// Main dashboard content component
function DashboardContent() {
  const {
    holdings,
    portfolioValue: totalPortfolioValue,
    totalCost,
    totalGain,
    totalGainPercent,
    performance,
    isLoading
  } = usePortfolio()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const todayGain = performance.todayReturn.value
  const todayGainPercent = performance.todayReturn.percent
  const unrealizedGains = totalGain

  const topGainers = [...holdings]
    .sort((a, b) => b.totalGainPercent - a.totalGainPercent)
    .slice(0, 3)
    
  const topLosers = [...holdings]
    .sort((a, b) => a.totalGainPercent - b.totalGainPercent)
    .slice(0, 3)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ==================== HERO SECTION ==================== */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-1">Total Portfolio Value</p>
          <h1 className="text-4xl font-bold">{formatCurrency(totalPortfolioValue)}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`flex items-center gap-1 ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalGain >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatCurrency(totalGain)} ({formatPercent(totalGainPercent)})
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: today
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/transactions">Add Transaction</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/performance">View Performance</Link>
          </Button>
        </div>
      </div>

      {/* ==================== QUICK STATS ROW ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className={`text-xl font-bold ${todayGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(todayGain)}
                </p>
                <p className="text-xs text-muted-foreground">{formatPercent(todayGainPercent)}</p>
              </div>
              <div className={`p-2 rounded-full ${todayGain >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {todayGain >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unrealized Gains</p>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(unrealizedGains)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Holdings</p>
                <p className="text-xl font-bold text-blue-500">{holdings.length}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/10">
                <PiggyBank className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
              <div className="p-2 rounded-full bg-secondary">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== INTERACTIVE PORTFOLIO CHART ==================== */}
      <PortfolioChart />

      {/* ==================== MARKET MOVERS ==================== */}
      <MarketMovers />

      {/* ==================== SECTOR PERFORMANCE ==================== */}
      <SectorPerformance />

      {/* ==================== YOUR TOP GAINERS & LOSERS ==================== */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Your Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topGainers.length > 0 ? (
              topGainers.map((holding) => (
                <div 
                  key={holding.symbol} 
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {holding.logo ? (
                        <Image 
                          src={holding.logo} 
                          alt={holding.symbol} 
                          width={32} 
                          height={32} 
                          unoptimized 
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{holding.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(holding.marketValue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      +{formatPercent(holding.totalGainPercent)}
                    </p>
                    <p className="text-xs text-green-500">
                      {formatCurrency(holding.totalGain)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No gainers yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Your Underperformers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topLosers.length > 0 ? (
              topLosers.map((holding) => (
                <div 
                  key={holding.symbol} 
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {holding.logo ? (
                        <Image 
                          src={holding.logo} 
                          alt={holding.symbol} 
                          width={32} 
                          height={32} 
                          unoptimized 
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{holding.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(holding.marketValue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${holding.totalGainPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercent(holding.totalGainPercent)}
                    </p>
                    <p className={`text-xs ${holding.totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(holding.totalGain)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No underperformers
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== QUICK HOLDINGS OVERVIEW ==================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Holdings Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/holdings">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {holdings.slice(0, 8).map((holding) => (
              <div 
                key={holding.symbol} 
                className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {holding.logo ? (
                        <Image 
                          src={holding.logo} 
                          alt={holding.symbol} 
                          width={24} 
                          height={24} 
                          unoptimized 
                        />
                      ) : (
                        <span className="text-[10px] font-bold">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-sm">{holding.symbol}</span>
                  </div>
                  <span className={`text-xs ${holding.todayGainPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(holding.todayGainPercent)}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      {formatCurrency(holding.currentPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {holding.shares} shares
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(holding.marketValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap with initial skeleton until portfolio loads
export default function DashboardPage() {
  return <DashboardContent />
}
