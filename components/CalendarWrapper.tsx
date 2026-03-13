"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Rocket, Loader2 } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = "economic" | "earnings" | "ipo"

interface EconEvent {
  time: string
  country: string
  event: string
  actual: string | null
  estimate: string | null
  prev: string | null
  impact: string | null
  unit: string | null
}

interface EarningsEvent {
  date: string
  hour: string
  symbol: string
  name: string
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  surprisePercent: number | null
}

interface IpoEvent {
  date: string
  name: string
  symbol: string
  exchange: string
  numberOfShares: number | null
  price: string | null
  status: string
  totalSharesValue: number | null
}

interface CalendarData {
  economic: EconEvent[]
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

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", EU: "🇪🇺", DE: "🇩🇪", FR: "🇫🇷", JP: "🇯🇵", CN: "🇨🇳",
  CA: "🇨🇦", AU: "🇦🇺", NZ: "🇳🇿", CH: "🇨🇭", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰",
  IT: "🇮🇹", ES: "🇪🇸", PT: "🇵🇹", NL: "🇳🇱", BE: "🇧🇪", AT: "🇦🇹", FI: "🇫🇮",
  GR: "🇬🇷", PL: "🇵🇱", CZ: "🇨🇿", HU: "🇭🇺", RO: "🇷🇴", TR: "🇹🇷", RU: "🇷🇺",
  IN: "🇮🇳", KR: "🇰🇷", SG: "🇸🇬", HK: "🇭🇰", TW: "🇹🇼", BR: "🇧🇷", MX: "🇲🇽",
  ZA: "🇿🇦", SA: "🇸🇦", AE: "🇦🇪", ID: "🇮🇩", MY: "🇲🇾", TH: "🇹🇭", PH: "🇵🇭",
  VN: "🇻🇳", AR: "🇦🇷", CL: "🇨🇱", CO: "🇨🇴", NG: "🇳🇬", EG: "🇪🇬", IL: "🇮🇱",
}

const IMPACT_COLORS: Record<string, { dot: string; badge: string }> = {
  high: { dot: "#ef4444", badge: "rgba(239,68,68,0.15)" },
  medium: { dot: "#f59e0b", badge: "rgba(245,158,11,0.15)" },
  low: { dot: "#6b7280", badge: "rgba(107,114,128,0.15)" },
}

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
  const d = new Date(dateStr + "T00:00:00Z")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

function fmtDayNum(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").getUTCDate().toString()
}

