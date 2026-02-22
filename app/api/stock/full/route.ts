import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""

const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const FH_BASE = "https://finnhub.io/api/v1"

// Browser-like headers — required for Yahoo to not block server requests
const YH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
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

// ── Helpers ────────────────────────────────────────────────────────────────

function safeNum(v: any): number | null {
  const n = Number(v)
  return v != null && isFinite(n) ? n : null
}

function fmtDate(ts: number | null | undefined): string | null {
  if (!ts) return null
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function parseYahooChart(json: any): Point[] {
  try {
    const result = json?.chart?.result?.[0]
    if (!result) return []
    const ts = (result.timestamp || []) as number[]
    const close = (result.indicators?.quote?.[0]?.close || []) as (number | null)[]
    return ts
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString().split("T")[0],
        price: close[i] ?? null,
      }))
      .filter((p): p is Point => p.price != null && isFinite(p.price))
  } catch { return [] }
}

function parseYahooIntraday(json: any): Point[] {
  try {
    const result = json?.chart?.result?.[0]
    if (!result) return []
    const ts = (result.timestamp || []) as number[]
    const close = (result.indicators?.quote?.[0]?.close || []) as (number | null)[]
    const byDate: Record<string, Point[]> = {}
    ts.forEach((t, i) => {
      const price = close[i]
      if (price == null || !isFinite(price)) return
      const day = new Date(t * 1000).toISOString().split("T")[0]
      const time = new Date(t * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
      })
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({ date: time, price })
    })
    const latest = Object.keys(byDate).sort().pop()
    return latest ? byDate[latest] : []
  } catch { return [] }
}

// ── Yahoo (primary — no API key) ───────────────────────────────────────────

