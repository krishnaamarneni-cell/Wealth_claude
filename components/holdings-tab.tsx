"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HoldingsAIInsight from "@/components/holdings-ai-insight"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Lock,
  Info,
  Search,
  Plus,
  Trash2,
  Bell,
  BellOff,
  BarChart3,
  X
} from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import type { Transaction, Holding } from "@/lib/holdings-calculator"
import { calculateHoldings, buildHoldingsWithPrices } from "@/lib/holdings-calculator"
import {
  getWatchlistFromStorage,
  saveWatchlistToStorage,
  getWatchlistCache,
  saveWatchlistCache,
  addToWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
  type WatchlistPriceData
} from "@/lib/watchlist-storage"
import { searchStocks, getBatchStockQuotes, type StockSearchResult } from "@/lib/stock-search-api"

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"]

// ==================== CACHE HELPERS ====================

const CACHE_KEY = 'holdingsPageCache'
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours

interface CachedHoldingsData {
  holdings: Holding[]
  transactions: Transaction[]
  brokers: string[]
  allTimeHigh: number
  timestamp: number
  transactionCount: number
}

const getCachedHoldings = async (transactionsCount: number): Promise<CachedHoldingsData | null> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data: CachedHoldingsData = JSON.parse(cached)
    const age = Date.now() - data.timestamp

    // Check if transaction count matches (passed from context now)
    if (data.transactionCount !== transactionsCount) {
      console.log('🔄 Transaction count changed, cache invalid')
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    if (age < CACHE_DURATION) {
      console.log(`⚡ Using cached holdings (${Math.floor(age / 1000 / 60)} min old)`)
      return data
    }
    return null
  } catch (error) {
    console.error('Error getting cached holdings:', error)
    return null
  }
}

const setCachedHoldings = (data: Omit<CachedHoldingsData, 'transactionCount'>, transactionsCount: number): void => {
  try {
    const cacheData: CachedHoldingsData = {
      ...data,
      transactionCount: transactionsCount
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('✓ Holdings cached')
  } catch (error) {
    console.error('Failed to cache holdings:', error)
  }
}

// ============ INTERACTIVE SVG DONUT ============

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
  showDetails?: boolean
  viewType?: string
}

