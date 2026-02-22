import { NextRequest, NextResponse } from 'next/server'

const MEM = new Map<string, { d: unknown; t: number }>()
const TTL = 12 * 3600 * 1000

async function tFetch(url: string, ms = 8000) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { signal: c.signal, cache: 'no-store' }) }
  finally { clearTimeout(t) }
}

function safeNum(v: any): number | null {
  if (v == null) return null
  const n = Number(v)
  return isFinite(n) && n !== 0 ? n : null
}

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const ys = symbol.replace(/\./g, '-')
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ys}?interval=1d&range=1d`
    )
    if (!r.ok) return null
    const j = await r.json()
    return j?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch { return null }
}

async function fetchFinnhub(symbol: string, key: string) {
  if (!key) return null
  try {
    const [mR, pR] = await Promise.allSettled([
      tFetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
    ])
    const metrics = mR.status === 'fulfilled' && mR.value.ok ? await mR.value.json() : null
    const profile = pR.status === 'fulfilled' && pR.value.ok ? await pR.value.json() : null

    const m = metrics?.metric ?? {}
    const sharesMillions = safeNum(profile?.shareOutstanding) // Finnhub gives shares in millions
    const sharesOut = sharesMillions ? sharesMillions * 1e6 : null

    const eps = safeNum(m['epsBasicExclExtraItemsTTM']) ?? safeNum(m['epsTTM'])
    const netMargin = safeNum(m['netProfitMarginTTM'])
    const pe = safeNum(m['peBasicExclExtraTTM']) ?? safeNum(m['peTTM'])
    const revGrowth = safeNum(m['revenueGrowthTTMYoy'])
    const revPerShare = safeNum(m['revenuePerShareTTM'])

    // Revenue: revenuePerShare × shares (primary) or EPS/margin derivation (fallback)
    const revenue =
      revPerShare && sharesOut
        ? revPerShare * sharesOut
        : eps && sharesOut && netMargin
          ? (eps * sharesOut) / (netMargin / 100)
          : null

    return {
      name: profile?.name ?? symbol,
      logo: profile?.logo ?? null,
      exchange: profile?.exchange ?? null,
      sector: profile?.finnhubIndustry ?? null,
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      sharesOut,
      eps,
      netMargin,
      pe,
      revGrowth,
      revenue,
    }
  } catch (e: any) { console.error('[Projection]', e.message); return null }
}

export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()?.trim()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = MEM.get(symbol)
  if (hit && Date.now() - hit.t < TTL) return NextResponse.json(hit.d)

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ''
  const [price, fh] = await Promise.all([
    fetchYahooPrice(symbol),
    fetchFinnhub(symbol, fhKey),
  ])

  if (!price || !fh?.eps) {
    return NextResponse.json({ error: 'Data unavailable' }, { status: 500 })
  }

  const out = {
    symbol,
    name: fh.name,
    logo: fh.logo,
    exchange: fh.exchange,
    sector: fh.sector,
    marketCap: fh.marketCap,
    price,
    eps: fh.eps,
    netMargin: fh.netMargin,
    pe: fh.pe,
    revGrowth: fh.revGrowth,
    revenue: fh.revenue,
    sharesOut: fh.sharesOut,
  }

  console.log(`[projection] ${symbol} eps:${out.eps} margin:${out.netMargin} pe:${out.pe} rev:${out.revenue}`)
  MEM.set(symbol, { d: out, t: Date.now() })
  return NextResponse.json(out)
}
