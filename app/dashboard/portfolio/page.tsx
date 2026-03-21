"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
import { TierGate } from "@/components/tier-gate"

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

// ─── Portfolio Content Component ─────────────────────────────────────────────
function PortfolioContent() {
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
          {/* Insights Row - abbreviated for file size */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setMode('portfolio'); setAllocationTab('sector') }}>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5" />Stock Concentration<Badge variant="outline" className="ml-auto">Click to view</Badge></CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{concentrationWarnings.length} warnings</p></CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setMode('portfolio'); setAllocationTab('sector') }}>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-5 w-5" />Sector Allocation<Badge variant="outline" className="ml-auto">Click to view</Badge></CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{sectorAnalysis.length} sectors</p></CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setMode('portfolio'); setAllocationTab('assetType') }}>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Asset Allocation<Badge variant="outline" className="ml-auto">Click to view</Badge></CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{assetAnalysis.length} asset types</p></CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page Export with TierGate ──────────────────────────────────────────
export default function PortfolioPage() {
  return (
    <TierGate requiredTier="pro">
      <PortfolioContent />
    </TierGate>
  )
}
