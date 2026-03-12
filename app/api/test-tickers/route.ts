import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const ALTERNATIVES: Record<string, string> = {
  "FPXAA.PR": "CZE",  // PX Index Prague
  "^BUX.BD": "HUN",  // Budapest Stock Index (with ^ this time)
  "^BET.RO": "ROU",  // BET Bucharest (with ^ this time)
  "^VNINDEX.VN": "VNM",  // VN-Index Vietnam
  "FADGI.FGI": "ARE",  // FTSE ADX General Index
  "^SPCOSLCP": "COL",  // S&P Colombia Select
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
    if (!meta) return { ok: false, reason: "No meta" }
    if (!meta.regularMarketPrice) return { ok: false, reason: "No price" }
    return { ok: true, price: meta.regularMarketPrice, name: meta.shortName ?? meta.longName }
  } catch (e: any) {
    return { ok: false, reason: e.message ?? "Timeout" }
  }
}

export async function GET() {
  const results = await Promise.all(
    Object.entries(ALTERNATIVES).map(async ([ticker, country]) => {
      const r = await testTicker(ticker)
      return { ticker, country, ...r }
    })
  )

  const working = results.filter(r => r.ok)
  const broken = results.filter(r => !r.ok)

  return NextResponse.json({
    summary: { total: results.length, working: working.length, broken: broken.length },
    working,
    broken,
  }, { headers: { "Cache-Control": "no-store" } })
}