export type MarketDataMap = Record<string, {
  ticker: string
  countryCode: string
  indexName: string
  exchange: string
  currency: string
  price: number
  change: number
  changePct: number
  previousClose: number
  lastUpdated: string
  isOpen: boolean
}>

// ── TYPES ────────────────────────────────────────────────────
export interface FetchState {
  data: MarketDataMap
  fetchedAt: string | null
  isLoading: boolean
  isLive: boolean
  error: string | null
}

// ── IN-MEMORY CACHE ──────────────────────────────────────────
let memCache: { data: MarketDataMap; fetchedAt: string } | null = null
const CACHE_MS = 60 * 60 * 1000 // 1 hour

function loadFromStorage(): { data: MarketDataMap; fetchedAt: string } | null {
  try {
    const raw = localStorage.getItem("wc_market_cache")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const age = Date.now() - new Date(parsed.fetchedAt).getTime()
    if (age < CACHE_MS) return parsed
    return null
  } catch { return null }
}

function saveToStorage(data: MarketDataMap, fetchedAt: string) {
  try {
    localStorage.setItem("wc_market_cache", JSON.stringify({ data, fetchedAt }))
  } catch { /* silent */ }
}

// ── ET MARKET CLOSE CHECK ───────────────────────────────────
function msUntilNextMarketClose(): number {
  const now = new Date()
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const close = new Date(et)
  close.setHours(16, 30, 0, 0) // 4:30 PM ET

  if (et >= close) {
    // Already past close — next close is tomorrow
    close.setDate(close.getDate() + 1)
  }

  return close.getTime() - et.getTime()
}

// ── MAIN FETCH ───────────────────────────────────────────────
export async function fetchMarketData(): Promise<FetchState> {
  // Return cache if fresh
  // Check memory cache first
  if (memCache) {
    const age = Date.now() - new Date(memCache.fetchedAt).getTime()
    if (age < CACHE_MS) {
      return {
        data: memCache.data,
        fetchedAt: memCache.fetchedAt,
        isLoading: false,
        isLive: true,
        error: null,
      }
    }
  }

  // Check localStorage cache
  const stored = loadFromStorage()
  if (stored) {
    memCache = stored
    return {
      data: stored.data,
      fetchedAt: stored.fetchedAt,
      isLoading: false,
      isLive: true,
      error: null,
    }
  }

  try {
    const res = await fetch("/api/market-data", {
      next: { revalidate: 1800 }
    } as any)

    if (!res.ok) throw new Error(`API error ${res.status}`)

    const json = await res.json()

    if (!json.data || Object.keys(json.data).length === 0) {
      throw new Error("No data returned")
    }

    memCache = { data: json.data, fetchedAt: json.fetchedAt }
    saveToStorage(json.data, json.fetchedAt)

    return {
      data: json.data,
      fetchedAt: json.fetchedAt,
      isLoading: false,
      isLive: true,
      error: null,
    }

  } catch (e: any) {
    // Fall back to mock data
    return {
      data: {},
      fetchedAt: null,
      isLoading: false,
      isLive: false,
      error: e.message,
    }
  }
}

