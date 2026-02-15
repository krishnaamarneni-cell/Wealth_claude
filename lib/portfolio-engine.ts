/**
 * PortfolioEngine - Centralized Portfolio Calculation Service
 * 
 * This service layer handles all portfolio calculations:
 * - Reads transaction data from localStorage
 * - Calculates holdings, performance, allocation, dividends, and trades
 * - Provides caching to avoid recalculation on every page load
 * - Exports clean functions for consumption by UI pages
 */

import { getTransactionsFromStorage as getTransactionsFromStorageUtil } from './transaction-storage'

interface Transaction {
  date: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'TAX' | 'INTEREST'
  shares: number
  price: number
  total: number
  broker: string
}

interface Holding {
  symbol: string
  shares: number
  avgCost: number
  totalCost: number
  marketValue: number
  currentPrice: number
  todayGain: number
  todayGainPercent: number
  totalGain: number
  totalGainPercent: number
  allocation: number
  sector: string
  industry: string
  country: string
  assetType: string
  broker: string
  splitAdjusted?: boolean
  purchases: Transaction[]
  sales: Transaction[]
}

interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  unrealizedGains: number
  realizedGains: number
  todayChange: number
  todayChangePercent: number
  dividends: number
  fees: number
}

interface AllocationData {
  sector: { [key: string]: number }
  industry: { [key: string]: number }
  assetType: { [key: string]: number }
  broker: { [key: string]: number }
}

interface PerformanceMetrics {
  dailyReturn: number
  weeklyReturn: number
  monthlyReturn: number
  yearlyReturn: number
  sharpeRatio: number
  maxDrawdown: number
}

interface DividendData {
  totalDividends: number
  dividendsBySymbol: { [key: string]: number }
  upcomingDividends: Array<{
    symbol: string
    exDate: string
    paymentDate: string
    amount: number
  }>
}

interface TradeAnalysis {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  bestTrade: { symbol: string; gain: number }
  worstTrade: { symbol: string; loss: number }
}

// Cache object to store calculated values
let calculationCache: any = {}
let lastCalculationTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Clear cache to force recalculation
 * Call this after transactions are added/modified
 */
export function clearCache() {
  calculationCache = {}
  lastCalculationTime = 0
}

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return Date.now() - lastCalculationTime < CACHE_DURATION
}

/**
 * Get all transactions from localStorage
 * Handles different field name variations (ticker/symbol, quantity/shares, Buy/BUY)
 */
