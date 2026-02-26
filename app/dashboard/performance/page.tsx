"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Info,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Zap,
  Clock,
  Settings
} from "lucide-react"
import {
  LineChart,
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
  PolarAngleAxis
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
import { getTransactionsFromStorage, Transaction } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings } from "@/lib/holdings-calculator"
import type { Holding } from "@/lib/holdings-calculator"

// ===============================
// CACHE HELPERS
// ===============================
const CACHE_KEY = 'performancePageCache'
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours

interface CachedPerformanceData {
  holdings: Holding[]
  transactions: Transaction[]
  calculatedData: any
  timestamp: number
  transactionCount: number
}

// ✅ FIXED: getCached is now async because getTransactionsFromStorage is async
const getCached = async (): Promise<CachedPerformanceData | null> => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const data: CachedPerformanceData = JSON.parse(cached)
    const age = Date.now() - data.timestamp
    // ✅ FIXED: await the async call
    const currentTxns = await getTransactionsFromStorage()
    if (data.transactionCount !== currentTxns.length) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    if (age < CACHE_DURATION) return data
    return null
  } catch {
    return null
  }
}

// ✅ FIXED: setCache is now async because getTransactionsFromStorage is async
const setCache = async (data: Omit<CachedPerformanceData, 'transactionCount'>): Promise<void> => {
  if (typeof window === 'undefined') return
  try {
    // ✅ FIXED: await the async call
    const txns = await getTransactionsFromStorage()
    const cacheData: CachedPerformanceData = { ...data, transactionCount: txns.length }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Cache failed:', error)
  }
}

// ===============================
// CALCULATION FUNCTIONS (unchanged)
// ===============================

const calculateBeta = (holdings: Holding[], benchmarkReturn: number): number => {
  if (!holdings || holdings.length === 0) return 0
  const portfolioReturns = holdings
    .filter(h => h.returns && h.returns['1Y'] !== undefined)
    .map(h => ({ return: h.returns['1Y'], weight: h.allocation / 100 }))
  if (portfolioReturns.length === 0) return 0
  const weightedPortfolioReturn = portfolioReturns.reduce((sum, h) => sum + (h.return * h.weight), 0)
  if (benchmarkReturn === 0) return 1
  return weightedPortfolioReturn / benchmarkReturn
}

const calculateSharpeRatio = (portfolioReturn: number, volatility: number, riskFreeRate: number = 4.5): number => {
  if (volatility === 0) return 0
  return (portfolioReturn - riskFreeRate) / volatility
}

const calculateVolatility = (holdings: Holding[]): number => {
  if (!holdings || holdings.length === 0) return 0
  const returns = holdings
    .filter(h => h.returns)
    .map(h => {
      const periodicReturns = [
        h.returns['1D'] || 0, h.returns['1W'] || 0, h.returns['1M'] || 0,
        h.returns['3M'] || 0, h.returns['6M'] || 0, h.returns['1Y'] || 0
      ]
      return periodicReturns.reduce((sum, r) => sum + r, 0) / periodicReturns.length
    })
  if (returns.length === 0) return 0
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(12)
}

const calculateMaxDrawdown = (holdings: Holding[], transactions: Transaction[]): number => {
  if (!holdings || holdings.length === 0) return 0
  const sortedTxns = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let peak = 0, maxDD = 0, currentValue = 0
  sortedTxns.forEach(txn => {
    if (txn.type === 'BUY') currentValue += txn.total
    else if (txn.type === 'SELL') currentValue -= txn.total
    if (currentValue > peak) peak = currentValue
    const drawdown = peak > 0 ? ((currentValue - peak) / peak) * 100 : 0
    if (drawdown < maxDD) maxDD = drawdown
  })
  return maxDD
}

const calculateSortinoRatio = (portfolioReturn: number, holdings: Holding[], riskFreeRate: number = 4.5): number => {
  if (!holdings || holdings.length === 0) return 0
  const returns = holdings.filter(h => h.returns && h.returns['1Y'] !== undefined).map(h => h.returns['1Y'])
  const negativeReturns = returns.filter(r => r < 0)
  if (negativeReturns.length === 0) return portfolioReturn / 1
  const mean = negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / negativeReturns.length
  const downsideDeviation = Math.sqrt(downsideVariance)
  if (downsideDeviation === 0) return 0
  return (portfolioReturn - riskFreeRate) / downsideDeviation
}

