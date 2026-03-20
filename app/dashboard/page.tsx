"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, PiggyBank, Clock, Briefcase, LineChart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { OnboardingTab } from "@/components/onboarding-spotlight"

// ── Portfolio Tab Components ──────────────────────────────────────────────
import PortfolioChart from "@/components/portfolio-chart"
import PortfolioVsMarket from "@/components/portfolio-vs-market"
import AIPortfolioSummary from "@/components/ai-portfolio-summary"
import NewsFeed from "@/components/news-feed"

// ── Market Overview Tab Components ───────────────────────────────────────
import MarketTicker from "@/components/market-ticker"
import MoneyFlowDashboard from "@/components/money-flow-dashboard"
import AIMarketInsight from "@/components/ai-market-insight"
import GlobalMarkets from "@/components/global-markets"
import MarketBreadth from "@/components/market-breadth"
import SectorOverview from "@/components/sector-overview"
import FearGreed from "@/components/fear-greed"
import EconomicCalendar from "@/components/economic-calendar"
import MarketMovers from "@/components/market-movers"

// ── Context ───────────────────────────────────────────────────────────────
import { usePortfolio } from "@/lib/portfolio-context"

// ── Formatters ────────────────────────────────────────────────────────────
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return '0.00%'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="h-8 w-64 bg-secondary rounded animate-pulse" />
      <div className="h-6 w-40 bg-secondary rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-secondary rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-secondary rounded-lg animate-pulse" />
      <div className="h-32 bg-secondary rounded-lg animate-pulse" />
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────
function DashboardContent() {
  const [activeTab, setActiveTab] = useState<"portfolio" | "market">("portfolio")
  const {
    holdings,
    portfolioValue,
    totalCost,
    totalGain,
    totalGainPercent,
    performance,
  } = usePortfolio()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if we have context data loaded - if so, skip skeleton even on first mount
  const hasContextData = (holdings && holdings.length > 0) || (portfolioValue && portfolioValue > 0)
  
  // Only show skeleton on true first load when neither isMounted nor context data exists
  if (!isMounted && !hasContextData) return <DashboardSkeleton />

  // ── Safe values after mount ─────────────────────────────────────────────
  const safeHoldings = holdings ?? []
  const safeTotal = portfolioValue ?? 0
  const safeCost = totalCost ?? 0
  const safeTotalGain = totalGain ?? 0
  const safeTotalPct = totalGainPercent ?? 0
  const todayGain = performance?.todayReturn?.value ?? 0
  const todayGainPct = performance?.todayReturn?.percent ?? 0

  const todayGainers = [...safeHoldings]
    .filter(h => (h.todayGainPercent ?? 0) > 0)
    .sort((a, b) => (b.todayGainPercent ?? 0) - (a.todayGainPercent ?? 0))
    .slice(0, 3)

  const todayLosers = [...safeHoldings]
    .filter(h => (h.todayGainPercent ?? 0) < 0)
    .sort((a, b) => (a.todayGainPercent ?? 0) - (b.todayGainPercent ?? 0))
    .slice(0, 3)

  return (
    <div className="p-4 lg:p-6">
      <div className="space-y-6">

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <OnboardingTab
            stepId="portfolio"
            isSelected={activeTab === "portfolio"}
            onClick={() => setActiveTab("portfolio")}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              My Portfolio
            </div>
          </OnboardingTab>
          <OnboardingTab
            stepId="overview"
            isSelected={activeTab === "market"}
            onClick={() => setActiveTab("market")}
          >
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Market Overview
            </div>
          </OnboardingTab>
        </div>

        {/* ================================================================
            TAB 1 — MY PORTFOLIO
        ================================================================ */}
        {activeTab === "portfolio" && (

          {/* ── Hero ───────────────────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Total Portfolio Value</p>
              <h1 className="text-4xl font-bold">{formatCurrency(safeTotal)}</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className={`flex items-center gap-1 font-semibold ${safeTotalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {safeTotalGain >= 0
                    ? <TrendingUp className="h-4 w-4" />
                    : <TrendingDown className="h-4 w-4" />
                  }
                  {formatCurrency(safeTotalGain)} ({formatPercent(safeTotalPct)}) all time
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

          {/* ── Quick Stats ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Today's P&L */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Today</p>
                    <p className={`text-xl font-bold ${todayGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(todayGain)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatPercent(todayGainPct)}</p>
                  </div>
                  <div className={`p-2 rounded-full ${todayGain >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {todayGain >= 0
                      ? <ArrowUpRight className="h-5 w-5 text-green-500" />
                      : <ArrowDownRight className="h-5 w-5 text-red-500" />
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unrealized Gains */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unrealized Gains</p>
                    <p className={`text-xl font-bold ${safeTotalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(safeTotalGain)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatPercent(safeTotalPct)}</p>
                  </div>
                  <div className={`p-2 rounded-full ${safeTotalGain >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Holdings Count */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Holdings</p>
                    <p className="text-xl font-bold text-blue-500">{safeHoldings.length}</p>
                    <p className="text-xs text-muted-foreground">active positions</p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <PiggyBank className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Cost Basis */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cost Basis</p>
                    <p className="text-xl font-bold">{formatCurrency(safeCost)}</p>
                    <p className="text-xs text-muted-foreground">total invested</p>
                  </div>
                  <div className="p-2 rounded-full bg-secondary">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Portfolio Chart ─────────────────────────────────────────── */}
          <PortfolioChart />

          {/* ── AI Portfolio Summary ────────────────────────────────────── */}
          <AIPortfolioSummary />

          {/* ── Today's Gainers & Losers ────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Gainers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Today's Top Gainers
                </CardTitle>
                <p className="text-xs text-muted-foreground">Your best performing stocks today</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayGainers.length > 0 ? (
                  todayGainers.map(h => (
                    <div
                      key={h.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {h.logo
                            ? <Image src={h.logo} alt={h.symbol} width={32} height={32} unoptimized />
                            : <span className="text-xs font-bold">{h.symbol.slice(0, 2)}</span>
                          }
                        </div>
                        <div>
                          <p className="font-bold">{h.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(h.currentPrice ?? 0)} · {h.shares} shares
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">{formatPercent(h.todayGainPercent)}</p>
                        <p className="text-xs text-green-500">{formatCurrency(h.todayGain ?? 0)} today</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No gainers today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Losers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Today's Underperformers
                </CardTitle>
                <p className="text-xs text-muted-foreground">Your weakest stocks today</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayLosers.length > 0 ? (
                  todayLosers.map(h => (
                    <div
                      key={h.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {h.logo
                            ? <Image src={h.logo} alt={h.symbol} width={32} height={32} unoptimized />
                            : <span className="text-xs font-bold">{h.symbol.slice(0, 2)}</span>
                          }
                        </div>
                        <div>
                          <p className="font-bold">{h.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(h.currentPrice ?? 0)} · {h.shares} shares
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-500">{formatPercent(h.todayGainPercent)}</p>
                        <p className="text-xs text-red-500">{formatCurrency(h.todayGain ?? 0)} today</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <TrendingDown className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No losers today 🎉</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Portfolio vs Market ─────────────────────────────────────── */}
          <PortfolioVsMarket />

          {/* ── Portfolio News ──────────────────────────────────────────── */}
          <NewsFeed
            type="portfolio"
            title="Your Portfolio News"
            description="Latest news for stocks you own"
          />

          {/* ── Holdings Overview Grid ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Holdings Overview</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/holdings">View All →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {safeHoldings.length === 0 ? (
                <div className="text-center py-12">
                  <PiggyBank className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground">No holdings yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/dashboard/transactions">Add your first stock</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {safeHoldings.slice(0, 8).map(h => (
                    <div
                      key={h.symbol}
                      className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {h.logo
                              ? <Image src={h.logo} alt={h.symbol} width={24} height={24} unoptimized />
                              : <span className="text-[10px] font-bold">{h.symbol.slice(0, 2)}</span>
                            }
                          </div>
                          <span className="font-semibold text-sm">{h.symbol}</span>
                        </div>
                        <span className={`text-xs font-bold ${(h.todayGainPercent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(h.todayGainPercent)}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(h.currentPrice ?? 0)}</p>
                          <p className="text-xs text-muted-foreground">{h.shares} shares</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatCurrency(h.marketValue ?? 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {safeHoldings.length > 8 && (
                <div className="text-center mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/holdings">View all {safeHoldings.length} holdings</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        )}

        {/* ================================================================
            TAB 2 — MARKET OVERVIEW
        ================================================================ */}
        {activeTab === "market" && (

          <div className="space-y-6">

          {/* 1. Scrolling ticker strip */}
          <MarketTicker />

          {/* 2. Money flow first — user sees context before AI insight */}
          <MoneyFlowDashboard />

          {/* 3. AI Market Daily Brief — makes sense after seeing money flow */}
          <AIMarketInsight />

          {/* 4. Global markets */}
          <GlobalMarkets />

          {/* 5. Market breadth gauge */}
          <MarketBreadth />

          {/* 6. Sector overview — merged (Market Today + Your Portfolio tabs) */}
          <SectorOverview />

          {/* 7. Fear & Greed gauges */}
          <FearGreed />

          {/* 8. Economic calendar — upcoming US events */}
          <EconomicCalendar />

          {/* 9. Top movers — S&P 500 / Nasdaq / Dow tabs */}
          <MarketMovers />

          {/* 10. Market news feed */}
          <NewsFeed
            type="market"
            title="Market News"
            description="Trending stories and market updates"
          />

          </div>
        )}

      </div>
    </div>
  )
}

// ── Page Export ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
