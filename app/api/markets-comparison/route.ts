import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ─────────────────────────────────────────────────────────────────────────────
// TICKER CONFIGURATIONS BY TAB
// ─────────────────────────────────────────────────────────────────────────────

// 51 country indices — verified working with Yahoo Finance
const COUNTRIES_CONFIG: { symbol: string; label: string; region: string }[] = [
  // ── Americas ────────────────────────────────────────────
  { symbol: "^GSPC", label: "United States", region: "Americas" },
  { symbol: "^GSPTSE", label: "Canada", region: "Americas" },
  { symbol: "^MXX", label: "Mexico", region: "Americas" },
  { symbol: "^BVSP", label: "Brazil", region: "Americas" },
  { symbol: "^MERV", label: "Argentina", region: "Americas" },
  { symbol: "^IPSA", label: "Chile", region: "Americas" },
  { symbol: "^SPCOSLCP", label: "Colombia", region: "Americas" },
  { symbol: "^SPBLPGPT", label: "Peru", region: "Americas" },

  // ── Europe ──────────────────────────────────────────────
  { symbol: "^FTSE", label: "United Kingdom", region: "Europe" },
  { symbol: "^GDAXI", label: "Germany", region: "Europe" },
  { symbol: "^FCHI", label: "France", region: "Europe" },
  { symbol: "FTSEMIB.MI", label: "Italy", region: "Europe" },
  { symbol: "^IBEX", label: "Spain", region: "Europe" },
  { symbol: "^AEX", label: "Netherlands", region: "Europe" },
  { symbol: "^SSMI", label: "Switzerland", region: "Europe" },
  { symbol: "^OMX", label: "Sweden", region: "Europe" },
  { symbol: "OSEBX.OL", label: "Norway", region: "Europe" },
  { symbol: "^OMXC25", label: "Denmark", region: "Europe" },
  { symbol: "^OMXH25", label: "Finland", region: "Europe" },
  { symbol: "^BFX", label: "Belgium", region: "Europe" },
  { symbol: "^ATX", label: "Austria", region: "Europe" },
  { symbol: "PSI20.LS", label: "Portugal", region: "Europe" },
  { symbol: "GD.AT", label: "Greece", region: "Europe" },
  { symbol: "WIG20.WA", label: "Poland", region: "Europe" },
  { symbol: "FPXAA.PR", label: "Czech Republic", region: "Europe" },
  { symbol: "^BUX.BD", label: "Hungary", region: "Europe" },
  { symbol: "^BET.RO", label: "Romania", region: "Europe" },
  { symbol: "^XU100", label: "Turkey", region: "Europe" },
  { symbol: "IMOEX.ME", label: "Russia", region: "Europe" },
  { symbol: "^OMXT", label: "Estonia", region: "Europe" },
  { symbol: "^OMXR", label: "Latvia", region: "Europe" },
  { symbol: "^OMXV", label: "Lithuania", region: "Europe" },

  // ── Asia-Pacific ────────────────────────────────────────
  { symbol: "^N225", label: "Japan", region: "Asia-Pacific" },
  { symbol: "000001.SS", label: "China", region: "Asia-Pacific" },
  { symbol: "^HSI", label: "Hong Kong", region: "Asia-Pacific" },
  { symbol: "^NSEI", label: "India", region: "Asia-Pacific" },
  { symbol: "^KS11", label: "South Korea", region: "Asia-Pacific" },
  { symbol: "^AXJO", label: "Australia", region: "Asia-Pacific" },
  { symbol: "^NZ50", label: "New Zealand", region: "Asia-Pacific" },
  { symbol: "^TWII", label: "Taiwan", region: "Asia-Pacific" },
  { symbol: "^STI", label: "Singapore", region: "Asia-Pacific" },
  { symbol: "^KLSE", label: "Malaysia", region: "Asia-Pacific" },
  { symbol: "^SET.BK", label: "Thailand", region: "Asia-Pacific" },
  { symbol: "^JKSE", label: "Indonesia", region: "Asia-Pacific" },
  { symbol: "PSEI.PS", label: "Philippines", region: "Asia-Pacific" },
  { symbol: "^VNINDEX.VN", label: "Vietnam", region: "Asia-Pacific" },

  // ── Middle East & Africa ────────────────────────────────
  { symbol: "^TASI.SR", label: "Saudi Arabia", region: "Middle East & Africa" },
  { symbol: "FADGI.FGI", label: "UAE", region: "Middle East & Africa" },
  { symbol: "^TA125.TA", label: "Israel", region: "Middle East & Africa" },
  { symbol: "^J203.JO", label: "South Africa", region: "Middle East & Africa" },
  { symbol: "^CASE30", label: "Egypt", region: "Middle East & Africa" },
]