function fmtMon(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
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

function surpriseColor(v: number | null | undefined): string {
  if (v == null) return "#94a3b8"
  return v >= 0 ? "#4ade80" : "#f87171"
}

function countByDate(events: { date?: string; time?: string }[], dates: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const d of dates) counts[d] = 0
  for (const e of events) {
    const d = e.date ?? e.time?.slice(0, 10) ?? ""
    if (d in counts) counts[d]++
  }
  return counts
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CalendarWrapper() {
  const [tab, setTab] = useState<TabKey>("economic")
  const [activeDay, setActiveDay] = useState<string>(todayStr())
  const [weekStart, setWeekStart] = useState<string>("") // set after first fetch
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

  useEffect(() => { fetchData(activeDay) }, [])   // eslint-disable-line

  const dates = weekStart ? weekDates(weekStart) : []

  const econByDate = data && Array.isArray(data.economic) ? countByDate(
    data.economic.map(e => ({ date: e.time?.slice(0, 10) })), dates
  ) : {}
  const earnByDate = data && Array.isArray(data.earnings) ? countByDate(data.earnings, dates) : {}
  const ipoByDate = data && Array.isArray(data.ipo) ? countByDate(data.ipo, dates) : {}

  function countForDay(d: string) {
    if (tab === "economic") return econByDate[d] ?? 0
    if (tab === "earnings") return earnByDate[d] ?? 0
    return ipoByDate[d] ?? 0
  }

  // Filter events for selected day
  const econEvents: EconEvent[] = (data && Array.isArray(data.economic)) ? data.economic.filter(
    e => (e.time ?? "").slice(0, 10) === activeDay
  ) : []

  const earnEvents: EarningsEvent[] = (data && Array.isArray(data.earnings)) ? data.earnings.filter(
    e => e.date === activeDay
  ) : []

  const ipoEvents: IpoEvent[] = (data && Array.isArray(data.ipo)) ? data.ipo.filter(
    e => e.date === activeDay
  ) : []

  function navigateWeek(dir: 1 | -1) {
    const newDate = addWeeks(activeDay, dir)
    setActiveDay(newDate)
    fetchData(newDate)
  }

  const isToday = (d: string) => d === todayStr()

  // Group economic events by time
  const econGroups: Record<string, EconEvent[]> = {}
  for (const e of econEvents) {
    const t = e.time?.slice(11, 16) ?? "—"
    if (!econGroups[t]) econGroups[t] = []
    econGroups[t].push(e)
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
        {/* week nav */}
        <button onClick={() => navigateWeek(-1)} style={navBtnStyle}>
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => { setActiveDay(todayStr()); fetchData(todayStr()) }}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Today
        </button>
        <button onClick={() => navigateWeek(1)} style={navBtnStyle}>
          <ChevronRight size={16} />
        </button>

        {/* date range */}
        <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginLeft: 4 }}>
          {dates.length
            ? `${fmtDate(dates[0])} — ${fmtDate(dates[6])}`
            : "Loading…"}
        </span>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 6,
                border: tab === t.key ? "1px solid #00e676" : "1px solid #1e293b",
                background: tab === t.key ? "rgba(0,230,118,0.08)" : "transparent",
                color: tab === t.key ? "#00e676" : "#64748b",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── WEEK STRIP ── */}
      {dates.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}>
          {dates.map((d, i) => {
            const active = d === activeDay
            const today = isToday(d)
            const count = countForDay(d)
            return (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                style={{
                  padding: "10px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: active ? "rgba(0,230,118,0.06)" : "transparent",
                  borderRight: i < 6 ? "1px solid #1e293b" : "none",
                  borderBottom: active ? "2px solid #00e676" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 11, color: active ? "#00e676" : "#475569", fontWeight: 500 }}>
                  {DAYS[i]}
                </span>
                <span style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: active ? "#00e676" : today ? "#f1f5f9" : "#94a3b8",
                  lineHeight: 1,
                }}>
                  {fmtDayNum(d)}
                </span>
                <span style={{ fontSize: 10, color: "#334155" }}>{fmtMon(d)}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: active ? "#00e676" : "#64748b",
                    background: active ? "rgba(0,230,118,0.12)" : "#0f1923",
                    padding: "1px 7px",
                    borderRadius: 99,
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
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10, color: "#475569" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 14 }}>Loading calendar data…</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: 32, textAlign: "center", color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ECONOMIC TAB */}
            {tab === "economic" && (
              <EconomicTable groups={econGroups} />
            )}

            {/* EARNINGS TAB */}
            {tab === "earnings" && (
              <EarningsTable events={earnEvents} />
            )}

            {/* IPO TAB */}
            {tab === "ipo" && (
              <IpoTable events={ipoEvents} />
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 6px }
        ::-webkit-scrollbar-track { background: #060a10 }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ECONOMIC TABLE
// ─────────────────────────────────────────────────────────────────────────────
function EconomicTable({ groups }: { groups: Record<string, EconEvent[]> }) {
  const times = Object.keys(groups).sort()

  if (times.length === 0) {
    return <EmptyState message="No economic events for this day." />
  }

  return (
    <div>
      {/* header */}
      <div style={tableHeaderStyle}>
        <span style={{ ...colStyle, width: 60 }}>Time</span>
        <span style={{ ...colStyle, width: 80 }}>Country</span>
        <span style={{ ...colStyle, flex: 1 }}>Event</span>
        <span style={{ ...colStyle, width: 100, textAlign: "right" }}>Actual</span>
        <span style={{ ...colStyle, width: 100, textAlign: "right" }}>Forecast</span>
        <span style={{ ...colStyle, width: 100, textAlign: "right" }}>Previous</span>
        <span style={{ ...colStyle, width: 70, textAlign: "center" }}>Impact</span>
      </div>

      {times.map(time => (
        <div key={time}>
          {/* time group header */}
          <div style={{
            padding: "6px 24px",
            background: "#0a1220",
            borderBottom: "1px solid #1e293b",
            fontSize: 12,
            color: "#475569",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}>
            {time} UTC
          </div>

          {groups[time].map((e, i) => {
            const impact = (e.impact ?? "low").toLowerCase()
            const palette = IMPACT_COLORS[impact] ?? IMPACT_COLORS.low
            const flag = COUNTRY_FLAGS[e.country ?? ""] ?? "🌐"
            const hasActual = e.actual != null && e.actual !== ""

            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 24px",
                borderBottom: "1px solid #0f1923",
                gap: 0,
                transition: "background 0.1s",
              }}
                onMouseEnter={e2 => (e2.currentTarget.style.background = "#0d1825")}
                onMouseLeave={e2 => (e2.currentTarget.style.background = "transparent")}
              >
                <span style={{ width: 60, fontSize: 13, color: "#64748b" }}>{time}</span>
                <span style={{ width: 80, fontSize: 14 }}>{flag} {e.country}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0" }}>{e.event}</span>
                <span style={{
                  width: 100, textAlign: "right", fontSize: 13,
                  color: hasActual ? "#f1f5f9" : "#334155",
                  fontWeight: hasActual ? 600 : 400,
                }}>
                  {hasActual ? `${e.actual}${e.unit ?? ""}` : "—"}
                </span>
                <span style={{ width: 100, textAlign: "right", fontSize: 13, color: "#64748b" }}>
                  {e.estimate ? `${e.estimate}${e.unit ?? ""}` : "—"}
                </span>
                <span style={{ width: 100, textAlign: "right", fontSize: 13, color: "#64748b" }}>
                  {e.prev ? `${e.prev}${e.unit ?? ""}` : "—"}
                </span>
                <span style={{ width: 70, display: "flex", justifyContent: "center" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: palette.badge,
                    fontSize: 11,
                    fontWeight: 600,
                    color: palette.dot,
                    textTransform: "capitalize",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: palette.dot, flexShrink: 0 }} />
                    {impact}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EARNINGS TABLE
// ─────────────────────────────────────────────────────────────────────────────
function EarningsTable({ events }: { events: EarningsEvent[] }) {
  if (events.length === 0) {
    return <EmptyState message="No earnings reports for this day." />
  }

  return (
    <div>
      <div style={tableHeaderStyle}>
        <span style={{ ...colStyle, width: 60 }}>Time</span>
        <span style={{ ...colStyle, width: 80 }}>Ticker</span>
        <span style={{ ...colStyle, flex: 1 }}>Company</span>
        <span style={{ ...colStyle, width: 110, textAlign: "right" }}>EPS Est.</span>
        <span style={{ ...colStyle, width: 110, textAlign: "right" }}>EPS Actual</span>
        <span style={{ ...colStyle, width: 120, textAlign: "right" }}>Rev. Est.</span>
        <span style={{ ...colStyle, width: 120, textAlign: "right" }}>Rev. Actual</span>
        <span style={{ ...colStyle, width: 90, textAlign: "right" }}>Surprise</span>
      </div>

      {events.map((e, i) => {
        const hour = e.hour === "amc" ? "After Close" : e.hour === "bmo" ? "Pre-Market" : e.hour ?? "—"
        return (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 24px",
            borderBottom: "1px solid #0f1923",
            transition: "background 0.1s",
          }}
            onMouseEnter={e2 => (e2.currentTarget.style.background = "#0d1825")}
            onMouseLeave={e2 => (e2.currentTarget.style.background = "transparent")}
          >
            <span style={{ width: 60, fontSize: 11, color: "#475569" }}>{hour}</span>
            <span style={{ width: 80, fontSize: 13, fontWeight: 700, color: "#00e676" }}>{e.symbol}</span>
            <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0" }}>{e.name}</span>
            <span style={{ width: 110, textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtEps(e.epsEstimate)}</span>
            <span style={{ width: 110, textAlign: "right", fontSize: 13, color: "#f1f5f9", fontWeight: e.epsActual != null ? 600 : 400 }}>{fmtEps(e.epsActual)}</span>
            <span style={{ width: 120, textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtNum(e.revenueEstimate, "$")}</span>
            <span style={{ width: 120, textAlign: "right", fontSize: 13, color: "#f1f5f9", fontWeight: e.revenueActual != null ? 600 : 400 }}>{fmtNum(e.revenueActual, "$")}</span>
            <span style={{ width: 90, textAlign: "right", fontSize: 13, fontWeight: 600, color: surpriseColor(e.surprisePercent) }}>
              {e.surprisePercent != null ? `${e.surprisePercent > 0 ? "+" : ""}${e.surprisePercent.toFixed(1)}%` : "—"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IPO TABLE
// ─────────────────────────────────────────────────────────────────────────────
function IpoTable({ events }: { events: IpoEvent[] }) {
  if (events.length === 0) {
    return <EmptyState message="No IPOs scheduled for this day." />
  }

  return (
    <div>
      <div style={tableHeaderStyle}>
        <span style={{ ...colStyle, width: 80 }}>Ticker</span>
        <span style={{ ...colStyle, flex: 1 }}>Company</span>
        <span style={{ ...colStyle, width: 120 }}>Exchange</span>
        <span style={{ ...colStyle, width: 100, textAlign: "right" }}>Price</span>
        <span style={{ ...colStyle, width: 120, textAlign: "right" }}>Shares</span>
        <span style={{ ...colStyle, width: 130, textAlign: "right" }}>Total Value</span>
        <span style={{ ...colStyle, width: 90, textAlign: "center" }}>Status</span>
      </div>

      {events.map((e, i) => {
        const statusColor = e.status === "expected" ? "#f59e0b" : e.status === "priced" ? "#4ade80" : "#94a3b8"
        return (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 24px",
            borderBottom: "1px solid #0f1923",
            transition: "background 0.1s",
          }}
            onMouseEnter={e2 => (e2.currentTarget.style.background = "#0d1825")}
            onMouseLeave={e2 => (e2.currentTarget.style.background = "transparent")}
          >
            <span style={{ width: 80, fontSize: 13, fontWeight: 700, color: "#00e676" }}>{e.symbol || "—"}</span>
            <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0" }}>{e.name}</span>
            <span style={{ width: 120, fontSize: 13, color: "#64748b" }}>{e.exchange}</span>
            <span style={{ width: 100, textAlign: "right", fontSize: 13, color: "#f1f5f9" }}>
              {e.price ? `$${e.price}` : "—"}
            </span>
            <span style={{ width: 120, textAlign: "right", fontSize: 13, color: "#64748b" }}>
              {e.numberOfShares ? fmtNum(e.numberOfShares) : "—"}
            </span>
            <span style={{ width: 130, textAlign: "right", fontSize: 13, color: "#64748b" }}>
              {fmtNum(e.totalSharesValue, "$")}
            </span>
            <span style={{ width: 90, display: "flex", justifyContent: "center" }}>
              <span style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                color: statusColor,
                background: `${statusColor}22`,
                textTransform: "capitalize",
              }}>
                {e.status}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES & UTILS
// ─────────────────────────────────────────────────────────────────────────────
const tableHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 24px",
  borderBottom: "1px solid #1e293b",
  position: "sticky",
  top: 0,
  background: "#070c14",
  zIndex: 10,
}

const colStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#334155",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  flexShrink: 0,
}

const navBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 6,
  border: "1px solid #1e293b",
  background: "transparent",
  color: "#64748b",
  cursor: "pointer",
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: 200,
      gap: 8,
      color: "#334155",
    }}>
      <CalendarDays size={28} />
      <span style={{ fontSize: 14 }}>{message}</span>
    </div>
  )
}
