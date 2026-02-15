// ==================== SMART STOCK DATA CACHE ====================
// Manages intelligent caching with 24-hour duration and priority system

interface StockCacheData {
  symbol: string
  price: number
  change: number
  changePercent: number
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
  timestamp: number // When was this cached?
}

interface CacheStats {
  total: number
  noData: number
  hasNA: number
  stale: number
  fresh: number
}

const CACHE_KEY = 'smartStockCache_v1'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// ==================== CACHE OPERATIONS ====================

export function getAllCachedStocks(): Map<string, StockCacheData> {
  try {
    const data = localStorage.getItem(CACHE_KEY)
    if (!data) return new Map()
    
    const parsed = JSON.parse(data)
    return new Map(Object.entries(parsed))
  } catch (error) {
    console.error('[Cache] Failed to load cache:', error)
    return new Map()
  }
}

export function getCachedStock(symbol: string): StockCacheData | null {
  const cache = getAllCachedStocks()
  return cache.get(symbol) || null
}

export function setCachedStock(symbol: string, data: Omit<StockCacheData, 'timestamp'>) {
  try {
    const cache = getAllCachedStocks()
    
    cache.set(symbol, {
      ...data,
      timestamp: Date.now()
    })
    
    const obj = Object.fromEntries(cache)
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
    
    console.log(`[Cache] ✅ Cached ${symbol}`)
  } catch (error) {
    console.error(`[Cache] Failed to cache ${symbol}:`, error)
  }
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    console.log('[Cache] 🗑️ Cache cleared')
  } catch (error) {
    console.error('[Cache] Failed to clear cache:', error)
  }
}

// ==================== PRIORITY CALCULATION ====================

export interface StockPriority {
  symbol: string
  priority: 1 | 2 | 3 | 4
  reason: 'NO_DATA' | 'HAS_NA' | 'STALE' | 'FRESH'
  ageHours: number
  needsFetch: boolean
}

export function calculatePriorities(symbols: string[]): StockPriority[] {
  const now = Date.now()
  const priorities: StockPriority[] = []

  symbols.forEach(symbol => {
    const cached = getCachedStock(symbol)

    if (!cached) {
      // Priority 1: No data at all
      priorities.push({
        symbol,
        priority: 1,
        reason: 'NO_DATA',
        ageHours: Infinity,
        needsFetch: true
      })
      return
    }

    const ageMs = now - cached.timestamp
    const ageHours = ageMs / (1000 * 60 * 60)

    // Check for N/A data (0, null, or NaN)
    const hasMissingData = Object.values(cached.returns).some(
      v => v === 0 || v === null || isNaN(v)
    )

    if (hasMissingData) {
      // Priority 2: Has N/A data
      priorities.push({
        symbol,
        priority: 2,
        reason: 'HAS_NA',
        ageHours,
        needsFetch: true
      })
      return
    }

    if (ageMs > CACHE_DURATION) {
      // Priority 3: Stale data (>24 hours)
      priorities.push({
        symbol,
        priority: 3,
        reason: 'STALE',
        ageHours,
        needsFetch: true
      })
      return
    }

    // Priority 4: Fresh data (<24 hours)
    priorities.push({
      symbol,
      priority: 4,
      reason: 'FRESH',
      ageHours,
      needsFetch: false
    })
  })

  // Sort: Priority 1-3 first (by priority, then by age), Priority 4 last
  return priorities.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    // Within same priority, oldest first
    return b.ageHours - a.ageHours
  })
}

// ==================== CACHE STATISTICS ====================

export function getCacheStats(symbols: string[]): CacheStats {
  const priorities = calculatePriorities(symbols)

  return {
    total: symbols.length,
    noData: priorities.filter(p => p.reason === 'NO_DATA').length,
    hasNA: priorities.filter(p => p.reason === 'HAS_NA').length,
    stale: priorities.filter(p => p.reason === 'STALE').length,
    fresh: priorities.filter(p => p.reason === 'FRESH').length
  }
}

// ==================== HELPER FUNCTIONS ====================

export function shouldFetch(symbol: string): boolean {
  const cached = getCachedStock(symbol)
  
  if (!cached) return true
  
  const ageMs = Date.now() - cached.timestamp
  const hasMissingData = Object.values(cached.returns).some(
    v => v === 0 || v === null || isNaN(v)
  )
  
  return hasMissingData || ageMs > CACHE_DURATION
}

export function getStocksToFetch(symbols: string[], maxCount?: number): string[] {
  const priorities = calculatePriorities(symbols)
  const needsFetch = priorities.filter(p => p.needsFetch)
  
  if (maxCount) {
    return needsFetch.slice(0, maxCount).map(p => p.symbol)
  }
  
  return needsFetch.map(p => p.symbol)
}
