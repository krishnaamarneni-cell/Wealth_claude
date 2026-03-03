import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 60 * 60 * 1000 // 1 hour

const TICKER_MAP: Record<string, string> = {
  // Americas
  "^GSPC": "USA",
  "^GSPTSE": "CAN",
  "^BVSP": "BRA",
  "^MXX": "MEX",
  "^MERV": "ARG",
  "^IPSA": "CHL",

  // Europe
  "^FTSE": "GBR",
  "^GDAXI": "DEU",
  "^FCHI": "FRA",
  "^IBEX": "ESP",
  "^AEX": "NLD",
  "^BFX": "BEL",
  "^SSMI": "CHE",
  "^OSEAX": "NOR",
  "^OMXS30": "SWE",
  "^OMXC25": "DNK",
  "^OMXH25": "FIN",
  "^ATX": "AUT",
  "^WIG20": "POL",
  "^PX": "CZE",
  "^BUX": "HUN",

  // Middle East & Africa
  "TA35.TA": "ISR",
  "^TASI.SR": "SAU",
  "^DFMGI": "ARE",
  "^CASE30": "EGY",
  "^J200.JO": "ZAF",
  "^SPLK20LP": "LKA",

  // Asia Pacific
  "^N225": "JPN",
  "^HSI": "HKG",
  "000001.SS": "CHN",
  "^BSESN": "IND",
  "^AXJO": "AUS",
  "^KS11": "KOR",
  "^TWII": "TWN",
  "^STI": "SGP",
  "^KLSE": "MYS",
  "^JKSE": "IDN",
  "^VNINDEX.VN": "VNM",
  "PSEI.PS": "PHL",
  "^NZ50": "NZL",
  "^NSEI": "IND",
}

async function fetchQuote(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta
  if (!meta) throw new Error("No meta")
  return {
    price: meta.regularMarketPrice ?? 0,
    previousClose: meta.chartPreviousClose ?? meta.previousClose ?? 0,
    currency: meta.currency ?? "USD",
    exchange: meta.exchangeName ?? "",
    shortName: meta.shortName ?? ticker,
  }
}

async function fetchFreshData() {
  const results: Record<string, any> = {}
  const tickers = Object.keys(TICKER_MAP)

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const q = await fetchQuote(ticker)
        const iso = TICKER_MAP[ticker]
        const change = q.price - q.previousClose
        const changePct = q.previousClose ? (change / q.previousClose) * 100 : 0
        results[iso] = {
          ticker,
          countryCode: iso,
          indexName: q.shortName,
          exchange: q.exchange,
          currency: q.currency,
          price: q.price,
          change,
          changePct,
          previousClose: q.previousClose,
          lastUpdated: new Date().toISOString(),
          isOpen: true,
        }
      } catch { /* skip */ }
    })
  )
  return results
}

export async function GET() {
  // 1. Check Supabase cache first
  const { data: cached } = await supabase
    .from("market_cache")
    .select("data, fetched_at")
    .eq("id", 1)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && Object.keys(cached.data).length > 0) {
      // Return cached data instantly
      return NextResponse.json({
        data: cached.data,
        fetchedAt: cached.fetched_at,
        count: Object.keys(cached.data).length,
        cached: true,
      }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
      })
    }
  }

  // 2. Cache stale or empty — fetch fresh from Yahoo
  const data = await fetchFreshData()
  const fetchedAt = new Date().toISOString()

  // 3. Save to Supabase
  await supabase
    .from("market_cache")
    .upsert({ id: 1, data, fetched_at: fetchedAt })

  return NextResponse.json({
    data,
    fetchedAt,
    count: Object.keys(data).length,
    cached: false,
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
  })
}