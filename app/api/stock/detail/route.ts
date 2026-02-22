import { NextRequest, NextResponse } from 'next/server'

const MEM = new Map<string, { d: unknown; t: number }>()
const TTL = 12 * 3600 * 1000

async function tFetch(url: string, ms = 8000) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { signal: c.signal, cache: 'no-store' }) }
  finally { clearTimeout(t) }
}

// ── SOURCE 1: Yahoo chart — price + OHLCV only ─────────────────────────────
async function yahooPrice(symbol: string) {
  try {
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=false`
    )
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
  } catch (e: any) { console.error('[Yahoo Price]', e.message); return null }
}

// ── SOURCE 2: Finnhub — all fundamentals (primary) ─────────────────────────
async function finnhubFundamentals(symbol: string, key: string) {
  if (!key) { console.log('[Finnhub] key missing'); return null }
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

    // Most recent dividend
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

    const result = {
      pe: m['peBasicExclExtraTTM'] ?? m['peTTM'] ?? null,
      eps: m['epsBasicExclExtraItemsTTM'] ?? m['epsTTM'] ?? null,
      beta: m['beta'] ?? null,
      high52: m['52WeekHigh'] ?? null,
      low52: m['52WeekLow'] ?? null,
      divYield: m['currentDividendYieldTTM'] ?? null,
      divAmt: divAmt ?? (m['dividendsPerShareAnnual'] ? m['dividendsPerShareAnnual'] / 4 : null),
      exDate,
      avgVolume: avg10 ?? avg3m ?? null,
      targetPrice: target?.targetMean ?? null,
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      name: profile?.name ?? null,
      sector: profile?.finnhubIndustry ?? null,
      logo: profile?.logo ?? null,
      country: profile?.country ?? 'US',
      exchange: profile?.exchange ?? null,
      earningsDate: null as string | null, // Finnhub doesn't provide this simply
    }

    console.log(`[Finnhub] pe:${result.pe} eps:${result.eps} div:${result.divAmt} marketCap:${result.marketCap}`)
    return result
  } catch (e: any) { console.error('[Finnhub]', e.message); return null }
}

// ── SOURCE 3: Polygon — fundamentals fallback ──────────────────────────────
async function polygonFundamentals(symbol: string, key: string) {
  if (!key) { console.log('[Polygon] key missing'); return null }
  try {
    const [refR, divR, finR] = await Promise.allSettled([
      tFetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${key}`),
      tFetch(`https://api.polygon.io/v3/reference/dividends?ticker=${symbol}&limit=1&apiKey=${key}`),
      tFetch(`https://api.polygon.io/vX/reference/financials?ticker=${symbol}&limit=1&apiKey=${key}`),
    ])

    const ref = refR.status === 'fulfilled' && refR.value.ok ? await refR.value.json() : null
    const div = divR.status === 'fulfilled' && divR.value.ok ? await divR.value.json() : null
    const fin = finR.status === 'fulfilled' && finR.value.ok ? await finR.value.json() : null

    const info = ref?.results
    const financials = fin?.results?.[0]?.financials

    let divAmt: number | null = null
    let exDate: string | null = null
    if (div?.results?.length) {
      divAmt = div.results[0]?.cash_amount ?? null
      exDate = div.results[0]?.ex_dividend_date ?? null
    }

    // EPS from financials
    const eps = financials?.income_statement?.basic_earnings_per_share?.value ?? null

    const result = {
      marketCap: info?.market_cap ?? null,
      name: info?.name ?? null,
      sector: info?.sic_description ?? null,
      logo: info?.branding?.icon_url
        ? `${info.branding.icon_url}?apiKey=${key}`
        : null,
      country: info?.locale?.toUpperCase() ?? 'US',
      exchange: info?.primary_exchange ?? null,
      divAmt,
      exDate,
      eps,
    }

    console.log(`[Polygon] marketCap:${result.marketCap} eps:${result.eps} div:${result.divAmt}`)
    return result
  } catch (e: any) { console.error('[Polygon]', e.message); return null }
}

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = MEM.get(symbol)
  if (hit && Date.now() - hit.t < TTL) return NextResponse.json({ ...hit.d, cached: true })

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ''
  const polyKey = process.env.POLYGON_API_KEY ?? process.env.NEXT_PUBLIC_POLYGON_API_KEY ?? ''

  console.log(`\n===== detail ${symbol} fh:${fhKey ? 'OK' : 'MISSING'} poly:${polyKey ? 'OK' : 'MISSING'} =====`)

  try {
    // All fire in parallel — Yahoo for price, Finnhub+Polygon for fundamentals
    const [yq, fh, poly] = await Promise.all([
      yahooPrice(symbol),
      finnhubFundamentals(symbol, fhKey),
      polygonFundamentals(symbol, polyKey),
    ])

    const price = yq?.price ?? 0

    const out = {
      symbol,

      // Identity — Finnhub primary → Polygon fallback
      name: fh?.name ?? poly?.name ?? symbol,
      sector: fh?.sector ?? poly?.sector ?? null,
      logo: fh?.logo ?? poly?.logo ?? null,
      country: fh?.country ?? poly?.country ?? 'US',
      exchange: fh?.exchange ?? poly?.exchange ?? null,

      // Price — Yahoo only (chart endpoint, server-safe)
      price,
      change: yq?.change ?? 0,
      changePercent: yq?.changePercent ?? 0,
      previousClose: yq?.previousClose ?? null,
      open: yq?.open ?? null,
      dayHigh: yq?.dayHigh ?? null,
      dayLow: yq?.dayLow ?? null,
      volume: yq?.volume ?? null,
      avgVolume: fh?.avgVolume ?? null,
      marketCap: yq?.marketCap ?? fh?.marketCap ?? poly?.marketCap ?? null,
      fiftyTwoWeekHigh: yq?.fiftyTwoWeekHigh ?? fh?.high52 ?? null,
      fiftyTwoWeekLow: yq?.fiftyTwoWeekLow ?? fh?.low52 ?? null,

      // Fundamentals — Finnhub primary → Polygon fallback
      pe: fh?.pe ?? null,
      eps: fh?.eps ?? poly?.eps ?? null,
      beta: fh?.beta ?? null,
      dividendYield: fh?.divYield ?? null,
      dividendAmount: fh?.divAmt ?? poly?.divAmt ?? null,
      exDivDate: fh?.exDate ?? poly?.exDate ?? null,
      earningsDate: null, // requires separate Finnhub earnings calendar call
      targetPrice: fh?.targetPrice ?? null,
    }

    console.log(`[detail] ${symbol} price:${price} pe:${out.pe} eps:${out.eps} marketCap:${out.marketCap} div:${out.dividendAmount}`)
    MEM.set(symbol, { d: out, t: Date.now() })
    return NextResponse.json(out)

  } catch (e: any) {
    console.error(`[detail] ${symbol} FATAL:`, e.message)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
