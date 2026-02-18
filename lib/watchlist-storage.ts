// Storage interface for watchlist with database migration support
export interface WatchlistItem {
  id: string
  symbol: string
  companyName: string
  addedDate: string
  addedPrice: number
  priceAlert?: number // Optional: for future feature
  alertEnabled?: boolean
}

export interface WatchlistCache {
  data: WatchlistItem[]
  timestamp: number
  priceData: Record<string, WatchlistPriceData>
}

export interface WatchlistPriceData {
  currentPrice: number
  change: number
  changePercent: number
  high52Week: number
  low52Week: number
  dividendYield: number
  marketCap: number
  peRatio: number
  volume: number
  lastUpdated: number
}

// localStorage key (will be replaced with database in future)
const WATCHLIST_KEY = 'portfolio-watchlist'
const WATCHLIST_CACHE_KEY = 'portfolio-watchlist-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get watchlist from storage (localStorage now, database later)
 */
export const getWatchlistFromStorage = (): WatchlistItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(WATCHLIST_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load watchlist:', error)
    return []
  }
}

/**
 * Save watchlist to storage (localStorage now, database later)
 */
export const saveWatchlistToStorage = (watchlist: WatchlistItem[]): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist))
    console.log('✅ Watchlist saved:', watchlist.length, 'items')

    // Trigger event for other components
    window.dispatchEvent(new Event('watchlistUpdated'))
  } catch (error) {
    console.error('Failed to save watchlist:', error)
  }
}

/**
 * Get cached price data
 */
export const getWatchlistCache = (): WatchlistCache | null => {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(WATCHLIST_CACHE_KEY)
    if (!cached) return null

    const cache: WatchlistCache = JSON.parse(cached)
    const age = Date.now() - cache.timestamp

    if (age < CACHE_DURATION) {
      console.log(`⚡ Using cached watchlist data (${Math.floor(age / 1000 / 60 / 60)} hours old)`)
      return cache
    } else {
      console.log('🕐 Watchlist cache expired')
      return null
    }
  } catch (error) {
    console.error('Failed to load watchlist cache:', error)
    return null
  }
}

/**
 * Save price data cache
 */
export const saveWatchlistCache = (data: WatchlistItem[], priceData: Record<string, WatchlistPriceData>): void => {
  if (typeof window === 'undefined') return

  try {
    const cache: WatchlistCache = {
      data,
      timestamp: Date.now(),
      priceData
    }
    localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(cache))
    console.log('✅ Watchlist cache saved')
  } catch (error) {
    console.error('Failed to save watchlist cache:', error)
  }
}

/**
 * Add stock to watchlist
 */
export const addToWatchlist = (symbol: string, companyName: string, currentPrice: number): void => {
  const watchlist = getWatchlistFromStorage()

  // Check if already in watchlist
  if (watchlist.some(item => item.symbol === symbol)) {
    throw new Error(`${symbol} is already in your watchlist`)
  }

  const newItem: WatchlistItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    symbol,
    companyName,
    addedDate: new Date().toISOString(),
    addedPrice: currentPrice,
    alertEnabled: false
  }

  saveWatchlistToStorage([...watchlist, newItem])
}

/**
 * Remove stock from watchlist
 */
export const removeFromWatchlist = (symbol: string): void => {
  const watchlist = getWatchlistFromStorage()
  const updated = watchlist.filter(item => item.symbol !== symbol)
  saveWatchlistToStorage(updated)
}

/**
 * Update price alert (for future feature)
 */
export const updatePriceAlert = (symbol: string, priceAlert: number, enabled: boolean): void => {
  const watchlist = getWatchlistFromStorage()
  const updated = watchlist.map(item =>
    item.symbol === symbol
      ? { ...item, priceAlert, alertEnabled: enabled }
      : item
  )
  saveWatchlistToStorage(updated)
}

/**
 * Clear all watchlist data
 */
export const clearWatchlist = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WATCHLIST_KEY)
  localStorage.removeItem(WATCHLIST_CACHE_KEY)
  window.dispatchEvent(new Event('watchlistUpdated'))
}

/**
 * Export watchlist for database migration
 */
export const exportWatchlistForDB = (): WatchlistItem[] => {
  return getWatchlistFromStorage()
}

/**
 * Import watchlist from database
 */
export const importWatchlistFromDB = (items: WatchlistItem[]): void => {
  saveWatchlistToStorage(items)
}
