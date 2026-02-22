import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const POLYGON_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || process.env.POLYGON_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""

const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const POLYGON_BASE = "https://api.polygon.io"
const FINNHUB_BASE = "https://finnhub.io/api/v1"
const CACHE_TTL = 12 * 60 * 60

async function fetchFMP(symbol: string) {
  const [qRes, pRes] = await Promise.all([
    fetch(`${FMP_BASE}/quote/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
  ])
  const [qData, pData] = await Promise.all([qRes.json(), pRes.json()])
  const q = Array.isArray(qData) ? qData[0] : null
  const p = Array.isArray(pData) ? pData[0] : null
  if (!q?.price) throw new Error("FMP: no price")
  return {
    symbol: q.symbol,
    name: p?.companyName || q.name || symbol,
    price: q.price,
    change: q.change ?? 0,
    changePercent: q.changesPercentage ?? 0,
    open: q.open ?? 0,
    high: q.dayHigh ?? 0,
    low: q.dayLow ?? 0,
    previousClose: q.previousClose ?? 0,
    marketCap: q.marketCap ?? 0,
    pe: q.pe ?? null,
    yearHigh: q.yearHigh ?? 0,
    yearLow: q.yearLow ?? 0,
    volume: q.volume ?? 0,
    avgVolume: q.avgVolume ?? 0,
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
  if (!price) throw new Error("Polygon: no price")
  return {
    symbol,
    name: r?.name || symbol,
    price,
    change: t.todaysChange ?? 0,
    changePercent: t.todaysChangePerc ?? 0,
    open: t.day?.o ?? 0,
    high: t.day?.h ?? 0,
    low: t.day?.l ?? 0,
    previousClose: t.prevDay?.c ?? 0,
    marketCap: r?.market_cap ?? 0,
    pe: null,
    yearHigh: 0,
    yearLow: 0,
    volume: t.day?.v ?? 0,
    avgVolume: t.prevDay?.v ?? 0,
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
  if (!q?.c) throw new Error("Finnhub: no price")
  return {
    symbol,
    name: p?.name || symbol,
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    open: q.o ?? 0,
    high: q.h ?? 0,
    low: q.l ?? 0,
    previousClose: q.pc ?? 0,
    marketCap: (p?.marketCapitalization ?? 0) * 1e6,
    pe: null,
    yearHigh: 0,
    yearLow: 0,
    volume: 0,
    avgVolume: 0,
    dividendYield: null,
    lastDiv: null,
    exchange: p?.exchange || "",
  }
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 })

  const sources = [
    { name: "FMP", fn: () => fetchFMP(symbol) },
    { name: "Polygon", fn: () => fetchPolygon(symbol) },
    { name: "Finnhub", fn: () => fetchFinnhub(symbol) },
  ]

  for (const { name, fn } of sources) {
    try {
      const data = await fn()
      console.log(`[stock/detail] ${symbol} <- ${name}`)
      return NextResponse.json(data)
    } catch (err) {
      console.warn(`[stock/detail] ${name} failed for ${symbol}:`, (err as Error).message)
    }
  }

  return NextResponse.json({ error: "All sources failed" }, { status: 500 })
}
