// ==================== IMPORTS ====================

import { getCachedStock, setCachedStock, calculatePriorities } from './smart-stock-cache'
import { fetchStocksBatch } from './batch-fetcher'

// ==================== TYPES ====================

export interface Transaction {
  date: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'TAX' | 'INTEREST'
  shares: number
  price: number
  total: number
  broker: string
  fileId?: string
}

export interface Holding {
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
  week52High?: number
  week52Low?: number
  dividendYield?: number
  returns?: {
    '1D': number
    '1W': number
    '1M': number
    '3M': number
    '6M': number
    '1Y': number
  }
  dataSource?: string
  lastFetched?: Date
}

interface Split {
  date: string
  fromFactor: number
  toFactor: number
  ratio: number
  splitType: string
  description: string
}

// ==================== STOCK SPLITS ====================

const STOCK_SPLITS: { [key: string]: Split[] } = {
  'KULR': [{
    date: '2025-06-23',
    fromFactor: 1,
    toFactor: 8,
    ratio: 8,
    splitType: 'REVERSE_1_8',
    description: '1-for-8 Reverse Split'
  }],
  'TSLZ': [{
    date: '2025-10-29',
    fromFactor: 1,
    toFactor: 20,
    ratio: 20,
    splitType: 'REVERSE_1_20',
    description: '1-for-20 Reverse Split'
  }],
  'NVDA': [{
    date: '2024-06-10',
    fromFactor: 10,
    toFactor: 1,
    ratio: 10,
    splitType: 'FORWARD_10_1',
    description: '10-for-1 Forward Split'
  }],
  'AAPL': [
    { date: '2020-08-31', fromFactor: 4, toFactor: 1, ratio: 4, splitType: 'FORWARD_4_1', description: '4-for-1 Forward Split' },
    { date: '2014-06-09', fromFactor: 7, toFactor: 1, ratio: 7, splitType: 'FORWARD_7_1', description: '7-for-1 Forward Split' }
  ],
  'TSLA': [
    { date: '2022-08-25', fromFactor: 3, toFactor: 1, ratio: 3, splitType: 'FORWARD_3_1', description: '3-for-1 Forward Split' },
    { date: '2020-08-31', fromFactor: 5, toFactor: 1, ratio: 5, splitType: 'FORWARD_5_1', description: '5-for-1 Forward Split' }
  ],
  'GOOGL': [{ date: '2022-07-18', fromFactor: 20, toFactor: 1, ratio: 20, splitType: 'FORWARD_20_1', description: '20-for-1 Forward Split' }],
  'GOOG': [{ date: '2022-07-18', fromFactor: 20, toFactor: 1, ratio: 20, splitType: 'FORWARD_20_1', description: '20-for-1 Forward Split' }],
  'AMZN': [{ date: '2022-06-06', fromFactor: 20, toFactor: 1, ratio: 20, splitType: 'FORWARD_20_1', description: '20-for-1 Forward Split' }],
  'META': [{ date: '2015-12-09', fromFactor: 5, toFactor: 1, ratio: 5, splitType: 'FORWARD_5_1', description: '5-for-1 Forward Split' }],
  'SHOP': [{ date: '2022-06-29', fromFactor: 10, toFactor: 1, ratio: 10, splitType: 'FORWARD_10_1', description: '10-for-1 Forward Split' }],
  'GME': [{ date: '2022-07-22', fromFactor: 4, toFactor: 1, ratio: 4, splitType: 'FORWARD_4_1', description: '4-for-1 Forward Split' }],
  'MSFT': [{ date: '2003-02-18', fromFactor: 2, toFactor: 1, ratio: 2, splitType: 'FORWARD_2_1', description: '2-for-1 Forward Split' }],
}

// ==================== HELPER FUNCTIONS ====================

const getAssetType = (symbol: string): string => {
  const etfs = ['SPY', 'QQQ', 'VOO', 'VTI', 'IWM', 'DIA', 'VEA', 'VWO', 'AGG', 'BND', 'VXUS']
  return etfs.includes(symbol.toUpperCase()) ? 'ETF' : 'Stock'
}

// ==================== MAIN CALCULATOR ====================

export interface CalculateHoldingsResult {
  holdingsToFetch: Array<{
    symbol: string
    shares: number
    totalCost: number
    broker: string
  }>
  symbolsWithSplits: string[]
}