// Sectors (existing)
const SECTORS_CONFIG: { symbol: string; label: string }[] = [
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
]

// Asset classes (existing)
const ASSETS_CONFIG: { symbol: string; label: string }[] = [
  { symbol: "GLD", label: "Gold" },
  { symbol: "SLV", label: "Silver" },
  { symbol: "USO", label: "Crude Oil" },
  { symbol: "TLT", label: "US Bonds 20Y" },
  { symbol: "BTC-USD", label: "Bitcoin" },
  { symbol: "ETH-USD", label: "Ethereum" },
  { symbol: "PDBC", label: "Commodities" },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Sanitize symbol for use as object key (recharts breaks on special chars) */
function safeKey(sym: string): string {
  return sym.replace(/[^a-zA-Z0-9_]/g, "_")
}

/** Fetch 5-year weekly history from Yahoo Finance */
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
      },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`[fetchHistory] ${symbol} HTTP ${res.status}`)
      return []
    }

    const json = await res.json()

    if (json?.chart?.error) {
      console.error(`[fetchHistory] ${symbol} API error:`, json.chart.error)
      return []
    }

    const result = json?.chart?.result?.[0]
    if (!result) {
      console.error(`[fetchHistory] ${symbol} no result`)
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

    console.log(`[fetchHistory] ${symbol}: ${data.length} points`)
    return data
  } catch (err) {
    console.error(`[fetchHistory] ${symbol} error:`, err)
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

    let best: { date: string; close: number } | null = null
    let bestDiff = Infinity

    for (const h of history) {
      const diff = Math.abs(new Date(h.date).getTime() - target.getTime())
      if (diff < bestDiff && diff < 45 * 24 * 60 * 60 * 1000) {
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

  if (symbols.length === 0) return []

  const validSymbols = symbols.filter((sym) => allHistory[sym].length >= 10)
  if (validSymbols.length === 0) return []

  const dateSet = new Set<string>()
  for (const sym of validSymbols) {
    for (const d of allHistory[sym]) {
      dateSet.add(d.date)
    }
  }
  const allDates = Array.from(dateSet).sort()
  if (allDates.length === 0) return []

  const lookup: Record<string, Record<string, number>> = {}
  for (const sym of validSymbols) {
    lookup[sym] = {}
    for (const d of allHistory[sym]) {
      lookup[sym][d.date] = d.close
    }
  }

  const threshold = Math.max(1, Math.floor(validSymbols.length * 0.3))
  let startDate = allDates[0]

  for (const date of allDates) {
    const count = validSymbols.filter((sym) => lookup[sym][date] != null).length
    if (count >= threshold) {
      startDate = date
      break
    }
  }

  const bases: Record<string, number> = {}
  for (const sym of validSymbols) {
    for (const date of allDates) {
      if (date >= startDate && lookup[sym][date] != null) {
        bases[sym] = lookup[sym][date]
        break
      }
    }
    if (!bases[sym]) {
      const values = Object.values(lookup[sym])
      if (values.length > 0) bases[sym] = values[0]
    }
  }

  const dates = allDates.filter((d) => d >= startDate)
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
        row[safeKey(sym)] = parseFloat(((lastKnown[sym] / base) * 100).toFixed(2))
        hasAnyValue = true
      }
    }

    if (hasAnyValue) chartData.push(row)
  }

  return chartData
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN API HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get("tab") ?? "countries"
  const cacheKey = `markets_comparison_${tab}`

  console.log(`[GET] Tab: ${tab}`)

  // Determine items based on tab
  let items: { symbol: string; label: string; region?: string }[]
  if (tab === "countries") {
    items = COUNTRIES_CONFIG
  } else if (tab === "sectors") {
    items = SECTORS_CONFIG
  } else if (tab === "assets") {
    items = ASSETS_CONFIG
  } else {
    items = COUNTRIES_CONFIG
  }

  // Check cache using a simple hash of the cache key to get an integer ID
  const cacheKeyHash = cacheKey
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  try {
    const { data: cached } = await supabase
      .from("macro_cache")
      .select("data, fetched_at")
      .eq("cache_key", cacheKey)
      .single()

    if (cached?.fetched_at && cached?.data) {
      const age = Date.now() - new Date(cached.fetched_at).getTime()
      const hasValidData =
        cached.data.returns &&
        Array.isArray(cached.data.returns) &&
        cached.data.returns.length > 5

      if (age < CACHE_MS && hasValidData) {
        console.log(`[GET] Cache hit (age: ${Math.round(age / 1000 / 60 / 60)}h)`)
        return NextResponse.json({ ...cached.data, cached: true })
      }
    }
  } catch (err) {
    console.error("[GET] Cache read error:", err)
  }

  // Fetch fresh data
  try {
    console.log(`[GET] Fetching ${items.length} symbols...`)

    // Fetch with staggered delays to avoid rate limiting
    const histories = await Promise.all(
      items.map(async (item, index) => {
        // Stagger requests: 150ms between each
        if (index > 0) {
          await new Promise((r) => setTimeout(r, 150 * index))
        }
        return {
          symbol: item.symbol,
          label: item.label,
          region: (item as any).region,
          history: await fetchHistory(item.symbol),
        }
      })
    )

    // Build history map (skip failed fetches)
    const allHistory: Record<string, { date: string; close: number }[]> = {}
    const validItems: typeof items = []

    for (const { symbol, label, region, history } of histories) {
      if (history.length > 0) {
        allHistory[symbol] = history
        validItems.push({ symbol, label, region })
      }
    }

    console.log(`[GET] Got data for ${validItems.length}/${items.length} symbols`)

    if (validItems.length === 0) {
      // Return stale cache if available
      const { data: staleCache } = await supabase
        .from("macro_cache")
        .select("data")
        .eq("cache_key", cacheKey)
        .single()

      if (staleCache?.data) {
        return NextResponse.json({ ...staleCache.data, cached: true, stale: true })
      }

      return NextResponse.json(
        { error: "No data fetched", chartData: [], returns: [], items: [] },
        { status: 500 }
      )
    }

    // Generate chart data (only for sectors/assets, not countries)
    const chartData = tab === "countries" ? [] : normalizeAndAlign(allHistory)

    // Compute returns
    const returns = validItems.map((item) => ({
      symbol: item.symbol,
      safeKey: safeKey(item.symbol),
      label: item.label,
      region: (item as any).region ?? null,
      ...computeReturns(allHistory[item.symbol] ?? []),
    }))

    const itemsWithKeys = validItems.map((item) => ({
      symbol: item.symbol,
      safeKey: safeKey(item.symbol),
      label: item.label,
      region: (item as any).region ?? null,
    }))

    const responseData = {
      chartData,
      returns,
      items: itemsWithKeys,
    }

    // Cache the result
    try {
      await supabase.from("macro_cache").upsert({
        cache_key: cacheKey,
        data: responseData,
        fetched_at: new Date().toISOString(),
      })
      console.log(`[GET] Cached fresh data`)
    } catch (err) {
      console.error("[GET] Cache write error:", err)
    }

    return NextResponse.json({ ...responseData, cached: false })
  } catch (err) {
    console.error("[GET] Fatal error:", err)

    // Return stale cache on error
    try {
      const { data: staleCache } = await supabase
        .from("macro_cache")
        .select("data")
        .eq("cache_key", cacheKey)
        .single()

      if (staleCache?.data) {
        return NextResponse.json({ ...staleCache.data, cached: true, stale: true })
      }
    } catch {
      // Ignore
    }

    return NextResponse.json(
      { error: String(err), chartData: [], returns: [], items: [] },
      { status: 500 }
    )
  }
}
