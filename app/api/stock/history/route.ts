import { NextRequest, NextResponse } from 'next/server'

const CACHE = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 12 * 60 * 60 * 1000

type Period = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

interface ChartPoint {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ─── Timeout Fetch ─────────────────────────────────────────────────────────────
async function timedFetch(url: string, ms = 9000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
  } finally {
    clearTimeout(t)
  }
}

// ─── Period Config ─────────────────────────────────────────────────────────────
function getCfg(period: Period) {
  const map = {
    '1D': { tdInterval: '5min', tdOut: 78, days: 1, pgMult: 5, pgTs: 'minute', fhRes: '5' },
    '1W': { tdInterval: '1h', tdOut: 40, days: 7, pgMult: 1, pgTs: 'hour', fhRes: '60' },
    '1M': { tdInterval: '1day', tdOut: 31, days: 31, pgMult: 1, pgTs: 'day', fhRes: 'D' },
    '3M': { tdInterval: '1day', tdOut: 90, days: 92, pgMult: 1, pgTs: 'day', fhRes: 'D' },
    '6M': { tdInterval: '1day', tdOut: 180, days: 185, pgMult: 1, pgTs: 'day', fhRes: 'D' },
    '1Y': { tdInterval: '1day', tdOut: 252, days: 366, pgMult: 1, pgTs: 'day', fhRes: 'D' },
    '5Y': { tdInterval: '1week', tdOut: 260, days: 1826, pgMult: 1, pgTs: 'week', fhRes: 'W' },
  }
  return map[period] ?? map['1Y']
}

// ─── Twelve Data ───────────────────────────────────────────────────────────────
async function fromTwelveData(symbol: string, period: Period): Promise<ChartPoint[] | null> {
  const key = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY
  if (!key) { console.log('[TwelveData] key MISSING'); return null }

  const cfg = getCfg(period)
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${cfg.tdInterval}&outputsize=${cfg.tdOut}&format=JSON&apikey=${key}`
  console.log(`[TwelveData] GET ${symbol} ${period}`)

  try {
    const res = await timedFetch(url)
    const json = await res.json()

    console.log(`[TwelveData] ${symbol} status:${json.status} values:${json.values?.length ?? 'N/A'} code:${json.code ?? ''}`)

    if (!res.ok || json.status === 'error' || !Array.isArray(json.values) || json.values.length === 0) {
      return null
    }

    return json.values.reverse().map((v: any) => ({
      time: v.datetime,
      open: parseFloat(v.open) || 0,
      high: parseFloat(v.high) || 0,
      low: parseFloat(v.low) || 0,
      close: parseFloat(v.close) || 0,
      volume: parseInt(v.volume ?? '0', 10) || 0,
    }))
  } catch (e: any) {
    console.error(`[TwelveData] ${symbol} error: ${e.message}`)
    return null
  }
}

// ─── Polygon ───────────────────────────────────────────────────────────────────
async function fromPolygon(symbol: string, period: Period): Promise<ChartPoint[] | null> {
  const key = process.env.POLYGON_API_KEY ?? process.env.NEXT_PUBLIC_POLYGON_API_KEY
  if (!key) { console.log('[Polygon] key MISSING'); return null }

  const cfg = getCfg(period)
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - cfg.days * 86_400_000).toISOString().split('T')[0]
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${cfg.pgMult}/${cfg.pgTs}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${key}`
  console.log(`[Polygon] GET ${symbol} ${period} from:${from} to:${to}`)

  try {
    const res = await timedFetch(url)
    const json = await res.json()
    console.log(`[Polygon] ${symbol} resultsCount:${json.resultsCount ?? 0} status:${json.status}`)

    if (!res.ok || !Array.isArray(json.results) || json.results.length === 0) return null

    return json.results.map((v: any) => ({
      time: new Date(v.t).toISOString(),
      open: v.o ?? 0,
      high: v.h ?? 0,
      low: v.l ?? 0,
      close: v.c ?? 0,
      volume: v.v ?? 0,
    }))
  } catch (e: any) {
    console.error(`[Polygon] ${symbol} error: ${e.message}`)
    return null
  }
}

// ─── Finnhub ───────────────────────────────────────────────────────────────────
async function fromFinnhub(symbol: string, period: Period): Promise<ChartPoint[] | null> {
  const key = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  if (!key) { console.log('[Finnhub] key MISSING'); return null }

  const cfg = getCfg(period)
  const to = Math.floor(Date.now() / 1000)
  const from = to - cfg.days * 86_400
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${cfg.fhRes}&from=${from}&to=${to}&token=${key}`
  console.log(`[Finnhub] GET ${symbol} ${period} res:${cfg.fhRes}`)

  try {
    const res = await timedFetch(url)
    const json = await res.json()
    console.log(`[Finnhub] ${symbol} s:${json.s} count:${json.c?.length ?? 0}`)

    if (!res.ok || json.s !== 'ok' || !Array.isArray(json.c) || json.c.length === 0) return null

    return json.t.map((ts: number, i: number) => ({
      time: new Date(ts * 1000).toISOString(),
      open: json.o[i] ?? 0,
      high: json.h[i] ?? 0,
      low: json.l[i] ?? 0,
      close: json.c[i] ?? 0,
      volume: json.v[i] ?? 0,
    }))
  } catch (e: any) {
    console.error(`[Finnhub] ${symbol} error: ${e.message}`)
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

  console.log(`\n[history] ===== ${symbol} ${period} =====`)

  let chartData: ChartPoint[] | null = null
  let source = 'none'

  // 1. Twelve Data
  chartData = await fromTwelveData(symbol, period)
  if (chartData?.length) {
    source = 'twelvedata'
    console.log(`[history] ${symbol} ✅ TwelveData ${chartData.length} pts`)
  }

  // 2. Polygon fallback
  if (!chartData?.length) {
    chartData = await fromPolygon(symbol, period)
    if (chartData?.length) {
      source = 'polygon'
      console.log(`[history] ${symbol} ✅ Polygon ${chartData.length} pts`)
    }
  }

  // 3. Finnhub fallback
  if (!chartData?.length) {
    chartData = await fromFinnhub(symbol, period)
    if (chartData?.length) {
      source = 'finnhub'
      console.log(`[history] ${symbol} ✅ Finnhub ${chartData.length} pts`)
    }
  }

  if (!chartData?.length) {
    console.log(`[history] ${symbol} ❌ ALL sources failed`)
  }

  const result = {
    symbol,
    period,
    chartData: chartData ?? [],
    source,
    extendedHours: source === 'finnhub' && period === '1D',
    dataPoints: chartData?.length ?? 0,
  }

  if (chartData?.length) {
    CACHE.set(cacheKey, { data: result, timestamp: Date.now() })
  }

  return NextResponse.json(result)
}
