"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  prevClose: number
  high52: number
  low52: number
}

interface HistoryPoint { date: string; close: number }

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — 3 sections
// ─────────────────────────────────────────────────────────────────────────────
const INDICES = [
  { symbol: "^GSPC", label: "S&P 500", flag: "🇺🇸" },
  { symbol: "^IXIC", label: "NASDAQ", flag: "🇺🇸" },
  { symbol: "^DJI", label: "Dow Jones", flag: "🇺🇸" },
  { symbol: "^FTSE", label: "FTSE 100", flag: "🇬🇧" },
  { symbol: "^GDAXI", label: "DAX", flag: "🇩🇪" },
  { symbol: "^FCHI", label: "CAC 40", flag: "🇫🇷" },
  { symbol: "^N225", label: "Nikkei 225", flag: "🇯🇵" },
  { symbol: "^HSI", label: "Hang Seng", flag: "🇭🇰" },
  { symbol: "^AXJO", label: "ASX 200", flag: "🇦🇺" },
  { symbol: "^BSESN", label: "BSE Sensex", flag: "🇮🇳" },
]

const SECTORS = [
  { symbol: "XLK", label: "Technology" },
  { symbol: "XLV", label: "Healthcare" },
  { symbol: "XLF", label: "Financials" },
  { symbol: "XLE", label: "Energy" },
  { symbol: "XLI", label: "Industrials" },
  { symbol: "XLY", label: "Consumer Discret." },
  { symbol: "XLP", label: "Consumer Staples" },
  { symbol: "XLB", label: "Materials" },
  { symbol: "XLRE", label: "Real Estate" },
  { symbol: "XLU", label: "Utilities" },
  { symbol: "XLC", label: "Communication" },
]

const ASSETS = [
  { symbol: "GLD", label: "Gold", icon: "🥇" },
  { symbol: "SLV", label: "Silver", icon: "🥈" },
  { symbol: "USO", label: "Crude Oil", icon: "🛢️" },
  { symbol: "TLT", label: "US Bonds 20Y", icon: "📊" },
  { symbol: "BTC-USD", label: "Bitcoin", icon: "₿" },
  { symbol: "ETH-USD", label: "Ethereum", icon: "Ξ" },
  { symbol: "^TNX", label: "10Y Treasury", icon: "📈" },
]

