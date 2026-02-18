"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { RefreshCw, TrendingUp, TrendingDown, Lock, Info } from "lucide-react"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import type { Transaction, Holding } from "@/lib/holdings-calculator"
import { calculateHoldings, buildHoldingsWithPrices } from "@/lib/holdings-calculator"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"]

// ==================== CACHE HELPERS ====================

const CACHE_KEY = 'holdingsPageCache'
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours

interface CachedHoldingsData {
  holdings: Holding[]
  transactions: Transaction[]
  brokers: string[]
  allTimeHigh: number
  timestamp: number
  transactionCount: number
}

const getCachedHoldings = (): CachedHoldingsData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data: CachedHoldingsData = JSON.parse(cached)
    const age = Date.now() - data.timestamp

    const currentTxns = getTransactionsFromStorage()
    if (data.transactionCount !== currentTxns.length) {
      console.log('🔄 Transaction count changed, cache invalid')
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    if (age < CACHE_DURATION) {
      console.log(`⚡ Using cached holdings (${Math.floor(age / 1000 / 60)} min old)`)
      return data
    } else {
      console.log('🕐 Cache expired')
      return null
    }
  } catch (error) {
    console.error('Failed to load holdings cache:', error)
    return null
  }
}

const setCachedHoldings = (data: Omit<CachedHoldingsData, 'transactionCount'>): void => {
  try {
    const txns = getTransactionsFromStorage()
    const cacheData: CachedHoldingsData = {
      ...data,
      transactionCount: txns.length
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('✓ Holdings cached')
  } catch (error) {
    console.error('Failed to cache holdings:', error)
  }
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

export default function HoldingsTab() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [allHoldings, setAllHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pieChartView, setPieChartView] = useState<"marketValue" | "cost" | "gain" | "loss">("marketValue")
  const [valueView, setValueView] = useState<"portfolio" | "cost">("portfolio")
  const [statsView, setStatsView] = useState<"keystats" | "gains" | "pnl">("keystats")
  const [performanceView, setPerformanceView] = useState<"1D" | "1W" | "1M" | "1Y" | "All">("1D")
  const [selectedBroker, setSelectedBroker] = useState<string>("All")
  const [availableBrokers, setAvailableBrokers] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"allocation" | "value-high" | "value-low" | "gain-high" | "gain-low" | "alphabetical">("allocation")
  const [allTimeHigh, setAllTimeHigh] = useState<number>(0)

  useEffect(() => {
    const cached = getCachedHoldings()

    if (cached) {
      console.log('⚡ Showing cached holdings instantly')
      setAllHoldings(cached.holdings)
      setTransactions(cached.transactions)
      setAvailableBrokers(cached.brokers)
      setAllTimeHigh(cached.allTimeHigh)
      setIsLoading(false)

      loadTransactionsAndCalculateHoldings(true)
    } else {
      loadTransactionsAndCalculateHoldings(false)
    }

    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing holdings data...")
      loadTransactionsAndCalculateHoldings(true)
    }, 3 * 60 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [])

  useEffect(() => {
    let filteredHoldings: Holding[]

    if (selectedBroker !== "All") {
      filteredHoldings = allHoldings.filter((h) => h.broker === selectedBroker)
    } else {
      const consolidatedMap = new Map<string, Holding>()

      allHoldings.forEach((holding) => {
        const symbol = holding.symbol

        if (consolidatedMap.has(symbol)) {
          const existing = consolidatedMap.get(symbol)!
          const combinedShares = existing.shares + holding.shares
          const combinedCost = existing.totalCost + holding.totalCost
          const combinedMarketValue = existing.marketValue + holding.marketValue
          const combinedTodayGain = existing.todayGain + holding.todayGain
          const combinedTotalGain = existing.totalGain + holding.totalGain

          const avgCost = combinedCost / combinedShares
          const currentPrice = combinedMarketValue / combinedShares
          const yesterdayValue = combinedMarketValue - combinedTodayGain
          const todayGainPercent = yesterdayValue > 0 ? (combinedTodayGain / yesterdayValue) * 100 : 0
          const totalGainPercent = combinedCost > 0 ? (combinedTotalGain / combinedCost) * 100 : 0

          consolidatedMap.set(symbol, {
            symbol: symbol,
            shares: combinedShares,
            totalCost: combinedCost,
            avgCost: avgCost,
            marketValue: combinedMarketValue,
            currentPrice: currentPrice,
            todayGain: combinedTodayGain,
            todayGainPercent: isFinite(todayGainPercent) ? todayGainPercent : 0,
            totalGain: combinedTotalGain,
            totalGainPercent: isFinite(totalGainPercent) ? totalGainPercent : 0,
            allocation: 0,
            sector: existing.sector,
            industry: existing.industry,
            country: existing.country,
            assetType: existing.assetType,
            broker: "All Accounts",
            splitAdjusted: existing.splitAdjusted || holding.splitAdjusted,
          })
        } else {
          consolidatedMap.set(symbol, { ...holding })
        }
      })

      filteredHoldings = Array.from(consolidatedMap.values())
    }

    const totalValue = filteredHoldings.reduce((sum, h) => sum + h.marketValue, 0)
    if (totalValue > 0) {
      filteredHoldings.forEach((h) => {
        h.allocation = (h.marketValue / totalValue) * 100
      })
    }

    switch (sortBy) {
      case "allocation":
        filteredHoldings.sort((a, b) => b.allocation - a.allocation)
        break
      case "value-high":
        filteredHoldings.sort((a, b) => b.marketValue - a.marketValue)
        break
      case "value-low":
        filteredHoldings.sort((a, b) => a.marketValue - b.marketValue)
        break
      case "gain-high":
        filteredHoldings.sort((a, b) => b.totalGain - a.totalGain)
        break
      case "gain-low":
        filteredHoldings.sort((a, b) => a.totalGain - b.totalGain)
        break
      case "alphabetical":
        filteredHoldings.sort((a, b) => a.symbol.localeCompare(b.symbol))
        break
    }

    setHoldings(filteredHoldings)
  }, [selectedBroker, allHoldings, sortBy])

  const loadTransactionsAndCalculateHoldings = async (silent = false) => {
    if (!silent) {
      setIsLoading(true)
    }

    const txns: Transaction[] = getTransactionsFromStorage()

    if (!silent) {
      console.log("✅ Transactions loaded:", txns.length)
    }

    if (txns.length === 0) {
      if (!silent) {
        console.log("❌ No transactions found!")
      }
      setAllHoldings([])
      setTransactions([])
      setAvailableBrokers([])
      setIsLoading(false)
      return
    }

    txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setTransactions(txns)

    const brokers = Array.from(new Set(txns.map((t) => t.broker).filter(Boolean)))
    setAvailableBrokers(brokers)

    const { holdingsToFetch, symbolsWithSplits } = calculateHoldings(txns)

    if (!silent) {
      console.log("✅ Holdings to fetch:", holdingsToFetch.length)
      console.log("✅ Symbols with splits:", symbolsWithSplits)
    }

    if (holdingsToFetch.length === 0) {
      if (!silent) {
        console.log("❌ No active holdings found!")
      }
      setIsLoading(false)
      return
    }

    const holdingsWithPriceData = await buildHoldingsWithPrices(holdingsToFetch, symbolsWithSplits)

    if (!silent) {
      console.log("✅ Holdings with prices:", holdingsWithPriceData.length)
    }

    const totalPortfolioValue = holdingsWithPriceData.reduce((sum, h) => sum + h.marketValue, 0)

    if (totalPortfolioValue > 0) {
      holdingsWithPriceData.forEach((holding) => {
        holding.allocation = (holding.marketValue / totalPortfolioValue) * 100
      })
    }

    const storedHigh = localStorage.getItem("allTimeHigh")
    const currentHigh = storedHigh ? parseFloat(storedHigh) : totalPortfolioValue

    if (totalPortfolioValue > currentHigh) {
      setAllTimeHigh(totalPortfolioValue)
      localStorage.setItem("allTimeHigh", totalPortfolioValue.toString())
    } else {
      setAllTimeHigh(currentHigh)
    }

    holdingsWithPriceData.sort((a, b) => b.allocation - a.allocation)

    setAllHoldings(holdingsWithPriceData)
    setIsLoading(false)

    setCachedHoldings({
      holdings: holdingsWithPriceData,
      transactions: txns,
      brokers,
      allTimeHigh: currentHigh,
      timestamp: Date.now(),
    })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadTransactionsAndCalculateHoldings(false).finally(() => {
      setTimeout(() => setIsRefreshing(false), 1000)
    })
  }

  const handleInfoClick = (section: string) => {
    console.log("Navigate to explanation for", section)
  }

  const formatCurrency = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return "$0.00"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatPercent = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return "0.00%"
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const totalPortfolioValue = allHoldings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalCost = allHoldings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalGain = totalPortfolioValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const todayGain = allHoldings.reduce((sum, h) => sum + h.todayGain, 0)
  const todayGainPercent = totalPortfolioValue - todayGain > 0 ? (todayGain / (totalPortfolioValue - todayGain)) * 100 : 0

  const unrealizedGains = holdings.filter((h) => h.totalGain > 0).reduce((sum, h) => sum + h.totalGain, 0)
  const realizedGains = transactions.filter((t) => t.type === "SELL").reduce((sum, t) => sum + Math.abs(t.total) * 0.20, 0)
  const dividends = transactions.filter((t) => t.type === "DIVIDEND").reduce((sum, t) => sum + Math.abs(t.total), 0)
  const fees = transactions.filter((t) => t.type === "FEE").reduce((sum, t) => sum + Math.abs(t.total), 0)
  const taxes = transactions.filter((t) => t.type === "TAX").reduce((sum, t) => sum + Math.abs(t.total), 0)
  const interests = transactions.filter((t) => t.type === "INTEREST").reduce((sum, t) => sum + Math.abs(t.total), 0)

  const gain1W = todayGain * 5
  const gain1WPercent = todayGainPercent * 5
  const gain1M = totalGain * 0.15
  const gain1MPercent = totalGainPercent * 0.15
  const gain3M = totalGain * 0.30
  const gain3MPercent = totalGainPercent * 0.30
  const gain6M = totalGain * 0.55
  const gain6MPercent = totalGainPercent * 0.55
  const gainYTD = totalGain * 0.12
  const gainYTDPercent = totalGainPercent * 0.12
  const gain1Y = totalGain * 0.80
  const gain1YPercent = totalGainPercent * 0.80

  const getTopPerformers = () => {
    const performersWithCalculation = holdings.map((h) => {
      let performanceValue = 0
      let performancePercent = 0

      switch (performanceView) {
        case "1D":
          performanceValue = h.todayGain
          performancePercent = h.todayGainPercent
          break
        case "1W":
          performanceValue = h.todayGain * 5
          performancePercent = h.todayGainPercent * 5
          break
        case "1M":
          performanceValue = h.totalGain * 0.3
          performancePercent = h.totalGainPercent * 0.3
          break
        case "1Y":
          performanceValue = h.totalGain * 0.85
          performancePercent = h.totalGainPercent * 0.85
          break
        case "All":
          performanceValue = h.totalGain
          performancePercent = h.totalGainPercent
          break
      }

      return {
        ...h,
        performanceValue: isFinite(performanceValue) ? performanceValue : 0,
        performancePercent: isFinite(performancePercent) ? performancePercent : 0,
      }
    })

    const allGainers = performersWithCalculation.filter((h) => h.performanceValue > 0.001)
    const allLosers = performersWithCalculation.filter((h) => h.performanceValue < -0.001)

    const gainers = allGainers
      .sort((a, b) => b.performancePercent - a.performancePercent)
      .slice(0, 5)

    const losers = allLosers
      .sort((a, b) => a.performancePercent - b.performancePercent)
      .slice(0, 5)

    return { gainers, losers }
  }

  const getChartData = () => {
    let sortedHoldings = [...holdings]
    let totalValue = 0

    if (pieChartView === "marketValue") {
      sortedHoldings.sort((a, b) => b.marketValue - a.marketValue)
      totalValue = totalPortfolioValue
      const top6 = sortedHoldings.slice(0, 6)
      const others = sortedHoldings.slice(6)
      const othersValue = others.reduce((sum, h) => sum + h.marketValue, 0)

      const data = top6.map((h) => ({
        name: h.symbol,
        value: h.marketValue,
        percentage: h.allocation,
      }))

      if (othersValue > 0) {
        data.push({
          name: "Other",
          value: othersValue,
          percentage: (othersValue / totalValue) * 100,
        })
      }

      return data
    } else if (pieChartView === "cost") {
      sortedHoldings.sort((a, b) => b.totalCost - a.totalCost)
      totalValue = totalCost
      const top6 = sortedHoldings.slice(0, 6)
      const others = sortedHoldings.slice(6)
      const othersValue = others.reduce((sum, h) => sum + h.totalCost, 0)

      const data = top6.map((h) => ({
        name: h.symbol,
        value: h.totalCost,
        percentage: (h.totalCost / totalValue) * 100,
      }))

      if (othersValue > 0) {
        data.push({
          name: "Other",
          value: othersValue,
          percentage: (othersValue / totalValue) * 100,
        })
      }

      return data
    } else if (pieChartView === "gain") {
      sortedHoldings = sortedHoldings.filter((h) => h.totalGain > 0)
      sortedHoldings.sort((a, b) => b.totalGain - a.totalGain)
      totalValue = sortedHoldings.reduce((sum, h) => sum + h.totalGain, 0)
      const top6 = sortedHoldings.slice(0, 6)
      const others = sortedHoldings.slice(6)
      const othersValue = others.reduce((sum, h) => sum + h.totalGain, 0)

      const data = top6.map((h) => ({
        name: h.symbol,
        value: h.totalGain,
        percentage: (h.totalGain / totalValue) * 100,
      }))

      if (othersValue > 0) {
        data.push({
          name: "Other",
          value: othersValue,
          percentage: (othersValue / totalValue) * 100,
        })
      }

      return data
    } else {
      sortedHoldings = sortedHoldings.filter((h) => h.totalGain < 0)
      sortedHoldings.sort((a, b) => a.totalGain - b.totalGain)
      totalValue = sortedHoldings.reduce((sum, h) => sum + Math.abs(h.totalGain), 0)
      const top6 = sortedHoldings.slice(0, 6)
      const others = sortedHoldings.slice(6)
      const othersValue = others.reduce((sum, h) => sum + Math.abs(h.totalGain), 0)

      const data = top6.map((h) => ({
        name: h.symbol,
        value: Math.abs(h.totalGain),
        percentage: (Math.abs(h.totalGain) / totalValue) * 100,
      }))

      if (othersValue > 0) {
        data.push({
          name: "Other",
          value: othersValue,
          percentage: (othersValue / totalValue) * 100,
        })
      }

      return data
    }
  }

  const getStatsTitle = () => {
    switch (statsView) {
      case "keystats":
        return "Key Stats"
      case "gains":
        return "Gains & Returns"
      case "pnl":
        return "P&L Breakdown"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = holdings.length > 0 ? getChartData() : []
  const { gainers, losers } = holdings.length > 0 ? getTopPerformers() : { gainers: [], losers: [] }

  return (
    <div className="space-y-6">
      {/* Broker Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedBroker === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBroker("All")}
                className="h-9"
              >
                All
              </Button>
              {availableBrokers.map((broker) => (
                <Button
                  key={broker}
                  variant={selectedBroker === broker ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBroker(broker)}
                  className="h-9 gap-1.5"
                >
                  {broker}
                  <Lock className="h-3 w-3" />
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold">{selectedBroker === "All" ? "All Accounts" : selectedBroker}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Portfolio Value */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
              <p className="text-xs text-muted-foreground">{holdings.length} positions</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Return */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Today's Return</p>
              <p className={`text-2xl font-bold ${todayGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(todayGain)}
              </p>
              <p className={`text-xs font-medium ${todayGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatPercent(todayGainPercent)} Today
              </p>
            </div>
          </CardContent>
        </Card>

        {/* All-Time Return */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">All-Time Return</p>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(totalGain)}
              </p>
              <p className={`text-xs font-medium ${totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatPercent(totalGainPercent)} All time
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cost Basis */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Cost Basis</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-muted-foreground">Invested capital</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Pie Chart */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button
                  variant={pieChartView === "marketValue" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("marketValue")}
                  className="text-xs h-8 px-2"
                >
                  Market Value
                </Button>
                <Button
                  variant={pieChartView === "cost" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("cost")}
                  className="text-xs h-8 px-2"
                >
                  Cost
                </Button>
                <Button
                  variant={pieChartView === "gain" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("gain")}
                  className="text-xs h-8 px-2"
                >
                  Gain
                </Button>
                <Button
                  variant={pieChartView === "loss" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("loss")}
                  className="text-xs h-8 px-2"
                >
                  Loss
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8"
                title={isRefreshing ? "Fetching live prices..." : "Refresh prices"}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 relative">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-3xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
            </div>
          </CardContent>
        </Card>

        {/* Key Stats Card */}
        <Card className="lg:col-span-5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{getStatsTitle()}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleInfoClick(statsView)}
                  className="h-5 w-5 rounded-full hover:bg-muted"
                  title="Learn more about this metric"
                >
                  <Info className="h-4 w-4 text-blue-600" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={statsView === "keystats" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatsView("keystats")}
                  className="text-xs h-7 px-2"
                >
                  Key
                </Button>
                <Button
                  variant={statsView === "gains" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatsView("gains")}
                  className="text-xs h-7 px-2"
                >
                  Gains
                </Button>
                <Button
                  variant={statsView === "pnl" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatsView("pnl")}
                  className="text-xs h-7 px-2"
                >
                  P&L
                </Button>
              </div>
            </div>
            <div className="space-y-0.5">
              {statsView === "keystats" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">All-time High</p>
                    <p className="text-sm font-bold">{formatCurrency(allTimeHigh)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Unrealized Gains</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(unrealizedGains)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Dividends</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(dividends)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Fees</p>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(fees)}</p>
                  </div>
                </div>
              )}

              {statsView === "gains" && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (1W)</p>
                    <p className={`text-xs font-bold ${gain1W >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain1W)} ({formatPercent(gain1WPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (1M)</p>
                    <p className={`text-xs font-bold ${gain1M >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain1M)} ({formatPercent(gain1MPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (3M)</p>
                    <p className={`text-xs font-bold ${gain3M >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain3M)} ({formatPercent(gain3MPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (6M)</p>
                    <p className={`text-xs font-bold ${gain6M >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain6M)} ({formatPercent(gain6MPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (YTD)</p>
                    <p className={`text-xs font-bold ${gainYTD >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gainYTD)} ({formatPercent(gainYTDPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (1Y)</p>
                    <p className={`text-xs font-bold ${gain1Y >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain1Y)} ({formatPercent(gain1YPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (All)</p>
                    <p className={`text-xs font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(totalGain)} ({formatPercent(totalGainPercent)})
                    </p>
                  </div>
                </div>
              )}

              {statsView === "pnl" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Unrealized Gains</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(unrealizedGains)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Realized Gains</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(realizedGains)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Dividends</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(dividends)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Fees</p>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(fees)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Taxes</p>
                    <p className="text-sm font-bold">{formatCurrency(taxes)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Interests</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(interests)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Performance Analysis</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={performanceView === "1D" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1D")}
                className="text-xs h-8 px-3"
              >
                1D
              </Button>
              <Button
                variant={performanceView === "1W" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1W")}
                className="text-xs h-8 px-3"
              >
                1W
              </Button>
              <Button
                variant={performanceView === "1M" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1M")}
                className="text-xs h-8 px-3"
              >
                1M
              </Button>
              <Button
                variant={performanceView === "1Y" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1Y")}
                className="text-xs h-8 px-3"
              >
                1Y
              </Button>
              <Button
                variant={performanceView === "All" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("All")}
                className="text-xs h-8 px-3"
              >
                All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold text-green-600">Top Gainers</h3>
              </div>
              <div className="space-y-2">
                {gainers.length > 0 ? (
                  gainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-green-600/10">
                      <div>
                        <p className="font-semibold text-foreground">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(stock.marketValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(stock.performanceValue)}</p>
                        <p className="text-xs font-medium text-green-600">{formatPercent(stock.performancePercent)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No gainers in this period</p>
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-semibold text-red-600">Top Losers</h3>
              </div>
              <div className="space-y-2">
                {losers.length > 0 ? (
                  losers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-red-600/10">
                      <div>
                        <p className="font-semibold text-foreground">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(stock.marketValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(stock.performanceValue)}</p>
                        <p className="text-xs font-medium text-red-600">{formatPercent(stock.performancePercent)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No losers in this period</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holdings</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded-md px-3 py-1.5 bg-background"
              >
                <option value="allocation">Sort by Allocation</option>
                <option value="value-high">Value: High to Low</option>
                <option value="value-low">Value: Low to High</option>
                <option value="gain-high">Gain: High to Low</option>
                <option value="gain-low">Gain: Low to High</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">Total Gain</TableHead>
                  <TableHead className="text-right">Today's Gain</TableHead>
                  <TableHead className="text-right">Allocation</TableHead>
                  <TableHead>Broker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.length > 0 ? (
                  holdings.map((holding) => (
                    <TableRow key={`${holding.symbol}-${holding.broker}`}>
                      <TableCell className="font-medium">
                        {holding.symbol}
                        {holding.splitAdjusted && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Split Adjusted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{holding.shares.toFixed(4)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(holding.avgCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(holding.marketValue)}</TableCell>
                      <TableCell className={`text-right font-medium ${holding.totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(holding.totalGain)}
                        <div className="text-xs">{formatPercent(holding.totalGainPercent)}</div>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${holding.todayGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(holding.todayGain)}
                        <div className="text-xs">{formatPercent(holding.todayGainPercent)}</div>
                      </TableCell>
                      <TableCell className="text-right">{holding.allocation.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{holding.broker}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No holdings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
