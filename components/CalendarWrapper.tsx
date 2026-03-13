"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Rocket, Loader2 } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = "economic" | "earnings" | "ipo"

// FMP earnings-calendar shape
interface EarningsEvent {
  symbol: string
  date: string
  epsActual: number | null
  epsEstimated: number | null
  revenueActual: number | null
  revenueEstimated: number | null
  lastUpdated: string | null
}

// FMP ipos-calendar shape
interface IpoEvent {
  symbol: string
  date: string
  company: string
  exchange: string
  actions: string
  shares: number | null
  priceRange: string | null
  marketCap: number | null
}

interface CalendarData {
  economic: unknown[]
  earnings: EarningsEvent[]
  ipo: IpoEvent[]
  from: string
  to: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "economic", label: "Economic", icon: <CalendarDays size={14} /> },
  { key: "earnings", label: "Earnings", icon: <TrendingUp size={14} /> },
  { key: "ipo", label: "IPO", icon: <Rocket size={14} /> },
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10) }

function weekDates(from: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d.toISOString().slice(0, 10)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  })
}

function fmtDayNum(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").getUTCDate().toString()
}

function fmtMon(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", timeZone: "UTC",
  })
}

function fmtNum(v: number | null | undefined, prefix = ""): string {
  if (v == null) return "—"
  if (Math.abs(v) >= 1e9) return `${prefix}${(v / 1e9).toFixed(2)}B`
  if (Math.abs(v) >= 1e6) return `${prefix}${(v / 1e6).toFixed(2)}M`
  return `${prefix}${v.toFixed(2)}`
}

function fmtEps(v: number | null | undefined): string {
  if (v == null) return "—"
  return v >= 0 ? `$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`
}

