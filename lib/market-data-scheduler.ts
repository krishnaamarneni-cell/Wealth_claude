/**
 * Market Data Scheduler
 * Ensures data is only fetched at specific times (10AM, 1PM, 4PM EST)
 * All other times use cached data
 */

export interface ScheduledCache {
  data: any
  fetchedAt: Date
  nextRefreshAt: Date
  source: 'polygon' | 'finnhub' | 'fallback'
}

const CACHE_KEY_PREFIX = 'market_data_'

// EST refresh times (convert to user's local time)
const REFRESH_HOURS_EST = [10, 13, 16] // 10AM, 1PM, 4PM

/**
 * Get next scheduled refresh time
 */
export function getNextRefreshTime(): Date {
  const now = new Date()
  
  // Convert to EST
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const currentHour = estTime.getHours()
  
  let nextHour = REFRESH_HOURS_EST.find(h => h > currentHour)
  
  if (!nextHour) {
    // Next refresh is tomorrow at 10AM
    nextHour = REFRESH_HOURS_EST[0]
    estTime.setDate(estTime.getDate() + 1)
  }
  
  estTime.setHours(nextHour, 0, 0, 0)
  
  return new Date(estTime.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }))
}

/**
 * Check if we should fetch new data
 */
export function shouldFetchNewData(symbol: string): boolean {
  const cached = getCachedData(symbol)
  
  if (!cached) {
    console.log(`[Scheduler] No cache for ${symbol}, should fetch`)
    return true
  }
  
  const now = new Date()
  const nextRefresh = new Date(cached.nextRefreshAt)
  
  if (now >= nextRefresh) {
    console.log(`[Scheduler] Cache expired for ${symbol}, should fetch`)
    return true
  }
  
  console.log(`[Scheduler] Cache valid for ${symbol} until ${nextRefresh.toLocaleTimeString()}`)
  return false
}

/**
 * Get cached data for a symbol
 */
export function getCachedData(symbol: string): ScheduledCache | null {
  if (typeof window === 'undefined') return null
  
  try {
    const key = CACHE_KEY_PREFIX + symbol
    const cached = localStorage.getItem(key)
    
    if (!cached) return null
    
    const parsed = JSON.parse(cached)
    return {
      ...parsed,
      fetchedAt: new Date(parsed.fetchedAt),
      nextRefreshAt: new Date(parsed.nextRefreshAt)
    }
  } catch (error) {
    console.error('[Scheduler] Cache read error:', error)
    return null
  }
}

/**
 * Save data to cache
 */
export function setCachedData(symbol: string, data: any, source: 'polygon' | 'finnhub' | 'fallback'): void {
  if (typeof window === 'undefined') return
  
  try {
    const key = CACHE_KEY_PREFIX + symbol
    const now = new Date()
    const nextRefresh = getNextRefreshTime()
    
    const cache: ScheduledCache = {
      data,
      fetchedAt: now,
      nextRefreshAt: nextRefresh,
      source
    }
    
    localStorage.setItem(key, JSON.stringify(cache))
    
    console.log(`[Scheduler] Cached ${symbol} until ${nextRefresh.toLocaleTimeString()} (source: ${source})`)
  } catch (error) {
    console.error('[Scheduler] Cache write error:', error)
  }
}

/**
 * Clear all market data cache
 */
export function clearAllMarketDataCache(): void {
  if (typeof window === 'undefined') return
  
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX))
  keys.forEach(key => localStorage.removeItem(key))
  
  console.log(`[Scheduler] Cleared ${keys.length} cached items`)
}

/**
 * Get time until next refresh (human readable)
 */
export function getTimeUntilNextRefresh(): string {
  const next = getNextRefreshTime()
  const now = new Date()
  const diff = next.getTime() - now.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
