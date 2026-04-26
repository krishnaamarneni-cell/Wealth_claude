"use client"

import { useState } from "react"
import { HeaderVariantA } from "@/components/headers/header-variant-a"
import { HeaderVariantB } from "@/components/headers/header-variant-b"
import { HeaderVariantC } from "@/components/headers/header-variant-c"
import { ChevronDown, Sparkles, Zap, Star } from "lucide-react"

type Variant = "A" | "B" | "C"

const VARIANTS: Record<Variant, { name: string; tagline: string; description: string }> = {
  A: {
    name: "Variant A — Glassmorphism Shrink",
    tagline: "Clean, professional, transparent at top",
    description:
      "Header is invisible at top of page so hero content shines through. As you scroll, glassmorphism background fades in and header shrinks. Subtle and balanced.",
  },
  B: {
    name: "Variant B — Edge-to-Edge Sliding Glass",
    tagline: "Bold, full-bleed, news-site presence",
    description:
      "Tall and confident at top with branded tagline. When scrolled, becomes thin glass overlay. Hides on scroll-down, slides back on scroll-up — saves vertical space while reading.",
  },
  C: {
    name: "Variant C — Floating Pill Morph",
    tagline: "Apple-style, futuristic, eye-catching",
    description:
      "Full-width header at top. As you scroll, it morphs into a centered floating capsule with rounded edges. Uses width + border-radius animation for the wow factor. Most distinct and modern.",
  },
}

export default function HeaderPreviewPage() {
  const [variant, setVariant] = useState<Variant>("A")

  return (
    <div className="min-h-screen bg-background">
      {/* Render the selected header */}
      {variant === "A" && <HeaderVariantA />}
      {variant === "B" && <HeaderVariantB />}
      {variant === "C" && <HeaderVariantC />}

      {/* Variant switcher (floating, fixed) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50">
          {(Object.keys(VARIANTS) as Variant[]).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                variant === v
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Variant {v}
            </button>
          ))}
        </div>
      </div>

      {/* Hero — first viewport */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[100px]" />

        <div className="relative z-10 max-w-3xl text-center px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary">{VARIANTS[variant].tagline}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            {VARIANTS[variant].name}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {VARIANTS[variant].description}
          </p>
          <div className="flex items-center gap-3 justify-center text-xs text-muted-foreground/70">
            <ChevronDown className="w-4 h-4 animate-bounce" />
            <span>Scroll down to see the header animation</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Demo content sections so you can scroll and see header behavior */}
      <DemoSection title="Track" icon={<Sparkles className="w-6 h-6" />}>
        Real-time portfolio tracking with detailed performance analytics, sector breakdowns, and
        dividend forecasting. See exactly how your investments are doing across every account in one
        unified view.
      </DemoSection>

      <DemoSection title="Analyze" icon={<Zap className="w-6 h-6" />}>
        AI-powered insights help you understand the why behind every move. Spot risks before they
        materialize. Identify opportunities others miss. Get answers to questions you didn't even
        know to ask.
      </DemoSection>

      <DemoSection title="Invest Smarter" icon={<Star className="w-6 h-6" />}>
        Markets move fast. Your decisions should be informed. With real-time global market data,
        live news feeds, and intelligent alerts, you'll never miss what matters.
      </DemoSection>

      <DemoSection title="Built for Speed">
        Every interaction is instant. Built on a modern stack designed for performance — Next.js,
        Supabase, and edge computing. No spinners. No delays. Just data when you need it.
      </DemoSection>

      {/* Footer spacer */}
      <div className="h-32" />
    </div>
  )
}

function DemoSection({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        {icon && (
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6">
            {icon}
          </div>
        )}
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{title}</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </section>
  )
}
