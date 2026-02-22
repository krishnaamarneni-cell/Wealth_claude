import { NextRequest, NextResponse } from "next/server"

const MEM = new Map<string, { data: StockFull; ts: number }>()
const CACHE_TTL = 12 * 60 * 60 * 1000

type Point = { date: string; price: number }

export interface StockFull {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  open: number | null
  previousClose: number | null
  bid: string | null
  ask: string | null
  dayRange: string | null
  weekRange52: string | null
  volume: number | null
  avgVolume: number | null
  marketCap: number | null
  beta: number | null
  pe: number | null
  eps: number | null
  earningsDate: string | null
  dividend: string | null
  exDivDate: string | null
  targetPrice: number | null
  sector: string | null
  logo: string | null
  intraday: Point[]
  daily: Point[]
}

// ── Timeout fetch ─────────────────────────────────────────────────────
async function tFetch(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal, cache: "no-store" })
  } finally {
    clearTimeout(timer)
  }
}

function safeNum(v: any): number | null {
  if (v == null) return null
  const n = Number(v)
  return isFinite(n) && n !== 0 ? n : null
}

// ── Parse daily chart bars ────────────────────────────────────────────
function parseYahooDaily(json: any): Point[] {
  try {
    const result = json?.chart?.result?.[0]
    if (!result) return []
    const ts = (result.timestamp || []) as number[]
    const close = (result.indicators?.quote?.[0]?.close || []) as (number | null)[]
    const seen = new Set<string>()
    const pts: Point[] = []
    for (let i = 0; i < ts.length; i++) {
      const price = close[i]
      if (price == null || !isFinite(price)) continue
      const date = new Date(ts[i] * 1000).toISOString().split("T")[0]
      if (seen.has(date)) continue
      seen.add(date)
      pts.push({ date, price })
    }
    return pts
  } catch { return [] }
}

// ── Parse intraday bars ───────────────────────────────────────────────
function parseYahooIntraday(json: any): Point[] {
  try {
    const result = json?.chart?.result?.[0]
    if (!result) return []
    const ts = (result.timestamp || []) as number[]
    const close = (result.indicators?.quote?.[0]?.close || []) as (number | null)[]
    const byDate: Record<string, Point[]> = {}
    for (let i = 0; i < ts.length; i++) {
      const price = close[i]
      if (price == null || !isFinite(price)) continue
      const d = new Date(ts[i] * 1000)
      const day = d.toISOString().split("T")[0]
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
      })
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({ date: time, price })
    }
    const latest = Object.keys(byDate).sort().pop()
    return latest ? byDate[latest] : []
  } catch { return [] }
}

// ── SOURCE 1: Yahoo — price, chart, dividend only ─────────────────────
async function fetchYahoo(symbol: string) {
  try {
    const ys = symbol.replace(/\./g, "-")
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Referer": "https://finance.yahoo.com/",
    }

    const [dailyRes, intradayRes] = await Promise.allSettled([
      tFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ys}?interval=1d&range=5y&events=div,splits`),
      tFetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ys}?interval=5m&range=1d`),
    ])

    const dailyJson = dailyRes.status === "fulfilled" && dailyRes.value.ok
      ? await dailyRes.value.json() : null
    const intradayJson = intradayRes.status === "fulfilled" && intradayRes.value.ok
      ? await intradayRes.value.json() : null

    const meta = dailyJson?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) {
      console.log(`[Yahoo] no price for ${symbol}`)
      return null
    }

    const price = meta.regularMarketPrice
    const prev = meta.previousClose ?? meta.chartPreviousClose ?? 0
    const dayHigh = meta.regularMarketDayHigh ?? null
    const dayLow = meta.regularMarketDayLow ?? null
    const high52 = meta.fiftyTwoWeekHigh ?? null
    const low52 = meta.fiftyTwoWeekLow ?? null

    // Dividend from chart events
    let dividend: string | null = null
    let exDivDate: string | null = null
    const divEvents = dailyJson?.chart?.result?.[0]?.events?.dividends
    if (divEvents) {
      const divArr = Object.values(divEvents) as any[]
      if (divArr.length) {
        const latest = divArr.sort((a: any, b: any) => b.date - a.date)[0]
        const annual = latest.amount * 4
        const yld = price > 0 ? (annual / price) * 100 : 0
        dividend = `$${annual.toFixed(2)} (${yld.toFixed(2)}%)`
        exDivDate = new Date(latest.date * 1000).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        })
      }
    }

    const daily = dailyJson ? parseYahooDaily(dailyJson) : []
    const intraday = intradayJson ? parseYahooIntraday(intradayJson) : []

    console.log(`[Yahoo] ${symbol} ✅ price:${price} daily:${daily.length} intraday:${intraday.length}`)

    return {
      name: meta.longName ?? meta.shortName ?? null,
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? null,
      price,
      change: price - prev,
      changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
      open: meta.regularMarketOpen ?? null,
      previousClose: prev,
      dayRange: dayLow && dayHigh ? `${dayLow.toFixed(2)} – ${dayHigh.toFixed(2)}` : null,
      weekRange52: low52 && high52 ? `${low52.toFixed(2)} – ${high52.toFixed(2)}` : null,
      volume: meta.regularMarketVolume ?? null,
      marketCap: meta.marketCap ?? null,
      dividend,
      exDivDate,
      daily,
      intraday,
    }
  } catch (e: any) { console.error("[Yahoo]", e.message); return null }
}

