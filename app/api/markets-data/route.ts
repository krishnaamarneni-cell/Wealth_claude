import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 60 * 60 * 1000 // 1 hour

// ── All symbols we need quotes for ──────────────────────────────────────────
const ALL_SYMBOLS = [
  // Indices
  "^GSPC", "^IXIC", "^DJI", "^FTSE", "^GDAXI", "^FCHI", "^N225", "^HSI", "^AXJO", "^BSESN",
  // Sectors (SPDR ETFs)
  "XLK", "XLV", "XLF", "XLE", "XLI", "XLY", "XLP", "XLB", "XLRE", "XLU", "XLC",
  // Asset classes
  "GLD", "SLV", "USO", "TLT", "BTC-USD", "ETH-USD", "^TNX",
].join(",")

async function fetchQuotes(): Promise<Record<string, unknown>> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ALL_SYMBOLS}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,regularMarketPreviousClose,shortName,longName,regularMarketVolume,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`)
  const json = await res.json()
  const result: Record<string, unknown> = {}
  for (const q of json?.quoteResponse?.result ?? []) {
    result[q.symbol] = {
      symbol: q.symbol,
      name: q.shortName ?? q.longName ?? q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePct: q.regularMarketChangePercent,
      prevClose: q.regularMarketPreviousClose,
      high52: q.fiftyTwoWeekHigh,
      low52: q.fiftyTwoWeekLow,
    }
  }
  return result
}

export async function GET() {
  const { data: cached } = await supabase
    .from("macro_cache")
    .select("data, fetched_at")
    .eq("id", "markets_quotes")
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && cached.data) {
      return NextResponse.json({ quotes: cached.data, cached: true })
    }
  }

  try {
    const quotes = await fetchQuotes()
    const fetchedAt = new Date().toISOString()
    await supabase.from("macro_cache").upsert({ id: "markets_quotes", data: quotes, fetched_at: fetchedAt })
    return NextResponse.json({ quotes, cached: false })
  } catch (err) {
    if (cached?.data) return NextResponse.json({ quotes: cached.data, cached: true, stale: true })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}