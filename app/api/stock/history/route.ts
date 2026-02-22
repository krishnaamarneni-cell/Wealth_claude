import { NextRequest, NextResponse } from 'next/server'

// ─── Cache ─────────────────────────────────────────────────────────────────────
const CACHE = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 12 * 60 * 60 * 1000

// ─── Twelve Data rate limiter (8 credits/min) ──────────────────────────────────
const tdQueue: number[] = []
async function waitForTwelveDataSlot() {
  const now = Date.now()
  while (tdQueue.length && now - tdQueue[0] > 60_000) tdQueue.shift()
  if (tdQueue.length >= 8) {
    const wait = 60_000 - (now - tdQueue[0]) + 200
    await new Promise((r) => setTimeout(r, wait))
    return waitForTwelveDataSlot()
  }
  tdQueue.push(Date.now())
}

// ─── Period Config ─────────────────────────────────────────────────────────────
type Period = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

interface ChartPoint {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function getPeriodConfig(period: Period) {
  const configs = {
    '1D': { tdInterval: '5min', tdOutput: 78, days: 1, pgMultiplier: 5, pgTimespan: 'minute', fhResolution: '5' },
    '1W': { tdInterval: '1day', tdOutput: 7, days: 7, pgMultiplier: 1, pgTimespan: 'day', fhResolution: 'D' },
    '1M': { tdInterval: '1day', tdOutput: 30, days: 30, pgMultiplier: 1, pgTimespan: 'day', fhResolution: 'D' },
    '3M': { tdInterval: '1day', tdOutput: 90, days: 90, pgMultiplier: 1, pgTimespan: 'day', fhResolution: 'D' },
    '6M': { tdInterval: '1day', tdOutput: 180, days: 180, pgMultiplier: 1, pgTimespan: 'day', fhResolution: 'D' },
    '1Y': { tdInterval: '1day', tdOutput: 252, days: 365, pgMultiplier: 1, pgTimespan: 'day', fhResolution: 'D' },
    '5Y': { tdInterval: '1week', tdOutput: 260, days: 1825, pgMultiplier: 1, pgTimespan: 'week', fhResolution: 'W' },
  }
  return configs[period] ?? configs['1Y']
}

// ─── Source: Twelve Data ───────────────────────────────────────────────────────
async function fetchTwelveData(symbol: string, period: Period): Promise<ChartPoint[] | null> {
  try {
    const key = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY
    if (!key) return null

    const cfg = getPeriodConfig(period)
    await waitForTwelveDataSlot()

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${cfg.tdInterval}&outputsize=${cfg.tdOutput}&format=JSON&apikey=${key}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    if (data.status === 'error' || !Array.isArray(data.values)) return null

    return (data.values as any[]).reverse().map((v) => ({
      time: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume ?? '0', 10),
    }))
  } catch {
    return null
  }
}

// ─── Source: Polygon ───────────────────────────────────────────────────────────
async function fetchPolygon(symbol: string, period: Period): Promise<ChartPoint[] | null> {
  try {
    const key = process.env.POLYGON_API_KEY ?? process.env.NEXT_PUBLIC_POLYGON_API_KEY
    if (!key) return null

    const cfg = getPeriodConfig(period)
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - cfg.days * 86_400_000).toISOString().split('T')[0]

    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${cfg.pgMultiplier}/${cfg.pgTimespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${key}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    if (!data.results?.length) return null

    return data.results.map((v: any) => ({
      time: new Date(v.t).toISOString(),
      open: v.o,
      high: v.h,
      low: v.l,
      close: v.c,
      volume: v.v,
    }))
  } catch {
    return null
  }
}

// ─── Source: Finnhub ───────────────────────────────────────────────────────────
async function fetchFinnhub(symbol: string, period: Period): Promise<ChartPoint[] | null> {
  try {
    const key = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    if (!key) return null

    const cfg = getPeriodConfig(period)
    const to = Math.floor(Date.now() / 1000)
    const from = Math.floor(to - cfg.days * 86_400)

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${cfg.fhResolution}&from=${from}&to=${to}&token=${key}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data = await res.json()
    if (data.s !== 'ok' || !data.c?.length) return null

    return data.t.map((ts: number, i: number) => ({
      time: new Date(ts * 1000).toISOString(),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }))
  } catch {
    return null
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const symbol = params.get('symbol')?.toUpperCase()
  const period = (params.get('period') ?? '1Y') as Period

  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 })

  const cacheKey = `${symbol}_${period}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ...cached.data, cached: true })
  }

  try {
    // Try Twelve Data → Polygon → Finnhub in order
    let chartData: ChartPoint[] | null = null
    let source = ''

    chartData = await fetchTwelveData(symbol, period)
    if (chartData?.length) { source = 'twelvedata' }

    if (!chartData?.length) {
      chartData = await fetchPolygon(symbol, period)
      if (chartData?.length) source = 'polygon'
    }

    if (!chartData?.length) {
      chartData = await fetchFinnhub(symbol, period)
      if (chartData?.length) source = 'finnhub'
    }

    if (!chartData?.length) {
      return NextResponse.json(
        { symbol, period, chartData: [], source: 'none', error: 'No chart data available' },
        { status: 200 } // 200 so UI can show empty state, not crash
      )
    }

    const result = {
      symbol,
      period,
      chartData,
      source,
      extendedHours: source === 'finnhub' && period === '1D',
      dataPoints: chartData.length,
    }

    CACHE.set(cacheKey, { data: result, timestamp: Date.now() })
    return NextResponse.json(result)
  } catch (error) {
    console.error(`[stock/history] ${symbol} ${period}:`, error)
    return NextResponse.json(
      { symbol, period, chartData: [], source: 'none', error: 'Internal error' },
      { status: 500 }
    )
  }
}
