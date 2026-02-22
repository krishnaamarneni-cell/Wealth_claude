import { NextRequest, NextResponse } from 'next/server'

const MEM_CHART = new Map<string, { d: unknown; t: number }>()
const MEM_FUND = new Map<string, { d: unknown; t: number }>()
const TTL = 12 * 3600 * 1000

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7'
]

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

// ── Yahoo daily history — 5Y ──────────────────────────────────────────
async function fetchHistory(symbol: string): Promise<{ date: string; price: number }[]> {
  try {
    const ys = symbol.replace(/\./g, '-')
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ys}?interval=1d&range=5y`
    )
    if (!r.ok) return []
    const j = await r.json()
    const res = j?.chart?.result?.[0]
    if (!res) return []
    const ts = res.timestamp as number[]
    const close = res.indicators?.quote?.[0]?.close as (number | null)[]
    const seen = new Set<string>()
    const pts: { date: string; price: number }[] = []
    for (let i = 0; i < ts.length; i++) {
      const price = close[i]
      if (price == null || !isFinite(price)) continue
      const date = new Date(ts[i] * 1000).toISOString().split('T')[0]
      if (seen.has(date)) continue
      seen.add(date)
      pts.push({ date, price })
    }
    return pts
  } catch { return [] }
}

// ── Yahoo price ───────────────────────────────────────────────────────
async function fetchYahooPrice(symbol: string) {
  try {
    const ys = symbol.replace(/\./g, '-')
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ys}?interval=1d&range=1d`
    )
    if (!r.ok) return null
    const j = await r.json()
    const m = j?.chart?.result?.[0]?.meta
    if (!m?.regularMarketPrice) return null
    const price = m.regularMarketPrice
    const prev = m.previousClose ?? m.chartPreviousClose ?? 0
    return {
      price,
      change: price - prev,
      changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
    }
  } catch { return null }
}

// ── Finnhub fundamentals ──────────────────────────────────────────────
async function fetchFinnhubFund(symbol: string, key: string) {
  if (!key) return null
  try {
    const [mR, pR, dR] = await Promise.allSettled([
      tFetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/dividend2?symbol=${symbol}&token=${key}`),
    ])
    const metrics = mR.status === 'fulfilled' && mR.value.ok ? await mR.value.json() : null
    const profile = pR.status === 'fulfilled' && pR.value.ok ? await pR.value.json() : null
    const dividend = dR.status === 'fulfilled' && dR.value.ok ? await dR.value.json() : null

    const m = metrics?.metric ?? {}

    let divAmt: number | null = null
    if (Array.isArray(dividend) && dividend.length > 0) {
      const sorted = [...dividend].sort((a: any, b: any) =>
        new Date(b.exDate).getTime() - new Date(a.exDate).getTime())
      divAmt = sorted[0]?.amount ?? null
    }

    return {
      name: profile?.name ?? null,
      logo: profile?.logo ?? null,
      sector: profile?.finnhubIndustry ?? null,
      exchange: profile?.exchange ?? null,
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      pe: safeNum(m['peBasicExclExtraTTM']) ?? safeNum(m['peTTM']),
      eps: safeNum(m['epsBasicExclExtraItemsTTM']) ?? safeNum(m['epsTTM']),
      beta: safeNum(m['beta']),
      pb: safeNum(m['pb']),
      roe: safeNum(m['roeTTM']),
      netMargin: safeNum(m['netProfitMarginTTM']),
      grossMargin: safeNum(m['grossMarginTTM']),
      revenueGrowth: safeNum(m['revenueGrowthTTMYoy']),
      epsGrowth: safeNum(m['epsGrowthTTMYoy']),
      debtToEquity: safeNum(m['totalDebt/totalEquityAnnual']),
      divYield: safeNum(m['currentDividendYieldTTM']),
      divAmt,
      high52: safeNum(m['52WeekHigh']),
      low52: safeNum(m['52WeekLow']),
    }
  } catch (e: any) { console.error('[CompareFund]', e.message); return null }
}

// ── GET ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const raw = p.get('symbols') ?? ''
  const mode = p.get('mode') ?? 'chart'
  const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
  if (!symbols.length) return NextResponse.json({ error: 'symbols required' }, { status: 400 })

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ''

  if (mode === 'chart') {
    const limited = symbols.slice(0, 10)
    const results = await Promise.all(
      limited.map(async (sym, i) => {
        const cKey = `chart_${sym}`
        const hit = MEM_CHART.get(cKey)
        if (hit && Date.now() - hit.t < TTL)
          return { symbol: sym, color: COLORS[i % COLORS.length], history: hit.d, cached: true }
        const history = await fetchHistory(sym)
        if (history.length) MEM_CHART.set(cKey, { d: history, t: Date.now() })
        console.log(`[compare/chart] ${sym} bars:${history.length}`)
        return { symbol: sym, color: COLORS[i % COLORS.length], history }
      })
    )
    return NextResponse.json(results)
  }

  const limited = symbols.slice(0, 3)
  const results = await Promise.all(
    limited.map(async (sym, i) => {
      const cKey = `fund_${sym}`
      const hit = MEM_FUND.get(cKey)
      if (hit && Date.now() - hit.t < TTL)
        return { ...(hit.d as object), symbol: sym, color: COLORS[i % COLORS.length], cached: true }

      const [yq, fh] = await Promise.all([
        fetchYahooPrice(sym),
        fetchFinnhubFund(sym, fhKey),
      ])

      const out = {
        symbol: sym, color: COLORS[i % COLORS.length],
        name: fh?.name ?? sym,
        logo: fh?.logo ?? null,
        sector: fh?.sector ?? null,
        exchange: fh?.exchange ?? null,
        price: yq?.price ?? null,
        change: yq?.change ?? null,
        changePercent: yq?.changePercent ?? null,
        marketCap: fh?.marketCap ?? null,
        pe: fh?.pe ?? null,
        eps: fh?.eps ?? null,
        beta: fh?.beta ?? null,
        pb: fh?.pb ?? null,
        roe: fh?.roe ?? null,
        netMargin: fh?.netMargin ?? null,
        grossMargin: fh?.grossMargin ?? null,
        revenueGrowth: fh?.revenueGrowth ?? null,
        epsGrowth: fh?.epsGrowth ?? null,
        debtToEquity: fh?.debtToEquity ?? null,
        divYield: fh?.divYield ?? null,
        divAmt: fh?.divAmt ?? null,
        high52: fh?.high52 ?? null,
        low52: fh?.low52 ?? null,
      }

      console.log(`[compare/fund] ${sym} pe:${out.pe} roe:${out.roe} mktCap:${out.marketCap}`)
      MEM_FUND.set(cKey, { d: out, t: Date.now() })
      return out
    })
  )
  return NextResponse.json(results)
}
