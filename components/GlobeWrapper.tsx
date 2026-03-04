"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MarketDataMap } from "@/lib/mockData"
import { pctToColor, pctToGlow } from "@/lib/colorScale"
import { NO_EXCHANGE_COUNTRIES } from "@/lib/countryIndexMap"

interface GlobeWrapperProps {
  marketData: MarketDataMap
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null, name: string | null) => void
  showShips?: boolean
}

export function GlobeWrapper({ marketData, selectedCountry, onCountrySelect, showShips = false }: GlobeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [introPlaying, setIntroPlaying] = useState(true)
  const introRef = useRef(false)
  const [routes, setRoutes] = useState<any[]>([])
  const routesLoadedRef = useRef(false)

  // Just set ready — globe.gl loaded via npm dynamic import
  useEffect(() => {
    if (typeof window === "undefined") return
    setIsReady(true)
  }, [])

  // Load GeoJSON + init globe
  useEffect(() => {
    if (!isReady || !containerRef.current || globeRef.current) return

    const init = async () => {
      // Fetch GeoJSON
      let geoData: any
      try {
        const res = await fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
        geoData = await res.json()
      } catch {
        geoData = { type: "FeatureCollection", features: [] }
      }

      const marketFeatures = (geoData.features ?? []).filter((feat: any) => {
        const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
        return marketData[iso] !== undefined
      })

      const { default: GlobeGL } = await import("globe.gl")
      if (!GlobeGL || !containerRef.current) return

      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight

      const globe = GlobeGL()
        .width(W)
        .height(H)
        .backgroundColor("#000000")
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#2389da")
        .atmosphereAltitude(0.22)
        .htmlElementsData([])
        .htmlElement((feat: any) => {
          const name = feat.properties?.ADMIN ?? feat.properties?.NAME ?? ""
          const el = document.createElement("div")
          el.style.cssText = `
            color: rgba(255,255,255,0.75);
            font-size: 10px;
            font-family: system-ui, sans-serif;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-shadow: 0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7);
            pointer-events: none;
            white-space: nowrap;
            user-select: none;
          `
          el.textContent = name
          return el
        })
        .htmlLat((feat: any) => {
          const coords = feat.geometry?.coordinates
          if (!coords) return 0
          const ring = feat.geometry.type === "MultiPolygon" ? coords[0][0] : coords[0]
          const lats = ring.map((c: number[]) => c[1])
          return lats.reduce((a: number, b: number) => a + b, 0) / lats.length
        })
        .htmlLng((feat: any) => {
          const coords = feat.geometry?.coordinates
          if (!coords) return 0
          const ring = feat.geometry.type === "MultiPolygon" ? coords[0][0] : coords[0]
          const lngs = ring.map((c: number[]) => c[0])
          return lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
        })
        .htmlAltitude(0.04)
        .htmlTransitionDuration(0)
        .polygonsData(geoData.features ?? [])
        .polygonAltitude((feat: any) => {
          const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3
          return iso === selectedCountry ? 0.08 : 0.006
        })
        .polygonCapColor((feat: any) => {
          const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
          if (NO_EXCHANGE_COUNTRIES.has(iso)) return "rgba(45,55,72,0.7)"
          const d = marketData[iso]
          return pctToColor(d?.changePct)
        })
        .polygonSideColor(() => "rgba(10,15,25,0.8)")
        .polygonStrokeColor(() => "rgba(255,255,255,0.15)")
        .polygonLabel((feat: any) => {
          const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
          const name = feat.properties?.ADMIN ?? feat.properties?.NAME ?? iso
          const d = marketData[iso]
          if (!d) return `<div style="background:#1a2030;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;font-family:sans-serif;min-width:140px"><div style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:1px">${name}</div><div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:2px">No exchange data</div></div>`
          const pct = d.changePct
          const col = pctToColor(pct)
          const sign = pct >= 0 ? "+" : ""
          return `<div style="background:#0d1117;border:1px solid ${col}40;border-radius:10px;padding:10px 14px;font-family:sans-serif;min-width:160px;box-shadow:0 4px 20px ${col}30"><div style="color:rgba(255,255,255,0.45);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${name}</div><div style="color:white;font-size:13px;font-weight:700;margin-bottom:2px">${d.indexName}</div><div style="color:${col};font-size:15px;font-weight:800">${sign}${pct.toFixed(2)}%</div></div>`
        })
        .onPolygonClick((feat: any) => {
          const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
          const name = feat.properties?.ADMIN ?? feat.properties?.NAME ?? iso
          if (NO_EXCHANGE_COUNTRIES.has(iso) || !marketData[iso]) {
            onCountrySelect(null, null)
          } else {
            onCountrySelect(iso, name)
          }
        })
        .pointsData([])
        .pointLat((s: any) => s.lat)
        .pointLng((s: any) => s.lng)
        .pointAltitude(0.005)
        .pointRadius(0.4)
        .pointResolution(4)
        .pointColor((s: any) => {
          const t = s.type
          if (t === 1 || t === 2 || t === 3) return "#22d3ee"
          if (t === 5) return "#f97316"
          if (t === 8) return "#a855f7"
          return "#60a5fa"
        })
        .pointLabel((s: any) => `
          <div style="background:rgba(2,12,27,0.95);border:1px solid rgba(100,160,220,0.3);border-radius:8px;padding:8px 12px;font-family:system-ui,sans-serif;min-width:140px">
            <div style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700">${s.name}</div>
            <div style="color:#60a5fa;font-size:10px">Speed: ${s.speed?.toFixed(1)} kn</div>
          </div>
        `)
        .onPolygonHover((feat: any) => {
          if (feat) {
            const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
            setHoveredCountry(iso)
          } else {
            setHoveredCountry(null)
          }
          globe.polygonAltitude((f: any) => {
            const iso2 = f.properties?.ADM0_A3 ?? f.properties?.ISO_A3
            if (iso2 === selectedCountry) return 0.08
            if (feat && (feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3) === iso2) return 0.04
            return 0.006
          })
        })

      globe.pointOfView({ lat: 20, lng: 10, altitude: 2.2 })
      globe(containerRef.current)
      globeRef.current = globe

      setTimeout(() => {
        const controls = globe.controls()
        if (controls) {
          controls.autoRotate = false
          controls.enableDamping = true
          controls.enabled = false
        }
      }, 100)

      window.addEventListener("skipGlobeIntro", () => {
        introRef.current = true
        globeRef.current?.pointOfView({ lat: 38, lng: -97, altitude: 1.5 })
        const controls = globeRef.current?.controls()
        if (controls) {
          controls.enabled = true
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.35
        }
        setIntroPlaying(false)
      }, { once: true })

      // ── CINEMATIC INTRO ──────────────────────────────────
      setTimeout(() => {
        if (introRef.current) return
        introRef.current = true

        const DURATION = 7000
        const start = performance.now()

        const KEYFRAMES = [
          { t: 0.00, lat: 10, lng: 20, alt: 12.0 },
          { t: 0.15, lat: 15, lng: 10, alt: 10.0 },
          { t: 0.30, lat: 20, lng: 5, alt: 7.5 },
          { t: 0.45, lat: 25, lng: -5, alt: 5.5 },
          { t: 0.60, lat: 30, lng: -15, alt: 4.0 },
          { t: 0.72, lat: 35, lng: -30, alt: 3.0 },
          { t: 0.82, lat: 40, lng: -50, alt: 2.2 },
          { t: 0.90, lat: 42, lng: -80, alt: 1.8 },
          { t: 0.96, lat: 40, lng: -95, alt: 1.6 },
          { t: 1.00, lat: 38, lng: -97, alt: 1.5 },
        ]

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t
        const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        const tick = (now: number) => {
          const elapsed = now - start
          const rawT = Math.min(elapsed / DURATION, 1)
          const t = ease(rawT)

          let k0 = KEYFRAMES[0]
          let k1 = KEYFRAMES[KEYFRAMES.length - 1]
          for (let i = 0; i < KEYFRAMES.length - 1; i++) {
            if (t >= KEYFRAMES[i].t && t <= KEYFRAMES[i + 1].t) {
              k0 = KEYFRAMES[i]; k1 = KEYFRAMES[i + 1]; break
            }
          }

          const span = k1.t - k0.t || 0.001
          const localT = Math.min((t - k0.t) / span, 1)
          globe.pointOfView({
            lat: lerp(k0.lat, k1.lat, localT),
            lng: lerp(k0.lng, k1.lng, localT),
            altitude: lerp(k0.alt, k1.alt, localT),
          })

          if (rawT < 1) {
            requestAnimationFrame(tick)
          } else {
            const controls = globe.controls()
            if (controls) {
              controls.enabled = true
              controls.autoRotate = true
              controls.autoRotateSpeed = 0.35
            }
            globe
              .htmlElementsData(marketFeatures)
              .htmlElement((feat: any) => {
                const name = feat.properties?.ADMIN ?? feat.properties?.NAME ?? ""
                const el = document.createElement("div")
                el.style.cssText = `
                  color: rgba(255,255,255,0.75);
                  font-size: 10px;
                  font-family: system-ui, sans-serif;
                  font-weight: 600;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  text-shadow: 0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7);
                  pointer-events: none;
                  white-space: nowrap;
                  user-select: none;
                `
                el.textContent = name
                return el
              })
            setIntroPlaying(false)
          }
        }

        requestAnimationFrame(tick)
      }, 800)

      // ── Stars + planets + orbiters ── KEY FIX: no window.THREE check
      setTimeout(() => {
        try {
          const scene = globe.scene()
          if (scene) {
            addStars(scene)
            addPlanets(scene)
            addOrbiters(scene)
          }
        } catch (e) {
          console.error("Scene setup error:", e)
        }
      }, 500)
    }

    init().catch(console.error)
  }, [isReady, marketData])

  // Update selected country altitude
  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.polygonAltitude((feat: any) => {
      const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3
      return iso === selectedCountry ? 0.08 : 0.006
    })
    if (selectedCountry) {
      const controls = globeRef.current.controls()
      if (controls) controls.autoRotate = false
    }
  }, [selectedCountry])

  // Ships toggle
  useEffect(() => {
    if (!isReady) return
    if (!showShips) {
      globeRef.current?.pointsData([])
      return
    }
    if (routesLoadedRef.current && routes.length > 0) {
      globeRef.current?.pointsData(routes)
      return
    }
    const fetchShips = async () => {
      try {
        const res = await fetch("/api/ships")
        const json = await res.json()
        if (json.ships?.length) {
          routesLoadedRef.current = true
          setRoutes(json.ships)
          globeRef.current?.pointsData(json.ships)
        }
      } catch { /* silent */ }
    }
    fetchShips()
  }, [showShips, isReady])

  useEffect(() => {
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

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
        Failed to load globe: {loadError}
      </div>
    )
  }

  const skipIntro = () => {
    introRef.current = true
    globeRef.current?.pointOfView({ lat: 38, lng: -97, altitude: 1.5 })
    const controls = globeRef.current?.controls()
    if (controls) {
      controls.enabled = true
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.35
    }
    setIntroPlaying(false)
  }

  return (
    <div className="w-full h-full relative bg-black">

      {introPlaying && isReady && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-end pb-24">
          <div className="text-center animate-pulse">
            <div className="text-white/20 text-[10px] tracking-[0.4em] uppercase mb-1">WealthClaude</div>
            <div className="text-white/10 text-xs tracking-widest">Global Stock Markets</div>
          </div>
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-[#060a10]">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-spin" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-4 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <div className="text-white/40 text-sm font-medium tracking-widest uppercase">Loading Globe</div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      {/* Zoom controls */}
      {isReady && (
        <div style={{ position: "absolute", bottom: "24px", right: "16px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 20 }}>
          <button
            onClick={() => {
              const controls = globeRef.current?.controls?.()
              if (controls) { controls.dollyIn(1.3); controls.update() }
            }}
            style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >+</button>
          <button
            onClick={() => {
              const controls = globeRef.current?.controls?.()
              if (controls) { controls.dollyOut(1.3); controls.update() }
            }}
            style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >−</button>
        </div>
      )}
    </div>
  )
}

// ── PLANETS ──────────────────────────────────────────────────────────
function addPlanets(scene: THREE.Scene) {
  try {
    const PLANETS = [
      { name: "mercury", radius: 3.5, color: 0x9ca3af, x: 220, y: -60, z: -180, rotSpeed: 0.003, emissive: 0x4b5563, rings: false },
      { name: "venus", radius: 6, color: 0xe8c97e, x: -260, y: 40, z: -220, rotSpeed: 0.002, emissive: 0x92691a, rings: false },
      { name: "mars", radius: 5, color: 0xc1440e, x: 300, y: 80, z: -260, rotSpeed: 0.004, emissive: 0x7a1a00, rings: false },
      { name: "jupiter", radius: 28, color: 0xc88b3a, x: -380, y: -100, z: -400, rotSpeed: 0.007, emissive: 0x7a4a10, rings: false },
      { name: "saturn", radius: 22, color: 0xe4d090, x: 420, y: 120, z: -480, rotSpeed: 0.005, emissive: 0x8a7030, rings: true },
      { name: "uranus", radius: 14, color: 0x7de8e8, x: -480, y: 60, z: -560, rotSpeed: 0.003, emissive: 0x1a8080, rings: false },
      { name: "neptune", radius: 13, color: 0x3f54ba, x: 500, y: -80, z: -620, rotSpeed: 0.003, emissive: 0x1a2560, rings: false },
      { name: "moon", radius: 3, color: 0xd1d5db, x: 130, y: 30, z: -160, rotSpeed: 0.001, emissive: 0x4b5563, rings: false },
    ]

    const meshes: { mesh: THREE.Object3D, rotSpeed: number }[] = []

    for (const p of PLANETS) {
      const mat = new THREE.MeshPhongMaterial({ color: p.color, emissive: p.emissive, shininess: 15 })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 32, 32), mat)
      mesh.position.set(p.x, p.y, p.z)
      mesh.name = p.name
      scene.add(mesh)
      meshes.push({ mesh, rotSpeed: p.rotSpeed })

      if (p.rings) {
        const rMat = new THREE.MeshPhongMaterial({ color: 0xc8a95a, emissive: 0x5a3e10, transparent: true, opacity: 0.82, side: THREE.DoubleSide })
        const ring = new THREE.Mesh(new THREE.TorusGeometry(p.radius * 1.9, p.radius * 0.55, 2, 80), rMat)
        ring.rotation.x = Math.PI / 2.8
        ring.position.set(p.x, p.y, p.z)
        scene.add(ring)
        meshes.push({ mesh: ring, rotSpeed: p.rotSpeed * 0.4 })
      }

      // Glow sprite
      const gc = document.createElement("canvas"); gc.width = 128; gc.height = 128
      const gx = gc.getContext("2d")!
      const gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64)
      const gh = "#" + p.color.toString(16).padStart(6, "0")
      gg.addColorStop(0, gh + "33")
      gg.addColorStop(0.4, gh + "11")
      gg.addColorStop(1, "rgba(0,0,0,0)")
      gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128)
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
      glow.scale.set(p.radius * 6, p.radius * 6, 1)
      glow.position.set(p.x, p.y, p.z)
      scene.add(glow)
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.15))
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.8)
    sun.position.set(-600, 200, 400)
    scene.add(sun)

    const animate = () => {
      requestAnimationFrame(animate)
      meshes.forEach(({ mesh, rotSpeed }) => { mesh.rotation.y += rotSpeed })
    }
    animate()
  } catch (e) { console.error("Planets error:", e) }
}

