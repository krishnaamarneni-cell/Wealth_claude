"use client"

import { useEffect, useRef } from "react"

function pctToColor(pct?: number): string {
  if (pct === undefined || pct === null) return "rgba(45,55,72,0.7)"
  if (pct >= 3) return "#16a34a"
  if (pct >= 2) return "#22c55e"
  if (pct >= 1) return "#4ade80"
  if (pct >= 0.3) return "#86efac"
  if (pct >= 0) return "#bbf7d0"
  if (pct >= -0.3) return "#fca5a5"
  if (pct >= -1) return "#f87171"
  if (pct >= -2) return "#ef4444"
  if (pct >= -3) return "#dc2626"
  return "#991b1b"
}

const NO_EXCHANGE = new Set([
  "AFG", "ALB", "DZA", "AND", "AGO", "ATG", "ARM", "AZE", "BHS", "BLR", "BLZ", "BEN",
  "BTN", "BOL", "BIH", "BWA", "BRN", "BFA", "BDI", "CPV", "KHM", "CMR", "CAF", "TCD", "COM",
  "COD", "COG", "CRI", "CIV", "CUB", "DJI", "DOM", "ECU", "SLV", "GNQ", "ERI", "SWZ", "ETH",
  "FJI", "GAB", "GMB", "GEO", "GRD", "GTM", "GIN", "GNB", "GUY", "HTI", "HND", "ISL",
  "IRN", "IRQ", "JAM", "KAZ", "KEN", "KIR", "KWT", "KGZ", "LAO", "LBN", "LSO", "LBR",
  "LBY", "LIE", "MDG", "MWI", "MDV", "MLI", "MLT", "MHL", "MRT", "MUS", "FSM", "MDA", "MCO",
  "MNG", "MNE", "MAR", "MOZ", "MMR", "NAM", "NRU", "NPL", "NIC", "NER", "NGA", "MKD",
  "OMN", "PAK", "PLW", "PSE", "PAN", "PNG", "PRY", "QAT", "RWA", "KNA", "LCA", "VCT", "WSM",
  "SMR", "STP", "SEN", "SRB", "SLE", "SVK", "SLB", "SOM", "SSD", "SDN", "SUR", "SYR", "TJK",
  "TZA", "TLS", "TGO", "TON", "TTO", "TUN", "TKM", "TUV", "UGA", "UKR", "URY", "UZB", "VUT",
  "VEN", "YEM", "ZMB", "ZWE", "HRV", "BGR", "SVN", "CYP", "LUX", "IRL", "GRL", "FRO",
  "MAC", "NCL", "PYF", "PRI",
])

export function GlobeHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const hoveringRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || globeRef.current) return

    const load = async () => {
      if (!(window as any).Globe) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.30.0/dist/globe.gl.min.js"
          s.onload = () => res()
          s.onerror = () => rej()
          document.head.appendChild(s)
        })
      }

      let geoData: any
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
        )
        geoData = await res.json()
      } catch { return }

      let marketData: Record<string, { changePct: number }> = {}
      try {
        const res = await fetch("/api/market-data")
        const json = await res.json()
        marketData = json.data ?? {}
      } catch { /* show neutral if fetch fails */ }

      const GlobeGL = (window as any).Globe
      if (!GlobeGL || !containerRef.current) return

      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight

      const globe = GlobeGL()
        .width(W).height(H)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#4ade80")
        .atmosphereAltitude(0.25)
        .polygonsData(geoData.features ?? [])
        .polygonAltitude((feat: any) => {
          const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
          return iso === "USA" ? 0.02 : 0.006
        })
        .polygonCapColor((feat: any) => {
          const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
          if (NO_EXCHANGE.has(iso)) return "rgba(45,55,72,0.5)"
          const d = marketData[iso]
          return d ? pctToColor(d.changePct) : "rgba(45,55,72,0.5)"
        })
        .polygonSideColor(() => "rgba(10,15,25,0.6)")
        .polygonStrokeColor(() => "rgba(255,255,255,0.08)")
        .polygonsTransitionDuration(0)
        .onPolygonClick(() => { })

      globe(containerRef.current)
      globeRef.current = globe

      // ── Start pointed at USA ──
      globe.pointOfView({ lat: 38, lng: -97, altitude: 1.9 })

      setTimeout(() => {
        const controls = globe.controls()
        if (controls) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.5
          // Full 360° interaction enabled — user can drag freely
          controls.enableZoom = false
          controls.enablePan = false
          controls.enableRotate = true
          controls.enableDamping = true
          controls.dampingFactor = 0.08
        }
      }, 100)

      // ── Pause auto-rotate on hover, resume on leave ──
      const el = containerRef.current
      const onEnter = () => {
        hoveringRef.current = true
        const c = globeRef.current?.controls()
        if (c) c.autoRotate = false
      }
      const onLeave = () => {
        hoveringRef.current = false
        const c = globeRef.current?.controls()
        if (c) c.autoRotate = true
      }
      el.addEventListener("mouseenter", onEnter)
      el.addEventListener("mouseleave", onLeave)

      return () => {
        el.removeEventListener("mouseenter", onEnter)
        el.removeEventListener("mouseleave", onLeave)
      }
    }

    load().catch(() => { })

    const handleResize = () => {
      if (globeRef.current && containerRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "transparent", cursor: "grab" }}
    />
  )
}
