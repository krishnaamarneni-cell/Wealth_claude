"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from "recharts"
import { getChartData, calculateBenchmarkValues, type TimeRange, type ChartDataPoint } from "@/lib/chart-data"
import { usePortfolio } from "@/lib/portfolio-context"
import { TrendingUp, TrendingDown } from "lucide-react"

const TIME_PERIODS: { value: TimeRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'ALL' },
]

const BENCHMARKS = [
  { value: 'SPY', label: 'S&P 500 (SPY)' },
  { value: 'QQQ', label: 'Nasdaq (QQQ)' },
  { value: 'DIA', label: 'Dow Jones (DIA)' },
  { value: 'VTI', label: 'Total Market (VTI)' },
  { value: 'VOO', label: 'Vanguard S&P (VOO)' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case '1d': return 'Today'
    case '1w': return 'Past week'
    case '1m': return 'Past month'
    case '3m': return 'Past 3 months'
    case '6m': return 'Past 6 months'
    case '1y': return 'Past year'
    case 'all': return 'All time'
    default: return 'All time'
  }
}

// Generate mock chart data as fallback
function generateMockData(timeRange: TimeRange, currentValue: number, totalCost: number): ChartDataPoint[] {
  const now = new Date()
  const points: ChartDataPoint[] = []

  let numPoints = 30
  let daysBack = 30

  switch (timeRange) {
    case '1d':
      numPoints = 24
      daysBack = 1
      break
    case '1w':
      numPoints = 7
      daysBack = 7
      break
    case '1m':
      numPoints = 30
      daysBack = 30
      break
    case '3m':
      numPoints = 90
      daysBack = 90
      break
    case '6m':
      numPoints = 180
      daysBack = 180
      break
    case '1y':
      numPoints = 365
      daysBack = 365
      break
    case 'all':
      numPoints = 365
      daysBack = 365
      break
  }

  const startValue = totalCost || currentValue * 0.85
  const valueChange = currentValue - startValue

  for (let i = 0; i < numPoints; i++) {
    const date = new Date(now.getTime() - (daysBack - (daysBack * i / numPoints)) * 24 * 60 * 60 * 1000)

    // Generate smooth curve with some volatility
    const progress = i / (numPoints - 1)
    const volatility = Math.sin(i * 0.5) * (currentValue * 0.02)
    const value = startValue + (valueChange * progress) + volatility

    points.push({
      date: date.toISOString(),
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolioValue: Math.max(0, value),
      portfolioChange: value - startValue,
      portfolioChangePercent: ((value - startValue) / startValue) * 100
    })
  }

  return points
}

