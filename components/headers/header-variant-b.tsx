"use client"

/**
 * VARIANT B — Edge-to-Edge Sliding Glass
 *
 * Behavior:
 * - Top: transparent edge-to-edge, very tall (h-24), bigger logo
 * - Scrolled: full-width glass with strong blur, hides on scroll-down, shows on scroll-up
 * - Slide-in/out animation using transform, not just opacity
 *
 * Aesthetic: bold, full-bleed, classic news-site feel with modern twist.
 * Best for content-heavy pages where you want a confident strong presence at top.
 */

import Link from "next/link"
import { LineChart, ChevronDown } from "lucide-react"
import { useScrolled } from "@/lib/use-scrolled"

const NAV = ["Products", "Markets", "Blog", "Brokers", "More"]

export function HeaderVariantB() {
  const { scrolled, direction } = useScrolled(80)
  const hidden = scrolled && direction === "down"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled
          ? "h-14 bg-black/60 backdrop-blur-2xl border-b border-white/10"
          : "h-24 bg-gradient-to-b from-black/30 to-transparent"
      }`}
    >
      <div className="w-full h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30 transition-all duration-500 ${
              scrolled ? "h-8 w-8" : "h-11 w-11"
            }`}
          >
            <LineChart
              className={`text-primary-foreground transition-all duration-500 ${
                scrolled ? "h-4 w-4" : "h-6 w-6"
              }`}
            />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className={`font-extrabold text-foreground tracking-tight transition-all duration-500 ${
                scrolled ? "text-base" : "text-2xl"
              }`}
            >
              WealthClaude
            </span>
            {!scrolled && (
              <span className="text-[10px] text-primary tracking-[0.25em] uppercase mt-1 font-bold">
                Markets · Reimagined
              </span>
            )}
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {NAV.map((item) => (
            <button
              key={item}
              className={`flex items-center gap-1 px-4 rounded-md text-muted-foreground hover:text-foreground transition-all relative group ${
                scrolled ? "text-sm h-9" : "text-base h-10"
              }`}
            >
              {item}
              <ChevronDown className="w-3.5 h-3.5" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all group-hover:w-3/4" />
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link href="/auth" className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
          <Link
            href="/auth"
            className={`group inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all relative overflow-hidden ${
              scrolled ? "px-4 h-9 text-sm" : "px-6 h-11 text-base"
            }`}
          >
            <span className="relative z-10">Try for Free</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Link>
        </div>
      </div>
    </header>
  )
}
