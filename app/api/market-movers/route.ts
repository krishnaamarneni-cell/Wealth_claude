import { NextResponse } from 'next/server'
import { getMsUntilNextMarketClose } from '@/lib/market-cache-utils'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY

// ── Current Dow 30 (Feb 2026) ──────────────────────────────────────────
const DOW_30 = [
  'GS', 'CAT', 'MSFT', 'HD', 'AMGN', 'SHW', 'AXP', 'MCD', 'V', 'JPM',
  'TRV', 'UNH', 'AAPL', 'IBM', 'HON', 'JNJ', 'BA', 'AMZN', 'NVDA', 'CRM',
  'CVX', 'MMM', 'PG', 'WMT', 'MRK', 'DIS', 'KO', 'CSCO', 'NKE', 'VZ',
]

// ── Nasdaq 100 top 40 ──────────────────────────────────────────────────
const NASDAQ_40 = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AVGO', 'COST', 'NFLX',
  'AMD', 'QCOM', 'AMAT', 'ADBE', 'MU', 'LRCX', 'KLAC', 'MRVL', 'PANW', 'CRWD',
  'CDNS', 'SNPS', 'MELI', 'GILD', 'REGN', 'VRTX', 'AMGN', 'ISRG', 'ADP', 'FAST',
  'ROST', 'ORLY', 'PCAR', 'CPRT', 'CTAS', 'PLTR', 'COIN', 'ABNB', 'DASH', 'TXN',
]

// ── S&P 500 extra large caps ───────────────────────────────────────────
const SP500_EXTRA = [
  'LLY', 'XOM', 'MA', 'UNH', 'BAC', 'ABBV', 'KO', 'PEP', 'TMO', 'ACN',
  'COP', 'NEE', 'LIN', 'BMY', 'RTX', 'GE', 'LOW', 'SBUX', 'CMCSA', 'WFC',
  'MS', 'BLK', 'SCHW', 'C', 'PNC', 'USB', 'TFC', 'SO', 'DUK', 'PM',
  'PLD', 'AMT', 'EQIX', 'PSA', 'SPGI', 'ICE', 'CME', 'MCO', 'PYPL', 'SQ',
]

const SP500_TOP = [...new Set([...DOW_30, ...NASDAQ_40, ...SP500_EXTRA])]

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc', MSFT: 'Microsoft Corp', NVDA: 'Nvidia Corp',
  AMZN: 'Amazon.com Inc', META: 'Meta Platforms', GOOGL: 'Alphabet Inc',
  TSLA: 'Tesla Inc', AVGO: 'Broadcom Inc', JPM: 'JPMorgan Chase',
  LLY: 'Eli Lilly', V: 'Visa Inc', UNH: 'UnitedHealth Group',
  XOM: 'Exxon Mobil', MA: 'Mastercard Inc', ORCL: 'Oracle Corp',
  COST: 'Costco Wholesale', HD: 'Home Depot', WMT: 'Walmart Inc',
  NFLX: 'Netflix Inc', AMD: 'Advanced Micro Devices', BAC: 'Bank of America',
  CRM: 'Salesforce Inc', QCOM: 'Qualcomm Inc', AMAT: 'Applied Materials',
  PEP: 'PepsiCo Inc', KO: 'Coca-Cola Co', CSCO: 'Cisco Systems',
  ABT: 'Abbott Labs', TXN: 'Texas Instruments', GE: 'GE Aerospace',
  MRK: 'Merck & Co', PFE: 'Pfizer Inc', DIS: 'Walt Disney Co',
  GS: 'Goldman Sachs', MS: 'Morgan Stanley', WFC: 'Wells Fargo',
  INTC: 'Intel Corp', BA: 'Boeing Co', CAT: 'Caterpillar Inc',
  AXP: 'American Express', MCD: "McDonald's Corp", IBM: 'IBM Corp',
  AMGN: 'Amgen Inc', NKE: 'Nike Inc', CVX: 'Chevron Corp',
  HON: 'Honeywell Intl', JNJ: 'Johnson & Johnson', MRVL: 'Marvell Technology',
  SMCI: 'Super Micro Computer', RIVN: 'Rivian Automotive', LCID: 'Lucid Group',
  PLTR: 'Palantir Technologies', COIN: 'Coinbase Global', UBER: 'Uber Technologies',
  SNAP: 'Snap Inc', PINS: 'Pinterest Inc', RBLX: 'Roblox Corp',
  HOOD: 'Robinhood Markets', SOFI: 'SoFi Technologies', CELH: 'Celsius Holdings',
  ARM: 'Arm Holdings', ASML: 'ASML Holding', TSM: 'Taiwan Semiconductor',
  SHOP: 'Shopify Inc', SQ: 'Block Inc', PYPL: 'PayPal Holdings',
  ABNB: 'Airbnb Inc', DASH: 'DoorDash Inc', CRWD: 'CrowdStrike Holdings',
  PANW: 'Palo Alto Networks', NET: 'Cloudflare Inc', SNOW: 'Snowflake Inc',
  SHW: 'Sherwin-Williams', TRV: 'Travelers Companies', MMM: '3M Company',
  PG: 'Procter & Gamble', VZ: 'Verizon Communications', LIN: 'Linde Plc',
  ACN: 'Accenture Plc', NEE: 'NextEra Energy', SO: 'Southern Co',
  DUK: 'Duke Energy', PLD: 'Prologis Inc', AMT: 'American Tower',
  EQIX: 'Equinix Inc', SPGI: 'S&P Global', BLK: 'BlackRock Inc',
  SCHW: 'Charles Schwab', MCO: 'Moody\'s Corp',
}

