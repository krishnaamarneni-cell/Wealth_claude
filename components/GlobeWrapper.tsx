"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MarketDataMap } from "@/lib/mockData"
import { pctToColor, pctToGlow } from "@/lib/colorScale"
import { NO_EXCHANGE_COUNTRIES } from "@/lib/countryIndexMap"

interface GlobeWrapperProps {
  marketData: MarketDataMap
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null, name: string | null) => void
}

// Minimal type shim for Globe.gl
declare global {
  interface Window {
    Globe: any
  }
}

export function GlobeWrapper({ marketData, selectedCountry, onCountrySelect }: GlobeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [introPlaying, setIntroPlaying] = useState(true)
  const introRef = useRef(false)

  // Load Globe.gl from CDN
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadGlobe = async () => {
      // Load Three.js first so window.THREE is available for stars
      if (!(window as any).THREE) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"
          s.onload = () => res()
          s.onerror = () => rej(new Error("Three.js CDN load failed"))
          document.head.appendChild(s)
        })
      }
      if (!(window as any).Globe) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.30.0/dist/globe.gl.min.js"
          s.onload = () => res()
          s.onerror = () => rej(new Error("Globe.gl CDN load failed"))
          document.head.appendChild(s)
        })
      }
      setIsReady(true)
    }

    loadGlobe().catch(e => setLoadError(e.message))
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
        const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        const topo = await res.json()
        geoData = { type: "FeatureCollection", features: [] }
      }

      // Store features for later use (labels shown after intro)
      const marketFeatures = (geoData.features ?? []).filter((feat: any) => {
        const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
        return marketData[iso] !== undefined
      })

      const GlobeGL = (window as any).Globe
      if (!GlobeGL || !containerRef.current) return

      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight

      const globe = GlobeGL()
        .width(W)
        .height(H)
        // Background
        .backgroundColor("#000000")
        // Globe texture
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        // Atmosphere
        .atmosphereColor("#2389da")
        .atmosphereAltitude(0.22)
        // Country name labels — market countries only
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
          // Handle both Polygon and MultiPolygon
          const ring = feat.geometry.type === "MultiPolygon" ? coords[0][0] : coords[0]
          const lats = ring.map((c: number[]) => c[1])
          const lngs = ring.map((c: number[]) => c[0])
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
        // Countries polygon layer
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
        .onPolygonHover((feat: any) => {
          if (feat) {
            const iso = feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3 ?? ""
            setHoveredCountry(iso)
          } else {
            setHoveredCountry(null)
          }
          // Update altitude for hover
          globe.polygonAltitude((f: any) => {
            const iso2 = f.properties?.ADM0_A3 ?? f.properties?.ISO_A3
            if (iso2 === selectedCountry) return 0.08
            if (feat && (feat.properties?.ADM0_A3 ?? feat.properties?.ISO_A3) === iso2) return 0.04
            return 0.006
          })
        })

      // Initial position — center over Atlantic for best first view
      globe.pointOfView({ lat: 20, lng: 10, altitude: 2.2 })

      // Render globe to DOM FIRST
      globe(containerRef.current)
      globeRef.current = globe

      // THEN set up controls
      setTimeout(() => {
        const controls = globe.controls()
        if (controls) {
          controls.autoRotate = false
          controls.enableDamping = true
          controls.enabled = false // disable user control during intro
        }
      }, 100)

      // Listen for skip event from page
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

        const DURATION = 15000 // 15 seconds
        const start = performance.now()

        // Keyframes: [time 0-1, lat, lng, altitude]
        const KEYFRAMES = [
          { t: 0.00, lat: 10, lng: 20, alt: 12.0 }, // far out — full solar system view
          { t: 0.15, lat: 15, lng: 10, alt: 10.0 }, // begin approach
          { t: 0.30, lat: 20, lng: 5, alt: 7.5 }, // flying through space
          { t: 0.45, lat: 25, lng: -5, alt: 5.5 }, // planets drifting past
          { t: 0.60, lat: 30, lng: -15, alt: 4.0 }, // Earth growing larger
          { t: 0.72, lat: 35, lng: -30, alt: 3.0 }, // atmosphere visible
          { t: 0.82, lat: 40, lng: -50, alt: 2.2 }, // approaching North America
          { t: 0.90, lat: 42, lng: -80, alt: 1.8 }, // slowing down
          { t: 0.96, lat: 40, lng: -95, alt: 1.6 }, // final approach USA
          { t: 1.00, lat: 38, lng: -97, alt: 1.5 }, // locked on USA
        ]

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t

        // Easing — ease in-out cubic
        const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        const tick = (now: number) => {
          const elapsed = now - start
          const rawT = Math.min(elapsed / DURATION, 1)
          const t = ease(rawT)

          // Find surrounding keyframes
          let k0 = KEYFRAMES[0]
          let k1 = KEYFRAMES[KEYFRAMES.length - 1]
          for (let i = 0; i < KEYFRAMES.length - 1; i++) {
            if (t >= KEYFRAMES[i].t && t <= KEYFRAMES[i + 1].t) {
              k0 = KEYFRAMES[i]
              k1 = KEYFRAMES[i + 1]
              break
            }
          }

          // Local t between the two keyframes
          const span = k1.t - k0.t || 0.001
          const localT = Math.min((t - k0.t) / span, 1)

          const lat = lerp(k0.lat, k1.lat, localT)
          const lng = lerp(k0.lng, k1.lng, localT)
          const alt = lerp(k0.alt, k1.alt, localT)

          globe.pointOfView({ lat, lng, altitude: alt })

          if (rawT < 1) {
            requestAnimationFrame(tick)
          } else {
            // Intro complete — hand control back to user
            const controls = globe.controls()
            if (controls) {
              controls.enabled = true
              controls.autoRotate = true
              controls.autoRotateSpeed = 0.35
            }
            // Show country labels now that intro is done
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
      }, 800) // small delay after mount

      // Stars + planets via Three.js scene
      setTimeout(() => {
        try {
          const scene = globe.scene()
          if (scene && (window as any).THREE) {
            addStars(scene)
            addPlanets(scene)
          }
        } catch (_) { }
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
    // Fly to selected country
    if (selectedCountry && globeRef.current) {
      const globe = globeRef.current
      const controls = globe.controls()
      if (controls) {
        controls.autoRotate = false
      }
    }
  }, [selectedCountry])

  // Resize handler
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



      {/* Intro text overlay */}
      {introPlaying && isReady && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-end pb-24">
          <div className="text-center animate-pulse">
            <div className="text-white/20 text-[10px] tracking-[0.4em] uppercase mb-1">WealthClaude</div>
            <div className="text-white/10 text-xs tracking-widest">Global Stock Markets</div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
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
    </div>
  )
}

