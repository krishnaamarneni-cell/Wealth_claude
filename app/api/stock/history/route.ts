import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const POLYGON_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || process.env.POLYGON_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""

const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const POLYGON_BASE = "https://api.polygon.io"
const FINNHUB_BASE = "https://finnhub.io/api/v1"
const CACHE_TTL = 12 * 60 * 60

type Point = { date: string; price: number }

interface PeriodCfg {
  intraday: boolean
  interval?: string
  timeseries?: number
  days: number
}

const PERIODS: Record<string, PeriodCfg> = {
  "1D": { intraday: true, interval: "5min", days: 1 },
  "1W": { intraday: false, timeseries: 7, days: 7 },
  "1M": { intraday: false, timeseries: 30, days: 30 },
  "3M": { intraday: false, timeseries: 90, days: 90 },
  "6M": { intraday: false, timeseries: 180, days: 180 },
  "1Y": { intraday: false, timeseries: 365, days: 365 },
  "5Y": { intraday: false, timeseries: 1825, days: 1825 },
}

function dateRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
    fromTs: Math.floor(from.getTime() / 1000),
    toTs: Math.floor(to.getTime() / 1000),
  }
}
async function historyFMP(symbol: string, cfg: PeriodCfg): Promise<Point[]> {
  if (cfg.intraday) {
    const res = await fetch(`${FMP_BASE}/historical-chart/${cfg.interval}/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } })
    const json = await res.json()
    if (!Array.isArray(json) || !json.length) throw new Error("FMP intraday empty")
    const mostRecentDate = json[0]?.date?.split(" ")[0]
    if (!mostRecentDate) throw new Error("FMP intraday: no date")
    const pts = json
      .filter((d: any) => d.date?.startsWith(mostRecentDate))
      .map((d: any) => ({ date: d.date.split(" ")[1] ?? d.date, price: d.close }))
      .reverse()
    if (!pts.length) throw new Error("FMP intraday: no points")
    return pts
  }
  const res = await fetch(`${FMP_BASE}/historical-price-full/${symbol}?timeseries=${cfg.timeseries}&apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } })
  const json = await res.json()
  const pts = ((json as any).historical || [])
    .map((d: any) => ({ date: d.date as string, price: d.close as number }))
    .reverse()
  if (!pts.length) throw new Error("FMP daily empty")
  return pts
}
const res = await fetch(`${FMP_BASE}/historical-price-full/${symbol}?timeseries=${cfg.timeseries}&apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } })
const json = await res.json()
const pts = ((json as any).historical || [])
  .map((d: any) => ({ date: d.date as string, price: d.close as number }))
  .reverse()
if (!pts.length) throw new Error("FMP daily empty")
return pts
}

async function historyPolygon(symbol: string, cfg: PeriodCfg): Promise<Point[]> {
  const { from, to } = dateRange(cfg.days)
  const span = cfg.intraday ? "5/minute" : "1/day"
  const res = await fetch(
    `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/range/${span}/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${POLYGON_KEY}`,
    { next: { revalidate: CACHE_TTL } }
  )
  const json = await res.json()
  const pts = (json.results || []).map((d: any) => ({
    date: cfg.intraday
      ? new Date(d.t).toTimeString().substring(0, 5)
      : new Date(d.t).toISOString().split("T")[0],
    price: d.c,
  }))
  if (!pts.length) throw new Error("Polygon empty")
  return pts
}

async function historyFinnhub(symbol: string, cfg: PeriodCfg): Promise<Point[]> {
  const { fromTs, toTs } = dateRange(cfg.days)
  const resolution = cfg.intraday ? "5" : "D"
  const res = await fetch(
    `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTs}&to=${toTs}&token=${FINNHUB_KEY}`,
    { next: { revalidate: CACHE_TTL } }
  )
  const json = await res.json()
  if (json.s !== "ok" || !json.t?.length) throw new Error("Finnhub candle empty")
  return json.t.map((t: number, i: number) => ({
    date: cfg.intraday
      ? new Date(t * 1000).toTimeString().substring(0, 5)
      : new Date(t * 1000).toISOString().split("T")[0],
    price: json.c[i],
  }))
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase()
  const period = req.nextUrl.searchParams.get("period") || "1Y"
  if (!symbol) return NextResponse.json([], { status: 400 })

  const cfg = PERIODS[period] || PERIODS["1Y"]

  const sources = [
    { name: "FMP", fn: () => historyFMP(symbol, cfg) },
    { name: "Polygon", fn: () => historyPolygon(symbol, cfg) },
    { name: "Finnhub", fn: () => historyFinnhub(symbol, cfg) },
  ]

  for (const { name, fn } of sources) {
    try {
      const data = await fn()
      console.log(`[stock/history] ${symbol} ${period} <- ${name} (${data.length} pts)`)
      return NextResponse.json(data)
    } catch (err) {
      console.warn(`[stock/history] ${name} failed for ${symbol} ${period}:`, (err as Error).message)
    }
  }

  return NextResponse.json([], { status: 500 })
}
