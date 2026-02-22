import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory cache (12hr) ───────────────────────────────────────────────────
const CACHE = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 12 * 60 * 60 * 1000

// ─── Yahoo Finance ─────────────────────────────────────────────────────────────
async function fetchYahooQuote(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null

    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? 0
    const price = meta.regularMarketPrice ?? 0

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
  } catch {
    return null
  }
}

// ─── Finnhub Quote (fallback) ──────────────────────────────────────────────────
async function fetchFinnhubQuote(symbol: string) {
  try {
    const key = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    if (!key) return null
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`,
      { next: { revalidate: 300 } }
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
  } catch {
    return null
  }
}

// ─── Finnhub Fundamentals ──────────────────────────────────────────────────────
async function fetchFinnhubFundamentals(symbol: string) {
  try {
    const key = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    if (!key) return null

    const [metricsRes, profileRes] = await Promise.allSettled([
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
    ])

    const metrics =
      metricsRes.status === 'fulfilled' && metricsRes.value.ok
        ? await metricsRes.value.json()
        : null
    const profile =
      profileRes.status === 'fulfilled' && profileRes.value.ok
        ? await profileRes.value.json()
        : null

    const m = metrics?.metric ?? {}

    return {
      pe: m['peBasicExclExtraTTM'] ?? m['peTTM'] ?? null,
      eps: m['epsBasicExclExtraItemsTTM'] ?? m['epsTTM'] ?? null,
      beta: m['beta'] ?? null,
      fiftyTwoWeekHigh: m['52WeekHigh'] ?? null,
      fiftyTwoWeekLow: m['52WeekLow'] ?? null,
      dividendYield: m['currentDividendYieldTTM'] ?? null,
      dividendAmount: m['dividendsPerShareAnnual'] ?? null,
      marketCap: profile?.marketCapitalization
        ? profile.marketCapitalization * 1_000_000
        : null,
      name: profile?.name ?? null,
      sector: profile?.finnhubIndustry ?? null,
      industry: profile?.finnhubIndustry ?? null,
      logo: profile?.logo ?? null,
      country: profile?.country ?? 'US',
      exchange: profile?.exchange ?? null,
      webUrl: profile?.weburl ?? null,
    }
  } catch {
    return null
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 })

  // Return cache if valid
  const cached = CACHE.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ...cached.data, cached: true })
  }

  try {
    const [yahoo, finnhubQuote, finnhubFundamentals] = await Promise.all([
      fetchYahooQuote(symbol),
      fetchFinnhubQuote(symbol),
      fetchFinnhubFundamentals(symbol),
    ])

    const price = yahoo?.price ?? finnhubQuote?.price ?? 0
    const previousClose = yahoo?.previousClose ?? finnhubQuote?.previousClose ?? 0
    const change = yahoo?.change ?? finnhubQuote?.change ?? price - previousClose
    const changePercent =
      yahoo?.changePercent ??
      finnhubQuote?.changePercent ??
      (previousClose > 0 ? (change / previousClose) * 100 : 0)

    const result = {
      symbol,
      name: finnhubFundamentals?.name ?? symbol,
      price,
      change,
      changePercent,
      open: yahoo?.open ?? finnhubQuote?.open ?? null,
      previousClose,
      dayHigh: yahoo?.dayHigh ?? finnhubQuote?.dayHigh ?? null,
      dayLow: yahoo?.dayLow ?? finnhubQuote?.dayLow ?? null,
      volume: yahoo?.volume ?? null,
      marketCap: yahoo?.marketCap ?? finnhubFundamentals?.marketCap ?? null,
      fiftyTwoWeekHigh:
        yahoo?.fiftyTwoWeekHigh ?? finnhubFundamentals?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow:
        yahoo?.fiftyTwoWeekLow ?? finnhubFundamentals?.fiftyTwoWeekLow ?? null,
      pe: finnhubFundamentals?.pe ?? null,
      eps: finnhubFundamentals?.eps ?? null,
      beta: finnhubFundamentals?.beta ?? null,
      dividendYield: finnhubFundamentals?.dividendYield ?? null,
      dividendAmount: finnhubFundamentals?.dividendAmount ?? null,
      sector: finnhubFundamentals?.sector ?? 'Unknown',
      industry: finnhubFundamentals?.industry ?? 'Unknown',
      logo: finnhubFundamentals?.logo ?? null,
      country: finnhubFundamentals?.country ?? 'US',
      exchange: finnhubFundamentals?.exchange ?? null,
      webUrl: finnhubFundamentals?.webUrl ?? null,
      sources: {
        quote: yahoo ? 'yahoo' : finnhubQuote ? 'finnhub' : 'none',
        fundamentals: finnhubFundamentals ? 'finnhub' : 'none',
      },
    }

    CACHE.set(symbol, { data: result, timestamp: Date.now() })
    return NextResponse.json(result)
  } catch (error) {
    console.error(`[stock/detail] ${symbol}:`, error)
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