/**
 * ✅ FIXED: Calculate holdings with proper symbol grouping
 * Merges all transactions for same symbol (CSV + Manual)
 */
export function calculateHoldings(
  transactions: Transaction[],
  filterByBroker?: string
): CalculateHoldingsResult {
  console.log(`[Calculator] Processing ${transactions.length} transactions${filterByBroker ? ` for broker: ${filterByBroker}` : ''}`)

  if (transactions.length === 0) {
    return { holdingsToFetch: [], symbolsWithSplits: [] }
  }

  // Sort by date
  const sortedTxns = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Find symbols with splits
  const uniqueSymbols = Array.from(new Set(sortedTxns.map(t => t.symbol).filter(s => s && s !== '-')))
  const symbolsWithSplits = uniqueSymbols.filter(symbol => STOCK_SPLITS[symbol]?.length > 0)

  if (symbolsWithSplits.length > 0) {
    console.log(`[Calculator] Symbols with splits: ${symbolsWithSplits.join(', ')}`)
  }

  // ✅ FIX: Use single holdings map to group ALL transactions by symbol
  // This merges CSV + Manual transactions automatically
  const holdingsMap = new Map<string, { shares: number; totalCost: number; broker: string }>()

  sortedTxns.forEach(tx => {
    if (!tx.symbol || tx.symbol === '-') return
    if (tx.type !== 'BUY' && tx.type !== 'SELL') return
    if ((tx.type === 'BUY' || tx.type === 'SELL') && tx.total === 0 && tx.price === 0) return

    // Filter by broker if specified
    if (filterByBroker && tx.broker !== filterByBroker) return

    let shares = Number(tx.shares) || 0
    let price = Number(tx.price) || 0

    // Apply stock split adjustments
    const splits = STOCK_SPLITS[tx.symbol] || []

    splits.forEach(split => {
      const splitDate = new Date(split.date)
      splitDate.setHours(0, 0, 0, 0)

      const txDate = new Date(tx.date)
      txDate.setHours(0, 0, 0, 0)

      if (txDate < splitDate) {
        if (split.splitType.startsWith('REVERSE_')) {
          const adjustmentRatio = split.toFactor / split.fromFactor
          shares = shares / adjustmentRatio
          price = price * adjustmentRatio
        } else if (split.splitType.startsWith('FORWARD_')) {
          const adjustmentRatio = split.fromFactor / split.toFactor
          shares = shares * adjustmentRatio
          price = price / adjustmentRatio
        }
      }
    })

    const total = shares * price
    const broker = tx.broker || 'Unknown'

    // ✅ MERGE: Get or create holding for this symbol
    const existing = holdingsMap.get(tx.symbol)

    if (tx.type === 'BUY') {
      if (existing) {
        // ✅ Merge with existing holding
        holdingsMap.set(tx.symbol, {
          shares: existing.shares + shares,
          totalCost: existing.totalCost + total,
          broker: existing.broker // Keep first broker
        })
        console.log(`[Calculator] ✅ Merged BUY for ${tx.symbol}: ${(existing.shares + shares).toFixed(2)} shares total`)
      } else {
        // Create new holding
        holdingsMap.set(tx.symbol, {
          shares: shares,
          totalCost: total,
          broker: broker
        })
        console.log(`[Calculator] 🆕 New holding ${tx.symbol}: ${shares.toFixed(2)} shares`)
      }
    } else if (tx.type === 'SELL') {
      if (existing && existing.shares > 0) {
        const avgCost = existing.totalCost / existing.shares
        const newShares = Math.max(0, existing.shares - shares)
        const costReduction = avgCost * shares

        holdingsMap.set(tx.symbol, {
          shares: newShares,
          totalCost: Math.max(0, existing.totalCost - costReduction),
          broker: existing.broker
        })

        if (newShares <= 0) {
          holdingsMap.delete(tx.symbol)
          console.log(`[Calculator] 🗑️ Removed ${tx.symbol} (all shares sold)`)
        } else {
          console.log(`[Calculator] 📉 Reduced ${tx.symbol}: ${newShares.toFixed(2)} shares remaining`)
        }
      }
    }
  })

  // Convert to array and filter active holdings
  const holdingsToFetch: Array<{
    symbol: string
    shares: number
    totalCost: number
    broker: string
  }> = []

  for (const [symbol, data] of holdingsMap.entries()) {
    if (data.shares > 0.0001 && data.totalCost > 0) {
      holdingsToFetch.push({
        symbol: symbol,
        shares: data.shares,
        totalCost: data.totalCost,
        broker: data.broker
      })
    }
  }

  console.log(`[Calculator] ✅ Found ${holdingsToFetch.length} unique active holdings`)

  return {
    holdingsToFetch,
    symbolsWithSplits
  }
}

