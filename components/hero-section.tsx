"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Lock } from "lucide-react"
import dynamic from "next/dynamic"

const GlobeHeroBackground = dynamic(
  () => import("@/components/GlobeHeroBackground").then(m => ({ default: m.GlobeHeroBackground })),
  { ssr: false, loading: () => null }
)

export function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-background flex flex-col">

      {/* ── GLOBE — right side, slightly off-screen so it bleeds the edge ── */}
      <div className="absolute inset-0 z-0">
        {/* Globe sits right-of-center, large, interactive */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ right: "-5%", width: "70vw", height: "70vw", maxWidth: "860px", maxHeight: "860px" }}
        >
          <GlobeHeroBackground />
        </div>

        {/* Gradient: left fade so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        {/* Top/bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/75" />
        {/* Primary green radial glow — matches theme */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.08),transparent_55%)]" />

        {/* Subtle star field */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 10% 15%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 40% 10%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 70% 25%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 20% 60%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 85% 65%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 50% 80%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 5%  85%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 93% 20%, white 0%, transparent 100%),
              radial-gradient(2px 2px at 30% 42%, rgba(74,222,128,0.45) 0%, transparent 100%),
              radial-gradient(2px 2px at 65% 55%, rgba(74,222,128,0.3) 0%, transparent 100%)
            `,
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Trusted by investors in 160+ countries
              </span>
            </div>

            {/* Original headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Track. Analyze.{" "}
              <br />
              <span className="text-primary">Invest Smarter.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Portfolio tracking, real-time market heatmaps, dividend analytics,
              and market news — all in one place. Start free, unlock everything with Pro.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                <Link href="/auth">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 text-base border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <Link href="/#features">See Features</Link>
              </Button>
            </div>

            {/* Trust bullets — same as original */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary shrink-0" />
                <span>Pro unlocks news + advanced analytics</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="relative z-10 flex justify-start pl-6 pb-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 animate-bounce">
            <div className="w-px h-6 bg-gradient-to-b from-transparent to-primary/40" />
            <span className="text-[10px] text-muted-foreground/40 tracking-widest uppercase">Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  )
}
