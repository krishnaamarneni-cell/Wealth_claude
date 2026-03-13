import Link from "next/link"
import {
  PieChart, TrendingUp, DollarSign, BarChart3,
  Globe, Map, Newspaper, Target, ShieldCheck, Zap,
} from "lucide-react"

const GRID_FEATURES = [
  {
    icon: DollarSign,
    label: "DIVIDENDS",
    title: "Global Dividend Tracker",
    desc: "Track dividend income across US, UK, Europe, Canada, Singapore, Australia and beyond. Never miss a payment.",
    href: "/auth",
  },
  {
    icon: BarChart3,
    label: "ANALYTICS",
    title: "Trade Analyzer",
    desc: "See the impact of every trade decision. Compare against benchmarks and build better habits.",
    href: "/auth",
  },
  {
    icon: Map,
    label: "MAP VIEW",
    title: "Interactive Flat Map",
    desc: "Same live data on an infinite-pan world map with city-level labels. A different lens on global markets.",
    href: "/globe",
  },
  {
    icon: Newspaper,
    label: "AI NEWS",
    title: "Market News Briefs",
    desc: "AI-summarized market news for any country on Earth. 3-sentence briefings sourced from global outlets.",
    href: "/news",
  },
  {
    icon: Target,
    label: "GOALS",
    title: "Financial Goals",
    desc: "Set savings and investment targets. Track your progress toward retirement, home purchase, or any milestone.",
    href: "/auth",
  },
  {
    icon: ShieldCheck,
    label: "FREE FOREVER",
    title: "No Bank Linking",
    desc: "Add your holdings manually. No bank account required. Your financial data stays yours.",
    href: "/auth",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-6 bg-background overflow-hidden">

      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(74,222,128,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-6xl">

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-semibold tracking-widest uppercase">Everything you need</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-lg">
              All In One{" "}
              <span className="text-primary">Portfolio Tracker</span>
            </h2>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed md:text-right">
              Your investments, global markets, news, and goals — unified in one free platform.
            </p>
          </div>
        </div>

        {/* ── Top row: 3 equal-height cards using CSS grid with rows ── */}
        <div className="grid md:grid-cols-3 gap-4 mb-4 auto-rows-fr">

          {/* Globe — large featured card, same height as neighbours */}
          <div className="group relative rounded-2xl border border-border bg-secondary/20 p-8 flex flex-col hover:border-primary/40 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full border border-primary/10 group-hover:border-primary/20 transition-colors duration-300 pointer-events-none" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full border border-primary/10 group-hover:border-primary/20 transition-colors duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col flex-1">
              <span className="inline-flex items-center gap-1.5 self-start text-[10px] font-bold text-primary tracking-widest mb-5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                LIVE · 51 MARKETS
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Global Stock Globe</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                Watch every stock market on Earth light up in real time on an interactive 3D globe.
                Green for gains, red for losses. Click any country for index data and AI news.
              </p>
              <Link href="/globe" className="mt-6 inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                Launch Globe →
              </Link>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="group relative rounded-2xl border border-border bg-secondary/20 p-7 flex flex-col hover:border-primary/40 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col flex-1">
              <span className="inline-flex self-start text-[10px] font-bold text-primary/70 tracking-widest mb-5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15">
                PORTFOLIO
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Asset Allocation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                Break down your holdings by industry, sector, geography and more. Understand exactly where your money lives.
              </p>
              <Link href="/auth" className="mt-6 inline-flex items-center text-xs font-semibold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                Try free →
              </Link>
            </div>
          </div>

          {/* Portfolio Tracker */}
          <div className="group relative rounded-2xl border border-border bg-secondary/20 p-7 flex flex-col hover:border-primary/40 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col flex-1">
              <span className="inline-flex self-start text-[10px] font-bold text-primary/70 tracking-widest mb-5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15">
                PERFORMANCE
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Portfolio Tracker</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                Measure every position at any time interval. Compare against benchmarks. Know what's working.
              </p>
              <Link href="/auth" className="mt-6 inline-flex items-center text-xs font-semibold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                Try free →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom 6-card grid ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GRID_FEATURES.map(feat => (
            <Link
              key={feat.title}
              href={feat.href}
              className="group relative rounded-2xl border border-border bg-secondary/20 p-6 flex flex-col gap-4 hover:border-primary/40 hover:bg-secondary/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[9px] font-bold text-primary/50 tracking-widest pt-1">{feat.label}</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-foreground mb-1.5">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <div>
            <p className="text-lg font-bold text-foreground mb-1">Ready to take control of your finances?</p>
            <p className="text-sm text-muted-foreground">Free forever. No credit card. No bank linking required.</p>
          </div>
          <Link
            href="/auth"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
          >
            Start for Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
