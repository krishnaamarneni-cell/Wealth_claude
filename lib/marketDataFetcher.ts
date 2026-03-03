import { getMockMarketData, MarketDataMap } from "./mockData"

// ── TYPES ────────────────────────────────────────────────────
export interface FetchState {
  data: MarketDataMap
  fetchedAt: string | null
  isLoading: boolean
  isLive: boolean
  error: string | null
}

// ── IN-MEMORY CACHE ──────────────────────────────────────────
let cache: { data: MarketDataMap; fetchedAt: string } | null = null
const CACHE_MS = 60 * 60 * 1000 // 1 hour

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
  if (cache) {
    const age = Date.now() - new Date(cache.fetchedAt).getTime()
    if (age < CACHE_MS) {
      return {
        data: cache.data,
        fetchedAt: cache.fetchedAt,
        isLoading: false,
        isLive: true,
        error: null,
      }
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

    cache = { data: json.data, fetchedAt: json.fetchedAt }

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
      data: getMockMarketData(),
      fetchedAt: null,
      isLoading: false,
      isLive: false,
      error: e.message,
    }
  }
}

