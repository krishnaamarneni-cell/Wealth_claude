import { NextRequest, NextResponse } from 'next/server'

const MEM = new Map<string, { d: unknown; t: number }>()
const TTL = 4 * 3600 * 1000

export interface StockFull {
  symbol: string
  name: string
  exchange: string | null
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number | null
  bid: string | null
  ask: string | null
  dayRange: string | null
  weekRange52: string | null
  volume: number | null
  avgVolume: number | null
  marketCap: number | null
  beta: number | null
  pe: number | null
  eps: number | null
  earningsDate: string | null
  dividend: string | null
  exDivDate: string | null
  targetPrice: number | null
  daily: { date: string; price: number }[]    // "YYYY-MM-DD"
  intraday: { date: string; price: number }[] // "HH:MM"
}

async function tFetch(url: string, ms = 9000): Promise<Response | null> {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try {
    return await fetch(url, { signal: c.signal, cache: 'no-store' })
  } catch (e: any) {
    console.error(`[tFetch] ${e.message}`)
    return null
  } finally { clearTimeout(t) }
}

// ── Yahoo: quote + 5Y daily ──────────────────────────────────────────
async function yahooDaily(symbol: string) {
  try {
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5y&includePrePost=false`
    )
    if (!r?.ok) { console.log(`[Yahoo Daily] ${symbol} status:${r?.status}`); return null }
    const j = await r.json()
    const result = j?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price = meta.regularMarketPrice ?? 0
    if (!price) return null

    const ts: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const daily: { date: string; price: number }[] = []
    for (let i = 0; i < ts.length; i++) {
      if (closes[i] == null) continue
      daily.push({ date: new Date(ts[i] * 1000).toISOString().split('T')[0], price: closes[i]! })
    }
    console.log(`[Yahoo Daily] ${symbol} ✅ price:${price} bars:${daily.length}`)
    return {
      daily, price,
      previousClose: meta.previousClose ?? meta.chartPreviousClose ?? 0,
      open: meta.regularMarketOpen ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      marketCap: meta.marketCap ?? null,
      high52: meta.fiftyTwoWeekHigh ?? null,
      low52: meta.fiftyTwoWeekLow ?? null,
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? null,
      name: meta.longName ?? meta.shortName ?? null,
    }
  } catch (e: any) { console.error(`[Yahoo Daily] ❌`, e.message); return null }
}

// ── Yahoo: 1D intraday ────────────────────────────────────────────────
async function yahooIntraday(symbol: string): Promise<{ date: string; price: number }[] | null> {
  try {
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d&includePrePost=false`
    )
    if (!r?.ok) return null
    const j = await r.json()
    const result = j?.chart?.result?.[0]
    if (!result) return null
    const ts: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const bars: { date: string; price: number }[] = []
    for (let i = 0; i < ts.length; i++) {
      if (closes[i] == null) continue
      const d = new Date(ts[i] * 1000)
      bars.push({
        date: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
        price: closes[i]!,
      })
    }
    console.log(`[Yahoo Intraday] ${symbol} ✅ bars:${bars.length}`)
    return bars.length ? bars : null
  } catch (e: any) { console.error(`[Yahoo Intraday] ❌`, e.message); return null }
}

// ── Twelve Data: daily fallback ────────────────────────────────────────
async function tdDaily(symbol: string): Promise<{ date: string; price: number }[] | null> {
  const key = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY ?? process.env.TWELVE_DATA_API_KEY
  if (!key) return null
  try {
    const r = await tFetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=1260&format=JSON&apikey=${key}`
    )
    if (!r?.ok) return null
    const j = await r.json()
    if (j.status === 'error' || !Array.isArray(j.values)) return null
    const bars = j.values.reverse().map((v: any) => ({
      date: v.datetime.split(' ')[0],
      price: parseFloat(v.close) || 0,
    })).filter((b: any) => b.price > 0)
    console.log(`[TwelveData Daily] ${symbol} ✅ bars:${bars.length}`)
    return bars.length ? bars : null
  } catch { return null }
}

// ── Finnhub: daily fallback ────────────────────────────────────────────
async function fhDaily(symbol: string, key: string): Promise<{ date: string; price: number }[] | null> {
  if (!key) return null
  try {
    const to = Math.floor(Date.now() / 1000)
    const from = to - 5 * 365 * 86400
    const r = await tFetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${key}`
    )
    if (!r?.ok) return null
    const j = await r.json()
    if (j.s !== 'ok' || !j.c?.length) return null
    const bars = (j.t as number[]).map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: j.c[i] ?? 0,
    })).filter((b) => b.price > 0)
    console.log(`[Finnhub Daily] ${symbol} ✅ bars:${bars.length}`)
    return bars.length ? bars : null
  } catch { return null }
}

