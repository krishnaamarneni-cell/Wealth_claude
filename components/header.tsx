"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-[#060a10]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
        }`}
    >
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-base transition-all group-hover:bg-blue-500/30 group-hover:border-blue-400/50">
            🌍
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            Wealth<span className="text-blue-400">Claude</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", href: "/#features" },
            { label: "Globe", href: "/globe" },
            { label: "Heat Maps", href: "/market-heatmaps" },
            { label: "News", href: "/news" },
            { label: "FAQ", href: "/#faq" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-white/50 hover:text-white transition-colors duration-200 tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/8 text-sm"
            asChild
          >
            <Link href="/auth">Login</Link>
          </Button>
          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-400 text-white border-0 text-sm px-4 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-400/30"
            asChild
          >
            <Link href="/auth">Get Started Free</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white/70 hover:text-white transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#060a10]/95 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto px-6 py-5 flex flex-col gap-1">
            {[
              { label: "Features", href: "/#features" },
              { label: "Globe", href: "/globe" },
              { label: "Heat Maps", href: "/market-heatmaps" },
              { label: "News", href: "/news" },
              { label: "FAQ", href: "/#faq" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-white/60 hover:text-white transition-colors py-2.5 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/8 mt-2">
              <Button variant="ghost" className="text-white/60 justify-start text-sm" asChild>
                <Link href="/auth">Login</Link>
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-400 text-white text-sm" asChild>
                <Link href="/auth">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
