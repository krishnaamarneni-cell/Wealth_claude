"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { MarketDataMap } from "@/lib/mockData"
import { pctToColor } from "@/lib/colorScale"
import { NO_EXCHANGE_COUNTRIES } from "@/lib/countryIndexMap"

interface GlobeWrapperProps {
  marketData: MarketDataMap
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null, name: string | null) => void
}

export function GlobeWrapper({ marketData, selectedCountry, onCountrySelect }: GlobeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const isInitRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── INIT ────────────────────────────────────────────────
  useEffect(() => {
    if (isInitRef.current || !containerRef.current) return
    isInitRef.current = true

    const init = async () => {
      try {
        // ── 1. Load GeoJSON ──────────────────────────────
        let geoFeatures: any[] = []
        const URLS = [
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
          "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
        ]
        for (const url of URLS) {
          try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`${res.status}`)
            const data = await res.json()
            if (data?.features?.length) { geoFeatures = data.features; break }
          } catch { continue }
        }

        // ── 2. Import Globe.gl ───────────────────────────
        const GlobeGL = (await import("globe.gl")).default

        const W = containerRef.current!.clientWidth || window.innerWidth
        const H = containerRef.current!.clientHeight || window.innerHeight

        // ── 3. Build globe ───────────────────────────────
        const globe = GlobeGL()

        globe
          .width(W)
          .height(H)
          // Deep space blue background
          .backgroundColor("#020c1b")
          // Blue marble Earth texture — real ocean color
          .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
          .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
          // Blue atmosphere glow
          .atmosphereColor("#1e6fa8")
          .atmosphereAltitude(0.22)
          // Countries
          .polygonsData(geoFeatures)
          .polygonAltitude((feat: any) => getISO(feat) === selectedCountry ? 0.08 : 0.006)
          .polygonCapColor((feat: any) => {
            const iso = getISO(feat)
            if (!iso || NO_EXCHANGE_COUNTRIES.has(iso)) return "rgba(38,55,78,0.55)"
            const d = marketData[iso]
            return d ? pctToColor(d.changePct) : "rgba(38,55,78,0.55)"
          })
          .polygonSideColor(() => "rgba(5,18,38,0.9)")
          .polygonStrokeColor(() => "rgba(100,160,220,0.22)")
          // Hover tooltip
          .polygonLabel((feat: any) => {
            const iso = getISO(feat)
            const name = getName(feat)
            const d = marketData[iso]
            if (!d) return tooltip(name, null, null, null)
            return tooltip(name, d.indexName, d.changePct, pctToColor(d.changePct))
          })
          // Click handler
          .onPolygonClick((feat: any) => {
            const iso = getISO(feat)
            const name = getName(feat)
            if (!iso || NO_EXCHANGE_COUNTRIES.has(iso) || !marketData[iso]) {
              onCountrySelect(null, null)
            } else {
              onCountrySelect(iso, name)
            }
          })
          // Hover: raise hovered country
          .onPolygonHover((hFeat: any) => {
            globe.polygonAltitude((feat: any) => {
              const iso = getISO(feat)
              if (iso === selectedCountry) return 0.08
              if (hFeat && getISO(hFeat) === iso) return 0.035
              return 0.006
            })
          })

        // ── 4. Mount to DOM ──────────────────────────────
        globe(containerRef.current!)
        globeRef.current = globe

        // Initial view — Atlantic, shows most of the world
        globe.pointOfView({ lat: 20, lng: -20, altitude: 2.4 })

        // Controls
        const ctrl = globe.controls()
        ctrl.autoRotate = true
        ctrl.autoRotateSpeed = 0.4
        ctrl.enableDamping = true
        ctrl.dampingFactor = 0.08
        ctrl.minDistance = 110
        ctrl.maxDistance = 700

        // Set renderer clear color to deep space blue
        const renderer = globe.renderer()
        if (renderer) {
          renderer.setClearColor(new THREE.Color("#020c1b"), 1)
        }

        // ── 5. Stars + nebula — wait 2 frames for scene ─
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const scene = globe.scene()
          if (scene) {
            buildStarField(scene)
            buildNebula(scene)
          }
        }))

        setLoading(false)

      } catch (e: any) {
        setError(e?.message ?? "Globe failed to initialize")
        setLoading(false)
      }
    }

    const t = setTimeout(init, 200)
    return () => clearTimeout(t)
  }, [])

  // ─── SELECTED COUNTRY ────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.polygonAltitude((feat: any) =>
      getISO(feat) === selectedCountry ? 0.08 : 0.006
    )
    const ctrl = globeRef.current.controls()
    ctrl.autoRotate = !selectedCountry
  }, [selectedCountry])

  // ─── RESIZE ──────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (globeRef.current && containerRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  if (error) return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-3 bg-[#020c1b]">
      <div className="text-red-400 text-sm">Globe failed to load</div>
      <div className="text-white/20 text-xs max-w-xs text-center">{error}</div>
    </div>
  )

  return (
    <div className="w-full h-full relative bg-[#020c1b]">
      {loading && (
        <div className="absolute inset-0 z-10 bg-[#020c1b] flex flex-col items-center justify-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-blue-400/40 animate-spin" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-4 rounded-full bg-blue-500/15 animate-pulse" />
          </div>
          <span className="text-blue-400/50 text-[11px] tracking-widest uppercase">Loading Globe</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────
function getISO(feat: any): string {
  return feat?.properties?.ADM0_A3
    ?? feat?.properties?.ISO_A3
    ?? feat?.properties?.iso_a3
    ?? ""
}
function getName(feat: any): string {
  return feat?.properties?.ADMIN
    ?? feat?.properties?.NAME
    ?? feat?.properties?.name
    ?? "Unknown"
}
function tooltip(name: string, index: string | null, pct: number | null, color: string | null): string {
  if (!index || pct == null) return `
    <div style="background:rgba(2,12,27,0.96);border:1px solid rgba(100,160,220,0.15);border-radius:10px;padding:9px 13px;font-family:system-ui,sans-serif">
      <div style="color:rgba(255,255,255,0.35);font-size:10px;text-transform:uppercase;letter-spacing:1px">${name}</div>
      <div style="color:rgba(255,255,255,0.18);font-size:11px;margin-top:2px">No exchange data</div>
    </div>`
  const sign = pct >= 0 ? "+" : ""
  return `
    <div style="background:rgba(2,12,27,0.96);border:1px solid ${color}45;border-radius:10px;padding:10px 14px;font-family:system-ui,sans-serif;min-width:148px;box-shadow:0 6px 28px ${color}20">
      <div style="color:rgba(255,255,255,0.38);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${name}</div>
      <div style="color:rgba(255,255,255,0.88);font-size:12px;font-weight:700;margin-bottom:4px">${index}</div>
      <div style="color:${color};font-size:17px;font-weight:800;letter-spacing:-0.5px">${sign}${pct.toFixed(2)}%</div>
    </div>`
}

// ─── STAR FIELD ──────────────────────────────────────────────
function buildStarField(scene: THREE.Scene) {
  const existing = scene.getObjectByName("wc_stars")
  if (existing) scene.remove(existing)

  const COUNT = 9000
  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const sizes = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 900 + Math.random() * 500

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    // Star color variety
    const t = Math.random()
    if (t < 0.55) {
      // White
      colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1
    } else if (t < 0.75) {
      // Ice blue
      colors[i * 3] = 0.68; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1
    } else if (t < 0.90) {
      // Warm yellow
      colors[i * 3] = 1; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 0.65
    } else {
      // Bright blue-white
      colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.90; colors[i * 3 + 2] = 1
    }

    // Varied sizes — most small, few bright large ones
    sizes[i] = t > 0.97 ? 3.5 : t > 0.92 ? 2.2 : Math.random() * 1.2 + 0.3
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  })

  const stars = new THREE.Points(geo, mat)
  stars.name = "wc_stars"
  scene.add(stars)
}

// ─── NEBULA ───────────────────────────────────────────────────
function buildNebula(scene: THREE.Scene) {
  const existing = scene.getObjectByName("wc_nebula")
  if (existing) scene.remove(existing)

  // Paint soft deep-blue nebula glow on canvas
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  // Primary glow — deep blue center
  const g1 = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  g1.addColorStop(0, "rgba(8, 40, 130, 0.40)")
  g1.addColorStop(0.35, "rgba(4, 22,  80, 0.22)")
  g1.addColorStop(0.65, "rgba(2, 10,  45, 0.10)")
  g1.addColorStop(1, "rgba(0,  0,   0, 0)")
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, 512, 512)

  // Secondary off-center cyan tint
  const g2 = ctx.createRadialGradient(340, 180, 0, 340, 180, 200)
  g2.addColorStop(0, "rgba(0, 80, 160, 0.18)")
  g2.addColorStop(0.5, "rgba(0, 40,  90, 0.08)")
  g2.addColorStop(1, "rgba(0,  0,   0, 0)")
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, 512, 512)

  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.9,
  })
  const sprite = new THREE.Sprite(mat)
  sprite.name = "wc_nebula"
  sprite.scale.set(2200, 2200, 1)
  sprite.position.set(0, 0, -800)
  scene.add(sprite)
}
