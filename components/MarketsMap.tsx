"use client"

import { useEffect, useRef } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface CountryData {
  isoA3: string
  label: string
  changePct: number
}

interface MarketsMapProps {
  countries: CountryData[]
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null) => void
  periodLabel: string // "1Y", "3Y", or "5Y"
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR SCALE (matches your table styling)
// ─────────────────────────────────────────────────────────────────────────────
function pctToColor(pct: number): string {
  if (pct >= 50) return "#22c55e"  // Strong green
  if (pct >= 30) return "#4ade80"  // Green
  if (pct >= 15) return "#86efac"  // Light green
  if (pct >= 5) return "#a7f3d0"   // Very light green
  if (pct >= 0) return "#6ee7b7"   // Teal green
  if (pct >= -10) return "#fca5a5" // Light red
  if (pct >= -25) return "#f87171" // Red
  return "#ef4444"                  // Strong red
}

// ─────────────────────────────────────────────────────────────────────────────
// SYMBOL → ISO A3 MAPPING
// ─────────────────────────────────────────────────────────────────────────────
const SYMBOL_TO_ISO: Record<string, string> = {
  "^GSPC": "USA",
  "^IXIC": "USA",
  "^FTSE": "GBR",
  "^GDAXI": "DEU",
  "^FCHI": "FRA",
  "^N225": "JPN",
  "^HSI": "HKG",
  "^AXJO": "AUS",
  "^BSESN": "IND",
  "^KS11": "KOR",
  // Add more as needed
  "^STOXX50E": "EUR",
  "^IBEX": "ESP",
  "^SSMI": "CHE",
  "^AEX": "NLD",
  "^FTSEMIB": "ITA",
  "^BVSP": "BRA",
  "^MXX": "MEX",
  "^GSPTSE": "CAN",
  "000001.SS": "CHN",
  "^STI": "SGP",
  "^KLSE": "MYS",
  "^TWII": "TWN",
  "^NZ50": "NZL",
  "^TA125.TA": "ISR",
  "^TASI": "SAU",
}

// ISO A3 → Country name for labels on map
const ISO_TO_NAME: Record<string, string> = {
  USA: "United States",
  GBR: "United Kingdom",
  DEU: "Germany",
  FRA: "France",
  JPN: "Japan",
  HKG: "Hong Kong",
  AUS: "Australia",
  IND: "India",
  KOR: "South Korea",
  CHN: "China",
  BRA: "Brazil",
  CAN: "Canada",
  ITA: "Italy",
  ESP: "Spain",
  CHE: "Switzerland",
  NLD: "Netherlands",
  MEX: "Mexico",
  SGP: "Singapore",
  MYS: "Malaysia",
  TWN: "Taiwan",
  NZL: "New Zealand",
  ISR: "Israel",
  SAU: "Saudi Arabia",
}

// Countries without major exchanges (gray them out)
const NO_EXCHANGE_COUNTRIES = new Set([
  "AFG", "PRK", "SOM", "SSD", "SYR", "YEM", "ERI", "TKM", "CUB",
  "GRL", "ATA", "SJM", "ATF", "IOT", "HMD", "SGS", "BVT", "UMI",
])

