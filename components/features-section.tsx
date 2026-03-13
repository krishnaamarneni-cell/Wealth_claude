import Link from "next/link"
import { PieChart, TrendingUp, DollarSign, BarChart3, Globe, Map, Newspaper, Zap } from "lucide-react"

const FEATURES = [
  {
    icon: Globe,
    badge: "Interactive 3D Globe",
    title: "Every Market on Earth",
    description:
      "Watch 51 stock markets light up in real time. Green for gains, red for losses — the world's financial pulse at a glance. Click any country for detailed index data.",
    gradient: "from-blue-500/15 to-cyan-500/10",
    accent: "blue",
    href: "/globe",
    cta: "Open Globe",
  },
  {
    icon: Map,
    badge: "Flat World Map",
    title: "Infinite Pan Map View",
    description:
      "Same live data on a flat Mercator projection. Infinite horizontal scrolling, city-level labels, country tooltips. Perfect for a different perspective on global markets.",
    gradient: "from-emerald-500/15 to-teal-500/10",
    accent: "emerald",
    href: "/globe",
    cta: "Open Map",
  },
  {
    icon: Newspaper,
    badge: "AI News Summaries",
    title: "Market News, Summarized",
    description:
      "Click any country and instantly get an AI-generated briefing on that market's recent news — sourced from multiple global outlets and condensed to 3 sentences.",
    gradient: "from-violet-500/15 to-purple-500/10",
    accent: "violet",
    href: "/news",
    cta: "Browse News",
  },
  {
    icon: PieChart,
    badge: "Investment Allocation",
    title: "Visualize Your Portfolio",
    description:
      "Break down your holdings by business, industry, sector, and country. See exactly where your money is deployed across the world.",
    gradient: "from-amber-500/15 to-orange-500/10",
    accent: "amber",
    href: "/auth",
    cta: "Try free",
  },
  {
    icon: TrendingUp,
    badge: "Performance Tracking",
    title: "Track Every Position",
    description:
      "Measure portfolio performance at any time interval. Compare against benchmarks. Understand what's working and what isn't.",
    gradient: "from-rose-500/15 to-pink-500/10",
    accent: "rose",
    href: "/auth",
    cta: "Try free",
  },
  {
    icon: DollarSign,
    badge: "Dividend Analytics",
    title: "Global Dividend Tracker",
    description:
      "Track dividend investments in the US, UK, Europe, Canada, Singapore, Australia and beyond. Never miss a payment.",
    gradient: "from-lime-500/15 to-green-500/10",
    accent: "lime",
    href: "/auth",
    cta: "Try free",
  },
]

const ACCENT_CLASSES: Record<string, { icon: string; badge: string; border: string }> = {
  blue: { icon: "text-blue-400", badge: "bg-blue-500/10 text-blue-300 border-blue-400/20", border: "group-hover:border-blue-500/30" },
  emerald: { icon: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20", border: "group-hover:border-emerald-500/30" },
  violet: { icon: "text-violet-400", badge: "bg-violet-500/10 text-violet-300 border-violet-400/20", border: "group-hover:border-violet-500/30" },
  amber: { icon: "text-amber-400", badge: "bg-amber-500/10 text-amber-300 border-amber-400/20", border: "group-hover:border-amber-500/30" },
  rose: { icon: "text-rose-400", badge: "bg-rose-500/10 text-rose-300 border-rose-400/20", border: "group-hover:border-rose-500/30" },
  lime: { icon: "text-lime-400", badge: "bg-lime-500/10 text-lime-300 border-lime-400/20", border: "group-hover:border-lime-500/30" },
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-6 bg-[#060a10] overflow-hidden">

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 mb-5">
            <Zap className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/40 tracking-widest uppercase">Everything you need</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
            Built for global investors
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-lg leading-relaxed">
            From a 3D rotating globe to dividend analytics — WealthClaude gives you
            the tools to understand markets anywhere on Earth.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {FEATURES.map((feat) => {
            const ac = ACCENT_CLASSES[feat.accent]
            return (
              <div
                key={feat.title}
                className={`group relative bg-white/2 rounded-2xl border border-white/6 p-7 hover:bg-white/3 transition-all duration-300 ${ac.border} flex flex-col`}
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative z-10 flex flex-col flex-1">
                  {/* Badge */}
                  <span className={`inline-flex self-start text-[10px] font-semibold mb-5 px-2.5 py-1 rounded-full border tracking-wide ${ac.badge}`}>
                    {feat.badge}
                  </span>

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-5`}>
                    <feat.icon className={`w-5 h-5 ${ac.icon}`} />
                  </div>

                  {/* Text */}
                  <h3 className="text-base font-bold text-white mb-3 leading-snug">{feat.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed flex-1">{feat.description}</p>

                  {/* CTA */}
                  <Link
                    href={feat.href}
                    className={`inline-flex items-center gap-1.5 mt-6 text-xs font-semibold ${ac.icon} opacity-60 group-hover:opacity-100 transition-opacity`}
                  >
                    {feat.cta}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-20 text-center">
          <Link
            href="/globe"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/15 border border-white/8 text-white/80 hover:text-white hover:border-white/15 transition-all duration-300 hover:scale-[1.02] font-medium"
          >
            <span className="text-xl">🌍</span>
            Explore the Globe — it&apos;s free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
