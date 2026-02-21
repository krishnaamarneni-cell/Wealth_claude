import { NextResponse } from 'next/server'
import { getMsUntilNextMarketClose } from '@/lib/market-cache-utils'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc', MSFT: 'Microsoft Corp', NVDA: 'Nvidia Corp',
  AMZN: 'Amazon.com Inc', META: 'Meta Platforms', GOOGL: 'Alphabet Inc',
  GOOG: 'Alphabet Inc', TSLA: 'Tesla Inc', AVGO: 'Broadcom Inc',
  JPM: 'JPMorgan Chase', LLY: 'Eli Lilly', V: 'Visa Inc',
  UNH: 'UnitedHealth Group', XOM: 'Exxon Mobil', MA: 'Mastercard Inc',
  ORCL: 'Oracle Corp', COST: 'Costco Wholesale', HD: 'Home Depot',
  WMT: 'Walmart Inc', NFLX: 'Netflix Inc', AMD: 'Advanced Micro Devices',
  BAC: 'Bank of America', CRM: 'Salesforce Inc', QCOM: 'Qualcomm Inc',
  AMAT: 'Applied Materials', PEP: 'PepsiCo Inc', KO: 'Coca-Cola Co',
  CSCO: 'Cisco Systems', ABT: 'Abbott Labs', TXN: 'Texas Instruments',
  GE: 'GE Aerospace', MRK: 'Merck & Co', PFE: 'Pfizer Inc',
  DIS: 'Walt Disney Co', GS: 'Goldman Sachs', MS: 'Morgan Stanley',
  WFC: 'Wells Fargo', INTC: 'Intel Corp', BA: 'Boeing Co',
  CAT: 'Caterpillar Inc', AXP: 'American Express', MCD: "McDonald's Corp",
  IBM: 'IBM Corp', AMGN: 'Amgen Inc', NKE: 'Nike Inc',
  CVX: 'Chevron Corp', HON: 'Honeywell Intl', JNJ: 'Johnson & Johnson',
  MRVL: 'Marvell Technology', SMCI: 'Super Micro Computer', RIVN: 'Rivian Automotive',
  LCID: 'Lucid Group', PLTR: 'Palantir Technologies', COIN: 'Coinbase Global',
  UBER: 'Uber Technologies', SNAP: 'Snap Inc', PINS: 'Pinterest Inc',
  RBLX: 'Roblox Corp', HOOD: 'Robinhood Markets', SOFI: 'SoFi Technologies',
  GME: 'GameStop Corp', AMC: 'AMC Entertainment', CELH: 'Celsius Holdings',
  ARM: 'Arm Holdings', ASML: 'ASML Holding', TSM: 'Taiwan Semiconductor',
  SHOP: 'Shopify Inc', SQ: 'Block Inc', PYPL: 'PayPal Holdings',
  ABNB: 'Airbnb Inc', DASH: 'DoorDash Inc', CRWD: 'CrowdStrike Holdings',
  PANW: 'Palo Alto Networks', NET: 'Cloudflare Inc', SNOW: 'Snowflake Inc',
  ROKU: 'Roku Inc', ZM: 'Zoom Video', DKNG: 'DraftKings Inc',
}

const serverCache = new Map<string, { data: unknown; expiresAt: number }>()

export async function GET() {
  const CACHE_KEY = 'market-movers'
  const cached = serverCache.get(CACHE_KEY)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ ...cached.data, fromCache: true })
  }

  if (!POLYGON_API_KEY) {
    return NextResponse.json({ error: 'POLYGON_API_KEY not set', gainers: [], losers: [] }, { status: 500 })
  }

  try {
    const BASE = 'https://api.polygon.io/v2/snapshot/locale/us/markets/stocks'
    const [gRes, lRes] = await Promise.all([
      fetch(`${BASE}/gainers?apiKey=${POLYGON_API_KEY}&include_otc=false`, { cache: 'no-store' }),
      fetch(`${BASE}/losers?apiKey=${POLYGON_API_KEY}&include_otc=false`, { cache: 'no-store' }),
    ])

    if (!gRes.ok || !lRes.ok) {
      throw new Error(`Polygon: ${gRes.status} / ${lRes.status}`)
    }

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
        .filter(t =>
          (t.day?.c ?? 0) > 2 &&                          // no penny stocks
          Math.abs(t.todaysChangePerc ?? 0) < 100         // no erroneous data
        )
        .slice(0, 10)
        .map(mapMover)

    const result = {
      gainers: clean(gData.tickers),
      losers: clean(lData.tickers),
      timestamp: Date.now(),
    }

    serverCache.set(CACHE_KEY, { data: result, expiresAt: Date.now() + getMsUntilNextMarketClose() })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[market-movers]', err)
    return NextResponse.json({ error: 'Failed to fetch', gainers: [], losers: [] }, { status: 500 })
  }
}
