"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Globe2, BarChart3, CalendarDays } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type MetricKey = "inflation" | "gdpGrowth" | "gdp" | "unemployment" | "debtToGdp"
type TabKey = "map" | "table" | "calendar"

interface MacroData {
  inflation: Record<string, number>
  gdpGrowth: Record<string, number>
  gdp: Record<string, number>
  unemployment: Record<string, number>
  debtToGdp: Record<string, number>
}

// ─────────────────────────────────────────────────────────────────────────────
// METRICS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const METRICS: { key: MetricKey; label: string; desc: string }[] = [
  { key: "inflation", label: "Inflation Rate", desc: "Consumer Price Index YoY" },
  { key: "gdpGrowth", label: "GDP Growth", desc: "Annual real GDP growth rate" },
  { key: "gdp", label: "GDP", desc: "Gross Domestic Product (USD)" },
  { key: "unemployment", label: "Unemployment Rate", desc: "% of total labor force" },
  { key: "debtToGdp", label: "Govt Debt / GDP", desc: "Central govt debt as % of GDP" },
]

// ─────────────────────────────────────────────────────────────────────────────
// COLOR SCALE — one unique color per metric, light → dark
// Inflation    : light amber  → deep orange-brown
// GDP Growth   : light green  → dark forest green
// GDP          : light sky    → deep navy blue
// Unemployment : light yellow → dark red-orange
// Debt/GDP     : light purple → deep violet
// ─────────────────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(1, Math.max(0, t)) }

