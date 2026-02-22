"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, X, RefreshCw } from "lucide-react"

interface StockDetail {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
  marketCap: number
  pe: number | null
  yearHigh: number
  yearLow: number
  volume: number
  avgVolume: number
  dividendYield: number | null
  lastDiv: number | null
  exchange: string
}

interface PricePoint { date: string; price: number }
type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"
const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]
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

function fmtPrice(v: number | null | undefined) {
  if (v == null || !isFinite(v) || v === 0) return "—"
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

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-bold text-foreground">{fmtPrice(payload[0].value)}</p>
    </div>
  )
}

interface Props {
  symbol: string | null
  open: boolean
  onClose: () => void
}

export default function StockDetailModal({ symbol, open, onClose }: Props) {
  const [detail, setDetail] = useState<StockDetail | null>(null)
  const [history, setHistory] = useState<PricePoint[]>([])
  const [period, setPeriod] = useState<Period>("1Y")
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!symbol || !open) return
    const key = `stockDetail_${symbol}`
    const cached = getCached<StockDetail>(key)
    if (cached) { setDetail(cached); return }
    setDetail(null)
    setLoadingDetail(true)
    fetch(`/api/stock/detail?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.price === "number") setCached(key, d)
        setDetail(d)
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false))
  }, [symbol, open])

  useEffect(() => {
    if (!symbol || !open) return
    const key = `stockHistory_${symbol}_${period}`
    const cached = getCached<PricePoint[]>(key)
    if (cached) { setHistory(cached); return }
    setHistory([])
    setLoadingHistory(true)
    fetch(`/api/stock/history?symbol=${symbol}&period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        const pts = Array.isArray(d) ? d : []
        if (pts.length > 0) setCached(key, pts)
        setHistory(pts)
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false))
  }, [symbol, open, period])

  if (!open || !symbol) return null

  const isValid = detail != null && typeof detail.price === "number"
  const isUp = (detail?.changePercent ?? 0) >= 0
  const firstPrice = history[0]?.price ?? 0
  const lastPrice = history[history.length - 1]?.price ?? 0
  const chartUp = lastPrice >= firstPrice

  // ── Stats always render — show "—" when data missing ──
  const stats = [
    { label: "Open", value: isValid ? fmtPrice(detail!.open) : loadingDetail ? "..." : "—" },
    { label: "High", value: isValid ? fmtPrice(detail!.high) : loadingDetail ? "..." : "—" },
    { label: "Low", value: isValid ? fmtPrice(detail!.low) : loadingDetail ? "..." : "—" },
    { label: "Prev Close", value: isValid ? fmtPrice(detail!.previousClose) : loadingDetail ? "..." : "—" },
    { label: "Mkt Cap", value: isValid ? fmtCap(detail!.marketCap) : loadingDetail ? "..." : "—" },
    { label: "P/E Ratio", value: isValid ? (detail!.pe != null ? detail!.pe.toFixed(2) : "—") : loadingDetail ? "..." : "—" },
    { label: "52-Wk High", value: isValid ? fmtPrice(detail!.yearHigh) : loadingDetail ? "..." : "—" },
    { label: "52-Wk Low", value: isValid ? fmtPrice(detail!.yearLow) : loadingDetail ? "..." : "—" },
    { label: "Volume", value: isValid ? fmtVol(detail!.volume) : loadingDetail ? "..." : "—" },
    { label: "Avg Volume", value: isValid ? fmtVol(detail!.avgVolume) : loadingDetail ? "..." : "—" },
    { label: "Dividend", value: isValid ? (detail!.dividendYield != null ? `${detail!.dividendYield.toFixed(2)}%` : "—") : loadingDetail ? "..." : "—" },
    { label: "Qtrly Div Amt", value: isValid ? (detail!.lastDiv != null ? `$${detail!.lastDiv.toFixed(2)}` : "—") : loadingDetail ? "..." : "—" },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-foreground">{symbol}</h2>
              {detail?.exchange && (
                <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                  {detail.exchange}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {loadingDetail ? "Loading..." : (detail?.name || symbol)}
            </p>
          </div>

          {isValid && (
            <div className="text-right mr-8">
              <p className="text-3xl font-bold text-foreground">{fmtPrice(detail!.price)}</p>
              <div className={`flex items-center justify-end gap-1 text-sm font-medium mt-0.5 ${isUp ? "text-green-500" : "text-red-500"}`}>
                {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{isUp ? "+" : ""}{detail!.change.toFixed(2)}</span>
                <span>({isUp ? "+" : ""}{detail!.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          )}

          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Period Selector */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="w-full" style={{ height: 256, minHeight: 256 }}>
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartUp ? "#22c55e" : "#ef4444"} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartUp ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(v) => {
                      if (period === "1D") return String(v).substring(0, 5)
                      if (period === "5Y") return String(v).substring(0, 4)
                      return String(v).substring(5)
                    }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartUp ? "#22c55e" : "#ef4444"}
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>No chart data available for {period}</span>
                {period === "1D" && <span className="text-xs">Market may be closed — try 1W</span>}
              </div>
            )}
          </div>

          {/* Stats Grid — always renders all 12 tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-sm font-semibold ${s.value === "..." ? "text-muted-foreground animate-pulse" : "text-foreground"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