const calculateVaR = (portfolioValue: number, volatility: number): number => {
  const dailyVolatility = volatility / Math.sqrt(252)
  return -1.65 * dailyVolatility * portfolioValue / 100
}

const calculateAttribution = (holdings: Holding[]) => {
  const bySector = new Map<string, { return: number; contribution: number }>()
  holdings.forEach(h => {
    const sector = h.sector || 'Unknown'
    const stockReturn = h.returns?.['1Y'] || 0
    const contribution = (h.allocation / 100) * stockReturn
    const current = bySector.get(sector) || { return: 0, contribution: 0 }
    bySector.set(sector, { return: current.return + stockReturn, contribution: current.contribution + contribution })
  })
  return Array.from(bySector.entries())
    .map(([sector, data]) => ({ sector, return: data.return, contribution: data.contribution }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

const calculateFactorExposure = (holdings: Holding[]) => {
  let largeCapWeight = 0, midCapWeight = 0, smallCapWeight = 0, growthWeight = 0, valueWeight = 0
  holdings.forEach(h => {
    const marketCap = h.marketValue
    const weight = h.allocation / 100
    if (marketCap > 100000) largeCapWeight += weight
    else if (marketCap > 10000) midCapWeight += weight
    else smallCapWeight += weight
    if ((h.dividendYield || 0) > 2) valueWeight += weight
    else growthWeight += weight
  })
  return {
    size: { largeCap: largeCapWeight * 100, midCap: midCapWeight * 100, smallCap: smallCapWeight * 100 },
    style: { growth: growthWeight * 100, value: valueWeight * 100 }
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

// ===============================
// MAIN COMPONENT
// ===============================

export default function PerformancePage() {
  const { benchmarks, holdings, transactions, isLoading, isRefreshing, refresh } = usePortfolio()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['sp500', 'nasdaq'])

  // ✅ FIXED: loadData is fully async, awaiting all storage calls


  // ✅ FIXED: await getCached (it's now async)
  const cached = await getCached()
  if (cached) {
    setHoldings(cached.holdings)
    setTransactions(cached.transactions)
    setIsLoading(false)
    return
  }

  // ✅ FIXED: await getTransactionsFromStorage
  const txns = await getTransactionsFromStorage()
  if (!txns || txns.length === 0) {
    setIsLoading(false)
    return
  }

  const holdingsData = await calculateAndFetchHoldings(txns)

  setHoldings(holdingsData)
  setTransactions(txns)
  setIsLoading(false)

  // ✅ FIXED: await setCache
  await setCache({
    holdings: holdingsData,
    transactions: txns,
    calculatedData: {},
    timestamp: Date.now()
  })
}

loadData()
  }, [])

// ✅ FIXED: handleRefresh awaits all async calls
const handleRefresh = async () => {
  await refresh()
  setLastUpdate(new Date())
}

const dividendData = useMemo(() => {
  if (!holdings || holdings.length === 0) {
    return { totalAnnual: 0, totalMonthly: 0, avgYield: 0, dividendStocks: [] }
  }
  const dividendStocks = holdings
    .filter(h => (h.dividendYield || 0) > 0)
    .map(h => {
      const annualDivPerShare = h.currentPrice * (h.dividendYield / 100)
      const totalAnnual = annualDivPerShare * h.shares
      return { symbol: h.symbol, shares: h.shares, price: h.currentPrice, yield: h.dividendYield, annualDivPerShare, totalAnnual, monthlyAvg: totalAnnual / 12, marketValue: h.marketValue }
    })
  const totalAnnual = dividendStocks.reduce((sum, s) => sum + s.totalAnnual, 0)
  const totalValue = dividendStocks.reduce((sum, s) => sum + s.marketValue, 0)
  const avgYield = totalValue > 0 ? dividendStocks.reduce((sum, s) => sum + (s.yield * s.marketValue / totalValue), 0) : 0
  return { totalAnnual, totalMonthly: totalAnnual / 12, avgYield, dividendStocks }
}, [holdings])

const metrics = useMemo(() => {
  if (!holdings || holdings.length === 0) {
    return { portfolioValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0, todayChange: 0, todayChangePercent: 0, beta: 0, sharpe: 0, sortino: 0, volatility: 0, maxDrawdown: 0, var95: 0, attribution: [], factors: { size: { largeCap: 0, midCap: 0, smallCap: 0 }, style: { growth: 0, value: 0 } }, periodReturns: {} }
  }
  const portfolioValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalGain = portfolioValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const todayChangePercent = holdings.reduce((sum, h) => sum + ((h.allocation / 100) * (h.returns?.['1D'] || 0)), 0)
  const todayChange = (portfolioValue * todayChangePercent) / 100
  const benchmarkReturn = benchmarks?.sp500?.return || 15
  const volatility = calculateVolatility(holdings)
  const beta = calculateBeta(holdings, benchmarkReturn)
  const sharpe = calculateSharpeRatio(totalGainPercent, volatility)
  const sortino = calculateSortinoRatio(totalGainPercent, holdings)
  const maxDrawdown = calculateMaxDrawdown(holdings, transactions)
  const var95 = calculateVaR(portfolioValue, volatility)
  const attribution = calculateAttribution(holdings)
  const factors = calculateFactorExposure(holdings)
  const periods = ['1D', '1W', '1M', '3M', '6M', '1Y']
  const periodReturns: any = {}
  periods.forEach(period => {
    periodReturns[period] = holdings.reduce((sum, h) => sum + ((h.allocation / 100) * (h.returns?.[period] || 0)), 0)
  })
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const costThisYear = transactions.filter(t => new Date(t.date) >= yearStart && t.type === 'BUY').reduce((sum, t) => sum + t.total, 0)
  periodReturns['YTD'] = costThisYear > 0 ? ((portfolioValue - costThisYear) / costThisYear) * 100 : 0
  periodReturns['ALL'] = totalGainPercent
  return { portfolioValue, totalCost, totalGain, totalGainPercent, todayChange, todayChangePercent, beta, sharpe, sortino, volatility, maxDrawdown, var95, attribution, factors, periodReturns }
}, [holdings, transactions, benchmarks])

const historicalData = useMemo(() => {
  const months = []
  const today = new Date()
  for (let i = 11; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthKey = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const txnsUpTo = transactions.filter(t => new Date(t.date) <= month)
    const costBasis = txnsUpTo.filter(t => t.type === 'BUY').reduce((sum, t) => sum + t.total, 0)
    const estimatedValue = costBasis * (1 + (metrics.totalGainPercent / 100))
    const monthsElapsed = 12 - i
    months.push({
      month: monthKey,
      portfolio: estimatedValue,
      sp500: estimatedValue * (1 + ((benchmarks?.sp500?.return || 15) / 100 / 12 * monthsElapsed)),
      nasdaq: estimatedValue * (1 + ((benchmarks?.nasdaq?.return || 20) / 100 / 12 * monthsElapsed)),
      dowjones: estimatedValue * (1 + ((benchmarks?.dowjones?.return || 12) / 100 / 12 * monthsElapsed)),
      russell2000: estimatedValue * (1 + ((benchmarks?.russell2000?.return || 18) / 100 / 12 * monthsElapsed)),
      vti: estimatedValue * (1 + ((benchmarks?.vti?.return || 16) / 100 / 12 * monthsElapsed)),
      voo: estimatedValue * (1 + ((benchmarks?.voo?.return || 15) / 100 / 12 * monthsElapsed)),
      vxus: estimatedValue * (1 + ((benchmarks?.vxus?.return || 10) / 100 / 12 * monthsElapsed)),
    })
  }
  return months
}, [transactions, metrics, benchmarks])

const riskGaugeData = [{ name: 'Risk', value: Math.min(Math.abs(metrics.beta) * 50, 100), fill: metrics.beta > 1.5 ? '#ef4444' : metrics.beta > 1 ? '#f59e0b' : '#22c55e' }]

if (isLoading || contextLoading) {
  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin h-8 w-8 text-primary mr-3" />
        <p className="text-muted-foreground">Loading performance data...</p>
      </div>
    </div>
  )
}

if (!holdings || holdings.length === 0) {
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
            <Activity className="h-4 w-4" />Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.portfolioValue)}</div>
          <p className={`text-sm mt-1 ${metrics.todayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.todayChange >= 0 ? '+' : ''}{formatCurrency(metrics.todayChange)} ({formatPercent(metrics.todayChangePercent)}) today
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />Total Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(metrics.totalGainPercent)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{formatCurrency(metrics.totalGain)} gain</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(100 - Math.min(Math.abs(metrics.beta) * 50, 100)).toFixed(0)}/100</div>
          <p className="text-sm text-muted-foreground mt-1">Beta: {metrics.beta.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />Sharpe Ratio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.sharpe > 1 ? 'text-green-600' : metrics.sharpe > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
            {metrics.sharpe.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {metrics.sharpe > 1 ? 'Excellent' : metrics.sharpe > 0.5 ? 'Good' : 'Below Average'}
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
                    <Settings className="h-4 w-4" />Select Benchmarks
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2">Choose up to 3 benchmarks</h4>
                      <p className="text-xs text-muted-foreground mb-3">Compare your portfolio against major market indices</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: 'sp500', name: 'S&P 500 (SPY)', color: '#3b82f6' },
                        { id: 'nasdaq', name: 'NASDAQ-100 (QQQ)', color: '#f59e0b' },
                        { id: 'dowjones', name: 'Dow Jones (DIA)', color: '#8b5cf6' },
                        { id: 'russell2000', name: 'Russell 2000 (IWM)', color: '#ec4899' },
                        { id: 'vti', name: 'Total Market (VTI)', color: '#06b6d4' },
                        { id: 'voo', name: 'S&P 500 ETF (VOO)', color: '#84cc16' },
                        { id: 'vxus', name: 'International (VXUS)', color: '#f97316' },
                      ].map(bench => {
                        const isSelected = selectedBenchmarks.includes(bench.id)
                        const canSelect = selectedBenchmarks.length < 3 || isSelected
                        return (
                          <button
                            key={bench.id}
                            onClick={() => {
                              if (isSelected) setSelectedBenchmarks(prev => prev.filter(id => id !== bench.id))
                              else if (canSelect) setSelectedBenchmarks(prev => [...prev, bench.id])
                            }}
                            disabled={!canSelect}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-primary bg-primary/10' : canSelect ? 'border-border hover:border-primary/50' : 'border-border opacity-50 cursor-not-allowed'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bench.color }} />
                              <span className="text-sm font-medium">{bench.name}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Selected: {selectedBenchmarks.length}/3</p>
                    </div>
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
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotoneX" dataKey="portfolio" stroke="#22c55e" fillOpacity={1} fill="url(#portfolioGradient)" name="Your Portfolio" strokeWidth={3} />
                  {selectedBenchmarks.includes('sp500') && <Line type="monotoneX" dataKey="sp500" stroke="#3b82f6" name="S&P 500" strokeWidth={2} dot={false} />}
                  {selectedBenchmarks.includes('nasdaq') && <Line type="monotoneX" dataKey="nasdaq" stroke="#f59e0b" name="NASDAQ" strokeWidth={2} dot={false} />}
                  {selectedBenchmarks.includes('dowjones') && <Line type="monotoneX" dataKey="dowjones" stroke="#8b5cf6" name="Dow Jones" strokeWidth={2} dot={false} />}
                  {selectedBenchmarks.includes('russell2000') && <Line type="monotoneX" dataKey="russell2000" stroke="#ec4899" name="Russell 2000" strokeWidth={2} dot={false} />}
                  {selectedBenchmarks.includes('vti') && <Line type="monotoneX" dataKey="vti" stroke="#06b6d4" name="VTI" strokeWidth={2} dot={false} />}
                  {selectedBenchmarks.includes('voo') && <Line type="monotoneX" dataKey="voo" stroke="#84cc16" name="VOO" strokeWidth={2} dot={false} />}
                  {selectedBenchmarks.includes('vxus') && <Line type="monotoneX" dataKey="vxus" stroke="#f97316" name="VXUS" strokeWidth={2} dot={false} />}
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
              {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map(period => {
                const value = metrics.periodReturns[period] || 0
                return (
                  <div key={period} className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{period}</p>
                    <p className={`text-lg font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(value)}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="risk" className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Risk Level</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={riskGaugeData} startAngle={180} endAngle={0}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} fill={riskGaugeData[0].fill} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                      <tspan x="50%" dy="-10" fontSize="32" fontWeight="bold">{(100 - riskGaugeData[0].value).toFixed(0)}</tspan>
                      <tspan x="50%" dy="25" fontSize="14" className="fill-muted-foreground">Risk Score</tspan>
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {metrics.beta < 0.8 ? 'Low Risk - Conservative' : metrics.beta < 1.2 ? 'Moderate Risk - Balanced' : 'High Risk - Aggressive'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Risk Metrics</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Beta (Market Sensitivity)', value: metrics.beta.toFixed(2), tip: '1.0 = moves with market, >1.0 = more volatile', className: '' },
                  { label: 'Sharpe Ratio', value: metrics.sharpe.toFixed(2), tip: 'Risk-adjusted return. >1.0 is good', className: metrics.sharpe > 1 ? 'text-green-600' : 'text-yellow-600' },
                  { label: 'Sortino Ratio', value: metrics.sortino.toFixed(2), tip: 'Downside risk-adjusted return', className: 'text-green-600' },
                  { label: 'Volatility (Ann.)', value: `${metrics.volatility.toFixed(2)}%`, tip: 'Annualized standard deviation', className: '' },
                  { label: 'Max Drawdown', value: `${metrics.maxDrawdown.toFixed(2)}%`, tip: 'Largest peak-to-trough decline', className: 'text-red-600' },
                  { label: 'VaR (95%)', value: formatCurrency(metrics.var95), tip: 'Maximum expected 1-day loss (95% confidence)', className: 'text-orange-600' },
                ].map(({ label, value, tip, className }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground inline ml-1" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-xs text-xs">{tip}</p></TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    <p className={`text-xl font-bold ${className}`}>{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="attribution" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Return Attribution by Sector</CardTitle>
            <CardDescription>Which sectors contributed most to your returns</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.attribution && metrics.attribution.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.attribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                    <YAxis type="category" dataKey="sector" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Bar dataKey="contribution" name="Contribution to Return" radius={[0, 8, 8, 0]}>
                      {metrics.attribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? '#22c55e' : '#eb4a14'} />
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

      <TabsContent value="factors" className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Size Factor Exposure</CardTitle><CardDescription>Large vs Mid vs Small Cap</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Large Cap', value: metrics.factors.size.largeCap, color: 'bg-blue-500' },
                  { label: 'Mid Cap', value: metrics.factors.size.midCap, color: 'bg-green-500' },
                  { label: 'Small Cap', value: metrics.factors.size.smallCap, color: 'bg-orange-500' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
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
            <CardHeader><CardTitle>Style Factor Exposure</CardTitle><CardDescription>Growth vs Value Tilt</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Growth', value: metrics.factors.style.growth, color: 'bg-purple-500' },
                  { label: 'Value', value: metrics.factors.style.value, color: 'bg-teal-500' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
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
                <p className="text-sm font-medium mb-2">Interpretation:</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.factors.style.growth > 70 ? "Heavy growth tilt - higher expected volatility but potential for strong returns" : metrics.factors.style.value > 70 ? "Strong value tilt - lower volatility, dividend focus" : "Balanced growth/value mix"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="benchmarks" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Benchmark Comparison</CardTitle>
            <CardDescription>Your portfolio vs major market indices (1 Year)</CardDescription>
          </CardHeader>
          <CardContent>
            {benchmarks && Object.keys(benchmarks).length > 0 ? (
              <div className="space-y-3">
                {[
                  { key: 'sp500', name: 'S&P 500', region: 'US Large Cap' },
                  { key: 'nasdaq', name: 'NASDAQ-100', region: 'US Tech' },
                  { key: 'dowjones', name: 'Dow Jones', region: 'US Dividend' },
                  { key: 'russell2000', name: 'Russell 2000', region: 'US Small Cap' },
                  { key: 'vti', name: 'Total Market', region: 'US Broad' },
                  { key: 'voo', name: 'S&P 500 ETF', region: 'US Core' },
                  { key: 'vxus', name: 'International', region: 'Global' },
                ].map(({ key, name, region }) => {
                  const benchmark = benchmarks[key]
                  if (!benchmark) return null
                  const benchmarkReturn = benchmark.return || 0
                  const yourReturn = metrics.periodReturns['1Y'] || 0
                  const diff = yourReturn - benchmarkReturn
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
                          {diff >= 0 ? '+' : ''}{diff.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><p className="text-xs text-muted-foreground mb-1">Your Return</p><p className={`text-xl font-bold ${yourReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(yourReturn)}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-1">Benchmark</p><p className="text-xl font-bold">{formatPercent(benchmarkReturn)}</p></div>
                        <div><p className="text-xs text-muted-foreground mb-1">Difference</p><p className={`text-xl font-bold ${isWinning ? 'text-green-600' : 'text-red-600'}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}%</p></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No benchmark data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dividends" className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-green-600" />Total Dividends</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(dividendData.totalAnnual)}</div>
              <p className="text-xs text-muted-foreground mt-1">Annual (projected)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4" />Dividend Yield</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dividendData.avgYield.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Weighted average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" />Payout Frequency</CardTitle></CardHeader>
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
                {dividendData.dividendStocks.map(stock => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-semibold text-lg">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.shares.toFixed(2)} shares @ {formatCurrency(stock.price)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(stock.annualDivPerShare)}/share/year</p>
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
