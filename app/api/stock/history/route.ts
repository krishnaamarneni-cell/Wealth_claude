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

// Pick the most recent trading day from a list of timestamped results
function pickMostRecentDay(results: any[], getDate: (d: any) => string, getPrice: (d: any) => number): Point[] {
  if (!results.length) return []
  const dates = [...new Set(results.map(getDate))].sort()
  const latest = dates[dates.length - 1]
  return results.filter(d => getDate(d) === latest).map(d => ({ date: getDate(d), price: getPrice(d) }))
}

async function historyFMP(symbol: string, cfg: PeriodCfg): Promise<Point[]> {
  if (cfg.intraday) {
    const res = await fetch(`${FMP_BASE}/historical-chart/${cfg.interval}/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } })
    const json = await res.json()
    if (!Array.isArray(json) || !json.length) throw new Error("FMP intraday empty")
    // Always use most recent date in data — handles weekends/holidays
    const mostRecentDate = json[0]?.date?.split(" ")[0]
    if (!mostRecentDate) throw new Error("FMP: no date")
    const pts = json
      .filter((d: any) => d.date?.startsWith(mostRecentDate))
      .map((d: any) => ({ date: (d.date as string).split(" ")[1] ?? d.date, price: d.close as number }))
      .reverse()
    if (!pts.length) throw new Error("FMP intraday: 0 pts")
    return pts
  } else {
    const res = await fetch(`${FMP_BASE}/historical-price-full/${symbol}?timeseries=${cfg.timeseries}&apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } })
    const json = await res.json()
    const pts = ((json as any).historical || [])
      .map((d: any) => ({ date: d.date as string, price: d.close as number }))
      .reverse()
    if (!pts.length) throw new Error("FMP daily empty")
    return pts
  }
}

async function historyPolygon(symbol: string, cfg: PeriodCfg): Promise<Point[]> {
  // Use 4-day lookback for intraday so we always catch last Friday on weekends
  const lookbackDays = cfg.intraday ? 4 : cfg.days
  const { from, to } = dateRange(lookbackDays)
  const span = cfg.intraday ? "5/minute" : "1/day"
  const res = await fetch(
    `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/range/${span}/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${POLYGON_KEY}`,
    { next: { revalidate: CACHE_TTL } }
  )
  const json = await res.json()
  const results = json.results || []
  if (!results.length) throw new Error("Polygon empty")

  if (cfg.intraday) {
    // Group by date, return most recent trading day only
    const byDate: Record<string, Point[]> = {}
    for (const d of results) {
      const day = new Date(d.t).toISOString().split("T")[0]
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({ date: new Date(d.t).toTimeString().substring(0, 5), price: d.c })
    }
    const latestDay = Object.keys(byDate).sort().pop()
    if (!latestDay) throw new Error("Polygon: no day found")
    return byDate[latestDay]
  }

  return results.map((d: any) => ({
    date: new Date(d.t).toISOString().split("T")[0],
    price: d.c as number,
  }))
}

async function historyFinnhub(symbol: string, cfg: PeriodCfg): Promise<Point[]> {
  // Use 4-day lookback for intraday to catch last Friday
  const lookbackDays = cfg.intraday ? 4 : cfg.days
  const { fromTs, toTs } = dateRange(lookbackDays)
  const resolution = cfg.intraday ? "5" : "D"
  const res = await fetch(
    `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTs}&to=${toTs}&token=${FINNHUB_KEY}`,
    { next: { revalidate: CACHE_TTL } }
  )
  const json = await res.json()
  if (json.s !== "ok" || !json.t?.length) throw new Error("Finnhub candle empty")

  if (cfg.intraday) {
    // Group by date, return most recent trading day
    const byDate: Record<string, Point[]> = {}
    for (let i = 0; i < json.t.length; i++) {
      const day = new Date(json.t[i] * 1000).toISOString().split("T")[0]
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({
        date: new Date(json.t[i] * 1000).toTimeString().substring(0, 5),
        price: json.c[i],
      })
    }
    const latestDay = Object.keys(byDate).sort().pop()
    if (!latestDay) throw new Error("Finnhub: no day found")
    return byDate[latestDay]
  }

  return (json.t as number[]).map((t, i) => ({
    date: new Date(t * 1000).toISOString().split("T")[0],
    price: (json.c as number[])[i],
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
