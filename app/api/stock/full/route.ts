import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || process.env.FMP_API_KEY || ""
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY || ""
const FMP_BASE = "https://financialmodelingprep.com/api/v3"
const FH_BASE = "https://finnhub.io/api/v1"

// ── In-memory cache (survives within same serverless instance) ────────
const MEM = new Map<string, { data: StockFull; ts: number }>()
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours

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

// ── Timeout fetch ─────────────────────────────────────────────────────
async function tFetch(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" })
  } finally {
    clearTimeout(timer)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────
function toYahooSymbol(symbol: string): string { return symbol.replace(/\./g, "-") }

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
  return new Date(n * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
      if (seen.has(date)) continue
      seen.add(date)
      pts.push({ date, price })
    }
    return pts
  } catch { return [] }
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
  } catch { return [] }
}

// ── Yahoo (primary) — uses v8 ONLY, extracts quote from chart meta ────
async function fetchYahoo(symbol: string): Promise<StockFull> {
  const ys = toYahooSymbol(symbol)
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com/",
  }

  // Fetch daily + intraday in parallel — NO v7 quote call
  const [dailyRes, intradayRes] = await Promise.all([
    tFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ys}?interval=1d&range=5y&events=div,splits`, { headers }),
    tFetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ys}?interval=5m&range=1d`, { headers }),
  ])

  if (!dailyRes.ok) throw new Error(`Yahoo daily ${dailyRes.status}`)

  const [dailyJson, intradayJson] = await Promise.all([
    dailyRes.json(),
    intradayRes.ok ? intradayRes.json() : Promise.resolve(null),
  ])

  // Extract quote data from chart meta (same data, no extra call needed)
  const meta = dailyJson?.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) {
    throw new Error(`Yahoo no price: ${JSON.stringify(dailyJson).substring(0, 150)}`)
  }

  const daily = parseYahooChart(dailyJson)
  const intraday = intradayJson ? parseYahooIntraday(intradayJson) : []

  console.log(`[Yahoo] ${symbol} ✅ price:${meta.regularMarketPrice} daily:${daily.length} intraday:${intraday.length}`)

  const price = meta.regularMarketPrice
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? 0
  const high52 = meta.fiftyTwoWeekHigh ?? null
  const low52 = meta.fiftyTwoWeekLow ?? null
  const dayHigh = meta.regularMarketDayHigh ?? null
  const dayLow = meta.regularMarketDayLow ?? null

  // Dividend from chart events
  const divEvents = dailyJson?.chart?.result?.[0]?.events?.dividends
  let dividend: string | null = null
  let exDivDate: string | null = null
  if (divEvents) {
    const divArr = Object.values(divEvents) as any[]
    if (divArr.length) {
      const latest = divArr.sort((a, b) => b.date - a.date)[0]
      const annual = latest.amount * 4
      const yld = price > 0 ? (annual / price) * 100 : 0
      dividend = `$${annual.toFixed(2)} (${yld.toFixed(2)}%)`
      exDivDate = new Date(latest.date * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
  }

  return {
    symbol,
    name: meta.longName ?? meta.shortName ?? symbol,
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
    price,
    change: price - prevClose,
    changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
    open: meta.regularMarketOpen ?? null,
    previousClose: prevClose,
    bid: null,
    ask: null,
    dayRange: dayLow && dayHigh ? `${dayLow.toFixed(2)} – ${dayHigh.toFixed(2)}` : null,
    weekRange52: low52 && high52 ? `${low52.toFixed(2)} – ${high52.toFixed(2)}` : null,
    volume: meta.regularMarketVolume ?? null,
    avgVolume: null,
    marketCap: meta.marketCap ?? null,
    beta: null,
    pe: null,
    eps: null,
    earningsDate: null,
    dividend,
    exDivDate,
    targetPrice: null,
    intraday,
    daily,
  }
}

// ── FMP fallback ──────────────────────────────────────────────────────
async function fetchFMP(symbol: string): Promise<StockFull> {
  const [qRes, pRes, hRes, iRes] = await Promise.all([
    tFetch(`${FMP_BASE}/quote/${symbol}?apikey=${FMP_KEY}`),
    tFetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`),
    tFetch(`${FMP_BASE}/historical-price-full/${symbol}?timeseries=1825&apikey=${FMP_KEY}`),
    tFetch(`${FMP_BASE}/historical-chart/5min/${symbol}?apikey=${FMP_KEY}`),
  ])
  const [qData, pData, hData, iData] = await Promise.all([
    qRes.json(), pRes.json(), hRes.json(), iRes.json(),
  ])
  const q = Array.isArray(qData) ? qData[0] : null
  const p = Array.isArray(pData) ? pData[0] : null
  if (!q?.price) throw new Error(`FMP no price`)

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
  console.log(`[FMP] ${symbol} ✅ price:${q.price} daily:${daily.length}`)

  return {
    symbol: q.symbol, name: p?.companyName || symbol,
    exchange: p?.exchangeShortName || "", price: q.price,
    change: q.change ?? 0, changePercent: q.changesPercentage ?? 0,
    open: safeNum(q.open), previousClose: safeNum(q.previousClose),
    bid: null, ask: null,
    dayRange: q.dayLow && q.dayHigh ? `${q.dayLow.toFixed(2)} – ${q.dayHigh.toFixed(2)}` : null,
    weekRange52: q.yearLow && q.yearHigh ? `${q.yearLow.toFixed(2)} – ${q.yearHigh.toFixed(2)}` : null,
    volume: safeNum(q.volume), avgVolume: safeNum(q.avgVolume),
    marketCap: safeNum(q.marketCap), beta: null,
    pe: safeNum(q.pe), eps: safeNum(q.eps),
    earningsDate: null,
    dividend: p?.lastDiv ? `$${p.lastDiv.toFixed(2)}${divYield ? ` (${divYield.toFixed(2)}%)` : ""}` : null,
    exDivDate: null, targetPrice: null, intraday, daily,
  }
}

// ── Finnhub fallback ──────────────────────────────────────────────────
async function fetchFinnhub(symbol: string): Promise<StockFull> {
  const now = Math.floor(Date.now() / 1000)
  const from5y = now - 5 * 365 * 86400
  const from1d = now - 86400

  const [qRes, pRes, hRes, iRes, mRes] = await Promise.all([
    tFetch(`${FH_BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
    tFetch(`${FH_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
    tFetch(`${FH_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from5y}&to=${now}&token=${FINNHUB_KEY}`),
    tFetch(`${FH_BASE}/stock/candle?symbol=${symbol}&resolution=5&from=${from1d}&to=${now}&token=${FINNHUB_KEY}`),
    tFetch(`${FH_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`),
  ])
  const [q, p, h, intra, metrics] = await Promise.all([
    qRes.json(), pRes.json(), hRes.json(), iRes.json(), mRes.json(),
  ])
  if (!q?.c) throw new Error(`Finnhub no price`)

  const m = metrics?.metric || {}
  const seen = new Set<string>()
  const daily: Point[] = h.s === "ok"
    ? (h.t as number[]).map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().split("T")[0], price: h.c[i],
    }))
      .filter((pt: Point) => pt.price != null && isFinite(pt.price))
      .filter((pt: Point) => { if (seen.has(pt.date)) return false; seen.add(pt.date); return true })
    : []

  const byDate: Record<string, Point[]> = {}
  if (intra.s === "ok") {
    (intra.t as number[]).forEach((t: number, i: number) => {
      const price = intra.c[i]
      if (!price || !isFinite(price)) return
      const day = new Date(t * 1000).toISOString().split("T")[0]
      const time = new Date(t * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
      })
      if (!byDate[day]) byDate[day] = []
      byDate[day].push({ date: time, price })
    })
  }
  const intraday = byDate[Object.keys(byDate).sort().pop() ?? ""] ?? []
  const wk52Low = safeNum(m["52WeekLow"])
  const wk52High = safeNum(m["52WeekHigh"])
  console.log(`[Finnhub] ${symbol} ✅ price:${q.c} daily:${daily.length}`)

  return {
    symbol, name: p?.name || symbol, exchange: p?.exchange || "",
    price: q.c, change: safeNumZero(q.d) ?? 0, changePercent: safeNumZero(q.dp) ?? 0,
    open: safeNum(q.o), previousClose: safeNum(q.pc),
    bid: null, ask: null,
    dayRange: q.l && q.h ? `${q.l.toFixed(2)} – ${q.h.toFixed(2)}` : null,
    weekRange52: wk52Low && wk52High ? `${wk52Low.toFixed(2)} – ${wk52High.toFixed(2)}` : null,
    volume: null, avgVolume: null,
    marketCap: p?.marketCapitalization ? p.marketCapitalization * 1e6 : null,
    beta: safeNum(m.beta), pe: safeNum(m.peBasicExclExtraTTM) ?? safeNum(m.peTTM),
    eps: safeNum(m.epsBasicExclExtraItemsTTM),
    earningsDate: null, dividend: null, exDivDate: null, targetPrice: null,
    intraday, daily,
  }
}

// ── Handler ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 })

  // Check memory cache first
  const hit = MEM.get(symbol)
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    console.log(`[stock/full] ⚡ cache hit ${symbol}`)
    return NextResponse.json(hit.data)
  }

  const errors: string[] = []
  const sources = [
    { name: "Yahoo", fn: () => fetchYahoo(symbol) },
    { name: "FMP", fn: () => fetchFMP(symbol), skip: !FMP_KEY },
    { name: "Finnhub", fn: () => fetchFinnhub(symbol), skip: !FINNHUB_KEY },
  ]

  for (const src of sources) {
    if ((src as any).skip) { console.log(`[stock/full] skipping ${src.name} — no key`); continue }
    try {
      const data = await src.fn()
      console.log(`[stock/full] ${symbol} ← ${src.name} | daily:${data.daily.length} intraday:${data.intraday.length}`)
      MEM.set(symbol, { data, ts: Date.now() })
      return NextResponse.json(data)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${src.name}: ${msg}`)
      console.warn(`[stock/full] ${src.name} failed for ${symbol}:`, msg)
    }
  }

  return NextResponse.json({ error: "All sources failed", details: errors }, { status: 500 })
}