async function fetchYahoo(symbol: string): Promise<StockFull> {
  // Use v8/chart for BOTH quote meta + historical — more reliable than v7/quote
  const [dailyRes, intradayRes, summaryRes] = await Promise.all([
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5y`,
      { headers: YH_HEADERS, cache: "no-store" }),
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=5d`,
      { headers: YH_HEADERS, cache: "no-store" }),
    fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail%2CdefaultKeyStatistics%2CfinancialData%2CquoteType%2Cprice`,
      { headers: YH_HEADERS, cache: "no-store" }),
  ])

  const [dailyJson, intradayJson, summaryJson] = await Promise.all([
    dailyRes.json(),
    intradayRes.json(),
    summaryRes.json(),
  ])

  // Pull quote from chart meta (always present if chart works)
  const chartMeta = dailyJson?.chart?.result?.[0]?.meta
  if (!chartMeta?.regularMarketPrice) {
    throw new Error(`Yahoo chart blocked or empty: ${JSON.stringify(dailyJson).substring(0, 150)}`)
  }

  // Summary modules (PE, beta, EPS, dividend, etc.)
  const result = summaryJson?.quoteSummary?.result?.[0] || {}
  const sd = result.summaryDetail || {}
  const ks = result.defaultKeyStatistics || {}
  const fd = result.financialData || {}
  const qt = result.quoteType || {}
  const pr = result.price || {}

  const daily = parseYahooChart(dailyJson)
  const intraday = parseYahooIntraday(intradayJson)

  const price = safeNum(chartMeta.regularMarketPrice)!
  const prevClose = safeNum(chartMeta.chartPreviousClose || chartMeta.previousClose)
  const divRate = safeNum(sd.dividendRate?.raw ?? sd.dividendRate)
  const divYield = safeNum(sd.dividendYield?.raw ?? sd.dividendYield)
  const divStr = divRate
    ? `$${divRate.toFixed(2)}${divYield ? ` (${(divYield * 100).toFixed(2)}%)` : ""}`
    : null

  const dayLow = safeNum(chartMeta.regularMarketDayLow)
  const dayHigh = safeNum(chartMeta.regularMarketDayHigh)
  const wk52Low = safeNum(sd.fiftyTwoWeekLow?.raw ?? chartMeta.fiftyTwoWeekLow)
  const wk52High = safeNum(sd.fiftyTwoWeekHigh?.raw ?? chartMeta.fiftyTwoWeekHigh)

  return {
    symbol,
    name: qt.longName || qt.shortName || chartMeta.instrumentType || symbol,
    exchange: chartMeta.fullExchangeName || chartMeta.exchangeName || "",
    price,
    change: safeNum(pr.regularMarketChange?.raw ?? chartMeta.regularMarketChange) ?? 0,
    changePercent: safeNum(pr.regularMarketChangePercent?.raw ?? chartMeta.regularMarketChangePercent) ?? 0,
    open: safeNum(chartMeta.regularMarketOpen),
    previousClose: prevClose,
    bid: null,
    ask: null,
    dayRange: dayLow != null && dayHigh != null ? `${dayLow.toFixed(2)} – ${dayHigh.toFixed(2)}` : null,
    weekRange52: wk52Low != null && wk52High != null ? `${wk52Low.toFixed(2)} – ${wk52High.toFixed(2)}` : null,
    volume: safeNum(chartMeta.regularMarketVolume),
    avgVolume: safeNum(sd.averageVolume?.raw ?? sd.averageDailyVolume10Day?.raw),
    marketCap: safeNum(pr.marketCap?.raw ?? chartMeta.marketCap),
    beta: safeNum(ks.beta?.raw ?? sd.beta?.raw),
    pe: safeNum(sd.trailingPE?.raw ?? ks.trailingPE?.raw),
    eps: safeNum(ks.trailingEps?.raw),
    earningsDate: fmtDate(ks.nextFiscalYearEnd?.raw ?? null),
    dividend: divStr,
    exDivDate: fmtDate(sd.exDividendDate?.raw ?? null),
    targetPrice: safeNum(fd.targetMeanPrice?.raw),
    intraday,
    daily,
  }
}

// ── FMP fallback ───────────────────────────────────────────────────────────

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
  if (!q?.price) throw new Error(`FMP no price: ${JSON.stringify(qData).substring(0, 120)}`)

  const daily: Point[] = ((hData as any)?.historical || [])
    .map((d: any) => ({ date: d.date as string, price: d.close as number }))
    .filter((pt: Point) => pt.price != null && isFinite(pt.price))
    .reverse()

  const mostRecentDate = Array.isArray(iData) && iData[0]?.date?.split(" ")[0]
  const intraday: Point[] = mostRecentDate
    ? (iData as any[])
      .filter((d: any) => d.date?.startsWith(mostRecentDate))
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
    dayRange: q.dayLow != null && q.dayHigh != null ? `${q.dayLow.toFixed(2)} – ${q.dayHigh.toFixed(2)}` : null,
    weekRange52: q.yearLow != null && q.yearHigh != null ? `${q.yearLow.toFixed(2)} – ${q.yearHigh.toFixed(2)}` : null,
    volume: safeNum(q.volume),
    avgVolume: safeNum(q.avgVolume),
    marketCap: safeNum(q.marketCap),
    beta: null,
    pe: safeNum(q.pe),
    eps: safeNum(q.eps),
    earningsDate: null,
    dividend: p?.lastDiv ? `$${p.lastDiv.toFixed(2)}${divYield ? ` (${divYield.toFixed(2)}%)` : ""}` : null,
    exDivDate: null,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── Finnhub fallback ───────────────────────────────────────────────────────

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
  if (!q?.c) throw new Error(`Finnhub no price: ${JSON.stringify(q).substring(0, 120)}`)

  const m = metrics?.metric || {}

  const daily: Point[] = h.s === "ok"
    ? (h.t as number[])
      .map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split("T")[0],
        price: h.c[i] as number,
      }))
      .filter((pt: Point) => pt.price != null && isFinite(pt.price))
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
    change: safeNum(q.d) ?? 0,
    changePercent: safeNum(q.dp) ?? 0,
    open: safeNum(q.o),
    previousClose: safeNum(q.pc),
    bid: null,
    ask: null,
    dayRange: q.l != null && q.h != null ? `${q.l.toFixed(2)} – ${q.h.toFixed(2)}` : null,
    weekRange52: wk52Low != null && wk52High != null ? `${wk52Low.toFixed(2)} – ${wk52High.toFixed(2)}` : null,
    volume: null,
    avgVolume: null,
    marketCap: p?.marketCapitalization ? p.marketCapitalization * 1e6 : null,
    beta: safeNum(m.beta),
    pe: safeNum(m.peBasicExclExtraTTM ?? m.peTTM),
    eps: safeNum(m.epsBasicExclExtraItemsTTM),
    earningsDate: null,
    dividend: null,
    exDivDate: null,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── Handler ────────────────────────────────────────────────────────────────

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
      console.log(`[stock/full] ${symbol} <- ${name} | daily:${data.daily.length} intraday:${data.intraday.length}`)
      return NextResponse.json(data)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${name}: ${msg}`)
      console.warn(`[stock/full] ${name} failed for ${symbol}:`, msg)
    }
  }

  return NextResponse.json({ error: "All sources failed", details: errors }, { status: 500 })
}
