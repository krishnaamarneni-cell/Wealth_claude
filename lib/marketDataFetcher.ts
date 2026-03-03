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
```

---

**FILE 3 — Update `app / globe / page.tsx`**

**FIND:**
```
const marketData = useMemo(() => getMockMarketData(), [])
  ```
**REPLACE:**
```
const [marketState, setMarketState] = useState<{
  data: any
  fetchedAt: string | null
  isLive: boolean
  isLoading: boolean
}>({
  data: getMockMarketData(),
  fetchedAt: null,
  isLive: false,
  isLoading: true,
})

const marketData = marketState.data

// Fetch real data + auto-refresh every 60 min
useEffect(() => {
  const load = async () => {
    const { fetchMarketData } = await import("@/lib/marketDataFetcher")
    const result = await fetchMarketData()
    setMarketState({
      data: result.data,
      fetchedAt: result.fetchedAt,
      isLive: result.isLive,
      isLoading: false,
    })
  }
  load()
  const interval = setInterval(load, 60 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
  ```

---

**FIND in `app / globe / page.tsx`:**
```
  < div className = "hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/5 border border-white/8 rounded-full px-3 py-1.5" >
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
      MOCK DATA — Step 1
        </div>
          ```
**REPLACE:**
```
        < div className = "hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/5 border border-white/8 rounded-full px-3 py-1.5" >
          <span className={ `w-1.5 h-1.5 rounded-full inline-block ${marketState.isLoading ? "bg-amber-400 animate-pulse" : marketState.isLive ? "bg-emerald-400" : "bg-amber-400"}` } />
{ marketState.isLoading ? "Loading Data…" : marketState.isLive ? "Live Data" : "Mock Data" }
</div>
{
  marketState.fetchedAt && (
    <div className="text-[10px] text-white/20 hidden md:block" >
      Updated { new Date(marketState.fetchedAt).toLocaleTimeString() }
  </div>
            )
}
