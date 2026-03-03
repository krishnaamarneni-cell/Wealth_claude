import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const TICKER_MAP: Record<string, string> = {
  "^GSPC": "USA", "^FTSE": "GBR", "^GDAXI": "DEU", "^FCHI": "FRA",
  "^N225": "JPN", "^HSI": "HKG", "000001.SS": "CHN", "^BSESN": "IND",
  "^AXJO": "AUS", "^BVSP": "BRA", "^MXX": "MEX", "^GSPTSE": "CAN",
  "^KS11": "KOR", "^TWII": "TWN", "^STI": "SGP", "^KLSE": "MYS",
  "^JKSE": "IDN", "^SET": "THA", "^NZ50": "NZL", "^IBEX": "ESP",
  "^AEX": "NLD", "^BFX": "BEL", "^SMI": "CHE", "^OSEAX": "NOR",
  "^OMXS30": "SWE", "^OMXC25": "DNK", "^OMXH25": "FIN", "^ATX": "AUT",
  "^WIG20": "POL", "^XU100": "TUR", "^TA125": "ISR", "^TASI": "SAU",
  "^CASE30": "EGY", "^MASI": "MAR", "^NSEI": "IND", "^MERV": "ARG",
  "^IPSA": "CHL", "^COLCAP": "COL", "^VNINDEX": "VNM", "^PSEI": "PHL",
  "^PSX": "PAK", "^JSE40": "ZAF",
}

async function fetchQuote(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json",
    },
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

export async function GET() {
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

  return NextResponse.json({
    data: results,
    fetchedAt: new Date().toISOString(),
    count: Object.keys(results).length,
  }, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" }
  })
}