"use client"

import { useEffect, useRef } from "react"

export function GlobeHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)

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

      const GlobeGL = (window as any).Globe
      if (!GlobeGL || !containerRef.current) return

      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight

      const globe = GlobeGL()
        .width(W).height(H)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#3b82f6")
        .atmosphereAltitude(0.3)
        .polygonsData([])

      globe(containerRef.current)
      globeRef.current = globe

      globe.pointOfView({ lat: 20, lng: 10, altitude: 1.8 })

      setTimeout(() => {
        const controls = globe.controls()
        if (controls) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.5
          controls.enableZoom = false
          controls.enablePan = false
          controls.enableRotate = false
          controls.enableDamping = true
        }
      }, 100)
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
      style={{ background: "transparent" }}
    />
  )
}
