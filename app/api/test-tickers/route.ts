import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const TICKER_MAP: Record<string, string> = {
  "^GSPC": "USA", "^GSPTSE": "CAN", "^MXX": "MEX", "^BVSP": "BRA",
  "^MERV": "ARG", "^IPSA": "CHL", "^COLCAP": "COL", "^SPBLPGPT": "PER",
  "^FTSE": "GBR", "^GDAXI": "DEU", "^FCHI": "FRA", "FTSEMIB.MI": "ITA",
  "^IBEX": "ESP", "^AEX": "NLD", "^SSMI": "CHE", "^OMX": "SWE",
  "^OBX": "NOR", "^OMXC25": "DNK", "^OMXH25": "FIN", "^BFX": "BEL",
  "^ATX": "AUT", "^PSI20": "PRT", "^ATG": "GRC", "^WIG20": "POL",
  "^PX": "CZE", "^BUX": "HUN", "^BETI": "ROU", "^XU100": "TUR",
  "IMOEX.ME": "RUS", "^CROBEX": "HRV", "SOFIX.SO": "BGR",
  "^OMXT": "EST", "^OMXR": "LVA", "^OMXV": "LTU",
  "^BELEX15": "SRB", "^SBITOP": "SVN",
  "^N225": "JPN", "000001.SS": "CHN", "^HSI": "HKG", "^NSEI": "IND",
  "^KS11": "KOR", "^AXJO": "AUS", "^NZ50": "NZL", "^TWII": "TWN",
  "^STI": "SGP", "^KLSE": "MYS", "^SET.BK": "THA", "^JKSE": "IDN",
  "PSEI.PS": "PHL", "^VNINDEX": "VNM", "^KSE100": "PAK",
  "^DSEX": "BGD", "^CSEALL": "LKA", "^KASE": "KAZ",
  "^TASI.SR": "SAU", "^DFMGI": "ARE", "^TA125.TA": "ISR",
  "^J203.JO": "ZAF", "^CASE30": "EGY", "^NGSEINDEX": "NGA",
  "^NSE20": "KEN", "^QSI": "QAT", "^KWSE": "KWT", "^MASI.CS": "MAR",
  "^MSM30": "OMN", "^BHSEASI": "BHR", "^AMGNRLX": "JOR",
  "^SEMDEX": "MUS", "^GGSECI": "GHA", "TUNINDEX.TN": "TUN",
}

async function testTicker(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) return { ok: false, reason: "No meta in response" }
    if (!meta.regularMarketPrice) return { ok: false, reason: "No price" }
    return {
      ok: true,
      price: meta.regularMarketPrice,
      currency: meta.currency,
      name: meta.shortName,
    }
  } catch (e: any) {
    return { ok: false, reason: e.message ?? "Unknown error" }
  }
}

export async function GET() {
  const tickers = Object.keys(TICKER_MAP)
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const result = await testTicker(ticker)
      return {
        ticker,
        country: TICKER_MAP[ticker],
        ...result,
      }
    })
  )

  const working = results.filter(r => r.ok)
  const broken = results.filter(r => !r.ok)

  return NextResponse.json({
    summary: {
      total: tickers.length,
      working: working.length,
      broken: broken.length,
    },
    working: working.map(r => ({ ticker: r.ticker, country: r.country, price: (r as any).price, name: (r as any).name })),
    broken: broken.map(r => ({ ticker: r.ticker, country: r.country, reason: (r as any).reason })),
  }, { headers: { "Cache-Control": "no-store" } })
}