// ── SOURCE 2: Finnhub — fundamentals primary ──────────────────────────
async function fetchFinnhubFundamentals(symbol: string, key: string) {
  if (!key) { console.log("[Finnhub] key missing"); return null }
  try {
    const [mR, pR, tR, dR] = await Promise.allSettled([
      tFetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${key}`),
      tFetch(`https://finnhub.io/api/v1/stock/dividend2?symbol=${symbol}&token=${key}`),
    ])

    const metrics = mR.status === "fulfilled" && mR.value.ok ? await mR.value.json() : null
    const profile = pR.status === "fulfilled" && pR.value.ok ? await pR.value.json() : null
    const target = tR.status === "fulfilled" && tR.value.ok ? await tR.value.json() : null
    const dividend = dR.status === "fulfilled" && dR.value.ok ? await dR.value.json() : null

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

    const avg10 = m["10DayAverageTradingVolume"] ? Math.round(m["10DayAverageTradingVolume"] * 1e6) : null
    const avg3m = m["3MonthAverageTradingVolume"] ? Math.round(m["3MonthAverageTradingVolume"] * 1e6) : null

    const result = {
      pe: safeNum(m["peBasicExclExtraTTM"]) ?? safeNum(m["peTTM"]),
      eps: safeNum(m["epsBasicExclExtraItemsTTM"]) ?? safeNum(m["epsTTM"]),
      beta: safeNum(m["beta"]),
      high52: safeNum(m["52WeekHigh"]),
      low52: safeNum(m["52WeekLow"]),
      divYield: safeNum(m["currentDividendYieldTTM"]),
      divAmt: divAmt ?? (m["dividendsPerShareAnnual"] ? m["dividendsPerShareAnnual"] / 4 : null),
      exDate,
      avgVolume: avg10 ?? avg3m ?? null,
      targetPrice: safeNum(target?.targetMean),
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      name: profile?.name ?? null,
      sector: profile?.finnhubIndustry ?? null,
      logo: profile?.logo ?? null,
      country: profile?.country ?? "US",
      exchange: profile?.exchange ?? null,
    }

    console.log(`[Finnhub] ${symbol} ✅ pe:${result.pe} eps:${result.eps} marketCap:${result.marketCap} div:${result.divAmt}`)
    return result
  } catch (e: any) { console.error("[Finnhub]", e.message); return null }
}

