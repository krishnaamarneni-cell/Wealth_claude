import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.FMP_API_KEY || ""
const BASE = "https://financialmodelingprep.com/api/v3"

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 })

  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`${BASE}/quote/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: 60 } }),
      fetch(`${BASE}/profile/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: 3600 } }),
    ])
    const [quoteData, profileData] = await Promise.all([quoteRes.json(), profileRes.json()])

    const q = Array.isArray(quoteData) ? quoteData[0] : null
    const p = Array.isArray(profileData) ? profileData[0] : null

    if (!q) return NextResponse.json({ error: "Symbol not found" }, { status: 404 })

    return NextResponse.json({
      symbol: q.symbol,
      name: p?.companyName || q.name || symbol,
      price: q.price,
      change: q.change,
      changePercent: q.changesPercentage,
      open: q.open,
      high: q.dayHigh,
      low: q.dayLow,
      previousClose: q.previousClose,
      marketCap: q.marketCap,
      pe: q.pe ?? null,
      yearHigh: q.yearHigh,
      yearLow: q.yearLow,
      volume: q.volume,
      avgVolume: q.avgVolume,
      eps: q.eps ?? null,
      dividendYield: p?.lastDiv ? ((p.lastDiv * 4) / q.price) * 100 : null,
      lastDiv: p?.lastDiv ?? null,
      exchange: p?.exchangeShortName || q.exchange || "",
      description: p?.description || "",
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}