// ==================== SMART FETCH WITH CACHING ====================

/**
 * ✅ NEW: Fetch stock price with smart caching
 * - Checks cache first (24-hour duration)
 * - Fetches from API if missing or stale
 * - Falls back to stale cache if API fails
 */
export async function fetchStockPrice(symbol: string): Promise<{
  currentPrice: number
  previousClose: number
  sector: string
  industry: string
  country: string
  week52High: number
  week52Low: number
  dividendYield: number
  returns: {
    '1D': number
    '1W': number
    '1M': number
    '3M': number
    '6M': number
    '1Y': number
  }
  dataSource: string
  lastFetched: Date
}> {
  // ✅ STEP 1: Check smart cache first
  const cached = getCachedStock(symbol)
  
  if (cached) {
    const ageMs = Date.now() - cached.timestamp
    const ageHours = ageMs / (1000 * 60 * 60)
    
    // If less than 24 hours old, use cache
    if (ageMs < 24 * 60 * 60 * 1000) {
      console.log(`[Calculator] ⚡ Using cache for ${symbol} (${ageHours.toFixed(1)}h old)`)
      return {
        currentPrice: cached.price,
        previousClose: cached.price - cached.change,
        sector: cached.sector,
        industry: cached.industry,
        country: cached.country,
        week52High: cached.week52High,
        week52Low: cached.week52Low,
        dividendYield: cached.dividendYield,
        returns: cached.returns,
        dataSource: cached.dataSource,
        lastFetched: new Date(cached.timestamp)
      }
    }
  }

  // ✅ STEP 2: Fetch from API if not cached or stale
  console.log(`[Calculator] 📡 Fetching fresh data for ${symbol}...`)
  
  try {
    const response = await fetch(`/api/stock-info?symbol=${symbol}`)
    
    if (response.ok) {
      const data = await response.json()

      const previousClose = data.price && data.change 
        ? data.price - data.change 
        : data.price || 0

      const result = {
        currentPrice: data.price || 0,
        previousClose: previousClose,
        sector: data.sector || 'Technology',
        industry: data.industry || 'Software',
        country: data.country || 'US',
        week52High: data.week52High || 0,
        week52Low: data.week52Low || 0,
        dividendYield: data.dividendYield || 0,
        returns: data.returns || {
          '1D': 0,
          '1W': 0,
          '1M': 0,
          '3M': 0,
          '6M': 0,
          '1Y': 0
        },
        dataSource: data.dataSource || 'unknown',
        lastFetched: new Date()
      }

      // ✅ STEP 3: Cache the result
      setCachedStock(symbol, {
        symbol,
        price: result.currentPrice,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        sector: result.sector,
        industry: result.industry,
        country: result.country,
        week52High: result.week52High,
        week52Low: result.week52Low,
        dividendYield: result.dividendYield,
        returns: result.returns,
        dataSource: result.dataSource
      })

      return result
    }
  } catch (error) {
    console.error(`[Calculator] Failed to fetch price for ${symbol}:`, error)
  }

  // ✅ STEP 4: Fallback to stale cache if fetch fails
  if (cached) {
    console.log(`[Calculator] ⚠️ API failed, using stale cache for ${symbol}`)
    return {
      currentPrice: cached.price,
      previousClose: cached.price - cached.change,
      sector: cached.sector,
      industry: cached.industry,
      country: cached.country,
      week52High: cached.week52High,
      week52Low: cached.week52Low,
      dividendYield: cached.dividendYield,
      returns: cached.returns,
      dataSource: cached.dataSource,
      lastFetched: new Date(cached.timestamp)
    }
  }

  // ✅ STEP 5: Return zeros if everything fails
  console.error(`[Calculator] ❌ No data available for ${symbol}`)
  return {
    currentPrice: 0,
    previousClose: 0,
    sector: 'Unknown',
    industry: 'Unknown',
    country: 'US',
    week52High: 0,
    week52Low: 0,
    dividendYield: 0,
    returns: {
      '1D': 0,
      '1W': 0,
      '1M': 0,
      '3M': 0,
      '6M': 0,
      '1Y': 0
    },
    dataSource: 'none',
    lastFetched: new Date()
  }
}

