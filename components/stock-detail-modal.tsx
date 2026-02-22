"use client"

import { useState, useEffect, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, X, RefreshCw, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import type { StockFull } from "@/app/api/stock/full/route"

type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"
const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]
const PERIOD_LABEL: Record<Period, string> = {
  "1D": "today", "1W": "past week", "1M": "past month",
  "3M": "past 3 months", "6M": "past 6 months",
  "1Y": "past year", "5Y": "past 5 years",
}

const CACHE_TTL = 12 * 60 * 60 * 1000
const NEWS_PER_PAGE = 3

interface NewsArticle {
  symbol: string
  publishedDate: string
  title: string
  image: string
  site: string
  text: string
  url: string
  source: "polygon" | "finnhub"
}

function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null }
    return data as T
  } catch { return null }
}
function setCached<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch { }
}

// ── Formatters ────────────────────────────────────────────────────────
function fmtPrice(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v)
}
function fmtCap(v: number | null | undefined) {
  if (v == null || !isFinite(v) || v === 0) return "—"
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}
function fmtNum(v: number | null | undefined, dec = 2) {
  if (v == null || !isFinite(v)) return "—"
  return v.toFixed(dec)
}
function fmtTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

// ── Slice by period ───────────────────────────────────────────────────
function sliceByPeriod(daily: { date: string; price: number }[], period: Period) {
  if (!daily.length) return daily
  const cut = new Date()
  switch (period) {
    case "1W": cut.setDate(cut.getDate() - 7); break
    case "1M": cut.setMonth(cut.getMonth() - 1); break
    case "3M": cut.setMonth(cut.getMonth() - 3); break
    case "6M": cut.setMonth(cut.getMonth() - 6); break
    case "1Y": cut.setFullYear(cut.getFullYear() - 1); break
    case "5Y": cut.setFullYear(cut.getFullYear() - 5); break
    default: return daily
  }
  const cutStr = cut.toISOString().split("T")[0]
  return daily.filter(p => p.date >= cutStr)
}

// ── X-axis: deduplicate ticks ─────────────────────────────────────────
function getUniqueTicks(data: { date: string }[], period: Period): string[] {
  const seen = new Set<string>()
  const ticks: string[] = []
  for (const p of data) {
    const key =
      period === "5Y" ? p.date.substring(0, 4)
        : ["1Y", "6M", "3M"].includes(period) ? p.date.substring(0, 7)
          : p.date
    if (!seen.has(key)) { seen.add(key); ticks.push(p.date) }
  }
  return ticks
}

