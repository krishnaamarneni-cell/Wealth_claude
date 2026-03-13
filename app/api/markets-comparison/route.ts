import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 6 * 60 * 60 * 1000 // 6 hours

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────
const TABS: Record<string, { symbol: string; label: string }[]> = {
  sectors: [
    { symbol: "XLK", label: "Technology" },
    { symbol: "XLC", label: "Communication" },
    { symbol: "XLY", label: "Consumer Discret." },
    { symbol: "XLF", label: "Financial" },
    { symbol: "XLV", label: "Health Care" },
    { symbol: "XLI", label: "Industrial" },
    { symbol: "XLP", label: "Consumer Staples" },
    { symbol: "XLB", label: "Materials" },
    { symbol: "XLRE", label: "Real Estate" },
    { symbol: "XLU", label: "Utilities" },
    { symbol: "XLE", label: "Energy" },
  ],
  countries: [
    { symbol: "^GSPC", label: "S&P 500 (US)" },
    { symbol: "^IXIC", label: "NASDAQ (US)" },
    { symbol: "^FTSE", label: "FTSE 100 (UK)" },
    { symbol: "^GDAXI", label: "DAX (Germany)" },
    { symbol: "^FCHI", label: "CAC 40 (France)" },
    { symbol: "^N225", label: "Nikkei (Japan)" },
    { symbol: "^HSI", label: "Hang Seng (HK)" },
    { symbol: "^AXJO", label: "ASX 200 (AU)" },
    { symbol: "^BSESN", label: "Sensex (India)" },
    { symbol: "^KS11", label: "KOSPI (Korea)" },
  ],
  assets: [
    { symbol: "GLD", label: "Gold" },
    { symbol: "SLV", label: "Silver" },
    { symbol: "USO", label: "Crude Oil" },
    { symbol: "TLT", label: "US Bonds 20Y" },
    { symbol: "^TNX", label: "10Y Treasury" },
    { symbol: "BTC-USD", label: "Bitcoin" },
    { symbol: "ETH-USD", label: "Ethereum" },
    { symbol: "PDBC", label: "Commodities" },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Sanitize symbol for use as object key (recharts breaks on ^ and - characters) */
function safeKey(sym: string): string {
  return sym.replace(/[^a-zA-Z0-9_]/g, "_")
}

/** Fetch historical weekly data from Yahoo Finance */
async function fetchHistory(
  symbol: string
): Promise<{ date: string; close: number }[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1wk&range=5y`

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`[fetchHistory] ${symbol} HTTP ${res.status}`)
      return []
    }

    const json = await res.json()

    // Check for API errors
    if (json?.chart?.error) {
      console.error(`[fetchHistory] ${symbol} API error:`, json.chart.error)
      return []
    }

    const result = json?.chart?.result?.[0]
    if (!result) {
      console.error(`[fetchHistory] ${symbol} no result in response`)
      return []
    }

    const timestamps: number[] = result.timestamp ?? []
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []

    const data = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        close: closes[i],
      }))
      .filter((d) => d.close != null && !isNaN(d.close) && isFinite(d.close))

    console.log(`[fetchHistory] ${symbol}: ${data.length} data points`)
    return data
  } catch (err) {
    console.error(`[fetchHistory] ${symbol} exception:`, err)
    return []
  }
}

/** Compute 1Y, 3Y, 5Y returns from history */
function computeReturns(history: { date: string; close: number }[]): {
  r1y: number | null
  r3y: number | null
  r5y: number | null
} {
  if (history.length < 2) {
    return { r1y: null, r3y: null, r5y: null }
  }

  const last = history[history.length - 1].close
  const lastDate = new Date(history[history.length - 1].date)

  const findCloseAtYearsBack = (yearsBack: number): number | null => {
    const target = new Date(lastDate)
    target.setFullYear(target.getFullYear() - yearsBack)

    // Find closest date in history within reasonable range (±30 days)
    let best: { date: string; close: number } | null = null
    let bestDiff = Infinity

    for (const h of history) {
      const diff = Math.abs(new Date(h.date).getTime() - target.getTime())
      // Only accept if within 30 days of target
      if (diff < bestDiff && diff < 30 * 24 * 60 * 60 * 1000) {
        bestDiff = diff
        best = h
      }
    }

    return best?.close ?? null
  }

  const pct = (base: number | null): number | null => {
    if (base == null || base === 0) return null
    return ((last - base) / base) * 100
  }

  // Require minimum data points for each period
  const weeksInYear = 52
  return {
    r1y: history.length >= weeksInYear * 0.8 ? pct(findCloseAtYearsBack(1)) : null,
    r3y: history.length >= weeksInYear * 2.5 ? pct(findCloseAtYearsBack(3)) : null,
    r5y: history.length >= weeksInYear * 4 ? pct(findCloseAtYearsBack(5)) : null,
  }
}

/** Normalize all series to base 100 and align to common dates */
function normalizeAndAlign(
  allHistory: Record<string, { date: string; close: number }[]>
): { date: string;[symbol: string]: number | string }[] {
  const symbols = Object.keys(allHistory)

  if (symbols.length === 0) {
    console.error("[normalizeAndAlign] No symbols with data")
    return []
  }

  // Filter out symbols with insufficient data (less than 10 points)
  const validSymbols = symbols.filter((sym) => allHistory[sym].length >= 10)

  if (validSymbols.length === 0) {
    console.error("[normalizeAndAlign] No symbols with sufficient data")
    return []
  }

  console.log(
    `[normalizeAndAlign] Processing ${validSymbols.length} symbols with sufficient data`
  )

  // Collect all unique dates from valid symbols, sorted
  const dateSet = new Set<string>()
  for (const sym of validSymbols) {
    for (const d of allHistory[sym]) {
      dateSet.add(d.date)
    }
  }
  const allDates = Array.from(dateSet).sort()

  if (allDates.length === 0) {
    console.error("[normalizeAndAlign] No dates found")
    return []
  }

  // Build lookup: symbol → date → close
  const lookup: Record<string, Record<string, number>> = {}
  for (const sym of validSymbols) {
    lookup[sym] = {}
    for (const d of allHistory[sym]) {
      lookup[sym][d.date] = d.close
    }
  }

  // Find start date where at least 50% of symbols have data
  const threshold = Math.max(1, Math.floor(validSymbols.length * 0.5))
  let startDate = allDates[0]

  for (const date of allDates) {
    const count = validSymbols.filter((sym) => lookup[sym][date] != null).length
    if (count >= threshold) {
      startDate = date
      break
    }
  }

  console.log(`[normalizeAndAlign] Start date: ${startDate}`)

  // Get base values for normalization (first available value on or after startDate)
  const bases: Record<string, number> = {}
  for (const sym of validSymbols) {
    for (const date of allDates) {
      if (date >= startDate && lookup[sym][date] != null) {
        bases[sym] = lookup[sym][date]
        break
      }
    }
    // Fallback: use earliest available value
    if (!bases[sym]) {
      const values = Object.values(lookup[sym])
      if (values.length > 0) {
        bases[sym] = values[0]
      }
    }
  }

  // Filter dates from startDate onward
  const dates = allDates.filter((d) => d >= startDate)

  // Build chart data with forward-fill for missing values
  const lastKnown: Record<string, number> = {}
  const chartData: { date: string;[key: string]: number | string }[] = []

  for (const date of dates) {
    const row: { date: string;[key: string]: number | string } = { date }
    let hasAnyValue = false

    for (const sym of validSymbols) {
      const close = lookup[sym][date]
      const base = bases[sym]

      if (close != null && base != null && base !== 0) {
        lastKnown[sym] = close
        row[safeKey(sym)] = parseFloat(((close / base) * 100).toFixed(2))
        hasAnyValue = true
      } else if (lastKnown[sym] != null && base != null && base !== 0) {
        // Forward-fill with last known value
        row[safeKey(sym)] = parseFloat(((lastKnown[sym] / base) * 100).toFixed(2))
        hasAnyValue = true
      }
    }

    if (hasAnyValue) {
      chartData.push(row)
    }
  }

  console.log(`[normalizeAndAlign] Generated ${chartData.length} chart data points`)
  return chartData
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN API HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get("tab") ?? "sectors"
  const items = TABS[tab] ?? TABS.sectors
  const cacheKey = `markets_comparison_${tab}`

  console.log(`[GET] Fetching data for tab: ${tab}`)

  // Check cache first
  try {
    const { data: cached } = await supabase
      .from("macro_cache")
      .select("data, fetched_at")
      .eq("id", cacheKey)
      .single()

    if (cached?.fetched_at && cached?.data) {
      const age = Date.now() - new Date(cached.fetched_at).getTime()
      // Verify cached data has actual chart points
      const hasValidData =
        cached.data.chartData &&
        Array.isArray(cached.data.chartData) &&
        cached.data.chartData.length > 10

      if (age < CACHE_MS && hasValidData) {
        console.log(`[GET] Returning cached data (age: ${Math.round(age / 1000 / 60)}min)`)
        return NextResponse.json({ ...cached.data, cached: true })
      }
    }
  } catch (cacheErr) {
    console.error("[GET] Cache read error:", cacheErr)
  }

  // Fetch fresh data
  try {
    console.log(`[GET] Fetching fresh data for ${items.length} symbols`)

    // Fetch all histories in parallel with small delays to avoid rate limiting
    const histories = await Promise.all(
      items.map(async (item, index) => {
        // Stagger requests slightly to avoid rate limiting
        if (index > 0) {
          await new Promise((r) => setTimeout(r, 100 * index))
        }
        return {
          symbol: item.symbol,
          history: await fetchHistory(item.symbol),
        }
      })
    )

    // Build history map
    const allHistory: Record<string, { date: string; close: number }[]> = {}
    let successCount = 0

    for (const { symbol, history } of histories) {
      if (history.length > 0) {
        allHistory[symbol] = history
        successCount++
      }
    }

    console.log(`[GET] Successfully fetched ${successCount}/${items.length} symbols`)

    if (successCount === 0) {
      console.error("[GET] No data fetched for any symbol")
      // Try to return stale cache
      const { data: staleCache } = await supabase
        .from("macro_cache")
        .select("data")
        .eq("id", cacheKey)
        .single()

      if (staleCache?.data) {
        return NextResponse.json({ ...staleCache.data, cached: true, stale: true })
      }

      return NextResponse.json(
        { error: "Failed to fetch market data", chartData: [], returns: [], items: [] },
        { status: 500 }
      )
    }

    // Generate normalized chart data
    const chartData = normalizeAndAlign(allHistory)

    // Compute returns for each symbol
    const returns = items.map((item) => ({
      symbol: item.symbol,
      safeKey: safeKey(item.symbol),
      label: item.label,
      ...computeReturns(allHistory[item.symbol] ?? []),
    }))

    // Add safeKey to items for frontend
    const itemsWithKeys = items.map((item) => ({
      ...item,
      safeKey: safeKey(item.symbol),
    }))

    const responseData = {
      chartData,
      returns,
      items: itemsWithKeys,
    }

    // Cache the result
    try {
      const fetchedAt = new Date().toISOString()
      await supabase.from("macro_cache").upsert({
        id: cacheKey,
        data: responseData,
        fetched_at: fetchedAt,
      })
      console.log(`[GET] Cached fresh data`)
    } catch (cacheWriteErr) {
      console.error("[GET] Cache write error:", cacheWriteErr)
    }

    return NextResponse.json({ ...responseData, cached: false })
  } catch (err) {
    console.error("[GET] Fatal error:", err)

    // Attempt to return stale cache on error
    try {
      const { data: staleCache } = await supabase
        .from("macro_cache")
        .select("data")
        .eq("id", cacheKey)
        .single()

      if (staleCache?.data) {
        return NextResponse.json({ ...staleCache.data, cached: true, stale: true })
      }
    } catch {
      // Ignore cache read error
    }

    return NextResponse.json(
      { error: String(err), chartData: [], returns: [], items: [] },
      { status: 500 }
    )
  }
}