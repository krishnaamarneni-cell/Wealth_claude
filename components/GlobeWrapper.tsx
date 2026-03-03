"use client"

import { useEffect, useRef, useState } from "react"
import GlobeGL from "globe.gl"
import { COUNTRY_INDEX_MAP } from "@/lib/countryIndexMap"
import { pctToColor } from "@/lib/colorScale"
import type { MarketDataPoint } from "@/lib/mockData"

interface GlobeWrapperProps {
  marketData: Record<string, MarketDataPoint>
  onCountrySelect: (iso: string | null, name: string | null) => void
  selectedCountry: string | null
}

export function GlobeWrapper({ marketData, onCountrySelect, selectedCountry }: GlobeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [geoData, setGeoData] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!containerRef.current || isInitialized) return

    // Fetch geojson data
    fetch("https://cdn.jsdelivr.net/npm/natural-earth-110m@2/countries-110m.json")
      .then(res => res.json())
      .then(data => {
        const countries = data.objects.countries.geometries
        setGeoData(countries)

        // Delay initialization to ensure DOM is mounted with dimensions
        const initTimeout = setTimeout(() => {
          if (!containerRef.current) return

          let width = containerRef.current.clientWidth
          let height = containerRef.current.clientHeight

          // Fallback to window dimensions if container has 0 dimensions
          if (width === 0 || height === 0) {
            width = window.innerWidth
            height = window.innerHeight
            console.log("[v0] Container was 0x0, using window dimensions:", { width, height })
          }

          console.log("[v0] Container dimensions:", { width, height })

          // Initialize globe
          const globe = GlobeGL()
            .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
            .bumpImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
            .polygonsData(countries)
            .polygonAltitude(feat => {
              const countryIso = Object.keys(COUNTRY_INDEX_MAP).find(iso => {
                const info = COUNTRY_INDEX_MAP[iso]
                return info && marketData[iso]
              })
              
              if (countryIso && marketData[countryIso]) {
                const pct = marketData[countryIso].changePct ?? 0
                return Math.max(0.01, Math.abs(pct) / 100)
              }
              return 0.001
            })
            .polygonCapColor(feat => {
              // Find matching country in our data
              const countryIso = Object.keys(COUNTRY_INDEX_MAP).find(iso => {
                return marketData[iso]
              })
              
              if (countryIso && marketData[countryIso]) {
                const pct = marketData[countryIso].changePct ?? 0
                return pctToColor(pct)
              }
              return "#374151"
            })
            .polygonSideColor(() => "rgba(255, 100, 100, 0.15)")
            .polygonStrokeColor(() => "#111")
            .onPolygonClick(feat => {
              // Handle country selection - find the country that was clicked
              const countryIso = Object.keys(COUNTRY_INDEX_MAP).find(iso => {
                return marketData[iso]
              })
              
              if (countryIso) {
                const countryName = COUNTRY_INDEX_MAP[countryIso]?.name ?? countryIso
                onCountrySelect(countryIso, countryName)
              }
            })
            .width(width)
            .height(height)

          // Properly render globe to container
          globe(containerRef.current)
          globeRef.current = globe

          console.log("[v0] Globe initialized successfully", { 
            hasGlobe: !!globe, 
            containerWidth: containerRef.current?.clientWidth,
            containerHeight: containerRef.current?.clientHeight,
            setWidth: width,
            setHeight: height
          })
          
          // Auto-rotate
          globe.controls().autoRotate = true
          globe.controls().autoRotateSpeed = 0.5

          // Handle window resize
          const handleResize = () => {
            if (containerRef.current && globeRef.current) {
              const newWidth = containerRef.current.clientWidth
              const newHeight = containerRef.current.clientHeight
              globeRef.current
                .width(newWidth)
                .height(newHeight)
              console.log("[v0] Globe resized", { width: newWidth, height: newHeight })
            }
          }

          window.addEventListener("resize", handleResize)
          setIsInitialized(true)

          return () => window.removeEventListener("resize", handleResize)
        }, 500) // 500ms delay for DOM to fully mount and layout to settle

        return () => clearTimeout(initTimeout)
      })
      .catch(err => console.error("[v0] Failed to load geojson:", err))
  }, [marketData, onCountrySelect, isInitialized])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        height: "100%",
        position: "relative"
      }}
      className="bg-[#060a10] rounded-lg overflow-hidden"
    />
  )
}
