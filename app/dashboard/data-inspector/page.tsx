"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, TrendingUp, TrendingDown, Activity, Target, Shield, DollarSign, Brain, Database, Trash2, Info, CircleDollarSign } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import { calculateAllReturns } from "@/lib/return-calculator"
import { calculateAndFetchHoldings, type Holding } from "@/lib/holdings-calculator"


// ==================== CACHE HELPERS ====================

const CACHE_KEY = 'dataInspectorCache'
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours

interface CachedData {
  portfolioData: any
  timestamp: number
  transactionCount: number
}

const getCachedData = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const data: CachedData = JSON.parse(cached)
    const age = Date.now() - data.timestamp
    
    const currentTxns = getTransactionsFromStorage()
    if (data.transactionCount !== currentTxns.length) {
      console.log('🔄 Transaction count changed, invalidating cache')
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    if (age < CACHE_DURATION) {
      return data
    }
    return null
  } catch {
    return null
  }
}

const setCachedData = (portfolioData: any): void => {
  try {
    const txns = getTransactionsFromStorage()
    const cacheData: CachedData = {
      portfolioData,
      transactionCount: txns.length,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Cache error:', error)
  }
}

const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY)
    console.log('🗑️ Cache cleared')
  } catch (error) {
    console.error('Clear cache error:', error)
  }
}

// ==================== CALCULATION HELPERS ====================

const calculateTaxStatus = (purchaseDate: string) => {
  const bought = new Date(purchaseDate)
  const now = new Date()
  const monthsHeld = (now.getTime() - bought.getTime()) / (1000 * 60 * 60 * 24 * 30)
  
  return {
    monthsHeld: Math.floor(monthsHeld),
    isLongTerm: monthsHeld >= 12,
    status: monthsHeld >= 12 ? 'Long-term' : 'Short-term',
    taxRate: monthsHeld >= 12 ? 15 : 37,
    color: monthsHeld >= 12 ? 'text-green-600' : 'text-red-600'
  }
}

const calculateBehaviorMetrics = (transactions: any[]) => {
  const buyTxns = transactions.filter(t => t.type === 'BUY')
  const sellTxns = transactions.filter(t => t.type === 'SELL')
  
  let totalHoldingDays = 0
  let holdingCount = 0
  
  sellTxns.forEach(sell => {
    const buyTxn = buyTxns.find(b => b.symbol === sell.symbol && new Date(b.date) < new Date(sell.date))
    if (buyTxn) {
      const days = (new Date(sell.date).getTime() - new Date(buyTxn.date).getTime()) / (1000 * 60 * 60 * 24)
      totalHoldingDays += days
      holdingCount++
    }
  })
  
  const avgHoldingDays = holdingCount > 0 ? Math.floor(totalHoldingDays / holdingCount) : 0
  
  let wins = 0
  sellTxns.forEach(sell => {
    if ((sell.price || 0) > (sell.avgCost || 0)) {
      wins++
    }
  })
  
  const winRate = sellTxns.length > 0 ? (wins / sellTxns.length) * 100 : 0
  
  return {
    totalTrades: transactions.length,
    buyCount: buyTxns.length,
    sellCount: sellTxns.length,
    avgHoldingDays,
    avgHoldingPeriod: avgHoldingDays > 0 ? `${avgHoldingDays} days` : 'N/A',
    winRate: winRate.toFixed(1),
    tradesThisYear: transactions.filter(t => 
      new Date(t.date).getFullYear() === new Date().getFullYear()
    ).length
  }
}

// ==================== DIVIDEND HELPERS ====================

interface DividendTransaction {
  date: string
  ticker: string
  transCode: string
  dividendAmount: number
  sharesEligible: number
  divPerShare: number
  status: 'Confirmed' | 'Estimated'
}