function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  
  // Try standard localStorage first
 let stored = localStorage.getItem('portfolio_transactions')
  
  // If not found, check v0.dev chat storage
  if (!stored) {
    // Find the active chat key (usually chat:ls:XXX)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat:ls:')) {
        const chatData = localStorage.getItem(key)
        if (chatData) {
          try {
            const parsed = JSON.parse(chatData)
            // v0 stores as array of [key, value] tuples
            const transactionsEntry = parsed.find((item: any) => 
              Array.isArray(item) && item[0] === 'transactions'
            )
            if (transactionsEntry && transactionsEntry[1]) {
              stored = transactionsEntry[1]
              console.log('[v0] Found transactions in v0 storage:', key)
              break
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
    }
  }
  
  if (!stored) return []
  
  const rawTransactions = JSON.parse(stored)
  
  // Normalize transaction fields to match interface
  return rawTransactions.map((tx: any) => ({
    date: tx.date || '',
    symbol: tx.symbol || tx.ticker || '',  // Handle both "symbol" and "ticker"
    type: (tx.type || '').toUpperCase() as Transaction['type'],  // Normalize to uppercase
    shares: Number(tx.shares || tx.quantity || 0),  // Handle both "shares" and "quantity"
    price: Number(tx.price || 0),
    total: Number(tx.total || tx.amount || (tx.shares || tx.quantity || 0) * (tx.price || 0)),
    broker: tx.broker || 'Unknown'
  }))
}

/**
 * Get holdings based on transactions
 */
export function getHoldings(): Holding[] {
  if (isCacheValid() && calculationCache.holdings) {
    return calculationCache.holdings
  }

  const transactions = getTransactions()
  const holdingsMap: { [key: string]: Holding } = {}

  transactions.forEach((tx) => {
    if (!holdingsMap[tx.symbol]) {
      holdingsMap[tx.symbol] = {
        symbol: tx.symbol,
        shares: 0,
        avgCost: 0,
        totalCost: 0,
        marketValue: 0,
        currentPrice: 0,
        todayGain: 0,
        todayGainPercent: 0,
        totalGain: 0,
        totalGainPercent: 0,
        allocation: 0,
        sector: getSectorBySymbol(tx.symbol),
        industry: getIndustryBySymbol(tx.symbol),
        country: 'US',
        assetType: getAssetType(tx.symbol),
        broker: tx.broker,
        splitAdjusted: false,
        purchases: [],
        sales: []
      }
    }

    if (tx.type === 'BUY') {
      holdingsMap[tx.symbol].shares += tx.shares
      holdingsMap[tx.symbol].totalCost += tx.total
      holdingsMap[tx.symbol].purchases.push(tx)
    } else if (tx.type === 'SELL') {
      holdingsMap[tx.symbol].shares -= tx.shares
      holdingsMap[tx.symbol].totalCost -= tx.shares * (holdingsMap[tx.symbol].totalCost / (holdingsMap[tx.symbol].shares + tx.shares))
      holdingsMap[tx.symbol].sales.push(tx)
    }
  })

  // Convert to holdings array
  const holdings: Holding[] = Object.values(holdingsMap)
    .filter((h) => h.shares > 0)
    .map((h) => ({
      symbol: h.symbol,
      shares: h.shares,
      avgCost: h.totalCost / h.shares,
      totalCost: h.totalCost,
      marketValue: 0, // Will be updated with real prices
      currentPrice: 0,
      todayGain: 0,
      todayGainPercent: 0,
      totalGain: 0,
      totalGainPercent: 0,
      allocation: 0,
      sector: h.sector,
      industry: h.industry,
      country: 'US',
      assetType: h.assetType,
      broker: h.broker,
      splitAdjusted: h.splitAdjusted,
      purchases: h.purchases,
      sales: h.sales
    }))

  // DEBUG: Log holdings details
  console.log("🔍 Holdings Map:", Object.keys(holdingsMap).length, "symbols")
  console.log("🔍 First holding details:", holdingsMap[Object.keys(holdingsMap)[0]])
  console.log("🔍 Holdings array:", holdings.length, "holdings")
  if (holdings.length > 0) {
    console.log("🔍 First holding:", holdings[0])
    console.log("🔍 Sample totalCost:", holdings[0].totalCost)
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  console.log("🔍 Total portfolio value:", totalValue)

  calculationCache.holdings = holdings
  lastCalculationTime = Date.now()
  return holdings
}

/**
 * Get total portfolio value
 * Returns the current market value of all holdings
 * Reuses the working calculation from getPortfolioSummary()
 */
export function getPortfolioValue(): number {
  const summary = getPortfolioSummary()
  return summary.totalValue
}

/**
 * Calculate portfolio summary (total value, gains, allocation)
 */
export function getPortfolioSummary(): PortfolioSummary {
  if (isCacheValid() && calculationCache.portfolioSummary) {
    return calculationCache.portfolioSummary
  }

  const holdings = getHoldings()
  const transactions = getTransactions()

  console.log("🔧 ENGINE: getPortfolioSummary() called")
  console.log("🔧 ENGINE: getHoldings() returned:", holdings.length, "holdings")
  if (holdings.length > 0) {
    console.log("🔧 ENGINE: First holding:", holdings[0])
    console.log("🔧 ENGINE: First holding.totalCost:", holdings[0].totalCost)
  }
  console.log("🔧 ENGINE: getTransactions() returned:", transactions.length, "transactions")

  let totalCost = 0
  let totalGain = 0
  let unrealizedGains = 0
  let realizedGains = 0
  let totalDividends = 0
  let totalFees = 0

  // Calculate totals from holdings
  holdings.forEach((holding, index) => {
    console.log(`🔧 ENGINE: Adding holding[${index}] ${holding.symbol}: totalCost=${holding.totalCost}, totalGain=${holding.totalGain}`)
    totalCost += holding.totalCost
    unrealizedGains += holding.totalGain
    console.log(`🔧 ENGINE: Running totalCost=${totalCost}, unrealizedGains=${unrealizedGains}`)
  })

  console.log("🔧 ENGINE: After holdings loop - totalCost:", totalCost, "unrealizedGains:", unrealizedGains)

  // Calculate realized gains and other transactions
  transactions.forEach((tx) => {
    if (tx.type === 'SELL') {
      const holding = holdings.find((h) => h.symbol === tx.symbol)
      if (holding) {
        const gain = (tx.price - holding.avgCost) * tx.shares
        realizedGains += gain
      }
    } else if (tx.type === 'DIVIDEND') {
      totalDividends += tx.total
    } else if (tx.type === 'FEE') {
      totalFees += tx.total
    }
  })

  const totalValue = totalCost + unrealizedGains
  totalGain = unrealizedGains + realizedGains + totalDividends + totalFees

  console.log("🔧 ENGINE: Final calculations:")
  console.log("🔧 ENGINE: totalCost:", totalCost, "typeof:", typeof totalCost)
  console.log("🔧 ENGINE: unrealizedGains:", unrealizedGains, "typeof:", typeof unrealizedGains)
  console.log("🔧 ENGINE: totalValue:", totalValue, "typeof:", typeof totalValue)
  console.log("🔧 ENGINE: totalGain:", totalGain, "typeof:", typeof totalGain)

  const summary: PortfolioSummary = {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
    unrealizedGains,
    realizedGains,
    todayChange: 0, // Requires real-time price data
    todayChangePercent: 0,
    dividends: totalDividends,
    fees: totalFees,
  }

  console.log("🔧 ENGINE: Returning summary:", summary)

  calculationCache.portfolioSummary = summary
  lastCalculationTime = Date.now()
  return summary
}

/**
 * Calculate allocation by sector, industry, asset type, and broker
 */
export function getAllocation(): AllocationData {
  if (isCacheValid() && calculationCache.allocation) {
    return calculationCache.allocation
  }

  const holdings = getHoldings()
  const summary = getPortfolioSummary()

  const allocation: AllocationData = {
    sector: {},
    industry: {},
    assetType: {},
    broker: {},
  }

  holdings.forEach((holding) => {
    const value = holding.marketValue || holding.totalCost
    const percentage = (value / summary.totalValue) * 100

    // Sector allocation
    if (!allocation.sector[holding.sector]) {
      allocation.sector[holding.sector] = 0
    }
    allocation.sector[holding.sector] += percentage

    // Industry allocation
    if (!allocation.industry[holding.industry]) {
      allocation.industry[holding.industry] = 0
    }
    allocation.industry[holding.industry] += percentage

    // Asset type allocation
    if (!allocation.assetType[holding.assetType]) {
      allocation.assetType[holding.assetType] = 0
    }
    allocation.assetType[holding.assetType] += percentage

    // Broker allocation
    if (!allocation.broker[holding.broker]) {
      allocation.broker[holding.broker] = 0
    }
    allocation.broker[holding.broker] += percentage
  })

  calculationCache.allocation = allocation
  lastCalculationTime = Date.now()
  return allocation
}

/**
 * Calculate performance metrics (returns, sharpe ratio, drawdown)
 */
export function getPerformance(): PerformanceMetrics {
  if (isCacheValid() && calculationCache.performance) {
    return calculationCache.performance
  }

  const summary = getPortfolioSummary()

  // These are placeholder calculations - in production, use historical price data
  const performance: PerformanceMetrics = {
    dailyReturn: summary.totalGainPercent / 252, // Approximate daily return
    weeklyReturn: (summary.totalGainPercent / 52) * 1, // Approximate weekly
    monthlyReturn: (summary.totalGainPercent / 12) * 1, // Approximate monthly
    yearlyReturn: summary.totalGainPercent,
    sharpeRatio: 0, // Will be calculated from historical data when available
    maxDrawdown: 0, // Will be calculated from historical data when available
  }

  calculationCache.performance = performance
  lastCalculationTime = Date.now()
  return performance
}

/**
 * Calculate dividend data
 */
export function getDividends(): DividendData {
  if (isCacheValid() && calculationCache.dividends) {
    return calculationCache.dividends
  }

  const transactions = getTransactions()
  const dividendsBySymbol: { [key: string]: number } = {}
  let totalDividends = 0

  transactions.forEach((tx) => {
    if (tx.type === 'DIVIDEND') {
      if (!dividendsBySymbol[tx.symbol]) {
        dividendsBySymbol[tx.symbol] = 0
      }
      dividendsBySymbol[tx.symbol] += tx.total
      totalDividends += tx.total
    }
  })

  const dividendData: DividendData = {
    totalDividends,
    dividendsBySymbol,
    upcomingDividends: [], // Requires external API data
  }

  calculationCache.dividends = dividendData
  lastCalculationTime = Date.now()
  return dividendData
}

/**
 * Calculate trade analysis (win rate, best/worst trades)
 */
export function getTradeAnalysis(): TradeAnalysis {
  if (isCacheValid() && calculationCache.tradeAnalysis) {
    return calculationCache.tradeAnalysis
  }

  const transactions = getTransactions()
  const buyTransactions = transactions.filter((t) => t.type === 'BUY')
  const sellTransactions = transactions.filter((t) => t.type === 'SELL')

  let winningTrades = 0
  let losingTrades = 0
  let bestTrade = { symbol: '', gain: -Infinity }
  let worstTrade = { symbol: '', loss: Infinity }

  // Calculate trade outcomes
  buyTransactions.forEach((buy) => {
    const sells = sellTransactions.filter((s) => s.symbol === buy.symbol && new Date(s.date) > new Date(buy.date))
    sells.forEach((sell) => {
      const gain = (sell.price - buy.price) * buy.shares
      if (gain > 0) {
        winningTrades++
        if (gain > bestTrade.gain) {
          bestTrade = { symbol: buy.symbol, gain }
        }
      } else {
        losingTrades++
        if (gain < worstTrade.loss) {
          worstTrade = { symbol: buy.symbol, loss: gain }
        }
      }
    })
  })

  const totalTrades = winningTrades + losingTrades
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

  const analysis: TradeAnalysis = {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    bestTrade: bestTrade.gain === -Infinity ? { symbol: 'N/A', gain: 0 } : bestTrade,
    worstTrade: worstTrade.loss === Infinity ? { symbol: 'N/A', loss: 0 } : worstTrade,
  }

  calculationCache.tradeAnalysis = analysis
  lastCalculationTime = Date.now()
  return analysis
}

/**
 * Helper functions for sector, industry, and asset type classification
 */
function getAssetType(symbol: string): string {
  const etfs = ['SPY', 'QQQ', 'VOO', 'VTI', 'IWM', 'DIA', 'VEA', 'VWO', 'AGG', 'BND']
  return etfs.includes(symbol.toUpperCase()) ? 'ETF' : 'Stock'
}

function getSectorBySymbol(symbol: string): string {
  const sectorMap: { [key: string]: string } = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOGL': 'Technology',
    'GOOG': 'Technology',
    'AMZN': 'Consumer',
    'NVDA': 'Technology',
    'TSLA': 'Automotive',
    'META': 'Technology',
    'SHOP': 'Technology',
    'GME': 'Consumer',
    'SPY': 'Index',
    'QQQ': 'Index',
    'VOO': 'Index',
  }
  return sectorMap[symbol] || 'Other'
}

function getIndustryBySymbol(symbol: string): string {
  const industryMap: { [key: string]: string } = {
    'AAPL': 'Consumer Electronics',
    'MSFT': 'Software',
    'GOOGL': 'Internet Services',
    'GOOG': 'Internet Services',
    'AMZN': 'E-Commerce',
    'NVDA': 'Semiconductors',
    'TSLA': 'Auto Manufacturers',
    'META': 'Social Media',
    'SHOP': 'E-Commerce',
    'GME': 'Specialty Retail',
    'SPY': 'Index Fund',
    'QQQ': 'Index Fund',
    'VOO': 'Index Fund',
  }
  return industryMap[symbol] || 'Other'
}

/**
 * Get key statistics for the portfolio
 */
export function getKeyStats() {
  const summary = getPortfolioSummary()
  const performance = getPerformance()
  
  return {
    allTimeHigh: summary.totalValue || 0,
    weekHigh52: summary.totalValue || 0,
    dividendYield: summary.totalValue > 0 ? (summary.dividends / summary.totalValue) * 100 : 0,
    maxDrawdown: performance.maxDrawdown,
    maxDrawdownDuration: 0,
    sharpeRatio: performance.sharpeRatio,
    beta: 0,
  }
}

/**
 * Get all calculated data at once (useful for dashboard)
 */
export function getAllPortfolioData() {
  return {
    holdings: getHoldings(),
    summary: getPortfolioSummary(),
    allocation: getAllocation(),
    performance: getPerformance(),
    dividends: getDividends(),
    tradeAnalysis: getTradeAnalysis(),
    keyStats: getKeyStats(),
  }
}

// Helper function to get transactions from storage
function getTransactionsFromStorage(): Transaction[] {
  return getTransactionsFromStorageUtil() as Transaction[]
}
