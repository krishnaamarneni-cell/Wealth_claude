"use client"

import { useEffect, useRef, useState } from "react"
import { Globe2, BarChart3, CalendarDays } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
type MetricKey = "inflation" | "gdpGrowth" | "gdp" | "unemployment" | "debtToGdp"

interface MacroData {
  inflation: Record<string, number>
  gdpGrowth: Record<string, number>
  gdp: Record<string, number>
  unemployment: Record<string, number>
  debtToGdp: Record<string, number>
}

// ── Config ────────────────────────────────────────────────────────────────────
const METRICS: { key: MetricKey; label: string; shortLabel: string; desc: string }[] = [
  { key: "inflation", label: "Inflation Rate", shortLabel: "Inflation", desc: "Consumer Price Index YoY change" },
  { key: "gdpGrowth", label: "GDP Growth", shortLabel: "GDP Growth", desc: "Annual real GDP growth rate" },
  { key: "gdp", label: "GDP", shortLabel: "GDP", desc: "Gross Domestic Product in USD" },
  { key: "unemployment", label: "Unemployment Rate", shortLabel: "Unemployment", desc: "% of labor force unemployed" },
  { key: "debtToGdp", label: "Govt Debt / GDP", shortLabel: "Debt/GDP", desc: "Central government debt as % of GDP" },
]

const MAJOR_ECONOMIES = [
  { iso3: "USA", name: "United States", flag: "🇺🇸" },
  { iso3: "CHN", name: "China", flag: "🇨🇳" },
  { iso3: "JPN", name: "Japan", flag: "🇯🇵" },
  { iso3: "DEU", name: "Germany", flag: "🇩🇪" },
  { iso3: "IND", name: "India", flag: "🇮🇳" },
  { iso3: "GBR", name: "United Kingdom", flag: "🇬🇧" },
  { iso3: "FRA", name: "France", flag: "🇫🇷" },
  { iso3: "ITA", name: "Italy", flag: "🇮🇹" },
  { iso3: "CAN", name: "Canada", flag: "🇨🇦" },
  { iso3: "KOR", name: "South Korea", flag: "🇰🇷" },
  { iso3: "RUS", name: "Russia", flag: "🇷🇺" },
  { iso3: "BRA", name: "Brazil", flag: "🇧🇷" },
  { iso3: "AUS", name: "Australia", flag: "🇦🇺" },
  { iso3: "MEX", name: "Mexico", flag: "🇲🇽" },
  { iso3: "IDN", name: "Indonesia", flag: "🇮🇩" },
  { iso3: "NLD", name: "Netherlands", flag: "🇳🇱" },
  { iso3: "SAU", name: "Saudi Arabia", flag: "🇸🇦" },
  { iso3: "TUR", name: "Turkey", flag: "🇹🇷" },
  { iso3: "CHE", name: "Switzerland", flag: "🇨🇭" },
  { iso3: "ZAF", name: "South Africa", flag: "🇿🇦" },
]

