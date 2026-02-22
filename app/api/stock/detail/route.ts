import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const POLYGON_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || process.env.POLYGON_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""

const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const POLYGON_BASE = "https://api.polygon.io"
const FINNHUB_BASE = "https://finnhub.io/api/v1"
const CACHE_TTL = 12 * 60 * 60

// Supplement missing fields (52wk, PE, volume) from Finnhub metrics
async function getMetrics(symbol: string) {
  try {
    const res = await fetch(`${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } })
    const json = await res.json()
    const m = json?.metric || {}
    return {
      yearHigh: m["52WeekHigh"] ?? null,
      yearLow: m["52WeekLow"] ?? null,
      pe: m.peBasicExclExtraTTM ?? m.peTTM ?? null,
      avgVolume: m["10DayAverageTradingVolume"] ? m["10DayAverageTradingVolume"] * 1e6 : null,
    }
  } catch { return {} }
}

async function fetchFMP(symbol: string) {
  const [qRes, pRes] = await Promise.all([
    fetch(`${FMP_BASE}/quote/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
  ])
  const [qData, pData] = await Promise.all([qRes.json(), pRes.json()])
  const q = Array.isArray(qData) ? qData[0] : null
  const p = Array.isArray(pData) ? pData[0] : null
  if (!q?.price) throw new Error(`FMP no price: ${JSON.stringify(qData).substring(0, 100)}`)
  return {
    symbol: q.symbol,
    name: p?.companyName || q.name || symbol,
    price: q.price,
    change: q.change ?? 0,
    changePercent: q.changesPercentage ?? 0,
    open: q.open ?? null,
    high: q.dayHigh ?? null,
    low: q.dayLow ?? null,
    previousClose: q.previousClose ?? null,
    marketCap: q.marketCap ?? null,
    pe: q.pe ?? null,
    yearHigh: q.yearHigh ?? null,
    yearLow: q.yearLow ?? null,
    volume: q.volume ?? null,
    avgVolume: q.avgVolume ?? null,
    dividendYield: p?.lastDiv ? ((p.lastDiv * 4) / q.price) * 100 : null,
    lastDiv: p?.lastDiv ?? null,
    exchange: p?.exchangeShortName || q.exchange || "",
  }
}

async function fetchPolygon(symbol: string) {
  const [snapRes, refRes] = await Promise.all([
    fetch(`${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${POLYGON_BASE}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_KEY}`, { next: { revalidate: CACHE_TTL } }),
  ])
  const [snap, ref] = await Promise.all([snapRes.json(), refRes.json()])
  const t = snap?.ticker
  const r = ref?.results
  const price = t?.min?.c || t?.day?.c || t?.prevDay?.c
  if (!price) throw new Error(`Polygon no price: ${JSON.stringify(snap).substring(0, 100)}`)
  return {
    symbol,
    name: r?.name || symbol,
    price,
    change: t.todaysChange ?? 0,
    changePercent: t.todaysChangePerc ?? 0,
    open: t.day?.o ?? null,
    high: t.day?.h ?? null,
    low: t.day?.l ?? null,
    previousClose: t.prevDay?.c ?? null,
    marketCap: r?.market_cap ?? null,
    pe: null,
    yearHigh: null,
    yearLow: null,
    volume: t.day?.v ?? null,
    avgVolume: t.prevDay?.v ?? null,
    dividendYield: null,
    lastDiv: null,
    exchange: r?.primary_exchange || "",
  }
}

async function fetchFinnhub(symbol: string) {
  const [qRes, pRes] = await Promise.all([
    fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } }),
  ])
  const [q, p] = await Promise.all([qRes.json(), pRes.json()])
  if (!q?.c) throw new Error(`Finnhub no price: ${JSON.stringify(q).substring(0, 100)}`)
  return {
    symbol,
    name: p?.name || symbol,
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    open: q.o ?? null,
    high: q.h ?? null,
    low: q.l ?? null,
    previousClose: q.pc ?? null,
    marketCap: p?.marketCapitalization ? p.marketCapitalization * 1e6 : null,
    pe: null,
    yearHigh: null,
    yearLow: null,
    volume: null,
    avgVolume: null,
    dividendYield: null,
    lastDiv: null,
    exchange: p?.exchange || "",
  }
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 })

  const errors: string[] = []
  const sources = [
    { name: "FMP", fn: () => fetchFMP(symbol) },
    { name: "Polygon", fn: () => fetchPolygon(symbol) },
    { name: "Finnhub", fn: () => fetchFinnhub(symbol) },
  ]

  for (const { name, fn } of sources) {
    try {
      const data = await fn()
      // Supplement any missing fields (52wk high/low, PE, avg vol) from Finnhub metrics
      const missing = !data.yearHigh || !data.yearLow || !data.pe || !data.avgVolume
      const extra = missing ? await getMetrics(symbol) : {}
      const result = {
        ...data,
        yearHigh: data.yearHigh || extra.yearHigh || null,
        yearLow: data.yearLow || extra.yearLow || null,
        pe: data.pe || extra.pe || null,
        avgVolume: data.avgVolume || extra.avgVolume || null,
      }
      console.log(`[stock/detail] ${symbol} <- ${name}`)
      return NextResponse.json(result)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${name}: ${msg}`)
      console.warn(`[stock/detail] ${name} failed:`, msg)
    }
  }

  return NextResponse.json({ error: "All sources failed", details: errors }, { status: 500 })
}
