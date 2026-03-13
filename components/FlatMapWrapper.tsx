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

export function FlatMapWrapper({ marketData, selectedCountry, onCountrySelect }: FlatMapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const geoDataRef = useRef<any>(null)

  // Load Leaflet CSS + JS via CDN then initialize
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    if (mapRef.current) return // already initialized

    const initLeaflet = async () => {
      // Inject Leaflet CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS if not already loaded
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          s.onload = () => res()
          s.onerror = () => rej(new Error("Leaflet CDN load failed"))
          document.head.appendChild(s)
        })
      }

      const L = (window as any).L
      if (!L || !containerRef.current) return

      // Init map — dark tiles, zoom controls bottom-right
      const map = L.map(containerRef.current, {
        center: [20, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      })

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 6 }
      ).addTo(map)

      // Custom zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map)

      mapRef.current = map

      // Load GeoJSON
      let geoData: any
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
        )
        geoData = await res.json()
      } catch {
        console.error("FlatMap: GeoJSON load failed")
        return
      }

      geoDataRef.current = geoData
      renderLayer(L, map, geoData, marketData, selectedCountry, onCountrySelect)
    }

    initLeaflet().catch(console.error)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        layerRef.current = null
      }
    }
  }, [])

  // Re-render layer when market data changes
  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current || !geoDataRef.current) return
    renderLayer(L, mapRef.current, geoDataRef.current, marketData, selectedCountry, onCountrySelect)
  }, [marketData, selectedCountry])

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" style={{ background: "#060a10" }} />
      {/* Attribution */}
      <div className="absolute bottom-2 left-2 z-[1000] text-[9px] text-white/15 pointer-events-none">
        © CartoDB © OpenStreetMap
      </div>
    </div>
  )
}

function renderLayer(
  L: any,
  map: any,
  geoData: any,
  marketData: MarketDataMap,
  selectedCountry: string | null,
  onCountrySelect: (iso: string | null, name: string | null) => void,
) {
  // Remove old layer
  if ((map as any)._wcLayer) {
    map.removeLayer((map as any)._wcLayer)
  }

  const layer = L.geoJSON(geoData, {
    style: (feat: any) => {
      const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
      const isSelected = iso === selectedCountry
      const noExchange = NO_EXCHANGE_COUNTRIES.has(iso)
      const d = marketData[iso]
      const fillColor = noExchange || !d ? "#2d3748" : pctToColor(d.changePct)

      return {
        fillColor,
        fillOpacity: isSelected ? 0.95 : noExchange ? 0.5 : 0.75,
        color: isSelected ? "#ffffff" : "rgba(255,255,255,0.12)",
        weight: isSelected ? 1.5 : 0.5,
        opacity: 1,
      }
    },

    onEachFeature: (feat: any, featureLayer: any) => {
      const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
      const name = feat.properties?.ADMIN ?? feat.properties?.NAME ?? iso
      const d = marketData[iso]

      // Tooltip
      if (d) {
        const pct = d.changePct
        const col = pctToColor(pct)
        const sign = pct >= 0 ? "+" : ""
        featureLayer.bindTooltip(
          `<div style="
            background:#0d1117;
            border:1px solid ${col}40;
            border-radius:10px;
            padding:10px 14px;
            font-family:system-ui,sans-serif;
            min-width:160px;
            box-shadow:0 4px 20px ${col}20;
          ">
            <div style="color:rgba(255,255,255,0.45);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${name}</div>
            <div style="color:white;font-size:13px;font-weight:700;margin-bottom:2px">${d.indexName}</div>
            <div style="color:${col};font-size:15px;font-weight:800">${sign}${pct.toFixed(2)}%</div>
          </div>`,
          { sticky: true, opacity: 1, className: "wc-tooltip" }
        )
      } else {
        featureLayer.bindTooltip(
          `<div style="
            background:#1a2030;
            border:1px solid rgba(255,255,255,0.1);
            border-radius:8px;
            padding:8px 12px;
            font-family:system-ui,sans-serif;
          ">
            <div style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:1px">${name}</div>
            <div style="color:rgba(255,255,255,0.25);font-size:11px;margin-top:2px">No exchange data</div>
          </div>`,
          { sticky: true, opacity: 1, className: "wc-tooltip" }
        )
      }

      // Click handler
      featureLayer.on("click", () => {
        if (NO_EXCHANGE_COUNTRIES.has(iso) || !d) {
          onCountrySelect(null, null)
        } else {
          onCountrySelect(iso, name)
        }
      })

      // Hover highlight
      featureLayer.on("mouseover", () => {
        if (iso !== selectedCountry) {
          featureLayer.setStyle({ fillOpacity: 0.92, weight: 1, color: "rgba(255,255,255,0.3)" })
        }
      })
      featureLayer.on("mouseout", () => {
        layer.resetStyle(featureLayer)
      })
    },
  })

  layer.addTo(map)
    ; (map as any)._wcLayer = layer
}