const LEGENDS: Record<MetricKey, { label: string; color: string }[]> = {
  inflation: [
    { label: "Deflation", color: "#3b82f6" },
    { label: "0 – 2%", color: "#22c55e" },
    { label: "2 – 5%", color: "#84cc16" },
    { label: "5 – 8%", color: "#f59e0b" },
    { label: "8 – 15%", color: "#ef4444" },
    { label: "> 15%", color: "#991b1b" },
  ],
  gdpGrowth: [
    { label: "< -2%", color: "#991b1b" },
    { label: "-2 – 0%", color: "#ef4444" },
    { label: "0 – 1%", color: "#f59e0b" },
    { label: "1 – 3%", color: "#84cc16" },
    { label: "3 – 5%", color: "#22c55e" },
    { label: "> 5%", color: "#16a34a" },
  ],
  gdp: [
    { label: "< $100B", color: "#1e3a5f" },
    { label: "$100–300B", color: "#1d4f8a" },
    { label: "$300B–1T", color: "#1565c0" },
    { label: "$1 – 3T", color: "#4ade80" },
    { label: "$3 – 8T", color: "#22c55e" },
    { label: "> $8T", color: "#16a34a" },
  ],
  unemployment: [
    { label: "< 3%", color: "#16a34a" },
    { label: "3 – 5%", color: "#22c55e" },
    { label: "5 – 7%", color: "#84cc16" },
    { label: "7 – 10%", color: "#f59e0b" },
    { label: "10 – 15%", color: "#ef4444" },
    { label: "> 15%", color: "#991b1b" },
  ],
  debtToGdp: [
    { label: "< 30%", color: "#16a34a" },
    { label: "30 – 60%", color: "#22c55e" },
    { label: "60 – 90%", color: "#84cc16" },
    { label: "90–120%", color: "#f59e0b" },
    { label: "120–150%", color: "#ef4444" },
    { label: "> 150%", color: "#991b1b" },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function metricColor(metric: MetricKey, value: number | undefined | null): string {
  if (value == null) return "#162030"
  switch (metric) {
    case "inflation":
      if (value < 0) return "#3b82f6"
      if (value < 2) return "#22c55e"
      if (value < 5) return "#84cc16"
      if (value < 8) return "#f59e0b"
      if (value < 15) return "#ef4444"
      return "#991b1b"
    case "gdpGrowth":
      if (value < -2) return "#991b1b"
      if (value < 0) return "#ef4444"
      if (value < 1) return "#f59e0b"
      if (value < 3) return "#84cc16"
      if (value < 5) return "#22c55e"
      return "#16a34a"
    case "gdp": {
      const t = value / 1e12
      if (t < 0.1) return "#1e3a5f"
      if (t < 0.3) return "#1d4f8a"
      if (t < 1) return "#1565c0"
      if (t < 3) return "#4ade80"
      if (t < 8) return "#22c55e"
      return "#16a34a"
    }
    case "unemployment":
      if (value < 3) return "#16a34a"
      if (value < 5) return "#22c55e"
      if (value < 7) return "#84cc16"
      if (value < 10) return "#f59e0b"
      if (value < 15) return "#ef4444"
      return "#991b1b"
    case "debtToGdp":
      if (value < 30) return "#16a34a"
      if (value < 60) return "#22c55e"
      if (value < 90) return "#84cc16"
      if (value < 120) return "#f59e0b"
      if (value < 150) return "#ef4444"
      return "#991b1b"
    default: return "#162030"
  }
}

function formatValue(metric: MetricKey, value: number | undefined | null): string {
  if (value == null) return "N/A"
  if (metric === "gdp") {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
    return `$${value.toFixed(0)}`
  }
  return `${value.toFixed(1)}%`
}

function cellBg(metric: MetricKey, value: number | undefined | null): string {
  if (value == null) return "transparent"
  return metricColor(metric, value) + "28" // 16% opacity
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MacroMapWrapper() {
  const [activeTab, setActiveTab] = useState<"map" | "table" | "calendar">("map")
  const [metric, setMetric] = useState<MetricKey>("inflation")
  const [data, setData] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tvLoaded, setTvLoaded] = useState(false)

  // Refs — so Leaflet closures always read current values
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoLayerRef = useRef<any>(null)
  const metricRef = useRef<MetricKey>("inflation")
  const dataRef = useRef<MacroData | null>(null)

  // Keep refs in sync
  useEffect(() => { metricRef.current = metric }, [metric])
  useEffect(() => { dataRef.current = data }, [data])

  // Fetch macro data
  useEffect(() => {
    fetch("/api/macro-data")
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Init Leaflet map once data is ready
  useEffect(() => {
    if (loading || !data || mapRef.current || !mapContainerRef.current) return
    initMap()
  }, [loading, data])

  // Update GeoJSON colors when metric changes
  useEffect(() => {
    if (!geoLayerRef.current || !data) return
    geoLayerRef.current.setStyle((feature: any) => styleFeature(feature))
  }, [metric, data])

  // Invalidate map size when switching back to map tab
  useEffect(() => {
    if (activeTab === "map" && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 50)
    }
  }, [activeTab])

  // TradingView calendar embed
  useEffect(() => {
    if (activeTab !== "calendar" || tvLoaded) return
    const el = document.getElementById("tv-macro-calendar")
    if (!el) return
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js"
    script.async = true
    script.textContent = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "650",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "ar,au,br,ca,cn,de,fr,gb,in,id,it,jp,kr,mx,ru,sa,tr,us,eu,za,sg,ch,pl",
    })
    el.appendChild(script)
    setTvLoaded(true)
  }, [activeTab, tvLoaded])

  // ── Style function — reads from refs so always current ──
  function styleFeature(feature: any) {
    const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
    const value = dataRef.current?.[metricRef.current]?.[iso]
    return {
      fillColor: metricColor(metricRef.current, value),
      fillOpacity: value != null ? 0.78 : 0.15,
      color: "rgba(255,255,255,0.07)",
      weight: 0.5,
    }
  }

  // ── Init Leaflet ──
  async function initMap() {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return

    // Load CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // Load JS
    if (!(window as any).L) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script")
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        s.onload = () => res()
        s.onerror = () => rej()
        document.head.appendChild(s)
      })
    }

    const L = (window as any).L
    if (!L || !mapContainerRef.current || mapRef.current) return

    // Override default Leaflet light tooltips
    const style = document.createElement("style")
    style.textContent = `
      .macro-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
      .macro-tooltip::before { display: none !important; }
      .leaflet-container { background: #060a10 !important; }
    `
    document.head.appendChild(style)

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 6,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true,
      maxBounds: [[-85, -Infinity], [85, Infinity]],
    })

    mapRef.current = map

    // Dark tile base with labels
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", zIndex: 10 }
    ).addTo(map)

    // Load GeoJSON
    let geoData: any
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
      )
      geoData = await res.json()
    } catch { return }

    const geoLayer = L.geoJSON(geoData, {
      style: styleFeature,
      onEachFeature: (feature: any, layer: any) => {
        const name = feature.properties?.NAME ?? feature.properties?.ADMIN ?? ""

        layer.on({
          mouseover: (e: any) => {
            layer.setStyle({ weight: 1.5, color: "#4ade80", fillOpacity: 0.92 })
          },
          mouseout: () => {
            geoLayer.resetStyle(layer)
          },
        })

        layer.bindTooltip(() => {
          const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
          const m = metricRef.current
          const value = dataRef.current?.[m]?.[iso]
          const mConf = METRICS.find(x => x.key === m)!
          const color = metricColor(m, value)
          return `
            <div style="
              background: #0d1320;
              border: 1px solid ${color}55;
              border-radius: 10px;
              padding: 10px 14px;
              font-family: -apple-system, sans-serif;
              min-width: 140px;
            ">
              <div style="font-weight:700;color:#f1f5f9;font-size:13px;margin-bottom:4px">${name}</div>
              <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">${mConf.label}</div>
              <div style="font-size:20px;font-weight:800;color:${color};margin-top:2px">${formatValue(m, value)}</div>
            </div>
          `
        }, { sticky: true, className: "macro-tooltip", offset: [12, 0] })
      },
    })

    geoLayer.addTo(map)
    geoLayerRef.current = geoLayer
  }

  const metricConf = METRICS.find(m => m.key === metric)!

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

      {/* ── Sticky controls bar ── */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">

          {/* Row 1: title + metric pills */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg font-bold text-foreground">Macro Map</h1>
              <p className="text-xs text-muted-foreground">{metricConf.desc} · World Bank Open Data</p>
            </div>

            {/* Metric selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${metric === m.key
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                >
                  {m.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: tabs */}
          <div className="flex gap-0">
            {([
              { key: "map", label: "World Map", Icon: Globe2 },
              { key: "table", label: "Country Comparison", Icon: BarChart3 },
              { key: "calendar", label: "Economic Calendar", Icon: CalendarDays },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
              >
                <tab.Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB: MAP ── (always mounted, hidden when not active) */}
      <div
        className="relative flex-1"
        style={{ display: activeTab === "map" ? "block" : "none" }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading World Bank data…</span>
            </div>
          </div>
        )}

        {/* Leaflet container */}
        <div
          ref={mapContainerRef}
          style={{ height: "calc(100vh - 196px)", width: "100%", background: "#060a10" }}
        />

        {/* Legend */}
        {!loading && (
          <div className="absolute bottom-5 left-4 z-[1000] bg-background/90 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-2.5 uppercase">
              {metricConf.label}
            </p>
            <div className="space-y-1.5">
              {LEGENDS[metric].map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="w-4 h-3 rounded shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-border">
                <div className="w-4 h-3 rounded shrink-0" style={{ background: "#162030" }} />
                <span className="text-xs text-muted-foreground">No data</span>
              </div>
            </div>
          </div>
        )}

        {/* Data year note */}
        {!loading && (
          <div className="absolute bottom-5 right-4 z-[1000]">
            <div className="text-[10px] text-muted-foreground/60 bg-background/70 px-2 py-1 rounded">
              World Bank · Most recent available year
            </div>
          </div>
        )}
      </div>

      {/* ── TAB: TABLE ── */}
      {activeTab === "table" && (
        <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground tracking-wider whitespace-nowrap">
                      COUNTRY
                    </th>
                    {METRICS.map(m => (
                      <th
                        key={m.key}
                        onClick={() => setMetric(m.key)}
                        className={`text-right px-4 py-3.5 text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap transition-colors ${metric === m.key
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {m.label.toUpperCase()}
                        {metric === m.key && (
                          <span className="ml-1 inline-block w-1 h-1 rounded-full bg-primary align-middle" />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MAJOR_ECONOMIES.map((country, i) => (
                    <tr
                      key={country.iso3}
                      className={`border-b border-border/40 hover:bg-secondary/20 transition-colors ${i % 2 === 1 ? "bg-secondary/8" : ""
                        }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl leading-none">{country.flag}</span>
                          <span className="font-semibold text-foreground whitespace-nowrap">{country.name}</span>
                        </div>
                      </td>
                      {METRICS.map(m => {
                        const value = data?.[m.key]?.[country.iso3]
                        return (
                          <td key={m.key} className="px-4 py-3 text-right">
                            {loading ? (
                              <div className="h-5 bg-secondary/50 rounded animate-pulse ml-auto w-14" />
                            ) : (
                              <span
                                className="inline-block px-2.5 py-1 rounded-md text-xs font-bold tabular-nums"
                                style={{
                                  background: cellBg(m.key, value),
                                  color: metricColor(m.key, value),
                                  border: metric === m.key ? `1px solid ${metricColor(m.key, value)}40` : "1px solid transparent",
                                }}
                              >
                                {formatValue(m.key, value)}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-border bg-secondary/10 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted-foreground">
                Source: World Bank Open Data · Most recent available year per country · Click any column header to update the map
              </p>
              <div className="flex gap-3 flex-wrap">
                {LEGENDS[metric].slice(0, 4).map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CALENDAR ── */}
      {activeTab === "calendar" && (
        <div className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
          <div className="rounded-2xl border border-border overflow-hidden bg-background/30">
            <div id="tv-macro-calendar" className="tradingview-widget-container" style={{ minHeight: "660px" }}>
              <div className="tradingview-widget-container__widget" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Economic calendar powered by TradingView · Real-time earnings, IPO, and macro event data
          </p>
        </div>
      )}
    </div>
  )
}