export default function PortfolioChart() {
  const {
    portfolioValue,
    totalCost,
    totalGain,
    totalGainPercent,
    transactions,
    isLoading: portfolioLoading
  } = usePortfolio()

  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [selectedBenchmark, setSelectedBenchmark] = useState('SPY')
  const [showBenchmark, setShowBenchmark] = useState(false)
  const [hoveredData, setHoveredData] = useState<ChartDataPoint | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load chart data
  useEffect(() => {
    if (portfolioLoading || portfolioValue === 0) return

    const loadData = async () => {
      setIsLoading(true)

      try {
        // Try to get real chart data
        let data = getChartData(timeRange, portfolioValue, totalCost, transactions)

        console.log('📊 Chart data from getChartData:', data.length, 'points')

        // If no data, generate mock data as fallback
        if (!data || data.length === 0) {
          console.log('⚠️ No real data, generating mock data')
          data = generateMockData(timeRange, portfolioValue, totalCost)
        }

        console.log('✅ Final chart data:', data.length, 'points')
        console.log('Sample:', data.slice(0, 2))

        // Add benchmark comparison if enabled
        if (showBenchmark) {
          data = await calculateBenchmarkValues(transactions, selectedBenchmark, data)
        }

        setChartData(data)
      } catch (error) {
        console.error('❌ Error loading chart data:', error)
        // Generate fallback data on error
        const fallbackData = generateMockData(timeRange, portfolioValue, totalCost)
        setChartData(fallbackData)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [timeRange, showBenchmark, selectedBenchmark, portfolioValue, totalCost, transactions, portfolioLoading])

  // Calculate period-specific values
  const startValue = chartData.length > 0 ? chartData[0].portfolioValue : totalCost
  const endValue = chartData.length > 0 ? chartData[chartData.length - 1].portfolioValue : portfolioValue
  const periodGain = endValue - startValue
  const periodGainPercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0

  const currentData = {
    portfolioValue: endValue,
    portfolioChange: periodGain,
    portfolioChangePercent: periodGainPercent,
    benchmarkValue: chartData.length > 0 ? chartData[chartData.length - 1]?.benchmarkValue : undefined,
    benchmarkChange: chartData.length > 0 ? chartData[chartData.length - 1]?.benchmarkChange : undefined,
    benchmarkChangePercent: chartData.length > 0 ? chartData[chartData.length - 1]?.benchmarkChangePercent : undefined,
  }

  const displayData = hoveredData || currentData

  // Calculate benchmark performance difference
  const benchmarkDiff = showBenchmark && displayData.benchmarkValue
    ? displayData.portfolioValue - displayData.benchmarkValue
    : 0

  const benchmarkDiffPercent = showBenchmark && displayData.benchmarkValue && displayData.benchmarkValue > 0
    ? ((displayData.portfolioValue - displayData.benchmarkValue) / displayData.benchmarkValue) * 100
    : 0

  if (portfolioLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading portfolio data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (portfolioValue === 0 || totalCost === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center flex-col space-y-2">
            <p className="text-muted-foreground">No portfolio data available</p>
            <p className="text-sm text-muted-foreground">Add transactions to see your portfolio performance chart</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        {/* Portfolio Value Display */}
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight">
            {formatCurrency(displayData.portfolioValue)}
          </h2>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-lg font-semibold ${displayData.portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {displayData.portfolioChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatCurrency(Math.abs(displayData.portfolioChange))} ({formatPercent(displayData.portfolioChangePercent)})
            </span>
            <span className="text-muted-foreground text-sm">
              {getTimeRangeLabel(timeRange)}
            </span>
          </div>

          {/* Benchmark Comparison Badge */}
          {showBenchmark && displayData.benchmarkValue && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${benchmarkDiff >= 0
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
              }`}>
              {benchmarkDiff >= 0 ? '🎉' : '📉'} vs {selectedBenchmark}: {formatCurrency(benchmarkDiff)} ({formatPercent(benchmarkDiffPercent)})
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!isMounted ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Generating chart...</p>
          </div>
        ) : (
          <>
            {/* Chart Container */}
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  onMouseMove={(e: any) => {
                    if (e.activePayload && e.activePayload[0]) {
                      const payload = e.activePayload[0].payload
                      const periodStart = chartData[0]
                      setHoveredData({
                        ...payload,
                        portfolioChange: payload.portfolioValue - periodStart.portfolioValue,
                        portfolioChangePercent: ((payload.portfolioValue - periodStart.portfolioValue) / periodStart.portfolioValue) * 100,
                        benchmarkChange: payload.benchmarkValue ? payload.benchmarkValue - (chartData[0].benchmarkValue || 0) : undefined,
                        benchmarkChangePercent: payload.benchmarkValue && chartData[0].benchmarkValue
                          ? ((payload.benchmarkValue - chartData[0].benchmarkValue) / chartData[0].benchmarkValue) * 100
                          : undefined
                      })
                      setHoveredIndex(e.activeTooltipIndex)
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredData(null)
                    setHoveredIndex(null)
                  }}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  {/* Add subtle grid */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />

                  {/* X Axis */}
                  <XAxis
                    dataKey="displayDate"
                    hide={true}
                  />

                  {/* Y Axis */}
                  <YAxis
                    hide={true}
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                  />

                  {/* Tooltip */}
                  <Tooltip
                    content={() => null}
                    cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />

                  {/* Portfolio Line - GREEN */}
                  <Line
                    type="monotone"
                    dataKey="portfolioValue"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#22c55e", stroke: "#ffffff", strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />

                  {/* Benchmark Line - ORANGE */}
                  {showBenchmark && (
                    <Line
                      type="monotone"
                      dataKey="benchmarkValue"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#f97316", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    />
                  )}

                  {/* Hover Dots */}
                  {hoveredIndex !== null && chartData[hoveredIndex] && (
                    <>
                      <ReferenceDot
                        x={chartData[hoveredIndex].displayDate}
                        y={chartData[hoveredIndex].portfolioValue}
                        r={6}
                        fill="#22c55e"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      {showBenchmark && chartData[hoveredIndex].benchmarkValue && (
                        <ReferenceDot
                          x={chartData[hoveredIndex].displayDate}
                          y={chartData[hoveredIndex].benchmarkValue}
                          r={6}
                          fill="#f97316"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Time Period Buttons */}
            <div className="flex items-center justify-center gap-6 mt-6 mb-4">
              {TIME_PERIODS.map(period => (
                <button
                  key={period.value}
                  onClick={() => setTimeRange(period.value)}
                  className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-md ${timeRange === period.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Benchmark Controls */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t">
              <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENCHMARKS.map(benchmark => (
                    <SelectItem key={benchmark.value} value={benchmark.value}>
                      {benchmark.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={showBenchmark}
                  onCheckedChange={(checked) => setShowBenchmark(checked as boolean)}
                />
                <span className="text-sm text-muted-foreground">Compare with benchmark</span>
              </label>
            </div>

            {/* Legend */}
            {showBenchmark && (
              <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Your Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-orange-500 rounded-full"></div>
                  <span className="text-muted-foreground">{selectedBenchmark}</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
