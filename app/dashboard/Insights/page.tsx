"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  holdings, 
  sectorAllocation, 
  industryAllocation, 
  countryAllocation, 
  assetTypeAllocation,
  dividendHistory,
  portfolioSummary,
  keyStats
} from "@/lib/portfolio-data"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon, CircleDollarSign, Calendar, Percent } from "lucide-react"
import Image from "next/image"

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

type ViewType = 'marketValue' | 'costBasis' | 'gain' | 'loss'
type ChartType = 'pie' | 'bar'
type InsightView = 'allocation' | 'dividends'
type DividendViewType = "monthly" | "quarterly" | "annually"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

// Generate all months between start and end date
function generateMonthRange(startDate: string, endDate: string): string[] {
  const months: string[] = []
  const start = new Date(startDate + "-01")
  const end = new Date(endDate + "-01")
  
  const current = new Date(start)
  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

// Generate all quarters between start and end
function generateQuarterRange(startDate: string, endDate: string): string[] {
  const quarters: string[] = []
  const startYear = parseInt(startDate.substring(0, 4))
  const startMonth = parseInt(startDate.substring(5, 7))
  const startQuarter = Math.ceil(startMonth / 3)
  
  const endYear = parseInt(endDate.substring(0, 4))
  const endMonth = parseInt(endDate.substring(5, 7))
  const endQuarter = Math.ceil(endMonth / 3)
  
  for (let year = startYear; year <= endYear; year++) {
    const firstQ = year === startYear ? startQuarter : 1
    const lastQ = year === endYear ? endQuarter : 4
    
    for (let q = firstQ; q <= lastQ; q++) {
      quarters.push(`${year}-Q${q}`)
    }
  }
  
  return quarters
}

// Generate all years between start and end
function generateYearRange(startDate: string, endDate: string): string[] {
  const years: string[] = []
  const startYear = parseInt(startDate.substring(0, 4))
  const endYear = parseInt(endDate.substring(0, 4))
  
  for (let year = startYear; year <= endYear; year++) {
    years.push(String(year))
  }
  
  return years
}

export default function InsightsPage() {
  const [insightView, setInsightView] = useState<InsightView>('allocation')
  const [viewType, setViewType] = useState<ViewType>('marketValue')
  const [chartType, setChartType] = useState<ChartType>('pie')
  const [dividendViewType, setDividendViewType] = useState<DividendViewType>("monthly")

  // Current date for determining past vs future
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)

  // Get date range from dividend history
  const sortedDates = dividendHistory.map(d => d.date).sort()
  const earliestDate = sortedDates[0]?.substring(0, 7) || "2025-01"
  
  // Add future months (next 12 months for projection)
  const futureDate = new Date(today)
  futureDate.setMonth(futureDate.getMonth() + 12)
  const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`

  // Calculate average monthly dividend for projection
  const totalReceived = dividendHistory.reduce((sum, div) => sum + div.total, 0)
  const uniqueMonths = new Set(dividendHistory.map(d => d.date.substring(0, 7))).size
  const avgMonthlyDividend = uniqueMonths > 0 ? totalReceived / uniqueMonths : 0

  // Group dividends by month
  const monthlyDividends = dividendHistory.reduce((acc, div) => {
    const month = div.date.substring(0, 7)
    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += div.total
    return acc
  }, {} as Record<string, number>)

  // Group dividends by quarter
  const quarterlyDividends = dividendHistory.reduce((acc, div) => {
    const year = div.date.substring(0, 4)
    const month = parseInt(div.date.substring(5, 7))
    const quarter = Math.ceil(month / 3)
    const key = `${year}-Q${quarter}`
    if (!acc[key]) {
      acc[key] = 0
    }
    acc[key] += div.total
    return acc
  }, {} as Record<string, number>)

  // Group dividends by year
  const annualDividends = dividendHistory.reduce((acc, div) => {
    const year = div.date.substring(0, 4)
    if (!acc[year]) {
      acc[year] = 0
    }
    acc[year] += div.total
    return acc
  }, {} as Record<string, number>)

  // Check if a period is in the past
  const isPastPeriod = (period: string, viewType: DividendViewType): boolean => {
    if (viewType === "monthly") {
      const [year, month] = period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    } else if (viewType === "quarterly") {
      const [year, quarter] = period.split('-Q').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && quarter <= currentQuarter) return true
      return false
    } else {
      const year = parseInt(period)
      return year <= currentYear
    }
  }

  // Get chart data based on view type with all periods filled
  const getDividendChartData = () => {
    switch (dividendViewType) {
      case "monthly": {
        const allMonths = generateMonthRange(earliestDate, futureMonth)
        return allMonths.map(month => {
          const isPast = isPastPeriod(month, "monthly")
          const actualAmount = monthlyDividends[month]
          
          return {
            period: month,
            total: actualAmount || (isPast ? 0 : avgMonthlyDividend),
            isPast,
            hasActual: !!actualAmount
          }
        })
      }
      case "quarterly": {
        const allQuarters = generateQuarterRange(earliestDate, futureMonth)
        return allQuarters.map(quarter => {
          const isPast = isPastPeriod(quarter, "quarterly")
          const actualAmount = quarterlyDividends[quarter]
          
          return {
            period: quarter,
            total: actualAmount || (isPast ? 0 : avgMonthlyDividend * 3),
            isPast,
            hasActual: !!actualAmount
          }
        })
      }
      case "annually": {
        const allYears = generateYearRange(earliestDate, futureMonth)
        return allYears.map(year => {
          const isPast = isPastPeriod(year, "annually")
          const actualAmount = annualDividends[year]
          
          return {
            period: year,
            total: actualAmount || (isPast ? 0 : avgMonthlyDividend * 12),
            isPast,
            hasActual: !!actualAmount
          }
        })
      }
    }
  }

  const dividendChartData = getDividendChartData()
  const annualProjected = portfolioSummary.dividends * 4

  const stockAllocationData = useMemo(() => {
    return holdings.map((holding, index) => {
      let value = 0
      switch (viewType) {
        case 'marketValue':
          value = holding.marketValue
          break
        case 'costBasis':
          value = holding.costBasis
          break
        case 'gain':
          value = holding.totalGain > 0 ? holding.totalGain : 0
          break
        case 'loss':
          value = holding.totalGain < 0 ? Math.abs(holding.totalGain) : 0
          break
      }
      return {
        name: holding.symbol,
        fullName: holding.name,
        value,
        logo: holding.logo,
        allocation: holding.allocation,
        marketValue: holding.marketValue,
        costBasis: holding.costBasis,
        gain: holding.totalGain,
        gainPercent: holding.totalGainPercent,
        color: COLORS[index % COLORS.length]
      }
    }).filter(item => item.value > 0)
  }, [viewType])

  const totalValue = useMemo(() => {
    return stockAllocationData.reduce((sum, item) => sum + item.value, 0)
  }, [stockAllocationData])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof stockAllocationData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            {data.logo && (
              <Image 
                src={data.logo || "/placeholder.svg"} 
                alt={data.name} 
                width={24} 
                height={24} 
                className="rounded"
                unoptimized
              />
            )}
            <span className="font-semibold">{data.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{data.fullName}</p>
          <p className="text-sm mt-1">Value: {formatCurrency(data.value)}</p>
          <p className="text-sm">Allocation: {((data.value / totalValue) * 100).toFixed(2)}%</p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: {
    cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; name: string; value: number
  }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percent = ((value / totalValue) * 100)
    
    if (percent < 5) return null

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {name}
      </text>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground">Analyze your portfolio performance and allocations</p>
        </div>
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <Button 
            variant={insightView === 'allocation' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setInsightView('allocation')}
          >
            Allocation
          </Button>
          <Button 
            variant={insightView === 'dividends' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setInsightView('dividends')}
          >
            Dividends
          </Button>
        </div>
      </div>

      {insightView === 'allocation' ? (
        <>
          {/* Stock Allocation with View Options */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">Allocation by Stock</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                    <Button 
                      variant={viewType === 'marketValue' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewType('marketValue')}
                      className="gap-1 text-xs"
                    >
                      <DollarSign className="h-3 w-3" />
                      Market Value
                    </Button>
                    <Button 
                      variant={viewType === 'costBasis' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewType('costBasis')}
                      className="gap-1 text-xs"
                    >
                      <DollarSign className="h-3 w-3" />
                      Cost
                    </Button>
                    <Button 
                      variant={viewType === 'gain' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewType('gain')}
                      className="gap-1 text-xs"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Gain
                    </Button>
                    <Button 
                      variant={viewType === 'loss' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewType('loss')}
                      className="gap-1 text-xs"
                    >
                      <TrendingDown className="h-3 w-3" />
                      Loss
                    </Button>
                  </div>
                  <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                    <Button 
                      variant={chartType === 'pie' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setChartType('pie')}
                    >
                      <PieChartIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={chartType === 'bar' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={stockAllocationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stockAllocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    ) : (
                      <BarChart data={stockAllocationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`} />
                        <YAxis dataKey="name" type="category" width={50} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]}>
                          {stockAllocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {stockAllocationData.map((stock) => (
                    <div 
                      key={stock.name} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-muted shrink-0">
                        {stock.logo ? (
                          <Image 
                            src={stock.logo || "/placeholder.svg"} 
                            alt={stock.name} 
                            width={32} 
                            height={32}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs font-bold">{stock.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stock.color }} />
                          <span className="font-semibold">{stock.name}</span>
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">{stock.fullName}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-muted-foreground">
                            {((stock.value / totalValue) * 100).toFixed(2)}%
                          </span>
                          <span className={stock.gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {stock.gain >= 0 ? '+' : ''}{formatCurrency(stock.gain)} ({stock.gainPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">{formatCurrency(stock.value)}</div>
                        <div className="text-xs text-muted-foreground">
                          Cost: {formatCurrency(stock.costBasis)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Tabs */}
          <Tabs defaultValue="sector" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sector">Sector</TabsTrigger>
              <TabsTrigger value="industry">Industry</TabsTrigger>
              <TabsTrigger value="country">Country</TabsTrigger>
              <TabsTrigger value="assetType">Asset Type</TabsTrigger>
            </TabsList>

            <TabsContent value="sector">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sector Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sectorAllocation}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => value > 5 ? `${value.toFixed(1)}%` : ''}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {sectorAllocation.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sector Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sectorAllocation.map((sector, index) => (
                        <div key={sector.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="font-medium">{sector.name}</span>
                            </div>
                            <span className="font-semibold">{sector.value.toFixed(2)}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${sector.value}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Value: {formatCurrency(sector.marketValue)}</span>
                            <span>Cost: {formatCurrency(sector.costBasis)}</span>
                            <span className={sector.gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                              Gain: {formatCurrency(sector.gain)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="industry">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Industry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={industryAllocation} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                          <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {industryAllocation.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {industryAllocation.map((industry, index) => (
                        <div key={industry.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm">{industry.name}</span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">{industry.value.toFixed(2)}%</span>
                            <span className="font-medium">{formatCurrency(industry.marketValue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="country">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Country Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={countryAllocation}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name} ${value}%`}
                          >
                            {countryAllocation.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {countryAllocation.map((country, index) => (
                        <div key={country.name} className="p-4 rounded-lg bg-secondary/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="font-medium text-lg">{country.name}</span>
                            </div>
                            <span className="text-2xl font-bold">{country.value}%</span>
                          </div>
                          <p className="text-muted-foreground">{formatCurrency(country.marketValue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assetType">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Asset Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetTypeAllocation}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                          >
                            {assetTypeAllocation.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Asset Type Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {assetTypeAllocation.map((type, index) => (
                        <div key={type.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                              >
                                <span style={{ color: COLORS[index % COLORS.length] }} className="text-lg font-bold">
                                  {type.name === 'Stocks' ? 'S' : 'E'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-sm text-muted-foreground">{type.value.toFixed(2)}% of portfolio</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-lg">{formatCurrency(type.marketValue)}</div>
                            </div>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${type.value}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          {/* Dividend Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  +{formatCurrency(portfolioSummary.dividends)}
                </div>
                <p className="text-xs text-muted-foreground">All-time dividends</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dividend Yield</CardTitle>
                <Percent className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {keyStats.dividendYield}%
                </div>
                <p className="text-xs text-muted-foreground">Portfolio yield</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projected Annual</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(annualProjected)}
                </div>
                <p className="text-xs text-muted-foreground">Based on current holdings</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(dividendHistory[0].total)}
                </div>
                <p className="text-xs text-muted-foreground">{dividendHistory[0].date}</p>
              </CardContent>
            </Card>
          </div>

          {/* Dividend Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historical and Upcoming Dividends</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#22c55e]"></div>
                      <span className="text-muted-foreground">Received</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#9ca3af]"></div>
                      <span className="text-muted-foreground">Upcomings</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDividendViewType("monthly")}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        dividendViewType === "monthly"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setDividendViewType("quarterly")}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        dividendViewType === "quarterly"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Quarterly
                    </button>
                    <button
                      onClick={() => setDividendViewType("annually")}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        dividendViewType === "annually"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Annually
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dividendChartData} barCategoryGap="20%" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="period" 
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={true}
                      axisLine={true}
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${v}`} 
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={true}
                      axisLine={true}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f97316"
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#f97316" }}
                      formatter={(value: number) => [formatCurrency(value), "Dividends"]}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={60}
                    >
                      {dividendChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isPast ? "#22c55e" : "#9ca3af"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Dividend History Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Dividend History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Per Share</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dividendHistory.map((dividend, index) => (
                    <TableRow key={`${dividend.date}-${dividend.symbol}-${index}`}>
                      <TableCell className="text-muted-foreground">{dividend.date}</TableCell>
                      <TableCell className="font-medium">{dividend.symbol}</TableCell>
                      <TableCell className="text-right">{formatCurrency(dividend.amount)}</TableCell>
                      <TableCell className="text-right">{dividend.shares}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        +{formatCurrency(dividend.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