// ── Finnhub: intraday fallback ─────────────────────────────────────────
async function fhIntraday(symbol: string, key: string): Promise<{ date: string; price: number }[] | null> {
  if (!key) return null
  try {
    const to = Math.floor(Date.now() / 1000)
    const from = to - 86400
    const r = await tFetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${to}&token=${key}`
    )
    if (!r?.ok) return null
    const j = await r.json()
    if (j.s !== 'ok' || !j.c?.length) return null
    return (j.t as number[]).map((ts, i) => {
      const d = new Date(ts * 1000)
      return {
        date: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
        price: j.c[i] ?? 0,
      }
    }).filter(b => b.price > 0)
  } catch { return null }
}

// ── Main handler ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = MEM.get(symbol)
  if (hit && Date.now() - hit.t < TTL) return NextResponse.json(hit.d)

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ''
  console.log(`\n===== full ${symbol} fhKey:${fhKey ? 'OK' : 'MISSING'} =====`)

  try {
    const fhFetch = (path: string) =>
      fhKey ? tFetch(`https://finnhub.io/api/v1/${path}&token=${fhKey}`) : Promise.resolve(null)

    // All network calls in parallel
    const [yDay, yIntra, fhMetR, fhProR, fhTgtR, fhDivR] = await Promise.all([
      yahooDaily(symbol),
      yahooIntraday(symbol),
      fhFetch(`stock/metric?symbol=${symbol}&metric=all`),
      fhFetch(`stock/profile2?symbol=${symbol}`),
      fhFetch(`stock/price-target?symbol=${symbol}`),
      fhFetch(`stock/dividend2?symbol=${symbol}`),
    ])

    const fhMet = fhMetR?.ok ? await fhMetR.json().catch(() => null) : null
    const fhPro = fhProR?.ok ? await fhProR.json().catch(() => null) : null
    const fhTgt = fhTgtR?.ok ? await fhTgtR.json().catch(() => null) : null
    const fhDiv = fhDivR?.ok ? await fhDivR.json().catch(() => null) : null

    const m = fhMet?.metric ?? {}
    const divYield: number | null = m['currentDividendYieldTTM'] ?? null
    const avg10 = m['10DayAverageTradingVolume'] ? Math.round(m['10DayAverageTradingVolume'] * 1e6) : null
    const avg3m = m['3MonthAverageTradingVolume'] ? Math.round(m['3MonthAverageTradingVolume'] * 1e6) : null

    // Dividend string
    let dividend: string | null = null
    let exDivDate: string | null = null
    if (Array.isArray(fhDiv) && fhDiv.length > 0) {
      const latest = [...fhDiv].sort((a, b) =>
        new Date(b.exDate).getTime() - new Date(a.exDate).getTime())[0]
      if (latest?.amount) {
        dividend = `$${latest.amount.toFixed(4)}${divYield ? ` (${divYield.toFixed(2)}%)` : ''}`
        exDivDate = latest.exDate
      }
    }
    const price = yDay?.price ?? 0
    if (!dividend && divYield && divYield > 0 && price > 0) {
      dividend = `$${((divYield / 100) * price / 4).toFixed(4)} (${divYield.toFixed(2)}%)`
    }

    // Chart data with fallbacks
    let daily = yDay?.daily ?? []
    if (!daily.length) { console.log(`[full] trying TwelveData...`); daily = (await tdDaily(symbol)) ?? [] }
    if (!daily.length) { console.log(`[full] trying Finnhub daily...`); daily = (await fhDaily(symbol, fhKey)) ?? [] }

    let intraday = yIntra ?? []
    if (!intraday.length) { intraday = (await fhIntraday(symbol, fhKey)) ?? [] }

    const prevClose = yDay?.previousClose ?? 0
    const h52 = yDay?.high52 ?? (m['52WeekHigh'] ?? null)
    const l52 = yDay?.low52 ?? (m['52WeekLow'] ?? null)

    const out: StockFull = {
      symbol,
      name: yDay?.name ?? fhPro?.name ?? symbol,
      exchange: yDay?.exchange ?? fhPro?.exchange ?? null,
      price,
      change: price - prevClose,
      changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
      previousClose: prevClose,
      open: yDay?.open ?? null,
      bid: null,
      ask: null,
      dayRange: yDay?.dayHigh && yDay?.dayLow
        ? `${yDay.dayLow.toFixed(2)} – ${yDay.dayHigh.toFixed(2)}` : null,
      weekRange52: h52 && l52 ? `${l52.toFixed(2)} – ${h52.toFixed(2)}` : null,
      volume: yDay?.volume ?? null,
      avgVolume: avg10 ?? avg3m ?? null,
      marketCap: yDay?.marketCap ?? (fhPro?.marketCapitalization ? fhPro.marketCapitalization * 1e6 : null),
      beta: m['beta'] ?? null,
      pe: m['peBasicExclExtraTTM'] ?? m['peTTM'] ?? null,
      eps: m['epsBasicExclExtraItemsTTM'] ?? m['epsTTM'] ?? null,
      earningsDate: null,
      dividend,
      exDivDate,
      targetPrice: fhTgt?.targetMean ?? null,
      daily,
      intraday,
    }

    console.log(`[full] ${symbol} ✅ price:${price} daily:${daily.length} intraday:${intraday.length}`)
    if (price > 0) MEM.set(symbol, { d: out, t: Date.now() })
    return NextResponse.json(out)

  } catch (e: any) {
    console.error(`[full] ${symbol} FATAL:`, e.message)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
