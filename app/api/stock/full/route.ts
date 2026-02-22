import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""

const YAHOO = "https://query1.finance.yahoo.com"
const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const FH_BASE = "https://finnhub.io/api/v1"
const CACHE_TTL = 12 * 60 * 60

const YH = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
}

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
  intraday: Point[]
  daily: Point[]
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseYahooChart(json: any): Point[] {
  const result = json?.chart?.result?.[0]
  if (!result) return []
  const ts = result.timestamp || []
  const close = result.indicators?.quote?.[0]?.close || []
  return ts
    .map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().split("T")[0],
      price: close[i],
    }))
    .filter((p: Point) => p.price != null && isFinite(p.price))
}

function groupIntradayByDay(json: any): Point[] {
  const result = json?.chart?.result?.[0]
  if (!result) return []
  const ts = result.timestamp || []
  const close = result.indicators?.quote?.[0]?.close || []
  const byDate: Record<string, Point[]> = {}
  ts.forEach((t: number, i: number) => {
    const close_i = close[i]
    if (close_i == null || !isFinite(close_i)) return
    const day = new Date(t * 1000).toISOString().split("T")[0]
    const time = new Date(t * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
    })
    if (!byDate[day]) byDate[day] = []
    byDate[day].push({ date: time, price: close_i })
  })
  const latest = Object.keys(byDate).sort().pop()
  return latest ? byDate[latest] : []
}

