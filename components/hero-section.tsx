"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, Map } from "lucide-react"
import dynamic from "next/dynamic"

const GlobeHeroBackground = dynamic(
  () => import("@/components/GlobeHeroBackground").then(m => ({ default: m.GlobeHeroBackground })),
  { ssr: false, loading: () => null }
)

const STATS = [
  { value: "51", label: "Markets tracked" },
  { value: "Live", label: "Market data" },
  { value: "AI", label: "News summaries" },
  { value: "Free", label: "No credit card" },
]

export function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#060a10] flex flex-col">

      {/* ── GLOBE (fills right 60%, centered vertically) ── */}
      <div className="absolute inset-0 z-0">
        {/* Globe container — offset right so content has room left */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[-10%] w-[75vw] h-[75vw] max-w-[900px] max-h-[900px]">
          <GlobeHeroBackground />
        </div>

        {/* Gradient mask — fades globe into dark on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060a10] via-[#060a10]/80 to-transparent" />
        {/* Top + bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a10]/60 via-transparent to-[#060a10]/80" />

        {/* Star field */}
        <div className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.6) 0%, transparent 100%),
              radial-gradient(1px 1px at 45% 15%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(1px 1px at 75% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
              radial-gradient(1px 1px at 25% 65%, rgba(255,255,255,0.3) 0%, transparent 100%),
              radial-gradient(1px 1px at 85% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(1px 1px at 55% 80%, rgba(255,255,255,0.3) 0%, transparent 100%),
              radial-gradient(1px 1px at 10% 85%, rgba(255,255,255,0.5) 0%, transparent 100%),
              radial-gradient(1px 1px at 92% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(2px 2px at 35% 45%, rgba(147,197,253,0.4) 0%, transparent 100%),
              radial-gradient(2px 2px at 68% 55%, rgba(147,197,253,0.3) 0%, transparent 100%)
            `,
          }}
        />

        {/* Subtle blue glow behind globe */}
        <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none" />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-blue-300/80 tracking-wide font-medium">
                51 global markets · Live data
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6">
              The World's{" "}
              <br />
              Markets.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                One Globe.
              </span>
            </h1>

            <p className="text-lg text-white/50 mb-10 leading-relaxed max-w-md">
              Visualize every stock market on Earth in real time.
              Click any country for live index data, AI news summaries,
              and daily performance — all free.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-14">
              <Button
                asChild
                size="lg"
                className="bg-blue-500 hover:bg-blue-400 text-white border-0 h-12 px-7 text-sm font-semibold shadow-xl shadow-blue-500/30 transition-all hover:shadow-blue-400/40 hover:scale-[1.02]"
              >
                <Link href="/globe" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Launch Globe
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-sm font-semibold border-white/10 text-white/70 hover:text-white hover:bg-white/5 bg-transparent transition-all"
              >
                <Link href="/auth" className="flex items-center gap-2">
                  Start for Free
                </Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 flex-wrap">
              {STATS.map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xl font-black text-white tabular-nums">{s.value}</span>
                  <span className="text-[11px] text-white/30 tracking-wide uppercase">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLL HINT ── */}
      <div className="relative z-10 flex justify-center pb-8">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/20" />
          <span className="text-[10px] text-white/20 tracking-widest uppercase">Scroll</span>
        </div>
      </div>
    </section>
  )
}
