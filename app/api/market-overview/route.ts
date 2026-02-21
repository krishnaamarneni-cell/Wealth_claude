import { NextResponse } from 'next/server'
import { getMsUntilNextMarketClose } from '@/lib/market-cache-utils'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY

interface Quote {
  c: number  // current price
  d: number  // change
  dp: number  // change percent
  h: number  // high
  l: number  // low
  pc: number  // previous close
}

const serverCache = new Map<string, { data: unknown; expiresAt: number }>()

async function fetchQuote(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data: Quote = await res.json()
    return data.c > 0 ? data : null
  } catch {
    return null
  }
}

const SECTOR_META: Record<string, string> = {
  XLK: 'Technology',
  XLE: 'Energy',
  XLC: 'Communication Services',
  XLY: 'Consumer Discretionary',
  XLF: 'Financials',
  XLI: 'Industrials',
  XLB: 'Materials',
  XLRE: 'Real Estate',
  XLV: 'Healthcare',
  XLP: 'Consumer Staples',
  XLU: 'Utilities',
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

  const TICKER_SYMS = ['SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'USO', 'AGG', 'UUP']
  const SECTOR_SYMS = Object.keys(SECTOR_META)
  const BTC_SYM = 'BINANCE:BTCUSDT'

  const allSymbols = [...new Set([...TICKER_SYMS, ...SECTOR_SYMS])]

  const [stockResults, btcQuote] = await Promise.all([
    Promise.all(allSymbols.map(sym => fetchQuote(sym).then(data => ({ sym, data })))),
    fetchQuote(BTC_SYM),
  ])

  const q: Record<string, Quote | null> = {}
  stockResults.forEach(({ sym, data }) => { q[sym] = data })
  q['BTC'] = btcQuote

  const toItem = (sym: string) => q[sym]
    ? { price: q[sym]!.c, change: q[sym]!.d, changePercent: q[sym]!.dp }
    : null

  const ticker = {
    sp500: toItem('SPY'),
    nasdaq: toItem('QQQ'),
    dow: toItem('DIA'),
    russell2000: toItem('IWM'),
    gold: toItem('GLD'),
    oil: toItem('USO'),
    bonds: toItem('AGG'),
    usdDollar: toItem('UUP'),
    bitcoin: toItem('BTC'),
  }

  const sectors = SECTOR_SYMS
    .map(sym => ({
      name: SECTOR_META[sym],
      symbol: sym,
      price: q[sym]?.c ?? 0,
      change: q[sym]?.d ?? 0,
      changePercent: q[sym]?.dp ?? 0,
    }))
    .filter(s => s.price > 0)

  const result = { ticker, sectors, timestamp: Date.now() }
  serverCache.set(CACHE_KEY, { data: result, expiresAt: Date.now() + getMsUntilNextMarketClose() })
  return NextResponse.json(result)
}
