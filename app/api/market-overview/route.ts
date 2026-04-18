import { NextResponse } from 'next/server'
import { getMsUntilNextMarketClose } from '@/lib/market-cache-utils'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY

interface Quote { c: number; d: number; dp: number; h: number; l: number; pc: number }

const serverCache = new Map<string, { data: unknown; expiresAt: number }>()

// Sleep helper for throttling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Fetch with retry on rate limit (429)
async function fetchQuote(symbol: string, retries = 2): Promise<Quote | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`,
        { cache: 'no-store' }
      )
      if (res.status === 429 && attempt < retries) {
        // Rate-limited — wait and retry with exponential backoff
        await sleep(1000 * (attempt + 1))
        continue
      }
      if (!res.ok) return null
      const data: Quote = await res.json()
      return data.c > 0 ? data : null
    } catch {
      if (attempt === retries) return null
      await sleep(500)
    }
  }
  return null
}

// Batch quotes with small delays to avoid Finnhub burst rate limit
async function fetchQuotesBatched(symbols: string[], batchSize = 5, delayMs = 150): Promise<Record<string, Quote | null>> {
  const result: Record<string, Quote | null> = {}
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(sym => fetchQuote(sym).then(data => ({ sym, data })))
    )
    batchResults.forEach(({ sym, data }) => { result[sym] = data })
    if (i + batchSize < symbols.length) {
      await sleep(delayMs)
    }
  }
  return result
}

const SECTOR_META: Record<string, string> = {
  XLK: 'Technology', XLE: 'Energy',
  XLC: 'Communication Services', XLY: 'Consumer Discretionary',
  XLF: 'Financials', XLI: 'Industrials',
  XLB: 'Materials', XLRE: 'Real Estate',
  XLV: 'Healthcare', XLP: 'Consumer Staples',
  XLU: 'Utilities',
}

const GLOBAL_META: Record<string, { label: string; region: string; flag: string }> = {
  SPY: { label: 'S&P 500', region: 'United States', flag: '🇺🇸' },
  EWG: { label: 'DAX', region: 'Germany', flag: '🇩🇪' },
  EWU: { label: 'FTSE 100', region: 'UK', flag: '🇬🇧' },
  EWJ: { label: 'Nikkei', region: 'Japan', flag: '🇯🇵' },
  MCHI: { label: 'CSI 300', region: 'China', flag: '🇨🇳' },
  EWZ: { label: 'Bovespa', region: 'Brazil', flag: '🇧🇷' },
  INDA: { label: 'Nifty 50', region: 'India', flag: '🇮🇳' },
}

export async function GET() {
  const CACHE_KEY = 'market-overview'
  const cached = serverCache.get(CACHE_KEY)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ ...cached.data, fromCache: true })
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 500 })
  }

  const TICKER_SYMS = ['SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'USO', 'UNG', 'CPER', 'AGG', 'UUP']
  const SECTOR_SYMS = Object.keys(SECTOR_META)
  const GLOBAL_SYMS = Object.keys(GLOBAL_META)
  const BTC_SYM = 'BINANCE:BTCUSDT'

  const allSymbols = [...new Set([...TICKER_SYMS, ...SECTOR_SYMS, ...GLOBAL_SYMS, BTC_SYM])]

  // Fetch in batches of 5 with 150ms delay to respect Finnhub burst limits
  const q = await fetchQuotesBatched(allSymbols, 5, 150)
  q['BTC'] = q[BTC_SYM] ?? null

  const toItem = (sym: string) => q[sym]
    ? { price: q[sym]!.c, change: q[sym]!.d, changePercent: q[sym]!.dp }
    : null

  const ticker = {
    sp500: toItem('SPY'),
    nasdaq: toItem('QQQ'),
    dow: toItem('DIA'),
    russell2000: toItem('IWM'),
    gold: toItem('GLD'),
    silver: toItem('SLV'),
    oil: toItem('USO'),
    natgas: toItem('UNG'),
    copper: toItem('CPER'),
    bonds: toItem('AGG'),
    usdDollar: toItem('UUP'),
    bitcoin: toItem('BTC'),
  }

  const sectors = SECTOR_SYMS
    .map(sym => ({
      name: SECTOR_META[sym], symbol: sym,
      price: q[sym]?.c ?? 0, change: q[sym]?.d ?? 0, changePercent: q[sym]?.dp ?? 0,
    }))
    .filter(s => s.price > 0)

  const globalMarkets = GLOBAL_SYMS
    .map(sym => ({
      ...GLOBAL_META[sym],
      symbol: sym,
      price: q[sym]?.c ?? 0,
      change: q[sym]?.d ?? 0,
      changePercent: q[sym]?.dp ?? 0,
    }))
    .filter(g => g.price > 0)

  const result = { ticker, sectors, globalMarkets, timestamp: Date.now() }

  // Only cache for full duration if we got mostly complete data.
  // If too many fields are null (rate-limited), cache for only 60 seconds so next request retries.
  const tickerFilled = Object.values(ticker).filter(v => v !== null).length
  const tickerTotal = Object.keys(ticker).length
  const isHealthy = tickerFilled >= tickerTotal * 0.6 && sectors.length >= 7 && globalMarkets.length >= 5

  const cacheExpiry = isHealthy
    ? Date.now() + getMsUntilNextMarketClose()
    : Date.now() + 60 * 1000 // 60s for partial data — retry soon

  serverCache.set(CACHE_KEY, { data: result, expiresAt: cacheExpiry })
  return NextResponse.json({ ...result, healthy: isHealthy })
}