// ── ISS + SATELLITES ──────────────────────────────────────────────────
function addOrbiters(scene: THREE.Scene) {
  try {
    const R = 100

    // ISS
    const issGroup = new THREE.Group()
    const metal = new THREE.MeshPhongMaterial({ color: 0xd0d8e8, emissive: 0x3a4a6a, shininess: 80 })
    issGroup.add(new THREE.Mesh(new THREE.BoxGeometry(8, 2, 2), metal))
    const panel = new THREE.MeshPhongMaterial({ color: 0x1a3a6a, emissive: 0x0a1a3a, shininess: 120 })
    const pL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 4), panel); pL.position.set(-11, 0, 0); issGroup.add(pL)
    const pR = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 4), panel); pR.position.set(11, 0, 0); issGroup.add(pR)
    issGroup.add(new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 0.5), new THREE.MeshPhongMaterial({ color: 0xb0b8c8, emissive: 0x2a3a4a })))
    scene.add(issGroup)

    // Satellite 1
    const s1 = new THREE.Group()
    s1.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshPhongMaterial({ color: 0xc8d0d8, emissive: 0x2a3040, shininess: 100 })))
    s1.add(new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 1.5), new THREE.MeshPhongMaterial({ color: 0x1a3060, emissive: 0x0a1030 })))
    scene.add(s1)

    // Satellite 2
    const s2 = new THREE.Group()
    s2.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 6), new THREE.MeshPhongMaterial({ color: 0xe0e8f0, emissive: 0x203040 })))
    s2.add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 2), new THREE.MeshPhongMaterial({ color: 0x0a2050, emissive: 0x050f28 })))
    scene.add(s2)

    let ia = 0, s1a = Math.PI / 2, s2a = Math.PI
    const IO = R + 12, S1O = R + 18, S2O = R + 22

    const anim = () => {
      requestAnimationFrame(anim)
      ia += 0.0035
      s1a += 0.005
      s2a += 0.0028
      issGroup.position.set(IO * Math.cos(ia), IO * Math.sin(ia) * Math.sin(Math.PI / 7), IO * Math.sin(ia) * Math.cos(Math.PI / 7))
      issGroup.rotation.y += 0.01
      s1.position.set(S1O * Math.cos(s1a) * Math.cos(-Math.PI / 5), S1O * Math.sin(s1a), S1O * Math.cos(s1a) * Math.sin(-Math.PI / 5))
      s1.rotation.y += 0.008
      s2.position.set(S2O * Math.cos(s2a) * Math.sin(Math.PI / 3), S2O * Math.sin(s2a) * Math.cos(Math.PI / 3), S2O * Math.cos(s2a))
      s2.rotation.z += 0.006
    }
    anim()
  } catch (e) { console.error("Orbiters error:", e) }
}

