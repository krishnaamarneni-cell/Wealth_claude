"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe } from "lucide-react"
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
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-background flex flex-col">

      {/* ── GLOBE — center-right, large ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-[30%] w-[85vw] h-[85vw] max-w-[950px] max-h-[950px]">
          <GlobeHeroBackground />
        </div>

        {/* Gradient: strong fade on left so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
        {/* Top + bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />

        {/* Radial top-center glow matching primary green */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.08),transparent_55%)]" />

        {/* Star field */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 12% 18%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 42% 12%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 72% 28%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 22% 62%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 88% 68%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 52% 82%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 8%  88%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 95% 22%, white 0%, transparent 100%),
              radial-gradient(2px 2px at 33% 44%, rgba(74,222,128,0.5) 0%, transparent 100%),
              radial-gradient(2px 2px at 66% 58%, rgba(74,222,128,0.3) 0%, transparent 100%)
            `,
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground tracking-wide">
                51 global markets · Live data
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[0.95] tracking-tight mb-6">
              The World&apos;s{" "}
              <br />
              Markets.{" "}
              <span className="text-primary">One Globe.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md">
              Visualize every stock market on Earth in real time.
              Click any country for live index data, AI news summaries,
              and daily performance — all free.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-14">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
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
                className="h-12 px-7 text-sm font-semibold border-border text-foreground hover:bg-secondary bg-transparent transition-all"
              >
                <Link href="/auth">Start for Free</Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 flex-wrap">
              {STATS.map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xl font-black text-foreground tabular-nums">{s.value}</span>
                  <span className="text-[10px] text-muted-foreground tracking-widest uppercase">{s.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="relative z-10 flex justify-center pb-8">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-border" />
          <span className="text-[10px] text-muted-foreground/40 tracking-widest uppercase">Scroll</span>
        </div>
      </div>
    </section>
  )
}