const getDividendTransactions = (transactions: any[], holdings: any[] = []): DividendTransaction[] => {
  if (!transactions || transactions.length === 0) {
    // Silently return empty array - this is expected during initial load
    return []
  }

  console.log('[v0] Total transactions:', transactions.length)
  console.log('[v0] Holdings available:', holdings.length)

  // ✅ Step 1: Check for explicit DIVIDEND type transactions (from CSV import)
  const explicitDividends = transactions.filter(t => t.type === 'DIVIDEND')
  console.log(`[v0] Explicit DIVIDEND transactions found: ${explicitDividends.length}`)

  if (explicitDividends.length > 0) {
    console.log('[v0] Using explicit dividend transactions')
    
    const dividendsWithShares = explicitDividends.filter(t => {
      const shares = parseFloat(t.shares || 0)
      return shares > 0
    })

    const result = dividendsWithShares.map(t => {
      const txnYear = new Date(t.date).getFullYear()
      const currentYear = new Date().getFullYear()
      const status = txnYear < currentYear ? 'Confirmed' : 'Upcoming'
      
      return {
        date: t.date,
        ticker: t.symbol,
        transCode: 'CDIV',
        dividendAmount: t.total || 0,
        sharesEligible: t.shares || 0,
        divPerShare: t.price || 0,
        status: status as 'Confirmed' | 'Estimated'
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const totalDiv = result.reduce((sum, d) => sum + d.dividendAmount, 0)
    console.log(`💰 Total explicit dividends: $${totalDiv.toFixed(2)}`)
    return result
  }

  // ✅ Step 2: Calculate from current holdings with dividend yields
  console.log('[v0] Calculating from current holdings with dividend yields...')

  if (!holdings || holdings.length === 0) {
    console.log('[v0] ⚠️  No holdings data available')
    return []
  }

  // Filter holdings that have positive shares and dividend yield
  const holdingsWithDividends = holdings.filter(h => {
    const shares = parseFloat(h.shares || 0)
    const yield_ = parseFloat(h.dividendYield || 0)
    return shares > 0 && yield_ > 0
  })

  console.log(`[v0] Holdings with dividends: ${holdingsWithDividends.length}`)

  if (holdingsWithDividends.length === 0) {
    console.log('[v0] No holdings with positive shares and dividend yield')
    return []
  }

  // Build map of all BUY transactions by symbol (to handle multiple purchases)
  const buyTransactionsBySymbol: Record<string, any[]> = {}
  transactions
    .filter(t => t.type === 'BUY')
    .forEach(t => {
      if (!buyTransactionsBySymbol[t.symbol]) {
        buyTransactionsBySymbol[t.symbol] = []
      }
      buyTransactionsBySymbol[t.symbol].push(t)
    })

  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const dividendTransactions: DividendTransaction[] = []

  holdingsWithDividends.forEach(holding => {
    const shares = parseFloat(holding.shares)
    const currentPrice = parseFloat(holding.currentPrice || 0) // Use current share price
    const dividendYieldPercent = parseFloat(holding.dividendYield) // 5.11 format
    const dividendYield = dividendYieldPercent / 100 // Convert to decimal: 0.0511
    
    // Calculate annual dividend per share: current price × yield
    const divPerShare = currentPrice * dividendYield
    const annualDividend = divPerShare * shares

    console.log(`[v0] ${holding.symbol}: ${shares} shares @ $${currentPrice}/share, yield ${dividendYieldPercent}% = $${divPerShare.toFixed(4)}/share = $${annualDividend.toFixed(2)}/year`)

    // Get all BUY transactions for this stock
    const buyTransactions = buyTransactionsBySymbol[holding.symbol] || []
    
    // Process each BUY transaction separately to handle multiple purchases
    buyTransactions.forEach(buyTx => {
      const purchaseDate = new Date(buyTx.date)
      const purchaseYear = purchaseDate.getFullYear()
      const txnShares = parseFloat(buyTx.shares)

      // Use the holding's dividend per share (based on current price)
      const txnDivPerShare = divPerShare
      const txnAnnualDividend = txnDivPerShare * txnShares

      // ✅ DIVIDEND RECEIVED: Current year (with pro-rating if bought this year)
      if (purchaseYear < currentYear) {
        // Bought before current year - full year dividend
        dividendTransactions.push({
          date: `${currentYear}-01-01`,
          ticker: holding.symbol,
          transCode: 'CDIV',
          dividendAmount: txnAnnualDividend,
          sharesEligible: txnShares,
          divPerShare: txnDivPerShare,
          status: 'Confirmed'
        })
      } else if (purchaseYear === currentYear) {
        // Bought this year - pro-rate from purchase date to year end
        const daysPurchased = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysInYear = 365
        const proRatedDividend = (txnAnnualDividend * daysPurchased) / daysInYear
        
        dividendTransactions.push({
          date: buyTx.date,
          ticker: holding.symbol,
          transCode: 'CDIV',
          dividendAmount: proRatedDividend,
          sharesEligible: txnShares,
          divPerShare: txnDivPerShare,
          status: 'Confirmed'
        })
      }

      // ✅ UPCOMING DIVIDENDS: Next year (full year)
      if (purchaseYear <= currentYear) { // Only add if bought by current year
        dividendTransactions.push({
          date: `${nextYear}-01-01`,
          ticker: holding.symbol,
          transCode: 'CDIV',
          dividendAmount: txnAnnualDividend,
          sharesEligible: txnShares,
          divPerShare: txnDivPerShare,
          status: 'Estimated'
        })
      }
    })
  })

  // Sort by date descending
  dividendTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalDiv = dividendTransactions.reduce((sum, d) => sum + d.dividendAmount, 0)
  console.log(`💰 Total calculated dividends: $${totalDiv.toFixed(2)}`)

  return dividendTransactions
}





const calculateDividendSummary = (dividends: DividendTransaction[]) => {
  const totalAmount = dividends.reduce((sum, d) => sum + d.dividendAmount, 0)
  const uniqueStocks = new Set(dividends.map(d => d.ticker)).size
  const confirmedCount = dividends.filter(d => d.status === 'Confirmed').length
  
  // Calculate by stock
  const byStock: Record<string, number> = {}
  dividends.forEach(d => {
    byStock[d.ticker] = (byStock[d.ticker] || 0) + d.dividendAmount
  })
  
  // Calculate by month
  const byMonth: Record<string, number> = {}
  dividends.forEach(d => {
    const month = d.date.substring(0, 7) // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + d.dividendAmount
  })
  
  return {
    totalAmount,
    uniqueStocks,
    confirmedCount,
    totalCount: dividends.length,
    byStock,
    byMonth
  }
}

// ==================== MAIN COMPONENT ====================

export default function DataInspectorPage() {
  const portfolioContext = usePortfolio()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("holdings")
  const [dataVersion, setDataVersion] = useState(0)
  const [returnType, setReturnType] = useState<'simple' | 'twr' | 'mwr'>('simple')
  const [independentHoldings, setIndependentHoldings] = useState<Holding[]>([])
  const [holdingsLoaded, setHoldingsLoaded] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${(value || 0).toFixed(2)}%`
  }

  const handleRefresh = () => {
    setIsLoading(true)
    clearCache()
    portfolioContext.refresh()
    setLastUpdate(new Date())
    setDataVersion(v => v + 1)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleClearCache = () => {
    clearCache()
    window.location.reload()
  }

  // Monitor localStorage changes
  useEffect(() => {
    let previousTxnCount = getTransactionsFromStorage().length

    const checkTransactions = setInterval(() => {
      const currentTxns = getTransactionsFromStorage()
      const currentCount = currentTxns.length

      if (currentCount !== previousTxnCount) {
        console.log('🔄 Transaction change detected:', previousTxnCount, '��', currentCount)
        previousTxnCount = currentCount
        clearCache()
        portfolioContext.refresh()
        setDataVersion(v => v + 1)
        setLastUpdate(new Date())
      }
    }, 500)

    return () => clearInterval(checkTransactions)
  }, [portfolioContext])

  // ✅ NEW: Load holdings independently to ensure returns data is available
  useEffect(() => {
    const loadHoldings = async () => {
      try {
        const txns = getTransactionsFromStorage()
        if (txns.length === 0) {
          setHoldingsLoaded(true)
          return
        }
        
        setIsLoading(true)
        const holdings = await calculateAndFetchHoldings(txns)
        console.log('[v0] Data Inspector - Loaded independent holdings:', holdings.length)
        if (holdings.length > 0) {
          console.log('[v0] Sample holding with returns:', holdings[0]?.returns)
        }
        setIndependentHoldings(holdings)
        setHoldingsLoaded(true)
      } catch (error) {
        console.error('[v0] Failed to load independent holdings:', error)
        // Still set loaded to true so the page renders with fallback data
        setHoldingsLoaded(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHoldings()
  }, [dataVersion])

  // Get transactions
  const transactions = getTransactionsFromStorage()
  const behaviorMetrics = calculateBehaviorMetrics(transactions)
  
  // ✅ Use independent holdings if available, otherwise fall back to context
  const holdingsToUse = holdingsLoaded && independentHoldings.length > 0 ? independentHoldings : (portfolioContext.holdings || [])
  
  // ✅ Calculate dividends - pass holdings data
  const dividendTransactions = getDividendTransactions(transactions, holdingsToUse)
  const dividendSummary = calculateDividendSummary(dividendTransactions)

  // Calculate all returns
  const allReturns = calculateAllReturns(holdingsToUse)
  
  // Select return based on toggle
  let portfolioReturn = allReturns.simple
  if (returnType === 'twr') portfolioReturn = allReturns.twr
  if (returnType === 'mwr') portfolioReturn = allReturns.mwr

  // Calculate today's change (mock - replace with real data)
  const todayChangePercent = 1.5
  const todayChange = portfolioContext.portfolioValue * (todayChangePercent / 100)

  // Risk metrics (mock - replace with real calculations)
  const riskMetrics = {
    beta: 0.92,
    sharpe: 1.24,
    sortino: 1.58,
    maxDrawdown: -18.5,
    volatility: 22.3,
    stdDev: 15.7,
    var95: -5.2
  }

  // Get benchmark data
  const benchmarks = portfolioContext.benchmarks?.allBenchmarks || {}

  return (
    <div className="min-h-screen pb-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Inspector</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete portfolio analytics with real Finnhub + Polygon data • {transactions.length} transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleClearCache} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()} • Version: {dataVersion}
          </p>
        )}

        {/* Empty State */}
        {transactions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with your transactions to see analytics
              </p>
              <Button onClick={() => window.location.href = '/transactions'}>
                Go to Transactions
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {transactions.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(portfolioContext.portfolioValue)}
                  </div>
                  <p className={`text-xs mt-1 ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(portfolioReturn)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Gain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${portfolioContext.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(portfolioContext.totalGain || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost: {formatCurrency(portfolioContext.totalCost)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Today's Change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${todayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(todayChange)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercent(todayChangePercent)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {holdingsToUse?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transactions.length} transactions
                  </p>
                </CardContent>
              </Card>
              
              {/* ✅ NEW: Total Dividends Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" />
                    Dividends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dividendSummary.totalAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dividendSummary.confirmedCount} payments, {dividendSummary.uniqueStocks} stocks
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="dividends">Dividends</TabsTrigger>
                <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="tax">Tax</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              {/* Holdings Tab */}
              <TabsContent value="holdings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Holdings Detail with Returns & Benchmarks</CardTitle>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Real-time data: Stock returns (1D to 1Y) + Benchmark comparisons
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium sticky left-0 bg-muted z-10 border-r">Symbol</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Shares</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Avg Cost</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Current</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Value</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Gain $</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Gain %</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">1D</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">1W</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">1M</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">3M</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">6M</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">1Y</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">52W High</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">52W Low</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Div %</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs SPY</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs QQQ</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs DIA</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs IWM</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs VTI</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs VOO</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">vs VXUS</th>
                            <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Sector</th>
                            <th className="text-right py-3 px-4 font-medium whitespace-nowrap">Allocation</th>
                          </tr>
                        </thead>
                        <tbody className="bg-background">
                          {holdingsToUse?.length === 0 ? (
                            <tr>
                              <td colSpan={25} className="text-center py-8 text-muted-foreground">
                                No holdings yet
                              </td>
                            </tr>
                          ) : (
                            holdingsToUse?.map((holding: any) => {
                              const gainPercent = holding.totalCost > 0 
                                ? ((holding.marketValue - holding.totalCost) / holding.totalCost) * 100 
                                : 0
                              
                              const returns = holding.returns || {}
                              const stock1YReturn = returns['1Y'] || 0
                              const week52High = holding.week52High || 0
                              const week52Low = holding.week52Low || 0
                              const dividendYield = holding.dividendYield || 0
                              
                              // Calculate vs benchmarks
                              const vsSPY = stock1YReturn - (benchmarks.spy?.return || 0)
                              const vsQQQ = stock1YReturn - (benchmarks.qqq?.return || 0)
                              const vsDIA = stock1YReturn - (benchmarks.dia?.return || 0)
                              const vsIWM = stock1YReturn - (benchmarks.iwm?.return || 0)
                              const vsVTI = stock1YReturn - (benchmarks.vti?.return || 0)
                              const vsVOO = stock1YReturn - (benchmarks.voo?.return || 0)
                              const vsVXUS = stock1YReturn - (benchmarks.vxus?.return || 0)
                              
                              return (
                                <tr key={holding.symbol} className="border-b hover:bg-muted/30 transition-colors">
                                  <td className="py-3 px-4 font-medium sticky left-0 bg-background z-10 border-r">{holding.symbol}</td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">{holding.shares?.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">${holding.avgCost?.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">${holding.currentPrice?.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right font-medium whitespace-nowrap">{formatCurrency(holding.marketValue)}</td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${holding.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(holding.totalGain || 0)}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercent(gainPercent)}
                                  </td>
                                  <td className={`py-3 px-4 text-right whitespace-nowrap ${(returns['1D'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {returns['1D'] ? formatPercent(returns['1D']) : 'N/A'}
                                  </td>
                                  <td className={`py-3 px-4 text-right whitespace-nowrap ${(returns['1W'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {returns['1W'] ? formatPercent(returns['1W']) : 'N/A'}
                                  </td>
                                  <td className={`py-3 px-4 text-right whitespace-nowrap ${(returns['1M'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {returns['1M'] ? formatPercent(returns['1M']) : 'N/A'}
                                  </td>
                                  <td className={`py-3 px-4 text-right whitespace-nowrap ${(returns['3M'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {returns['3M'] ? formatPercent(returns['3M']) : 'N/A'}
                                  </td>
                                  <td className={`py-3 px-4 text-right whitespace-nowrap ${(returns['6M'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {returns['6M'] ? formatPercent(returns['6M']) : 'N/A'}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${stock1YReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stock1YReturn ? formatPercent(stock1YReturn) : 'N/A'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-blue-600 whitespace-nowrap">
                                    {week52High > 0 ? `$${week52High.toFixed(2)}` : 'N/A'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-orange-600 whitespace-nowrap">
                                    {week52Low > 0 ? `$${week52Low.toFixed(2)}` : 'N/A'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-600 font-medium whitespace-nowrap">
                                    {dividendYield > 0 ? `${dividendYield.toFixed(2)}%` : 'N/A'}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsSPY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsSPY >= 0 ? '+' : ''}{vsSPY.toFixed(1)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsQQQ >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsQQQ >= 0 ? '+' : ''}{vsQQQ.toFixed(1)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsDIA >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsDIA >= 0 ? '+' : ''}{vsDIA.toFixed(1)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsIWM >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsIWM >= 0 ? '+' : ''}{vsIWM.toFixed(1)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsVTI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsVTI >= 0 ? '+' : ''}{vsVTI.toFixed(1)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsVOO >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsVOO >= 0 ? '+' : ''}{vsVOO.toFixed(1)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${vsVXUS >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {vsVXUS >= 0 ? '+' : ''}{vsVXUS.toFixed(1)}%
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">{holding.sector || 'N/A'}</td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">{holding.allocation?.toFixed(2)}%</td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ✅ NEW: Dividends Tab */}
              <TabsContent value="dividends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CircleDollarSign className="h-5 w-5 text-green-600" />
                      Dividend Income Analysis
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      All dividend payments from CSV (Trans Code: CDIV)
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Received</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dividendSummary.totalAmount)}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {dividendSummary.totalCount}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Dividend Stocks</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {dividendSummary.uniqueStocks}
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Avg per Payment</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(dividendSummary.totalAmount / (dividendSummary.totalCount || 1))}
                        </p>
                      </div>
                    </div>

                    {/* Dividend Transactions Table */}
                    {dividendTransactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-muted/50">
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium">Date Received</th>
                              <th className="text-left py-3 px-4 font-medium">Ticker</th>
                              <th className="text-center py-3 px-4 font-medium">Status</th>
                              <th className="text-right py-3 px-4 font-medium">Dividend Amount</th>
                              <th className="text-right py-3 px-4 font-medium">Shares Eligible</th>
                              <th className="text-right py-3 px-4 font-medium">Div per Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dividendTransactions.map((div, idx) => (
                              <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4">{new Date(div.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}</td>
                                <td className="py-3 px-4 font-medium">{div.ticker}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    div.status === 'Confirmed' 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  }`}>
                                    {div.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-green-600">
                                  {formatCurrency(div.dividendAmount)}
                                </td>
                                <td className="py-3 px-4 text-right">{div.sharesEligible.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right">${div.divPerShare.toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted/50 border-t-2">
                            <tr>
                              <td colSpan={3} className="py-3 px-4 font-bold text-lg">TOTAL</td>
                              <td className="py-3 px-4 text-right font-bold text-green-600 text-lg">
                                {formatCurrency(dividendSummary.totalAmount)}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CircleDollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Dividend Data Found</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Your CSV should contain DIVIDEND transaction type entries with dividend amounts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Currently have {transactions.length} transaction(s), but none are dividend payments
                        </p>
                      </div>
                    )}

                    {/* By Stock Breakdown */}
                    {dividendTransactions.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Dividends by Stock</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(dividendSummary.byStock)
                            .sort(([, a], [, b]) => b - a)
                            .map(([ticker, amount]) => (
                              <div key={ticker} className="p-4 bg-secondary/30 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-lg">{ticker}</span>
                                  <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(amount)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {((amount / dividendSummary.totalAmount) * 100).toFixed(1)}% of total
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Benchmarks */}
              <TabsContent value="benchmarks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Portfolio vs Market Benchmarks</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Compare using different return calculation methods
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant={returnType === 'simple' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setReturnType('simple')}
                        >
                          Simple Return
                        </Button>
                        <Button 
                          variant={returnType === 'twr' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setReturnType('twr')}
                        >
                          TWR
                        </Button>
                        <Button 
                          variant={returnType === 'mwr' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setReturnType('mwr')}
                        >
                          MWR/XIRR
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex gap-2">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        {returnType === 'simple' && (
                          <>
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                              Simple Return: (Current Value - Cost) / Cost
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Most intuitive but ignores timing of trades
                            </p>
                          </>
                        )}
                        {returnType === 'twr' && (
                          <>
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                              Time-Weighted Return: Removes cash flow timing effects
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Best for comparing to benchmarks - shows investment skill
                            </p>
                          </>
                        )}
                        {returnType === 'mwr' && (
                          <>
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                              Money-Weighted Return (MWR) = XIRR
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Accounts for timing and size of cash flows - your actual experience
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-semibold mb-3">Your Returns (All Methods)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className={`p-3 bg-background rounded ${returnType === 'simple' ? 'ring-2 ring-primary' : ''}`}>
                          <p className="text-xs text-muted-foreground">Simple Return</p>
                          <p className={`text-2xl font-bold ${allReturns.simple >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(allReturns.simple)}
                          </p>
                        </div>
                        <div className={`p-3 bg-background rounded ${returnType === 'twr' ? 'ring-2 ring-primary' : ''}`}>
                          <p className="text-xs text-muted-foreground">TWR (Time-Weighted)</p>
                          <p className={`text-2xl font-bold ${allReturns.twr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(allReturns.twr)}
                          </p>
                        </div>
                        <div className={`p-3 bg-background rounded ${returnType === 'mwr' ? 'ring-2 ring-primary' : ''}`}>
                          <p className="text-xs text-muted-foreground">MWR/XIRR (Money-Weighted)</p>
                          <p className={`text-2xl font-bold ${allReturns.mwr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(allReturns.mwr)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(benchmarks).map(([key, benchmark]: [string, any]) => (
                        <Card key={key} className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center justify-between">
                              <span>{benchmark.name}</span>
                              <span className="text-sm font-normal text-muted-foreground">
                                ${benchmark.price?.toFixed(2) || '---'}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Your Return</span>
                              <span className={`font-semibold ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(portfolioReturn)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Benchmark (1Y)</span>
                              <span className="font-semibold">
                                {formatPercent(benchmark.return || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-sm font-medium">Difference</span>
                              <span className={`font-bold ${(portfolioReturn - benchmark.return) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(portfolioReturn - benchmark.return) >= 0 ? '+' : ''}
                                {formatPercent(portfolioReturn - benchmark.return)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-secondary rounded-lg">
                      <h4 className="font-semibold mb-3">Performance Summary</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Active Method</p>
                          <p className="font-bold text-2xl">
                            {returnType === 'simple' && 'SIMPLE'}
                            {returnType === 'twr' && 'TWR'}
                            {returnType === 'mwr' && 'MWR/XIRR'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{allReturns.explanation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Benchmarks Beat</p>
                          <p className="font-semibold text-lg">
                            {Object.values(benchmarks).filter((b: any) => portfolioReturn > b.return).length} of {Object.keys(benchmarks).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">vs S&P 500</p>
                          <p className={`font-semibold text-lg ${(portfolioReturn - (benchmarks.spy?.return || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(portfolioReturn - (benchmarks.spy?.return || 0)) >= 0 ? '✓ Winning' : '✗ Losing'} by {Math.abs(portfolioReturn - (benchmarks.spy?.return || 0)).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Risk */}
              <TabsContent value="risk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Risk Metrics
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Portfolio risk analysis and volatility metrics
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Beta</p>
                        <p className="text-3xl font-bold">{riskMetrics.beta}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {riskMetrics.beta < 1 ? 'Less volatile than market' : 'More volatile than market'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Sharpe Ratio</p>
                        <p className="text-3xl font-bold text-green-600">{riskMetrics.sharpe}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {riskMetrics.sharpe > 1 ? 'Good risk-adjusted return' : 'Below average'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Sortino Ratio</p>
                        <p className="text-3xl font-bold text-green-600">{riskMetrics.sortino}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Downside risk-adjusted return
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Max Drawdown</p>
                        <p className="text-3xl font-bold text-red-600">{riskMetrics.maxDrawdown}%</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Largest peak-to-trough decline
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Volatility (σ)</p>
                        <p className="text-3xl font-bold">{riskMetrics.volatility}%</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Annual standard deviation
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">VaR (95%)</p>
                        <p className="text-3xl font-bold text-orange-600">{riskMetrics.var95}%</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Value at Risk (1 day, 95% confidence)
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Risk Assessment
                      </h4>
                      <ul className="text-sm space-y-1 text-blue-900 dark:text-blue-100">
                        <li>• Beta below 1.0 indicates lower volatility than S&P 500</li>
                        <li>• Sharpe ratio above 1.0 is considered good</li>
                        <li>• Max drawdown shows worst historical loss</li>
                        <li>• VaR estimates maximum expected loss on bad days</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 5: Tax */}
              <TabsContent value="tax" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Tax Optimization
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Capital gains tax status and holding periods
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium">Symbol</th>
                            <th className="text-right py-2 px-3 font-medium">Purchase Date</th>
                            <th className="text-right py-2 px-3 font-medium">Months Held</th>
                            <th className="text-left py-2 px-3 font-medium">Tax Status</th>
                            <th className="text-right py-2 px-3 font-medium">Tax Rate</th>
                            <th className="text-right py-2 px-3 font-medium">Unrealized Gain</th>
                            <th className="text-right py-2 px-3 font-medium">Est. Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdingsToUse?.map((holding: any) => {
                            const firstBuy = transactions
                              .filter(t => t.symbol === holding.symbol && t.type === 'BUY')
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                            
                            if (!firstBuy) return null
                            
                            const taxStatus = calculateTaxStatus(firstBuy.date)
                            const estimatedTax = holding.totalGain > 0 
                              ? holding.totalGain * (taxStatus.taxRate / 100)
                              : 0
                            
                            return (
                              <tr key={holding.symbol} className="border-b hover:bg-secondary/50">
                                <td className="py-2 px-3 font-medium">{holding.symbol}</td>
                                <td className="py-2 px-3 text-right">
                                  {new Date(firstBuy.date).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 text-right">{taxStatus.monthsHeld}</td>
                                <td className={`py-2 px-3 font-medium ${taxStatus.color}`}>
                                  {taxStatus.status}
                                </td>
                                <td className="py-2 px-3 text-right">{taxStatus.taxRate}%</td>
                                <td className={`py-2 px-3 text-right font-medium ${holding.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(holding.totalGain)}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-orange-600">
                                  {formatCurrency(estimatedTax)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 mx-6 mb-6 grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                          Long-term Holdings (15% tax)
                        </h4>
                        <p className="text-2xl font-bold text-green-600">
                          {holdingsToUse?.filter((h: any) => {
                            const firstBuy = transactions
                              .filter(t => t.symbol === h.symbol && t.type === 'BUY')
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                            return firstBuy && calculateTaxStatus(firstBuy.date).isLongTerm
                          }).length || 0}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Held more than 12 months
                        </p>
                      </div>
                      
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Short-term Holdings (37% tax)
                        </h4>
                        <p className="text-2xl font-bold text-red-600">
                          {holdingsToUse?.filter((h: any) => {
                            const firstBuy = transactions
                              .filter(t => t.symbol === h.symbol && t.type === 'BUY')
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                            return firstBuy && !calculateTaxStatus(firstBuy.date).isLongTerm
                          }).length || 0}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          Held less than 12 months
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 6: Behavior */}
              <TabsContent value="behavior" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Trading Behavior
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your trading patterns and investment behavior
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                        <p className="text-3xl font-bold">{behaviorMetrics.totalTrades}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {behaviorMetrics.buyCount} buys, {behaviorMetrics.sellCount} sells
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Avg Holding Period</p>
                        <p className="text-3xl font-bold">{behaviorMetrics.avgHoldingPeriod}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {behaviorMetrics.avgHoldingDays > 365 
                            ? 'Long-term investor' 
                            : behaviorMetrics.avgHoldingDays > 90 
                            ? 'Medium-term trader' 
                            : 'Short-term trader'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                        <p className={`text-3xl font-bold ${parseFloat(behaviorMetrics.winRate) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {behaviorMetrics.winRate}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Profitable trades / Total sells
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Trades This Year</p>
                        <p className="text-3xl font-bold text-blue-600">{behaviorMetrics.tradesThisYear}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Year-to-date activity
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Portfolio Turnover</p>
                        <p className="text-3xl font-bold">
                          {behaviorMetrics.sellCount > 0 
                            ? ((behaviorMetrics.sellCount / behaviorMetrics.buyCount) * 100).toFixed(0)
                            : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Sells relative to buys
                        </p>
                      </div>
                      
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Trading Style</p>
                        <p className="text-2xl font-bold">
                          {behaviorMetrics.avgHoldingDays > 365 
                            ? '📊 Buy & Hold' 
                            : behaviorMetrics.avgHoldingDays > 90 
                            ? '📈 Swing Trader' 
                            : '⚡ Day Trader'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Based on holding periods
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-900 dark:text-purple-100">
                        <Info className="h-5 w-5" />
                        Behavioral Insights
                      </h4>
                      <ul className="text-sm space-y-2 text-purple-900 dark:text-purple-100">
                        {behaviorMetrics.avgHoldingDays > 365 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold text-lg">✓</span>
                            <span>You're a patient long-term investor - excellent for tax efficiency (15% vs 37%) and compound growth</span>
                          </li>
                        )}
                        
                        {behaviorMetrics.avgHoldingDays < 365 && behaviorMetrics.avgHoldingDays > 90 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-lg">ℹ</span>
                            <span>Medium-term holding period - consider holding past 12 months for long-term capital gains tax benefits</span>
                          </li>
                        )}
                        
                        {parseFloat(behaviorMetrics.winRate) >= 60 && behaviorMetrics.sellCount > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold text-lg">✓</span>
                            <span>Strong win rate ({behaviorMetrics.winRate}%) indicates excellent stock selection and timing</span>
                          </li>
                        )}
                        
                        {parseFloat(behaviorMetrics.winRate) < 50 && behaviorMetrics.sellCount > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold text-lg">⚠</span>
                            <span>Win rate below 50% - review your selling strategy, consider holding winners longer and cutting losers faster</span>
                          </li>
                        )}
                        
                        {behaviorMetrics.sellCount === 0 && behaviorMetrics.buyCount > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-lg">ℹ</span>
                            <span>No sells yet - consider taking profits on big winners and rebalancing overweight positions</span>
                          </li>
                        )}
                        
                        {behaviorMetrics.avgHoldingDays < 30 && behaviorMetrics.sellCount > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 font-bold text-lg">⚠</span>
                            <span>Very short holding periods ({behaviorMetrics.avgHoldingDays} days avg) trigger high short-term capital gains taxes (37%)</span>
                          </li>
                        )}
                        
                        {behaviorMetrics.tradesThisYear > 50 && (
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold text-lg">⚠</span>
                            <span>High trading frequency ({behaviorMetrics.tradesThisYear} trades this year) - watch transaction costs and tax implications</span>
                          </li>
                        )}
                        
                        {holdingsToUse?.length === 1 && (
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold text-lg">⚠</span>
                            <span>Single stock portfolio - highly risky! Consider diversifying across 5-10 stocks in different sectors</span>
                          </li>
                        )}
                        
                        {holdingsToUse?.length >= 2 && holdingsToUse?.length <= 5 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold text-lg">✓</span>
                            <span>Focused portfolio ({holdingsToUse?.length} stocks) - easier to track but ensure you have sector diversification</span>
                          </li>
                        )}
                        
                        {holdingsToUse?.length > 10 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-lg">ℹ</span>
                            <span>Well-diversified portfolio ({holdingsToUse?.length} stocks) - good risk management but harder to outperform market</span>
                          </li>
                        )}
                        
                        {behaviorMetrics.tradesThisYear > 20 && behaviorMetrics.avgHoldingDays < 90 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-lg">ℹ</span>
                            <span>Active trading style - ensure your returns justify the time, taxes, and transaction costs</span>
                          </li>
                        )}
                        
                        {behaviorMetrics.totalTrades === 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-lg">ℹ</span>
                            <span>Upload your transaction history to see personalized behavioral insights and trading patterns</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 7: Raw Data */}
              <TabsContent value="raw" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Portfolio Data</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete JSON data structure for debugging
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/30 p-4 rounded-lg overflow-auto max-h-[600px]">
                      <pre className="text-xs">
                        {JSON.stringify({
                          summary: {
                            portfolioValue: portfolioContext.portfolioValue,
                            totalCost: portfolioContext.totalCost,
                            totalGain: portfolioContext.totalGain,
                            returns: allReturns,
                            holdingsCount: holdingsToUse?.length || 0,
                            transactionsCount: transactions.length
                          },
                          holdings: holdingsToUse,
                          benchmarks: benchmarks,
                          transactions: transactions,
                          dividends: {
                            summary: dividendSummary,
                            transactions: dividendTransactions
                          },
                          riskMetrics: riskMetrics,
                          behaviorMetrics: behaviorMetrics
                        }, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