// ==================== BUILD HOLDINGS WITH SMART BATCHING ====================

/**
 * ✅ NEW: Build holdings with smart batch fetching
 * - Checks which stocks need fetching (not cached or stale)
 * - Fetches in batches of 5 (respects rate limits)
 * - Then builds holdings from cache
 */
export async function buildHoldingsWithPrices(
  holdingsToFetch: Array<{ symbol: string; shares: number; totalCost: number; broker: string }>,
  symbolsWithSplits: string[]
): Promise<Holding[]> {
  const holdings: Holding[] = []

  console.log(`[Calculator] 🚀 Building ${holdingsToFetch.length} holdings with smart caching...`)

  // ✅ STEP 1: Check which stocks need fetching (not cached or stale)
  const symbols = holdingsToFetch.map(h => h.symbol)
  const priorities = calculatePriorities(symbols)
  const needsFetch = priorities.filter(p => p.needsFetch).map(p => p.symbol)

  if (needsFetch.length > 0) {
    console.log(`[Calculator] 📡 ${needsFetch.length} stocks need fresh data, fetching in batches...`)
    
    // ✅ STEP 2: Fetch in batches using smart fetcher
    await fetchStocksBatch(needsFetch, (progress) => {
      console.log(`[Calculator] Progress: ${progress.current}/${progress.total} - ${progress.symbol}`)
    })
  } else {
    console.log(`[Calculator] ⚡ All stocks cached, using cache!`)
  }

  // ✅ STEP 3: Build holdings from cache (now everything is cached)
  for (const holding of holdingsToFetch) {
    const priceData = await fetchStockPrice(holding.symbol) // Will use cache now!
    const marketValue = holding.shares * priceData.currentPrice
    const avgCost = holding.totalCost / holding.shares
    const totalGain = marketValue - holding.totalCost
    const totalGainPercent = holding.totalCost > 0 ? (totalGain / holding.totalCost) * 100 : 0

    const todayGain = holding.shares * (priceData.currentPrice - priceData.previousClose)
    const todayGainPercent = priceData.previousClose > 0 
      ? ((priceData.currentPrice - priceData.previousClose) / priceData.previousClose) * 100 
      : 0

    holdings.push({
      symbol: holding.symbol,
      shares: holding.shares,
      avgCost: avgCost,
      totalCost: holding.totalCost,
      marketValue: marketValue,
      currentPrice: priceData.currentPrice,
      todayGain,
      todayGainPercent,
      totalGain: totalGain,
      totalGainPercent: totalGainPercent,
      allocation: 0,
      sector: priceData.sector,
      industry: priceData.industry,
      country: priceData.country,
      assetType: getAssetType(holding.symbol),
      broker: holding.broker,
      splitAdjusted: symbolsWithSplits.includes(holding.symbol),
      week52High: priceData.week52High,
      week52Low: priceData.week52Low,
      dividendYield: priceData.dividendYield,
      returns: priceData.returns,
      dataSource: priceData.dataSource,
      lastFetched: priceData.lastFetched
    })
  }

  // Calculate allocations
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  if (totalValue > 0) {
    holdings.forEach(h => {
      h.allocation = (h.marketValue / totalValue) * 100
    })
  }

  console.log(`[Calculator] ✅ Built ${holdings.length} holdings`)

  return holdings
}

/**
 * All-in-one function: Calculate and fetch complete holdings
 */
export async function calculateAndFetchHoldings(
  transactions: Transaction[],
  filterByBroker?: string
): Promise<Holding[]> {
  const { holdingsToFetch, symbolsWithSplits } = calculateHoldings(transactions, filterByBroker)
  
  if (holdingsToFetch.length === 0) {
    return []
  }

  return buildHoldingsWithPrices(holdingsToFetch, symbolsWithSplits)
}
