"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import PortfolioAIInsight from "@/components/portfolio-ai-insight"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Settings,
  Calendar,
  Zap,
  Save,
  Download,
  Plus,
  Minus,
  Info,
  ChevronDown,
  Shield,
  Target,
  Layers,
  AlertCircle,
  HelpCircle,
  Trash
} from "lucide-react"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import { calculateAndFetchHoldings, type Holding, type Transaction } from "@/lib/holdings-calculator"
import { usePortfolio } from "@/lib/portfolio-context"
import { getRebalanceFromStorage, saveScenarioToStorage, saveLastRebalanceDateToStorage, deleteScenarioFromStorage } from "@/lib/rebalance-storage"

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
const HISTORY_GREEN = '#37c522'
const HISTORY_RED = '#d41212'

// Market Benchmarks
const BENCHMARKS = {
  stockConcentration: { min: 5, max: 7, label: "per stock" },
  sectorConcentration: { min: 8, max: 12, label: "per sector" },
  top3Concentration: { max: 40, label: "top 3 stocks" },
  singleStockMax: { max: 20, label: "single position" },
  stockAllocation: { min: 60, max: 70, label: "stocks vs total" },
  etfAllocation: { min: 20, max: 30, label: "ETFs vs total" },
}

// Types
interface TargetAllocation {
  symbol: string
  targetPercent: number
}

interface RebalanceRecommendation {
  symbol: string
  currentAllocation: number
  targetAllocation: number
  currentValue: number
  targetValue: number
  action: 'BUY' | 'SELL' | 'HOLD'
  amount: number
  shares: number
  drift: number
  taxImpact: number
  costBasis: number
}

interface RebalanceScenario {
  id: string
  name: string
  targetAllocations: TargetAllocation[]
  rebalanceThreshold: number
}

interface AllocationHistory {
  month: string
  [key: string]: number | string
}

interface InvestmentAllocation {
  symbol: string
  amount: number
  percentage: number
  shares: number
  reason: string
}

type ViewType = 'marketValue' | 'costBasis' | 'gain' | 'loss'
type ChartType = 'pie' | 'bar'
type RebalanceChartView = 'stock' | 'sector' | 'asset'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

// Interactive Donut Component
interface InteractiveDonutProps {
  data: Array<{
    name: string
    value: number
    color?: string
    marketValue?: number
    costBasis?: number
    gain?: number
    gainPercent?: number
    sector?: string
  }>
  title: string
  centerLabel?: string
  formatValue?: (value: number) => string
  showDetails?: boolean
  viewType?: string
}

