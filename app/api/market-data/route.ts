import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

// All 56 tickers mapped to country ISO codes
const TICKER_MAP: Record<string, string> = {
  "^GSPC": "USA", "^FTSE": "GBR", "^GDAXI": "DEU", "^FCHI": "FRA",
  "^N225": "JPN", "^HSI": "HKG", "000001.SS": "CHN", "^BSESN": "IND",
  "^AXJO": "AUS", "^BVSP": "BRA", "^MXX": "MEX", "^GSPTSE": "CAN",
  "^KS11": "KOR", "^TWII": "TWN", "^STI": "SGP", "^KLSE": "MYS",
  "^JKSE": "IDN", "^SET": "THA", "^NZ50": "NZL", "^PSI": "PRT",
  "^IBEX": "ESP", "^AEX": "NLD", "^BFX": "BEL", "^SMI": "CHE",
  "^OSEAX": "NOR", "^OMXS30": "SWE", "^OMXC25": "DNK", "^OMXH25": "FIN",
  "^ATX": "AUT", "^WIG20": "POL", "^PX": "CZE", "^BUX": "HUN",
  "^XU100": "TUR", "^TA125": "ISR", "^TASI": "SAU", "^ADX": "ARE",
  "^QSI": "QAT", "^KWS": "KWT", "^CASE30": "EGY", "^MASI": "MAR",
  "^NGSEINDEX": "NGA", "^NSEI": "IND", "^JSE": "ZAF", "^MERV": "ARG",
  "^IPSA": "CHL", "^COLCAP": "COL", "^SP500": "PER", "^IBC": "VEN",
  "^VNINDEX": "VNM", "^PSEI": "PHL", "^CSE": "LKA", "^DSE": "BGD",
  "^PSX": "PAK", "^MSE": "MNG",
}

export async function GET() {
  try {
    const yahooFinance = (await import("yahoo-finance2")).default
    console.log("yahoo-finance2 loaded:", !!yahooFinance)

    // Test with just one ticker first
    try {
      const test = await yahooFinance.quote("^GSPC")
      console.log("Test quote result:", JSON.stringify(test?.regularMarketPrice))
    } catch (testErr: any) {
      console.error("Test quote failed:", testErr?.message)
      return NextResponse.json({ error: testErr?.message, data: {}, fetchedAt: new Date().toISOString(), count: 0 })
    }

    const tickers = Object.keys(TICKER_MAP)
    const results: Record<string, any> = {}

    // Fetch in batches of 10 to avoid rate limiting
    const BATCH_SIZE = 10
    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        batch.map(async (ticker) => {
          try {
            const quote = await yahooFinance.quote(ticker)
            const iso = TICKER_MAP[ticker]
            if (quote && iso) {
              results[iso] = {
                ticker,
                countryCode: iso,
                indexName: quote.shortName ?? quote.longName ?? ticker,
                exchange: quote.fullExchangeName ?? "",
                currency: quote.currency ?? "USD",
                price: quote.regularMarketPrice ?? 0,
                change: quote.regularMarketChange ?? 0,
                changePct: quote.regularMarketChangePercent ?? 0,
                previousClose: quote.regularMarketPreviousClose ?? 0,
                lastUpdated: new Date().toISOString(),
                isOpen: quote.marketState === "REGULAR",
              }
            }
          } catch (err: any) {
            console.error(`Failed ticker ${ticker}:`, err?.message)
          }
        })
      )
      // Small delay between batches
      if (i + BATCH_SIZE < tickers.length) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    return NextResponse.json({
      data: results,
      fetchedAt: new Date().toISOString(),
      count: Object.keys(results).length,
    }, {
      headers: {
        // Cache for 30 minutes on CDN
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      }
    })

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message, data: {} },
      { status: 500 }
    )
  }
}