// ── PLANETS ─────────────────────────────────────────────────
function addPlanets(scene: any) {
  try {
    const THREE = (window as any).THREE
    if (!THREE) return

    // Planet definitions — position is relative to Earth (globe center = 0,0,0)
    // Earth radius in globe.gl scene is ~100 units
    const PLANETS = [
      {
        name: "mercury",
        radius: 3.5,
        color: 0x9ca3af,  // gray
        x: 220, y: -60, z: -180,
        rotSpeed: 0.003,
        emissive: 0x4b5563,
        rings: false,
      },
      {
        name: "venus",
        radius: 6,
        color: 0xe8c97e,  // pale yellow
        x: -260, y: 40, z: -220,
        rotSpeed: 0.002,
        emissive: 0x92691a,
        rings: false,
      },
      {
        name: "mars",
        radius: 5,
        color: 0xc1440e,  // red-orange
        x: 300, y: 80, z: -260,
        rotSpeed: 0.004,
        emissive: 0x7a1a00,
        rings: false,
      },
      {
        name: "jupiter",
        radius: 28,
        color: 0xc88b3a,  // golden brown
        x: -380, y: -100, z: -400,
        rotSpeed: 0.007,
        emissive: 0x7a4a10,
        rings: false,
      },
      {
        name: "saturn",
        radius: 22,
        color: 0xe4d090,  // pale gold
        x: 420, y: 120, z: -480,
        rotSpeed: 0.005,
        emissive: 0x8a7030,
        rings: true,
      },
      {
        name: "uranus",
        radius: 14,
        color: 0x7de8e8,  // pale cyan
        x: -480, y: 60, z: -560,
        rotSpeed: 0.003,
        emissive: 0x1a8080,
        rings: false,
      },
      {
        name: "neptune",
        radius: 13,
        color: 0x3f54ba,  // deep blue
        x: 500, y: -80, z: -620,
        rotSpeed: 0.003,
        emissive: 0x1a2560,
        rings: false,
      },
      {
        name: "moon",
        radius: 3,
        color: 0xd1d5db,  // light gray
        x: 130, y: 30, z: -160,
        rotSpeed: 0.001,
        emissive: 0x4b5563,
        rings: false,
      },
    ]

    const planetMeshes: any[] = []

    for (const p of PLANETS) {
      // Planet sphere
      const geo = new THREE.SphereGeometry(p.radius, 32, 32)
      const mat = new THREE.MeshPhongMaterial({
        color: p.color,
        emissive: p.emissive,
        shininess: 15,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(p.x, p.y, p.z)
      mesh.name = p.name
      scene.add(mesh)
      planetMeshes.push({ mesh, rotSpeed: p.rotSpeed })

      // Saturn rings
      if (p.rings) {
        const ringGeo = new THREE.TorusGeometry(p.radius * 1.9, p.radius * 0.55, 2, 80)
        const ringMat = new THREE.MeshPhongMaterial({
          color: 0xc8a95a,
          emissive: 0x5a3e10,
          transparent: true,
          opacity: 0.82,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = Math.PI / 2.8
        ring.position.set(p.x, p.y, p.z)
        scene.add(ring)
        planetMeshes.push({ mesh: ring, rotSpeed: p.rotSpeed * 0.4 })
      }

      // Subtle glow sprite behind each planet
      const glowCanvas = document.createElement("canvas")
      glowCanvas.width = 128
      glowCanvas.height = 128
      const gCtx = glowCanvas.getContext("2d")!
      const gGrad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
      const glowHex = "#" + p.color.toString(16).padStart(6, "0")
      gGrad.addColorStop(0, glowHex + "33")
      gGrad.addColorStop(0.4, glowHex + "11")
      gGrad.addColorStop(1, "rgba(0,0,0,0)")
      gCtx.fillStyle = gGrad
      gCtx.fillRect(0, 0, 128, 128)
      const glowTex = new THREE.CanvasTexture(glowCanvas)
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
      const glow = new THREE.Sprite(glowMat)
      glow.scale.set(p.radius * 6, p.radius * 6, 1)
      glow.position.set(p.x, p.y, p.z)
      scene.add(glow)
    }

    // Add ambient + directional light for planets
    const ambient = new THREE.AmbientLight(0xffffff, 0.15)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.8)
    sun.position.set(-600, 200, 400)
    scene.add(sun)

    // Animate planet rotations every frame
    const animate = () => {
      requestAnimationFrame(animate)
      for (const { mesh, rotSpeed } of planetMeshes) {
        mesh.rotation.y += rotSpeed
      }
    }
    animate()

  } catch (e) {
    console.error("Planets error:", e)
  }
}

// Add procedural star field to Three.js scene
function addStars(scene: any) {
  try {
    const THREE = (window as any).THREE
    if (!THREE) return

    // ── Stars ──
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
      // Star color variety: white, ice blue, warm yellow
      const t = Math.random()
      if (t < 0.55) { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1 } // white
      else if (t < 0.75) { colors[i * 3] = 0.68; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1 } // ice blue
      else if (t < 0.90) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 0.65 } // warm yellow
      else { colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.90; colors[i * 3 + 2] = 1 } // blue-white
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 1.4, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.88, depthWrite: false,
    })
    const stars = new THREE.Points(geo, mat)
    stars.name = "wc_stars"
    scene.add(stars)



  } catch (_) { }
}
