"use client"

/**
 * VARIANT C — Floating Pill Morph (Apple-style Dynamic Island)
 *
 * Behavior:
 * - Top: full-width transparent header with logo + nav + CTA
 * - Scrolled: morphs into a centered floating pill that hovers below the top edge
 * - Width animates from full-width to narrow capsule
 * - Content reflows: all elements stay visible but condense
 *
 * Aesthetic: most futuristic, most distinct. The "wow" factor.
 * Best for landing pages where you want to leave an impression.
 */

import Link from "next/link"
import { LineChart, ChevronDown, Sparkles } from "lucide-react"
import { useScrolled } from "@/lib/use-scrolled"

const NAV = ["Products", "Markets", "Blog", "Brokers", "More"]

export function HeaderVariantC() {
  const { scrolled } = useScrolled(80)

  return (
    <div
      className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        scrolled ? "top-3" : "top-0"
      }`}
    >
      <div className="flex items-center justify-center px-4 pointer-events-none">
        <header
          className={`pointer-events-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            scrolled
              ? "w-full max-w-3xl h-12 px-3 rounded-full bg-white/5 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/40"
              : "w-full max-w-7xl h-20 px-6 rounded-none bg-transparent border border-transparent"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center justify-center rounded-lg bg-primary transition-all duration-500 ${
                scrolled ? "h-7 w-7" : "h-9 w-9"
              }`}
            >
              <LineChart
                className={`text-primary-foreground transition-all duration-500 ${
                  scrolled ? "h-3.5 w-3.5" : "h-5 w-5"
                }`}
              />
            </div>
            <span
              className={`font-bold text-foreground transition-all duration-500 whitespace-nowrap ${
                scrolled ? "text-sm" : "text-lg"
              }`}
            >
              WealthClaude
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map((item) => (
              <button
                key={item}
                className={`flex items-center gap-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all whitespace-nowrap ${
                  scrolled ? "text-xs h-8 px-2.5" : "text-sm h-9 px-3.5"
                }`}
              >
                {item}
                {!scrolled && <ChevronDown className="w-3 h-3" />}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <Link
            href="/auth"
            className={`inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all shrink-0 ${
              scrolled ? "px-3 h-8 text-xs" : "px-4 h-9 text-sm"
            }`}
          >
            <Sparkles className={`transition-all ${scrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
            <span className="whitespace-nowrap">Try Free</span>
          </Link>
        </header>
      </div>
    </div>
  )
}
