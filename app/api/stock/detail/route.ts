import { NextRequest, NextResponse } from 'next/server'

const MEM = new Map<string, { d: unknown; t: number }>()
const TTL = 12 * 3600 * 1000

async function tFetch(url: string, ms = 8000) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { signal: c.signal, cache: 'no-store' }) }
  finally { clearTimeout(t) }
}

async function yahoo(symbol: string) {
  try {
    const r = await tFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=false`)
    if (!r.ok) return null
    const j = await r.json()
    const m = j?.chart?.result?.[0]?.meta
    if (!m?.regularMarketPrice) return null
    const price = m.regularMarketPrice
    const prev = m.previousClose ?? m.chartPreviousClose ?? 0
    return {
      price,
      previousClose: prev,
      open: m.regularMarketOpen ?? null,
      dayHigh: m.regularMarketDayHigh ?? null,
      dayLow: m.regularMarketDayLow ?? null,
      volume: m.regularMarketVolume ?? null,
      marketCap: m.marketCap ?? null,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: m.fiftyTwoWeekLow ?? null,
      change: price - prev,
      changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
    }
  } catch { return null }
}

async function finnhubAll(symbol: string, key: string) {
  if (!key) return null
  try {
    const [mR, pR, tR, dR] = await Promise.allSettled([
      tFetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/dividend2?symbol=${symbol}&token=${key}`),
    ])
    const metrics = mR.status === 'fulfilled' && mR.value.ok ? await mR.value.json() : null
    const profile = pR.status === 'fulfilled' && pR.value.ok ? await pR.value.json() : null
    const target = tR.status === 'fulfilled' && tR.value.ok ? await tR.value.json() : null
    const dividend = dR.status === 'fulfilled' && dR.value.ok ? await dR.value.json() : null

    const m = metrics?.metric ?? {}

    let divAmt: number | null = null
    let exDate: string | null = null
    if (Array.isArray(dividend) && dividend.length > 0) {
      const sorted = [...dividend].sort((a: any, b: any) =>
        new Date(b.exDate).getTime() - new Date(a.exDate).getTime())
      divAmt = sorted[0]?.amount ?? null
      exDate = sorted[0]?.exDate ?? null
    }

    const avg10 = m['10DayAverageTradingVolume'] ? Math.round(m['10DayAverageTradingVolume'] * 1e6) : null
    const avg3m = m['3MonthAverageTradingVolume'] ? Math.round(m['3MonthAverageTradingVolume'] * 1e6) : null

    return {
      pe: m['peBasicExclExtraTTM'] ?? m['peTTM'] ?? null,
      eps: m['epsBasicExclExtraItemsTTM'] ?? m['epsTTM'] ?? null,
      beta: m['beta'] ?? null,
      high52: m['52WeekHigh'] ?? null,
      low52: m['52WeekLow'] ?? null,
      divYield: m['currentDividendYieldTTM'] ?? null,
      divAmt: divAmt ?? (m['dividendsPerShareAnnual'] ? m['dividendsPerShareAnnual'] / 4 : null),
      exDate,
      avgVolume: avg10 ?? avg3m,
      targetPrice: target?.targetMean ?? null,
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      name: profile?.name ?? null,
      sector: profile?.finnhubIndustry ?? null,
      logo: profile?.logo ?? null,
      country: profile?.country ?? 'US',
      exchange: profile?.exchange ?? null,
    }
  } catch (e: any) { console.error('[FinnhubAll]', e.message); return null }
}

export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = MEM.get(symbol)
  if (hit && Date.now() - hit.t < TTL) return NextResponse.json({ ...hit.d, cached: true })

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ''
  console.log(`\n===== detail ${symbol} key:${fhKey ? 'OK' : 'MISSING'} =====`)

  try {
    const [yq, fh] = await Promise.all([yahoo(symbol), finnhubAll(symbol, fhKey)])

    const price = yq?.price ?? 0
    const prev = yq?.previousClose ?? 0

    const out = {
      symbol,
      name: fh?.name ?? symbol,
      price,
      change: yq?.change ?? 0,
      changePercent: yq?.changePercent ?? 0,
      open: yq?.open ?? null,
      previousClose: prev,
      dayHigh: yq?.dayHigh ?? null,
      dayLow: yq?.dayLow ?? null,
      volume: yq?.volume ?? null,
      avgVolume: fh?.avgVolume ?? null,
      marketCap: yq?.marketCap ?? fh?.marketCap ?? null,
      fiftyTwoWeekHigh: yq?.fiftyTwoWeekHigh ?? fh?.high52 ?? null,
      fiftyTwoWeekLow: yq?.fiftyTwoWeekLow ?? fh?.low52 ?? null,
      pe: fh?.pe ?? null,
      eps: fh?.eps ?? null,
      beta: fh?.beta ?? null,
      dividendYield: fh?.divYield ?? null,
      dividendAmount: fh?.divAmt ?? null,
      exDivDate: fh?.exDate ?? null,
      targetPrice: fh?.targetPrice ?? null,
      sector: fh?.sector ?? null,
      logo: fh?.logo ?? null,
      country: fh?.country ?? 'US',
      exchange: fh?.exchange ?? null,
    }

    console.log(`[detail] ${symbol} price:${price} vol:${out.volume} pe:${out.pe} div:${out.dividendAmount}`)
    MEM.set(symbol, { d: out, t: Date.now() })
    return NextResponse.json(out)
  } catch (e: any) {
    console.error(`[detail] ${symbol} FATAL:`, e.message)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
