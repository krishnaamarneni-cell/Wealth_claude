import { NextRequest, NextResponse } from 'next/server'

const CACHE = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 12 * 60 * 60 * 1000

// ─── Fetch with Timeout ────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    return res
  } finally {
    clearTimeout(timer)
  }
}

// ─── Yahoo Finance ─────────────────────────────────────────────────────────────
async function fetchYahooQuote(symbol: string) {
  try {
    const res = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=false`,
    )
    if (!res.ok) {
      console.log(`[Yahoo] ${symbol} failed: ${res.status}`)
      return null
    }
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) {
      console.log(`[Yahoo] ${symbol} no price in meta`)
      return null
    }

    const price = meta.regularMarketPrice ?? 0
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? 0

    return {
      price,
      previousClose: prevClose,
      open: meta.regularMarketOpen ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      marketCap: meta.marketCap ?? null,
      change: price - prevClose,
      changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
    }
  } catch (e) {
    console.error(`[Yahoo] ${symbol} error:`, e)
    return null
  }
}

// ─── Finnhub Quote fallback ────────────────────────────────────────────────────
async function fetchFinnhubQuote(symbol: string, key: string) {
  try {
    const res = await fetchWithTimeout(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`
    )
    if (!res.ok) return null
    const d = await res.json()
    if (!d.c || d.c === 0) return null
    return {
      price: d.c,
      change: d.d ?? 0,
      changePercent: d.dp ?? 0,
      open: d.o ?? null,
      previousClose: d.pc ?? null,
      dayHigh: d.h ?? null,
      dayLow: d.l ?? null,
    }
  } catch { return null }
}

// ─── Finnhub Fundamentals ──────────────────────────────────────────────────────
async function fetchFinnhubAll(symbol: string, key: string) {
  try {
    const [metricsRes, profileRes, targetRes, dividendRes] = await Promise.allSettled([
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${key}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/dividend2?symbol=${symbol}&token=${key}`),
    ])

    const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.ok
      ? await metricsRes.value.json() : null
    const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
      ? await profileRes.value.json() : null
    const target = targetRes.status === 'fulfilled' && targetRes.value.ok
      ? await targetRes.value.json() : null
    const dividend = dividendRes.status === 'fulfilled' && dividendRes.value.ok
      ? await dividendRes.value.json() : null

    const m = metrics?.metric ?? {}

    // Avg volume: Finnhub returns in millions for some fields
    const avgVolume10 = m['10DayAverageTradingVolume']
      ? Math.round(m['10DayAverageTradingVolume'] * 1_000_000)
      : null
    const avgVolume90 = m['3MonthAverageTradingVolume']
      ? Math.round(m['3MonthAverageTradingVolume'] * 1_000_000)
      : null

    // Next dividend info from dividend2 endpoint
    let nextDivAmount: number | null = null
    let nextExDivDate: string | null = null
    if (Array.isArray(dividend) && dividend.length > 0) {
      const upcoming = dividend
        .filter((d: any) => new Date(d.exDate) >= new Date())
        .sort((a: any, b: any) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime())
      if (upcoming.length > 0) {
        nextDivAmount = upcoming[0].amount
        nextExDivDate = upcoming[0].exDate
      } else {
        // fallback to most recent
        const sorted = [...dividend].sort(
          (a: any, b: any) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime()
        )
        nextDivAmount = sorted[0]?.amount ?? null
        nextExDivDate = sorted[0]?.exDate ?? null
      }
    }

    return {
      pe: m['peBasicExclExtraTTM'] ?? m['peTTM'] ?? null,
      eps: m['epsBasicExclExtraItemsTTM'] ?? m['epsTTM'] ?? null,
      beta: m['beta'] ?? null,
      fiftyTwoWeekHigh: m['52WeekHigh'] ?? null,
      fiftyTwoWeekLow: m['52WeekLow'] ?? null,
      dividendYield: m['currentDividendYieldTTM'] ?? null,
      dividendAmount: nextDivAmount ?? (m['dividendsPerShareAnnual'] ? m['dividendsPerShareAnnual'] / 4 : null),
      exDivDate: nextExDivDate,
      avgVolume: avgVolume10 ?? avgVolume90,
      targetPrice: target?.targetMean ?? target?.targetHigh ?? null,
      marketCap: profile?.marketCapitalization
        ? profile.marketCapitalization * 1_000_000 : null,
      name: profile?.name ?? null,
      sector: profile?.finnhubIndustry ?? null,
      industry: profile?.finnhubIndustry ?? null,
      logo: profile?.logo ?? null,
      country: profile?.country ?? 'US',
      exchange: profile?.exchange ?? null,
      webUrl: profile?.weburl ?? null,
    }
  } catch (e) {
    console.error(`[FinnhubAll] ${symbol} error:`, e)
    return null
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 })

  const cached = CACHE.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ...cached.data, cached: true })
  }

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ''
  console.log(`[detail] ${symbol} — Finnhub key: ${fhKey ? 'OK' : 'MISSING'}`)

  try {
    const [yahoo, fhQuote, fhAll] = await Promise.all([
      fetchYahooQuote(symbol),
      fetchFinnhubQuote(symbol, fhKey),
      fetchFinnhubAll(symbol, fhKey),
    ])

    const price = yahoo?.price ?? fhQuote?.price ?? 0
    const prevClose = yahoo?.previousClose ?? fhQuote?.previousClose ?? 0
    const change = yahoo?.change ?? fhQuote?.change ?? price - prevClose
    const changePercent = yahoo?.changePercent ?? fhQuote?.changePercent
      ?? (prevClose > 0 ? (change / prevClose) * 100 : 0)

    const result = {
      symbol,
      name: fhAll?.name ?? symbol,
      price,
      change,
      changePercent,
      open: yahoo?.open ?? fhQuote?.open ?? null,
      previousClose: prevClose,
      dayHigh: yahoo?.dayHigh ?? fhQuote?.dayHigh ?? null,
      dayLow: yahoo?.dayLow ?? fhQuote?.dayLow ?? null,
      volume: yahoo?.volume ?? null,
      avgVolume: fhAll?.avgVolume ?? null,
      marketCap: yahoo?.marketCap ?? fhAll?.marketCap ?? null,
      fiftyTwoWeekHigh: yahoo?.fiftyTwoWeekHigh ?? fhAll?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: yahoo?.fiftyTwoWeekLow ?? fhAll?.fiftyTwoWeekLow ?? null,
      pe: fhAll?.pe ?? null,
      eps: fhAll?.eps ?? null,
      beta: fhAll?.beta ?? null,
      dividendYield: fhAll?.dividendYield ?? null,
      dividendAmount: fhAll?.dividendAmount ?? null,
      exDivDate: fhAll?.exDivDate ?? null,
      targetPrice: fhAll?.targetPrice ?? null,
      sector: fhAll?.sector ?? 'Unknown',
      industry: fhAll?.industry ?? 'Unknown',
      logo: fhAll?.logo ?? null,
      country: fhAll?.country ?? 'US',
      exchange: fhAll?.exchange ?? null,
      webUrl: fhAll?.webUrl ?? null,
      sources: {
        quote: yahoo ? 'yahoo' : fhQuote ? 'finnhub' : 'none',
        fundamentals: fhAll ? 'finnhub' : 'none',
      },
    }

    console.log(`[detail] ${symbol} done — price:${price} volume:${result.volume} pe:${result.pe}`)
    CACHE.set(symbol, { data: result, timestamp: Date.now() })
    return NextResponse.json(result)

  } catch (error) {
    console.error(`[detail] ${symbol} fatal:`, error)
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