const serverCache = new Map<string, { data: unknown; expiresAt: number }>()

async function finnhubQuote(sym: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const d = await res.json()
    return d.c > 0 ? { price: d.c, change: d.d ?? 0, changePercent: d.dp ?? 0 } : null
  } catch { return null }
}

function buildMovers(
  quotes: Record<string, { price: number; change: number; changePercent: number }>,
  symbols: string[],
  top = 5
) {
  const ranked = symbols
    .filter(s => quotes[s])
    .map(s => ({
      symbol: s,
      name: COMPANY_NAMES[s] ?? s,
      price: quotes[s].price,
      change: quotes[s].change,
      changePercent: quotes[s].changePercent,
    }))
    .filter(m => m.price > 2 && Math.abs(m.changePercent) < 100)
    .sort((a, b) => b.changePercent - a.changePercent)

  return {
    gainers: ranked.slice(0, top),
    losers: ranked.slice(-top).reverse(),
  }
}

export async function GET() {
  const CACHE_KEY = 'market-movers'
  const cached = serverCache.get(CACHE_KEY)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ ...cached.data, fromCache: true })
  }

  // ── 0: Try Supabase cache first (populated by /api/cron/refresh-pulse) ──
  try {
    const { createClient: createSbClient } = await import('@supabase/supabase-js')
    const sb = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: row } = await sb
      .from('global_pulse_cache')
      .select('data, updated_at')
      .eq('key', 'market-movers')
      .maybeSingle()
    if (row?.data) {
      const ageMs = Date.now() - new Date(row.updated_at).getTime()
      if (ageMs < 30 * 60 * 1000) {
        return NextResponse.json({
          ...(row.data as object),
          fromSupabaseCache: true,
        }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
      }
    }
  } catch { /* fall through to live fetch */ }

  // ── 1st: Try Polygon (market-wide, same data for all 3 tabs) ──────────
  if (POLYGON_API_KEY) {
    try {
      const BASE = 'https://api.polygon.io/v2/snapshot/locale/us/markets/stocks'
      const [gRes, lRes] = await Promise.all([
        fetch(`${BASE}/gainers?apiKey=${POLYGON_API_KEY}&include_otc=false`, { cache: 'no-store' }),
        fetch(`${BASE}/losers?apiKey=${POLYGON_API_KEY}&include_otc=false`, { cache: 'no-store' }),
      ])
      if (gRes.ok && lRes.ok) {
        const [gData, lData] = await Promise.all([gRes.json(), lRes.json()])
        const mapMover = (t: any) => ({
          symbol: t.ticker ?? '',
          name: COMPANY_NAMES[t.ticker] ?? t.ticker ?? '',
          price: t.day?.c ?? t.lastTrade?.p ?? 0,
          change: t.todaysChange ?? 0,
          changePercent: t.todaysChangePerc ?? 0,
        })
        const clean = (tickers: any[]) =>
          (tickers ?? [])
            .filter(t => (t.day?.c ?? 0) > 2 && Math.abs(t.todaysChangePerc ?? 0) < 100)
            .slice(0, 5).map(mapMover)

        const gainers = clean(gData.tickers)
        const losers = clean(lData.tickers)
        const result = {
          sp500: { gainers, losers },
          nasdaq: { gainers, losers },
          dow: { gainers, losers },
          source: 'polygon', timestamp: Date.now(),
        }
        serverCache.set(CACHE_KEY, { data: result, expiresAt: Date.now() + getMsUntilNextMarketClose() })
        return NextResponse.json(result)
      }
    } catch (err) {
      console.warn('[market-movers] Polygon failed, trying Finnhub:', err)
    }
  }

  // ── 2nd: Fallback — Finnhub index constituents ────────────────────────
  if (!FINNHUB_API_KEY) {
    return NextResponse.json({
      error: 'No API keys configured',
      sp500: { gainers: [], losers: [] },
      nasdaq: { gainers: [], losers: [] },
      dow: { gainers: [], losers: [] },
    }, { status: 500 })
  }

  try {
    const allUnique = [...new Set([...SP500_TOP])] // ~90 unique symbols

    // Fetch all concurrently — cached until EOD so this runs once per day
    const quoteResults = await Promise.all(
      allUnique.map(sym => finnhubQuote(sym).then(data => ({ sym, data })))
    )

    const quotes: Record<string, { price: number; change: number; changePercent: number }> = {}
    quoteResults.forEach(({ sym, data }) => { if (data) quotes[sym] = data })

    const result = {
      sp500: buildMovers(quotes, SP500_TOP),
      nasdaq: buildMovers(quotes, NASDAQ_40),
      dow: buildMovers(quotes, DOW_30),
      source: 'finnhub',
      timestamp: Date.now(),
    }

    serverCache.set(CACHE_KEY, { data: result, expiresAt: Date.now() + getMsUntilNextMarketClose() })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[market-movers] Finnhub fallback failed:', err)
    return NextResponse.json({
      error: 'All sources failed',
      sp500: { gainers: [], losers: [] },
      nasdaq: { gainers: [], losers: [] },
      dow: { gainers: [], losers: [] },
    }, { status: 500 })
  }
}
