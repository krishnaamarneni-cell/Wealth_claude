import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const TICKER_MAP: Record<string, string> = {
  // Americas
  "^GSPC": "USA", // S&P 500
  "^GSPTSE": "CAN", // TSX
  "^BVSP": "BRA", // Bovespa
  "^MXX": "MEX", // IPC
  "^MERV": "ARG", // MERVAL
  "^IPSA": "CHL", // IPSA
  "^COLCAP": "COL", // COLCAP

  // Europe
  "^FTSE": "GBR", // FTSE 100
  "^GDAXI": "DEU", // DAX
  "^FCHI": "FRA", // CAC 40
  "^IBEX": "ESP", // IBEX 35
  "^AEX": "NLD", // AEX
  "^BFX": "BEL", // BEL 20
  "^SMI": "CHE", // SMI
  "^OSEAX": "NOR", // Oslo
  "^OMXS30": "SWE", // OMX Stockholm
  "^OMXC25": "DNK", // OMX Copenhagen
  "^OMXH25": "FIN", // OMX Helsinki
  "^ATX": "AUT", // ATX
  "^WIG20": "POL", // WIG20
  "^PX": "CZE", // Prague
  "^BUX": "HUN", // Budapest

  // Middle East & Africa
  "TA35.TA": "ISR", // Tel Aviv 35
  "^TASI.SR": "SAU", // Tadawul Saudi
  "^DFMGI": "ARE", // Dubai
  "^CASE30": "EGY", // EGX 30
  "^J200.JO": "ZAF", // JSE Top 40
  "^SPLK20LP": "LKA", // S&P Sri Lanka 20

  // Asia Pacific
  "^N225": "JPN", // Nikkei 225
  "^HSI": "HKG", // Hang Seng
  "000001.SS": "CHN", // Shanghai
  "^BSESN": "IND", // BSE Sensex
  "^AXJO": "AUS", // ASX 200
  "^KS11": "KOR", // KOSPI
  "^TWII": "TWN", // TAIEX
  "^STI": "SGP", // STI
  "^KLSE": "MYS", // KLCI
  "^JKSE": "IDN", // IDX
  "^VNINDEX": "VNM", // VN-Index
  "^PSEI": "PHL", // PSEi
  "^NZ50": "NZL", // NZX 50
  "^PSI20": "PRT", // PSI 20 Portugal
  "^KSE100": "PAK", // KSE 100 Pakistan
  "^NSEI": "IND", // Nifty 50
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