function fmtTick(v: string, period: Period): string {
  if (period === "1D") return v.includes("T") ? v.substring(11, 16) : v.substring(0, 5)
  if (period === "5Y") return v.substring(0, 4)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const parts = v.split("-")
  if (["1Y", "6M", "3M"].includes(period)) return months[parseInt(parts[1]) - 1] ?? v
  return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`
}

// ── Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="font-bold text-foreground">{fmtPrice(payload[0].value)}</p>
    </div>
  )
}

interface Props {
  symbol: string | null
  open: boolean
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────
export default function StockDetailModal({ symbol, open, onClose }: Props) {
  const [stockData, setStockData] = useState<StockFull | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<Period>("1Y")

  // News state
  const [news, setNews] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsPage, setNewsPage] = useState(0)

  // Reset on new symbol
  useEffect(() => {
    if (open) {
      setStockData(null)
      setPeriod("1Y")
      setNews([])
      setNewsPage(0)
    }
  }, [symbol, open])

  // Fetch stock data
  useEffect(() => {
    if (!symbol || !open) return
    const key = `stockFull_${symbol}`
    const cached = getCached<StockFull>(key)
    if (cached) { setStockData(cached); return }
    setLoading(true)
    fetch(`/api/stock/full?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => {
        if (typeof d?.price === "number") setCached(key, d)
        setStockData(d)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, open])

  // Fetch news — fires independently from stock data
  useEffect(() => {
    if (!symbol || !open) return
    setNewsLoading(true)
    fetch(`/api/news/portfolio?symbols=${symbol}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setNews(d) })
      .catch(console.error)
      .finally(() => setNewsLoading(false))
  }, [symbol, open])

  // Chart data
  const chartData = useMemo(() => {
    if (!stockData) return []
    if (period === "1D") return stockData.intraday
    return sliceByPeriod(stockData.daily, period)
  }, [stockData, period])

  const xTicks = useMemo(() => getUniqueTicks(chartData, period), [chartData, period])

  const periodReturn = useMemo(() => {
    if (!stockData || chartData.length < 2) return null
    const first = chartData[0].price
    const dollar = stockData.price - first
    const pct = (dollar / first) * 100
    return { dollar, pct }
  }, [stockData, chartData])

  // News pagination
  const totalPages = Math.ceil(news.length / NEWS_PER_PAGE)
  const visibleNews = news.slice(newsPage * NEWS_PER_PAGE, (newsPage + 1) * NEWS_PER_PAGE)

  if (!open || !symbol) return null

  const isValid = stockData != null && typeof stockData.price === "number"
  const isUp = (periodReturn?.pct ?? stockData?.changePercent ?? 0) >= 0
  const lastPrice = chartData[chartData.length - 1]?.price ?? 0
  const firstPrice = chartData[0]?.price ?? 0
  const lineColor = lastPrice >= firstPrice ? "#22c55e" : "#ef4444"

  const stats = [
    { label: "Prev Close", value: fmtPrice(stockData?.previousClose) },
    { label: "Day's Range", value: stockData?.dayRange || "—" },
    { label: "52-Wk Range", value: stockData?.weekRange52 || "—" },
    { label: "Market Cap", value: fmtCap(stockData?.marketCap) },
    { label: "P/E (TTM)", value: fmtNum(stockData?.pe) },
    { label: "EPS (TTM)", value: stockData?.eps != null ? `$${stockData.eps.toFixed(2)}` : "—" },
    { label: "Earnings Date", value: stockData?.earningsDate || "—" },
    { label: "Dividend", value: stockData?.dividend || "—" },
    { label: "Ex-Div Date", value: stockData?.exDivDate || "—" },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-foreground">{symbol}</h2>
              {stockData?.exchange && (
                <span className="text-xs border border-border rounded px-2 py-0.5 truncate" style={{ color: "#94a3b8" }}>
                  {stockData.exchange}
                </span>
              )}
            </div>
            <p className="text-sm truncate" style={{ color: "#94a3b8" }}>
              {loading ? "Loading..." : (stockData?.name || symbol)}
            </p>
            {isValid && periodReturn && (
              <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
                {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>
                  {isUp ? "+" : ""}${Math.abs(periodReturn.dollar).toFixed(2)}{" "}
                  ({isUp ? "+" : ""}{periodReturn.pct.toFixed(2)}%)
                </span>
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>{PERIOD_LABEL[period]}</span>
              </div>
            )}
          </div>

          {isValid && (
            <div className="text-right mx-6">
              <p className="text-3xl font-bold text-foreground">{fmtPrice(stockData!.price)}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>current price</p>
            </div>
          )}

          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-5 max-h-[72vh] overflow-y-auto flex flex-col">

          {/* Period Selector */}
          <div className="flex gap-1 flex-shrink-0">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                style={{ color: period === p ? undefined : "#94a3b8" }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="py-8 text-center flex-shrink-0" style={{ color: "#94a3b8" }}>
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading stock data...</p>
            </div>
          )}

          {/* Chart */}
          {!loading && (
            <div style={{ height: 224, width: "100%", minWidth: 0 }} className="flex-shrink-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={224}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      ticks={xTicks}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => fmtTick(String(v), period)}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={65}
                      tickFormatter={v => `$${Number(v).toFixed(0)}`}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={lineColor}
                      strokeWidth={2}
                      fill="url(#grad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-sm gap-2" style={{ height: 224, color: "#94a3b8" }}>
                  <p className="font-medium mb-1">No chart data available</p>
                  <p className="text-xs">Unable to fetch historical data for {period} period</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid — 9 tiles, 3 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {stats.map(s => (
              <div key={s.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{s.label}</p>
                <p className="text-sm font-semibold text-foreground">
                  {loading
                    ? <span className="animate-pulse" style={{ color: "#94a3b8" }}>...</span>
                    : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── News Section ────────────────────────────────────── */}
          <div className="flex-shrink-0">

            {/* Section header + pagination controls */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Latest News</p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNewsPage(p => Math.max(0, p - 1))}
                    disabled={newsPage === 0}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" style={{ color: "#94a3b8" }} />
                  </button>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {newsPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setNewsPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={newsPage === totalPages - 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" style={{ color: "#94a3b8" }} />
                  </button>
                </div>
              )}
            </div>

            {/* News loading */}
            {newsLoading && (
              <div className="py-4 text-center" style={{ color: "#94a3b8" }}>
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                <p className="text-xs">Loading news...</p>
              </div>
            )}

            {/* No news */}
            {!newsLoading && news.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-xs" style={{ color: "#94a3b8" }}>No recent news found for {symbol}</p>
              </div>
            )}

            {/* News articles */}
            {!newsLoading && visibleNews.length > 0 && (
              <div className="space-y-2">
                {visibleNews.map((article, i) => (
                  <a
                    key={`${article.url}-${i}`}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group"
                  >
                    {/* Thumbnail */}
                    {article.image && (
                      <img
                        src={article.image}
                        alt=""
                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs" style={{ color: "#94a3b8" }}>{article.site}</span>
                        <span style={{ color: "#94a3b8" }}>·</span>
                        <span className="text-xs" style={{ color: "#94a3b8" }}>{fmtTimeAgo(article.publishedDate)}</span>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "#94a3b8" }} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
