"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Globe, Map, BarChart3, TrendingUp, Newspaper,
  ChevronDown, Menu, X, LineChart, Star,
  GraduationCap, HelpCircle, Briefcase, Info, Layers,
  CalendarDays, Flame, ArrowUpRight, Zap, UserCircle2,
  Activity, Sparkles,
} from "lucide-react"
import { useScrolled } from "@/lib/use-scrolled"

// ── Data ──────────────────────────────────────────────────────────────────────

const PRODUCTS_FEATURED = [
  { icon: Globe, title: "Globe & Heat Map", desc: "Live 3D market globe for 51 countries", href: "/globe", badge: null },
  { icon: Map, title: "Flat Map", desc: "Infinite-pan world map with market data", href: "/globe", badge: null },
  { icon: BarChart3, title: "Macro Map", desc: "Inflation, GDP, unemployment by country", href: "/macro", badge: "New" },
  { icon: TrendingUp, title: "Markets Performance", desc: "Asset class & sector 1Y/3Y/5Y returns", href: "/markets", badge: "New" },
]

const PRODUCTS_TOOLS = [
  { icon: Layers, title: "Portfolio Tracker", desc: "Track all your holdings in one place", href: "/auth", badge: null },
  { icon: Flame, title: "Dividend Tracker", desc: "Global dividend income & yield on cost", href: "/auth", badge: null },
  { icon: GraduationCap, title: "Learn", desc: "FIRE course — path to financial independence", href: "/learn", badge: "New" },
]

const MARKETS_ITEMS = [
  { icon: Activity, title: "Global Pulse", href: "/global-pulse", desc: "Real-time world events moving markets" },
  { icon: Newspaper, title: "Global News", href: "/news", desc: "AI-summarised market news" },
  { icon: CalendarDays, title: "Economic Calendar", href: "/calendar", desc: "Earnings, IPOs, macro events" },
  { icon: TrendingUp, title: "Sector Performance", href: "/markets?tab=sectors", desc: "11 sectors — 1Y/3Y/5Y returns" },
  { icon: BarChart3, title: "Asset Classes", href: "/markets?tab=assets", desc: "Gold, bonds, equities & more" },
]

const BROKERS_FEATURED = [
  { name: "Interactive Brokers", rating: 4.9, tag: "Best Overall" },
  { name: "DEGIRO", rating: 4.7, tag: "Low Cost" },
  { name: "eToro", rating: 4.5, tag: "Social Trading" },
  { name: "Trading 212", rating: 4.4, tag: "Beginner Friendly" },
]

const BROKERS_LINKS = [
  { icon: Star, title: "Top Brokers", href: "/" },
  { icon: Layers, title: "Compare Brokers", href: "/" },
  { icon: ArrowUpRight, title: "Open an Account", href: "/auth" },
]

