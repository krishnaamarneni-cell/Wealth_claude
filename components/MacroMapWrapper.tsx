"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Globe2, BarChart3, CalendarDays } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
type MetricKey = "inflation" | "gdpGrowth" | "gdp" | "unemployment" | "debtToGdp"
type TabKey = "map" | "table" | "calendar"

interface MacroData {
  inflation: Record<string, number>
  gdpGrowth: Record<string, number>
  gdp: Record<string, number>
  unemployment: Record<string, number>
  debtToGdp: Record<string, number>
}

// ── Metric config ─────────────────────────────────────────────────────────────
const METRICS: { key: MetricKey; label: string; desc: string; unit: string }[] = [
  { key: "inflation", label: "Inflation Rate", desc: "Consumer Price Index YoY", unit: "%" },
  { key: "gdpGrowth", label: "GDP Growth", desc: "Annual real GDP growth rate", unit: "%" },
  { key: "gdp", label: "GDP", desc: "Gross Domestic Product (current USD)", unit: "$" },
  { key: "unemployment", label: "Unemployment Rate", desc: "% of total labor force", unit: "%" },
  { key: "debtToGdp", label: "Govt Debt / GDP", desc: "Central government debt as % of GDP", unit: "%" },
]

// ── Single-hue color scales (light → dark, like TradingView) ──────────────────
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}
function lerpColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  const c = Math.min(1, Math.max(0, t))
  return `rgb(${Math.round(r1 + (r2 - r1) * c)},${Math.round(g1 + (g2 - g1) * c)},${Math.round(b1 + (b2 - b1) * c)})`
}

const NO_DATA_COLOR = "#0d1825"

function metricColor(metric: MetricKey, value: number | undefined | null): string {
  if (value == null) return NO_DATA_COLOR
  switch (metric) {
    case "inflation": {
      // Light cream → deep burnt orange (0% = lightest, 20%+ = darkest)
      const t = Math.min(Math.max(value / 20, 0), 1)
      return lerpColor("#fde8cc", "#7a2800", t)
    }
    case "gdpGrowth": {
      // Negative: light red → dark red | Positive: light green → dark green
      if (value >= 0) {
        const t = Math.min(value / 8, 1)
        return lerpColor("#d4f0c0", "#1a5c00", t)
      } else {
        const t = Math.min(Math.abs(value) / 5, 1)
        return lerpColor("#ffd0c0", "#7a0000", t)
      }
    }
    case "gdp": {
      // Log scale: $1B → $20T (light blue → dark navy)
      const logVal = Math.log10(Math.max(value, 1e9))
      const logMin = Math.log10(1e9)   // $1B
      const logMax = Math.log10(20e12) // $20T
      const t = Math.min(Math.max((logVal - logMin) / (logMax - logMin), 0), 1)
      return lerpColor("#cce5f5", "#003070", t)
    }
    case "unemployment": {
      // Light yellow → dark amber (0% = lightest, 25%+ = darkest)
      const t = Math.min(Math.max(value / 25, 0), 1)
      return lerpColor("#fff3cc", "#7a3200", t)
    }
    case "debtToGdp": {
      // Light peach → dark crimson (0% = lightest, 200%+ = darkest)
      const t = Math.min(Math.max(value / 200, 0), 1)
      return lerpColor("#fde8cc", "#7a0000", t)
    }
  }
}

// ── Legend stops for each metric ──────────────────────────────────────────────
const LEGEND_STOPS: Record<MetricKey, { label: string; t: number }[]> = {
  inflation: [{ label: "0%", t: 0 }, { label: "5%", t: 0.25 }, { label: "10%", t: 0.5 }, { label: "15%", t: 0.75 }, { label: "20%+", t: 1 }],
  gdpGrowth: [{ label: "-5%", t: 0 }, { label: "0%", t: 0.5 }, { label: "4%", t: 0.75 }, { label: "8%+", t: 1 }],
  gdp: [{ label: "$1B", t: 0 }, { label: "$100B", t: 0.3 }, { label: "$1T", t: 0.6 }, { label: "$20T+", t: 1 }],
  unemployment: [{ label: "0%", t: 0 }, { label: "6%", t: 0.25 }, { label: "12%", t: 0.5 }, { label: "25%+", t: 1 }],
  debtToGdp: [{ label: "0%", t: 0 }, { label: "50%", t: 0.25 }, { label: "100%", t: 0.5 }, { label: "200%+", t: 1 }],
}

// ── Value formatter ───────────────────────────────────────────────────────────
function formatValue(metric: MetricKey, value: number | undefined | null): string {
  if (value == null) return "N/A"
  if (metric === "gdp") {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    return `$${(value / 1e6).toFixed(0)}M`
  }
  return `${value.toFixed(1)}%`
}