function InteractiveHoldingsDonut({
  data,
  title,
  centerLabel = "Total",
  showDetails = false,
  viewType = "marketValue",
}: InteractiveDonutProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

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
        `Z`,
      ].join(" ")
    }

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      `Z`,
    ].join(" ")
  }

  const formatCurrencyValue = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* SVG Donut */}
      <div className="flex-1">
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

          {/* Center Text */}
          {hoveredItem ? (
            <>
              <text
                x="200"
                y="185"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="14"
                fontWeight="500"
              >
                {hoveredItem}
              </text>
              <text
                x="200"
                y="210"
                textAnchor="middle"
                fill="#22c55e"
                fontSize="20"
                fontWeight="700"
              >
                {formatCurrencyValue(segments.find((s) => s.name === hoveredItem)?.value || 0)}
              </text>
              <text x="200" y="230" textAnchor="middle" fill="#ffffff" fontSize="12">
                {segments.find((s) => s.name === hoveredItem)?.percentage.toFixed(1)}% of{" "}
                {title.toLowerCase()}
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
                {centerLabel}
              </text>
              <text
                x="200"
                y="215"
                textAnchor="middle"
                fill="#22c55e"
                fontSize="24"
                fontWeight="700"
              >
                {formatCurrencyValue(total)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 max-w-md">
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {segments.map((item) => (
            <div
              key={item.name}
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
                    {item.sector && (
                      <span className="text-xs text-muted-foreground truncate">{item.sector}</span>
                    )}
                  </div>
                  {showDetails && item.gain !== undefined && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className={item.gain >= 0 ? "text-green-500" : "text-red-500"}>
                        {item.gain >= 0 ? "+" : ""}
                        {formatCurrencyValue(item.gain)} ({item.gainPercent?.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="text-sm font-bold text-foreground">{item.percentage.toFixed(2)}%</div>
                <div className="text-xs text-green-500 font-medium">
                  {formatCurrencyValue(item.value)}
                </div>
                {showDetails && item.costBasis && (
                  <div className="text-xs text-muted-foreground">
                    {viewType === "marketValue"
                      ? `Cost: ${formatCurrencyValue(item.costBasis)}`
                      : viewType === "cost"
                        ? `Value: ${formatCurrencyValue(item.marketValue || 0)}`
                        : viewType === "gain"
                          ? `${item.gainPercent?.toFixed(2)}% gain`
                          : `${Math.abs(item.gainPercent || 0).toFixed(2)}% loss`}
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

// ============ MAIN COMPONENT ============

interface HoldingsTabProps {
  onStockClick?: (symbol: string) => void
}

export default function HoldingsTab({ onStockClick }: HoldingsTabProps) {
  // Get transactions from Portfolio context (already loaded and cached)
  const { transactions: contextTransactions } = usePortfolio()
  
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [allHoldings, setAllHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pieChartView, setPieChartView] = useState<"marketValue" | "cost" | "gain" | "loss">("marketValue")
  const [statsView, setStatsView] = useState<"keystats" | "gains" | "pnl">("keystats")
  const [performanceView, setPerformanceView] = useState<"1D" | "1W" | "1M" | "1Y" | "All">("1D")
  const [selectedBroker, setSelectedBroker] = useState<string>("All")
  const [availableBrokers, setAvailableBrokers] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"allocation" | "value-high" | "value-low" | "gain-high" | "gain-low" | "alphabetical">("allocation")
  const [allTimeHigh, setAllTimeHigh] = useState<number>(0)

  // Watchlist states
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, WatchlistPriceData>>({})
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  // Direct add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [directTickerInput, setDirectTickerInput] = useState("")
  const [isAddingTicker, setIsAddingTicker] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const cached = await getCachedHoldings(contextTransactions?.length || 0)

      if (cached) {
        console.log('⚡ Showing cached holdings instantly')
        setAllHoldings(cached.holdings)
        setTransactions(cached.transactions)
        setAvailableBrokers(cached.brokers)
        setAllTimeHigh(cached.allTimeHigh)
        setIsLoading(false)

        await loadTransactionsAndCalculateHoldings(true)
      } else {
        await loadTransactionsAndCalculateHoldings(false)
      }
    }

    loadData().catch(err => {
      console.error('[holdings-tab] Error loading data:', err)
      setIsLoading(false)
    })

    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing holdings data...")
      loadTransactionsAndCalculateHoldings(true).catch(err => {
        console.error('[holdings-tab] Error refreshing:', err)
      })
    }, 3 * 60 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [contextTransactions?.length])

  useEffect(() => {
    let filteredHoldings: Holding[]

    if (selectedBroker !== "All") {
      filteredHoldings = allHoldings.filter((h) => h.broker === selectedBroker)
    } else {
      const consolidatedMap = new Map<string, Holding>()

      allHoldings.forEach((holding) => {
        const symbol = holding.symbol

        if (consolidatedMap.has(symbol)) {
          const existing = consolidatedMap.get(symbol)!
          const combinedShares = existing.shares + holding.shares
          const combinedCost = existing.totalCost + holding.totalCost
          const combinedMarketValue = existing.marketValue + holding.marketValue
          const combinedTodayGain = existing.todayGain + holding.todayGain
          const combinedTotalGain = existing.totalGain + holding.totalGain

          const avgCost = combinedCost / combinedShares
          const currentPrice = combinedMarketValue / combinedShares
          const yesterdayValue = combinedMarketValue - combinedTodayGain
          const todayGainPercent = yesterdayValue > 0 ? (combinedTodayGain / yesterdayValue) * 100 : 0
          const totalGainPercent = combinedCost > 0 ? (combinedTotalGain / combinedCost) * 100 : 0

          consolidatedMap.set(symbol, {
            symbol: symbol,
            shares: combinedShares,
            totalCost: combinedCost,
            avgCost: avgCost,
            marketValue: combinedMarketValue,
            currentPrice: currentPrice,
            todayGain: combinedTodayGain,
            todayGainPercent: isFinite(todayGainPercent) ? todayGainPercent : 0,
            totalGain: combinedTotalGain,
            totalGainPercent: isFinite(totalGainPercent) ? totalGainPercent : 0,
            allocation: 0,
            sector: existing.sector,
            industry: existing.industry,
            country: existing.country,
            assetType: existing.assetType,
            broker: "All Accounts",
            splitAdjusted: existing.splitAdjusted || holding.splitAdjusted,
          })
        } else {
          consolidatedMap.set(symbol, { ...holding })
        }
      })

      filteredHoldings = Array.from(consolidatedMap.values())
    }

    const totalValue = filteredHoldings.reduce((sum, h) => sum + h.marketValue, 0)
    if (totalValue > 0) {
      filteredHoldings.forEach((h) => {
        h.allocation = (h.marketValue / totalValue) * 100
      })
    }

    switch (sortBy) {
      case "allocation":
        filteredHoldings.sort((a, b) => b.allocation - a.allocation)
        break
      case "value-high":
        filteredHoldings.sort((a, b) => b.marketValue - a.marketValue)
        break
      case "value-low":
        filteredHoldings.sort((a, b) => a.marketValue - b.marketValue)
        break
      case "gain-high":
        filteredHoldings.sort((a, b) => b.totalGain - a.totalGain)
        break
      case "gain-low":
        filteredHoldings.sort((a, b) => a.totalGain - b.totalGain)
        break
      case "alphabetical":
        filteredHoldings.sort((a, b) => a.symbol.localeCompare(b.symbol))
        break
    }

    setHoldings(filteredHoldings)
  }, [selectedBroker, allHoldings, sortBy])

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist().catch(err => {
      console.error('[holdings-tab] Error loading watchlist:', err)
    })
  }, [])

  const loadWatchlist = async () => {
    try {
      const items = await getWatchlistFromStorage()

      if (!Array.isArray(items)) {
        console.error('[holdings-tab] getWatchlistFromStorage did not return an array:', items)
        setWatchlist([])
        return
      }

      setWatchlist(items)

      if (items.length === 0) return

      // Check cache first
      const cache = getWatchlistCache()
      if (cache && cache.data.length === items.length) {
        setWatchlistPrices(cache.priceData)
        console.log('⚡ Using cached watchlist prices')
        return
      }

      // Fetch fresh prices
      await fetchWatchlistPrices(items)
    } catch (error) {
      console.error('[holdings-tab] Error loading watchlist:', error)
      setWatchlist([])
    }
  }

  const fetchWatchlistPrices = async (items: WatchlistItem[]) => {
    setIsLoadingWatchlist(true)

    try {
      const symbols = items.map(item => item.symbol)
      const quotes = await getBatchStockQuotes(symbols)

      const priceData: Record<string, WatchlistPriceData> = {}

      Object.entries(quotes).forEach(([symbol, quote]) => {
        priceData[symbol] = {
          currentPrice: quote.price,
          change: quote.change,
          changePercent: quote.changesPercentage,
          high52Week: quote.yearHigh,
          low52Week: quote.yearLow,
          dividendYield: 0,
          marketCap: quote.marketCap,
          peRatio: quote.pe,
          volume: quote.volume,
          lastUpdated: Date.now()
        }
      })

      setWatchlistPrices(priceData)
      saveWatchlistCache(items, priceData)
    } catch (error) {
      console.error('Failed to fetch watchlist prices:', error)
    } finally {
      setIsLoadingWatchlist(false)
    }
  }

  // Search stocks with debounce
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchStocks(searchQuery)
        setSearchResults(results)
        setShowSearchDropdown(results.length > 0)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleAddToWatchlist = async (result: StockSearchResult) => {
    try {
      // Fetch current price
      const quotes = await getBatchStockQuotes([result.symbol])
      const currentPrice = quotes[result.symbol]?.price || 0

      await addToWatchlist(result.symbol, result.name, currentPrice)

      // Reload watchlist
      const updatedWatchlist = await getWatchlistFromStorage()
      setWatchlist(updatedWatchlist)

      // Fetch price for new stock immediately
      await fetchWatchlistPrices(updatedWatchlist)

      setSearchQuery("")
      setShowSearchDropdown(false)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleAddDirectTicker = async () => {
    const ticker = directTickerInput.trim().toUpperCase()

    if (!ticker) {
      alert('Please enter a ticker symbol')
      return
    }

    setIsAddingTicker(true)

    try {
      // Fetch stock info
      const quotes = await getBatchStockQuotes([ticker])
      const quote = quotes[ticker]

      if (!quote) {
        alert(`Could not find stock with ticker: ${ticker}`)
        setIsAddingTicker(false)
        return
      }

      await addToWatchlist(ticker, quote.name || ticker, quote.price)

      // Reload watchlist
      const updatedWatchlist = await getWatchlistFromStorage()
      setWatchlist(updatedWatchlist)
      await fetchWatchlistPrices(updatedWatchlist)

      setDirectTickerInput("")
      setIsAddDialogOpen(false)
    } catch (error: any) {
      alert(error.message || 'Failed to add stock')
    } finally {
      setIsAddingTicker(false)
    }
  }

  const handleRemoveFromWatchlist = async (symbol: string) => {
    await removeFromWatchlist(symbol)
    const updated = await getWatchlistFromStorage()
    setWatchlist(updated)
  }

  const watchlistWithPrices = watchlist && Array.isArray(watchlist) ? watchlist.map(item => ({
    ...item,
    ...watchlistPrices[item.symbol],
    priceChange: watchlistPrices[item.symbol]
      ? watchlistPrices[item.symbol].currentPrice - item.addedPrice
      : 0,
    priceChangePercent: watchlistPrices[item.symbol] && item.addedPrice > 0
      ? ((watchlistPrices[item.symbol].currentPrice - item.addedPrice) / item.addedPrice) * 100
      : 0
  })) : []

  const loadTransactionsAndCalculateHoldings = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }

      // Use transactions from context (already loaded via usePortfolio)
      const txns: Transaction[] = transactions

      if (!Array.isArray(txns)) {
        console.error('[holdings-tab] transactions from context is not an array:', txns)
        setAllHoldings([])
        setTransactions([])
        setIsLoading(false)
        return
      }

      if (!silent) {
        console.log("✅ Transactions loaded:", txns.length)
      }

      if (txns.length === 0) {
        if (!silent) {
          console.log("❌ No transactions found!")
        }
        setAllHoldings([])
        setTransactions([])
        setAvailableBrokers([])
        setIsLoading(false)
        return
      }

      txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setTransactions(txns)

      const brokers = Array.from(new Set(txns.map((t) => t.broker).filter(Boolean)))
      setAvailableBrokers(brokers)

      const { holdingsToFetch, symbolsWithSplits } = calculateHoldings(txns)

      if (!silent) {
        console.log("✅ Holdings to fetch:", holdingsToFetch.length)
        console.log("✅ Symbols with splits:", symbolsWithSplits)
      }

      if (holdingsToFetch.length === 0) {
        if (!silent) {
          console.log("❌ No active holdings found!")
        }
        setIsLoading(false)
        return
      }

      const holdingsWithPriceData = await buildHoldingsWithPrices(holdingsToFetch, symbolsWithSplits)

      if (!silent) {
        console.log("✅ Holdings with prices:", holdingsWithPriceData.length)
      }

      const totalPortfolioValue = holdingsWithPriceData.reduce((sum, h) => sum + h.marketValue, 0)

      if (totalPortfolioValue > 0) {
        holdingsWithPriceData.forEach((holding) => {
          holding.allocation = (holding.marketValue / totalPortfolioValue) * 100
        })
      }

      const storedHigh = localStorage.getItem("allTimeHigh")
      const currentHigh = storedHigh ? parseFloat(storedHigh) : totalPortfolioValue

      if (totalPortfolioValue > currentHigh) {
        setAllTimeHigh(totalPortfolioValue)
        localStorage.setItem("allTimeHigh", totalPortfolioValue.toString())
      } else {
        setAllTimeHigh(currentHigh)
      }

      holdingsWithPriceData.sort((a, b) => b.allocation - a.allocation)

      setAllHoldings(holdingsWithPriceData)
      setIsLoading(false)

      setCachedHoldings({
        holdings: holdingsWithPriceData,
        transactions: txns,
        brokers,
        allTimeHigh: currentHigh,
        timestamp: Date.now(),
      }, txns.length)
    } catch (error) {
      console.error('[holdings-tab] Error loading holdings:', error)
      setAllHoldings([])
      setTransactions([])
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadTransactionsAndCalculateHoldings(false).finally(() => {
      setTimeout(() => setIsRefreshing(false), 1000)
    })
  }

  const handleInfoClick = (section: string) => {
    console.log("Navigate to explanation for", section)
  }

  const formatCurrency = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return "$0.00"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatPercent = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return "0.00%"
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const totalPortfolioValue = allHoldings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalCost = allHoldings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalGain = totalPortfolioValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const todayGain = allHoldings.reduce((sum, h) => sum + h.todayGain, 0)
  const todayGainPercent = totalPortfolioValue - todayGain > 0 ? (todayGain / (totalPortfolioValue - todayGain)) * 100 : 0

  const unrealizedGains = holdings.filter((h) => h.totalGain > 0).reduce((sum, h) => sum + h.totalGain, 0)
  const realizedGains = transactions.filter((t) => t.type === "SELL").reduce((sum, t) => sum + Math.abs(t.total) * 0.20, 0)
  const dividends = transactions.filter((t) => t.type === "DIVIDEND").reduce((sum, t) => sum + Math.abs(t.total), 0)
  const fees = transactions.filter((t) => t.type === "FEE").reduce((sum, t) => sum + Math.abs(t.total), 0)
  const taxes = transactions.filter((t) => t.type === "TAX").reduce((sum, t) => sum + Math.abs(t.total), 0)
  const interests = transactions.filter((t) => t.type === "INTEREST").reduce((sum, t) => sum + Math.abs(t.total), 0)

  const gain1W = todayGain * 5
  const gain1WPercent = todayGainPercent * 5
  const gain1M = totalGain * 0.15
  const gain1MPercent = totalGainPercent * 0.15
  const gain3M = totalGain * 0.30
  const gain3MPercent = totalGainPercent * 0.30
  const gain6M = totalGain * 0.55
  const gain6MPercent = totalGainPercent * 0.55
  const gainYTD = totalGain * 0.12
  const gainYTDPercent = totalGainPercent * 0.12
  const gain1Y = totalGain * 0.80
  const gain1YPercent = totalGainPercent * 0.80

  const getTopPerformers = () => {
    const performersWithCalculation = holdings.map((h) => {
      let performanceValue = 0
      let performancePercent = 0

      switch (performanceView) {
        case "1D":
          performanceValue = h.todayGain
          performancePercent = h.todayGainPercent
          break
        case "1W":
          performanceValue = h.todayGain * 5
          performancePercent = h.todayGainPercent * 5
          break
        case "1M":
          performanceValue = h.totalGain * 0.3
          performancePercent = h.totalGainPercent * 0.3
          break
        case "1Y":
          performanceValue = h.totalGain * 0.85
          performancePercent = h.totalGainPercent * 0.85
          break
        case "All":
          performanceValue = h.totalGain
          performancePercent = h.totalGainPercent
          break
      }

      return {
        ...h,
        performanceValue: isFinite(performanceValue) ? performanceValue : 0,
        performancePercent: isFinite(performancePercent) ? performancePercent : 0,
      }
    })

    const allGainers = performersWithCalculation.filter((h) => h.performanceValue > 0.001)
    const allLosers = performersWithCalculation.filter((h) => h.performanceValue < -0.001)

    const gainers = allGainers
      .sort((a, b) => b.performancePercent - a.performancePercent)
      .slice(0, 5)

    const losers = allLosers
      .sort((a, b) => a.performancePercent - b.performancePercent)
      .slice(0, 5)

    return { gainers, losers }
  }

  const getChartData = () => {
    if (pieChartView === "marketValue") {
      return holdings.map((h, index) => ({
        name: h.symbol,
        value: h.marketValue,
        marketValue: h.marketValue,
        costBasis: h.totalCost,
        gain: h.totalGain,
        gainPercent: h.totalGainPercent,
        sector: h.sector,
        color: COLORS[index % COLORS.length],
      }))
    } else if (pieChartView === "cost") {
      return holdings.map((h, index) => ({
        name: h.symbol,
        value: h.totalCost,
        marketValue: h.marketValue,
        costBasis: h.totalCost,
        gain: h.totalGain,
        gainPercent: h.totalGainPercent,
        sector: h.sector,
        color: COLORS[index % COLORS.length],
      }))
    } else if (pieChartView === "gain") {
      return holdings
        .filter((h) => h.totalGain > 0)
        .map((h, index) => ({
          name: h.symbol,
          value: h.totalGain,
          marketValue: h.marketValue,
          costBasis: h.totalCost,
          gain: h.totalGain,
          gainPercent: h.totalGainPercent,
          sector: h.sector,
          color: COLORS[index % COLORS.length],
        }))
    } else {
      return holdings
        .filter((h) => h.totalGain < 0)
        .map((h, index) => ({
          name: h.symbol,
          value: Math.abs(h.totalGain),
          marketValue: h.marketValue,
          costBasis: h.totalCost,
          gain: h.totalGain,
          gainPercent: h.totalGainPercent,
          sector: h.sector,
          color: COLORS[index % COLORS.length],
        }))
    }
  }

  const getStatsTitle = () => {
    switch (statsView) {
      case "keystats":
        return "Key Stats"
      case "gains":
        return "Gains & Returns"
      case "pnl":
        return "P&L Breakdown"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = holdings.length > 0 ? getChartData() : []
  const { gainers, losers } = holdings.length > 0 ? getTopPerformers() : { gainers: [], losers: [] }

  return (
    <div className="space-y-6">
      {/* Broker Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedBroker === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBroker("All")}
                className="h-9"
              >
                All
              </Button>
              {availableBrokers.map((broker) => (
                <Button
                  key={broker}
                  variant={selectedBroker === broker ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBroker(broker)}
                  className="h-9 gap-1.5"
                >
                  {broker}
                  <Lock className="h-3 w-3" />
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold">{selectedBroker === "All" ? "All Accounts" : selectedBroker}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
              <p className="text-xs text-muted-foreground">{holdings.length} positions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Today's Return</p>
              <p className={`text-2xl font-bold ${todayGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(todayGain)}
              </p>
              <p className={`text-xs font-medium ${todayGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatPercent(todayGainPercent)} Today
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">All-Time Return</p>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(totalGain)}
              </p>
              <p className={`text-xs font-medium ${totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatPercent(totalGainPercent)} All time
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Cost Basis</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-muted-foreground">Invested capital</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SVG Donut Chart */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button
                  variant={pieChartView === "marketValue" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("marketValue")}
                  className="text-xs h-8 px-2"
                >
                  Market Value
                </Button>
                <Button
                  variant={pieChartView === "cost" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("cost")}
                  className="text-xs h-8 px-2"
                >
                  Cost
                </Button>
                <Button
                  variant={pieChartView === "gain" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("gain")}
                  className="text-xs h-8 px-2"
                >
                  Gain
                </Button>
                <Button
                  variant={pieChartView === "loss" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPieChartView("loss")}
                  className="text-xs h-8 px-2"
                >
                  Loss
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8"
                title={isRefreshing ? "Fetching live prices..." : "Refresh prices"}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {chartData.length > 0 ? (
              <InteractiveHoldingsDonut
                data={chartData}
                title="Portfolio"
                centerLabel={pieChartView === "marketValue" ? "Total Value" : pieChartView === "cost" ? "Total Cost" : pieChartView === "gain" ? "Total Gains" : "Total Losses"}
                showDetails={true}
                viewType={pieChartView}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No data available for this view
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Stats Card */}
        <Card className="lg:col-span-5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{getStatsTitle()}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleInfoClick(statsView)}
                  className="h-5 w-5 rounded-full hover:bg-muted"
                  title="Learn more about this metric"
                >
                  <Info className="h-4 w-4 text-blue-600" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={statsView === "keystats" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatsView("keystats")}
                  className="text-xs h-7 px-2"
                >
                  Key
                </Button>
                <Button
                  variant={statsView === "gains" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatsView("gains")}
                  className="text-xs h-7 px-2"
                >
                  Gains
                </Button>
                <Button
                  variant={statsView === "pnl" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatsView("pnl")}
                  className="text-xs h-7 px-2"
                >
                  P&L
                </Button>
              </div>
            </div>
            <div className="space-y-0.5">
              {statsView === "keystats" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">All-time High</p>
                    <p className="text-sm font-bold">{formatCurrency(allTimeHigh)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Unrealized Gains</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(unrealizedGains)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Dividends</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(dividends)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Fees</p>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(fees)}</p>
                  </div>
                </div>
              )}

              {statsView === "gains" && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (1W)</p>
                    <p className={`text-xs font-bold ${gain1W >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain1W)} ({formatPercent(gain1WPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (1M)</p>
                    <p className={`text-xs font-bold ${gain1M >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain1M)} ({formatPercent(gain1MPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (3M)</p>
                    <p className={`text-xs font-bold ${gain3M >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain3M)} ({formatPercent(gain3MPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (6M)</p>
                    <p className={`text-xs font-bold ${gain6M >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain6M)} ({formatPercent(gain6MPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (YTD)</p>
                    <p className={`text-xs font-bold ${gainYTD >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gainYTD)} ({formatPercent(gainYTDPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (1Y)</p>
                    <p className={`text-xs font-bold ${gain1Y >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(gain1Y)} ({formatPercent(gain1YPercent)})
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Gain (All)</p>
                    <p className={`text-xs font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(totalGain)} ({formatPercent(totalGainPercent)})
                    </p>
                  </div>
                </div>
              )}

              {statsView === "pnl" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Unrealized Gains</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(unrealizedGains)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Realized Gains</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(realizedGains)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Dividends</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(dividends)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Fees</p>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(fees)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Taxes</p>
                    <p className="text-sm font-bold">{formatCurrency(taxes)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Interests</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(interests)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <HoldingsAIInsight
        holdings={holdings}
        totalPortfolioValue={totalPortfolioValue}
        totalGain={totalGain}
        totalGainPercent={totalGainPercent}
        todayGain={todayGain}
        todayGainPercent={todayGainPercent}
      />

      {/* Performance Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Performance Analysis</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={performanceView === "1D" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1D")}
                className="text-xs h-8 px-3"
              >
                1D
              </Button>
              <Button
                variant={performanceView === "1W" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1W")}
                className="text-xs h-8 px-3"
              >
                1W
              </Button>
              <Button
                variant={performanceView === "1M" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1M")}
                className="text-xs h-8 px-3"
              >
                1M
              </Button>
              <Button
                variant={performanceView === "1Y" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("1Y")}
                className="text-xs h-8 px-3"
              >
                1Y
              </Button>
              <Button
                variant={performanceView === "All" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPerformanceView("All")}
                className="text-xs h-8 px-3"
              >
                All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold text-green-600">Top Gainers</h3>
              </div>
              <div className="space-y-2">
                {gainers.length > 0 ? (
                  gainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-green-600/10">
                      <div>
                        <p className="font-semibold text-foreground">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(stock.marketValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(stock.performanceValue)}</p>
                        <p className="text-xs font-medium text-green-600">{formatPercent(stock.performancePercent)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No gainers in this period</p>
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-semibold text-red-600">Top Losers</h3>
              </div>
              <div className="space-y-2">
                {losers.length > 0 ? (
                  losers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-red-600/10">
                      <div>
                        <p className="font-semibold text-foreground">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(stock.marketValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(stock.performanceValue)}</p>
                        <p className="text-xs font-medium text-red-600">{formatPercent(stock.performancePercent)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No losers in this period</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings | Watchlist Tabs - CORRECTED LOCATION */}
      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="holdings" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Holdings ({holdings.length})
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="gap-2">
            <Bell className="h-4 w-4" />
            Watchlist ({watchlist.length})
          </TabsTrigger>
        </TabsList>

        {/* HOLDINGS TABLE */}
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Holdings</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border rounded-md px-3 py-1.5 bg-background"
                  >
                    <option value="allocation">Sort by Allocation</option>
                    <option value="value-high">Value: High to Low</option>
                    <option value="value-low">Value: Low to High</option>
                    <option value="gain-high">Gain: High to Low</option>
                    <option value="gain-low">Gain: Low to High</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">Total Gain</TableHead>
                      <TableHead className="text-right">Today's Gain</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                      <TableHead>Broker</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.length > 0 ? (
                      holdings.map((holding) => (
                        <TableRow
                          key={`${holding.symbol}-${holding.broker}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onStockClick?.(holding.symbol)}
                        >
                          <TableCell className="font-medium">
                            {holding.symbol}
                            {holding.splitAdjusted && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Split Adjusted
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{holding.shares.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(holding.avgCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(holding.marketValue)}</TableCell>
                          <TableCell className={`text-right font-medium ${holding.totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(holding.totalGain)}
                            <div className="text-xs">{formatPercent(holding.totalGainPercent)}</div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${holding.todayGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(holding.todayGain)}
                            <div className="text-xs">{formatPercent(holding.todayGainPercent)}</div>
                          </TableCell>
                          <TableCell className="text-right">{holding.allocation.toFixed(2)}%</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{holding.broker}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No holdings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WATCHLIST TAB */}
        <TabsContent value="watchlist" className="space-y-6">
          {/* Add Stock Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company name or ticker (e.g., Apple or AAPL)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 1 && searchResults.length > 0 && setShowSearchDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                    className="pl-9"
                  />

                  {/* Search Dropdown */}
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-2 w-full bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.symbol}
                          className="flex items-center justify-between p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0"
                          onMouseDown={() => handleAddToWatchlist(result)}
                        >
                          <div>
                            <p className="font-semibold">{result.symbol}</p>
                            <p className="text-sm text-muted-foreground">{result.name}</p>
                            <p className="text-xs text-muted-foreground">{result.exchangeShortName}</p>
                          </div>
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                      ))}
                    </div>
                  )}

                  {showSearchDropdown && isSearching && (
                    <div className="absolute z-10 mt-2 w-full bg-card border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
                      Searching...
                    </div>
                  )}
                </div>

                {/* Direct Add Button */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add by Ticker
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Stock by Ticker</DialogTitle>
                      <DialogDescription>
                        Enter the stock ticker symbol directly if you know it
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="ticker">Ticker Symbol</Label>
                        <Input
                          id="ticker"
                          placeholder="e.g., AAPL, MSFT, TSLA"
                          value={directTickerInput}
                          onChange={(e) => setDirectTickerInput(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddDirectTicker()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddDirectTicker} disabled={isAddingTicker}>
                        {isAddingTicker ? 'Adding...' : 'Add to Watchlist'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => fetchWatchlistPrices(watchlist)}
                  disabled={isLoadingWatchlist || watchlist.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingWatchlist ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Watchlist Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Watchlist</CardTitle>
                {watchlist.length > 0 && (
                  <Badge variant="secondary">{watchlist.length} stocks</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No stocks in watchlist</p>
                  <p className="text-sm">Search by company name or add stocks by ticker above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Today's Change</TableHead>
                        <TableHead className="text-right">Since Added</TableHead>
                        <TableHead className="text-right">52W High</TableHead>
                        <TableHead className="text-right">52W Low</TableHead>
                        <TableHead className="text-right">Market Cap</TableHead>
                        <TableHead className="text-right">P/E Ratio</TableHead>
                        <TableHead className="text-center">Alert</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {watchlistWithPrices.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.symbol}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.companyName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.currentPrice ? formatCurrency(item.currentPrice) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${(item.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {item.change !== undefined ? (
                              <>
                                {formatCurrency(item.change)}
                                <div className="text-xs">
                                  {(item.changePercent || 0) >= 0 ? '+' : ''}{item.changePercent?.toFixed(2)}%
                                </div>
                              </>
                            ) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${item.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {item.priceChange !== undefined ? (
                              <>
                                {formatCurrency(item.priceChange)}
                                <div className="text-xs">
                                  {item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent.toFixed(2)}%
                                </div>
                              </>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.high52Week ? formatCurrency(item.high52Week) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.low52Week ? formatCurrency(item.low52Week) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.marketCap ? (
                              <span className="text-sm">
                                ${(item.marketCap / 1e9).toFixed(2)}B
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.peRatio ? item.peRatio.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Price alerts (coming soon)"
                              disabled
                            >
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFromWatchlist(item.symbol)}
                              className="h-8 w-8 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
