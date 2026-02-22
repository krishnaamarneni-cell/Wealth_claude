"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, X, RefreshCw } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────

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

interface PricePoint {
  date: string
  price: number
}

type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"

const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"]

// ─── Formatters ───────────────────────────────────────────────────────────

function fmtPrice(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(v)
}

function fmtCap(v: number) {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}

function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toLocaleString()
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-bold text-foreground">{fmtPrice(payload[0].value)}</p>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────

interface Props {
  symbol: string | null
  open: boolean
  onClose: () => void
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function StockDetailModal({ symbol, open, onClose }: Props) {
  const [detail, setDetail] = useState<StockDetail | null>(null)
  const [history, setHistory] = useState<PricePoint[]>([])
  const [period, setPeriod] = useState<Period>("1Y")
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch quote + stats
  useEffect(() => {
    if (!symbol || !open) return
    setDetail(null)
    setLoadingDetail(true)
    fetch(`/api/stock/detail?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(console.error)
      .finally(() => setLoadingDetail(false))
  }, [symbol, open])

  // Fetch price history
  useEffect(() => {
    if (!symbol || !open) return
    setHistory([])
    setLoadingHistory(true)
    fetch(`/api/stock/history?symbol=${symbol}&period=${period}`)
      .then((r) => r.json())
      .then((d) => setHistory(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingHistory(false))
  }, [symbol, open, period])

  if (!symbol) return null

  const isUp = (detail?.changePercent ?? 0) >= 0
  const firstPrice = history[0]?.price ?? 0
  const lastPrice = history[history.length - 1]?.price ?? 0
  const chartUp = lastPrice >= firstPrice

  const stats = detail
    ? [
      { label: "Open", value: fmtPrice(detail.open) },
      { label: "High", value: fmtPrice(detail.high) },
      { label: "Low", value: fmtPrice(detail.low) },
      { label: "Prev Close", value: fmtPrice(detail.previousClose) },
      { label: "Mkt Cap", value: fmtCap(detail.marketCap) },
      { label: "P/E Ratio", value: detail.pe != null ? detail.pe.toFixed(2) : "—" },
      { label: "52-Wk High", value: fmtPrice(detail.yearHigh) },
      { label: "52-Wk Low", value: fmtPrice(detail.yearLow) },
      { label: "Volume", value: fmtVol(detail.volume) },
      { label: "Avg Volume", value: fmtVol(detail.avgVolume) },
      { label: "Dividend", value: detail.dividendYield != null ? `${detail.dividendYield.toFixed(2)}%` : "—" },
      { label: "Qtrly Div Amt", value: detail.lastDiv != null ? `$${detail.lastDiv.toFixed(2)}` : "—" },
    ]
    : []

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden bg-card border-border">

        {/* Required by Radix — visually hidden */}
        <DialogTitle className="sr-only">
          {symbol} Stock Detail
        </DialogTitle>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-border">
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
              {loadingDetail ? "Loading..." : (detail?.name || "")}
            </p>
          </div>

          {/* Price block */}
          {detail && (
            <div className="text-right mr-8">
              <p className="text-3xl font-bold text-foreground">{fmtPrice(detail.price)}</p>
              <div
                className={`flex items-center justify-end gap-1 text-sm font-medium mt-0.5 ${isUp ? "text-green-500" : "text-red-500"
                  }`}
              >
                {isUp
                  ? <TrendingUp className="h-4 w-4" />
                  : <TrendingDown className="h-4 w-4" />}
                <span>{isUp ? "+" : ""}{detail.change.toFixed(2)}</span>
                <span>({isUp ? "+" : ""}{detail.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-4 space-y-5 max-h-[80vh] overflow-y-auto">

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
          <div className="h-64 w-full">
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
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
                      if (period === "1D") return v.substring(0, 5)
                      if (period === "5Y") return v.substring(0, 4)
                      return v.substring(5)
                    }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartUp ? "#22c55e" : "#ef4444"}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No chart data available
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {loadingDetail ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-muted/40 rounded-lg p-3 animate-pulse h-14" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-sm font-semibold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
