import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""

const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const FH_BASE = "https://finnhub.io/api/v1"

const YH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
  "Cache-Control": "no-cache",
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

// ── Helpers ─────────────────────────────────────────────────────────────────

// Yahoo uses BRK-B format, markets use BRK.B
function toYahooSymbol(symbol: string): string {
  return symbol.replace(/\./g, "-")
}

function safeNum(v: any): number | null {
  if (v == null) return null
  const n = typeof v === "object" && "raw" in v ? Number(v.raw) : Number(v)
  return isFinite(n) && n !== 0 ? n : null
}

function safeNumZero(v: any): number | null {
  if (v == null) return null
  const n = typeof v === "object" && "raw" in v ? Number(v.raw) : Number(v)
  return isFinite(n) ? n : null
}

function fmtDate(ts: any): string | null {
  const n = safeNumZero(ts)
  if (!n || n <= 0) return null
  return new Date(n * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function parseYahooChart(json: any): Point[] {
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
      if (seen.has(date)) continue          // deduplicate dates
      seen.add(date)
      pts.push({ date, price })
    }
    return pts
  } catch (e) {
    console.error("parseYahooChart error:", e)
    return []
  }
}

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
  } catch (e) {
    console.error("parseYahooIntraday error:", e)
    return []
  }
}

// ── Yahoo (primary) ──────────────────────────────────────────────────────────