// ── ISO3 → country name lookup (covers all World Bank reporting countries) ────
const ISO3_NAMES: Record<string, string> = {
  AFG: "Afghanistan", ALB: "Albania", DZA: "Algeria", AND: "Andorra", AGO: "Angola",
  ARG: "Argentina", ARM: "Armenia", AUS: "Australia", AUT: "Austria", AZE: "Azerbaijan",
  BHS: "Bahamas", BHR: "Bahrain", BGD: "Bangladesh", BLR: "Belarus", BEL: "Belgium",
  BLZ: "Belize", BEN: "Benin", BTN: "Bhutan", BOL: "Bolivia", BIH: "Bosnia",
  BWA: "Botswana", BRA: "Brazil", BRN: "Brunei", BGR: "Bulgaria", BFA: "Burkina Faso",
  BDI: "Burundi", CPV: "Cape Verde", KHM: "Cambodia", CMR: "Cameroon", CAN: "Canada",
  CAF: "Central African Republic", TCD: "Chad", CHL: "Chile", CHN: "China", COL: "Colombia",
  COM: "Comoros", COD: "Congo, DR", COG: "Congo", CRI: "Costa Rica", CIV: "Côte d'Ivoire",
  HRV: "Croatia", CUB: "Cuba", CYP: "Cyprus", CZE: "Czech Republic", DNK: "Denmark",
  DJI: "Djibouti", DOM: "Dominican Republic", ECU: "Ecuador", EGY: "Egypt", SLV: "El Salvador",
  GNQ: "Equatorial Guinea", ERI: "Eritrea", EST: "Estonia", ETH: "Ethiopia", FJI: "Fiji",
  FIN: "Finland", FRA: "France", GAB: "Gabon", GMB: "Gambia", GEO: "Georgia",
  DEU: "Germany", GHA: "Ghana", GRC: "Greece", GTM: "Guatemala", GIN: "Guinea",
  GNB: "Guinea-Bissau", GUY: "Guyana", HTI: "Haiti", HND: "Honduras", HUN: "Hungary",
  IND: "India", IDN: "Indonesia", IRN: "Iran", IRQ: "Iraq", IRL: "Ireland",
  ISR: "Israel", ITA: "Italy", JAM: "Jamaica", JPN: "Japan", JOR: "Jordan",
  KAZ: "Kazakhstan", KEN: "Kenya", KOR: "South Korea", KWT: "Kuwait", KGZ: "Kyrgyzstan",
  LAO: "Laos", LVA: "Latvia", LBN: "Lebanon", LBR: "Liberia", LBY: "Libya",
  LTU: "Lithuania", LUX: "Luxembourg", MDG: "Madagascar", MWI: "Malawi", MYS: "Malaysia",
  MDV: "Maldives", MLI: "Mali", MLT: "Malta", MRT: "Mauritania", MUS: "Mauritius",
  MEX: "Mexico", MDA: "Moldova", MNG: "Mongolia", MNE: "Montenegro", MAR: "Morocco",
  MOZ: "Mozambique", MMR: "Myanmar", NAM: "Namibia", NPL: "Nepal", NLD: "Netherlands",
  NZL: "New Zealand", NIC: "Nicaragua", NER: "Niger", NGA: "Nigeria", MKD: "North Macedonia",
  NOR: "Norway", OMN: "Oman", PAK: "Pakistan", PAN: "Panama", PNG: "Papua New Guinea",
  PRY: "Paraguay", PER: "Peru", PHL: "Philippines", POL: "Poland", PRT: "Portugal",
  QAT: "Qatar", ROU: "Romania", RUS: "Russia", RWA: "Rwanda", SAU: "Saudi Arabia",
  SEN: "Senegal", SRB: "Serbia", SLE: "Sierra Leone", SGP: "Singapore", SVK: "Slovakia",
  SVN: "Slovenia", SOM: "Somalia", ZAF: "South Africa", SSD: "South Sudan", ESP: "Spain",
  LKA: "Sri Lanka", SDN: "Sudan", SUR: "Suriname", SWE: "Sweden", CHE: "Switzerland",
  SYR: "Syria", TWN: "Taiwan", TJK: "Tajikistan", TZA: "Tanzania", THA: "Thailand",
  TGO: "Togo", TTO: "Trinidad & Tobago", TUN: "Tunisia", TUR: "Turkey", TKM: "Turkmenistan",
  UGA: "Uganda", UKR: "Ukraine", ARE: "UAE", GBR: "United Kingdom", USA: "United States",
  URY: "Uruguay", UZB: "Uzbekistan", VEN: "Venezuela", VNM: "Vietnam", YEM: "Yemen",
  ZMB: "Zambia", ZWE: "Zimbabwe", HKG: "Hong Kong", MAC: "Macao",
}

