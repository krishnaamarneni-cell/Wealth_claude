"use client"

import { useState, useEffect, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, X, RefreshCw } from "lucide-react"
import type { StockFull } from "@/app/api/stock/full/route"

type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"
const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]
const PERIOD_LABEL: Record<Period, string> = {
  "1D": "today", "1W": "past week", "1M": "past month",
  "3M": "past 3 months", "6M": "past 6 months",
  "1Y": "past year", "5Y": "past 5 years",
}

const CACHE_TTL = 12 * 60 * 60 * 1000

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
function fmtVol(v: number | null | undefined) {
  if (v == null || !isFinite(v) || v === 0) return "—"
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toLocaleString()
}
function fmtNum(v: number | null | undefined, dec = 2) {
  if (v == null || !isFinite(v)) return "—"
  return v.toFixed(dec)
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
      period === "5Y" ? p.date.substring(0, 4)  // year
        : ["1Y", "6M", "3M"].includes(period) ? p.date.substring(0, 7)  // year-month
          : p.date                                                                // full
    if (!seen.has(key)) { seen.add(key); ticks.push(p.date) }
  }
  return ticks
}

function fmtTick(v: string, period: Period): string {
  if (period === "1D") return v.substring(0, 5)
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

// ── Props ─────────────────────────────────────────────────────────────

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

  // Reset on new symbol
  useEffect(() => {
    if (open) { setStockData(null); setPeriod("1Y") }
  }, [symbol, open])

  // Single fetch — returns everything
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

  // Chart data — instant client-side slice, zero extra API calls
  const chartData = useMemo(() => {
    if (!stockData) return []
    if (period === "1D") return stockData.intraday
    return sliceByPeriod(stockData.daily, period)
  }, [stockData, period])

  // Deduplicated X-axis ticks
  const xTicks = useMemo(() => getUniqueTicks(chartData, period), [chartData, period])

  // Period return %
  const periodReturn = useMemo(() => {
    if (!stockData || chartData.length < 2) return null
    const first = chartData[0].price
    const dollar = stockData.price - first
    const pct = (dollar / first) * 100
    return { dollar, pct }
  }, [stockData, chartData])

  if (!open || !symbol) return null

  const isValid = stockData != null && typeof stockData.price === "number"
  const isUp = (periodReturn?.pct ?? stockData?.changePercent ?? 0) >= 0
  const lastPrice = chartData[chartData.length - 1]?.price ?? 0
  const firstPrice = chartData[0]?.price ?? 0
  const chartUp = lastPrice >= firstPrice
  const lineColor = chartUp ? "#22c55e" : "#ef4444"

  const stats = [
    { label: "Prev Close", value: fmtPrice(stockData?.previousClose) },
    { label: "Open", value: fmtPrice(stockData?.open) },
    { label: "Bid", value: stockData?.bid || "—" },
    { label: "Ask", value: stockData?.ask || "—" },
    { label: "Day's Range", value: stockData?.dayRange || "—" },
    { label: "52-Wk Range", value: stockData?.weekRange52 || "—" },
    { label: "Volume", value: fmtVol(stockData?.volume) },
    { label: "Avg Volume", value: fmtVol(stockData?.avgVolume) },
    { label: "Market Cap", value: fmtCap(stockData?.marketCap) },
    { label: "Beta", value: fmtNum(stockData?.beta) },
    { label: "P/E (TTM)", value: fmtNum(stockData?.pe) },
    { label: "EPS (TTM)", value: stockData?.eps != null ? `$${stockData.eps.toFixed(2)}` : "—" },
    { label: "Earnings Date", value: stockData?.earningsDate || "—" },
    { label: "Dividend", value: stockData?.dividend || "—" },
    { label: "Ex-Div Date", value: stockData?.exDivDate || "—" },
    { label: "1Y Target", value: fmtPrice(stockData?.targetPrice) },
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
            {/* Symbol + Exchange */}
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-foreground">{symbol}</h2>
              {stockData?.exchange && (
                <span className="text-xs border border-border rounded px-2 py-0.5 truncate" style={{ color: "#94a3b8" }}>
                  {stockData.exchange}
                </span>
              )}
            </div>
            {/* Company name */}
            <p className="text-sm truncate" style={{ color: "#94a3b8" }}>
              {loading ? "Loading..." : (stockData?.name || symbol)}
            </p>

            {/* Period return — changes with period */}
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

          {/* Current price */}
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
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                style={{ color: period === p ? undefined : "#94a3b8" }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Loading state for entire content */}
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
                <div className="text-center">
                  <p className="font-medium mb-1">No chart data available</p>
                  <p className="text-xs">Unable to fetch historical data for {period} period</p>
                </div>
              </div>
            )}
            </div>
          )}

          {/* Stats Grid — 16 tiles, always rendered */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {stats.map(s => (
              <div key={s.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{s.label}</p>
                <p className="text-sm font-semibold text-foreground">
                  {loading ? <span className="animate-pulse" style={{ color: "#94a3b8" }}>...</span> : s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
