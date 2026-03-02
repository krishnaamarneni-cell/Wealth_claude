"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const ALL_TOOLS = [
  {
    id: "fat-fire",
    icon: "🔥",
    name: "Fat FIRE Calculator",
    desc: "Calculate how much you need to retire with a luxurious lifestyle — no spending compromises.",
    tag: "FIRE",
    category: "fire",
    href: "/tools/fat-fire-calculator",
  },
  {
    id: "barista-fire",
    icon: "☕",
    name: "Barista FIRE Calculator",
    desc: "Plan a semi-retirement with part-time income covering your remaining expenses.",
    tag: "FIRE",
    category: "fire",
    href: "/tools/barista-fire-calculator",
  },
  {
    id: "lean-fire",
    icon: "🌿",
    name: "Lean FIRE Calculator",
    desc: "Achieve early retirement on a minimal budget with frugal living principles.",
    tag: "FIRE",
    category: "fire",
    href: "/tools/lean-fire-calculator",
  },
  {
    id: "coast-fire",
    icon: "🌊",
    name: "Coast FIRE Calculator",
    desc: "Find when your investments can grow on their own to fund retirement without more contributions.",
    tag: "FIRE",
    category: "fire",
    href: "/tools/coast-fire-calculator",
  },
  {
    id: "early-retirement",
    icon: "🏖️",
    name: "Early Retirement Calculator",
    desc: "Discover your target date and savings needed to retire early and live life on your terms.",
    tag: "FIRE",
    category: "fire",
    href: "/tools/early-retirement-calculator",
  },
  {
    id: "dividend",
    icon: "💰",
    name: "Dividend Calculator",
    desc: "Project your dividend income over time with DRIP reinvestment and yield growth assumptions.",
    tag: "Investing",
    category: "investing",
    href: "/tools/dividend-calculator",
  },
  {
    id: "dca",
    icon: "🔄",
    name: "DCA Calculator",
    desc: "Model dollar-cost averaging returns over time and see the power of consistent investing.",
    tag: "Investing",
    category: "investing",
    href: "/tools/dca-calculator",
  },
  {
    id: "stock-profit",
    icon: "💵",
    name: "Stock Profit Calculator",
    desc: "Quickly calculate your profit, loss, and return percentage on any stock trade.",
    tag: "Investing",
    category: "investing",
    href: "/tools/stock-profit-calculator",
  },
  {
    id: "credit-card-debt",
    icon: "💳",
    name: "Credit Card Debt Calculator",
    desc: "Upload statements or enter manually. Get your debt breakdown, interest costs, and fastest payoff strategies.",
    tag: "Debt",
    category: "debt",
    href: "/tools/credit-card-debt-calculator",
  },
  {
    id: "debt-vs-invest",
    icon: "⚖️",
    name: "Debt vs. Invest Calculator",
    desc: "Should you pay off debt or invest? Get a financial health score A–F, 10-year net worth projection, and personalized recommendation.",
    tag: "Debt",
    category: "debt",
    href: "/tools/debt-vs-invest",
  },
  {
    id: "twr",
    icon: "📈",
    name: "Time-Weighted Return",
    desc: "Measure portfolio performance neutralized by the impact of external cash flows.",
    tag: "Returns",
    category: "returns",
    href: "/tools/time-weighted-return",
  },
  {
    id: "mwr",
    icon: "📊",
    name: "Money-Weighted Return",
    desc: "Calculate your personal rate of return accounting for timing and size of your cash flows.",
    tag: "Returns",
    category: "returns",
    href: "/tools/money-weighted-return",
  },
  {
    id: "rebalancing",
    icon: "⚖️",
    name: "Portfolio Rebalancing",
    desc: "Determine exactly how much to buy or sell to restore your target asset allocation.",
    tag: "Portfolio",
    category: "portfolio",
    href: "/tools/portfolio-rebalancing",
  },
  {
    id: "weight",
    icon: "🥧",
    name: "Portfolio Weight Calculator",
    desc: "Instantly see what percentage of your total portfolio each holding represents.",
    tag: "Portfolio",
    category: "portfolio",
    href: "/tools/portfolio-weight",
  },
]

const FILTERS = [
  { label: "All Tools", value: "all" },
  { label: "FIRE", value: "fire" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Returns", value: "returns" },
  { label: "Investing", value: "investing" },
  { label: "Debt", value: "debt" },
]

export default function ToolsPage() {
  const [activeFilter, setActiveFilter] = useState("all")

  const filtered = ALL_TOOLS.filter(
    (t) => activeFilter === "all" || t.category === activeFilter
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">
        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tracking-widest uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Free Forever
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            Free Financial<br />
            <span className="text-primary">Tools &amp; Calculators</span>
          </h1>

          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed mb-8">
            Powerful, free calculators built by WealthClaude — plan retirement,
            analyze returns, manage your portfolio, and crush your debt. Start free,
            unlock everything with Pro.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-muted-foreground text-xs">
            {[
              "Free forever plan",
              "No credit card required",
              "Cancel anytime",
              "Pro unlocks advanced analytics",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="text-primary w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Filters + Grid ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground font-medium mr-1">Filter:</span>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${activeFilter === f.value
                  ? "bg-primary border-primary text-black font-semibold"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {filtered.length} tool{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl border border-border overflow-hidden">
            {filtered.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group bg-background hover:bg-card/60 transition-colors duration-150 p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-lg shrink-0">
                    {tool.icon}
                  </div>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-base">↗</span>
                </div>

                <div className="text-sm font-semibold text-foreground mb-1.5 tracking-tight">
                  {tool.name}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {tool.desc}
                </div>

                <div className="mt-4">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/8 border border-primary/12 rounded px-2 py-0.5">
                    {tool.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No tools match this filter.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
