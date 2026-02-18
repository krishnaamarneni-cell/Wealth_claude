"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  Clock,
  Search,
  ArrowUpDown,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import {
  getCompleteDividendData,
  clearDividendCache,
  buildCalculatedDividendsFromTransactions,
  buildYieldBasedDividends,
  type DividendForecast,
} from "@/lib/dividend-forecast"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"

type CalendarViewType = "upcoming" | "historical" | "transactions"
type DividendSubTab = "overview" | "growth"

interface DividendCalendarEvent {
  symbol: string
  exDate: string
  payDate: string
  amount: number
  frequency: string
  daysUntil: number
}

interface DRIPTransaction {
  date: string
  symbol: string
  shares: number
  price: number
  amount: number
}

interface MonthlyDividendData {
  [symbol: string]: {
    [month: string]: number
  }
}

interface DividendTransactionRow {
  date: string
  symbol: string
  dividendAmount: number
  shares: number
  divPerShare: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const PRIMARY_GREEN = "#22c55e"

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  PRIMARY_GREEN,
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
]

// ============ CYLINDER BAR SHAPE ============

const CylinderBar: React.FC<any> = ({ x, y, width, height, fill, stroke, strokeWidth = 0 }) => {
  const radius = width / 2
  const centerX = x + width / 2
  const topY = y

  if (height <= 0) return null

  return (
    <g>
      <rect
        x={x}
        y={topY}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={radius}
        ry={radius}
      />
      <ellipse
        cx={centerX}
        cy={topY}
        rx={radius}
        ry={radius / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  )
}

// ============ INTERACTIVE DONUT ============

function InteractiveDividendDonut() {
  const [viewType, setViewType] = useState<"current" | "invested">("current")
  const [hoveredStock, setHoveredStock] = useState<string | null>(null)
  const { holdings, income } = usePortfolio()

  const prepareChartData = () => {
    const dividendStocks = holdings.filter((h) => income.dividendsBySymbol[h.symbol])

    if (dividendStocks.length === 0) {
      return { stocks: [], total: 0, totalDividends: 0 }
    }

    const total = dividendStocks.reduce((sum, h) => {
      return sum + (viewType === "current" ? h.marketValue : h.totalCost || 0)
    }, 0)

    const totalDividends = Object.values(income.dividendsBySymbol).reduce((sum, val) => sum + val, 0)

    const stocks = dividendStocks
      .map((h, index) => {
        const value = viewType === "current" ? h.marketValue : h.totalCost || 0
        const dividendAmount = income.dividendsBySymbol[h.symbol] || 0

        return {
          symbol: h.symbol,
          value,
          percentage: total ? (value / total) * 100 : 0,
          dividendAmount,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }
      })
      .sort((a, b) => b.value - a.value)

    return { stocks, total, totalDividends }
  }

  const { stocks, totalDividends } = prepareChartData()

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

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
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
      "M",
      start.x,
      start.y,
      "A",
      outerRadius,
      outerRadius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "L",
      innerEnd.x,
      innerEnd.y,
      "A",
      innerRadius,
      innerRadius,
      0,
      largeArcFlag,
      1,
      innerStart.x,
      innerStart.y,
      "Z",
    ].join(" ")
  }

  const displayStocks = hoveredStock
    ? [
      stocks.find((s) => s.symbol === hoveredStock)!,
      ...stocks.filter((s) => s.symbol !== hoveredStock),
    ].filter(Boolean)
    : stocks

  if (stocks.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Dividend Portfolio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No dividend-paying stocks found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Dividend Portfolio Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {viewType === "current" ? "current market value" : "invested amount"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewType("current")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewType === "current"
                  ? "bg-green-500 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Current
            </button>
            <button
              onClick={() => setViewType("invested")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewType === "invested"
                  ? "bg-green-500 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Invested
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
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

              {hoveredStock ? (
                <>
                  <text
                    x="200"
                    y="185"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="14"
                    fontWeight="500"
                  >
                    {hoveredStock}
                  </text>
                  <text
                    x="200"
                    y="210"
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="20"
                    fontWeight="700"
                  >
                    {formatCurrency(
                      segments.find((s) => s.symbol === hoveredStock)?.dividendAmount || 0
                    )}
                  </text>
                  <text
                    x="200"
                    y="230"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                  >
                    {segments.find((s) => s.symbol === hoveredStock)?.percentage.toFixed(1)}% of
                    portfolio
                  </text>
                </>
              ) : (
                <>
                  <text
                    x="200"
                    y="185"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="14"
                    fontWeight="500"
                  >
                    Total Dividends
                  </text>
                  <text
                    x="200"
                    y="215"
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="24"
                    fontWeight="700"
                  >
                    {formatCurrency(totalDividends)}
                  </text>
                </>
              )}
            </svg>
          </div>

          <div className="flex-1 max-w-md">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {displayStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${hoveredStock === stock.symbol
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
                    <span className="text-sm font-semibold text-foreground">
                      {stock.symbol}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      {stock.percentage.toFixed(2)}%
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      {formatCurrency(stock.dividendAmount)}
                    </div>
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

// ============ CALENDAR SECTION ============

function CalendarSection() {
  const [calendarView, setCalendarView] = useState<CalendarViewType>("upcoming")
  const [upcomingDividends, setUpcomingDividends] = useState<DividendCalendarEvent[]>([])
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  const [searchTicker, setSearchTicker] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DividendTransactionRow
    direction: "asc" | "desc"
  } | null>(null)

  const { holdings, income, transactions } = usePortfolio()
  const today = new Date()

  useEffect(() => {
    const fetchUpcomingDividends = async () => {
      if (holdings.length === 0) return

      setIsLoadingForecast(true)
      try {
        const symbols = holdings.map((h) => h.symbol).join(",")
        const response = await fetch(`/api/dividends/forecast?symbols=${symbols}`)
        const data = await response.json()

        const now = new Date()
        const events: DividendCalendarEvent[] = data
          .map((d: any) => ({
            symbol: d.symbol,
            exDate: d.exDate,
            payDate: d.payDate,
            amount: d.amount,
            frequency: d.frequency,
            daysUntil: Math.ceil(
              (new Date(d.payDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
          }))
          .filter((e: DividendCalendarEvent) => e.daysUntil >= 0)

        setUpcomingDividends(events)
      } catch (error) {
        console.error("Failed to fetch dividend forecast:", error)
      } finally {
        setIsLoadingForecast(false)
      }
    }

    fetchUpcomingDividends()
  }, [holdings])

  const generateMonthlyCalendar = () => {
    const calendar: MonthlyDividendData = {}
    const months: string[] = []

    for (let i = -12; i <= 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      months.push(monthKey)
    }

    const sourceDividendsByMonth = Object.keys(income.dividendsByMonth).length > 0
      ? income.dividendsByMonth
      : income.dividendsByMonth

    Object.entries(sourceDividendsByMonth).forEach(([month]) => {
      Object.entries(income.dividendsBySymbol).forEach(([symbol]) => {
        const symbolMonthDividends = transactions.filter(
          (t) =>
            t.type === "DIVIDEND" &&
            t.symbol === symbol &&
            t.date.startsWith(month)
        )

        if (symbolMonthDividends.length > 0) {
          if (!calendar[symbol]) calendar[symbol] = {}
          calendar[symbol][month] = symbolMonthDividends.reduce(
            (sum, t) => sum + Math.abs(parseFloat(String(t.total) || "0")),
            0
          )
        }
      })
    })

    return { calendar, months }
  }

  const { calendar: monthlyCalendar, months: calendarMonths } = generateMonthlyCalendar()

  const dividendTransactions: DividendTransactionRow[] = useMemo(() => {
    return transactions
      .filter((t) => t.type === "DIVIDEND")
      .map((t) => ({
        date: t.date,
        symbol: t.symbol,
        dividendAmount: Math.abs(parseFloat(String(t.total) || "0")),
        shares: Math.abs(parseFloat(String(t.shares) || "0")),
        divPerShare: t.price ? Math.abs(parseFloat(String(t.price))) : 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions])

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = dividendTransactions

    if (searchTicker) {
      filtered = filtered.filter((t) =>
        t.symbol.toLowerCase().includes(searchTicker.toLowerCase())
      )
    }

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (sortConfig.key === "date") {
          const aTime = new Date(aVal as string).getTime()
          const bTime = new Date(bVal as string).getTime()
          return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime
        }

        if (sortConfig.key === "symbol") {
          return sortConfig.direction === "asc"
            ? (aVal as string).localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal as string)
        }

        return sortConfig.direction === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number)
      })
    }

    return filtered
  }, [dividendTransactions, searchTicker, sortConfig])

  const handleSort = (key: keyof DividendTransactionRow) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "desc" }
      }
      if (current.direction === "desc") {
        return { key, direction: "asc" }
      }
      return null
    })
  }

  const SortIcon = ({ columnKey }: { columnKey: keyof DividendTransactionRow }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-30" />
    }
    return (
      <ArrowUpDown
        className={`h-3 w-3 ml-1 inline ${sortConfig.direction === "desc" ? "rotate-180" : ""
          }`}
      />
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <Calendar className="inline h-4 w-4 mr-2" />
            Dividend Calendar
          </CardTitle>

          <div className="flex gap-2">
            <button
              onClick={() => setCalendarView("upcoming")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${calendarView === "upcoming"
                  ? "bg-green-500 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setCalendarView("historical")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${calendarView === "historical"
                  ? "bg-green-500 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Historical
            </button>
            <button
              onClick={() => setCalendarView("transactions")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${calendarView === "transactions"
                  ? "bg-green-500 text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Transactions
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {calendarView === "upcoming" && (
          <>
            {isLoadingForecast && (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoadingForecast && upcomingDividends.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Ex-Date</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Days Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingDividends.slice(0, 20).map((event, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{event.symbol}</TableCell>
                      <TableCell className="text-sm">{formatDate(event.exDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(event.payDate)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(event.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${event.daysUntil <= 7
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-blue-500/10 text-blue-500"
                            }`}
                        >
                          {event.daysUntil}d
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              !isLoadingForecast && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No upcoming dividends scheduled</p>
                </div>
              )
            )}
          </>
        )}

        {calendarView === "historical" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">Ticker</TableHead>
                  {calendarMonths.slice(-18, -6).map((month) => (
                    <TableHead key={month} className="text-center min-w-[80px]">
                      {new Date(month + "-01").toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      })}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(monthlyCalendar)
                  .sort(([, a], [, b]) => {
                    const aTotal = Object.values(a).reduce(
                      (sum: number, val) => sum + val,
                      0
                    )
                    const bTotal = Object.values(b).reduce(
                      (sum: number, val) => sum + val,
                      0
                    )
                    return bTotal - aTotal
                  })
                  .map(([symbol, months]) => (
                    <TableRow key={symbol}>
                      <TableCell className="sticky left-0 bg-card z-10 font-medium">
                        {symbol}
                      </TableCell>
                      {calendarMonths.slice(-18, -6).map((month) => (
                        <TableCell key={month} className="text-center">
                          {months[month] ? (
                            <span className="inline-block px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs font-medium">
                              {formatCurrency(months[month])}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}

        {calendarView === "transactions" && (
          <>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by ticker..."
                  value={searchTicker}
                  onChange={(e) => setSearchTicker(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("date")}
                    >
                      Date <SortIcon columnKey="date" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("symbol")}
                    >
                      Ticker <SortIcon columnKey="symbol" />
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("dividendAmount")}
                    >
                      Dividend Amount <SortIcon columnKey="dividendAmount" />
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("shares")}
                    >
                      Shares Eligible <SortIcon columnKey="shares" />
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("divPerShare")}
                    >
                      Div Per Share <SortIcon columnKey="divPerShare" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.length > 0 ? (
                    filteredAndSortedTransactions.map((txn, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{formatDate(txn.date)}</TableCell>
                        <TableCell className="font-medium">{txn.symbol}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(txn.dividendAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {txn.shares.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(txn.divPerShare)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============ MAIN DIVIDENDS TAB ============

const FORECAST_CACHE_KEY = "dividend_page_forecasts_session"
const FORECAST_LOADED_KEY = "dividend_page_loaded_session"

export default function DividendsTab() {
  const [dividendSubTab, setDividendSubTab] = useState<DividendSubTab>("overview")
  const [dripTransactions, setDRIPTransactions] = useState<DRIPTransaction[]>([])
  const [forecasts, setForecasts] = useState<DividendForecast[]>([])
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(false)
  const hasLoadedRef = useRef(false)

  const {
    income,
    holdings,
    portfolioValue,
    transactions,
    isLoading,
  } = usePortfolio()

  const dividendPayingStocks = Object.keys(income.dividendsBySymbol).length
  const totalStocks = holdings.length

  // Build calculated dividends from transactions
  useEffect(() => {
    if (!transactions || transactions.length === 0) return

    const build = async () => {
      try {
        const result = await buildCalculatedDividendsFromTransactions()

        sessionStorage.setItem(
          "calculated_dividends_from_txn",
          JSON.stringify(result)
        )
      } catch (err) {
        console.error("Error building calculated dividends from transactions", err)
      }
    }

    build()
  }, [transactions])

  // Load forecast data once (with cache)
  useEffect(() => {
    const loadDividendData = async () => {
      if (hasLoadedRef.current || !holdings || holdings.length === 0) return

      try {
        const cached = sessionStorage.getItem(FORECAST_CACHE_KEY)
        const cachedLoaded = sessionStorage.getItem(FORECAST_LOADED_KEY)

        if (cached && cachedLoaded === "true") {
          const parsed: DividendForecast[] = JSON.parse(cached)

          const calcRaw = sessionStorage.getItem("calculated_dividends_from_txn")
          let calculated: DividendForecast[] = []
          if (calcRaw) {
            calculated = JSON.parse(calcRaw)
          }

          const merged = [...parsed, ...calculated]
          setForecasts(merged)
          hasLoadedRef.current = true
          return
        }
      } catch (err) {
        console.error("Session cache read error", err)
      }

      setIsLoadingForecasts(true)
      try {
        const symbols = holdings
          .filter((h) => h.shares > 0)
          .map((h) => h.symbol)

        const allForecasts: DividendForecast[] = []

        for (const symbol of symbols) {
          try {
            const symbolDivs = await getCompleteDividendData(symbol)
            allForecasts.push(...symbolDivs)
            await new Promise((resolve) => setTimeout(resolve, 200))
          } catch (err) {
            console.error(`Error fetching dividends for ${symbol}`, err)
          }
        }

        if (allForecasts.length === 0) {
          console.log('[Dividends] No API dividend data found, using yield-based calculation...')
          const yieldBasedDivs = buildYieldBasedDividends(transactions, holdings)
          allForecasts.push(...yieldBasedDivs)
        }

        const calcRaw = sessionStorage.getItem("calculated_dividends_from_txn")
        let calculated: DividendForecast[] = []
        if (calcRaw) {
          calculated = JSON.parse(calcRaw)
        }

        const merged = [...allForecasts, ...calculated].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        setForecasts(merged)
        hasLoadedRef.current = true

        sessionStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(allForecasts))
        sessionStorage.setItem(FORECAST_LOADED_KEY, "true")
      } catch (err) {
        console.error("Dividend load error", err)
      } finally {
        setIsLoadingForecasts(false)
      }
    }

    loadDividendData()
  }, [holdings, transactions])

  const receivedDividends = forecasts.filter((f) => f.type === "received")
  const upcomingDividends = forecasts.filter((f) => f.type === "upcoming")
  const totalReceived = receivedDividends.reduce((sum, f) => sum + f.totalAmount, 0)
  const totalUpcoming = upcomingDividends.reduce((sum, f) => sum + f.totalAmount, 0)

  // Calculate YTD (Year-to-Date) dividends
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const ytdDividends = receivedDividends
    .filter((f) => new Date(f.date) >= startOfYear)
    .reduce((sum, f) => sum + f.totalAmount, 0)

  const ytdPaymentCount = receivedDividends.filter(
    (f) => new Date(f.date) >= startOfYear
  ).length

  // Calculate last year's dividends for YoY growth
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1)
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31)
  const lastYearDividends = receivedDividends
    .filter((f) => {
      const date = new Date(f.date)
      return date >= startOfLastYear && date <= endOfLastYear
    })
    .reduce((sum, f) => sum + f.totalAmount, 0)

  // Calculate YoY Growth Rate
  const yoyGrowthRate = lastYearDividends > 0
    ? ((ytdDividends - lastYearDividends) / lastYearDividends) * 100
    : 0

  // Calculate upcoming 12 months
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  const upcoming12Months = upcomingDividends
    .filter((f) => new Date(f.date) <= oneYearFromNow)
    .reduce((sum, f) => sum + f.totalAmount, 0)

  const upcoming12MonthsCount = upcomingDividends.filter(
    (f) => new Date(f.date) <= oneYearFromNow
  ).length

  // Annual projection (upcoming 12 months)
  const annualProjection = upcoming12Months

  // Average monthly growth
  const monthsIntoYear = now.getMonth() + 1
  const avgMonthlyGrowth = monthsIntoYear > 0 ? yoyGrowthRate / monthsIntoYear : 0

  // 5-year projection (assuming constant growth rate)
  const fiveYearProjection = annualProjection * Math.pow(1 + (yoyGrowthRate / 100), 5)

  // Monthly data for cylinder chart
  const monthlyRaw = forecasts.reduce(
    (acc, f) => {
      const month = f.date.substring(0, 7)
      const existing = acc.find((d) => d.month === month)

      if (existing) {
        if (f.type === "received") {
          existing.received += f.totalAmount
        } else {
          existing.upcoming += f.totalAmount
        }
      } else {
        acc.push({
          month,
          received: f.type === "received" ? f.totalAmount : 0,
          upcoming: f.type === "upcoming" ? f.totalAmount : 0,
        })
      }

      return acc
    },
    [] as { month: string; received: number; upcoming: number }[]
  )

  monthlyRaw.sort((a, b) => a.month.localeCompare(b.month))

  const monthlyChartData = monthlyRaw.map((m) => ({
    month: m.month,
    received: m.received,
    upcoming: m.upcoming,
    total: m.received + m.upcoming,
  }))

  // Top payers
  const dividendBySymbol = forecasts.reduce(
    (acc, f) => {
      if (!acc[f.symbol]) {
        acc[f.symbol] = { symbol: f.symbol, total: 0, count: 0 }
      }
      acc[f.symbol].total += f.totalAmount
      acc[f.symbol].count++
      return acc
    },
    {} as Record<string, { symbol: string; total: number; count: number }>
  )

  const topPayers = Object.values(dividendBySymbol)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const today = new Date()
  const twelveMonthsAgo = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
  const ttmDividends = totalReceived

  const calculateYieldOnCost = () => {
    const totalCost = holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0)
    if (totalCost === 0) return 0
    return (ttmDividends / totalCost) * 100
  }

  const yieldOnCost = calculateYieldOnCost()
  const portfolioYield = portfolioValue > 0 ? (ttmDividends / portfolioValue) * 100 : 0

  // Average monthly and daily income
  const avgMonthlyIncome = ytdDividends / (now.getMonth() + 1 || 1)
  const daysIntoYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  const avgDailyIncome = ytdDividends / (daysIntoYear || 1)

  // DRIP from real transactions AND calculated dividends
  useEffect(() => {
    if (!transactions || transactions.length === 0) return

    const drips: DRIPTransaction[] = []
    const dividends = transactions.filter((t) => t.type === "DIVIDEND")

    dividends.forEach((div) => {
      const divDate = new Date(div.date)
      const divAmount = Math.abs(parseFloat(String(div.total) || "0"))

      const matchingBuys = transactions.filter((t) => {
        if (t.type !== "BUY" || t.symbol !== div.symbol) return false

        const buyDate = new Date(t.date)
        const daysDiff =
          (buyDate.getTime() - divDate.getTime()) / (1000 * 60 * 60 * 24)

        return daysDiff >= 0 && daysDiff <= 3
      })

      const matchingBuy = matchingBuys.find((buy) => {
        const buyAmount = Math.abs(parseFloat(String(buy.total) || "0"))
        const diff = Math.abs(divAmount - buyAmount)
        const percentDiff = (diff / divAmount) * 100
        return percentDiff < 20
      })

      if (matchingBuy) {
        const buyAmount = Math.abs(parseFloat(String(matchingBuy.total) || "0"))
        const shares = Math.abs(parseFloat(String(matchingBuy.shares) || "0"))

        drips.push({
          date: matchingBuy.date,
          symbol: matchingBuy.symbol,
          shares,
          price: parseFloat(String(matchingBuy.price) || "0"),
          amount: buyAmount,
        })
      }
    })

    drips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setDRIPTransactions(drips)
  }, [transactions, forecasts, holdings])

  const totalDRIP = dripTransactions.reduce((sum, d) => sum + d.amount, 0)
  const totalSharesAcquired = dripTransactions.reduce((sum, d) => sum + d.shares, 0)
  const dripRate = ytdDividends > 0 ? (totalDRIP / ytdDividends) * 100 : 0

  // Growth chart data (last 12 months)
  const growthChartData = monthlyChartData.slice(-12)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dividend data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={dividendSubTab === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setDividendSubTab("overview")}
              className="h-9"
            >
              Overview
            </Button>
            <Button
              variant={dividendSubTab === "growth" ? "default" : "outline"}
              size="sm"
              onClick={() => setDividendSubTab("growth")}
              className="h-9"
            >
              Growth & DRIP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OVERVIEW TAB */}
      {dividendSubTab === "overview" && (
        <>
          {/* Dividend Stats Row 1 - Core Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolioValue)}</p>
                  <p className="text-xs text-muted-foreground">
                    Number of Assets: {totalStocks}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dividend-Paying: {dividendPayingStocks}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Received (YTD)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(ytdDividends)}</p>
                  <p className="text-xs text-muted-foreground">{ytdPaymentCount} payment{ytdPaymentCount !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Upcoming (12M)</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(upcoming12Months)}</p>
                  <p className="text-xs text-muted-foreground">{upcoming12MonthsCount} payment{upcoming12MonthsCount !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Annual Projection</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(annualProjection)}</p>
                  <p className="text-xs text-muted-foreground">Next 12 months</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dividend Stats Row 2 - Yield Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Portfolio Yield (TTM)</p>
                  <p className="text-2xl font-bold">{portfolioYield.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Based on current value</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Yield on Cost (TTM)</p>
                  <p className="text-2xl font-bold">{yieldOnCost.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Based on cost basis</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Avg Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(avgMonthlyIncome)}</p>
                  <p className="text-xs text-muted-foreground">Based on YTD</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Avg Daily Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(avgDailyIncome)}</p>
                  <p className="text-xs text-muted-foreground">Based on YTD</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveDividendDonut />

            {/* Monthly Income Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Dividend Income</CardTitle>
                <p className="text-sm text-muted-foreground">Last 12 months + upcoming</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyChartData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value + "-01")
                        return date.toLocaleDateString("en-US", { month: "short" })
                      }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="received"
                      fill={PRIMARY_GREEN}
                      name="Received"
                      shape={<CylinderBar />}
                    />
                    <Bar
                      dataKey="upcoming"
                      fill="#3b82f6"
                      name="Upcoming"
                      shape={<CylinderBar />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Section */}
          <CalendarSection />

          {/* Top Dividend Payers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <TrendingUp className="inline h-4 w-4 mr-2" />
                Top 5 Dividend Payers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPayers.length > 0 ? (
                  topPayers.map((payer, idx) => (
                    <div
                      key={payer.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{payer.symbol}</p>
                          <p className="text-xs text-muted-foreground">{payer.count} payments</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(payer.total)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No dividend data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* GROWTH & DRIP TAB */}
      {dividendSubTab === "growth" && (
        <>
          {/* Growth Stats Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">YoY Growth Rate</p>
                  <p className={`text-2xl font-bold ${yoyGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {yoyGrowthRate >= 0 ? '+' : ''}{yoyGrowthRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Based on received vs upcoming</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Avg Monthly Growth</p>
                  <p className="text-2xl font-bold">{avgMonthlyGrowth.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Annualized into monthly rate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">5-Year Projection</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(fiveYearProjection)}</p>
                  <p className="text-xs text-muted-foreground">Assuming constant growth rate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Reinvested</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDRIP)}</p>
                  <p className="text-xs text-muted-foreground">{dripTransactions.length} transaction{dripTransactions.length !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DRIP Stats Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Shares Acquired</p>
                  <p className="text-2xl font-bold">{totalSharesAcquired.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">Through DRIP</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">DRIP Rate</p>
                  <p className="text-2xl font-bold">{dripRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Of total dividends</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Avg DRIP Per Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDRIP / 12)}</p>
                  <p className="text-xs text-muted-foreground">Based on YTD</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <TrendingUp className="inline h-4 w-4 mr-2" />
                Dividend Growth Over Time
              </CardTitle>
              <p className="text-sm text-muted-foreground">Dividend Income</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value + "-01")
                      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                    }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={PRIMARY_GREEN}
                    strokeWidth={3}
                    name="Total Dividends"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* DRIP Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Dividend Reinvestment (DRIP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dripTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dripTransactions.map((drip, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{formatDate(drip.date)}</TableCell>
                        <TableCell className="font-medium">{drip.symbol}</TableCell>
                        <TableCell className="text-right">{drip.shares.toFixed(6)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(drip.price)}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(drip.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No DRIP transactions detected</p>
                  <p className="text-sm mt-1">
                    DRIP transactions are detected when a BUY matches a DIVIDEND within 3 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
