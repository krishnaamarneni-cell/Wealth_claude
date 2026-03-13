"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Globe, Map, BarChart3, TrendingUp, Newspaper,
  Building2, ChevronDown, Menu, X, LineChart, Star,
  GraduationCap, HelpCircle, Briefcase, Info, Layers,
  CalendarDays, Flame, ArrowUpRight, Zap,
} from "lucide-react"

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
  { icon: GraduationCap, title: "Courses", desc: "Learn investing from scratch", href: "/courses", badge: "Soon" },
]

const MARKETS_ITEMS = [
  { icon: Newspaper, title: "Global News", href: "/news", desc: "AI-summarised market news" },
  { icon: CalendarDays, title: "Economic Calendar", href: "/calendar", desc: "Earnings, IPOs, macro events" },
  { icon: TrendingUp, title: "Sector Performance", href: "/markets", desc: "11 sectors — 1Y/3Y/5Y returns" },
  { icon: BarChart3, title: "Asset Classes", href: "/markets", desc: "Gold, bonds, equities & more" },
]

const BROKERS_FEATURED = [
  { name: "Interactive Brokers", rating: 4.9, tag: "Best Overall" },
  { name: "DEGIRO", rating: 4.7, tag: "Low Cost" },
  { name: "eToro", rating: 4.5, tag: "Social Trading" },
  { name: "Trading 212", rating: 4.4, tag: "Beginner Friendly" },
]

const BROKERS_LINKS = [
  { icon: Star, title: "Top Brokers", href: "/brokers" },
  { icon: Layers, title: "Compare Brokers", href: "/brokers/compare" },
  { icon: ArrowUpRight, title: "Open an Account", href: "/brokers/open" },
]

const MORE_ITEMS = [
  { icon: HelpCircle, title: "FAQ", href: "/#faq", badge: null },
  { icon: Briefcase, title: "Careers", href: "/careers", badge: null },
  { icon: Info, title: "About", href: "/about", badge: null },
  { icon: Zap, title: "Services", href: "/services", badge: "Soon" },
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
  label, children, wide = false,
}: { label: string; children: React.ReactNode; wide?: boolean }) {
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
        className={`flex items-center gap-1 text-sm transition-colors h-16 px-3 border-b-2 ${open
            ? "text-foreground border-primary"
            : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute top-full left-1/2 -translate-x-1/2 z-50 ${wide ? "w-[680px]" : "w-[300px]"}`}>
          <div className="h-1" /> {/* bridge gap */}
          <div className="rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Products mega-menu ────────────────────────────────────────────────────────
function ProductsMegaMenu() {
  return (
    <DropdownWrapper label="Products" wide>
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
function MarketsDropdown() {
  return (
    <DropdownWrapper label="Markets">
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
function BrokersDropdown() {
  return (
    <DropdownWrapper label="Brokers" wide>
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
function MoreDropdown() {
  return (
    <DropdownWrapper label="More">
      <div className="p-4 space-y-1">
        {MORE_ITEMS.map(item => (
          <Link key={item.title} href={item.href}
            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
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

// ── Main export ───────────────────────────────────────────────────────────────
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
        }`}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-base text-foreground">WealthClaude</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center">
          <ProductsMegaMenu />
          <MarketsDropdown />
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors h-16 flex items-center px-3 border-b-2 border-transparent hover:border-primary"
          >
            Blog
          </Link>
          <BrokersDropdown />
          <MoreDropdown />
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="text-foreground" asChild>
            <Link href="/auth">Login</Link>
          </Button>
          <Button size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            asChild
          >
            <Link href="/auth">Try for Free</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-xl border-b border-border max-h-[85vh] overflow-y-auto">
          <div className="container mx-auto px-6 py-6 space-y-6">

            <MobileSection title="Products">
              {[...PRODUCTS_FEATURED, ...PRODUCTS_TOOLS].map(item => (
                <MobileLink key={item.title} href={item.href} icon={item.icon} badge={item.badge}>
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <MobileSection title="Markets">
              {MARKETS_ITEMS.map(item => (
                <MobileLink key={item.title} href={item.href} icon={item.icon}>
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <Link href="/blog" className="block text-sm font-bold text-foreground py-1"
              onClick={() => setMobileOpen(false)}>
              Blog
            </Link>

            <MobileSection title="Brokers">
              {BROKERS_LINKS.map(item => (
                <MobileLink key={item.title} href={item.href} icon={item.icon}>
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <MobileSection title="More">
              {MORE_ITEMS.map(item => (
                <MobileLink key={item.title} href={item.href} icon={item.icon} badge={item.badge}>
                  {item.title}
                </MobileLink>
              ))}
            </MobileSection>

            <div className="flex flex-col gap-2 pt-4 border-t border-border">
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
    </header>
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
  href, icon: Icon, badge, children,
}: {
  href: string; icon: React.ElementType; badge?: string | null; children: React.ReactNode
}) {
  return (
    <Link href={href}
      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{children}</span>
      </div>
      {badge && <Badge label={badge} />}
    </Link>
  )
}