async function fetchYahoo(symbol: string): Promise<StockFull> {
  const ys = toYahooSymbol(symbol)

  // NO fields= param — let Yahoo return everything it has
  const [quoteRes, dailyRes, intradayRes] = await Promise.all([
    fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ys}&corsDomain=finance.yahoo.com&formatted=false`,
      { headers: YH_HEADERS, cache: "no-store" }),
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ys}?interval=1d&range=5y&events=div%2Csplits`,
      { headers: YH_HEADERS, cache: "no-store" }),
    fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ys}?interval=5m&range=5d`,
      { headers: YH_HEADERS, cache: "no-store" }),
  ])

  const [quoteJson, dailyJson, intradayJson] = await Promise.all([
    quoteRes.json(), dailyRes.json(), intradayRes.json(),
  ])

  const q = quoteJson?.quoteResponse?.result?.[0]
  if (!q?.regularMarketPrice) {
    throw new Error(`Yahoo v7 no data: ${JSON.stringify(quoteJson).substring(0, 200)}`)
  }

  console.log(`[Yahoo] ${symbol} fields:`, Object.keys(q).join(", "))

  const daily = parseYahooChart(dailyJson)
  const intraday = parseYahooIntraday(intradayJson)

  if (!daily.length) {
    console.warn(`[Yahoo] ${symbol} daily chart empty — chartJson:`, JSON.stringify(dailyJson).substring(0, 200))
  }

  const divRate = safeNum(q.dividendRate)
  const divYield = safeNum(q.dividendYield)
  const divStr = divRate
    ? `$${divRate.toFixed(2)}${divYield ? ` (${(divYield * 100).toFixed(2)}%)` : ""}`
    : null

  const dayLow = safeNum(q.regularMarketDayLow)
  const dayHigh = safeNum(q.regularMarketDayHigh)
  const wk52Low = safeNum(q.fiftyTwoWeekLow)
  const wk52High = safeNum(q.fiftyTwoWeekHigh)

  // PE/EPS — Yahoo uses multiple field names depending on stock type
  const pe = safeNum(q.trailingPE)
    ?? safeNum(q.forwardPE)
    ?? null

  const eps = safeNum(q.epsTrailingTwelveMonths)
    ?? safeNum(q.epsForward)
    ?? null

  const avgVol = safeNum(q.averageDailyVolume3Month)
    ?? safeNum(q.averageDailyVolume10Day)
    ?? null

  const mktCap = safeNum(q.marketCap) ?? null

  return {
    symbol,
    name: q.longName || q.shortName || symbol,
    exchange: q.fullExchangeName || q.exchange || "",
    price: q.regularMarketPrice,
    change: safeNumZero(q.regularMarketChange) ?? 0,
    changePercent: safeNumZero(q.regularMarketChangePercent) ?? 0,
    open: safeNum(q.regularMarketOpen),
    previousClose: safeNum(q.regularMarketPreviousClose),
    bid: q.bid != null && q.bid !== 0
      ? `${Number(q.bid).toFixed(2)} × ${q.bidSize ?? 0}` : null,
    ask: q.ask != null && q.ask !== 0
      ? `${Number(q.ask).toFixed(2)} × ${q.askSize ?? 0}` : null,
    dayRange: dayLow && dayHigh ? `${dayLow.toFixed(2)} – ${dayHigh.toFixed(2)}` : null,
    weekRange52: wk52Low && wk52High ? `${wk52Low.toFixed(2)} – ${wk52High.toFixed(2)}` : null,
    volume: safeNum(q.regularMarketVolume),
    avgVolume: avgVol,
    marketCap: mktCap,
    beta: safeNum(q.beta),
    pe,
    eps,
    earningsDate: fmtDate(q.earningsTimestamp ?? q.earningsTimestampStart),
    dividend: divStr,
    exDivDate: fmtDate(q.exDividendDate),
    targetPrice: safeNum(q.targetMeanPrice),
    intraday,
    daily,
  }
}

// ── FMP fallback ─────────────────────────────────────────────────────────────

async function fetchFMP(symbol: string): Promise<StockFull> {
  const [qRes, pRes, hRes, iRes] = await Promise.all([
    fetch(`${FMP_BASE}/quote/${symbol}?apikey=${FMP_KEY}`, { cache: "no-store" }),
    fetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`, { cache: "no-store" }),
    fetch(`${FMP_BASE}/historical-price-full/${symbol}?timeseries=1825&apikey=${FMP_KEY}`, { cache: "no-store" }),
    fetch(`${FMP_BASE}/historical-chart/5min/${symbol}?apikey=${FMP_KEY}`, { cache: "no-store" }),
  ])
  const [qData, pData, hData, iData] = await Promise.all([
    qRes.json(), pRes.json(), hRes.json(), iRes.json(),
  ])
  const q = Array.isArray(qData) ? qData[0] : null
  const p = Array.isArray(pData) ? pData[0] : null
  if (!q?.price) throw new Error(`FMP no price: ${JSON.stringify(qData).substring(0, 100)}`)

  const seen = new Set<string>()
  const daily: Point[] = ((hData as any)?.historical || [])
    .map((d: any) => ({ date: d.date as string, price: d.close as number }))
    .filter((pt: Point) => pt.price != null && isFinite(pt.price))
    .reverse()
    .filter((pt: Point) => { if (seen.has(pt.date)) return false; seen.add(pt.date); return true })

  const recentDate = Array.isArray(iData) && iData[0]?.date?.split(" ")[0]
  const intraday: Point[] = recentDate
    ? (iData as any[])
      .filter((d: any) => d.date?.startsWith(recentDate))
      .map((d: any) => ({ date: d.date.split(" ")[1], price: d.close }))
      .filter((pt: Point) => pt.price != null && isFinite(pt.price))
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
    open: safeNum(q.open),
    previousClose: safeNum(q.previousClose),
    bid: null,
    ask: null,
    dayRange: q.dayLow && q.dayHigh ? `${q.dayLow.toFixed(2)} – ${q.dayHigh.toFixed(2)}` : null,
    weekRange52: q.yearLow && q.yearHigh ? `${q.yearLow.toFixed(2)} – ${q.yearHigh.toFixed(2)}` : null,
    volume: safeNum(q.volume),
    avgVolume: safeNum(q.avgVolume),
    marketCap: safeNum(q.marketCap),
    beta: null,
    pe: safeNum(q.pe),
    eps: safeNum(q.eps),
    earningsDate: null,
    dividend: p?.lastDiv
      ? `$${p.lastDiv.toFixed(2)}${divYield ? ` (${divYield.toFixed(2)}%)` : ""}`
      : null,
    exDivDate: null,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── Finnhub fallback ──────────────────────────────────────────────────────────

