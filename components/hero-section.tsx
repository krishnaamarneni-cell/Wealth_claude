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

      {/* ── GLOBE LAYER — sits at z-0, pointer-events ON so it's draggable ── */}
      <div className="absolute inset-0 z-0">

        {/* Globe container — centered at 65% from left */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "30%",
            transform: "translateY(-50%)",
            width: "75vw",
            height: "75vw",
            maxWidth: "900px",
            maxHeight: "900px",
          }}
        >
          <GlobeHeroBackground />
        </div>

        {/* ALL gradient overlays MUST be pointer-events-none so they never block globe drag */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, var(--background) 30%, color-mix(in srgb, var(--background) 70%, transparent) 55%, transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, color-mix(in srgb, var(--background) 50%, transparent) 0%, transparent 20%, transparent 80%, color-mix(in srgb, var(--background) 70%, transparent) 100%)",
          }}
        />
        {/* Green radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(74,222,128,0.07) 0%, transparent 55%)" }}
        />
        {/* Star field */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 10% 15%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 40% 10%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 20% 60%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 5%  85%, white 0%, transparent 100%),
              radial-gradient(1px 1px at 93% 20%, white 0%, transparent 100%),
              radial-gradient(2px 2px at 30% 42%, rgba(74,222,128,0.45) 0%, transparent 100%)
            `,
          }}
        />
      </div>

      {/* ── CONTENT — z-10, but pointer-events only on actual interactive elements ── */}
      <div className="relative z-10 flex-1 flex items-center pointer-events-none">
        <div className="container mx-auto px-6">
          <div className="max-w-xl pointer-events-auto">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Trusted by investors in 160+ countries
              </span>
            </div>

            {/* Headline */}
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
                asChild size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                <Link href="/auth">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild size="lg" variant="outline"
                className="h-12 text-base border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <Link href="/#features">See Features</Link>
              </Button>
            </div>

            {/* Trust bullets */}
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
      <div className="relative z-10 flex justify-start pb-8 pointer-events-none">
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