function InteractiveDonut({
  data,
  title,
  centerLabel = "Total",
  formatValue,
  showDetails = false,
  viewType = 'marketValue'
}: InteractiveDonutProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const legendContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map() as Map<string, HTMLElement>)

  useEffect(() => {
    if (hoveredItem && legendContainerRef.current) {
      const itemElement = itemRefs.current.get(hoveredItem)
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [hoveredItem])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  const isSingleItem = data.length === 1

  let currentAngle = -90
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = isSingleItem ? 360 : (percentage / 100) * 360
    const segment = {
      ...item,
      percentage,
      color: item.color || COLORS[index % COLORS.length],
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

    const isFullCircle = Math.abs(endAngle - startAngle - 360) < 0.01

    if (isFullCircle) {
      const mid = polarToCartesian(200, 200, outerRadius, startAngle + 180)
      const innerMid = polarToCartesian(200, 200, innerRadius, startAngle + 180)

      return [
        `M ${start.x} ${start.y}`,
        `A ${outerRadius} ${outerRadius} 0 0 0 ${mid.x} ${mid.y}`,
        `A ${outerRadius} ${outerRadius} 0 0 0 ${end.x} ${end.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 0 1 ${innerMid.x} ${innerMid.y}`,
        `A ${innerRadius} ${innerRadius} 0 0 1 ${innerStart.x} ${innerStart.y}`,
        "Z",
      ].join(" ")
    }

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ")
  }

  const formatCurrencyValue = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const formatDisplayValue = (value: number) => {
    if (formatValue) return formatValue(value)
    if (showDetails) return formatCurrencyValue(value)
    return value.toFixed(2) + '%'
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 border-r border-border pr-6">
        <svg viewBox="0 0 400 400" className="w-full h-auto max-w-[400px] mx-auto">
          {segments.map((segment) => {
            const isHovered = hoveredItem === segment.name
            const outerRadius = isHovered ? 175 : 165
            return (
              <path
                key={segment.name}
                d={createArc(segment.startAngle, segment.endAngle, 100, outerRadius)}
                fill={segment.color}
                opacity={hoveredItem && !isHovered ? 0.3 : 1}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredItem(segment.name)}
                onMouseLeave={() => setHoveredItem(null)}
              />
            )
          })}

          {hoveredItem ? (
            <>
              <text x="200" y="185" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="500">
                {hoveredItem}
              </text>
              <text x="200" y="210" textAnchor="middle" fill="#22c55e" fontSize="20" fontWeight="700">
                {showDetails
                  ? formatCurrencyValue(segments.find((s) => s.name === hoveredItem)?.value || 0)
                  : `${segments.find((s) => s.name === hoveredItem)?.percentage.toFixed(1)}%`
                }
              </text>
              <text x="200" y="230" textAnchor="middle" fill="#ffffff" fontSize="12">
                {segments.find((s) => s.name === hoveredItem)?.percentage.toFixed(1)}% of {title.toLowerCase()}
              </text>
            </>
          ) : (
            <>
              <text x="200" y="185" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="500">
                {centerLabel}
              </text>
              <text x="200" y="215" textAnchor="middle" fill="#22c55e" fontSize="24" fontWeight="700">
                {showDetails ? formatCurrencyValue(total) : "100%"}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="flex-1 max-w-md pl-6">
        <div
          ref={legendContainerRef}
          className="space-y-2 max-h-[400px] overflow-y-auto pr-2"
        >
          {segments.map((item) => (
            <div
              key={item.name}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(item.name, el)
                } else {
                  itemRefs.current.delete(item.name)
                }
              }}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${hoveredItem === item.name
                ? "border-gray-400 dark:border-gray-600"
                : "border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{item.name}</span>
                    {item.sector && <span className="text-xs text-muted-foreground truncate">{item.sector}</span>}
                  </div>
                  {showDetails && item.gain !== undefined && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className={item.gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {item.gain >= 0 ? '+' : ''}{formatCurrencyValue(item.gain)} ({item.gainPercent?.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-sm font-bold text-foreground">{item.percentage.toFixed(2)}%</div>
                <div className="text-xs text-green-500 font-medium">
                  {formatCurrencyValue(item.marketValue || item.value)}
                </div>
                {showDetails && item.costBasis && (
                  <div className="text-xs text-muted-foreground">
                    {viewType === 'marketValue' && `Cost: ${formatCurrencyValue(item.costBasis)}`}
                    {viewType === 'costBasis' && `Value: ${formatCurrencyValue(item.marketValue || 0)}`}
                    {viewType === 'gain' && `${item.gainPercent?.toFixed(2)}% gain`}
                    {viewType === 'loss' && `${Math.abs(item.gainPercent || 0).toFixed(2)}% loss`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function PortfolioPage() {
  // Mode toggle
  const [mode, setMode] = useState<'portfolio' | 'rebalance'>('portfolio')

  // Shared state
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Portfolio mode state
  const [viewType, setViewType] = useState<ViewType>('marketValue')
  const [chartType, setChartType] = useState<ChartType>('pie')
  const [allocationTab, setAllocationTab] = useState('sector')

  // Rebalance mode state
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([])
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5)
  const [taxAwareMode, setTaxAwareMode] = useState(true)
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'monthly' | 'quarterly' | 'semiannual' | 'annual'>('quarterly')
  const [lastRebalanceDate, setLastRebalanceDate] = useState<string>('')
  const [scenarios, setScenarios] = useState<RebalanceScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string>('custom')
  const [whatIfAmount, setWhatIfAmount] = useState(10000)
  const [taxInfoOpen, setTaxInfoOpen] = useState(false)
  const [holdingsPageSize, setHoldingsPageSize] = useState(10)
  const [targetPageSize, setTargetPageSize] = useState(10)
  const [investmentStrategy, setInvestmentStrategy] = useState<'lowToHigh' | 'closeToTarget'>('lowToHigh')
  const [rebalanceChartView, setRebalanceChartView] = useState<RebalanceChartView>('stock')

  const { holdings: contextHoldings, transactions: contextTransactions, isLoading: contextIsLoading } = usePortfolio()

  // Load data
  useEffect(() => {
    if (!contextIsLoading) {
      if (contextHoldings && contextHoldings.length > 0) {
        loadHoldingsData(contextHoldings, contextTransactions || [])
      } else {
        setHoldings([])
        setIsLoading(false)
      }
    }
  }, [contextHoldings, contextTransactions, contextIsLoading])

  const loadHoldingsData = async (contextHoldings: Holding[], contextTransactions: Transaction[]) => {
    if (!contextHoldings || contextHoldings.length === 0) {
      setHoldings([])
      setIsLoading(contextIsLoading)
      return
    }

    // Use context holdings directly and set loading state
    setHoldings(contextHoldings)
    setIsLoading(contextIsLoading)

    // Initialize equal-weight targets if not already set
    if (targetAllocations.length === 0) {
      const equalWeight = 100 / contextHoldings.length
      setTargetAllocations(
        contextHoldings.map(h => ({
          symbol: h.symbol,
          targetPercent: equalWeight
        }))
      )
    }

    // Load saved rebalance data
    const rebalanceData = await getRebalanceFromStorage()
    if (rebalanceData.lastRebalanceDate) setLastRebalanceDate(rebalanceData.lastRebalanceDate)
    if (rebalanceData.scenarios && rebalanceData.scenarios.length > 0) {
      setScenarios(rebalanceData.scenarios)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Refresh will happen automatically when context data updates
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Calculate allocation history
  const calculateAllocationHistory = async (): Promise<AllocationHistory[]> => {
    const txns = await getTransactionsFromStorage()
    const months: AllocationHistory[] = []
    const today = new Date()

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const holdingsMap = new Map<string, { shares: number, cost: number }>()

      txns.forEach((txn) => {
        const txnDate = new Date(txn.date)
        if (txnDate <= monthDate && (txn.type === 'BUY' || txn.type === 'SELL')) {
          if (!holdingsMap.has(txn.symbol)) {
            holdingsMap.set(txn.symbol, { shares: 0, cost: 0 })
          }
          const h = holdingsMap.get(txn.symbol)!
          if (txn.type === 'BUY') {
            h.shares += txn.shares
            h.cost += txn.total
          } else {
            h.shares -= txn.shares
            h.cost -= txn.total
          }
        }
      })

      const totalValue = Array.from(holdingsMap.values())
        .filter(h => h.shares > 0)
        .reduce((sum, h) => sum + Math.abs(h.cost), 0)

      const monthData: AllocationHistory = { month: monthKey }

      holdingsMap.forEach((holding, symbol) => {
        if (holding.shares > 0) {
          const allocation = totalValue > 0 ? (Math.abs(holding.cost) / totalValue) * 100 : 0
          monthData[symbol] = allocation
        }
      })

      months.push(monthData)
    }

    return months
  }

  const [allocationHistory, setAllocationHistory] = useState<AllocationHistory[]>([])

  useEffect(() => {
    if (holdings.length > 0) {
      calculateAllocationHistory().then(setAllocationHistory)
    }
  }, [holdings])

  const allocationChanges = useMemo(() => {
    if (allocationHistory.length < 2) return { increases: [], decreases: [] }

    const firstMonth = allocationHistory[0]
    const lastMonth = allocationHistory[allocationHistory.length - 1]

    const changes: { symbol: string, change: number, from: number, to: number }[] = []

    holdings.forEach(holding => {
      const startAllocation = (firstMonth[holding.symbol] as number) || 0
      const endAllocation = (lastMonth[holding.symbol] as number) || 0
      const change = endAllocation - startAllocation

      if (Math.abs(change) > 0.5) {
        changes.push({
          symbol: holding.symbol,
          change,
          from: startAllocation,
          to: endAllocation
        })
      }
    })

    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    return {
      increases: changes.filter(c => c.change > 0).slice(0, 5),
      decreases: changes.filter(c => c.change < 0).slice(0, 5)
    }
  }, [allocationHistory, holdings])

  const totalPortfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.marketValue, 0)
  }, [holdings])

  const stockAllocationData = useMemo(() => {
    return holdings.map((holding, index) => {
      let value = 0
      let displayValue = 0

      switch (viewType) {
        case 'marketValue':
          value = holding.marketValue
          displayValue = holding.marketValue
          break
        case 'costBasis':
          value = holding.totalCost
          displayValue = holding.totalCost
          break
        case 'gain':
          value = holding.totalGain > 0 ? holding.totalGain : 0
          displayValue = value
          break
        case 'loss':
          value = holding.totalGain < 0 ? Math.abs(holding.totalGain) : 0
          displayValue = value
          break
      }

      return {
        name: holding.symbol,
        fullName: holding.symbol,
        value: displayValue,
        allocation: holding.allocation,
        marketValue: holding.marketValue,
        costBasis: holding.totalCost,
        gain: holding.totalGain,
        gainPercent: holding.totalGainPercent,
        color: COLORS[index % COLORS.length],
        sector: holding.sector,
        industry: holding.industry,
        assetType: holding.assetType
      }
    }).filter(item => item.value > 0)
  }, [viewType, holdings])

  const sectorAllocation = useMemo(() => {
    const sectorMap = new Map<string, { marketValue: number; costBasis: number; gain: number }>()

    holdings.forEach(h => {
      const current = sectorMap.get(h.sector) || { marketValue: 0, costBasis: 0, gain: 0 }
      sectorMap.set(h.sector, {
        marketValue: current.marketValue + h.marketValue,
        costBasis: current.costBasis + h.totalCost,
        gain: current.gain + h.totalGain
      })
    })

    const total = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    return Array.from(sectorMap.entries()).map(([name, data]) => ({
      name,
      value: total > 0 ? (data.marketValue / total) * 100 : 0,
      marketValue: data.marketValue,
      costBasis: data.costBasis,
      gain: data.gain
    })).sort((a, b) => b.value - a.value)
  }, [holdings])

  const industryAllocation = useMemo(() => {
    const industryMap = new Map<string, { marketValue: number; costBasis: number; gain: number }>()

    holdings.forEach(h => {
      const current = industryMap.get(h.industry) || { marketValue: 0, costBasis: 0, gain: 0 }
      industryMap.set(h.industry, {
        marketValue: current.marketValue + h.marketValue,
        costBasis: current.costBasis + h.totalCost,
        gain: current.gain + h.totalGain
      })
    })

    const total = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    return Array.from(industryMap.entries()).map(([name, data]) => ({
      name,
      value: total > 0 ? (data.marketValue / total) * 100 : 0,
      marketValue: data.marketValue,
      costBasis: data.costBasis,
      gain: data.gain
    })).sort((a, b) => b.value - a.value)
  }, [holdings])

  const countryAllocation = useMemo(() => {
    const countryMap = new Map<string, { marketValue: number }>()

    holdings.forEach(h => {
      const current = countryMap.get(h.country) || { marketValue: 0 }
      countryMap.set(h.country, {
        marketValue: current.marketValue + h.marketValue
      })
    })

    const total = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    return Array.from(countryMap.entries()).map(([name, data]) => ({
      name,
      value: total > 0 ? (data.marketValue / total) * 100 : 0,
      marketValue: data.marketValue
    })).sort((a, b) => b.value - a.value)
  }, [holdings])

  const assetTypeAllocation = useMemo(() => {
    const assetMap = new Map<string, { marketValue: number }>()

    holdings.forEach(h => {
      const current = assetMap.get(h.assetType) || { marketValue: 0 }
      assetMap.set(h.assetType, {
        marketValue: current.marketValue + h.marketValue
      })
    })

    const total = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    return Array.from(assetMap.entries()).map(([name, data]) => ({
      name: name === 'Stock' ? 'Stocks' : name === 'ETF' ? 'ETFs' : name,
      value: total > 0 ? (data.marketValue / total) * 100 : 0,
      marketValue: data.marketValue
    })).sort((a, b) => b.value - a.value)
  }, [holdings])

  const rebalanceRecommendations = useMemo((): RebalanceRecommendation[] => {
    if (holdings.length === 0 || targetAllocations.length === 0) return []

    return holdings.map(holding => {
      const target = targetAllocations.find(t => t.symbol === holding.symbol)
      const targetPercent = target?.targetPercent || 0
      const currentPercent = holding.allocation
      const drift = currentPercent - targetPercent

      const targetValue = (targetPercent / 100) * totalPortfolioValue
      const currentValue = holding.marketValue
      const difference = targetValue - currentValue

      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
      if (Math.abs(drift) > rebalanceThreshold) {
        action = difference > 0 ? 'BUY' : 'SELL'
      }

      const shares = Math.abs(difference / holding.currentPrice)

      const gainPerShare = holding.currentPrice - holding.avgCost
      const taxImpact = action === 'SELL' && gainPerShare > 0
        ? shares * gainPerShare * 0.20
        : 0

      return {
        symbol: holding.symbol,
        currentAllocation: currentPercent,
        targetAllocation: targetPercent,
        currentValue,
        targetValue,
        action,
        amount: Math.abs(difference),
        shares,
        drift,
        taxImpact,
        costBasis: holding.avgCost
      }
    }).sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
  }, [holdings, targetAllocations, totalPortfolioValue, rebalanceThreshold])

  // ✅ FIXED: Risk Score calculation (Higher = Better)
  const riskScore = useMemo(() => {
    if (holdings.length === 0) return 100

    let penalties = 0

    // Individual stock concentration
    holdings.forEach(h => {
      if (h.allocation > BENCHMARKS.singleStockMax.max) {
        penalties += (h.allocation - BENCHMARKS.singleStockMax.max) * 2
      }
    })

    // Top 3 concentration
    const top3 = holdings.slice(0, 3).reduce((sum, h) => sum + h.allocation, 0)
    if (top3 > BENCHMARKS.top3Concentration.max) {
      penalties += (top3 - BENCHMARKS.top3Concentration.max) * 1.5
    }

    // Sector concentration
    const sectorMap = new Map<string, number>()
    holdings.forEach(h => {
      const current = sectorMap.get(h.sector) || 0
      sectorMap.set(h.sector, current + h.allocation)
    })
    sectorMap.forEach(allocation => {
      if (allocation > BENCHMARKS.sectorConcentration.max) {
        penalties += (allocation - BENCHMARKS.sectorConcentration.max) * 1.5
      }
    })

    return Math.max(0, Math.min(100, 100 - penalties))
  }, [holdings])

  const sectorAnalysis = useMemo(() => {
    const sectorMap = new Map<string, number>()
    holdings.forEach(h => {
      const current = sectorMap.get(h.sector) || 0
      sectorMap.set(h.sector, current + h.allocation)
    })

    return Array.from(sectorMap.entries()).map(([sector, allocation]) => {
      let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' = 'LOW'
      if (allocation > BENCHMARKS.sectorConcentration.max * 3) risk = 'VERY HIGH'
      else if (allocation > BENCHMARKS.sectorConcentration.max * 2) risk = 'HIGH'
      else if (allocation > BENCHMARKS.sectorConcentration.max) risk = 'MODERATE'

      return { sector, allocation, risk }
    }).sort((a, b) => b.allocation - a.allocation)
  }, [holdings])

  const assetAnalysis = useMemo(() => {
    const assetMap = new Map<string, number>()
    holdings.forEach(h => {
      const current = assetMap.get(h.assetType) || 0
      assetMap.set(h.assetType, current + h.allocation)
    })

    return Array.from(assetMap.entries()).map(([assetType, allocation]) => {
      let risk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'

      if (assetType === 'Stock') {
        if (allocation > 85) risk = 'HIGH'
        else if (allocation > 75) risk = 'MODERATE'
      }

      return { assetType, allocation, risk }
    }).sort((a, b) => b.allocation - a.allocation)
  }, [holdings])

  const concentrationWarnings = useMemo(() => {
    return holdings.map(h => {
      let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' = 'LOW'
      const allocation = h.allocation

      if (allocation > BENCHMARKS.singleStockMax.max * 2) risk = 'VERY HIGH'
      else if (allocation > BENCHMARKS.singleStockMax.max * 1.5) risk = 'HIGH'
      else if (allocation > BENCHMARKS.singleStockMax.max) risk = 'MODERATE'

      return {
        symbol: h.symbol,
        allocation,
        risk,
        multiple: allocation / BENCHMARKS.stockConcentration.max
      }
    }).filter(w => w.risk !== 'LOW').sort((a, b) => b.allocation - a.allocation)
  }, [holdings])

  // ✅ FIXED: Drift Score calculation
  const driftScore = useMemo(() => {
    if (rebalanceRecommendations.length === 0) return 100

    const totalDrift = rebalanceRecommendations.reduce((sum, rec) => {
      return sum + Math.abs(rec.drift)
    }, 0)

    return Math.max(0, 100 - totalDrift * 2)
  }, [rebalanceRecommendations])

  const needsRebalancing = driftScore < 80

  const nextRebalanceDate = useMemo(() => {
    if (!lastRebalanceDate) return new Date()

    const last = new Date(lastRebalanceDate)
    const next = new Date(last)

    switch (rebalanceFrequency) {
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'quarterly':
        next.setMonth(next.getMonth() + 3)
        break
      case 'semiannual':
        next.setMonth(next.getMonth() + 6)
        break
      case 'annual':
        next.setFullYear(next.getFullYear() + 1)
        break
    }

    return next
  }, [lastRebalanceDate, rebalanceFrequency])

  const taxAwareRecommendations = useMemo(() => {
    if (!taxAwareMode) return rebalanceRecommendations

    return rebalanceRecommendations.map(rec => {
      if (rec.action === 'SELL' && rec.taxImpact > 0) {
        const adjustedAmount = rec.amount * 0.7
        return {
          ...rec,
          amount: adjustedAmount,
          shares: adjustedAmount / (rec.currentValue / rec.shares),
          taxImpact: rec.taxImpact * 0.7
        }
      }
      return rec
    })
  }, [rebalanceRecommendations, taxAwareMode])

  const whatIfScenario = useMemo((): InvestmentAllocation[] => {
    const newTotal = totalPortfolioValue + whatIfAmount

    const opportunities = holdings.map(holding => {
      const target = targetAllocations.find(t => t.symbol === holding.symbol)
      const targetPercent = target?.targetPercent || 0
      const targetValue = (targetPercent / 100) * newTotal
      const currentValue = holding.marketValue
      const gap = targetValue - currentValue

      return {
        symbol: holding.symbol,
        currentValue,
        currentPercent: holding.allocation,
        targetValue,
        targetPercent,
        gap,
        gapPercent: targetPercent - holding.allocation,
        price: holding.currentPrice
      }
    }).filter(o => o.gap > 0)

    if (opportunities.length === 0) return []

    if (investmentStrategy === 'lowToHigh') {
      opportunities.sort((a, b) => a.currentPercent - b.currentPercent)
    } else {
      opportunities.sort((a, b) => Math.abs(a.gapPercent) - Math.abs(b.gapPercent))
    }

    let remaining = whatIfAmount
    const allocations: InvestmentAllocation[] = []

    opportunities.forEach((opp, index) => {
      if (remaining <= 0) return

      const allocation = Math.min(opp.gap, remaining)
      const percentage = (allocation / whatIfAmount) * 100
      const shares = allocation / opp.price

      let reason = ''
      if (investmentStrategy === 'lowToHigh') {
        reason = `Lowest allocation (${opp.currentPercent.toFixed(1)}%) - building foundation`
      } else {
        reason = `${Math.abs(opp.gapPercent).toFixed(1)}% from target - quick win`
      }

      allocations.push({
        symbol: opp.symbol,
        amount: allocation,
        percentage,
        shares,
        reason
      })

      remaining -= allocation
    })

    return allocations
  }, [holdings, targetAllocations, totalPortfolioValue, whatIfAmount, investmentStrategy])

  const updateTargetAllocation = (symbol: string, value: number) => {
    setTargetAllocations(prev => {
      const updated = prev.map(t =>
        t.symbol === symbol ? { ...t, targetPercent: value } : t
      )
      return updated
    })
  }

  const autoBalanceAllocations = () => {
    const totalAllocated = targetAllocations.reduce((sum, t) => sum + t.targetPercent, 0)
    const remaining = 100 - totalAllocated

    if (Math.abs(remaining) < 0.01) return

    const perStock = remaining / targetAllocations.length
    setTargetAllocations(prev =>
      prev.map(t => ({ ...t, targetPercent: Math.max(0, t.targetPercent + perStock) }))
    )
  }

  const saveScenario = async (name: string) => {
    const newScenario: RebalanceScenario = {
      id: crypto.randomUUID(),
      name,
      targetAllocations: [...targetAllocations],
      rebalanceThreshold
    }
    const updatedScenarios = [...scenarios, newScenario]
    setScenarios(updatedScenarios)
    await saveScenarioToStorage(newScenario)
  }

  const loadScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (scenario) {
      setTargetAllocations(scenario.targetAllocations)
      setRebalanceThreshold(scenario.rebalanceThreshold)
      setSelectedScenario(scenarioId)
    }
  }

  const exportRecommendations = () => {
    const csv = [
      ['Symbol', 'Current %', 'Target %', 'Action', 'Amount', 'Shares', 'Tax Impact'],
      ...rebalanceRecommendations.map(rec => [
        rec.symbol,
        rec.currentAllocation.toFixed(2),
        rec.targetAllocation.toFixed(2),
        rec.action,
        formatCurrency(rec.amount),
        rec.shares.toFixed(4),
        formatCurrency(rec.taxImpact)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rebalance-recommendations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalValue = useMemo(() => {
    return stockAllocationData.reduce((sum, item) => sum + item.value, 0)
  }, [stockAllocationData])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm mt-1">
            {viewType === 'marketValue' && `Market Value: ${formatCurrency(data.marketValue)}`}
            {viewType === 'costBasis' && `Cost Basis: ${formatCurrency(data.costBasis)}`}
            {viewType === 'gain' && `Gain: ${formatCurrency(data.gain)}`}
            {viewType === 'loss' && `Loss: ${formatCurrency(Math.abs(data.gain))}`}
          </p>
          {totalValue > 0 && (
            <p className="text-sm">Allocation: {((data.value / totalValue) * 100).toFixed(2)}%</p>
          )}
        </div>
      )
    }
    return null
  }

  const totalTargetPercent = targetAllocations.reduce((sum, t) => sum + t.targetPercent, 0)
  const isTargetValid = Math.abs(totalTargetPercent - 100) < 0.01
  const totalTaxImpact = taxAwareRecommendations.reduce((sum, r) => sum + r.taxImpact, 0)

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="ml-3 text-muted-foreground">Loading portfolio data...</p>
        </div>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">Your complete investment overview</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No portfolio data available. Upload transactions to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'portfolio' ? 'Portfolio Allocation' : 'Portfolio Rebalancing'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'portfolio'
              ? 'Analyze your portfolio distribution with real-time data'
              : 'AI-powered insights to optimize your investment strategy'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
            <Button
              variant={mode === 'portfolio' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('portfolio')}
              className="gap-2"
            >
              <PieChartIcon className="h-4 w-4" />
              Portfolio
            </Button>
            <Button
              variant={mode === 'rebalance' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('rebalance')}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Rebalance
            </Button>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Mode */}
      {mode === 'portfolio' && (
        <>
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
              {chartType === 'pie' ? (
                <InteractiveDonut
                  data={stockAllocationData}
                  title="Portfolio"
                  centerLabel="Total Value"
                  showDetails={true}
                  viewType={viewType}
                />
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockAllocationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={60}
                          interval={0}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={12}>
                          {stockAllocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {stockAllocationData.map((stock) => (
                      <div
                        key={stock.name}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted shrink-0">
                          <span className="text-xs font-bold">{stock.name.substring(0, 2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stock.color }} />
                            <span className="font-semibold">{stock.name}</span>
                            <span className="text-xs text-muted-foreground">{stock.sector}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="text-muted-foreground">
                              {totalValue > 0 ? ((stock.value / totalValue) * 100).toFixed(2) : '0.00'}%
                            </span>
                            <span className={stock.gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {stock.gain >= 0 ? '+' : ''}{formatCurrency(stock.gain)} ({stock.gainPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold">{formatCurrency(stock.value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {viewType === 'marketValue' && `Cost: ${formatCurrency(stock.costBasis)}`}
                            {viewType === 'costBasis' && `Value: ${formatCurrency(stock.marketValue)}`}
                            {viewType === 'gain' && `${stock.gainPercent.toFixed(2)}% gain`}
                            {viewType === 'loss' && `${Math.abs(stock.gainPercent).toFixed(2)}% loss`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs value={allocationTab} onValueChange={setAllocationTab} className="space-y-4">
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
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorAllocation} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={140}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) => `${value.toFixed(2)}%`}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {sectorAllocation.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
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
                    <div className="h-[500px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={industryAllocation} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={160}
                            interval={0}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(value: number) => `${value.toFixed(2)}%`}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                            {industryAllocation.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
                  <InteractiveDonut
                    data={countryAllocation.map((item, index) => ({
                      ...item,
                      color: COLORS[index % COLORS.length]
                    }))}
                    title="Portfolio"
                    centerLabel="Total"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assetType">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Asset Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractiveDonut
                    data={assetTypeAllocation.map((item, index) => ({
                      ...item,
                      color: COLORS[index % COLORS.length]
                    }))}
                    title="Portfolio"
                    centerLabel="Total"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      {mode === "portfolio" && (
        <PortfolioAIInsight
          mode="portfolio"
          holdings={holdings}
          totalPortfolioValue={totalPortfolioValue}
          allocationHistory={allocationHistory}
          driftScore={driftScore}
          riskScore={riskScore}
        />
      )}
      {/* Rebalance Mode */}
      {mode === 'rebalance' && (
        <>
          {/* Status Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Score Card */}
            <Card className={`border ${needsRebalancing ? "border-amber-500/50" : "border-primary/50"}`}>
              <CardContent className="flex items-center gap-4 p-6">
                {needsRebalancing ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                    <Target className="h-8 w-8 text-amber-500" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-lg">Balance Score</h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">What is Balance Score?</h4>
                          <p className="text-sm text-muted-foreground">
                            Measures how closely your current portfolio matches your target allocation.
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span>81-100: Perfect balance</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span>61-80: Good balance</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span>41-60: Needs attention</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span>0-40: Rebalance now</span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {needsRebalancing
                      ? `${Math.abs(100 - driftScore).toFixed(1)}% drift from target`
                      : "Portfolio is well balanced"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Next: {nextRebalanceDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold ${needsRebalancing ? "text-amber-500" : "text-primary"}`}>
                    {driftScore.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
              </CardContent>
            </Card>

            {/* Risk Score Card */}
            <Card className={`border ${riskScore < 60 ? "border-red-500/50" : riskScore < 80 ? "border-amber-500/50" : "border-green-500/50"}`}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${riskScore < 60 ? "bg-red-500/20" : riskScore < 80 ? "bg-amber-500/20" : "bg-green-500/20"
                  }`}>
                  <Shield className={`h-8 w-8 ${riskScore < 60 ? "text-red-500" : riskScore < 80 ? "text-amber-500" : "text-green-500"
                    }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-lg">Risk Score</h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">What is Risk Score?</h4>
                          <p className="text-sm text-muted-foreground">
                            Measures your portfolio's diversification health.
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span>81-100: Excellent diversification</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span>61-80: Good diversification</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span>41-60: Moderate concentration</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span>0-40: High concentration risk</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Based on stock, sector, and portfolio concentration benchmarks
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {riskScore >= 80 ? "Well diversified" : riskScore >= 60 ? "Moderate concentration" : "High concentration risk"}
                  </p>
                  {concentrationWarnings.length > 0 && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        {concentrationWarnings.length} Warning{concentrationWarnings.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold ${riskScore < 60 ? "text-red-500" : riskScore < 80 ? "text-amber-500" : "text-green-500"
                    }`}>
                    {riskScore.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {mode === "rebalance" && (
            <PortfolioAIInsight
              mode="rebalance"
              holdings={holdings}
              totalPortfolioValue={totalPortfolioValue}
              allocationHistory={allocationHistory}
              rebalanceRecommendations={rebalanceRecommendations}
              whatIfScenario={whatIfScenario}
              whatIfAmount={whatIfAmount}
              driftScore={driftScore}
              riskScore={riskScore}
            />
          )}
          {/* Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stock Concentration Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setMode('portfolio')
                setAllocationTab('sector')
              }}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Stock Concentration
                  <Badge variant="outline" className="ml-auto">Click to view</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {concentrationWarnings.length > 0 ? (
                  concentrationWarnings.slice(0, 3).map(warning => (
                    <div key={warning.symbol} className={`p-3 rounded-lg border ${warning.risk === 'VERY HIGH' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                      warning.risk === 'HIGH' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900' :
                        'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{warning.symbol}</span>
                        <Badge variant="destructive" className="text-xs">
                          {warning.risk}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {warning.allocation.toFixed(1)}% allocation
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {warning.multiple.toFixed(1)}x above average ({BENCHMARKS.stockConcentration.max}%)
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Well Distributed</p>
                    <p className="text-xs text-muted-foreground">No concentration warnings</p>
                  </div>
                )}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Average investor: {BENCHMARKS.stockConcentration.min}-{BENCHMARKS.stockConcentration.max}% {BENCHMARKS.stockConcentration.label}
                </div>
              </CardContent>
            </Card>

            {/* Sector Allocation Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setMode('portfolio')
                setAllocationTab('sector')
              }}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Sector Allocation
                  <Badge variant="outline" className="ml-auto">Click to view</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sectorAnalysis.slice(0, 3).map(sector => (
                  <div key={sector.sector} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{sector.sector}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{sector.allocation.toFixed(1)}%</span>
                        {sector.risk !== 'LOW' && (
                          <Badge variant={sector.risk === 'VERY HIGH' || sector.risk === 'HIGH' ? 'destructive' : 'secondary'} className="text-xs">
                            {sector.risk}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${sector.risk === 'VERY HIGH' ? 'bg-red-500' :
                          sector.risk === 'HIGH' ? 'bg-orange-500' :
                            sector.risk === 'MODERATE' ? 'bg-amber-500' :
                              'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(sector.allocation, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Average investor: {BENCHMARKS.sectorConcentration.min}-{BENCHMARKS.sectorConcentration.max}% {BENCHMARKS.sectorConcentration.label}
                </div>
              </CardContent>
            </Card>

            {/* Asset Type Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setMode('portfolio')
                setAllocationTab('assetType')
              }}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Asset Allocation
                  <Badge variant="outline" className="ml-auto">Click to view</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assetAnalysis.map(asset => (
                  <div key={asset.assetType} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{asset.assetType}s</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{asset.allocation.toFixed(1)}%</span>
                        {asset.risk !== 'LOW' && (
                          <Badge variant={asset.risk === 'HIGH' ? 'destructive' : 'secondary'} className="text-xs">
                            {asset.risk}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${asset.risk === 'HIGH' ? 'bg-red-500' :
                          asset.risk === 'MODERATE' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Recommended: {BENCHMARKS.stockAllocation.min}-{BENCHMARKS.stockAllocation.max}% stocks, {BENCHMARKS.etfAllocation.min}-{BENCHMARKS.etfAllocation.max}% ETFs
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Selection Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Allocation Analysis</CardTitle>
                <Tabs value={rebalanceChartView} onValueChange={(v: any) => setRebalanceChartView(v)}>
                  <TabsList>
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                    <TabsTrigger value="sector">Sector</TabsTrigger>
                    <TabsTrigger value="asset">Asset</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {rebalanceChartView === 'stock' && (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rebalanceRecommendations.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="symbol" width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend />
                      <Bar dataKey="currentAllocation" name="Current" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="targetAllocation" name="Target" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {rebalanceChartView === 'sector' && (
                <InteractiveDonut
                  data={sectorAllocation.map((item, index) => ({
                    ...item,
                    color: COLORS[index % COLORS.length]
                  }))}
                  title="Sector"
                  centerLabel="Total"
                />
              )}

              {rebalanceChartView === 'asset' && (
                <InteractiveDonut
                  data={assetTypeAllocation.map((item, index) => ({
                    ...item,
                    color: COLORS[index % COLORS.length]
                  }))}
                  title="Asset"
                  centerLabel="Total"
                />
              )}
            </CardContent>
          </Card>

          {/* Tabs for Rebalance Details */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="targets">Targets</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="whatif">What-If</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Recommendations Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Recommended Actions</CardTitle>
                      {taxAwareMode && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Tax-aware mode active • Optimizing for minimal tax impact
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportRecommendations}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rebalancing Settings</DialogTitle>
                            <DialogDescription>Configure your rebalancing preferences</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Rebalance Threshold (%)</Label>
                              <Input
                                type="number"
                                value={rebalanceThreshold}
                                onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
                                min={1}
                                max={20}
                              />
                              <p className="text-xs text-muted-foreground">
                                Trigger rebalancing when drift exceeds this percentage
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Rebalance Frequency</Label>
                              <Select value={rebalanceFrequency} onValueChange={(v: any) => setRebalanceFrequency(v)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="semiannual">Semi-Annual</SelectItem>
                                  <SelectItem value="annual">Annual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Tax-Aware Rebalancing</Label>
                                <p className="text-xs text-muted-foreground">Minimize capital gains tax</p>
                              </div>
                              <Switch checked={taxAwareMode} onCheckedChange={setTaxAwareMode} />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(taxAwareMode ? taxAwareRecommendations : rebalanceRecommendations).filter(r => r.action !== 'HOLD').length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Symbol</TableHead>
                              <TableHead className="text-right">Current</TableHead>
                              <TableHead className="text-center">→</TableHead>
                              <TableHead className="text-right">Target</TableHead>
                              <TableHead className="text-right">Drift</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead className="text-right">Shares</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              {taxAwareMode && <TableHead className="text-right">Tax Impact</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(taxAwareMode ? taxAwareRecommendations : rebalanceRecommendations)
                              .filter(r => r.action !== 'HOLD')
                              .map((rec) => (
                                <TableRow key={rec.symbol}>
                                  <TableCell className="font-medium">{rec.symbol}</TableCell>
                                  <TableCell className="text-right">{rec.currentAllocation.toFixed(2)}%</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
                                  </TableCell>
                                  <TableCell className="text-right">{rec.targetAllocation.toFixed(2)}%</TableCell>
                                  <TableCell className={`text-right ${Math.abs(rec.drift) > rebalanceThreshold ? 'text-amber-500 font-semibold' : ''}`}>
                                    {rec.drift > 0 ? '+' : ''}{rec.drift.toFixed(2)}%
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={rec.action === "BUY" ? "default" : "destructive"}>
                                      {rec.action}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{rec.shares.toFixed(4)}</TableCell>
                                  <TableCell className={`text-right font-medium ${rec.action === "BUY" ? "text-primary" : "text-destructive"}`}>
                                    {formatCurrency(rec.amount)}
                                  </TableCell>
                                  {taxAwareMode && (
                                    <TableCell className="text-right text-amber-600">
                                      {rec.taxImpact > 0 ? formatCurrency(rec.taxImpact) : '-'}
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>

                      {taxAwareMode && totalTaxImpact > 0 && (
                        <Collapsible open={taxInfoOpen} onOpenChange={setTaxInfoOpen}>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between bg-transparent">
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-amber-600" />
                                <span>Tax Information</span>
                              </div>
                              <ChevronDown className={`h-4 w-4 transition-transform ${taxInfoOpen ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                              <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                                📋 Important Notice
                              </p>
                              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                This analysis is for <strong>informational purposes only</strong>. We do not recommend selling positions. Consider adding new capital to rebalance instead.
                              </p>
                              <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                <p><strong>Estimated Tax Impact:</strong> {formatCurrency(totalTaxImpact)}</p>
                                <p className="text-xs mt-2">
                                  * Based on 20% long-term capital gains tax rate. Actual tax may vary.
                                </p>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-medium">Portfolio is Well Balanced</p>
                      <p className="text-sm text-muted-foreground">No rebalancing needed at this time</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Holdings Status - PAGINATED */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">All Holdings Status</CardTitle>
                    <Select value={holdingsPageSize.toString()} onValueChange={(v) => setHoldingsPageSize(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Show 5</SelectItem>
                        <SelectItem value="10">Show 10</SelectItem>
                        <SelectItem value="25">Show 25</SelectItem>
                        <SelectItem value="50">Show 50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rebalanceRecommendations.slice(0, holdingsPageSize).map((rec) => {
                      const hasDrift = Math.abs(rec.drift) > rebalanceThreshold

                      return (
                        <div key={rec.symbol} className="flex items-center gap-4">
                          <div className="w-16 font-medium text-foreground">{rec.symbol}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                Current: {rec.currentAllocation.toFixed(2)}% | Target: {rec.targetAllocation.toFixed(2)}%
                              </span>
                              <span className={hasDrift ? "text-amber-500 font-semibold" : "text-foreground"}>
                                {rec.drift > 0 ? '+' : ''}{rec.drift.toFixed(2)}% drift
                              </span>
                            </div>
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${hasDrift ? "bg-amber-500" : "bg-primary"}`}
                                style={{ width: `${Math.min((rec.currentAllocation / Math.max(rec.targetAllocation, 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-32 text-right">
                            <div className="text-sm font-medium">{formatCurrency(rec.currentValue)}</div>
                            <div className="text-xs text-muted-foreground">
                              → {formatCurrency(rec.targetValue)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {rebalanceRecommendations.length > holdingsPageSize && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Showing {holdingsPageSize} of {rebalanceRecommendations.length} holdings
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab - UPDATED COLORS */}
            <TabsContent value="history" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Biggest Increases */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" style={{ color: HISTORY_GREEN }} />
                      Top Allocation Increases (12 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allocationChanges.increases.length > 0 ? (
                      <div className="space-y-3">
                        {allocationChanges.increases.map((change) => (
                          <div
                            key={change.symbol}
                            className="relative p-4 rounded-lg overflow-hidden"
                            style={{ backgroundColor: `${HISTORY_GREEN}20` }}
                          >
                            <div
                              className="absolute inset-0 rounded-lg"
                              style={{
                                backgroundColor: HISTORY_GREEN,
                                width: `${Math.min((change.change / 20) * 100, 100)}%`,
                                opacity: 0.3
                              }}
                            />
                            <div className="relative flex items-center justify-between">
                              <div>
                                <div className="font-bold text-lg" style={{ color: HISTORY_GREEN }}>{change.symbol}</div>
                                <div className="text-sm text-muted-foreground">
                                  {change.from.toFixed(2)}% → {change.to.toFixed(2)}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: HISTORY_GREEN }}>
                                  +{change.change.toFixed(2)}%
                                </div>
                                <div className="text-xs text-muted-foreground">increase</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No significant increases</p>
                    )}
                  </CardContent>
                </Card>

                {/* Biggest Decreases */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" style={{ color: HISTORY_RED }} />
                      Top Allocation Decreases (12 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allocationChanges.decreases.length > 0 ? (
                      <div className="space-y-3">
                        {allocationChanges.decreases.map((change) => (
                          <div
                            key={change.symbol}
                            className="relative p-4 rounded-lg overflow-hidden"
                            style={{ backgroundColor: `${HISTORY_RED}20` }}
                          >
                            <div
                              className="absolute inset-0 rounded-lg"
                              style={{
                                backgroundColor: HISTORY_RED,
                                width: `${Math.min((Math.abs(change.change) / 20) * 100, 100)}%`,
                                opacity: 0.3
                              }}
                            />
                            <div className="relative flex items-center justify-between">
                              <div>
                                <div className="font-bold text-lg" style={{ color: HISTORY_RED }}>{change.symbol}</div>
                                <div className="text-sm text-muted-foreground">
                                  {change.from.toFixed(2)}% → {change.to.toFixed(2)}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: HISTORY_RED }}>
                                  {change.change.toFixed(2)}%
                                </div>
                                <div className="text-xs text-muted-foreground">decrease</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No significant decreases</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Allocation Over Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Portfolio Allocation Trend (12 Months)</CardTitle>
                  <p className="text-sm text-muted-foreground">See how your holdings have grown or shrunk</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={allocationHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                        />
                        <Legend />
                        {holdings.slice(0, 8).map((holding, index) => (
                          <Area
                            key={holding.symbol}
                            type="monotone"
                            dataKey={holding.symbol}
                            stackId="1"
                            stroke={COLORS[index % COLORS.length]}
                            fill={COLORS[index % COLORS.length]}
                            fillOpacity={0.6}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Stock Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Individual Stock Allocation Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={allocationHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                        />
                        <Legend />
                        {holdings.slice(0, 8).map((holding, index) => (
                          <Line
                            key={holding.symbol}
                            type="monotone"
                            dataKey={holding.symbol}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Target Allocation Tab - PAGINATED */}
            <TabsContent value="targets" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Set Target Allocations</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total: {totalTargetPercent.toFixed(2)}%
                        {!isTargetValid && <span className="text-amber-500 ml-2">(Must equal 100%)</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select value={targetPageSize.toString()} onValueChange={(v) => setTargetPageSize(Number(v))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Show 5</SelectItem>
                          <SelectItem value="10">Show 10</SelectItem>
                          <SelectItem value="25">Show 25</SelectItem>
                          <SelectItem value="50">Show 50</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const equal = 100 / holdings.length
                          setTargetAllocations(holdings.map(h => ({
                            symbol: h.symbol,
                            targetPercent: equal
                          })))
                        }}
                      >
                        Equal Weight
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={autoBalanceAllocations}
                      >
                        Auto Balance
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save Scenario
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Rebalance Scenario</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Scenario Name</Label>
                              <Input
                                placeholder="e.g., Conservative Growth"
                                id="scenario-name"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              const input = document.getElementById('scenario-name') as HTMLInputElement
                              if (input?.value) {
                                saveScenario(input.value)
                                input.value = ''
                              }
                            }}>
                              Save Scenario
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {targetAllocations.slice(0, targetPageSize).map((target) => {
                      const holding = holdings.find(h => h.symbol === target.symbol)
                      if (!holding) return null

                      return (
                        <div key={target.symbol} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{target.symbol}</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => updateTargetAllocation(target.symbol, Math.max(0, target.targetPercent - 1))}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={target.targetPercent.toFixed(2)}
                                onChange={(e) => updateTargetAllocation(target.symbol, Number(e.target.value))}
                                className="w-24 text-center"
                                step="0.1"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-muted-foreground w-4">%</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => updateTargetAllocation(target.symbol, Math.min(100, target.targetPercent + 1))}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Current: {holding.allocation.toFixed(2)}%</span>
                            <span>•</span>
                            <span>Value: {formatCurrency(holding.marketValue)}</span>
                            <span>•</span>
                            <span className={Math.abs(holding.allocation - target.targetPercent) > rebalanceThreshold ? 'text-amber-500' : ''}>
                              Drift: {(holding.allocation - target.targetPercent).toFixed(2)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${target.targetPercent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {targetAllocations.length > targetPageSize && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Showing {targetPageSize} of {targetAllocations.length} holdings
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scenarios Tab */}
            <TabsContent value="scenarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saved Rebalance Scenarios</CardTitle>
                  <p className="text-sm text-muted-foreground">Save and load different allocation strategies</p>
                </CardHeader>
                <CardContent>
                  {scenarios.length > 0 ? (
                    <div className="space-y-3">
                      {scenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedScenario === scenario.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            }`}
                          onClick={() => loadScenario(scenario.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{scenario.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {scenario.targetAllocations.length} assets • {scenario.rebalanceThreshold}% threshold
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={selectedScenario === scenario.id ? "default" : "outline"}
                              >
                                {selectedScenario === scenario.id ? "Active" : "Load"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteScenarioFromStorage(scenario.id)
                                  setScenarios(prev => prev.filter(s => s.id !== scenario.id))
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {scenario.targetAllocations.slice(0, 5).map(t => (
                              <Badge key={t.symbol} variant="secondary">
                                {t.symbol}: {t.targetPercent.toFixed(1)}%
                              </Badge>
                            ))}
                            {scenario.targetAllocations.length > 5 && (
                              <Badge variant="secondary">
                                +{scenario.targetAllocations.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Save className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-2">No saved scenarios yet</p>
                      <p className="text-sm text-muted-foreground">
                        Create target allocations and save them as scenarios for quick loading
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* What-If Analysis Tab - ENHANCED */}
            <TabsContent value="whatif" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Smart Investment Calculator</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Get personalized recommendations on how to invest new capital
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Input Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Additional Capital to Invest</Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={whatIfAmount}
                          onChange={(e) => setWhatIfAmount(Number(e.target.value))}
                          className="pl-10"
                          step="1000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>New Portfolio Value</Label>
                      <div className="mt-2 flex items-center h-10 px-4 bg-primary/10 rounded-md">
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(totalPortfolioValue + whatIfAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Selection */}
                  <div className="space-y-3">
                    <Label>Investment Strategy</Label>
                    <RadioGroup value={investmentStrategy} onValueChange={(v: any) => setInvestmentStrategy(v)}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
                        <RadioGroupItem value="lowToHigh" id="lowToHigh" />
                        <Label htmlFor="lowToHigh" className="flex-1 cursor-pointer">
                          <div className="font-medium">Low to High (Build Foundation)</div>
                          <div className="text-xs text-muted-foreground">Focus on stocks with lowest allocation first</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
                        <RadioGroupItem value="closeToTarget" id="closeToTarget" />
                        <Label htmlFor="closeToTarget" className="flex-1 cursor-pointer">
                          <div className="font-medium">Close to Target (Quick Wins)</div>
                          <div className="text-xs text-muted-foreground">Complete positions that are almost at target</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Investment Breakdown */}
                  {whatIfScenario.length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h3 className="font-semibold">Your {formatCurrency(whatIfAmount)} Investment Plan</h3>
                        {whatIfScenario.map((allocation, index) => (
                          <div key={allocation.symbol} className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold">{allocation.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{allocation.reason}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-primary">{formatCurrency(allocation.amount)}</div>
                                <div className="text-xs text-muted-foreground">{allocation.percentage.toFixed(1)}% of total</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Shares to buy:</span>
                              <span className="font-medium">{allocation.shares.toFixed(4)}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${allocation.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Visual Breakdown */}
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                              <p className="font-medium text-blue-900 dark:text-blue-100">Smart Strategy Benefits</p>
                              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>✓ {investmentStrategy === 'lowToHigh' ? 'Build solid foundation by strengthening weakest positions' : 'Quick wins by completing near-target allocations'}</li>
                                <li>✓ Avoid selling positions (no capital gains tax)</li>
                                <li>✓ Bring portfolio closer to target allocation</li>
                                <li>✓ Maintain diversification across holdings</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {whatIfScenario.length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">All positions are at or above target</p>
                      <p className="text-sm text-muted-foreground">Consider adjusting your target allocations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
