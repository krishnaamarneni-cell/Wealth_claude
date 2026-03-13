"use client"

import { useEffect, useRef } from "react"
import { MarketDataMap } from "@/lib/mockData"
import { pctToColor } from "@/lib/colorScale"
import { NO_EXCHANGE_COUNTRIES } from "@/lib/countryIndexMap"

interface FlatMapWrapperProps {
  marketData: MarketDataMap
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null, name: string | null) => void
}

const LEAFLET_OVERRIDES = `
  .leaflet-container { background: #060a10 !important; }
  /* Remove the white click/focus box */
  .leaflet-interactive:focus { outline: none !important; }
  path.leaflet-interactive:focus { outline: none !important; }
  /* Tooltip styling */
  .wc-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .wc-tooltip .leaflet-tooltip-tip { display: none !important; }
  /* Zoom controls */
  .leaflet-control-zoom a {
    background: #0d1117 !important;
    color: rgba(255,255,255,0.5) !important;
    border-color: rgba(255,255,255,0.1) !important;
  }
  .leaflet-control-zoom a:hover { background: #1a2030 !important; color: white !important; }
`

export function FlatMapWrapper({ marketData, selectedCountry, onCountrySelect }: FlatMapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoDataRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    if (mapRef.current) return

    if (!document.getElementById("wc-leaflet-overrides")) {
      const style = document.createElement("style")
      style.id = "wc-leaflet-overrides"
      style.textContent = LEAFLET_OVERRIDES
      document.head.appendChild(style)
    }

    const init = async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"; link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          s.onload = () => res(); s.onerror = () => rej(new Error("Leaflet load failed"))
          document.head.appendChild(s)
        })
      }

      const L = (window as any).L
      if (!L || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [25, 15],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
        // Only restrict latitude so user can't pan off top/bottom
        maxBounds: [[-80, -Infinity], [85, Infinity]],
        maxBoundsViscosity: 0.8,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 6 }).addTo(map)
      L.control.zoom({ position: "bottomright" }).addTo(map)
      mapRef.current = map

      let geoData: any
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
        )
        geoData = await res.json()
      } catch { console.error("FlatMap: GeoJSON failed"); return }

      geoDataRef.current = geoData
      renderAll(L, map, geoData, marketData, selectedCountry, onCountrySelect)
    }

    init().catch(console.error)

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; geoDataRef.current = null }
    }
  }, [])

  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current || !geoDataRef.current) return
    renderAll(L, mapRef.current, geoDataRef.current, marketData, selectedCountry, onCountrySelect)
  }, [marketData, selectedCountry])

  return (
    <div style={{ width: "100%", height: "100%", background: "#060a10" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#060a10" }} />
    </div>
  )
}

// Shift all coordinates in a GeoJSON feature by lngOffset
function shiftFeature(feat: any, lngOffset: number): any {
  if (lngOffset === 0) return feat
  const shiftCoord = (c: number[]) => [c[0] + lngOffset, c[1]]
  const shiftRing = (ring: number[][]) => ring.map(shiftCoord)
  const shiftPoly = (poly: number[][][]) => poly.map(shiftRing)
  const geom = feat.geometry
  let geometry: any
  if (geom.type === "Polygon") {
    geometry = { ...geom, coordinates: shiftPoly(geom.coordinates) }
  } else if (geom.type === "MultiPolygon") {
    geometry = { ...geom, coordinates: geom.coordinates.map(shiftPoly) }
  } else {
    geometry = geom
  }
  return { ...feat, geometry }
}

function renderAll(
  L: any, map: any, geoData: any,
  marketData: MarketDataMap, selectedCountry: string | null,
  onCountrySelect: (iso: string | null, name: string | null) => void,
) {
  // Remove old layers
  if ((map as any)._wcLayers) {
    for (const l of (map as any)._wcLayers) map.removeLayer(l)
  }

  const allLayers: any[] = []

  // Render polygons at -360, 0, +360 for seamless infinite panning
  for (const offset of [-360, 0, 360]) {
    const layer = buildGeoLayer(L, geoData, offset, marketData, selectedCountry, onCountrySelect)
    layer.addTo(map)
    allLayers.push(layer)
  }

  ; (map as any)._wcLayers = allLayers

}

function buildGeoLayer(
  L: any, geoData: any, lngOffset: number,
  marketData: MarketDataMap, selectedCountry: string | null,
  onCountrySelect: (iso: string | null, name: string | null) => void,
) {
  const shiftedFeatures = geoData.features.map((f: any) => shiftFeature(f, lngOffset))
  const shiftedGeo = { ...geoData, features: shiftedFeatures }

  const layer: any = L.geoJSON(shiftedGeo, {
    style: (feat: any) => {
      const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
      const isSelected = iso === selectedCountry
      const noExchange = NO_EXCHANGE_COUNTRIES.has(iso)
      const d = marketData[iso]
      const fillColor = noExchange || !d ? "#1e2533" : pctToColor(d.changePct)
      return {
        fillColor,
        fillOpacity: isSelected ? 0.85 : noExchange ? 0.55 : 0.78,
        color: isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)",
        weight: isSelected ? 2 : 0.5,
        opacity: 1,
      }
    },
    onEachFeature: (feat: any, fl: any) => {
      const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
      const name = feat.properties?.ADMIN ?? feat.properties?.NAME ?? iso
      const d = marketData[iso]

      // Tooltip
      const tooltipHtml = d
        ? (() => {
          const pct = d.changePct; const col = pctToColor(pct); const sign = pct >= 0 ? "+" : ""
          return `<div style="background:#0d1117;border:1px solid ${col}50;border-radius:10px;padding:10px 14px;font-family:system-ui,sans-serif;min-width:160px;box-shadow:0 4px 24px rgba(0,0,0,0.8)">
              <div style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${name}</div>
              <div style="color:white;font-size:12px;font-weight:700;margin-bottom:3px">${d.indexName}</div>
              <div style="color:${col};font-size:16px;font-weight:800">${sign}${pct.toFixed(2)}%</div>
            </div>`
        })()
        : `<div style="background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;font-family:system-ui,sans-serif">
             <div style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:1px">${name}</div>
             <div style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:3px">No exchange data</div>
           </div>`

      fl.bindTooltip(tooltipHtml, { sticky: true, opacity: 1, className: "wc-tooltip" })

      fl.on("click", () => {
        if (NO_EXCHANGE_COUNTRIES.has(iso) || !d) onCountrySelect(null, null)
        else onCountrySelect(iso, name)
      })
      fl.on("mouseover", () => {
        if (iso !== selectedCountry) fl.setStyle({ fillOpacity: 1, weight: 1.2, color: "rgba(255,255,255,0.3)" })
      })
      fl.on("mouseout", () => layer.resetStyle(fl))
    },
  })

  return layer
}