async function fetchFinnhub(symbol: string): Promise<StockFull> {
  const now = Math.floor(Date.now() / 1000)
  const from5y = now - 5 * 365 * 24 * 3600
  const from5d = now - 5 * 24 * 3600

  const [qRes, pRes, hRes, iRes, mRes] = await Promise.all([
    fetch(`${FH_BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, { cache: "no-store" }),
    fetch(`${FH_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`, { cache: "no-store" }),
    fetch(`${FH_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from5y}&to=${now}&token=${FINNHUB_KEY}`, { cache: "no-store" }),
    fetch(`${FH_BASE}/stock/candle?symbol=${symbol}&resolution=5&from=${from5d}&to=${now}&token=${FINNHUB_KEY}`, { cache: "no-store" }),
    fetch(`${FH_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`, { cache: "no-store" }),
  ])
  const [q, p, h, intra, metrics] = await Promise.all([
    qRes.json(), pRes.json(), hRes.json(), iRes.json(), mRes.json(),
  ])
  if (!q?.c) throw new Error(`Finnhub no price: ${JSON.stringify(q).substring(0, 100)}`)

  const m = metrics?.metric || {}

  const seen = new Set<string>()
  const daily: Point[] = h.s === "ok"
    ? (h.t as number[])
      .map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split("T")[0],
        price: h.c[i] as number,
      }))
      .filter((pt: Point) => pt.price != null && isFinite(pt.price))
      .filter((pt: Point) => { if (seen.has(pt.date)) return false; seen.add(pt.date); return true })
    : []

  const byDate: Record<string, Point[]> = {}
  if (intra.s === "ok") {
    (intra.t as number[]).forEach((t: number, i: number) => {
      const price = intra.c[i]
      if (price == null || !isFinite(price)) return
      const day = new Date(t * 1000).toISOString().split("T")[0]
      const time = new Date(t * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
      })
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({ date: time, price })
    })
  }
  const latest = Object.keys(byDate).sort().pop()
  const intraday = latest ? byDate[latest] : []

  const wk52Low = safeNum(m["52WeekLow"])
  const wk52High = safeNum(m["52WeekHigh"])

  return {
    symbol,
    name: p?.name || symbol,
    exchange: p?.exchange || "",
    price: q.c,
    change: safeNumZero(q.d) ?? 0,
    changePercent: safeNumZero(q.dp) ?? 0,
    open: safeNum(q.o),
    previousClose: safeNum(q.pc),
    bid: null,
    ask: null,
    dayRange: q.l && q.h ? `${q.l.toFixed(2)} – ${q.h.toFixed(2)}` : null,
    weekRange52: wk52Low && wk52High ? `${wk52Low.toFixed(2)} – ${wk52High.toFixed(2)}` : null,
    volume: null,
    avgVolume: null,
    marketCap: p?.marketCapitalization ? p.marketCapitalization * 1e6 : null,
    beta: safeNum(m.beta),
    pe: safeNum(m.peBasicExclExtraTTM) ?? safeNum(m.peTTM),
    eps: safeNum(m.epsBasicExclExtraItemsTTM),
    earningsDate: null,
    dividend: null,
    exDivDate: null,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

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
      console.log(`[stock/full] ${symbol} <- ${name} | daily:${data.daily.length} intraday:${data.intraday.length} | pe:${data.pe} beta:${data.beta} mktcap:${data.marketCap}`)
      return NextResponse.json(data)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${name}: ${msg}`)
      console.warn(`[stock/full] ${name} failed for ${symbol}:`, msg)
    }
  }

  return NextResponse.json({ error: "All sources failed", details: errors }, { status: 500 })
}