// ── Table data — major economies ──────────────────────────────────────────────
const TABLE_COUNTRIES = [
  { iso3: "USA", flag: "🇺🇸" }, { iso3: "CHN", flag: "🇨🇳" }, { iso3: "JPN", flag: "🇯🇵" },
  { iso3: "DEU", flag: "🇩🇪" }, { iso3: "IND", flag: "🇮🇳" }, { iso3: "GBR", flag: "🇬🇧" },
  { iso3: "FRA", flag: "🇫🇷" }, { iso3: "ITA", flag: "🇮🇹" }, { iso3: "BRA", flag: "🇧🇷" },
  { iso3: "CAN", flag: "🇨🇦" }, { iso3: "RUS", flag: "🇷🇺" }, { iso3: "KOR", flag: "🇰🇷" },
  { iso3: "AUS", flag: "🇦🇺" }, { iso3: "MEX", flag: "🇲🇽" }, { iso3: "IDN", flag: "🇮🇩" },
  { iso3: "NLD", flag: "🇳🇱" }, { iso3: "SAU", flag: "🇸🇦" }, { iso3: "TUR", flag: "🇹🇷" },
  { iso3: "CHE", flag: "🇨🇭" }, { iso3: "ZAF", flag: "🇿🇦" },
]

// ── Main component ────────────────────────────────────────────────────────────
export function MacroMapWrapper() {
  const [activeTab, setActiveTab] = useState<TabKey>("map")
  const [metric, setMetric] = useState<MetricKey>("inflation")
  const [data, setData] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [tvLoaded, setTvLoaded] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoLayerRef = useRef<any>(null)
  const metricRef = useRef<MetricKey>("inflation")
  const dataRef = useRef<MacroData | null>(null)
  const selectedRef = useRef<string | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Keep refs in sync
  useEffect(() => { metricRef.current = metric }, [metric])
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { selectedRef.current = selectedCountry }, [selectedCountry])

  // Fetch macro data
  useEffect(() => {
    fetch("/api/macro-data")
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Init map once data ready
  useEffect(() => {
    if (!loading && data && !mapRef.current && mapContainerRef.current) {
      initMap()
    }
  }, [loading, data])

  // Recolor map when metric changes
  useEffect(() => {
    if (geoLayerRef.current && data) {
      geoLayerRef.current.setStyle((f: any) => styleFeature(f))
    }
  }, [metric, data])

  // Recolor selected country highlight
  useEffect(() => {
    if (!geoLayerRef.current) return
    geoLayerRef.current.eachLayer((layer: any) => {
      const iso = layer.feature?.properties?.ADM0_A3 ?? layer.feature?.properties?.ISO_A3 ?? ""
      if (iso === selectedCountry) {
        layer.setStyle({ weight: 2, color: "#ffffff", fillOpacity: 1 })
      } else {
        geoLayerRef.current.resetStyle(layer)
      }
    })
  }, [selectedCountry])

  // Invalidate map size when switching back to map tab
  useEffect(() => {
    if (activeTab === "map" && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 50)
    }
  }, [activeTab])

  // TradingView economic calendar embed
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
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "ar,au,br,ca,cn,de,fr,gb,in,id,it,jp,kr,mx,ru,sa,tr,us,eu,za,sg,ch,pl,ng",
    })
    el.appendChild(script)
    setTvLoaded(true)
  }, [activeTab, tvLoaded])

  // Scroll sidebar to selected country
  useEffect(() => {
    if (!selectedCountry || !sidebarRef.current) return
    const el = sidebarRef.current.querySelector(`[data-iso="${selectedCountry}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [selectedCountry])

  // ── Sorted sidebar list ──
  const sortedCountries = useMemo(() => {
    if (!data) return []
    const metric_ = metric
    const entries = Object.entries(data[metric_])
      .filter(([, v]) => v != null)
      .sort(([, a], [, b]) => b - a) // descending
      .map(([iso, value]) => ({
        iso,
        name: ISO3_NAMES[iso] ?? iso,
        value,
        color: metricColor(metric_, value),
      }))

    // If a country is selected, bump it to the top
    if (selectedCountry) {
      const idx = entries.findIndex(e => e.iso === selectedCountry)
      if (idx > 0) {
        const [item] = entries.splice(idx, 1)
        entries.unshift(item)
      }
    }
    return entries
  }, [data, metric, selectedCountry])

  // ── Style function ──
  function styleFeature(feature: any) {
    const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
    const value = dataRef.current?.[metricRef.current]?.[iso]
    const isSel = iso === selectedRef.current
    return {
      fillColor: metricColor(metricRef.current, value),
      fillOpacity: value != null ? (isSel ? 1 : 0.82) : 0.15,
      color: isSel ? "#ffffff" : "rgba(255,255,255,0.06)",
      weight: isSel ? 2 : 0.5,
    }
  }

  // ── Init Leaflet ──
  async function initMap() {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

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

    // Inject tooltip + container styles
    const style = document.createElement("style")
    style.textContent = `
      .macro-tip { background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important; }
      .macro-tip::before { display:none!important; }
      .leaflet-container { background:#060a10!important; }
      .leaflet-control-zoom { border:1px solid rgba(255,255,255,0.1)!important; }
      .leaflet-control-zoom a { background:#0d1825!important;color:#94a3b8!important;border-color:rgba(255,255,255,0.08)!important; }
      .leaflet-control-zoom a:hover { color:#fff!important; }
    `
    document.head.appendChild(style)

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 7,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true,
      maxBounds: [[-85, -Infinity], [85, Infinity]],
    })
    mapRef.current = map

    // ── dark_nolabels — no country or city names on tiles ──
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd" }
    ).addTo(map)

    // Load GeoJSON
    let geoData: any
    try {
      const r = await fetch(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
      )
      geoData = await r.json()
    } catch { return }

    const geoLayer = L.geoJSON(geoData, {
      style: styleFeature,
      onEachFeature: (feature: any, layer: any) => {
        const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
        const name = ISO3_NAMES[iso] ?? feature.properties?.NAME ?? iso

        layer.on({
          mouseover: () => {
            if (iso !== selectedRef.current) {
              layer.setStyle({ weight: 1.5, color: "#4ade80", fillOpacity: 0.95 })
            }
          },
          mouseout: () => {
            if (iso !== selectedRef.current) geoLayer.resetStyle(layer)
          },
          click: () => {
            setSelectedCountry(prev => prev === iso ? null : iso)
          },
        })

        layer.bindTooltip(() => {
          const m = metricRef.current
          const value = dataRef.current?.[m]?.[iso]
          const color = metricColor(m, value)
          const mConf = METRICS.find(x => x.key === m)!
          return `
            <div style="background:#0d1825;border:1px solid ${color}60;border-radius:10px;padding:10px 14px;font-family:-apple-system,sans-serif;min-width:150px;">
              <div style="font-weight:700;color:#f1f5f9;font-size:13px;margin-bottom:5px">${name}</div>
              <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">${mConf.label}</div>
              <div style="font-size:22px;font-weight:800;color:${color}">${formatValue(m, value)}</div>
            </div>
          `
        }, { sticky: true, className: "macro-tip", offset: [14, 0] })
      },
    })

    geoLayer.addTo(map)
    geoLayerRef.current = geoLayer
  }

  const metricConf = METRICS.find(m => m.key === metric)!
  const lgStops = LEGEND_STOPS[metric]

  // ── Gradient bar: lerpColor at t=0 and t=1 for current metric ──
  const gradFrom = metric === "gdpGrowth" ? lerpColor("#ffd0c0", "#7a0000", 1) : lerpColor("#fde8cc", "#7a0000", 0)
  const gradMid = metric === "gdpGrowth" ? "#d4f0c0" : lerpColor("#fde8cc", "#7a0000", 0.5)
  const gradTo = metricColor(metric, metric === "gdp" ? 20e12 : metric === "debtToGdp" ? 200 : metric === "unemployment" ? 25 : metric === "inflation" ? 20 : 8)

  return (
    // FIX 1+2: height is calc(100vh - 64px) so it fills below fixed header exactly
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Controls bar — sticky below header ── */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-6 py-3">

          {/* Metric pills */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => { setMetric(m.key); setSelectedCountry(null) }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${metric === m.key
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {([
              { key: "map" as TabKey, label: "World Map", Icon: Globe2 },
              { key: "table" as TabKey, label: "Country Comparison", Icon: BarChart3 },
              { key: "calendar" as TabKey, label: "Economic Calendar", Icon: CalendarDays },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key
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

      {/* ── Content area fills remaining height ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ MAP TAB ══ */}
        {activeTab === "map" && (
          <>
            {/* Map */}
            <div className="relative flex-1 overflow-hidden">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading World Bank data…</span>
                  </div>
                </div>
              )}

              {/* Leaflet mount point */}
              <div ref={mapContainerRef} style={{ width: "100%", height: "100%", background: "#060a10" }} />

              {/* Legend — gradient bar */}
              {!loading && (
                <div className="absolute bottom-5 left-4 z-[1000] bg-background/90 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl min-w-[160px]">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-3 uppercase">
                    {metricConf.label}
                  </p>
                  {/* Gradient bar */}
                  <div
                    className="h-3 rounded-full mb-2"
                    style={{ background: `linear-gradient(to right, ${metricColor(metric, 0)}, ${metricColor(metric, metric === "gdp" ? 20e12 : metric === "debtToGdp" ? 200 : metric === "unemployment" ? 25 : 20)})` }}
                  />
                  <div className="flex justify-between">
                    <span className="text-[9px] text-muted-foreground">{lgStops[0].label}</span>
                    <span className="text-[9px] text-muted-foreground">{lgStops[lgStops.length - 1].label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border">
                    <div className="w-4 h-2.5 rounded shrink-0" style={{ background: NO_DATA_COLOR, border: "1px solid rgba(255,255,255,0.1)" }} />
                    <span className="text-[9px] text-muted-foreground">No data</span>
                  </div>
                </div>
              )}

              {/* Source note */}
              {!loading && (
                <div className="absolute bottom-5 right-4 z-[1000]">
                  <span className="text-[9px] text-muted-foreground/50 bg-background/60 px-2 py-1 rounded">
                    World Bank Open Data · Most recent available year
                  </span>
                </div>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <div
              ref={sidebarRef}
              className="w-64 shrink-0 border-l border-border bg-background/50 overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 shrink-0 z-10">
                <p className="text-xs font-bold text-foreground">{metricConf.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {sortedCountries.length} countries · Click map to highlight
                </p>
              </div>

              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-9 bg-secondary/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex-1">
                  {sortedCountries.map((item, i) => {
                    const isSelected = item.iso === selectedCountry
                    return (
                      <div
                        key={item.iso}
                        data-iso={item.iso}
                        className={`flex items-center justify-between px-4 py-2.5 border-b border-border/30 cursor-pointer transition-colors ${isSelected
                            ? "bg-primary/10"
                            : "hover:bg-secondary/30"
                          }`}
                        onClick={() => setSelectedCountry(prev => prev === item.iso ? null : item.iso)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Color dot */}
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: item.color }}
                          />
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {item.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground">#{i + 1}</p>
                          </div>
                        </div>
                        <span
                          className="text-xs font-bold tabular-nums shrink-0 ml-2"
                          style={{ color: item.color }}
                        >
                          {formatValue(metric, item.value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ TABLE TAB ══ */}
        {activeTab === "table" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-2xl border border-border overflow-hidden max-w-6xl mx-auto">
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
                          className={`text-right px-4 py-3.5 text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap transition-colors ${metric === m.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {m.label.toUpperCase()}
                          {metric === m.key && <span className="ml-1 inline-block w-1 h-1 rounded-full bg-primary align-middle" />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE_COUNTRIES.map((c, i) => (
                      <tr
                        key={c.iso3}
                        className={`border-b border-border/40 hover:bg-secondary/20 transition-colors ${i % 2 === 1 ? "bg-secondary/5" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg leading-none">{c.flag}</span>
                            <span className="font-semibold text-foreground whitespace-nowrap">
                              {ISO3_NAMES[c.iso3] ?? c.iso3}
                            </span>
                          </div>
                        </td>
                        {METRICS.map(m => {
                          const value = data?.[m.key]?.[c.iso3]
                          const color = metricColor(m.key, value)
                          return (
                            <td key={m.key} className="px-4 py-3 text-right">
                              {loading ? (
                                <div className="h-5 bg-secondary/50 rounded animate-pulse ml-auto w-14" />
                              ) : (
                                <span
                                  className="inline-block px-2.5 py-1 rounded-md text-xs font-bold tabular-nums"
                                  style={{
                                    background: `${color}18`,
                                    color,
                                    border: metric === m.key ? `1px solid ${color}40` : "1px solid transparent",
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
              <div className="px-5 py-3 border-t border-border bg-secondary/10">
                <p className="text-xs text-muted-foreground">
                  Source: World Bank Open Data · Most recent available year · Click column headers to switch metric
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ CALENDAR TAB ══ */}
        {activeTab === "calendar" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-2xl border border-border overflow-hidden bg-background/30 h-full min-h-[600px]">
              <div id="tv-macro-calendar" className="tradingview-widget-container h-full">
                <div className="tradingview-widget-container__widget h-full" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Economic calendar powered by TradingView
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