const RANGES = [
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtPrice(v: number | undefined, symbol?: string): string {
  if (v == null) return "—"
  if (symbol === "^TNX") return `${v.toFixed(2)}%`
  if (v >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v.toFixed(2)
}

function fmtPct(v: number | undefined): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

function fmtChartDate(dateStr: string, range: string): string {
  const d = new Date(dateStr)
  if (range === "1mo") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  if (range === "5y") return d.toLocaleDateString("en-US", { year: "numeric" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function pctChangeFromFirst(history: HistoryPoint[]): number {
  if (history.length < 2) return 0
  const first = history[0].close
  const last = history[history.length - 1].close
  return ((last - first) / first) * 100
}

// Bar for sector/index relative performance
function MiniBar({ pct }: { pct: number }) {
  const capped = Math.min(Math.abs(pct), 10)
  const width = (capped / 10) * 52
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 52, height: 4, background: "#0f1923", borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          width,
          height: "100%",
          background: pct >= 0 ? "#00e676" : "#f87171",
          borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, range }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; range: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#0d1825",
      border: "1px solid #1e293b",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
    }}>
      <div style={{ color: "#64748b", marginBottom: 2 }}>{fmtChartDate(label ?? "", range)}</div>
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
        {payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function MarketsWrapper() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [selectedSym, setSelectedSym] = useState("^GSPC")
  const [selectedLabel, setSelectedLabel] = useState("S&P 500")
  const [range, setRange] = useState("6mo")
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true)
    try {
      const res = await fetch("/api/markets-data")
      const json = await res.json()
      setQuotes(json.quotes ?? {})
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }))
    } finally {
      setLoadingQuotes(false)
    }
  }, [])

  const fetchHistory = useCallback(async (symbol: string, r: string) => {
    setLoadingChart(true)
    setHistory([])
    try {
      const res = await fetch(`/api/markets-history?symbol=${encodeURIComponent(symbol)}&range=${r}`)
      const json = await res.json()
      setHistory(json.history ?? [])
    } finally {
      setLoadingChart(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotes()
    fetchHistory("^GSPC", "6mo")
  }, []) // eslint-disable-line

  function selectSymbol(symbol: string, label: string) {
    setSelectedSym(symbol)
    setSelectedLabel(label)
    fetchHistory(symbol, range)
  }

  function selectRange(r: string) {
    setRange(r)
    fetchHistory(selectedSym, r)
  }

  const q = quotes[selectedSym]
  const isPositive = (q?.changePct ?? 0) >= 0
  const chartColor = isPositive ? "#00e676" : "#f87171"
  const chartMin = history.length ? Math.min(...history.map(d => d.close)) * 0.998 : 0
  const chartMax = history.length ? Math.max(...history.map(d => d.close)) * 1.002 : 0
  const periodPct = pctChangeFromFirst(history)

  // Thin out X-axis labels
  const xTickCount = range === "1mo" ? 4 : range === "5y" ? 6 : 5
  const xTicks = history.length
    ? history
      .filter((_, i) => i % Math.floor(history.length / xTickCount) === 0)
      .map(d => d.date)
    : []

  return (
    <div style={{
      height: "100%",
      background: "#060a10",
      display: "flex",
      fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      color: "#e2e8f0",
      overflow: "hidden",
    }}>

      {/* ══════════════════════════════════════════════════════
          LEFT — CHART PANEL
      ══════════════════════════════════════════════════════ */}
      <div style={{
        flex: "0 0 58%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1e293b",
        padding: "24px 28px",
        overflow: "hidden",
      }}>

        {/* Chart header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 500, marginBottom: 4 }}>
                {selectedSym}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                {selectedLabel}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {q ? (
                <>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                    {fmtPrice(q.price, selectedSym)}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 2,
                  }}>
                    {isPositive ? <TrendingUp size={14} color="#00e676" /> : <TrendingDown size={14} color="#f87171" />}
                    <span style={{ fontSize: 14, fontWeight: 600, color: isPositive ? "#00e676" : "#f87171" }}>
                      {fmtPct(q.changePct)}
                    </span>
                    <span style={{ fontSize: 13, color: "#475569" }}>today</span>
                  </div>
                </>
              ) : (
                <div style={{ color: "#334155", fontSize: 14 }}>Loading…</div>
              )}
            </div>
          </div>

          {/* Period performance + range selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#475569" }}>
              Period return:{" "}
              <span style={{ fontWeight: 600, color: periodPct >= 0 ? "#00e676" : "#f87171" }}>
                {history.length ? `${periodPct >= 0 ? "+" : ""}${periodPct.toFixed(2)}%` : "—"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => selectRange(r.key)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 5,
                    border: range === r.key ? "1px solid #00e676" : "1px solid #1e293b",
                    background: range === r.key ? "rgba(0,230,118,0.08)" : "transparent",
                    color: range === r.key ? "#00e676" : "#475569",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {loadingChart && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "#060a10", zIndex: 2,
            }}>
              <Loader2 size={22} color="#334155" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {!loadingChart && history.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  ticks={xTicks}
                  tickFormatter={d => fmtChartDate(d, range)}
                  tick={{ fill: "#334155", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[chartMin, chartMax]}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                  tick={{ fill: "#334155", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  orientation="right"
                />
                <Tooltip content={<ChartTooltip range={range} />} />
                <ReferenceLine
                  y={history[0]?.close}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#chartGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 52W range bar */}
        {q && q.high52 && q.low52 && (
          <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid #0f1923" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#334155", marginBottom: 6 }}>
              <span>52W Low: {fmtPrice(q.low52)}</span>
              <span style={{ color: "#475569" }}>52-week range</span>
              <span>52W High: {fmtPrice(q.high52)}</span>
            </div>
            <div style={{ position: "relative", height: 4, background: "#0f1923", borderRadius: 2 }}>
              <div style={{
                position: "absolute",
                left: `${Math.min(100, Math.max(0, ((q.price - q.low52) / (q.high52 - q.low52)) * 100))}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: chartColor,
                border: "2px solid #060a10",
              }} />
              <div style={{
                position: "absolute",
                left: 0,
                width: `${Math.min(100, Math.max(0, ((q.price - q.low52) / (q.high52 - q.low52)) * 100))}%`,
                height: "100%",
                background: `linear-gradient(to right, #1e293b, ${chartColor}44)`,
                borderRadius: 2,
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT — DASHBOARD PANEL
      ══════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          background: "#060a10",
          zIndex: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em" }}>
            MARKETS OVERVIEW
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "#334155" }}>Updated {lastUpdated}</span>
            )}
            <button
              onClick={fetchQuotes}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 5,
                border: "1px solid #1e293b", background: "transparent",
                color: "#475569", fontSize: 11, cursor: "pointer",
              }}
            >
              <RefreshCw size={11} style={loadingQuotes ? { animation: "spin 1s linear infinite" } : {}} />
              Refresh
            </button>
          </div>
        </div>

        <div style={{ padding: "0 0 32px" }}>

          {/* ── GLOBAL INDICES ── */}
          <Section title="Global Indices" emoji="🌐">
            {INDICES.map(item => (
              <MarketRow
                key={item.symbol}
                symbol={item.symbol}
                label={item.label}
                prefix={item.flag}
                quote={quotes[item.symbol]}
                selected={selectedSym === item.symbol}
                onClick={() => selectSymbol(item.symbol, item.label)}
                showMiniBar
              />
            ))}
          </Section>

          {/* ── SECTORS ── */}
          <Section title="Sector Performance" emoji="📊">
            {SECTORS.map(item => (
              <MarketRow
                key={item.symbol}
                symbol={item.symbol}
                label={item.label}
                quote={quotes[item.symbol]}
                selected={selectedSym === item.symbol}
                onClick={() => selectSymbol(item.symbol, item.label)}
                showMiniBar
              />
            ))}
          </Section>

          {/* ── ASSET CLASSES ── */}
          <Section title="Asset Classes" emoji="💎">
            {ASSETS.map(item => (
              <MarketRow
                key={item.symbol}
                symbol={item.symbol}
                label={item.label}
                prefix={item.icon}
                quote={quotes[item.symbol]}
                selected={selectedSym === item.symbol}
                onClick={() => selectSymbol(item.symbol, item.label)}
              />
            ))}
          </Section>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: #060a10 }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, emoji, children }: {
  title: string; emoji: string; children: React.ReactNode
}) {
  return (
    <div>
      <div style={{
        padding: "14px 20px 8px",
        fontSize: 11,
        fontWeight: 700,
        color: "#334155",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span>{emoji}</span> {title}
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKET ROW
// ─────────────────────────────────────────────────────────────────────────────
function MarketRow({ symbol, label, prefix, quote, selected, onClick, showMiniBar }: {
  symbol: string
  label: string
  prefix?: string
  quote?: Quote
  selected: boolean
  onClick: () => void
  showMiniBar?: boolean
}) {
  const pct = quote?.changePct ?? 0
  const isPos = pct >= 0
  const pctColor = isPos ? "#00e676" : "#f87171"

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "9px 20px",
        background: selected ? "rgba(0,230,118,0.05)" : "transparent",
        borderLeft: selected ? "2px solid #00e676" : "2px solid transparent",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "1px solid #0a1018",
        cursor: "pointer",
        transition: "all 0.12s",
        textAlign: "left",
        gap: 10,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#0a1018" }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent" }}
    >
      {/* Prefix (flag/icon) */}
      {prefix && (
        <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0, width: 22 }}>{prefix}</span>
      )}
      {!prefix && (
        <span style={{ fontSize: 10, color: "#334155", flexShrink: 0, width: 22 }}>{symbol.replace("^", "")}</span>
      )}

      {/* Label */}
      <span style={{
        flex: 1, fontSize: 13, fontWeight: selected ? 600 : 400,
        color: selected ? "#f1f5f9" : "#94a3b8",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {label}
      </span>

      {quote ? (
        <>
          {/* Mini bar */}
          {showMiniBar && <MiniBar pct={pct} />}

          {/* Price */}
          <span style={{
            fontSize: 13, fontWeight: 600, color: "#e2e8f0",
            width: 72, textAlign: "right", flexShrink: 0,
          }}>
            {fmtPrice(quote.price, symbol)}
          </span>

          {/* Change % */}
          <span style={{
            fontSize: 12, fontWeight: 600, color: pctColor,
            width: 58, textAlign: "right", flexShrink: 0,
          }}>
            {fmtPct(pct)}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 11, color: "#1e293b", marginLeft: "auto" }}>—</span>
      )}
    </button>
  )
}