// ── SOURCE 3: Polygon — fundamentals fallback ─────────────────────────
async function fetchPolygonFundamentals(symbol: string, key: string) {
  if (!key) { console.log("[Polygon] key missing"); return null }
  try {
    const [refR, divR] = await Promise.allSettled([
      tFetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${key}`),
      tFetch(`https://api.polygon.io/v3/reference/dividends?ticker=${symbol}&limit=1&apiKey=${key}`),
    ])

    const ref = refR.status === "fulfilled" && refR.value.ok ? await refR.value.json() : null
    const div = divR.status === "fulfilled" && divR.value.ok ? await divR.value.json() : null

    const info = ref?.results

    let divAmt: number | null = null
    let exDate: string | null = null
    if (div?.results?.length) {
      divAmt = div.results[0]?.cash_amount ?? null
      exDate = div.results[0]?.ex_dividend_date ?? null
    }

    const result = {
      marketCap: info?.market_cap ?? null,
      name: info?.name ?? null,
      sector: info?.sic_description ?? null,
      logo: info?.branding?.icon_url
        ? `${info.branding.icon_url}?apiKey=${key}`
        : null,
      exchange: info?.primary_exchange ?? null,
      divAmt,
      exDate,
    }

    console.log(`[Polygon] ${symbol} ✅ marketCap:${result.marketCap} div:${result.divAmt}`)
    return result
  } catch (e: any) { console.error("[Polygon]", e.message); return null }
}

// ── GET ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 })

  const hit = MEM.get(symbol)
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    console.log(`[stock/full] ⚡ cache hit ${symbol}`)
    return NextResponse.json(hit.data)
  }

  const fhKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ""
  const polyKey = process.env.POLYGON_API_KEY ?? process.env.NEXT_PUBLIC_POLYGON_API_KEY ?? ""

  console.log(`\n===== full ${symbol} fh:${fhKey ? "OK" : "MISSING"} poly:${polyKey ? "OK" : "MISSING"} =====`)

  // All 3 fire in parallel — never wait for one to fail before trying next
  const [yq, fh, poly] = await Promise.all([
    fetchYahoo(symbol),
    fetchFinnhubFundamentals(symbol, fhKey),
    fetchPolygonFundamentals(symbol, polyKey),
  ])

  // Yahoo MUST succeed for price + chart — without it we have nothing
  if (!yq) {
    return NextResponse.json({ error: "Price data unavailable" }, { status: 500 })
  }

  // Build dividend string from Finnhub/Polygon if Yahoo didn't get it
  let dividend = yq.dividend
  let exDivDate = yq.exDivDate
  if (!dividend && (fh?.divAmt || poly?.divAmt)) {
    const amt = fh?.divAmt ?? poly?.divAmt ?? 0
    const annual = amt * 4
    const yld = yq.price > 0 ? (annual / yq.price) * 100 : 0
    dividend = `$${annual.toFixed(2)} (${yld.toFixed(2)}%)`
  }
  if (!exDivDate) {
    exDivDate = fh?.exDate ?? poly?.exDate ?? null
  }

  const data: StockFull = {
    symbol,

    // Identity — Finnhub primary → Polygon → Yahoo fallback
    name: fh?.name ?? poly?.name ?? yq.name ?? symbol,
    sector: fh?.sector ?? poly?.sector ?? null,
    logo: fh?.logo ?? poly?.logo ?? null,
    exchange: yq.exchange ?? fh?.exchange ?? poly?.exchange ?? "",

    // Price — Yahoo only (chart endpoint is server-safe)
    price: yq.price,
    change: yq.change,
    changePercent: yq.changePercent,
    open: yq.open,
    previousClose: yq.previousClose,
    bid: null,
    ask: null,
    dayRange: yq.dayRange,
    weekRange52: yq.weekRange52,
    volume: yq.volume,

    // Market data — Finnhub primary → Polygon → Yahoo fallback
    avgVolume: fh?.avgVolume ?? null,
    marketCap: fh?.marketCap ?? poly?.marketCap ?? yq.marketCap ?? null,

    // Fundamentals — Finnhub primary → Polygon fallback
    pe: fh?.pe ?? null,
    eps: fh?.eps ?? null,
    beta: fh?.beta ?? null,
    targetPrice: fh?.targetPrice ?? null,
    earningsDate: null,

    // Dividend — Yahoo primary (from chart events) → Finnhub → Polygon
    dividend,
    exDivDate,

    // Chart — Yahoo always
    daily: yq.daily,
    intraday: yq.intraday,
  }

  console.log(`[full] ${symbol} price:${data.price} pe:${data.pe} eps:${data.eps} marketCap:${data.marketCap} div:${data.dividend}`)
  MEM.set(symbol, { data, ts: Date.now() })
  return NextResponse.json(data)
}
