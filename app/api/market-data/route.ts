import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 45

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 60 * 60 * 1000 // 1 hour

// 51 tickers — all verified working against Yahoo Finance 2026-03
const TICKER_MAP: Record<string, string> = {
  // ── Americas ────────────────────────────────────────────
  "^GSPC": "USA",
  "^GSPTSE": "CAN",
  "^MXX": "MEX",
  "^BVSP": "BRA",
  "^MERV": "ARG",
  "^IPSA": "CHL",
  "^SPCOSLCP": "COL",
  "^SPBLPGPT": "PER",

  // ── Europe ──────────────────────────────────────────────
  "^FTSE": "GBR",
  "^GDAXI": "DEU",
  "^FCHI": "FRA",
  "FTSEMIB.MI": "ITA",
  "^IBEX": "ESP",
  "^AEX": "NLD",
  "^SSMI": "CHE",
  "^OMX": "SWE",
  "OSEBX.OL": "NOR",
  "^OMXC25": "DNK",
  "^OMXH25": "FIN",
  "^BFX": "BEL",
  "^ATX": "AUT",
  "PSI20.LS": "PRT",
  "GD.AT": "GRC",
  "WIG20.WA": "POL",
  "FPXAA.PR": "CZE",
  "^BUX.BD": "HUN",
  "^BET.RO": "ROU",
  "^XU100": "TUR",
  "IMOEX.ME": "RUS",
  "^OMXT": "EST",
  "^OMXR": "LVA",
  "^OMXV": "LTU",

  // ── Asia-Pacific ────────────────────────────────────────
  "^N225": "JPN",
  "000001.SS": "CHN",
  "^HSI": "HKG",
  "^NSEI": "IND",
  "^KS11": "KOR",
  "^AXJO": "AUS",
  "^NZ50": "NZL",
  "^TWII": "TWN",
  "^STI": "SGP",
  "^KLSE": "MYS",
  "^SET.BK": "THA",
  "^JKSE": "IDN",
  "PSEI.PS": "PHL",
  "^VNINDEX.VN": "VNM",

  // ── Middle East & Africa ────────────────────────────────
  "^TASI.SR": "SAU",
  "FADGI.FGI": "ARE",
  "^TA125.TA": "ISR",
  "^J203.JO": "ZAF",
  "^CASE30": "EGY",
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

  await Promise.allSettled(
    Object.entries(TICKER_MAP).map(async ([ticker, iso]) => {
      try {
        const q = await fetchQuote(ticker)
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
      } catch {
        // silently skip — country stays gray on globe
      }
    })
  )

  return results
}

export async function GET() {
  // 1. Check Supabase cache
  const { data: cached } = await supabase
    .from("market_cache")
    .select("data, fetched_at")
    .eq("id", 1)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && Object.keys(cached.data).length > 0) {
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

  // 2. Fetch fresh from Yahoo
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