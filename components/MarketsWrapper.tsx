"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { Loader2, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from "lucide-react"
import { MarketsMap, returnsToCountryData, SYMBOL_TO_ISO } from "./MarketsMap"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = "sectors" | "countries" | "assets"
type SortCol = "r1y" | "r3y" | "r5y"

interface ReturnRow {
  symbol: string
  safeKey: string
  label: string
  region?: string | null
  r1y: number | null
  r3y: number | null
  r5y: number | null
}

interface ComparisonData {
  chartData: Record<string, number | string>[]
  returns: ReturnRow[]
  items: { symbol: string; safeKey: string; label: string; region?: string | null }[]
}

interface RegionGroup {
  name: string
  avgReturn: number
  countries: ReturnRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────────────────────
const SERIES_COLORS = [
  "#00e676", "#00b0ff", "#ff6d00", "#e040fb", "#ffea00",
  "#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#fb923c",
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtPct(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

function returnCellColor(v: number | null): { bg: string; text: string } {
  if (v == null) return { bg: "transparent", text: "#334155" }
  if (v >= 30) return { bg: "rgba(0,230,118,0.22)", text: "#4ade80" }
  if (v >= 15) return { bg: "rgba(0,230,118,0.13)", text: "#86efac" }
  if (v >= 5) return { bg: "rgba(0,230,118,0.07)", text: "#a7f3d0" }
  if (v >= 0) return { bg: "rgba(0,230,118,0.03)", text: "#6ee7b7" }
  if (v >= -10) return { bg: "rgba(248,113,113,0.08)", text: "#fca5a5" }
  return { bg: "rgba(248,113,113,0.18)", text: "#f87171" }
}

function fmtChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
}

/** Group countries by region and sort by average return */
function groupByRegion(returns: ReturnRow[], sortCol: SortCol): RegionGroup[] {
  const regionMap: Record<string, ReturnRow[]> = {}

  for (const row of returns) {
    const region = row.region ?? "Other"
    if (!regionMap[region]) regionMap[region] = []
    regionMap[region].push(row)
  }

  const groups: RegionGroup[] = []

  for (const [name, countries] of Object.entries(regionMap)) {
    // Calculate average return for this region
    const validReturns = countries
      .map(c => c[sortCol])
      .filter((v): v is number => v != null)

    const avgReturn = validReturns.length > 0
      ? validReturns.reduce((a, b) => a + b, 0) / validReturns.length
      : -Infinity

    // Sort countries within region by return (highest first)
    const sortedCountries = [...countries].sort((a, b) =>
      (b[sortCol] ?? -Infinity) - (a[sortCol] ?? -Infinity)
    )

    groups.push({ name, avgReturn, countries: sortedCountries })
  }

  // Sort regions by average return (highest first)
  groups.sort((a, b) => b.avgReturn - a.avgReturn)

  return groups
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM STATS
// ─────────────────────────────────────────────────────────────────────────────
function BottomStats({ returns, col, tab }: { returns: ReturnRow[]; col: SortCol; tab: TabKey }) {
  const values = returns.map(r => r[col]).filter((v): v is number => v != null)
  if (values.length === 0) return null

  const best = returns.reduce((a, b) => ((b[col] ?? -Infinity) > (a[col] ?? -Infinity) ? b : a))
  const worst = returns.reduce((a, b) => ((b[col] ?? Infinity) < (a[col] ?? Infinity) ? b : a))
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const pos = values.filter(v => v >= 0).length
  const neg = values.length - pos

  const colLabel = col === "r1y" ? "1Y" : col === "r3y" ? "3Y" : "5Y"

  const tabInfo: Record<TabKey, string> = {
    sectors: "SPDR ETF sector data via Yahoo Finance. Returns based on weekly closes.",
    countries: "Major global index data via Yahoo Finance. Returns based on weekly closes.",
    assets: "ETF proxies via Yahoo Finance. Returns based on weekly closes.",
  }

  return (
    <div style={{
      borderTop: "1px solid #1e293b",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      gap: 28,
      flexShrink: 0,
      background: "#070c14",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TrendingUp size={13} color="#4ade80" />
        <span style={{ fontSize: 11, color: "#475569" }}>Best {colLabel}:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{best.label}</span>
        <span style={{ fontSize: 12, color: "#4ade80" }}>{fmtPct(best[col])}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TrendingDown size={13} color="#f87171" />
        <span style={{ fontSize: 11, color: "#475569" }}>Worst {colLabel}:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171" }}>{worst.label}</span>
        <span style={{ fontSize: 12, color: "#f87171" }}>{fmtPct(worst[col])}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Minus size={13} color="#64748b" />
        <span style={{ fontSize: 11, color: "#475569" }}>Avg {colLabel}:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: avg >= 0 ? "#86efac" : "#fca5a5" }}>
          {fmtPct(avg)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: "#475569" }}>Positive:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>{pos}</span>
        <span style={{ fontSize: 11, color: "#334155" }}>/</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>{neg}</span>
        <span style={{ fontSize: 11, color: "#475569" }}>negative</span>
      </div>

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 10, color: "#1e293b", maxWidth: 340, textAlign: "right" }}>
        {tabInfo[tab]}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, labelMap }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  labelMap: Record<string, string>
}) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  return (
    <div style={{
      background: "#0d1825", border: "1px solid #1e293b", borderRadius: 8,
      padding: "10px 14px", fontSize: 12, maxHeight: 280, overflowY: "auto", minWidth: 170,
    }}>
      <div style={{ color: "#475569", marginBottom: 6, fontWeight: 600 }}>
        {fmtChartDate(label ?? "")}
      </div>
      {sorted.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{labelMap[p.name] ?? p.name}</span>
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REGION SECTION (collapsible)
// ─────────────────────────────────────────────────────────────────────────────
function RegionSection({
  region,
  sortCol,
  selectedCountry,
  onCountrySelect,
  expanded,
  onToggle,
}: {
  region: RegionGroup
  sortCol: SortCol
  selectedCountry: string | null
  onCountrySelect: (iso: string | null) => void
  expanded: boolean
  onToggle: () => void
}) {
  const avgColor = region.avgReturn >= 0 ? "#4ade80" : "#f87171"

  return (
    <div>
      {/* Region Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "#0a0f16",
          border: "none",
          borderBottom: "1px solid #1e293b",
          cursor: "pointer",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#0d1219"}
        onMouseLeave={e => e.currentTarget.style.background = "#0a0f16"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {expanded ? (
            <ChevronDown size={16} color="#64748b" />
          ) : (
            <ChevronRight size={16} color="#64748b" />
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
            {region.name}
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>
            ({region.countries.length})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#475569" }}>Avg:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: avgColor }}>
            {fmtPct(region.avgReturn)}
          </span>
        </div>
      </button>

      {/* Countries List */}
      {expanded && (
        <div>
          {region.countries.map((row) => {
            const iso = SYMBOL_TO_ISO[row.symbol]
            const isSelected = iso === selectedCountry

            return (
              <div
                key={row.symbol}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px 80px",
                  padding: "10px 24px 10px 44px",
                  borderBottom: "1px solid #0a1018",
                  alignItems: "center",
                  transition: "background 0.1s",
                  background: isSelected ? "rgba(0,230,118,0.08)" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (iso) onCountrySelect(iso === selectedCountry ? null : iso)
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = "#0a1018"
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = "transparent"
                }}
              >
                <span style={{
                  fontSize: 13,
                  color: isSelected ? "#00e676" : "#e2e8f0",
                  fontWeight: isSelected ? 600 : 400,
                }}>
                  {row.label}
                </span>
                {(["r1y", "r3y", "r5y"] as const).map(col => {
                  const v = row[col]
                  const { bg, text } = returnCellColor(v)
                  return (
                    <div key={col} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 5,
                        background: bg,
                        color: text,
                        fontSize: 12,
                        fontWeight: 600,
                        minWidth: 64,
                        textAlign: "center",
                      }}>
                        {fmtPct(v)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string }[] = [
  { key: "countries", label: "Countries" },
  { key: "assets", label: "Asset Classes" },
  { key: "sectors", label: "Sectors" },
]

const TABLE_TITLE: Record<TabKey, string> = {
  sectors: "Sector Performance",
  countries: "Global Markets",
  assets: "Asset Class Performance",
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function MarketsWrapper() {
  const [tab, setTab] = useState<TabKey>("countries")
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState<SortCol>("r1y")
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async (t: TabKey) => {
    setLoading(true)
    setData(null)
    try {
      const res = await fetch(`/api/markets-comparison?tab=${t}`)
      const json = await res.json()
      setData(json)

      // Auto-expand all regions on load
      if (t === "countries" && json.returns) {
        const regions = new Set(json.returns.map((r: ReturnRow) => r.region ?? "Other"))
        setExpandedRegions(regions as Set<string>)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData("countries") }, []) // eslint-disable-line

  function switchTab(t: TabKey) {
    setTab(t)
    setSelectedCountry(null)
    setExpandedRegions(new Set())
    fetchData(t)
  }

  const toggleRegion = (regionName: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev)
      if (next.has(regionName)) {
        next.delete(regionName)
      } else {
        next.add(regionName)
      }
      return next
    })
  }

  // Group and sort regions (recalculates when sortCol changes)
  const regionGroups = useMemo(() => {
    if (!data || tab !== "countries") return []
    return groupByRegion(data.returns, sortCol)
  }, [data, sortCol, tab])

  // Flat sorted list for non-countries tabs
  const sorted = data
    ? [...data.returns].sort((a, b) => ((b[sortCol] ?? -999) - (a[sortCol] ?? -999)))
    : []

  const chartData = data?.chartData ?? []
  const tickStep = Math.max(1, Math.floor(chartData.length / 6))
  const xTicks = chartData.filter((_, i) => i % tickStep === 0).map(d => d.date as string)

  const labelMap: Record<string, string> = {}
  data?.items.forEach(item => { labelMap[item.safeKey] = item.label })

  const countryData = data ? returnsToCountryData(data.returns, sortCol) : []
  const periodLabel = sortCol === "r1y" ? "1 Year" : sortCol === "r3y" ? "3 Year" : "5 Year"

  return (
    <div style={{
      height: "calc(100dvh - 64px)", // Account for header (pt-16 = 64px)
      background: "#060a10",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      color: "#e2e8f0",
      overflow: "hidden",
    }}>

      {/* ── TOP TABS ── */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        padding: "14px 24px",
        borderBottom: "1px solid #1e293b",
        flexShrink: 0,
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            padding: "7px 22px", borderRadius: 99,
            border: tab === t.key ? "1px solid #00e676" : "1px solid #1e293b",
            background: tab === t.key ? "rgba(0,230,118,0.1)" : "transparent",
            color: tab === t.key ? "#00e676" : "#64748b",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
        <button style={{
          padding: "7px 22px", borderRadius: 99,
          border: "1px solid #1e293b", background: "transparent",
          color: "#334155", fontSize: 13, fontWeight: 600, cursor: "not-allowed",
        }}>
          Watchlist
        </button>
      </div>

      {/* ── MAIN BODY ── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#334155" }}>
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Loading market data…</span>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden", minWidth: 0 }}>

            {/* ══ LEFT — MAP or CHART ══ */}
            <div style={{
              flex: "0 0 56%",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid #1e293b",
              overflow: "hidden",
              position: "relative",
            }}>
              {tab === "countries" ? (
                <MarketsMap
                  countries={countryData}
                  selectedCountry={selectedCountry}
                  onCountrySelect={setSelectedCountry}
                  periodLabel={periodLabel}
                />
              ) : (
                <div style={{ padding: "20px 20px 12px 16px", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ fontSize: 11, color: "#334155", marginBottom: 6, letterSpacing: "0.04em" }}>
                    NORMALIZED TO 100 — 5 YEAR PERFORMANCE
                  </div>
                  <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                        <XAxis
                          dataKey="date"
                          ticks={xTicks}
                          tickFormatter={fmtChartDate}
                          tick={{ fill: "#334155", fontSize: 11 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#334155", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={v => `$${v}`}
                          width={44}
                        />
                        <Tooltip content={<ChartTooltip labelMap={labelMap} />} />
                        <Legend
                          wrapperStyle={{ fontSize: 11, color: "#475569", paddingTop: 6 }}
                          iconType="plainline"
                          iconSize={18}
                          formatter={value => labelMap[value] ?? value}
                        />
                        {data?.items.map((item, i) => (
                          <Line
                            key={item.safeKey}
                            type="monotone"
                            dataKey={item.safeKey}
                            name={item.safeKey}
                            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* ══ RIGHT — TABLE ══ */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              <div style={{ padding: "20px 24px 12px" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                  {TABLE_TITLE[tab]}
                </h2>
              </div>

              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: tab === "countries" ? "1fr 80px 80px 80px" : "1fr 90px 90px 90px",
                padding: "8px 24px",
                paddingLeft: tab === "countries" ? "44px" : "24px",
                borderBottom: "1px solid #1e293b",
                position: "sticky", top: 0,
                background: "#070c14", zIndex: 5,
              }}>
                <span style={thStyle}>{tab === "countries" ? "Country" : "Name"}</span>
                {(["r1y", "r3y", "r5y"] as const).map(col => (
                  <button key={col} onClick={() => setSortCol(col)} style={{
                    ...thStyle, textAlign: "right",
                    background: "none", border: "none", cursor: "pointer",
                    color: sortCol === col ? "#00e676" : "#334155",
                    padding: 0,
                    textDecoration: sortCol === col ? "underline" : "none",
                    textUnderlineOffset: 3,
                  }}>
                    {col === "r1y" ? "1Y" : col === "r3y" ? "3Y" : "5Y"}
                  </button>
                ))}
              </div>

              {/* Countries Tab — Grouped by Region */}
              {tab === "countries" ? (
                <div>
                  {regionGroups.map(region => (
                    <RegionSection
                      key={region.name}
                      region={region}
                      sortCol={sortCol}
                      selectedCountry={selectedCountry}
                      onCountrySelect={setSelectedCountry}
                      expanded={expandedRegions.has(region.name)}
                      onToggle={() => toggleRegion(region.name)}
                    />
                  ))}
                </div>
              ) : (
                /* Other Tabs — Flat List */
                sorted.map((row, i) => {
                  const colorIdx = data?.items.findIndex(it => it.symbol === row.symbol) ?? i
                  return (
                    <div
                      key={row.symbol}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 90px 90px 90px",
                        padding: "11px 24px",
                        borderBottom: "1px solid #0a1018",
                        alignItems: "center",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#0a1018"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: SERIES_COLORS[colorIdx % SERIES_COLORS.length],
                        }} />
                        <span style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500 }}>
                          {row.label}
                        </span>
                      </div>
                      {(["r1y", "r3y", "r5y"] as const).map(col => {
                        const v = row[col]
                        const { bg, text } = returnCellColor(v)
                        return (
                          <div key={col} style={{ display: "flex", justifyContent: "flex-end" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "4px 10px", borderRadius: 6,
                              background: bg, color: text,
                              fontSize: 13, fontWeight: 600,
                              minWidth: 72, textAlign: "center",
                            }}>
                              {fmtPct(v)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ══ BOTTOM STATS BAR ══ */}
          {data && <BottomStats returns={data.returns} col={sortCol} tab={tab} />}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: #060a10 }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px }
      `}</style>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#334155",
  letterSpacing: "0.08em", textTransform: "uppercase",
}