// ─────────────────────────────────────────────────────────────────────────────
// LEAFLET STYLES
// ─────────────────────────────────────────────────────────────────────────────
const LEAFLET_OVERRIDES = `
  .leaflet-container { background: #060a10 !important; }
  .leaflet-interactive:focus { outline: none !important; }
  path.leaflet-interactive:focus { outline: none !important; }
  
  .markets-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .markets-tooltip .leaflet-tooltip-tip { display: none !important; }
  
  .leaflet-control-zoom a {
    background: #0d1117 !important;
    color: rgba(255,255,255,0.5) !important;
    border-color: rgba(255,255,255,0.1) !important;
  }
  .leaflet-control-zoom a:hover { 
    background: #1a2030 !important; 
    color: white !important; 
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function MarketsMap({
  countries,
  selectedCountry,
  onCountrySelect,
  periodLabel
}: MarketsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoDataRef = useRef<any>(null)
  const dataRef = useRef<CountryData[]>(countries)

  // Keep data ref updated
  dataRef.current = countries

  // Build lookup: ISO A3 → CountryData
  const dataLookup: Record<string, CountryData> = {}
  for (const c of countries) {
    dataLookup[c.isoA3] = c
  }

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    if (mapRef.current) return

    // Inject styles
    if (!document.getElementById("markets-map-styles")) {
      const style = document.createElement("style")
      style.id = "markets-map-styles"
      style.textContent = LEAFLET_OVERRIDES
      document.head.appendChild(style)
    }

    const init = async () => {
      // Load Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          s.onload = () => res()
          s.onerror = () => rej(new Error("Leaflet load failed"))
          document.head.appendChild(s)
        })
      }

      const L = (window as any).L
      if (!L || !containerRef.current) return

      // Create map
      const map = L.map(containerRef.current, {
        center: [30, 0],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 6,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
        maxBounds: [[-85, -Infinity], [85, Infinity]],
        maxBoundsViscosity: 0.8,
      })

      L.control.zoom({ position: "bottomleft" }).addTo(map)
      mapRef.current = map

      // Fetch GeoJSON
      let geoData: any
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
        )
        geoData = await res.json()
      } catch (err) {
        console.error("MarketsMap: GeoJSON fetch failed", err)
        return
      }

      geoDataRef.current = geoData
      renderMap(L, map, geoData, dataRef.current, selectedCountry, onCountrySelect)
    }

    init().catch(console.error)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        geoDataRef.current = null
      }
    }
  }, [])

  // Re-render when data or selection changes
  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current || !geoDataRef.current) return
    renderMap(L, mapRef.current, geoDataRef.current, countries, selectedCountry, onCountrySelect)
  }, [countries, selectedCountry])

  return (
    <div style={{ width: "100%", height: "100%", background: "#060a10", position: "relative" }}>
      {/* Period label overlay */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 1000,
        fontSize: 11,
        color: "#475569",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        pointerEvents: "none",
        fontWeight: 600,
      }}>
        {periodLabel} Performance
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 1000,
        background: "rgba(6, 10, 16, 0.9)",
        border: "1px solid #1e293b",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 10,
        color: "#64748b",
      }}>
        <div style={{ marginBottom: 6, fontWeight: 600, color: "#94a3b8" }}>Returns</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <LegendItem color="#22c55e" label="> 50%" />
          <LegendItem color="#4ade80" label="30 – 50%" />
          <LegendItem color="#86efac" label="15 – 30%" />
          <LegendItem color="#a7f3d0" label="0 – 15%" />
          <LegendItem color="#fca5a5" label="-10 – 0%" />
          <LegendItem color="#f87171" label="< -10%" />
          <LegendItem color="#1e2533" label="No data" />
        </div>
      </div>

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 12, height: 12, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
function renderMap(
  L: any,
  map: any,
  geoData: any,
  countries: CountryData[],
  selectedCountry: string | null,
  onCountrySelect: (iso: string | null) => void
) {
  // Remove existing layers
  if ((map as any)._marketsLayer) {
    map.removeLayer((map as any)._marketsLayer)
  }

  // Build lookup
  const dataLookup: Record<string, CountryData> = {}
  for (const c of countries) {
    dataLookup[c.isoA3] = c
  }

  const layer = L.geoJSON(geoData, {
    style: (feature: any) => {
      const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
      const isSelected = iso === selectedCountry
      const noExchange = NO_EXCHANGE_COUNTRIES.has(iso)
      const countryData = dataLookup[iso]

      let fillColor = "#1e2533" // Default gray for no data
      if (countryData) {
        fillColor = pctToColor(countryData.changePct)
      }

      return {
        fillColor: noExchange ? "#0f1419" : fillColor,
        fillOpacity: isSelected ? 1.0 : noExchange ? 0.4 : 0.85,
        color: isSelected ? "#00e676" : "rgba(255,255,255,0.08)",
        weight: isSelected ? 2.5 : 0.5,
      }
    },
    onEachFeature: (feature: any, featureLayer: any) => {
      const iso = feature.properties?.ADM0_A3 ?? feature.properties?.ISO_A3 ?? ""
      const name = feature.properties?.ADMIN ?? feature.properties?.NAME ?? iso
      const countryData = dataLookup[iso]
      const noExchange = NO_EXCHANGE_COUNTRIES.has(iso)

      // Tooltip HTML
      let tooltipHtml: string
      if (countryData) {
        const pct = countryData.changePct
        const color = pctToColor(pct)
        const sign = pct >= 0 ? "+" : ""
        tooltipHtml = `
          <div style="
            background: #0d1117;
            border: 1px solid ${color}50;
            border-radius: 10px;
            padding: 12px 16px;
            font-family: system-ui, sans-serif;
            min-width: 160px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.8);
          ">
            <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              ${name}
            </div>
            <div style="color: white; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
              ${countryData.label}
            </div>
            <div style="color: ${color}; font-size: 20px; font-weight: 800;">
              ${sign}${pct.toFixed(2)}%
            </div>
          </div>
        `
      } else if (noExchange) {
        tooltipHtml = `
          <div style="
            background: #0d1117;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            padding: 10px 14px;
            font-family: system-ui, sans-serif;
          ">
            <div style="color: rgba(255,255,255,0.4); font-size: 11px;">${name}</div>
            <div style="color: rgba(255,255,255,0.2); font-size: 10px; margin-top: 2px;">No major exchange</div>
          </div>
        `
      } else {
        tooltipHtml = `
          <div style="
            background: #0d1117;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            padding: 10px 14px;
            font-family: system-ui, sans-serif;
          ">
            <div style="color: rgba(255,255,255,0.4); font-size: 11px;">${name}</div>
            <div style="color: rgba(255,255,255,0.2); font-size: 10px; margin-top: 2px;">No data available</div>
          </div>
        `
      }

      featureLayer.bindTooltip(tooltipHtml, {
        sticky: true,
        opacity: 1,
        className: "markets-tooltip",
      })

      // Click handler
      featureLayer.on("click", () => {
        if (countryData) {
          onCountrySelect(iso === selectedCountry ? null : iso)
        }
      })

      // Hover effects
      featureLayer.on("mouseover", () => {
        if (iso !== selectedCountry && countryData) {
          featureLayer.setStyle({
            fillOpacity: 1,
            weight: 1.5,
            color: "rgba(255,255,255,0.3)",
          })
        }
      })

      featureLayer.on("mouseout", () => {
        layer.resetStyle(featureLayer)
      })
    },
  })

  layer.addTo(map)
    ; (map as any)._marketsLayer = layer
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Convert API returns to CountryData array
// ─────────────────────────────────────────────────────────────────────────────
export function returnsToCountryData(
  returns: Array<{ symbol: string; label: string; r1y: number | null; r3y: number | null; r5y: number | null }>,
  period: "r1y" | "r3y" | "r5y"
): CountryData[] {
  const result: CountryData[] = []
  const seen = new Set<string>()

  for (const row of returns) {
    const iso = SYMBOL_TO_ISO[row.symbol]
    if (!iso || seen.has(iso)) continue

    const pct = row[period]
    if (pct == null) continue

    seen.add(iso)
    result.push({
      isoA3: iso,
      label: row.label,
      changePct: pct,
    })
  }

  return result
}

export { SYMBOL_TO_ISO }
