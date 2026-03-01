"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Performance Analytics — WealthClaude | Track Investment Returns',
  description: 'Analyze your portfolio performance over time with detailed charts, benchmarks and AI-powered return analysis.',
}

import {
  Info,
  RefreshCw,
  TrendingUp,
  Shield,
  Target,
  Activity,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Zap,
  Clock,
  Settings,
} from "lucide-react"
import {
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { usePortfolio } from "@/lib/portfolio-context"
import type { Holding } from "@/lib/holdings-calculator"

// ───────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return "-"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

// ───────────────────────────────────────────────
// CALCULATION FUNCTIONS
// ───────────────────────────────────────────────

const calcBeta = (holdings: Holding[], benchmarkReturn: number): number => {
  if (!holdings.length) return 0
  const rows = holdings
    .filter((h) => h.returns?.["1Y"] !== undefined)
    .map((h) => ({ ret: h.returns["1Y"], w: h.allocation / 100 }))
  if (!rows.length) return 0
  const weighted = rows.reduce((s, h) => s + h.ret * h.w, 0)
  return benchmarkReturn === 0 ? 1 : weighted / benchmarkReturn
}

const calcVolatility = (holdings: Holding[]): number => {
  if (!holdings.length) return 0
  const avgs = holdings
    .filter((h) => h.returns)
    .map((h) => {
      const vals = [
        h.returns["1D"] || 0,
        h.returns["1W"] || 0,
        h.returns["1M"] || 0,
        h.returns["3M"] || 0,
        h.returns["6M"] || 0,
        h.returns["1Y"] || 0,
      ]
      return vals.reduce((s, v) => s + v, 0) / vals.length
    })
  if (!avgs.length) return 0
  const mean = avgs.reduce((s, v) => s + v, 0) / avgs.length
  const variance = avgs.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / avgs.length
  return Math.sqrt(variance) * Math.sqrt(12)
}

const calcSharpe = (ret: number, vol: number, rf = 4.5) =>
  vol === 0 ? 0 : (ret - rf) / vol

const calcSortino = (ret: number, holdings: Holding[], rf = 4.5): number => {
  if (!holdings.length) return 0
  const rets = holdings
    .filter((h) => h.returns?.["1Y"] !== undefined)
    .map((h) => h.returns["1Y"])
  const neg = rets.filter((r) => r < 0)
  if (!neg.length) return ret
  const mean = neg.reduce((s, r) => s + r, 0) / neg.length
  const dd = Math.sqrt(neg.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / neg.length)
  return dd === 0 ? 0 : (ret - rf) / dd
}

const calcMaxDrawdown = (holdings: Holding[], transactions: any[]): number => {
  if (!holdings.length) return 0
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  let peak = 0, maxDD = 0, cur = 0
  sorted.forEach((t) => {
    if (t.type === "BUY") cur += t.total
    else if (t.type === "SELL") cur -= t.total
    if (cur > peak) peak = cur
    const dd = peak > 0 ? ((cur - peak) / peak) * 100 : 0
    if (dd < maxDD) maxDD = dd
  })
  return maxDD
}

const calcVaR = (value: number, vol: number) =>
  -1.65 * (vol / Math.sqrt(252)) * value / 100

const calcAttribution = (holdings: Holding[]) => {
  const map = new Map<string, { ret: number; contrib: number }>()
  holdings.forEach((h) => {
    const sector = h.sector || "Unknown"
    const ret = h.returns?.["1Y"] || 0
    const contrib = (h.allocation / 100) * ret
    const prev = map.get(sector) || { ret: 0, contrib: 0 }
    map.set(sector, { ret: prev.ret + ret, contrib: prev.contrib + contrib })
  })
  return Array.from(map.entries())
    .map(([sector, d]) => ({ sector, return: d.ret, contribution: d.contrib }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

const calcFactors = (holdings: Holding[]) => {
  let large = 0, mid = 0, small = 0, growth = 0, value = 0
  holdings.forEach((h) => {
    const w = h.allocation / 100
    if (h.marketValue > 100000) large += w
    else if (h.marketValue > 10000) mid += w
    else small += w
    if ((h.dividendYield || 0) > 2) value += w
    else growth += w
  })
  return {
    size: { largeCap: large * 100, midCap: mid * 100, smallCap: small * 100 },
    style: { growth: growth * 100, value: value * 100 },
  }
}

// ───────────────────────────────────────────────
// MAIN COMPONENT
// ───────────────────────────────────────────────

export default function PerformancePage() {
  const { benchmarks, holdings, transactions, isLoading, isRefreshing, refresh } = usePortfolio()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(["sp500", "nasdaq"])

  const handleRefresh = async () => {
    await refresh()
    setLastUpdate(new Date())
  }

  const toggleBenchmark = (id: string) => {
    setSelectedBenchmarks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  // ── Metrics ──────────────────────────────────
  const metrics = useMemo(() => {
    const empty = {
      portfolioValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0,
      todayChange: 0, todayChangePercent: 0, beta: 0, sharpe: 0, sortino: 0,
      volatility: 0, maxDrawdown: 0, var95: 0,
      attribution: [] as ReturnType<typeof calcAttribution>,
      factors: calcFactors([]),
      periodReturns: {} as Record<string, number>,
    }
    if (!holdings?.length) return empty

    const portfolioValue = holdings.reduce((s, h) => s + h.marketValue, 0)
    const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
    const totalGain = portfolioValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    const todayChangePercent = holdings.reduce(
      (s, h) => s + (h.allocation / 100) * (h.returns?.["1D"] || 0), 0
    )
    const todayChange = (portfolioValue * todayChangePercent) / 100
    const bRef = benchmarks?.sp500?.return ?? benchmarks?.allBenchmarks?.spy?.return ?? 15
    const volatility = calcVolatility(holdings)
    const beta = calcBeta(holdings, bRef)
    const sharpe = calcSharpe(totalGainPercent, volatility)
    const sortino = calcSortino(totalGainPercent, holdings)
    const maxDrawdown = calcMaxDrawdown(holdings, transactions ?? [])
    const var95 = calcVaR(portfolioValue, volatility)
    const attribution = calcAttribution(holdings)
    const factors = calcFactors(holdings)

    const periodReturns: Record<string, number> = {}
      ;["1D", "1W", "1M", "3M", "6M", "1Y"].forEach((p) => {
        periodReturns[p] = holdings.reduce(
          (s, h) => s + (h.allocation / 100) * (h.returns?.[p] || 0), 0
        )
      })
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const costThisYear = (transactions ?? [])
      .filter((t) => new Date(t.date) >= yearStart && t.type === "BUY")
      .reduce((s, t) => s + t.total, 0)
    periodReturns["YTD"] = costThisYear > 0 ? ((portfolioValue - costThisYear) / costThisYear) * 100 : 0
    periodReturns["ALL"] = totalGainPercent

    return {
      portfolioValue, totalCost, totalGain, totalGainPercent,
      todayChange, todayChangePercent, beta, sharpe, sortino,
      volatility, maxDrawdown, var95, attribution, factors, periodReturns,
    }
  }, [holdings, transactions, benchmarks])

  // ── Dividend data ─────────────────────────────
  const dividendData = useMemo(() => {
    if (!holdings?.length) return { totalAnnual: 0, totalMonthly: 0, avgYield: 0, dividendStocks: [] }
    const dividendStocks = holdings
      .filter((h) => (h.dividendYield || 0) > 0)
      .map((h) => {
        const annualDivPerShare = h.currentPrice * (h.dividendYield / 100)
        const totalAnnual = annualDivPerShare * h.shares
        return {
          symbol: h.symbol, shares: h.shares, price: h.currentPrice,
          yield: h.dividendYield, annualDivPerShare, totalAnnual,
          monthlyAvg: totalAnnual / 12, marketValue: h.marketValue,
        }
      })
    const totalAnnual = dividendStocks.reduce((s, d) => s + d.totalAnnual, 0)
    const totalValue = dividendStocks.reduce((s, d) => s + d.marketValue, 0)
    const avgYield = totalValue > 0
      ? dividendStocks.reduce((s, d) => s + (d.yield * d.marketValue) / totalValue, 0)
      : 0
    return { totalAnnual, totalMonthly: totalAnnual / 12, avgYield, dividendStocks }
  }, [holdings])

  // ── Historical chart data ─────────────────────
  const historicalData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1)
      const label = month.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      const txnsUpTo = (transactions ?? []).filter((t) => new Date(t.date) <= month)
      const costBasis = txnsUpTo.filter((t) => t.type === "BUY").reduce((s, t) => s + t.total, 0)
      const est = costBasis * (1 + metrics.totalGainPercent / 100)
      const me = i + 1
      const b = benchmarks
      return {
        month: label,
        portfolio: est,
        sp500: est * (1 + ((b?.sp500?.return ?? b?.allBenchmarks?.spy?.return ?? 15) / 100 / 12) * me),
        nasdaq: est * (1 + ((b?.nasdaq?.return ?? b?.allBenchmarks?.qqq?.return ?? 20) / 100 / 12) * me),
        dowjones: est * (1 + ((b?.dowjones?.return ?? b?.allBenchmarks?.dia?.return ?? 12) / 100 / 12) * me),
        russell2000: est * (1 + ((b?.russell2000?.return ?? b?.allBenchmarks?.iwm?.return ?? 18) / 100 / 12) * me),
        vti: est * (1 + ((b?.vti?.return ?? b?.allBenchmarks?.vti?.return ?? 16) / 100 / 12) * me),
        voo: est * (1 + ((b?.voo?.return ?? b?.allBenchmarks?.voo?.return ?? 15) / 100 / 12) * me),
        vxus: est * (1 + ((b?.vxus?.return ?? b?.allBenchmarks?.vxus?.return ?? 10) / 100 / 12) * me),
      }
    })
  }, [transactions, metrics.totalGainPercent, benchmarks])

  const riskGaugeValue = Math.min(Math.abs(metrics.beta) * 50, 100)
  const riskGaugeColor = metrics.beta > 1.5 ? "#ef4444" : metrics.beta > 1 ? "#f59e0b" : "#22c55e"
  const riskGaugeData = [{ name: "Risk", value: riskGaugeValue, fill: riskGaugeColor }]

  // ── Benchmark list for tabs ───────────────────
  const benchmarkList = [
    { id: "sp500", name: "S&P 500 (SPY)", color: "#3b82f6" },
    { id: "nasdaq", name: "NASDAQ-100 (QQQ)", color: "#f59e0b" },
    { id: "dowjones", name: "Dow Jones (DIA)", color: "#8b5cf6" },
    { id: "russell2000", name: "Russell 2000 (IWM)", color: "#ec4899" },
    { id: "vti", name: "Total Market (VTI)", color: "#06b6d4" },
    { id: "voo", name: "S&P 500 ETF (VOO)", color: "#84cc16" },
    { id: "vxus", name: "International (VXUS)", color: "#f97316" },
  ]

  const benchmarkCompareList = [
    { key: "sp500", dataKey: "sp500", name: "S&P 500", region: "US Large Cap", ret: benchmarks?.sp500?.return ?? benchmarks?.allBenchmarks?.spy?.return },
    { key: "nasdaq", dataKey: "nasdaq", name: "NASDAQ-100", region: "US Tech", ret: benchmarks?.nasdaq?.return ?? benchmarks?.allBenchmarks?.qqq?.return },
    { key: "dowjones", dataKey: "dowjones", name: "Dow Jones", region: "US Dividend", ret: benchmarks?.dowjones?.return ?? benchmarks?.allBenchmarks?.dia?.return },
    { key: "russell2000", dataKey: "russell2000", name: "Russell 2000", region: "US Small Cap", ret: benchmarks?.russell2000?.return ?? benchmarks?.allBenchmarks?.iwm?.return },
    { key: "vti", dataKey: "vti", name: "Total Market", region: "US Broad", ret: benchmarks?.vti?.return ?? benchmarks?.allBenchmarks?.vti?.return },
    { key: "voo", dataKey: "voo", name: "S&P 500 ETF", region: "US Core", ret: benchmarks?.voo?.return ?? benchmarks?.allBenchmarks?.voo?.return },
    { key: "vxus", dataKey: "vxus", name: "International", region: "Global", ret: benchmarks?.vxus?.return ?? benchmarks?.allBenchmarks?.vxus?.return },
  ]

  // ── Loading ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center py-12">
        <RefreshCw className="animate-spin h-8 w-8 text-primary mr-3" />
        <p className="text-muted-foreground">Loading performance data...</p>
      </div>
    )
  }

  // ── Empty ─────────────────────────────────────
  if (!holdings?.length) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Performance Analysis</h1>
          <p className="text-muted-foreground">Detailed portfolio performance metrics</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No performance data yet. Upload transactions to get started.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main ──────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time portfolio metrics • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" /> Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.portfolioValue)}</div>
            <p className={`text-sm mt-1 ${metrics.todayChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {metrics.todayChange >= 0 ? "+" : ""}
              {formatCurrency(metrics.todayChange)} ({formatPercent(metrics.todayChangePercent)}) today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(metrics.totalGainPercent)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(metrics.totalGain)} gain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" /> Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(100 - riskGaugeValue).toFixed(0)}/100</div>
            <p className="text-sm text-muted-foreground mt-1">Beta: {metrics.beta.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" /> Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.sharpe > 1 ? "text-green-600" : metrics.sharpe > 0.5 ? "text-yellow-600" : "text-red-600"}`}>
              {metrics.sharpe.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.sharpe > 1 ? "Excellent" : metrics.sharpe > 0.5 ? "Good" : "Below Average"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portfolio Performance (12 Months)</CardTitle>
                  <CardDescription>Compare your portfolio with up to 3 benchmarks</CardDescription>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" /> Select Benchmarks
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Choose up to 3 benchmarks</h4>
                      <p className="text-xs text-muted-foreground">Compare your portfolio against major market indices</p>
                      <div className="space-y-2">
                        {benchmarkList.map((b) => {
                          const isSelected = selectedBenchmarks.includes(b.id)
                          const canSelect = selectedBenchmarks.length < 3 || isSelected
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleBenchmark(b.id)}
                              disabled={!canSelect}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isSelected
                                ? "border-primary bg-primary/10"
                                : canSelect
                                  ? "border-border hover:border-primary/50"
                                  : "border-border opacity-50 cursor-not-allowed"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                                <span className="text-sm font-medium">{b.name}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Selected: {selectedBenchmarks.length}/3
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="portfolio" stroke="#22c55e" fill="url(#pgGrad)" name="Your Portfolio" strokeWidth={3} />
                    {selectedBenchmarks.includes("sp500") && <Line type="monotone" dataKey="sp500" stroke="#3b82f6" name="S&P 500" strokeWidth={2} dot={false} />}
                    {selectedBenchmarks.includes("nasdaq") && <Line type="monotone" dataKey="nasdaq" stroke="#f59e0b" name="NASDAQ" strokeWidth={2} dot={false} />}
                    {selectedBenchmarks.includes("dowjones") && <Line type="monotone" dataKey="dowjones" stroke="#8b5cf6" name="Dow Jones" strokeWidth={2} dot={false} />}
                    {selectedBenchmarks.includes("russell2000") && <Line type="monotone" dataKey="russell2000" stroke="#ec4899" name="Russell 2000" strokeWidth={2} dot={false} />}
                    {selectedBenchmarks.includes("vti") && <Line type="monotone" dataKey="vti" stroke="#06b6d4" name="VTI" strokeWidth={2} dot={false} />}
                    {selectedBenchmarks.includes("voo") && <Line type="monotone" dataKey="voo" stroke="#84cc16" name="VOO" strokeWidth={2} dot={false} />}
                    {selectedBenchmarks.includes("vxus") && <Line type="monotone" dataKey="vxus" stroke="#f97316" name="VXUS" strokeWidth={2} dot={false} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Period Returns</CardTitle>
              <CardDescription>Performance across different time frames</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"].map((period) => {
                  const val = metrics.periodReturns[period] || 0
                  return (
                    <div key={period} className="p-4 rounded-lg bg-secondary/50 text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{period}</p>
                      <p className={`text-lg font-bold ${val >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercent(val)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk */}
        <TabsContent value="risk" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Risk Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={riskGaugeData} startAngle={180} endAngle={0}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={10} fill={riskGaugeColor} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-10" fontSize="32" fontWeight="bold" fill="currentColor">
                          {(100 - riskGaugeValue).toFixed(0)}
                        </tspan>
                        <tspan x="50%" dy="25" fontSize="14" fill="currentColor" opacity={0.6}>
                          Risk Score
                        </tspan>
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  {metrics.beta < 0.8 ? "Low Risk – Conservative" : metrics.beta < 1.2 ? "Moderate Risk – Balanced" : "High Risk – Aggressive"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Risk Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Beta (Market Sensitivity)", value: metrics.beta.toFixed(2), tip: "1.0 = moves with market, >1.0 = more volatile", cls: "" },
                    { label: "Sharpe Ratio", value: metrics.sharpe.toFixed(2), tip: "Risk-adjusted return. >1.0 is good", cls: metrics.sharpe > 1 ? "text-green-600" : "text-yellow-600" },
                    { label: "Sortino Ratio", value: metrics.sortino.toFixed(2), tip: "Downside risk-adjusted return", cls: "text-green-600" },
                    { label: "Volatility (Ann.)", value: `${metrics.volatility.toFixed(2)}%`, tip: "Annualized standard deviation", cls: "" },
                    { label: "Max Drawdown", value: `${metrics.maxDrawdown.toFixed(2)}%`, tip: "Largest peak-to-trough decline", cls: "text-red-600" },
                    { label: "VaR (95%)", value: formatCurrency(metrics.var95), tip: "Max expected 1-day loss (95% confidence)", cls: "text-orange-600" },
                  ].map(({ label, value, tip, cls }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground inline ml-1" />
                            </TooltipTrigger>
                            <TooltipContent><p className="max-w-xs text-xs">{tip}</p></TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <p className={`text-xl font-bold ${cls}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attribution */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Return Attribution by Sector</CardTitle>
              <CardDescription>Which sectors contributed most to your returns</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.attribution.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.attribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                      <YAxis type="category" dataKey="sector" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(v: number) => `${v.toFixed(2)}%`}
                      />
                      <Bar dataKey="contribution" name="Contribution" radius={[0, 8, 8, 0]}>
                        {metrics.attribution.map((entry, i) => (
                          <Cell key={i} fill={entry.contribution >= 0 ? "#22c55e" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No attribution data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factors */}
        <TabsContent value="factors" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Size Factor Exposure</CardTitle>
                <CardDescription>Large vs Mid vs Small Cap</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Large Cap", value: metrics.factors.size.largeCap, color: "bg-blue-500" },
                    { label: "Mid Cap", value: metrics.factors.size.midCap, color: "bg-green-500" },
                    { label: "Small Cap", value: metrics.factors.size.smallCap, color: "bg-orange-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{label}</span>
                        <span className="text-sm font-bold">{value.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Style Factor Exposure</CardTitle>
                <CardDescription>Growth vs Value Tilt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Growth", value: metrics.factors.style.growth, color: "bg-purple-500" },
                    { label: "Value", value: metrics.factors.style.value, color: "bg-teal-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{label}</span>
                        <span className="text-sm font-bold">{value.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Interpretation</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.factors.style.growth > 70
                      ? "Heavy growth tilt – higher expected volatility but potential for strong returns"
                      : metrics.factors.style.value > 70
                        ? "Strong value tilt – lower volatility, dividend focus"
                        : "Balanced growth/value mix"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Benchmarks */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benchmark Comparison</CardTitle>
              <CardDescription>Your portfolio vs major market indices (1 Year)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {benchmarkCompareList.map(({ key, name, region, ret }) => {
                  if (ret === undefined || ret === null) return null
                  const yourReturn = metrics.periodReturns["1Y"] || 0
                  const diff = yourReturn - ret
                  const isWinning = diff >= 0
                  return (
                    <div key={key} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg">{name}</p>
                          <p className="text-xs text-muted-foreground">{region}</p>
                        </div>
                        <Badge variant={isWinning ? "default" : "destructive"} className="text-sm px-3 py-1">
                          {isWinning ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                          {diff >= 0 ? "+" : ""}{diff.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Your Return</p>
                          <p className={`text-xl font-bold ${yourReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(yourReturn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Benchmark</p>
                          <p className="text-xl font-bold">{formatPercent(ret)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Difference</p>
                          <p className={`text-xl font-bold ${isWinning ? "text-green-600" : "text-red-600"}`}>
                            {diff >= 0 ? "+" : ""}{diff.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {benchmarkCompareList.every((b) => b.ret === undefined || b.ret === null) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No benchmark data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dividends */}
        <TabsContent value="dividends" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-green-600" /> Total Dividends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(dividendData.totalAnnual)}</div>
                <p className="text-xs text-muted-foreground mt-1">Annual (projected)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" /> Dividend Yield
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dividendData.avgYield.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Weighted average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Monthly Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dividendData.totalMonthly)}/mo</div>
                <p className="text-xs text-muted-foreground mt-1">Average monthly</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dividend-Paying Stocks</CardTitle>
              <CardDescription>{dividendData.dividendStocks.length} stocks generating income</CardDescription>
            </CardHeader>
            <CardContent>
              {dividendData.dividendStocks.length > 0 ? (
                <div className="space-y-2">
                  {dividendData.dividendStocks.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="font-semibold text-lg">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {stock.shares.toFixed(2)} shares @ {formatCurrency(stock.price)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(stock.annualDivPerShare)}/share/year
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-xl">{stock.yield.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">yield</p>
                        <p className="text-sm font-semibold text-green-600 mt-1">{formatCurrency(stock.totalAnnual)}/yr</p>
                        <p className="text-xs text-muted-foreground">({formatCurrency(stock.monthlyAvg)}/mo)</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CircleDollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No dividend-paying stocks in portfolio</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