// ── STAR FIELD ────────────────────────────────────────────────────────
function addStars(scene: THREE.Scene) {
  try {
    const count = 9000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 900 + Math.random() * 500
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      const t = Math.random()
      if (t < 0.55) { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1 } // white
      else if (t < 0.75) { colors[i * 3] = 0.68; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1 } // ice blue
      else if (t < 0.90) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 0.65 } // warm yellow
      else { colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.90; colors[i * 3 + 2] = 1 } // blue-white
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.4, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.88, depthWrite: false,
    }))
    stars.name = "wc_stars"
    scene.add(stars)

    // Nebula glow
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512
    const ctx = canvas.getContext("2d")!
    const g1 = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    g1.addColorStop(0, "rgba(8,40,130,0.40)")
    g1.addColorStop(0.35, "rgba(4,22,80,0.22)")
    g1.addColorStop(0.65, "rgba(2,10,45,0.10)")
    g1.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g1; ctx.fillRect(0, 0, 512, 512)
    const g2 = ctx.createRadialGradient(340, 180, 0, 340, 180, 200)
    g2.addColorStop(0, "rgba(0,80,160,0.18)")
    g2.addColorStop(0.5, "rgba(0,40,90,0.08)")
    g2.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g2; ctx.fillRect(0, 0, 512, 512)
    const nebula = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    nebula.name = "wc_nebula"
    nebula.scale.set(2200, 2200, 1)
    nebula.position.set(0, 0, -800)
    scene.add(nebula)
  } catch (e) { console.error("Stars error:", e) }
}
