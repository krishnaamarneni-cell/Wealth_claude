"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
  Target,
  RefreshCw,
} from "lucide-react"
import { getTransactionsFromStorage, Transaction } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings, type Holding } from "@/lib/holdings-calculator"

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"]

interface Trade {
  date: string
  symbol: string
  type: "BUY" | "SELL"
  shares: number
  price: number
  total: number
  fees: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "-"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

// ==================== INTERACTIVE DONUT CHART ====================
function InteractiveTradeDonut({ trades }: { trades: Trade[] }) {
  const [hoveredStock, setHoveredStock] = useState<string | null>(null)

  const prepareChartData = () => {
    const tradesBySymbol = trades.reduce((acc, trade) => {
      if (!acc[trade.symbol]) {
        acc[trade.symbol] = 0
      }
      acc[trade.symbol] += trade.total
      return acc
    }, {} as Record<string, number>)

    if (Object.keys(tradesBySymbol).length === 0) {
      return { stocks: [], total: 0 }
    }

    const total = Object.values(tradesBySymbol).reduce((sum, val) => sum + val, 0)

    const stocks = Object.entries(tradesBySymbol)
      .map(([symbol, value], index) => ({
        symbol,
        value,
        percentage: total ? (value / total) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    return { stocks, total }
  }

  const { stocks, total } = prepareChartData()

  let currentAngle = -90
  const segments = stocks.map((stock) => {
    const angle = (stock.percentage / 100) * 360
    const segment = {
      ...stock,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    }
    currentAngle += angle
    return segment
  })

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const createArc = (
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number
  ) => {
    const start = polarToCartesian(200, 200, outerRadius, endAngle)
    const end = polarToCartesian(200, 200, outerRadius, startAngle)
    const innerStart = polarToCartesian(200, 200, innerRadius, endAngle)
    const innerEnd = polarToCartesian(200, 200, innerRadius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ")
  }

  const displayStocks = hoveredStock
    ? [stocks.find((s) => s.symbol === hoveredStock)!, ...stocks.filter((s) => s.symbol !== hoveredStock)].filter(Boolean)
    : stocks

  if (stocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trade Volume by Symbol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No trades found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trade Volume by Symbol</CardTitle>
        <CardDescription>Total trading volume distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SVG Donut */}
          <div className="flex-1">
            <svg viewBox="0 0 400 400" className="w-full h-auto max-w-[400px] mx-auto">
              {segments.map((segment, index) => {
                const isHovered = hoveredStock === segment.symbol
                const outerRadius = isHovered ? 175 : 165
                return (
                  <path
                    key={index}
                    d={createArc(segment.startAngle, segment.endAngle, 100, outerRadius)}
                    fill={segment.color}
                    opacity={hoveredStock && !isHovered ? 0.3 : 1}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredStock(segment.symbol)}
                    onMouseLeave={() => setHoveredStock(null)}
                  />
                )
              })}

              {/* Center Text */}
              {hoveredStock ? (
                <>
                  <text x="200" y="185" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="500">
                    {hoveredStock}
                  </text>
                  <text x="200" y="210" textAnchor="middle" fill="#22c55e" fontSize="20" fontWeight="700">
                    {formatCurrency(segments.find((s) => s.symbol === hoveredStock)?.value || 0)}
                  </text>
                  <text x="200" y="230" textAnchor="middle" fill="currentColor" fontSize="12">
                    {segments.find((s) => s.symbol === hoveredStock)?.percentage.toFixed(1)}% of volume
                  </text>
                </>
              ) : (
                <>
                  <text x="200" y="185" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="500">
                    Total Volume
                  </text>
                  <text x="200" y="215" textAnchor="middle" fill="#22c55e" fontSize="24" fontWeight="700">
                    {formatCurrency(total)}
                  </text>
                </>
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 max-w-md">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {displayStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border ${hoveredStock === stock.symbol ? "border-primary" : "border-transparent hover:border-muted"
                    }`}
                  onMouseEnter={() => setHoveredStock(stock.symbol)}
                  onMouseLeave={() => setHoveredStock(null)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stock.color }} />
                    <span className="text-sm font-semibold">{stock.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{stock.percentage.toFixed(2)}%</div>
                    <div className="text-xs text-green-600 font-medium">{formatCurrency(stock.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== MAIN PAGE ====================
export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("trades")
  const [trades, setTrades] = useState<Trade[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Trade Analysis states
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y" | "all">("all")

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const txns = getTransactionsFromStorage()
        setTransactions(txns)

        // Load trades
        const tradesData: Trade[] = txns
          .filter((t) => t.type === "BUY" || t.type === "SELL")
          .map((t) => ({
            date: t.date,
            symbol: t.symbol,
            type: t.type as "BUY" | "SELL",
            shares: t.shares,
            price: t.price,
            total: t.total,
            fees: t.fees,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTrades(tradesData)

        // Load holdings for performance tab
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

  // Filter trades by time range
  const getFilteredTrades = () => {
    if (timeRange === "all") return trades

    const now = new Date()
    const monthsBack = timeRange === "1m" ? 1 : timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate())

    return trades.filter((trade) => new Date(trade.date) >= cutoffDate)
  }

  const filteredTrades = getFilteredTrades()

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex)

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Trade statistics
  const buyTrades = filteredTrades.filter((t) => t.type === "BUY")
  const sellTrades = filteredTrades.filter((t) => t.type === "SELL")
  const totalBuyVolume = buyTrades.reduce((acc, t) => acc + t.total, 0)
  const totalSellVolume = sellTrades.reduce((acc, t) => acc + t.total, 0)
  const totalFees = filteredTrades.reduce((acc, t) => acc + t.fees, 0)

  // Monthly trades chart
  const monthlyTrades = filteredTrades.reduce((acc, trade) => {
    const month = trade.date.substring(0, 7)
    if (!acc[month]) {
      acc[month] = { buys: 0, sells: 0 }
    }
    if (trade.type === "BUY") {
      acc[month].buys += trade.total
    } else {
      acc[month].sells += trade.total
    }
    return acc
  }, {} as Record<string, { buys: number; sells: number }>)

  const chartData = Object.entries(monthlyTrades)
    .map(([month, data]) => ({
      month,
      buys: data.buys,
      sells: data.sells,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Performance metrics
  const metrics = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        portfolioValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        todayChange: 0,
        todayChangePercent: 0,
      }
    }

    const portfolioValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
    const totalGain = portfolioValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    const todayChangePercent = holdings.reduce((sum, h) => {
      const weight = h.allocation / 100
      const change = h.returns?.["1D"] || 0
      return sum + weight * change
    }, 0)
    const todayChange = (portfolioValue * todayChangePercent) / 100

    return {
      portfolioValue,
      totalCost,
      totalGain,
      totalGainPercent,
      todayChange,
      todayChangePercent,
    }
  }, [holdings])

  // Historical chart data (simplified)
  const historicalData = useMemo(() => {
    const months = []
    const today = new Date()

    for (let i = 11; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = month.toLocaleDateString("en-US", { month: "short" })

      const txnsUpTo = transactions.filter((t) => new Date(t.date) <= month)
      const costBasis = txnsUpTo.filter((t) => t.type === "BUY").reduce((sum, t) => sum + t.total, 0)
      const estimatedValue = costBasis * (1 + metrics.totalGainPercent / 100)

      months.push({
        month: monthKey,
        portfolio: estimatedValue,
        benchmark: costBasis * 1.15, // Mock benchmark
      })
    }

    return months
  }, [transactions, metrics])

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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive analysis of trading activity and portfolio performance
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trades">Trade Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ==================== TRADE ANALYSIS TAB ==================== */}
        <TabsContent value="trades" className="space-y-6">
          {trades.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No trades found. Upload transactions to get started.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredTrades.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {buyTrades.length} buys, {sellTrades.length} sells
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Buy Volume</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBuyVolume)}</div>
                    <p className="text-xs text-muted-foreground">Total invested</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sell Volume</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSellVolume)}</div>
                    <p className="text-xs text-muted-foreground">Total proceeds</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Fees</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalFees)}</div>
                    <p className="text-xs text-muted-foreground">Transaction costs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Monthly Trading Volume</CardTitle>
                    <div className="flex gap-1">
                      {(["1m", "3m", "6m", "1y", "all"] as const).map((range) => (
                        <Button
                          key={range}
                          variant={timeRange === range ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeRange(range)}
                        >
                          {range.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [formatCurrency(value), ""]}
                          />
                          <Legend />
                          <Bar dataKey="buys" name="Buys" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="sells" name="Sells" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <InteractiveTradeDonut trades={filteredTrades} />
              </div>

              {/* Trade History Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Trade History</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows:</span>
                    <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTrades.map((trade, index) => (
                        <TableRow key={`${trade.date}-${trade.symbol}-${startIndex + index}`}>
                          <TableCell className="text-muted-foreground">{trade.date}</TableCell>
                          <TableCell className="font-medium">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={trade.type === "BUY" ? "default" : "destructive"}>{trade.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{trade.shares}</TableCell>
                          <TableCell className="text-right">{formatCurrency(trade.price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(trade.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t pt-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}–{Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm px-2 py-1">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ==================== PERFORMANCE TAB ==================== */}
        <TabsContent value="performance" className="space-y-6">
          {holdings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No performance data yet. Upload transactions to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Portfolio Value
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
                      <TrendingUp className="h-4 w-4" />
                      Total Return
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
                      <Target className="h-4 w-4" />
                      Holdings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{holdings.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">{transactions.length} transactions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Cost Basis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</div>
                    <p className="text-sm text-muted-foreground mt-1">Total invested</p>
                  </CardContent>
                </Card>
              </div>

              {/* Historical Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Performance (12 Months)</CardTitle>
                  <CardDescription>Track your portfolio growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="portfolio"
                          name="Your Portfolio"
                          stroke="#22c55e"
                          fill="#22c55e"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="benchmark"
                          name="Benchmark"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Period Returns */}
              <Card>
                <CardHeader>
                  <CardTitle>Period Returns</CardTitle>
                  <CardDescription>Performance across different time periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {["1D", "1W", "1M", "3M", "6M", "1Y"].map((period) => {
                      const returnValue =
                        holdings.reduce((sum, h) => {
                          const weight = h.allocation / 100
                          const ret = h.returns?.[period] || 0
                          return sum + weight * ret
                        }, 0) || 0

                      return (
                        <div key={period} className="p-4 rounded-lg bg-secondary/30">
                          <p className="text-sm text-muted-foreground mb-1">{period}</p>
                          <p className={`text-xl font-bold ${returnValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(returnValue)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
