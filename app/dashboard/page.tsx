"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Clock,
  Briefcase,
  LineChart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import PortfolioChart from "@/components/portfolio-chart"
import MarketMovers from "@/components/market-movers"
import SectorPerformance from "@/components/sector-performance"
import MarketTicker from "@/components/market-ticker"
import MoneyFlowDashboard from "@/components/money-flow-dashboard"
import SectorBreakdown from "@/components/sector-breakdown"
import PortfolioVsMarket from "@/components/portfolio-vs-market"
import FearGreed from "@/components/fear-greed"
import NewsFeed from "@/components/news-feed"
import { usePortfolio } from "@/lib/portfolio-context"
import { Suspense, useState, useEffect } from "react"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return '0.00%'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

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
    </div>
  )
}

function DashboardContent() {
  const {
    holdings,
    portfolioValue: totalPortfolioValue,
    totalCost,
    totalGain,
    totalGainPercent,
    performance,
  } = usePortfolio()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const todayGain = performance.todayReturn.value
  const todayGainPercent = performance.todayReturn.percent
  const unrealizedGains = totalGain

  // ✅ Sort by TODAY's % gain/loss, not all-time
  const todayGainers = [...holdings]
    .filter(h => h.todayGainPercent > 0)
    .sort((a, b) => b.todayGainPercent - a.todayGainPercent)
    .slice(0, 3)

  const todayLosers = [...holdings]
    .filter(h => h.todayGainPercent < 0)
    .sort((a, b) => a.todayGainPercent - b.todayGainPercent)
    .slice(0, 3)

  return (
    <div className="p-4 lg:p-6">
      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            My Portfolio
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Market Overview
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: MY PORTFOLIO ==================== */}
        <TabsContent value="portfolio" className="space-y-6">

          {/* Hero Section */}
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

          {/* Quick Stats Row */}
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
                    <p className={`text-xl font-bold ${unrealizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(unrealizedGains)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${unrealizedGains >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
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

          {/* Portfolio Chart */}
          <PortfolioChart />

          {/* ===== TODAY'S Top Gainers & Losers ===== */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Today's Gainers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Today's Top Gainers
                </CardTitle>
                <p className="text-xs text-muted-foreground">Stocks that gained the most today</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayGainers.length > 0 ? (
                  todayGainers.map((holding) => (
                    <div
                      key={holding.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20"
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
                            <span className="text-xs font-bold">{holding.symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{holding.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(holding.currentPrice)} · {holding.shares} shares
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">
                          {formatPercent(holding.todayGainPercent)}
                        </p>
                        <p className="text-xs text-green-500">
                          {formatCurrency(holding.todayGain)} today
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No gainers today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Losers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Today's Underperformers
                </CardTitle>
                <p className="text-xs text-muted-foreground">Stocks that lost the most today</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayLosers.length > 0 ? (
                  todayLosers.map((holding) => (
                    <div
                      key={holding.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
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
                            <span className="text-xs font-bold">{holding.symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{holding.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(holding.currentPrice)} · {holding.shares} shares
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-500">
                          {formatPercent(holding.todayGainPercent)}
                        </p>
                        <p className="text-xs text-red-500">
                          {formatCurrency(holding.todayGain)} today
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <TrendingDown className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No losers today 🎉</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Portfolio vs Market */}
          <PortfolioVsMarket />

          {/* Portfolio News */}
          <NewsFeed
            type="portfolio"
            title="Your Portfolio News"
            description="Latest news for stocks you own"
          />

          {/* Quick Holdings Overview */}
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
                            <span className="text-[10px] font-bold">{holding.symbol.slice(0, 2)}</span>
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
                        <p className="text-lg font-bold">{formatCurrency(holding.currentPrice)}</p>
                        <p className="text-xs text-muted-foreground">{holding.shares} shares</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatCurrency(holding.marketValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* ==================== TAB 2: MARKET OVERVIEW ==================== */}
        <TabsContent value="market" className="space-y-6">
          <MarketTicker />
          <MoneyFlowDashboard />
          <SectorBreakdown />
          <FearGreed />
          <NewsFeed
            type="market"
            title="Market News"
            description="Trending stories and market updates"
          />
          <MarketMovers />
          <SectorPerformance />
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
