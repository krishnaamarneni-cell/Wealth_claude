import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 6 * 60 * 60 * 1000 // 6 hours — historical data doesn't change fast

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

async function fetchHistory(symbol: string): Promise<{ date: string; close: number }[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=5y`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return []
  const json = await res.json()
  const timestamps: number[] = json?.chart?.result?.[0]?.timestamp ?? []
  const closes: number[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
  return timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] }))
    .filter(d => d.close != null && !isNaN(d.close))
}

function computeReturns(history: { date: string; close: number }[]) {
  if (history.length < 2) return { r1y: null, r3y: null, r5y: null }
  const last = history[history.length - 1].close
  const now = new Date(history[history.length - 1].date)

  const findClose = (yearsBack: number) => {
    const target = new Date(now)
    target.setFullYear(target.getFullYear() - yearsBack)
    // Find closest date in history
    let best = history[0]
    let bestDiff = Infinity
    for (const h of history) {
      const diff = Math.abs(new Date(h.date).getTime() - target.getTime())
      if (diff < bestDiff) { bestDiff = diff; best = h }
    }
    return best.close
  }

  const pct = (base: number) => ((last - base) / base) * 100

  return {
    r1y: history.length >= 52 ? pct(findClose(1)) : null,
    r3y: history.length >= 156 ? pct(findClose(3)) : null,
    r5y: history.length >= 260 ? pct(findClose(5)) : null,
  }
}

// Sanitize symbol for use as object key (recharts breaks on ^ characters)
function safeKey(sym: string): string { return sym.replace(/[^a-zA-Z0-9_]/g, "_") }

// Normalize all series to base 100 aligned to common dates
function normalizeAndAlign(
  allHistory: Record<string, { date: string; close: number }[]>
): { date: string;[symbol: string]: number | string }[] {
  // Collect all unique dates sorted
  const dateSet = new Set<string>()
  for (const h of Object.values(allHistory)) h.forEach(d => dateSet.add(d.date))
  const dates = Array.from(dateSet).sort()

  // Build lookup per symbol
  const lookup: Record<string, Record<string, number>> = {}
  for (const [sym, h] of Object.entries(allHistory)) {
    lookup[sym] = {}
    for (const d of h) lookup[sym][d.date] = d.close
  }

  // Find the earliest date where ALL symbols have data
  let startDate = ""
  for (const date of dates) {
    if (Object.keys(lookup).every(sym => lookup[sym][date] != null)) {
      startDate = date
      break
    }
  }
  if (!startDate) startDate = dates[0] ?? ""

  // Normalize each symbol to 100 at startDate
  const bases: Record<string, number> = {}
  for (const sym of Object.keys(lookup)) {
    bases[sym] = lookup[sym][startDate] ?? 1
  }

  // Build chart rows — only from startDate onward
  return dates
    .filter(date => date >= startDate)
    .map(date => {
      const row: { date: string;[key: string]: number | string } = { date }
      for (const sym of Object.keys(lookup)) {
        const close = lookup[sym][date]
        if (close != null) row[safeKey(sym)] = parseFloat(((close / bases[sym]) * 100).toFixed(2))
      }
      return row
    })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get("tab") ?? "sectors"
  const items = TABS[tab] ?? TABS.sectors
  const cacheKey = `markets_comparison_${tab}`

  const { data: cached } = await supabase
    .from("macro_cache")
    .select("data, fetched_at")
    .eq("id", cacheKey)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && cached.data) {
      return NextResponse.json({ ...cached.data, cached: true })
    }
  }

  try {
    // Fetch all histories in parallel
    const histories = await Promise.all(items.map(item => fetchHistory(item.symbol)))
    const allHistory: Record<string, { date: string; close: number }[]> = {}
    for (let i = 0; i < items.length; i++) {
      if (histories[i].length > 0) allHistory[items[i].symbol] = histories[i]
    }

    const chartData = normalizeAndAlign(allHistory)

    const returns = items.map(item => ({
      symbol: item.symbol,
      label: item.label,
      ...computeReturns(allHistory[item.symbol] ?? []),
    }))

    // Add safeKey to each item so the frontend can use it as recharts dataKey
    const itemsWithKeys = items.map(item => ({ ...item, safeKey: safeKey(item.symbol) }))
    const data = { chartData, returns, items: itemsWithKeys }
    const fetchedAt = new Date().toISOString()
    await supabase.from("macro_cache").upsert({ id: cacheKey, data, fetched_at: fetchedAt })

    return NextResponse.json({ ...data, cached: false })
  } catch (err) {
    if (cached?.data) return NextResponse.json({ ...cached.data, cached: true, stale: true })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}