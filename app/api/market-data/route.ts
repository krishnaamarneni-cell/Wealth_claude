import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 45

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 60 * 60 * 1000 // 1 hour

// Single source of truth — ticker → ISO3 country code
// Fixes: ISR, NOR, SWE, ZAF, LKA, VNM (wrong symbols)
// Fixes: IND duplicate (removed ^BSESN, kept ^NSEI)
// Added: COL, PER, ITA, ROU, TUR, RUS, THA, PRT, GRC, PAK, BGD, NGA, KEN, QAT, KWT, MAR
// Added: HRV, BGR, EST, LVA, LTU, SRB, SVN, KAZ, OMN, BHR, JOR, MUS, GHA, TUN
const TICKER_MAP: Record<string, string> = {
  // ── Americas ────────────────────────────────────────────
  "^GSPC": "USA",
  "^GSPTSE": "CAN",
  "^MXX": "MEX",
  "^BVSP": "BRA",
  "^MERV": "ARG",
  "^IPSA": "CHL",
  "^COLCAP": "COL",
  "^SPBLPGPT": "PER",

  // ── Europe ──────────────────────────────────────────────
  "^FTSE": "GBR",
  "^GDAXI": "DEU",
  "^FCHI": "FRA",
  "FTSEMIB.MI": "ITA",
  "^IBEX": "ESP",
  "^AEX": "NLD",
  "^SSMI": "CHE",
  "^OMX": "SWE",   // was ^OMXS30 (wrong)
  "^OBX": "NOR",   // was ^OSEAX (wrong)
  "^OMXC25": "DNK",
  "^OMXH25": "FIN",
  "^BFX": "BEL",
  "^ATX": "AUT",
  "^PSI20": "PRT",
  "^ATG": "GRC",
  "^WIG20": "POL",
  "^PX": "CZE",
  "^BUX": "HUN",
  "^BETI": "ROU",
  "^XU100": "TUR",
  "IMOEX.ME": "RUS",
  "^CROBEX": "HRV",
  "SOFIX.SO": "BGR",
  "^OMXT": "EST",
  "^OMXR": "LVA",
  "^OMXV": "LTU",
  "^BELEX15": "SRB",
  "^SBITOP": "SVN",

  // ── Asia-Pacific ────────────────────────────────────────
  "^N225": "JPN",
  "000001.SS": "CHN",
  "^HSI": "HKG",
  "^NSEI": "IND",   // was duplicated with ^BSESN — removed duplicate
  "^KS11": "KOR",
  "^AXJO": "AUS",
  "^NZ50": "NZL",
  "^TWII": "TWN",
  "^STI": "SGP",
  "^KLSE": "MYS",
  "^SET.BK": "THA",
  "^JKSE": "IDN",
  "PSEI.PS": "PHL",
  "^VNINDEX": "VNM",   // was ^VNINDEX.VN (wrong)
  "^KSE100": "PAK",
  "^DSEX": "BGD",
  "^CSEALL": "LKA",   // was ^SPLK20LP (wrong)
  "^KASE": "KAZ",

  // ── Middle East & Africa ────────────────────────────────
  "^TASI.SR": "SAU",
  "^DFMGI": "ARE",
  "^TA125.TA": "ISR",   // was TA35.TA (wrong)
  "^J203.JO": "ZAF",   // was ^J200.JO (wrong)
  "^CASE30": "EGY",
  "^NGSEINDEX": "NGA",
  "^NSE20": "KEN",
  "^QSI": "QAT",
  "^KWSE": "KWT",
  "^MASI.CS": "MAR",
  "^MSM30": "OMN",
  "^BHSEASI": "BHR",
  "^AMGNRLX": "JOR",
  "^SEMDEX": "MUS",
  "^GGSECI": "GHA",
  "TUNINDEX.TN": "TUN",
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
      } catch {
        // silently skip — country won't appear on globe
      }
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

  // 2. Cache stale or empty — fetch fresh
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