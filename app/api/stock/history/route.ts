import { NextRequest, NextResponse } from 'next/server'

const MEM = new Map<string, { d: unknown; t: number }>()
const TTL = 12 * 3600 * 1000

type Period = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

interface Bar { time: string; open: number; high: number; low: number; close: number; volume: number }

const YAHOO_CFG: Record<Period, { interval: string; range: string }> = {
  '1D': { interval: '5m', range: '1d' },
  '1W': { interval: '1h', range: '5d' },
  '1M': { interval: '1d', range: '1mo' },
  '3M': { interval: '1d', range: '3mo' },
  '6M': { interval: '1d', range: '6mo' },
  '1Y': { interval: '1d', range: '1y' },
  '5Y': { interval: '1wk', range: '5y' },
}

async function tFetch(url: string, ms = 9000) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { signal: c.signal, cache: 'no-store' }) }
  finally { clearTimeout(t) }
}

async function fromYahoo(symbol: string, period: Period): Promise<Bar[] | null> {
  const cfg = YAHOO_CFG[period]
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`
  console.log(`[Yahoo History] ${symbol} ${period}`)
  try {
    const r = await tFetch(url)
    const j = await r.json()
    const res = j?.chart?.result?.[0]
    if (!res) { console.log(`[Yahoo History] no result`); return null }
    const { timestamp: ts, indicators } = res
    const q = indicators?.quote?.[0]
    if (!ts?.length || !q) return null
    const bars: Bar[] = []
    for (let i = 0; i < ts.length; i++) {
      if (!q.close?.[i]) continue
      bars.push({
        time: new Date(ts[i] * 1000).toISOString(),
        open: q.open?.[i] ?? q.close[i],
        high: q.high?.[i] ?? q.close[i],
        low: q.low?.[i] ?? q.close[i],
        close: q.close[i],
        volume: q.volume?.[i] ?? 0,
      })
    }
    console.log(`[Yahoo History] ✅ ${bars.length} bars`)
    return bars.length ? bars : null
  } catch (e: any) { console.error(`[Yahoo History] ❌`, e.message); return null }
}

const FH_RES: Record<Period, string> = {
  '1D': '5', '1W': '60', '1M': 'D', '3M': 'D', '6M': 'D', '1Y': 'D', '5Y': 'W'
}
const FH_DAYS: Record<Period, number> = {
  '1D': 1, '1W': 7, '1M': 31, '3M': 92, '6M': 185, '1Y': 366, '5Y': 1826
}

async function fromFinnhub(symbol: string, period: Period): Promise<Bar[] | null> {
  const key = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  if (!key) { console.log('[Finnhub History] key missing'); return null }
  const to = Math.floor(Date.now() / 1000)
  const from = to - FH_DAYS[period] * 86400
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${FH_RES[period]}&from=${from}&to=${to}&token=${key}`
  console.log(`[Finnhub History] ${symbol} ${period} res:${FH_RES[period]}`)
  try {
    const r = await tFetch(url)
    const j = await r.json()
    console.log(`[Finnhub History] s:${j.s} count:${j.c?.length ?? 0}`)
    if (j.s !== 'ok' || !j.c?.length) return null
    return j.t.map((ts: number, i: number) => ({
      time: new Date(ts * 1000).toISOString(),
      open: j.o[i] ?? 0,
      high: j.h[i] ?? 0,
      low: j.l[i] ?? 0,
      close: j.c[i] ?? 0,
      volume: j.v[i] ?? 0,
    }))
  } catch (e: any) { console.error('[Finnhub History] ❌', e.message); return null }
}

async function fromTwelveData(symbol: string, period: Period): Promise<Bar[] | null> {
  const key = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY ?? process.env.TWELVE_DATA_API_KEY
  if (!key) { console.log('[TwelveData] key missing'); return null }
  const cfgMap: Record<Period, { interval: string; size: number }> = {
    '1D': { interval: '5min', size: 78 },
    '1W': { interval: '1h', size: 40 },
    '1M': { interval: '1day', size: 31 },
    '3M': { interval: '1day', size: 90 },
    '6M': { interval: '1day', size: 180 },
    '1Y': { interval: '1day', size: 252 },
    '5Y': { interval: '1week', size: 260 },
  }
  const cfg = cfgMap[period]
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${cfg.interval}&outputsize=${cfg.size}&format=JSON&apikey=${key}`
  console.log(`[TwelveData] ${symbol} ${period}`)
  try {
    const r = await tFetch(url)
    const j = await r.json()
    console.log(`[TwelveData] status:${j.status} values:${j.values?.length ?? 0} code:${j.code ?? ''}`)
    if (j.status === 'error' || !Array.isArray(j.values) || !j.values.length) return null
    return j.values.reverse().map((v: any) => ({
      time: v.datetime,
      open: parseFloat(v.open) || 0,
      high: parseFloat(v.high) || 0,
      low: parseFloat(v.low) || 0,
      close: parseFloat(v.close) || 0,
      volume: parseInt(v.volume ?? '0', 10) || 0,
    }))
  } catch (e: any) { console.error('[TwelveData] ❌', e.message); return null }
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const sym = p.get('symbol')?.toUpperCase()
  const period = (p.get('period') ?? '1Y') as Period
  if (!sym) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const key = `${sym}_${period}`
  const hit = MEM.get(key)
  if (hit && Date.now() - hit.t < TTL) return NextResponse.json({ ...hit.d, cached: true })

  console.log(`\n===== history ${sym} ${period} =====`)

  let bars: Bar[] | null = null
  let source = 'none'

  bars = await fromYahoo(sym, period)
  if (bars?.length) { source = 'yahoo' }

  if (!bars?.length) {
    bars = await fromFinnhub(sym, period)
    if (bars?.length) source = 'finnhub'
  }

  if (!bars?.length) {
    bars = await fromTwelveData(sym, period)
    if (bars?.length) source = 'twelvedata'
  }

  if (!bars?.length) console.log(`[history] ❌ ALL sources failed for ${sym}`)

  const out = { symbol: sym, period, chartData: bars ?? [], source, dataPoints: bars?.length ?? 0 }
  if (bars?.length) MEM.set(key, { d: out, t: Date.now() })
  return NextResponse.json(out)
}