function lerpHex(from: string, to: string, t: number): string {
  const h = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = h(from)
  const [r2, g2, b2] = h(to)
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`
}

const COLOR_SCALES: Record<MetricKey, { light: string; dark: string; maxVal: number; logScale?: boolean }> = {
  inflation: { light: "#3d1f00", dark: "#ff8c00", maxVal: 20 }, // dark → vivid orange
  gdpGrowth: { light: "#002a10", dark: "#00e676", maxVal: 10 }, // dark → neon green
  gdp: { light: "#002233", dark: "#00e5ff", maxVal: 1, logScale: true }, // dark → cyan
  unemployment: { light: "#2a1500", dark: "#ff6f00", maxVal: 25 }, // dark → amber
  debtToGdp: { light: "#1a0030", dark: "#ce93d8", maxVal: 200 }, // dark → lavender
}

const NO_DATA = "#0d1825"

function metricColor(metric: MetricKey, value: number | null | undefined): string {
  if (value == null) return NO_DATA
  const scale = COLOR_SCALES[metric]
  let t: number
  if (scale.logScale) {
    // GDP: log scale $1B → $25T
    const logMin = Math.log10(1e9)
    const logMax = Math.log10(25e12)
    t = (Math.log10(Math.max(value, 1e9)) - logMin) / (logMax - logMin)
  } else {
    t = value / scale.maxVal
    // For GDP growth allow negative (clamp 0 so negatives stay at lightest end)
    if (metric === "gdpGrowth" && value < 0) t = 0
  }
  return lerpHex(scale.light, scale.dark, t)
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT
// ─────────────────────────────────────────────────────────────────────────────
function fmt(metric: MetricKey, value: number | null | undefined): string {
  if (value == null) return "N/A"
  if (metric === "gdp") {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    return `$${(value / 1e6).toFixed(0)}M`
  }
  return `${value.toFixed(1)}%`
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY NAMES
// ─────────────────────────────────────────────────────────────────────────────
const NAMES: Record<string, string> = {
  AFG: "Afghanistan", ALB: "Albania", DZA: "Algeria", AGO: "Angola", ARG: "Argentina",
  ARM: "Armenia", AUS: "Australia", AUT: "Austria", AZE: "Azerbaijan", BHS: "Bahamas",
  BHR: "Bahrain", BGD: "Bangladesh", BLR: "Belarus", BEL: "Belgium", BLZ: "Belize",
  BEN: "Benin", BTN: "Bhutan", BOL: "Bolivia", BIH: "Bosnia", BWA: "Botswana",
  BRA: "Brazil", BRN: "Brunei", BGR: "Bulgaria", BFA: "Burkina Faso", BDI: "Burundi",
  CPV: "Cape Verde", KHM: "Cambodia", CMR: "Cameroon", CAN: "Canada", CAF: "C. African Rep.",
  TCD: "Chad", CHL: "Chile", CHN: "China", COL: "Colombia", COM: "Comoros", COD: "Congo DR",
  COG: "Congo", CRI: "Costa Rica", CIV: "Côte d'Ivoire", HRV: "Croatia", CUB: "Cuba",
  CYP: "Cyprus", CZE: "Czech Rep.", DNK: "Denmark", DJI: "Djibouti", DOM: "Dominican Rep.",
  ECU: "Ecuador", EGY: "Egypt", SLV: "El Salvador", GNQ: "Eq. Guinea", EST: "Estonia",
  ETH: "Ethiopia", FJI: "Fiji", FIN: "Finland", FRA: "France", GAB: "Gabon",
  GMB: "Gambia", GEO: "Georgia", DEU: "Germany", GHA: "Ghana", GRC: "Greece",
  GTM: "Guatemala", GIN: "Guinea", GNB: "Guinea-Bissau", GUY: "Guyana", HTI: "Haiti",
  HND: "Honduras", HUN: "Hungary", ISL: "Iceland", IND: "India", IDN: "Indonesia",
  IRN: "Iran", IRQ: "Iraq", IRL: "Ireland", ISR: "Israel", ITA: "Italy",
  JAM: "Jamaica", JPN: "Japan", JOR: "Jordan", KAZ: "Kazakhstan", KEN: "Kenya",
  KOR: "South Korea", KWT: "Kuwait", KGZ: "Kyrgyzstan", LAO: "Laos", LVA: "Latvia",
  LBN: "Lebanon", LBR: "Liberia", LBY: "Libya", LTU: "Lithuania", LUX: "Luxembourg",
  MDG: "Madagascar", MWI: "Malawi", MYS: "Malaysia", MDV: "Maldives", MLI: "Mali",
  MLT: "Malta", MRT: "Mauritania", MUS: "Mauritius", MEX: "Mexico", MDA: "Moldova",
  MNG: "Mongolia", MNE: "Montenegro", MAR: "Morocco", MOZ: "Mozambique", MMR: "Myanmar",
  NAM: "Namibia", NPL: "Nepal", NLD: "Netherlands", NZL: "New Zealand", NIC: "Nicaragua",
  NER: "Niger", NGA: "Nigeria", MKD: "N. Macedonia", NOR: "Norway", OMN: "Oman",
  PAK: "Pakistan", PAN: "Panama", PNG: "Papua New Guinea", PRY: "Paraguay", PER: "Peru",
  PHL: "Philippines", POL: "Poland", PRT: "Portugal", QAT: "Qatar", ROU: "Romania",
  RUS: "Russia", RWA: "Rwanda", SAU: "Saudi Arabia", SEN: "Senegal", SRB: "Serbia",
  SLE: "Sierra Leone", SGP: "Singapore", SVK: "Slovakia", SVN: "Slovenia", SOM: "Somalia",
  ZAF: "South Africa", SSD: "South Sudan", ESP: "Spain", LKA: "Sri Lanka", SDN: "Sudan",
  SUR: "Suriname", SWE: "Sweden", CHE: "Switzerland", SYR: "Syria", TWN: "Taiwan",
  TJK: "Tajikistan", TZA: "Tanzania", THA: "Thailand", TGO: "Togo",
  TTO: "Trinidad & Tobago", TUN: "Tunisia", TUR: "Turkey", TKM: "Turkmenistan",
  UGA: "Uganda", UKR: "Ukraine", ARE: "UAE", GBR: "United Kingdom", USA: "United States",
  URY: "Uruguay", UZB: "Uzbekistan", VEN: "Venezuela", VNM: "Vietnam", YEM: "Yemen",
  ZMB: "Zambia", ZWE: "Zimbabwe",
}

// Table rows
const TABLE_ROWS = [
  { iso: "USA", flag: "🇺🇸" }, { iso: "CHN", flag: "🇨🇳" }, { iso: "JPN", flag: "🇯🇵" },
  { iso: "DEU", flag: "🇩🇪" }, { iso: "IND", flag: "🇮🇳" }, { iso: "GBR", flag: "🇬🇧" },
  { iso: "FRA", flag: "🇫🇷" }, { iso: "ITA", flag: "🇮🇹" }, { iso: "BRA", flag: "🇧🇷" },
  { iso: "CAN", flag: "🇨🇦" }, { iso: "RUS", flag: "🇷🇺" }, { iso: "KOR", flag: "🇰🇷" },
  { iso: "AUS", flag: "🇦🇺" }, { iso: "MEX", flag: "🇲🇽" }, { iso: "IDN", flag: "🇮🇩" },
  { iso: "NLD", flag: "🇳🇱" }, { iso: "SAU", flag: "🇸🇦" }, { iso: "TUR", flag: "🇹🇷" },
  { iso: "CHE", flag: "🇨🇭" }, { iso: "ZAF", flag: "🇿🇦" },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function MacroMapWrapper() {
  const [tab, setTab] = useState<TabKey>("map")
  const [metric, setMetric] = useState<MetricKey>("inflation")
  const [data, setData] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tvLoaded, setTvLoaded] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoRef = useRef<any>(null)
  const metricRef = useRef<MetricKey>("inflation")
  const dataRef = useRef<MacroData | null>(null)
  const selectedRef = useRef<string | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => { metricRef.current = metric }, [metric])
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { selectedRef.current = selected }, [selected])

  // Fetch data
  useEffect(() => {
    fetch("/api/macro-data")
      .then(r => r.json())
      .then(j => { setData(j.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Init map
  useEffect(() => {
    if (!loading && data && !mapRef.current && containerRef.current) initMap()
  }, [loading, data])

  // Recolor when metric changes
  useEffect(() => {
    if (geoRef.current && data) geoRef.current.setStyle(styleFeature)
  }, [metric, data])

  // Highlight selected country
  useEffect(() => {
    if (!geoRef.current) return
    geoRef.current.eachLayer((layer: any) => {
      const iso = layer.feature?.properties?.ADM0_A3 ?? layer.feature?.properties?.ISO_A3 ?? ""
      if (iso === selected) layer.setStyle({ weight: 2.5, color: "#ffffff", fillOpacity: 1 })
      else geoRef.current.resetStyle(layer)
    })
  }, [selected])

  // Invalidate on tab switch
  useEffect(() => {
    if (tab === "map" && mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 60)
  }, [tab])

  // TradingView calendar
  useEffect(() => {
    if (tab !== "calendar" || tvLoaded) return
    const el = document.getElementById("tv-cal")
    if (!el) return
    const s = document.createElement("script")
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js"
    s.async = true
    s.textContent = JSON.stringify({
      colorTheme: "dark", isTransparent: true, width: "100%", height: "100%",
      locale: "en", importanceFilter: "-1,0,1",
      countryFilter: "us,cn,de,gb,jp,fr,in,br,ca,au,kr,ru,sa,tr,id,mx,za,ch,pl,eu",
    })
    el.appendChild(s)
    setTvLoaded(true)
  }, [tab, tvLoaded])

  // Scroll sidebar to selected
  useEffect(() => {
    if (!selected || !sidebarRef.current) return
    const el = sidebarRef.current.querySelector(`[data-iso="${selected}"]`) as HTMLElement
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selected])

  // Sorted sidebar list
  const ranked = useMemo(() => {
    if (!data) return []
    const list = Object.entries(data[metric])
      .filter(([iso, v]) => v != null && iso in NAMES)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([iso, value], i) => ({
        iso, value: value as number,
        name: NAMES[iso] ?? iso,
        color: metricColor(metric, value as number),
        rank: i + 1,
      }))
    if (selected) {
      const idx = list.findIndex(e => e.iso === selected)
      if (idx > 0) { const [item] = list.splice(idx, 1); list.unshift(item) }
    }
    return list
  }, [data, metric, selected])

  // Style feature
  function styleFeature(feature: any) {
    const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
    const value = dataRef.current?.[metricRef.current]?.[iso]
    const isSel = iso === selectedRef.current
    return {
      fillColor: metricColor(metricRef.current, value),
      fillOpacity: value != null ? (isSel ? 1 : 0.85) : 0.12,
      color: isSel ? "#ffffff" : "rgba(255,255,255,0.06)",
      weight: isSel ? 2.5 : 0.4,
    }
  }

  async function initMap() {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return

    // Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // Leaflet JS
    if (!(window as any).L) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script")
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        s.onload = () => res(); s.onerror = () => rej()
        document.head.appendChild(s)
      })
    }

    const L = (window as any).L
    if (!L || !containerRef.current || mapRef.current) return

    // Styles — dark zoom controls + transparent tooltips
    const sty = document.createElement("style")
    sty.textContent = `
      .mc-tip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;}
      .mc-tip::before{display:none!important;}
      .leaflet-container{background:#060a10!important;}
      .leaflet-control-zoom{border:1px solid rgba(255,255,255,0.08)!important;}
      .leaflet-control-zoom a{background:#0d1825!important;color:#94a3b8!important;border-color:rgba(255,255,255,0.06)!important;}
      .leaflet-control-zoom a:hover{color:#fff!important;}
      .leaflet-interactive:focus{outline:none!important;}
    `
    document.head.appendChild(sty)

    const map = L.map(containerRef.current, {
      center: [20, 0], zoom: 2.9, minZoom: 0.5, maxZoom: 7,
      zoomControl: true, attributionControl: false,
      worldCopyJump: true, maxBounds: [[-65, -Infinity], [80, Infinity]],
    })
    mapRef.current = map
    map.fitBounds([[-30, -150], [55, 180]])

    // ──────────────────────────────────────────────────────────────────────
    // dark_nolabels — ZERO country / city names on the base tile
    // ──────────────────────────────────────────────────────────────────────
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
    }).addTo(map)

    // GeoJSON
    let geo: any
    try {
      geo = await fetch(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
      ).then(r => r.json())
    } catch { return }

    const geoLayer = L.geoJSON(geo, {
      style: styleFeature,
      onEachFeature: (feature: any, layer: any) => {
        const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
        const name = NAMES[iso] ?? feature.properties?.NAME ?? iso

        layer.on({
          mouseover: () => {
            if (iso !== selectedRef.current)
              layer.setStyle({ weight: 1.5, color: "#4ade80", fillOpacity: 0.95 })
          },
          mouseout: () => {
            if (iso !== selectedRef.current) geoLayer.resetStyle(layer)
          },
          click: () => setSelected(prev => prev === iso ? null : iso),
        })

        layer.bindTooltip(() => {
          const m = metricRef.current
          const value = dataRef.current?.[m]?.[iso]
          const col = metricColor(m, value)
          const mConf = METRICS.find(x => x.key === m)!
          return `<div style="background:#0d1825;border:1px solid ${col}60;border-radius:10px;padding:10px 14px;font-family:system-ui,sans-serif;min-width:150px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:13px;margin-bottom:4px">${name}</div>
            <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px">${mConf.label}</div>
            <div style="font-size:22px;font-weight:800;color:${col}">${fmt(m, value)}</div>
          </div>`
        }, { sticky: true, className: "mc-tip", offset: [14, 0] })
      },
    })

    geoLayer.addTo(map)
    geoRef.current = geoLayer
  }

  const mConf = METRICS.find(m => m.key === metric)!
  const scale = COLOR_SCALES[metric]

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Controls ── */}
      <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3">
        {/* Metric pills */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {METRICS.map(m => (
            <button key={m.key} onClick={() => { setMetric(m.key); setSelected(null) }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${metric === m.key
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-transparent"
                }`}
            >{m.label}</button>
          ))}
        </div>
        {/* Tabs */}
        <div className="flex">
          {([
            { key: "map" as TabKey, label: "World Map", Icon: Globe2 },
            { key: "table" as TabKey, label: "Country Comparison", Icon: BarChart3 },
            { key: "calendar" as TabKey, label: "Economic Calendar", Icon: CalendarDays },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
            ><t.Icon className="w-3.5 h-3.5" />{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* MAP */}
        {tab === "map" && (
          <>
            {/* Map area */}
            <div className="relative flex-1 overflow-hidden">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading World Bank data…</span>
                  </div>
                </div>
              )}
              <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#060a10" }} />

              {/* Legend — gradient bar, single hue */}
              {!loading && (
                <div className="absolute bottom-5 left-4 z-[1000] bg-background/90 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl w-44">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-2.5 uppercase">{mConf.label}</p>
                  {/* Gradient bar */}
                  <div className="h-3 rounded-full" style={{
                    background: `linear-gradient(to right, ${scale.light}, ${scale.dark})`
                  }} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">Low</span>
                    <span className="text-[9px] text-muted-foreground">High</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                    <div className="w-4 h-2.5 rounded shrink-0" style={{ background: NO_DATA, border: "1px solid rgba(255,255,255,0.08)" }} />
                    <span className="text-[9px] text-muted-foreground">No data</span>
                  </div>
                </div>
              )}

              {/* Source */}
              {!loading && (
                <div className="absolute bottom-5 right-4 z-[1000]">
                  <span className="text-[9px] text-muted-foreground/50 bg-background/60 px-2 py-1 rounded">
                    World Bank · Most recent available year
                  </span>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div ref={sidebarRef}
              className="w-60 shrink-0 border-l border-border bg-background flex flex-col overflow-hidden"
            >
              {/* Sidebar header */}
              <div className="shrink-0 px-4 py-3 border-b border-border bg-background/80">
                <p className="text-xs font-bold text-foreground">{mConf.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {ranked.length} countries · click to highlight
                </p>
              </div>

              {/* Sidebar list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className="h-8 bg-secondary/30 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : ranked.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4">No data available</p>
                ) : (
                  ranked.map((item, i) => {
                    const isSel = item.iso === selected
                    return (
                      <div key={item.iso} data-iso={item.iso}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b border-border/20 transition-colors ${isSel ? "bg-white/5" : "hover:bg-secondary/20"
                          }`}
                        onClick={() => setSelected(p => p === item.iso ? null : item.iso)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color swatch */}
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                          <div className="min-w-0">
                            <p className={`text-xs font-medium truncate ${isSel ? "text-primary" : "text-foreground"}`}>
                              {item.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground/60">
                              #{isSel ? "selected" : item.rank}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold tabular-nums shrink-0 ml-2"
                          style={{ color: item.color }}>
                          {fmt(metric, item.value)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* TABLE */}
        {tab === "table" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-2xl border border-border overflow-hidden max-w-5xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground tracking-wider">COUNTRY</th>
                      {METRICS.map(m => (
                        <th key={m.key} onClick={() => setMetric(m.key)}
                          className={`text-right px-4 py-3.5 text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap ${metric === m.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {m.label.toUpperCase()}
                          {metric === m.key && <span className="ml-1 inline-block w-1 h-1 rounded-full bg-primary align-middle" />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE_ROWS.map((c, i) => (
                      <tr key={c.iso} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${i % 2 === 1 ? "bg-secondary/5" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{c.flag}</span>
                            <span className="font-semibold text-foreground whitespace-nowrap">{NAMES[c.iso] ?? c.iso}</span>
                          </div>
                        </td>
                        {METRICS.map(m => {
                          const val = data?.[m.key]?.[c.iso]
                          const col = metricColor(m.key, val)
                          return (
                            <td key={m.key} className="px-4 py-3 text-right">
                              {loading
                                ? <div className="h-5 bg-secondary/50 rounded animate-pulse ml-auto w-14" />
                                : <span className="inline-block px-2 py-0.5 rounded text-xs font-bold tabular-nums"
                                  style={{ background: `${col}18`, color: col, border: metric === m.key ? `1px solid ${col}40` : "1px solid transparent" }}>
                                  {fmt(m.key, val)}
                                </span>
                              }
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-border bg-secondary/10">
                <p className="text-xs text-muted-foreground">Source: World Bank Open Data · Click column header to switch metric on map</p>
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-2xl border border-border overflow-hidden bg-background/30" style={{ height: "calc(100% - 32px)", minHeight: "500px" }}>
              <div id="tv-cal" className="tradingview-widget-container" style={{ height: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ height: "100%" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
