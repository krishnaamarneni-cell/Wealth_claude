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
}

const getCachedHoldings = async (): Promise<CachedHoldingsData | null> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data: CachedHoldingsData = JSON.parse(cached)
    const age = Date.now() - data.timestamp

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

const setCachedHoldings = async (data: CachedHoldingsData): Promise<void> => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
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
  const RADIUS = 80
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  let currentAngle = -90

  return (
    <div className="flex flex-col items-center gap-6">
      <svg width="280" height="280" className="drop-shadow-lg">
        <circle cx="140" cy="140" r={RADIUS + 20} fill="transparent" />
        {data.map((item, idx) => {
          const itemValue = item[viewType as keyof typeof item] || item.value || 0
          const percentage = total > 0 ? (itemValue / total) * 100 : 0
          const sliceAngle = (percentage / 100) * 360

          const startAngle = (currentAngle * Math.PI) / 180
          const endAngle = ((currentAngle + sliceAngle) * Math.PI) / 180

          const x1 = 140 + RADIUS * Math.cos(startAngle)
          const y1 = 140 + RADIUS * Math.sin(startAngle)
          const x2 = 140 + RADIUS * Math.cos(endAngle)
          const y2 = 140 + RADIUS * Math.sin(endAngle)

          const largeArc = sliceAngle > 180 ? 1 : 0

          const pathData = [
            `M 140 140`,
            `L ${x1} ${y1}`,
            `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z',
          ].join(' ')

          const isHovered = hoveredItem === item.name
          const opacity = !hoveredItem || isHovered ? 1 : 0.4

          currentAngle += sliceAngle

          return (
            <g key={idx} className="cursor-pointer transition-opacity" opacity={opacity}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}>
              <path
                d={pathData}
                fill={item.color || COLORS[idx % COLORS.length]}
                stroke="white"
                strokeWidth="2"
                className="transition-opacity"
              />
            </g>
          )
        })}
      </svg>

      <div className="text-center">
        <div className="text-2xl font-bold">
          {hoveredItem
            ? data.find(d => d.name === hoveredItem)?.[viewType as keyof typeof data[0]] || 0
            : total}
        </div>
        <div className="text-sm text-muted-foreground">
          {hoveredItem || centerLabel}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}
            />
            <span className="text-sm">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

interface HoldingsTabProps {
  onStockClick?: (symbol: string) => void
}

export default function HoldingsTab({ onStockClick }: HoldingsTabProps) {
  // ✅ Get transactions from Portfolio Context instead of calling storage directly
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
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, WatchlistPriceData>>({})
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false)
  const [isAddingTicker, setIsAddingTicker] = useState(false)
  const [directTickerInput, setDirectTickerInput] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [tickerSearchResults, setTickerSearchResults] = useState<StockSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const loadTransactionsAndCalculateHoldings = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }

      // ✅ USE CONTEXT TRANSACTIONS instead of calling getTransactionsFromStorage()
      const txns: Transaction[] = contextTransactions || []

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

      if (!silent) {
        console.log("✅ Transactions loaded:", txns.length)
      }

      txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setTransactions(txns)

      const bySymbol = calculateHoldings(txns)
      let brokers = new Set<string>()
      let maxValue = 0

      const holdingsWithPriceData = await buildHoldingsWithPrices(bySymbol)

      holdingsWithPriceData.forEach(h => {
        if (h.broker) brokers.add(h.broker)
        maxValue = Math.max(maxValue, h.marketValue)
      })

      const brokersList = Array.from(brokers).sort()
      const currentHigh = Math.max(...holdingsWithPriceData.map(h => h.marketValue))

      setAllHoldings(holdingsWithPriceData)
      setAvailableBrokers(brokersList)
      setAllTimeHigh(currentHigh)
      setIsLoading(false)

      setCachedHoldings({
        holdings: holdingsWithPriceData,
        transactions: txns,
        brokers: brokersList,
        allTimeHigh: currentHigh,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('[holdings-tab] Error loading holdings:', error)
      setAllHoldings([])
      setTransactions([])
      setIsLoading(false)
    }
  }

  const loadWatchlist = async () => {
    try {
      const items = await getWatchlistFromStorage()
      setWatchlist(items)

      if (items.length === 0) return

      const cache = getWatchlistCache()
      if (cache && cache.data.length === items.length) {
        setWatchlistPrices(cache.priceData)
        console.log('⚡ Using cached watchlist prices')
        return
      }

      await fetchWatchlistPrices(items)
    } catch (error) {
      console.error('[holdings-tab] Error loading watchlist:', error)
      setWatchlist([])
    }
  }

  const fetchWatchlistPrices = async (items: WatchlistItem[]) => {
    setIsLoadingWatchlist(true)

    try {
      if (!Array.isArray(items) || items.length === 0) {
        setIsLoadingWatchlist(false)
        return
      }

      const symbols = items.map(item => item.symbol)
      const quotes = await getBatchStockQuotes(symbols)

      const priceData: Record<string, WatchlistPriceData> = {}

      Object.entries(quotes).forEach(([symbol, quote]) => {
        priceData[symbol] = {
          currentPrice: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          high52Week: quote.week52High,
          low52Week: quote.week52Low,
          dividendYield: quote.dividendYield || 0,
          marketCap: quote.marketCap || 0,
          peRatio: quote.peRatio || 0,
          volume: quote.volume || 0,
          lastUpdated: Date.now(),
        }
      })

      setWatchlistPrices(priceData)
      saveWatchlistCache(items, priceData)
    } catch (error) {
      console.error('[holdings-tab] Failed to fetch watchlist prices:', error)
    } finally {
      setIsLoadingWatchlist(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      const cached = await getCachedHoldings()

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
    loadWatchlist().catch(err => {
      console.error('[holdings-tab] Error loading watchlist:', err)
    })
  }, [])

  const handleRemoveFromWatchlist = async (symbol: string) => {
    if (confirm(`Remove ${symbol} from watchlist?`)) {
      await removeFromWatchlist(symbol)
      const updated = await getWatchlistFromStorage()
      setWatchlist(updated)
    }
  }

  const watchlistWithPrices = watchlist.map(item => ({
    ...item,
    ...watchlistPrices[item.symbol],
    priceChange: watchlistPrices[item.symbol]
      ? watchlistPrices[item.symbol].currentPrice - item.addedPrice
      : 0,
    priceChangePercent: watchlistPrices[item.symbol] && item.addedPrice > 0
      ? ((watchlistPrices[item.symbol].currentPrice - item.addedPrice) / item.addedPrice) * 100
      : 0
  }))

  const filteredHoldings = selectedBroker === "All"
    ? allHoldings
    : allHoldings.filter(h => h.broker === selectedBroker)

  const sortedHoldings = filteredHoldings.sort((a, b) => {
    switch (sortBy) {
      case "value-high":
        return b.marketValue - a.marketValue
      case "value-low":
        return a.marketValue - b.marketValue
      case "gain-high":
        return (b.gainPercent || 0) - (a.gainPercent || 0)
      case "gain-low":
        return (a.gainPercent || 0) - (b.gainPercent || 0)
      case "alphabetical":
        return a.symbol.localeCompare(b.symbol)
      case "allocation":
      default:
        return b.marketValue - a.marketValue
    }
  })

  useEffect(() => {
    setHoldings(sortedHoldings)
  }, [sortBy, selectedBroker, allHoldings, sortedHoldings])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (allHoldings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No holdings data available. Upload transactions to get started.</p>
        </CardContent>
      </Card>
    )
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalGain = holdings.reduce((sum, h) => sum + (h.gain || 0), 0)

  const chartData = holdings.map((holding, idx) => ({
    name: holding.symbol,
    value: holding.marketValue,
    color: COLORS[idx % COLORS.length],
    marketValue: holding.marketValue,
    costBasis: holding.costBasis,
    gain: holding.gain,
    gainPercent: holding.gainPercent,
  }))

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveHoldingsDonut data={chartData} title="Holdings" viewType={pieChartView} />
                <div className="flex gap-2 mt-4 justify-center flex-wrap">
                  {(['marketValue', 'cost', 'gain', 'loss'] as const).map(view => (
                    <Button
                      key={view}
                      variant={pieChartView === view ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPieChartView(view)}
                      className="capitalize"
                    >
                      {view === 'marketValue' ? 'Market Value' : view === 'cost' ? 'Cost Basis' : view === 'gain' ? 'Gains' : 'Losses'}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-3xl font-bold">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Gain</p>
                  <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalGain.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gain %</p>
                  <p className={`text-2xl font-bold ${(totalGain / (totalValue - totalGain)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((totalGain / (totalValue - totalGain)) * 100).toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Holdings</CardTitle>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="allocation">By Allocation</option>
                <option value="value-high">Value High to Low</option>
                <option value="value-low">Value Low to High</option>
                <option value="gain-high">Gain High to Low</option>
                <option value="gain-low">Gain Low to High</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Avg Cost</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Market Value</TableHead>
                    <TableHead>Gain/Loss</TableHead>
                    <TableHead>Gain %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => (
                    <TableRow key={holding.symbol}>
                      <TableCell 
                        className="font-bold cursor-pointer hover:underline" 
                        onClick={() => onStockClick?.(holding.symbol)}
                      >
                        {holding.symbol}
                      </TableCell>
                      <TableCell>{holding.quantity.toFixed(4)}</TableCell>
                      <TableCell>${holding.avgCost.toFixed(2)}</TableCell>
                      <TableCell>${holding.currentPrice.toFixed(2)}</TableCell>
                      <TableCell>${holding.marketValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${holding.gain.toFixed(2)}
                      </TableCell>
                      <TableCell className={holding.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {holding.gainPercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-2" /> Add Stock</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add to Watchlist</DialogTitle>
                    <DialogDescription>Search for a stock to add to your watchlist</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter ticker symbol (e.g., AAPL)"
                      value={directTickerInput}
                      onChange={(e) => setDirectTickerInput(e.target.value)}
                    />
                    <Button 
                      disabled={isAddingTicker || !directTickerInput}
                      onClick={() => {
                        // Add to watchlist logic
                        setDirectTickerInput("")
                        setIsAddDialogOpen(false)
                      }}
                    >
                      {isAddingTicker ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {watchlistWithPrices.length === 0 ? (
                <p className="text-muted-foreground">No items in watchlist</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Change %</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchlistWithPrices.map((item) => (
                      <TableRow key={item.symbol}>
                        <TableCell className="font-bold">{item.symbol}</TableCell>
                        <TableCell>${item.currentPrice?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell className={item.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${item.priceChange?.toFixed(2) || 'N/A'}
                        </TableCell>
                        <TableCell className={item.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.priceChangePercent?.toFixed(2) || 'N/A'}%
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRemoveFromWatchlist(item.symbol)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <HoldingsAIInsight holdings={holdings} transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
