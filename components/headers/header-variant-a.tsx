"use client"

/**
 * VARIANT A — Classic Glassmorphism Shrink
 *
 * Behavior:
 * - Top: transparent, tall (h-20)
 * - Scrolled: glass background, compact (h-14)
 * - Smooth height + padding + opacity transitions
 * - Border fades in when scrolled
 *
 * Aesthetic: clean, professional, lets background shine through at top.
 */

import Link from "next/link"
import { LineChart, ChevronDown } from "lucide-react"
import { useScrolled } from "@/lib/use-scrolled"

const NAV = ["Products", "Markets", "Blog", "Brokers", "More"]

export function HeaderVariantA() {
  const { scrolled } = useScrolled(80)

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        scrolled
          ? "h-14 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20"
          : "h-20 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className={`flex items-center justify-center rounded-lg bg-primary transition-all duration-300 ${
              scrolled ? "h-7 w-7" : "h-9 w-9"
            }`}
          >
            <LineChart className={`text-primary-foreground transition-all ${scrolled ? "h-4 w-4" : "h-5 w-5"}`} />
          </div>
          <span
            className={`font-bold text-foreground transition-all duration-300 ${
              scrolled ? "text-base" : "text-lg"
            }`}
          >
            WealthClaude
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <button
              key={item}
              className={`flex items-center gap-1 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${
                scrolled ? "text-sm h-9" : "text-sm h-10"
              }`}
            >
              {item}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className={`hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors ${
              scrolled ? "" : ""
            }`}
          >
            Login
          </Link>
          <Link
            href="/auth"
            className={`inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all ${
              scrolled ? "px-3.5 h-8 text-xs" : "px-5 h-10 text-sm"
            }`}
          >
            Try for Free
          </Link>
        </div>
      </div>
    </header>
  )
}
