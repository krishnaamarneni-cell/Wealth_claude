import { NextRequest, NextResponse } from 'next/server'

const MEM = new Map<string, { d: unknown; t: number }>()
const TTL = 12 * 3600 * 1000

async function tFetch(url: string, ms = 8000) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { signal: c.signal, cache: 'no-store' }) }
  finally { clearTimeout(t) }
}

// ── SOURCE 1: Yahoo Finance (no key needed) ────────────────────────────────
async function yahoo(symbol: string) {
  try {
    const [chartR, quoteR] = await Promise.allSettled([
      tFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=false`),
      tFetch(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`)
    ])

    const chartJ = chartR.status === 'fulfilled' && chartR.value.ok ? await chartR.value.json() : null
    const quoteJ = quoteR.status === 'fulfilled' && quoteR.value.ok ? await quoteR.value.json() : null

    const m = chartJ?.chart?.result?.[0]?.meta
    const q = quoteJ?.quoteResponse?.result?.[0]

    const price = q?.regularMarketPrice ?? m?.regularMarketPrice ?? 0
    if (!price) return null

    const prev = q?.regularMarketPreviousClose ?? m?.previousClose ?? m?.chartPreviousClose ?? 0

    // Earnings date — convert Unix timestamp to readable string
    let earningsDate: string | null = null
    const ets = q?.earningsTimestamp ?? q?.earningsTimestampStart ?? null
    if (ets) {
      earningsDate = new Date(ets * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    }

    // Ex-div date — convert Unix timestamp
    let exDivDate: string | null = null
    if (q?.exDividendDate) {
      exDivDate = new Date(q.exDividendDate * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    }

    return {
      price,
      previousClose: prev,
      open: q?.regularMarketOpen ?? m?.regularMarketOpen ?? null,
      dayHigh: q?.regularMarketDayHigh ?? m?.regularMarketDayHigh ?? null,
      dayLow: q?.regularMarketDayLow ?? m?.regularMarketDayLow ?? null,
      volume: q?.regularMarketVolume ?? m?.regularMarketVolume ?? null,
      marketCap: q?.marketCap ?? m?.marketCap ?? null,
      fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh ?? m?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: q?.fiftyTwoWeekLow ?? m?.fiftyTwoWeekLow ?? null,
      change: price - prev,
      changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
      pe: q?.trailingPE ?? null,
      eps: q?.epsTrailingTwelveMonths ?? null,
      dividendAmount: q?.trailingAnnualDividendRate ?? null,
      dividendYield: q?.trailingAnnualDividendYield
        ? q.trailingAnnualDividendYield * 100
        : null,
      exDivDate,
      earningsDate,
      name: q?.longName ?? q?.shortName ?? null,
      exchange: q?.fullExchangeName ?? q?.exchange ?? null,
    }
  } catch (e: any) { console.error('[Yahoo]', e.message); return null }
}

// ── SOURCE 2: Finnhub (key required) ──────────────────────────────────────
async function finnhub(symbol: string, key: string) {
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
  } catch (e: any) { console.error('[Finnhub]', e.message); return null }
}

// ── SOURCE 3: Polygon (key required) ──────────────────────────────────────
async function polygon(symbol: string, key: string) {
  if (!key) return null
  try {
    const [snapR, refR, divR] = await Promise.allSettled([
      tFetch(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${key}`),
      tFetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${key}`),
      tFetch(`https://api.polygon.io/v3/reference/dividends?ticker=${symbol}&limit=1&apiKey=${key}`),
    ])

    const snap = snapR.status === 'fulfilled' && snapR.value.ok ? await snapR.value.json() : null
    const ref = refR.status === 'fulfilled' && refR.value.ok ? await refR.value.json() : null
    const div = divR.status === 'fulfilled' && divR.value.ok ? await divR.value.json() : null

    const ticker = snap?.ticker
    const day = ticker?.day
    const info = ref?.results

    let divAmt: number | null = null
    let exDivDate: string | null = null
    if (div?.results?.length) {
      divAmt = div.results[0]?.cash_amount ?? null
      exDivDate = div.results[0]?.ex_dividend_date ?? null
    }

    return {
      price: ticker?.lastTrade?.p ?? ticker?.prevDay?.c ?? null,
      open: day?.o ?? null,
      dayHigh: day?.h ?? null,
      dayLow: day?.l ?? null,
      volume: day?.v ?? null,
      marketCap: info?.market_cap ?? null,
      name: info?.name ?? null,
      sector: info?.sic_description ?? null,
      logo: info?.branding?.icon_url
        ? `${info.branding.icon_url}?apiKey=${key}`
        : null,
      country: info?.locale?.toUpperCase() ?? 'US',
      exchange: info?.primary_exchange ?? null,
      divAmt,
      exDivDate,
    }
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
    // All 3 sources fire in parallel — no sequential waiting
    const [yq, fh, poly] = await Promise.all([
      yahoo(symbol),
      finnhub(symbol, fhKey),
      polygon(symbol, polyKey),
    ])

    const price = yq?.price ?? poly?.price ?? 0

    const out = {
      symbol,

      // ── Identity ───────────────────────────────
      name: yq?.name ?? fh?.name ?? poly?.name ?? symbol,
      sector: fh?.sector ?? poly?.sector ?? null,
      logo: fh?.logo ?? poly?.logo ?? null,
      country: fh?.country ?? poly?.country ?? 'US',
      exchange: yq?.exchange ?? fh?.exchange ?? poly?.exchange ?? null,

      // ── Price ──────────────────────────────────
      price,
      change: yq?.change ?? 0,
      changePercent: yq?.changePercent ?? 0,
      previousClose: yq?.previousClose ?? null,
      open: yq?.open ?? poly?.open ?? null,
      dayHigh: yq?.dayHigh ?? poly?.dayHigh ?? null,
      dayLow: yq?.dayLow ?? poly?.dayLow ?? null,
      volume: yq?.volume ?? poly?.volume ?? null,
      avgVolume: fh?.avgVolume ?? null,
      marketCap: yq?.marketCap ?? fh?.marketCap ?? poly?.marketCap ?? null,
      fiftyTwoWeekHigh: yq?.fiftyTwoWeekHigh ?? fh?.high52 ?? null,
      fiftyTwoWeekLow: yq?.fiftyTwoWeekLow ?? fh?.low52 ?? null,

      // ── Fundamentals ───────────────────────────
      // Yahoo → Finnhub → Polygon (each field independently)
      pe: yq?.pe ?? fh?.pe ?? null,
      eps: yq?.eps ?? fh?.eps ?? null,
      beta: fh?.beta ?? null,
      dividendYield: yq?.dividendYield ?? fh?.divYield ?? null,
      dividendAmount: yq?.dividendAmount ?? fh?.divAmt ?? poly?.divAmt ?? null,
      exDivDate: yq?.exDivDate ?? fh?.exDate ?? poly?.exDivDate ?? null,
      earningsDate: yq?.earningsDate ?? null,
      targetPrice: fh?.targetPrice ?? null,
    }

    console.log(`[detail] ${symbol} price:${price} pe:${out.pe} div:${out.dividendAmount} earnings:${out.earningsDate}`)
    MEM.set(symbol, { d: out, t: Date.now() })
    return NextResponse.json(out)

  } catch (e: any) {
    console.error(`[detail] ${symbol} FATAL:`, e.message)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