function fmtTs(ts: number | null | undefined): string | null {
  if (!ts) return null
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── Yahoo ─────────────────────────────────────────────────────────────

async function fetchYahoo(symbol: string): Promise<StockFull> {
  const fields = [
    "regularMarketPrice", "regularMarketChange", "regularMarketChangePercent",
    "regularMarketOpen", "regularMarketPreviousClose", "regularMarketDayHigh",
    "regularMarketDayLow", "regularMarketVolume", "averageDailyVolume10Day",
    "marketCap", "trailingPE", "epsTrailingTwelveMonths", "beta",
    "dividendRate", "dividendYield", "exDividendDate", "earningsTimestamp",
    "targetMeanPrice", "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
    "bid", "bidSize", "ask", "askSize", "longName", "shortName", "fullExchangeName",
  ].join(",")

  const [quoteRes, dailyRes, intradayRes] = await Promise.all([
    fetch(`${YAHOO}/v7/finance/quote?symbols=${symbol}&fields=${fields}`,
      { headers: YH, next: { revalidate: CACHE_TTL } }),
    fetch(`${YAHOO}/v8/finance/chart/${symbol}?interval=1d&range=5y`,
      { headers: YH, next: { revalidate: CACHE_TTL } }),
    fetch(`${YAHOO}/v8/finance/chart/${symbol}?interval=5m&range=5d`,
      { headers: YH, next: { revalidate: CACHE_TTL } }),
  ])

  const [qJson, dJson, iJson] = await Promise.all([
    quoteRes.json(), dailyRes.json(), intradayRes.json(),
  ])

  const q = qJson?.quoteResponse?.result?.[0]
  if (!q?.regularMarketPrice) throw new Error(`Yahoo: no price — ${JSON.stringify(qJson).substring(0, 120)}`)

  const daily = parseYahooChart(dJson)
  const intraday = groupIntradayByDay(iJson)

  const divStr = q.dividendRate
    ? `$${q.dividendRate.toFixed(2)}${q.dividendYield ? ` (${(q.dividendYield * 100).toFixed(2)}%)` : ""}`
    : null

  return {
    symbol: q.symbol,
    name: q.longName || q.shortName || symbol,
    exchange: q.fullExchangeName || "",
    price: q.regularMarketPrice,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    open: q.regularMarketOpen ?? null,
    previousClose: q.regularMarketPreviousClose ?? null,
    bid: q.bid != null ? `${q.bid.toFixed(2)} × ${q.bidSize ?? 0}` : null,
    ask: q.ask != null ? `${q.ask.toFixed(2)} × ${q.askSize ?? 0}` : null,
    dayRange: q.regularMarketDayLow != null && q.regularMarketDayHigh != null
      ? `${q.regularMarketDayLow.toFixed(2)} – ${q.regularMarketDayHigh.toFixed(2)}` : null,
    weekRange52: q.fiftyTwoWeekLow != null && q.fiftyTwoWeekHigh != null
      ? `${q.fiftyTwoWeekLow.toFixed(2)} – ${q.fiftyTwoWeekHigh.toFixed(2)}` : null,
    volume: q.regularMarketVolume ?? null,
    avgVolume: q.averageDailyVolume10Day ?? null,
    marketCap: q.marketCap ?? null,
    beta: q.beta ?? null,
    pe: q.trailingPE ?? null,
    eps: q.epsTrailingTwelveMonths ?? null,
    earningsDate: fmtTs(q.earningsTimestamp),
    dividend: divStr,
    exDivDate: fmtTs(q.exDividendDate),
    targetPrice: q.targetMeanPrice ?? null,
    intraday,
    daily,
  }
}

// ── FMP fallback ──────────────────────────────────────────────────────

async function fetchFMP(symbol: string): Promise<StockFull> {
  const [qRes, pRes, hRes, iRes] = await Promise.all([
    fetch(`${FMP_BASE}/quote/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FMP_BASE}/historical-price-full/${symbol}?timeseries=1825&apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FMP_BASE}/historical-chart/5min/${symbol}?apikey=${FMP_KEY}`, { next: { revalidate: CACHE_TTL } }),
  ])
  const [qData, pData, hData, iData] = await Promise.all([
    qRes.json(), pRes.json(), hRes.json(), iRes.json(),
  ])
  const q = Array.isArray(qData) ? qData[0] : null
  const p = Array.isArray(pData) ? pData[0] : null
  if (!q?.price) throw new Error(`FMP: no price — ${JSON.stringify(qData).substring(0, 120)}`)

  const daily: Point[] = ((hData as any).historical || [])
    .map((d: any) => ({ date: d.date as string, price: d.close as number }))
    .filter((pt: Point) => isFinite(pt.price))
    .reverse()

  const mostRecentDate = Array.isArray(iData) && iData[0]?.date?.split(" ")[0]
  const intraday: Point[] = mostRecentDate
    ? (iData as any[])
      .filter((d: any) => d.date?.startsWith(mostRecentDate))
      .map((d: any) => ({ date: d.date.split(" ")[1], price: d.close }))
      .reverse()
    : []

  const divYield = p?.lastDiv ? ((p.lastDiv * 4) / q.price) * 100 : null

  return {
    symbol: q.symbol,
    name: p?.companyName || q.name || symbol,
    exchange: p?.exchangeShortName || q.exchange || "",
    price: q.price,
    change: q.change ?? 0,
    changePercent: q.changesPercentage ?? 0,
    open: q.open ?? null,
    previousClose: q.previousClose ?? null,
    bid: null,
    ask: null,
    dayRange: q.dayLow != null && q.dayHigh != null ? `${q.dayLow.toFixed(2)} – ${q.dayHigh.toFixed(2)}` : null,
    weekRange52: q.yearLow != null && q.yearHigh != null ? `${q.yearLow.toFixed(2)} – ${q.yearHigh.toFixed(2)}` : null,
    volume: q.volume ?? null,
    avgVolume: q.avgVolume ?? null,
    marketCap: q.marketCap ?? null,
    beta: null,
    pe: q.pe ?? null,
    eps: q.eps ?? null,
    earningsDate: null,
    dividend: p?.lastDiv ? `$${p.lastDiv.toFixed(2)}${divYield ? ` (${divYield.toFixed(2)}%)` : ""}` : null,
    exDivDate: null,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── Finnhub fallback ──────────────────────────────────────────────────

async function fetchFinnhub(symbol: string): Promise<StockFull> {
  const now = Math.floor(Date.now() / 1000)
  const from5y = now - 5 * 365 * 24 * 3600
  const from5d = now - 5 * 24 * 3600

  const [qRes, pRes, hRes, iRes] = await Promise.all([
    fetch(`${FH_BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FH_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FH_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from5y}&to=${now}&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } }),
    fetch(`${FH_BASE}/stock/candle?symbol=${symbol}&resolution=5&from=${from5d}&to=${now}&token=${FINNHUB_KEY}`, { next: { revalidate: CACHE_TTL } }),
  ])
  const [q, p, h, intra] = await Promise.all([qRes.json(), pRes.json(), hRes.json(), iRes.json()])
  if (!q?.c) throw new Error(`Finnhub: no price — ${JSON.stringify(q).substring(0, 120)}`)

  const daily: Point[] = h.s === "ok"
    ? (h.t as number[]).map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().split("T")[0],
      price: h.c[i],
    })).filter((pt: Point) => isFinite(pt.price))
    : []

  const byDate: Record<string, Point[]> = {}
  if (intra.s === "ok") {
    (intra.t as number[]).forEach((t: number, i: number) => {
      const day = new Date(t * 1000).toISOString().split("T")[0]
      const time = new Date(t * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
      })
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({ date: time, price: intra.c[i] })
    })
  }
  const latest = Object.keys(byDate).sort().pop()
  const intraday = latest ? byDate[latest] : []

  return {
    symbol,
    name: p?.name || symbol,
    exchange: p?.exchange || "",
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    open: q.o ?? null,
    previousClose: q.pc ?? null,
    bid: null,
    ask: null,
    dayRange: q.l != null && q.h != null ? `${q.l.toFixed(2)} – ${q.h.toFixed(2)}` : null,
    weekRange52: null,
    volume: null,
    avgVolume: null,
    marketCap: p?.marketCapitalization ? p.marketCapitalization * 1e6 : null,
    beta: null,
    pe: null,
    eps: null,
    earningsDate: null,
    dividend: null,
    exDivDate: null,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 })

  const errors: string[] = []
  const sources = [
    { name: "Yahoo", fn: () => fetchYahoo(symbol) },
    { name: "FMP", fn: () => fetchFMP(symbol) },
    { name: "Finnhub", fn: () => fetchFinnhub(symbol) },
  ]

  for (const { name, fn } of sources) {
    try {
      const data = await fn()
      console.log(`[stock/full] ${symbol} <- ${name} | ${data.daily.length} daily pts | ${data.intraday.length} intraday pts`)
      return NextResponse.json(data)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${name}: ${msg}`)
      console.warn(`[stock/full] ${name} failed for ${symbol}:`, msg)
    }
  }

  return NextResponse.json({ error: "All sources failed", details: errors }, { status: 500 })
}
