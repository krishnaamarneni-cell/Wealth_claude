"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Mark component as mounted to avoid SSR/client mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Track container width for chart
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        if (width > 0) {
          setContainerWidth(width)
        }
      }
    }

    updateWidth()
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Load chart data
  useEffect(() => {
    if (portfolioLoading || portfolioValue === 0 || totalCost === 0) return
    
    const loadData = async () => {
      setIsLoading(true)
      
      // Generate portfolio chart data
      let data = getChartData(timeRange, portfolioValue, totalCost, transactions)
      
      // Add benchmark comparison if enabled
      if (showBenchmark) {
        data = await calculateBenchmarkValues(transactions, selectedBenchmark, data)
      }
      
      setChartData(data)
      setIsLoading(false)
    }
    
    loadData()
  }, [timeRange, showBenchmark, selectedBenchmark, portfolioValue, totalCost, transactions, portfolioLoading])

  // ✅ Calculate period-specific values (changes per time range!)
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
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading portfolio data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
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
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              benchmarkDiff >= 0 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-red-500/10 text-red-500'
            }`}>
              {benchmarkDiff >= 0 ? '🎉' : '📉'} vs {selectedBenchmark}: {formatCurrency(benchmarkDiff)} ({formatPercent(benchmarkDiffPercent)})
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {!isMounted ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : (
          <>
            {/* Chart Container */}
            <div ref={containerRef} className="w-full" style={{ minHeight: '300px' }}>
              {containerWidth > 0 && (
                <ResponsiveContainer width={containerWidth} height={300}>
                  <LineChart
                  data={chartData}
                  onMouseMove={(e: any) => {
                    if (e.activePayload && e.activePayload[0]) {
                      const payload = e.activePayload[0].payload
                      // Calculate gain from START of period, not all-time
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
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  {/* Minimal X Axis - No labels */}
                  <XAxis 
                    dataKey="displayDate"
                    hide={true}
                  />
                  
                  {/* Minimal Y Axis - No labels */}
                  <YAxis hide={true} domain={['auto', 'auto']} />
                  
                  {/* Custom Tooltip */}
                  <Tooltip
                    content={() => null}
                    cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                  />
                  
                  {/* ✅ Portfolio Line - GREEN SOLID */}
                  <Line
                    type="monotone"
                    dataKey="portfolioValue"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                  
                  {/* ✅ Benchmark Line - ORANGE SOLID (NOT DOTTED!) */}
                  {showBenchmark && (
                    <Line
                      type="monotone"
                      dataKey="benchmarkValue"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  )}
                  
                  {/* Hover Dots */}
                  {hoveredIndex !== null && chartData[hoveredIndex] && (
                    <>
                      <ReferenceDot
                        x={chartData[hoveredIndex].displayDate}
                        y={chartData[hoveredIndex].portfolioValue}
                        r={5}
                        fill="#22c55e"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      {showBenchmark && chartData[hoveredIndex].benchmarkValue && (
                        <ReferenceDot
                          x={chartData[hoveredIndex].displayDate}
                          y={chartData[hoveredIndex].benchmarkValue}
                          r={5}
                          fill="#f97316"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>

            {/* Time Period Buttons */}
            <div className="flex items-center justify-center gap-6 mt-4 mb-4">
              {TIME_PERIODS.map(period => (
                <button
                  key={period.value}
                  onClick={() => setTimeRange(period.value)}
                  className={`text-sm font-medium transition-colors ${
                    timeRange === period.value
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
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
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-muted-foreground">Your Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-orange-500"></div>
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
