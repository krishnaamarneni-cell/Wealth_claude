"use client"

import Link from "next/link"
import { Play, Globe, Map, Newspaper } from "lucide-react"

const STEPS = [
  {
    icon: Globe,
    step: "01",
    title: "Open the Globe",
    desc: "A cinematic flyover drops you into an interactive 3D Earth with every market colored by daily performance.",
  },
  {
    icon: Map,
    step: "02",
    title: "Switch to Flat Map",
    desc: "Toggle to a flat world map for a different perspective — same live data, infinite pan, city-level detail.",
  },
  {
    icon: Newspaper,
    step: "03",
    title: "Click any Country",
    desc: "Instantly see the index price, daily change, sentiment, and an AI-summarized news brief for that market.",
  },
]

export function LivePreviewSection() {
  return (
    <section className="relative py-32 px-6 bg-[#060a10] overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-emerald-600/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto relative z-10">

        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 mb-5">
            <span className="text-xs text-white/40 tracking-widest uppercase">See it in action</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Three clicks to any market
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-lg">
            No setup. No account required. Open the globe and the world's markets are right there.
          </p>
        </div>

        {/* Video frame */}
        <div className="relative max-w-5xl mx-auto mb-20">
          {/* Outer glow ring - changed to green */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-500/20 blur-sm" />

          <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0d1117]">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0f18]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white/5 rounded-md px-3 py-1 text-[11px] text-white/25 text-center max-w-xs mx-auto">
                  wealthclaude.com/globe
                </div>
              </div>
            </div>

            {/* Video player - flexible height */}
            <div className="relative bg-[#060a10]">
              <video
                src="/globe-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto block"
              />

              {/* Optional: Overlay with CTA button - changed to green */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <Link
                  href="/globe"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-sm hover:bg-black/80 hover:border-emerald-400/50 transition-all duration-300 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Try it live
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3-step how it works */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map((s) => (
            <div key={s.step} className="relative group">
              {/* Step connector line */}
              <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -translate-y-1/2 z-0 last:hidden" />

              <div className="relative z-10 flex flex-col gap-4 p-6 rounded-2xl border border-white/5 bg-white/2 hover:border-emerald-500/20 hover:bg-white/3 transition-all duration-300">
                <div className="flex items-center justify-between">
                  {/* Changed icon container to green */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-3xl font-black text-white/5 tabular-nums">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
