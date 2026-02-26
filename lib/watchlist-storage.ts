// Storage interface for watchlist with database migration support
import { isSupabaseStorageEnabled } from './feature-flags'

export interface WatchlistItem {
  id: string
  symbol: string
  companyName: string
  addedDate: string
  addedPrice: number
  priceAlert?: number
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

const WATCHLIST_KEY = 'portfolio-watchlist'
const WATCHLIST_CACHE_KEY = 'portfolio-watchlist-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000

/**
 * Get watchlist from storage - PHASE 3
 * NOW: Reads ONLY from Supabase API
 */
export const getWatchlistFromStorage = async (): Promise<WatchlistItem[]> => {
  if (typeof window === 'undefined') return []

  try {
    console.log('[watchlist-storage] Fetching from Supabase API...')
    const response = await fetch('/api/watchlist', { cache: 'no-store' })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        console.log('[watchlist-storage] ✅ Loaded from Supabase:', data.length, 'items')
        return data
      }
    }
  } catch (err) {
    console.error('[watchlist-storage] Error fetching from Supabase:', err)
  }

  // Return empty if Supabase fails - no fallback
  return []
}

/**
 * Save watchlist to storage - PHASE 3
 * NOW: Saves ONLY to Supabase API
 */
export const saveWatchlistToStorage = async (watchlist: WatchlistItem[]): Promise<void> => {
  if (typeof window === 'undefined') return

  try {
    console.log('[watchlist-storage] Saving to Supabase...')
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(watchlist[watchlist.length - 1]),
    })

    if (response.ok) {
      console.log('[watchlist-storage] ✅ Saved to Supabase')
      window.dispatchEvent(new Event('watchlistUpdated'))
    } else {
      console.error('[watchlist-storage] Supabase save failed:', response.status)
    }
  } catch (err) {
    console.error('[watchlist-storage] Supabase save error:', err)
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
      console.log(`[watchlist-storage] Using cached data (${Math.floor(age / 1000 / 60 / 60)} hours old)`)
      return cache
    } else {
      console.log('[watchlist-storage] Cache expired')
      return null
    }
  } catch (error) {
    console.error('[watchlist-storage] Failed to load cache:', error)
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
      priceData,
    }
    localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(cache))
    console.log('[watchlist-storage] ✅ Cache saved')
  } catch (error) {
    console.error('[watchlist-storage] Failed to save cache:', error)
  }
}

/**
 * Add stock to watchlist
 */
export const addToWatchlist = async (symbol: string, companyName: string, currentPrice: number): Promise<void> => {
  const watchlist = await getWatchlistFromStorage()

  if (watchlist.some((item) => item.symbol === symbol)) {
    throw new Error(`${symbol} is already in your watchlist`)
  }

  const newItem: WatchlistItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    symbol,
    companyName,
    addedDate: new Date().toISOString(),
    addedPrice: currentPrice,
    alertEnabled: false,
  }

  await saveWatchlistToStorage([...watchlist, newItem])
}

/**
 * Remove stock from watchlist
 */
export const removeFromWatchlist = async (symbol: string): Promise<void> => {
  try {
    const response = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      console.log('[watchlist-storage] ✅ Deleted from Supabase:', symbol)
      window.dispatchEvent(new Event('watchlistUpdated'))
    } else {
      console.error('[watchlist-storage] Delete failed:', response.status)
    }
  } catch (err) {
    console.error('[watchlist-storage] Delete error:', err)
  }
}

/**
 * Update price alert
 */
export const updatePriceAlert = async (symbol: string, priceAlert: number, enabled: boolean): Promise<void> => {
  const watchlist = await getWatchlistFromStorage()
  const updated = watchlist.map((item) =>
    item.symbol === symbol ? { ...item, priceAlert, alertEnabled: enabled } : item
  )
  await saveWatchlistToStorage(updated)
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
export const exportWatchlistForDB = async (): Promise<WatchlistItem[]> => {
  return await getWatchlistFromStorage()
}

/**
 * Import watchlist from database
 */
export const importWatchlistFromDB = async (items: WatchlistItem[]): Promise<void> => {
  await saveWatchlistToStorage(items)
}
