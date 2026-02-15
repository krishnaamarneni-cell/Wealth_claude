"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ArrowDownRight, ArrowUpRight, BarChart3, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import type { Trade } from "@/lib/portfolio-data"

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

// INTERACTIVE DONUT FOR TRADE VOLUME BY SYMBOL
function InteractiveTradeDonut({ trades }: { trades: Trade[] }) {
  const [hoveredStock, setHoveredStock] = useState<string | null>(null)

  const prepareChartData = () => {
    // Group trades by symbol
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
    ? [stocks.find((s) => s.symbol === hoveredStock)!, ...stocks.filter((s) => s.symbol !== hoveredStock)].filter(
        Boolean
      )
    : stocks

  if (stocks.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Trade Volume by Symbol</CardTitle>
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
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Trade Volume by Symbol</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Total trading volume distribution</p>
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
                  <text x="200" y="185" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="500">
                    {hoveredStock}
                  </text>
                  <text x="200" y="210" textAnchor="middle" fill="#22c55e" fontSize="20" fontWeight="700">
                    {formatCurrency(segments.find((s) => s.symbol === hoveredStock)?.value || 0)}
                  </text>
                  <text x="200" y="230" textAnchor="middle" fill="#ffffff" fontSize="12">
                    {segments.find((s) => s.symbol === hoveredStock)?.percentage.toFixed(1)}% of volume
                  </text>
                </>
              ) : (
                <>
                  <text x="200" y="185" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="500">
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
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    hoveredStock === stock.symbol
                      ? "bg-gray-100/50 dark:bg-gray-800/50 ring-2 ring-gray-300 dark:ring-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  }`}
                  onMouseEnter={() => setHoveredStock(stock.symbol)}
                  onMouseLeave={() => setHoveredStock(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stock.color }}
                    />
                    <span className="text-sm font-semibold text-foreground">{stock.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{stock.percentage.toFixed(2)}%</div>
                    <div className="text-xs text-22c55e font-medium">{formatCurrency(stock.value)}</div>
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

export default function TradesPage() {
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all')

  // ✅ Load trades from actual transactions
  useEffect(() => {
    const loadTrades = () => {
      try {
        const transactions = getTransactionsFromStorage()
        console.log('[v0] Loaded transactions for trades:', transactions.length)
        
        const trades: Trade[] = transactions
          .filter((t) => t.type === 'BUY' || t.type === 'SELL')
          .map((t) => ({
            date: t.date,
            symbol: t.symbol,
            type: t.type as 'BUY' | 'SELL',
            shares: t.shares,
            price: t.price,
            total: t.total,
            fees: t.fees,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        console.log('[v0] Trades loaded:', trades.length, 'BUY:', trades.filter(t => t.type === 'BUY').length, 'SELL:', trades.filter(t => t.type === 'SELL').length)
        setTradeHistory(trades)
      } catch (error) {
        console.error('[v0] Failed to load trades:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrades()
  }, [])

  // Filter trades by time range
  const getFilteredTrades = () => {
    if (timeRange === 'all') return tradeHistory
    
    const now = new Date()
    const monthsBack = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate())
    
    return tradeHistory.filter(trade => new Date(trade.date) >= cutoffDate)
  }

  const filteredTrades = getFilteredTrades()

  // Pagination logic
  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex)

  // Reset to page 1 when rows per page changes
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Calculate trade statistics (based on filtered data)
  const buyTrades = filteredTrades.filter((t) => t.type === "BUY")
  const sellTrades = filteredTrades.filter((t) => t.type === "SELL")
  const totalBuyVolume = buyTrades.reduce((acc, t) => acc + t.total, 0)
  const totalSellVolume = sellTrades.reduce((acc, t) => acc + t.total, 0)
  const totalFees = filteredTrades.reduce((acc, t) => acc + t.fees, 0)

  // Group trades by month (based on filtered data)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trade Analysis</h1>
        <p className="text-muted-foreground">Review your trading activity and patterns</p>
      </div>

      {isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading trades...</p>
          </CardContent>
        </Card>
      ) : tradeHistory.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No trades found. Upload transactions to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {filteredTrades.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {buyTrades.length} buys, {sellTrades.length} sells
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Buy Volume</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalBuyVolume)}
                </div>
                <p className="text-xs text-muted-foreground">Total invested</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sell Volume</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalSellVolume)}
                </div>
                <p className="text-xs text-muted-foreground">Total proceeds</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fees</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalFees)}
                </div>
                <p className="text-xs text-muted-foreground">Commission-free!</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Monthly Trading Volume</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={timeRange === '1m' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('1m')}
                  >
                    1M
                  </Button>
                  <Button
                    variant={timeRange === '3m' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('3m')}
                  >
                    3M
                  </Button>
                  <Button
                    variant={timeRange === '6m' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('6m')}
                  >
                    6M
                  </Button>
                  <Button
                    variant={timeRange === '1y' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('1y')}
                  >
                    1Y
                  </Button>
                  <Button
                    variant={timeRange === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('all')}
                  >
                    All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#ffffff"
                        fontSize={12} 
                        tick={{ fill: '#ffffff' }}
                      />
                      <YAxis 
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                        stroke="#ffffff"
                        fontSize={12} 
                        tick={{ fill: '#ffffff' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--popover-foreground))",
                        }}
                        itemStyle={{
                          color: "hsl(var(--popover-foreground))",
                        }}
                        labelStyle={{
                          color: "hsl(var(--popover-foreground))",
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

            {/* Interactive Donut Chart */}
            <InteractiveTradeDonut trades={filteredTrades} />
          </div>

          {/* Trade History Table */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Trade History</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
                  <SelectTrigger className="w-[70px] h-8 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                      <TableHead className="text-right">Fees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrades.map((trade, index) => (
                      <TableRow key={`${trade.date}-${trade.symbol}-${startIndex + index}`}>
                        <TableCell className="text-muted-foreground">{trade.date}</TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === "BUY" ? "default" : "destructive"}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{trade.shares}</TableCell>
                        <TableCell className="text-right">{formatCurrency(trade.price)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(trade.total)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(trade.fees)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Bar */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}–{Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length} trades
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