function epsSurprise(actual: number | null, est: number | null): string {
  if (actual == null || est == null || est === 0) return "—"
  const pct = ((actual - est) / Math.abs(est)) * 100
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`
}

function surpriseColor(actual: number | null, est: number | null): string {
  if (actual == null || est == null) return "#94a3b8"
  return actual >= est ? "#4ade80" : "#f87171"
}

function countByDate(events: { date?: string }[], dates: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const d of dates) counts[d] = 0
  for (const e of events) {
    const d = e.date ?? ""
    if (d in counts) counts[d]++
  }
  return counts
}

// ─────────────────────────────────────────────────────────────────────────────
// TRADINGVIEW ECONOMIC WIDGET
// ─────────────────────────────────────────────────────────────────────────────
function EconomicWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js"
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "us,eu,gb,jp,cn,ca,au,de,fr,in,br,kr,ch",
    })
    containerRef.current.appendChild(script)

    // Force dark background on the iframe once TradingView injects it
    const interval = setInterval(() => {
      const iframe = containerRef.current?.querySelector("iframe")
      if (iframe) {
        iframe.style.background = "#060a10"
        iframe.style.backgroundColor = "#060a10"
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ height: "100%", background: "#060a10" }}>
      <style>{`
        .tv-widget-container iframe,
        .tv-widget-container iframe html,
        .tv-widget-container iframe body {
          background: #060a10 !important;
          background-color: #060a10 !important;
          color-scheme: dark !important;
        }
      `}</style>
      <div
        className="tradingview-widget-container tv-widget-container"
        ref={containerRef}
        style={{ height: "100%", width: "100%", background: "#060a10" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "100%", background: "#060a10" }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CalendarWrapper() {
  const [tab, setTab] = useState<TabKey>("economic")
  const [activeDay, setActiveDay] = useState<string>(todayStr())
  const [weekStart, setWeekStart] = useState<string>("")
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar-data?date=${date}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setWeekStart(json.from)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load calendar data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(activeDay) }, []) // eslint-disable-line

  const dates = weekStart ? weekDates(weekStart) : []

  const earnByDate = data ? countByDate(data.earnings, dates) : {}
  const ipoByDate = data ? countByDate(data.ipo, dates) : {}

  function countForDay(d: string) {
    if (tab === "earnings") return earnByDate[d] ?? 0
    if (tab === "ipo") return ipoByDate[d] ?? 0
    return 0
  }

  const earnEvents = data?.earnings.filter(e => e.date === activeDay) ?? []
  const ipoEvents = data?.ipo.filter(e => e.date === activeDay) ?? []

  function navigateWeek(dir: 1 | -1) {
    const newDate = addWeeks(activeDay, dir)
    setActiveDay(newDate)
    fetchData(newDate)
  }

  return (
    <div style={{
      height: "100%",
      background: "#060a10",
      color: "#e2e8f0",
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 24px",
        borderBottom: "1px solid #1e293b",
        flexShrink: 0,
      }}>
        <button onClick={() => navigateWeek(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
        <button
          onClick={() => { setActiveDay(todayStr()); fetchData(todayStr()) }}
          style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
        >
          Today
        </button>
        <button onClick={() => navigateWeek(1)} style={navBtnStyle}><ChevronRight size={16} /></button>

        <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginLeft: 4 }}>
          {dates.length ? `${fmtDate(dates[0])} — ${fmtDate(dates[6])}` : "Loading…"}
        </span>

        <div style={{ flex: 1 }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 6,
                border: tab === t.key ? "1px solid #00e676" : "1px solid #1e293b",
                background: tab === t.key ? "rgba(0,230,118,0.08)" : "transparent",
                color: tab === t.key ? "#00e676" : "#64748b",
                fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── WEEK STRIP — only for earnings/ipo ── */}
      {tab !== "economic" && dates.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}>
          {dates.map((d, i) => {
            const active = d === activeDay
            const today = d === todayStr()
            const count = countForDay(d)
            return (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                style={{
                  padding: "10px 0", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4,
                  background: active ? "rgba(0,230,118,0.06)" : "transparent",
                  borderRight: i < 6 ? "1px solid #1e293b" : "none",
                  borderBottom: active ? "2px solid #00e676" : "2px solid transparent",
                  cursor: "pointer", transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 11, color: active ? "#00e676" : "#475569", fontWeight: 500 }}>{DAYS[i]}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: active ? "#00e676" : today ? "#f1f5f9" : "#94a3b8", lineHeight: 1 }}>
                  {fmtDayNum(d)}
                </span>
                <span style={{ fontSize: 10, color: "#334155" }}>{fmtMon(d)}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: active ? "#00e676" : "#64748b",
                    background: active ? "rgba(0,230,118,0.12)" : "#0f1923",
                    padding: "1px 7px", borderRadius: 99,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: tab === "economic" ? "hidden" : "auto", minHeight: 0 }}>

        {/* Economic — TradingView widget */}
        {tab === "economic" && <EconomicWidget />}

        {/* Earnings + IPO — our native UI */}
        {tab !== "economic" && (
          <>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10, color: "#475569" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 14 }}>Loading…</span>
              </div>
            )}
            {error && !loading && (
              <div style={{ padding: 32, textAlign: "center", color: "#ef4444", fontSize: 14 }}>{error}</div>
            )}
            {!loading && !error && tab === "earnings" && <EarningsTable events={earnEvents} />}
            {!loading && !error && tab === "ipo" && <IpoTable events={ipoEvents} />}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        ::-webkit-scrollbar { width: 6px }
        ::-webkit-scrollbar-track { background: #060a10 }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EARNINGS TABLE
// ─────────────────────────────────────────────────────────────────────────────
function EarningsTable({ events }: { events: EarningsEvent[] }) {
  if (events.length === 0) return <EmptyState message="No earnings reports for this day." />

  return (
    <div>
      <div style={tableHeaderStyle}>
        <span style={{ ...colStyle, width: 90 }}>Ticker</span>
        <span style={{ ...colStyle, width: 110, textAlign: "right" }}>EPS Est.</span>
        <span style={{ ...colStyle, width: 110, textAlign: "right" }}>EPS Actual</span>
        <span style={{ ...colStyle, width: 130, textAlign: "right" }}>Rev. Est.</span>
        <span style={{ ...colStyle, width: 130, textAlign: "right" }}>Rev. Actual</span>
        <span style={{ ...colStyle, width: 100, textAlign: "right" }}>EPS Surprise</span>
        <span style={{ ...colStyle, width: 110, textAlign: "right" }}>Last Updated</span>
      </div>
      {events.map((e, i) => (
        <div key={i} style={rowStyle}
          onMouseEnter={ev => (ev.currentTarget.style.background = "#0d1825")}
          onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
        >
          <span style={{ width: 90, fontSize: 13, fontWeight: 700, color: "#00e676" }}>{e.symbol}</span>
          <span style={{ width: 110, textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtEps(e.epsEstimated)}</span>
          <span style={{ width: 110, textAlign: "right", fontSize: 13, color: "#f1f5f9", fontWeight: e.epsActual != null ? 600 : 400 }}>{fmtEps(e.epsActual)}</span>
          <span style={{ width: 130, textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtNum(e.revenueEstimated, "$")}</span>
          <span style={{ width: 130, textAlign: "right", fontSize: 13, color: "#f1f5f9", fontWeight: e.revenueActual != null ? 600 : 400 }}>{fmtNum(e.revenueActual, "$")}</span>
          <span style={{ width: 100, textAlign: "right", fontSize: 13, fontWeight: 600, color: surpriseColor(e.epsActual, e.epsEstimated) }}>
            {epsSurprise(e.epsActual, e.epsEstimated)}
          </span>
          <span style={{ width: 110, textAlign: "right", fontSize: 12, color: "#475569" }}>{e.lastUpdated ?? "—"}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IPO TABLE
// ─────────────────────────────────────────────────────────────────────────────
function IpoTable({ events }: { events: IpoEvent[] }) {
  if (events.length === 0) return <EmptyState message="No IPOs scheduled for this day." />

  return (
    <div>
      <div style={tableHeaderStyle}>
        <span style={{ ...colStyle, width: 80 }}>Ticker</span>
        <span style={{ ...colStyle, flex: 1 }}>Company</span>
        <span style={{ ...colStyle, width: 120 }}>Exchange</span>
        <span style={{ ...colStyle, width: 120 }}>Price Range</span>
        <span style={{ ...colStyle, width: 100, textAlign: "right" }}>Shares</span>
        <span style={{ ...colStyle, width: 130, textAlign: "right" }}>Market Cap</span>
        <span style={{ ...colStyle, width: 90, textAlign: "center" }}>Status</span>
      </div>
      {events.map((e, i) => {
        const statusColor = e.actions?.toLowerCase() === "priced" ? "#4ade80" : "#f59e0b"
        return (
          <div key={i} style={rowStyle}
            onMouseEnter={ev => (ev.currentTarget.style.background = "#0d1825")}
            onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
          >
            <span style={{ width: 80, fontSize: 13, fontWeight: 700, color: "#00e676" }}>{e.symbol || "—"}</span>
            <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0" }}>{e.company}</span>
            <span style={{ width: 120, fontSize: 13, color: "#64748b" }}>{e.exchange}</span>
            <span style={{ width: 120, fontSize: 13, color: "#f1f5f9" }}>{e.priceRange ?? "—"}</span>
            <span style={{ width: 100, textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtNum(e.shares)}</span>
            <span style={{ width: 130, textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtNum(e.marketCap, "$")}</span>
            <span style={{ width: 90, display: "flex", justifyContent: "center" }}>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}22`, textTransform: "capitalize" }}>
                {e.actions ?? "—"}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────────────────────────────────────
const tableHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "10px 24px",
  borderBottom: "1px solid #1e293b", position: "sticky", top: 0,
  background: "#070c14", zIndex: 10,
}

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "10px 24px",
  borderBottom: "1px solid #0f1923", transition: "background 0.1s",
}

const colStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#334155",
  letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0,
}

const navBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 6, border: "1px solid #1e293b",
  background: "transparent", color: "#64748b", cursor: "pointer",
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 8, color: "#334155" }}>
      <CalendarDays size={28} />
      <span style={{ fontSize: 14 }}>{message}</span>
    </div>
  )
}
