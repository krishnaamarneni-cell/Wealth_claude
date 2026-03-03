"use client"

import { useEffect, useRef, useState } from "react"
import GlobeGL from "globe.gl"
import { COUNTRY_INDEX_MAP } from "@/lib/countryIndexMap"
import { pctToColor } from "@/lib/colorScale"
import type { MarketDataPoint } from "@/lib/mockData"

interface GlobeWrapperProps {
  data: Record<string, MarketDataPoint>
  onCountrySelect: (iso: string | null, name: string | null) => void
  selectedCountry: string | null
}

export function GlobeWrapper({ data, onCountrySelect, selectedCountry }: GlobeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [geoData, setGeoData] = useState<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Fetch geojson data
    fetch("https://cdn.jsdelivr.net/npm/natural-earth-110m@2/countries-110m.json")
      .then(res => res.json())
      .then(data => {
        const countries = data.objects.countries.geometries
        setGeoData(countries)

        // Initialize globe
        const globe = GlobeGL()
          .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
          .bumpImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
          .polygonsData(countries)
          .polygonAltitude(feat => {
            const isoNum = data.objects.countries.id.geometry[countries.indexOf(feat)]
            // Lookup country by ISO number
            const countryIso = Object.entries(COUNTRY_INDEX_MAP).find(([_, info]) => {
              // Simplified lookup - in production you'd use a proper ISO number map
              return true
            })?.[0]
            
            if (countryIso && data[countryIso]) {
              const pct = data[countryIso].changePct ?? 0
              return Math.abs(pct) / 100
            }
            return 0
          })
          .polygonCapColor(feat => {
            // Similar lookup logic
            return "#4a90e2"
          })
          .polygonSideColor(() => "rgba(255, 100, 100, 0.15)")
          .polygonStrokeColor(() => "#111")
          .onPolygonClick(feat => {
            // Handle country selection
            onCountrySelect(null, null)
          })
          .width(containerRef.current?.clientWidth)
          .height(containerRef.current?.clientHeight)

        globe.scene().add(globe)
        globeRef.current = globe

        // Handle window resize
        const handleResize = () => {
          if (containerRef.current && globeRef.current) {
            globeRef.current
              .width(containerRef.current.clientWidth)
              .height(containerRef.current.clientHeight)
          }
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
      })
  }, [data, onCountrySelect])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-[#060a10] rounded-lg overflow-hidden"
    />
  )
}