const MORE_ITEMS = [
  { icon: HelpCircle, title: "FAQ", href: "/#faq", badge: null },
  { icon: Briefcase, title: "Careers", href: "/careers", badge: null },
  { icon: Info, title: "About", href: "/about", badge: null },
  { icon: Zap, title: "Services", href: "/services", badge: null },
]

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label }: { label: string }) {
  const cls =
    label === "New" ? "bg-primary/15 text-primary border-primary/25" :
      label === "Soon" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
        "bg-primary/15 text-primary border-primary/25"
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border tracking-wider ${cls}`}>
      {label}
    </span>
  )
}

// ── Dropdown wrapper ──────────────────────────────────────────────────────────
function DropdownWrapper({
  label, children, wide = false, scrolled = false,
}: { label: string; children: React.ReactNode; wide?: boolean; scrolled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={`flex items-center gap-1 rounded-full transition-all whitespace-nowrap ${
          scrolled ? "text-xs h-8 px-2.5" : "text-sm h-9 px-3.5"
        } ${open
          ? "text-foreground bg-white/10"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        }`}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute top-full left-1/2 -translate-x-1/2 z-50 ${wide ? "w-[680px]" : "w-[300px]"}`}>
          <div className="h-2" /> {/* bridge gap */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Products mega-menu ────────────────────────────────────────────────────────
function ProductsMegaMenu({ scrolled }: { scrolled: boolean }) {
  return (
    <DropdownWrapper label="Products" wide scrolled={scrolled}>
      <div className="p-6 grid grid-cols-2 gap-x-6">

        <div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-3 px-1">FEATURED</p>
          <div className="space-y-1">
            {PRODUCTS_FEATURED.map(item => (
              <Link key={item.title} href={item.href}
                className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    {item.badge && <Badge label={item.badge} />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-3 px-1">TOOLS</p>
          <div className="space-y-1">
            {PRODUCTS_TOOLS.map(item => (
              <Link key={item.title} href={item.href}
                className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    {item.badge && <Badge label={item.badge} />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-primary/8 border border-primary/15">
            <p className="text-xs font-bold text-foreground mb-0.5">Start tracking for free</p>
            <p className="text-[11px] text-muted-foreground mb-2.5">No credit card · No bank linking</p>
            <Link href="/auth"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Get started <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </DropdownWrapper>
  )
}

// ── Markets dropdown ──────────────────────────────────────────────────────────
function MarketsDropdown({ scrolled }: { scrolled: boolean }) {
  return (
    <DropdownWrapper label="Markets" scrolled={scrolled}>
      <div className="p-4 space-y-1">
        {MARKETS_ITEMS.map(item => (
          <Link key={item.title} href={item.href}
            className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </DropdownWrapper>
  )
}

// ── Brokers dropdown ──────────────────────────────────────────────────────────
function BrokersDropdown({ scrolled }: { scrolled: boolean }) {
  return (
    <DropdownWrapper label="Brokers" wide scrolled={scrolled}>
      <div className="p-5 grid grid-cols-2 gap-x-6">

        <div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-3 px-1">BROWSE</p>
          <div className="space-y-1">
            {BROKERS_LINKS.map(item => (
              <Link key={item.title} href={item.href}
                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-3 px-1">FEATURED BROKERS</p>
          <div className="space-y-1">
            {BROKERS_FEATURED.map(b => (
              <Link key={b.name} href="/brokers"
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {b.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{b.tag}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-foreground">{b.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DropdownWrapper>
  )
}

// ── More dropdown ─────────────────────────────────────────────────────────────
function MoreDropdown({ scrolled }: { scrolled: boolean }) {
  return (
    <DropdownWrapper label="More" scrolled={scrolled}>
      <div className="p-4 space-y-1">
        {MORE_ITEMS.map(item => (
          <Link key={item.title} href={item.href}
            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                <item.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </span>
            </div>
            {item.badge && <Badge label={item.badge} />}
          </Link>
        ))}
      </div>
    </DropdownWrapper>
  )
}

// ── Main export — Floating Pill Morph header ──────────────────────────────────
export function Header() {
  const { scrolled } = useScrolled(80)
  const [mobileOpen, setMobileOpen] = useState(false)

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
              ? "w-full max-w-5xl h-13 px-3 rounded-full bg-white/5 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/40"
              : "w-full max-w-7xl h-20 px-6 rounded-none bg-transparent border border-transparent"
          }`}
          style={scrolled ? { height: '52px' } : undefined}
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

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <ProductsMegaMenu scrolled={scrolled} />
            <MarketsDropdown scrolled={scrolled} />
            <Link
              href="/news"
              className={`flex items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all whitespace-nowrap ${
                scrolled ? "text-xs h-8 px-2.5" : "text-sm h-9 px-3.5"
              }`}
            >
              Blog
            </Link>
            <BrokersDropdown scrolled={scrolled} />
            <MoreDropdown scrolled={scrolled} />
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              href="/auth"
              className={`flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${
                scrolled ? "h-8 w-8" : "h-9 w-9"
              }`}
              aria-label="Login"
            >
              <UserCircle2 className={scrolled ? "w-4 h-4" : "w-5 h-5"} />
            </Link>
            <Link
              href="/auth"
              className={`inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all whitespace-nowrap ${
                scrolled ? "px-3 h-8 text-xs" : "px-4 h-9 text-sm"
              }`}
            >
              <Sparkles className={`transition-all ${scrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
              {scrolled ? "Try Free" : "Try for Free"}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-foreground p-2 rounded-full hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className={`lg:hidden mx-4 mt-2 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60 max-h-[80vh] overflow-y-auto pointer-events-auto`}
        >
          <div className="px-5 py-5 space-y-5">

            <MobileSection title="Products">
              {[...PRODUCTS_FEATURED, ...PRODUCTS_TOOLS].map(item => (
                <MobileLink
                  key={item.title}
                  href={item.href}
                  icon={item.icon}
                  badge={item.badge}
                  onClose={() => setMobileOpen(false)}
                >
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <MobileSection title="Markets">
              {MARKETS_ITEMS.map(item => (
                <MobileLink key={item.title} href={item.href} icon={item.icon} onClose={() => setMobileOpen(false)}>
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <Link
              href="/news"
              className="block text-sm font-bold text-foreground py-1"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>

            <MobileSection title="Brokers">
              {BROKERS_LINKS.map(item => (
                <MobileLink key={item.title} href={item.href} icon={item.icon} onClose={() => setMobileOpen(false)}>
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <MobileSection title="More">
              {MORE_ITEMS.map(item => (
                <MobileLink
                  key={item.title}
                  href={item.href}
                  icon={item.icon}
                  badge={item.badge}
                  onClose={() => setMobileOpen(false)}
                >
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth" onClick={() => setMobileOpen(false)}>Login</Link>
              </Button>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/auth" onClick={() => setMobileOpen(false)}>Try for Free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mobile helpers ────────────────────────────────────────────────────────────
function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-2 uppercase">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function MobileLink({
  href, icon: Icon, badge, children, onClose,
}: {
  href: string
  icon: React.ElementType
  badge?: string | null
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{children}</span>
      </div>
      {badge && <Badge label={badge} />}
    </Link>
  )
}
