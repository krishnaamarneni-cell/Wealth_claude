"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Target,
  AlertTriangle,
  PieChart,
  Info,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getTransactionsFromStorage, Transaction } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings } from "@/lib/holdings-calculator"
import type { Holding } from "@/lib/holdings-calculator"
import type { Trade } from "@/lib/portfolio-data"

// Format helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return "-"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"]

export default function InsightsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y" | "all">("all")

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const txns = getTransactionsFromStorage()
        setTransactions(txns)

        // Load holdings
        const holdingsData = await calculateAndFetchHoldings(txns)
        setHoldings(holdingsData)

        // Extract trades from transactions
        const trades: Trade[] = txns
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

        setTradeHistory(trades)
        console.log("[v0] Insights data loaded:", { holdings: holdingsData.length, trades: trades.length })
      } catch (error) {
        console.error("[v0] Failed to load insights data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        portfolioValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        winningPositions: 0,
        losingPositions: 0,
        topPerformer: null,
        worstPerformer: null,
        concentration: 0,
      }
    }

    const portfolioValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
    const totalGain = portfolioValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    const winningPositions = holdings.filter((h) => (h.gainPercent ?? 0) > 0).length
    const losingPositions = holdings.filter((h) => (h.gainPercent ?? 0) < 0).length

    const topPerformer = holdings.reduce((prev, current) =>
      (prev.gainPercent ?? 0) > (current.gainPercent ?? 0) ? prev : current
    )

    const worstPerformer = holdings.reduce((prev, current) =>
      (prev.gainPercent ?? 0) < (current.gainPercent ?? 0) ? prev : current
    )

    const concentration = portfolioValue > 0
      ? Math.max(...holdings.map((h) => (h.marketValue / portfolioValue) * 100))
      : 0

    return {
      portfolioValue,
      totalCost,
      totalGain,
      totalGainPercent,
      winningPositions,
      losingPositions,
      topPerformer,
      worstPerformer,
      concentration,
    }
  }, [holdings])

  // Filter trades by time range
  const getFilteredTrades = () => {
    if (timeRange === "all") return tradeHistory
    const now = new Date()
    const monthsBack = timeRange === "1m" ? 1 : timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate())
    return tradeHistory.filter((trade) => new Date(trade.date) >= cutoffDate)
  }

  const filteredTrades = getFilteredTrades()

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + rowsPerPage)

  // Trade statistics
  const buyTrades = filteredTrades.filter((t) => t.type === "BUY")
  const sellTrades = filteredTrades.filter((t) => t.type === "SELL")
  const totalBuyVolume = buyTrades.reduce((acc, t) => acc + t.total, 0)
  const totalSellVolume = sellTrades.reduce((acc, t) => acc + t.total, 0)

  // Monthly chart data
  const monthlyTrades = filteredTrades.reduce(
    (acc, trade) => {
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
    },
    {} as Record<string, { buys: number; sells: number }>
  )

  const chartData = Object.entries(monthlyTrades)
    .map(([month, data]) => ({
      month,
      buys: data.buys,
      sells: data.sells,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Insights</h1>
        <p className="text-muted-foreground mt-2">Portfolio performance analysis and trading insights</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 mr-3" />
            <p className="text-muted-foreground">Loading insights...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trade Analysis</TabsTrigger>
          </TabsList>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-6">
            {/* Portfolio Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics.portfolioValue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Current market value</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${portfolioMetrics.totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatPercent(portfolioMetrics.totalGainPercent)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(portfolioMetrics.totalGain)} gain</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    Winning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{portfolioMetrics.winningPositions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Positions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    Losing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{portfolioMetrics.losingPositions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Positions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Concentration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolioMetrics.concentration.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Largest holding</p>
                </CardContent>
              </Card>
            </div>

            {/* Top & Worst Performers */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioMetrics.topPerformer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{portfolioMetrics.topPerformer.symbol}</p>
                        <p className="text-sm text-muted-foreground">{portfolioMetrics.topPerformer.shares.toFixed(2)} shares</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{(portfolioMetrics.topPerformer.gainPercent ?? 0).toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(portfolioMetrics.topPerformer.gain ?? 0)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Worst Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioMetrics.worstPerformer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{portfolioMetrics.worstPerformer.symbol}</p>
                        <p className="text-sm text-muted-foreground">{portfolioMetrics.worstPerformer.shares.toFixed(2)} shares</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{(portfolioMetrics.worstPerformer.gainPercent ?? 0).toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(portfolioMetrics.worstPerformer.gain ?? 0)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Holdings Table */}
            {holdings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Holdings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead className="text-right">Shares</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-right">Return %</TableHead>
                          <TableHead className="text-right">Gain/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holdings.slice(0, 10).map((holding) => (
                          <TableRow key={holding.symbol}>
                            <TableCell className="font-medium">{holding.symbol}</TableCell>
                            <TableCell className="text-right text-sm">{holding.shares.toFixed(4)}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(holding.currentPrice)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold">{formatCurrency(holding.marketValue)}</TableCell>
                            <TableCell className={`text-right text-sm font-semibold ${(holding.gainPercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {(holding.gainPercent ?? 0).toFixed(2)}%
                            </TableCell>
                            <TableCell className={`text-right text-sm font-semibold ${(holding.gain ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(holding.gain ?? 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TRADE ANALYSIS TAB */}
          <TabsContent value="trades" className="space-y-6">
            {/* Trade Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Total Trades
                    <BarChart3 className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredTrades.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {buyTrades.length} buys, {sellTrades.length} sells
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Buy Volume
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBuyVolume)}</div>
                  <p className="text-xs text-muted-foreground">Total invested</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Sell Volume
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSellVolume)}</div>
                  <p className="text-xs text-muted-foreground">Total proceeds</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Net Volume
                    <TrendingUp className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBuyVolume - totalSellVolume)}</div>
                  <p className="text-xs text-muted-foreground">Buy - Sell</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Monthly Trading Volume</span>
                    <div className="flex gap-2">
                      {["1m", "3m", "6m", "1y", "all"].map((range) => (
                        <Button
                          key={range}
                          variant={timeRange === range ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeRange(range as "1m" | "3m" | "6m" | "1y" | "all")}
                        >
                          {range === "all" ? "All" : range.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="buys" name="Buys" fill="#22c55e" />
                        <Bar dataKey="sells" name="Sells" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trade History Table */}
            {tradeHistory.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Trade History</CardTitle>
                  <Select value={String(rowsPerPage)} onValueChange={(value) => {
                    setRowsPerPage(Number(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
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
                        {paginatedTrades.map((trade, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">
                              {new Date(trade.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={trade.type === "BUY" ? "default" : "destructive"}>
                                {trade.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{trade.shares.toFixed(4)}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(trade.price)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(trade.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
