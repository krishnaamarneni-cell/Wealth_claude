"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { generatePerformanceHistory, extractPricesFromHoldings } from "@/lib/performance-history-generator"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings } from "@/lib/holdings-calculator"

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL"

interface BenchmarkConfig {
  [key: string]: boolean
}

// Color palette for benchmarks
const COLORS: Record<string, string> = {
  portfolio: "#22c55e",
  sp500: "#3b82f6",
  nasdaq: "#f59e0b",
  dowjones: "#ec4899",
  russell2000: "#14b8a6",
  totalmarket: "#8b5cf6",
  international: "#f97316",
  savings: "#6b7280",
}

const BENCHMARK_NAMES: Record<string, string> = {
  portfolio: "My Portfolio",
  sp500: "S&P 500",
  nasdaq: "NASDAQ-100",
  dowjones: "Dow Jones",
  russell2000: "Russell 2000",
  totalmarket: "Total Market",
  international: "International",
  savings: "Savings (4% APY)",
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface BenchmarkComparisonProps {
  selectedBenchmarks?: string[]
  onBenchmarkChange?: (benchmarks: string[]) => void
}

export function BenchmarkComparison({ selectedBenchmarks = ["portfolio", "sp500", "nasdaq"], onBenchmarkChange }: BenchmarkComparisonProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL")
  const [activeBenchmarks, setActiveBenchmarks] = useState<BenchmarkConfig>(
    selectedBenchmarks.reduce((acc, b) => ({ ...acc, [b]: true }), {})
  )
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Generate real performance data when component mounts or dependencies change
  useEffect(() => {
    const loadPerformanceData = async () => {
      setLoading(true)
      try {
        const transactions = getTransactionsFromStorage()
        const holdings = await calculateAndFetchHoldings(transactions)
        const prices = extractPricesFromHoldings(holdings)
        
        const history = generatePerformanceHistory(transactions, prices)
        setPerformanceHistory(history)
      } catch (error) {
        console.error('Error generating performance history:', error)
        setPerformanceHistory([])
      } finally {
        setLoading(false)
      }
    }

    loadPerformanceData()
  }, [])

  const toggleBenchmark = (key: string) => {
    const newBenchmarks = { ...activeBenchmarks, [key]: !activeBenchmarks[key] }
    setActiveBenchmarks(newBenchmarks)
    if (onBenchmarkChange) {
      onBenchmarkChange(Object.keys(newBenchmarks).filter(k => newBenchmarks[k]))
    }
  }

  // Filter data based on time range
  const getFilteredData = () => {
    const monthsMap: Record<TimeRange, number> = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "ALL": performanceHistory.length,
    }
    return performanceHistory.slice(-monthsMap[timeRange])
  }

  const filteredData = getFilteredData()

  console.log('[v0] Filtered data:', filteredData)

  // Handle empty filtered data
  if (filteredData.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Total Return vs Benchmarks</CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="h-8">
              {(["1M", "3M", "6M", "1Y", "ALL"] as TimeRange[]).map((range) => (
                <TabsTrigger key={range} value={range} className="h-6 px-2 text-xs">
                  {range}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            {loading ? "Loading performance data..." : "Add transactions to see performance data"}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate percentage returns from the first data point
  const normalizedData = filteredData.map((item) => {
    const baseData = filteredData[0]
    const normalized: any = { date: item.date }
    
    Object.keys(activeBenchmarks).forEach(key => {
      if (activeBenchmarks[key] && baseData) {
        const itemValue = item[key as keyof typeof item] as number
        const baseValue = baseData[key as keyof typeof baseData] as number
        if (typeof itemValue === 'number' && typeof baseValue === 'number' && baseValue > 0) {
          normalized[key] = ((itemValue - baseValue) / baseValue) * 100
        }
      }
    })
    
    return normalized
  })

  console.log('[v0] Normalized data sample:', normalizedData[0], normalizedData[normalizedData.length - 1])

  // Calculate summary stats
  const latestData = filteredData[filteredData.length - 1]
  const startData = filteredData[0]

  const summaryStats: Record<string, any> = {}
  if (latestData && startData) {
    Object.keys(activeBenchmarks).forEach(key => {
      if (activeBenchmarks[key]) {
        const latestValue = latestData[key as keyof typeof latestData] as number
        const startValue = startData[key as keyof typeof startData] as number
        if (typeof latestValue === 'number' && typeof startValue === 'number' && startValue > 0) {
          summaryStats[key] = {
            value: latestValue,
            return: ((latestValue - startValue) / startValue) * 100,
          }
        }
      }
    })
  }

  const visibleBenchmarks = Object.keys(activeBenchmarks).filter(k => activeBenchmarks[k])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Total Return vs Benchmarks</CardTitle>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList className="h-8">
            {(["1M", "3M", "6M", "1Y", "ALL"] as TimeRange[]).map((range) => (
              <TabsTrigger key={range} value={range} className="h-6 px-2 text-xs">
                {range}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benchmark toggles */}
        <div className="flex flex-wrap gap-4">
          {Object.keys(BENCHMARK_NAMES).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={activeBenchmarks[key] || false}
                onCheckedChange={() => toggleBenchmark(key)}
              />
              <Label htmlFor={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: COLORS[key] || "#999" }} 
                />
                {BENCHMARK_NAMES[key]}
              </Label>
            </div>
          ))}
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Loading performance data...
          </div>
        ) : visibleBenchmarks.length > 0 && normalizedData.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={normalizedData} margin={{ top: 5, right: 30, left: 60, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, ""]}
                />
                <Legend />
                {visibleBenchmarks.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={BENCHMARK_NAMES[key]}
                    stroke={COLORS[key]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            {performanceHistory.length === 0 ? "Add transactions to see performance data" : "Select at least one benchmark to view comparison"}
          </div>
        )}

        {/* Summary Stats */}
        {visibleBenchmarks.length > 0 && (
          <div className={`grid gap-3 ${visibleBenchmarks.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : visibleBenchmarks.length <= 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
            {visibleBenchmarks.map((key) => (
              <div key={key} className="rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: COLORS[key] }} 
                  />
                  <span className="text-xs text-muted-foreground">{BENCHMARK_NAMES[key]}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(summaryStats[key]?.value || 0)}
                </p>
                <p className={summaryStats[key]?.return >= 0 ? "text-xs text-primary" : "text-xs text-destructive"}>
                  {summaryStats[key]?.return >= 0 ? "+" : ""}{(summaryStats[key]?.return || 0).toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
