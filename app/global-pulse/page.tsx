"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Globe, TrendingUp, TrendingDown, AlertCircle, Flame,
  ExternalLink, Activity, Zap, Sparkles, Clock, RefreshCw,
  Swords, Cpu, Package, Newspaper, DollarSign,
  ChevronLeft, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import LiveNewsPlayer from "@/components/live-news-player"
import { Header } from "@/components/header"
import { CryptoPanel, CommoditiesPanel, MacroStressPanel } from "@/components/global-pulse-sidebar-panels"

// ─── Types ───────────────────────────────────────────────────────────────
interface GDELTEvent {
  title: string
  url: string
  source: string
  country: string
  publishedAt: string
  image: string | null
  tone: number | null
}
interface Earthquake {
  id: string
  magnitude: number
  place: string
  time: number
  url: string
  tsunami: boolean
  felt: number | null
  coordinates: { lon: number; lat: number; depth: number }
}
interface NaturalEvent {
  id: string
  title: string
  category: string
  icon: string
  link: string
  source: string
  date: string | null
  coordinates: { lon: number; lat: number } | null
}
interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function parseGDELTDate(s: string): number {
  if (!s) return Date.now()
  // Try standard Date.parse first (handles ISO 8601 + RFC 2822 from RSS feeds)
  const std = Date.parse(s)
  if (!isNaN(std)) return std
  // Legacy GDELT format: 20260417T102030Z
  if (s.length >= 15 && s[8] === 'T') {
    const year = +s.slice(0, 4), month = +s.slice(4, 6) - 1, day = +s.slice(6, 8)
    const hour = +s.slice(9, 11), min = +s.slice(11, 13), sec = +s.slice(13, 15)
    return Date.UTC(year, month, day, hour, min, sec)
  }
  return Date.now()
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 0) return 'just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function magColor(mag: number): string {
  if (mag >= 7) return 'text-red-500 bg-red-500/10 border-red-500/30'
  if (mag >= 6) return 'text-orange-500 bg-orange-500/10 border-orange-500/30'
  if (mag >= 5) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
  return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function GlobalPulsePage() {
  const [categories, setCategories] = useState<Record<string, GDELTEvent[]>>({})
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [naturalEvents, setNaturalEvents] = useState<NaturalEvent[]>([])
  const [gainers, setGainers] = useState<MarketMover[]>([])
  const [losers, setLosers] = useState<MarketMover[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  const loadAll = async () => {
    setLoading(true)
    try {
      const [eventsRes, quakesRes, naturalRes, moversRes] = await Promise.all([
        fetch('/api/global-pulse/events').then(r => r.json()).catch(() => ({ categories: {} })),
        fetch('/api/global-pulse/earthquakes').then(r => r.json()).catch(() => ({ earthquakes: [] })),
        fetch('/api/global-pulse/natural').then(r => r.json()).catch(() => ({ events: [] })),
        fetch('/api/market-movers').then(r => r.json()).catch(() => ({ sp500: { gainers: [], losers: [] } })),
      ])
      setCategories(eventsRes.categories || {})
      setEarthquakes(quakesRes.earthquakes || [])
      setNaturalEvents(naturalRes.events || [])
      setGainers(moversRes.sp500?.gainers?.slice(0, 5) || [])
      setLosers(moversRes.sp500?.losers?.slice(0, 5) || [])
      setLastUpdate(Date.now())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // Refresh every 5 min
    const interval = setInterval(loadAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const allGdelt = Object.values(categories).flat()
  const totalEvents = allGdelt.length + earthquakes.length + naturalEvents.length

  // Trending: dedupe across categories, rank by most-negative tone (high-impact) + recency
  const trendingStories = (() => {
    const seen = new Set<string>()
    const unique: GDELTEvent[] = []
    for (const ev of allGdelt) {
      const key = ev.title.slice(0, 60).toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(ev)
    }
    // Score: lower tone + more recent = higher rank
    return unique
      .map(ev => {
        const toneScore = ev.tone !== null ? Math.abs(ev.tone) : 0 // bigger = more impact (either direction)
        const pubTime = parseGDELTDate(ev.publishedAt)
        const hoursAgo = (Date.now() - pubTime) / 3_600_000
        const recencyScore = Math.max(0, 24 - hoursAgo) // 0-24
        return { ev, score: toneScore * 2 + recencyScore }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(x => x.ev)
  })()

  return (
    <div className="min-h-screen bg-background">
      {/* ── Main site header (WealthClaude nav) ────────────── */}
      <Header />

      {/* ── Page sub-header ────────────────────────────────── */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Global Pulse</h1>
                <p className="text-xs text-muted-foreground">Real-time world events that move markets</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live · Updated {timeAgo(lastUpdate)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main content ── full width on desktop, split layout ── */}
      <div className="max-w-[1600px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6">

        {/* ==== LEFT COLUMN: feeds and stats ==== */}
        <div className="min-w-0">

        {/* Live News Player (mobile only — shown inline). On desktop, it's in the right sidebar */}
        <div className="lg:hidden">
          <LiveNewsPlayer />
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<Activity className="h-4 w-4 text-primary" />}
            label="Events tracked"
            value={totalEvents}
            sub="last 24h"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            label="Top gainers"
            value={gainers.length}
            sub={gainers[0] ? `${gainers[0].symbol} ${gainers[0].changePercent >= 0 ? '+' : ''}${gainers[0].changePercent.toFixed(2)}%` : '—'}
          />
          <StatCard
            icon={<Zap className="h-4 w-4 text-yellow-500" />}
            label="Earthquakes"
            value={earthquakes.length}
            sub={earthquakes[0] ? `M${earthquakes[0].magnitude.toFixed(1)} latest` : 'none today'}
          />
          <StatCard
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="Active disasters"
            value={naturalEvents.length}
            sub="NASA EONET"
          />
        </div>

        {/* ── Grid of feeds ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* MARKET MOVERS */}
          <FeedCard
            title="Market Movers"
            subtitle="S&P 500 top moves today"
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            loading={loading}
            empty={gainers.length === 0 && losers.length === 0}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-500 mb-2">Gainers</p>
                <div className="space-y-2">
                  {gainers.map(m => (
                    <MoverRow key={m.symbol} mover={m} positive />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-2">Losers</p>
                <div className="space-y-2">
                  {losers.map(m => (
                    <MoverRow key={m.symbol} mover={m} />
                  ))}
                </div>
              </div>
            </div>
          </FeedCard>

          {/* MARKETS & FINANCE NEWS */}
          <NewsFeedCard
            title="Markets & Finance"
            subtitle="Stock market, crypto, earnings"
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            loading={loading}
            events={categories.markets || []}
          />

          {/* GEOPOLITICS */}
          <NewsFeedCard
            title="Geopolitics & Economy"
            subtitle="Fed, central banks, tariffs, elections"
            icon={<Sparkles className="h-5 w-5 text-purple-500" />}
            loading={loading}
            events={categories.geopolitics || []}
          />

          {/* WARS & CONFLICTS */}
          <NewsFeedCard
            title="Wars & Conflicts"
            subtitle="Military operations, ceasefires, strikes"
            icon={<Swords className="h-5 w-5 text-red-500" />}
            loading={loading}
            events={categories.wars || []}
          />

          {/* TECHNOLOGY */}
          <NewsFeedCard
            title="Technology"
            subtitle="AI, semiconductors, Big Tech"
            icon={<Cpu className="h-5 w-5 text-blue-500" />}
            loading={loading}
            events={categories.technology || []}
          />

          {/* COMMODITIES */}
          <NewsFeedCard
            title="Commodities"
            subtitle="Oil, gold, copper, gas, agriculture"
            icon={<Package className="h-5 w-5 text-amber-500" />}
            loading={loading}
            events={categories.commodities || []}
          />

          {/* WORLD NEWS */}
          <NewsFeedCard
            title="World News"
            subtitle="Breaking news from around the globe"
            icon={<Newspaper className="h-5 w-5 text-cyan-500" />}
            loading={loading}
            events={categories.world || []}
          />

          {/* EARTHQUAKES */}
          <EarthquakeFeedCard loading={loading} earthquakes={earthquakes} />

          {/* NATURAL DISASTERS */}
          <NaturalEventsFeedCard loading={loading} events={naturalEvents} />

          {/* TRENDING STORIES — cross-category top news by impact */}
          <TrendingFeedCard loading={loading} events={trendingStories} />

        </div>

        {/* Footer attribution */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground space-y-1">
          <p>
            Data sources:{" "}
            <a href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GDELT</a>
            {" · "}
            <a href="https://earthquake.usgs.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">USGS</a>
            {" · "}
            <a href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">NASA EONET</a>
            {" · "}
            <a href="https://finnhub.io/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Finnhub</a>
          </p>
          <p>Refreshes every 5 minutes · All data is public domain</p>
        </div>

        {/* End of LEFT COLUMN */}
        </div>

        {/* ==== RIGHT COLUMN: live video + data panels (desktop only) ==== */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide pr-1">
            <LiveNewsPlayer mode="sticky" />

            {/* Crypto prices */}
            <CryptoPanel />

            {/* Commodities (Gold, Silver, Oil, Nat Gas, Copper) */}
            <CommoditiesPanel />

            {/* Macro Stress (VIX volatility, Treasuries) */}
            <MacroStressPanel />

            {/* Quick Earthquake alert card */}
            {earthquakes[0] && earthquakes[0].magnitude >= 5 && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">
                    Earthquake Alert
                  </span>
                </div>
                <p className="text-sm font-semibold">
                  M{earthquakes[0].magnitude.toFixed(1)} · {earthquakes[0].place}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeAgo(earthquakes[0].time)}
                  {earthquakes[0].tsunami && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                      TSUNAMI WARNING
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Top market mover snapshot */}
            {gainers[0] && (
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Top S&P Mover</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{gainers[0].symbol}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{gainers[0].name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-500 tabular-nums">
                      +{gainers[0].changePercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">${gainers[0].price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function FeedCard({
  title, subtitle, icon, loading, empty, children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  loading: boolean
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {icon}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : empty ? (
          <div className="py-8 text-center">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events to show right now</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

// Pagination footer — shows "Prev | 1/3 | Next"
function PaginationFooter({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/50">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground tabular-nums font-medium">
        {page + 1} / {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// Reusable news feed card with pagination (5 per page)
function NewsFeedCard({
  title, subtitle, icon, loading, events,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  loading: boolean
  events: GDELTEvent[]
}) {
  const [page, setPage] = useState(0)
  const pageSize = 5
  const totalPages = Math.ceil(events.length / pageSize)
  const pageEvents = events.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <FeedCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      loading={loading}
      empty={events.length === 0}
    >
      <div className="space-y-2.5">
        {pageEvents.map((e, i) => (
          <a
            key={page * pageSize + i}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
              <span className="shrink-0 mt-0.5">
                <AlertCircle className={`h-4 w-4 ${e.tone !== null && e.tone < -3 ? 'text-red-500' : 'text-primary/60'}`} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {e.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <span className="font-medium truncate max-w-[120px]">{e.source}</span>
                  <span>·</span>
                  <span>{timeAgo(parseGDELTDate(e.publishedAt))}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
      <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} />
    </FeedCard>
  )
}

// Earthquakes feed with pagination
function EarthquakeFeedCard({ loading, earthquakes }: { loading: boolean; earthquakes: Earthquake[] }) {
  const [page, setPage] = useState(0)
  const pageSize = 5
  const totalPages = Math.ceil(earthquakes.length / pageSize)
  const pageItems = earthquakes.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <FeedCard
      title="Earthquakes"
      subtitle="M4.5+, last 24h"
      icon={<Zap className="h-5 w-5 text-yellow-500" />}
      loading={loading}
      empty={earthquakes.length === 0}
    >
      <div className="space-y-2">
        {pageItems.map(q => (
          <a
            key={q.id}
            href={q.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
          >
            <div className={`shrink-0 px-2 py-1 rounded-md border text-sm font-bold tabular-nums ${magColor(q.magnitude)}`}>
              M{q.magnitude.toFixed(1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {q.place}
                {q.tsunami && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">TSUNAMI</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {timeAgo(q.time)} · Depth {q.coordinates.depth.toFixed(0)}km
                {q.felt && ` · ${q.felt} felt reports`}
              </p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        ))}
      </div>
      <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} />
    </FeedCard>
  )
}

// Natural Events feed with pagination
function NaturalEventsFeedCard({ loading, events }: { loading: boolean; events: NaturalEvent[] }) {
  const [page, setPage] = useState(0)
  const pageSize = 5
  const totalPages = Math.ceil(events.length / pageSize)
  const pageItems = events.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <FeedCard
      title="Natural Events"
      subtitle="Active wildfires, storms, volcanoes"
      icon={<Flame className="h-5 w-5 text-orange-500" />}
      loading={loading}
      empty={events.length === 0}
    >
      <div className="space-y-2">
        {pageItems.map(ev => (
          <a
            key={ev.id}
            href={ev.source}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
          >
            <span className="text-2xl shrink-0 leading-none">{ev.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug line-clamp-2">{ev.title}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground/80 font-medium">
                  {ev.category}
                </span>
                {ev.date && (
                  <>
                    <span>·</span>
                    <span>{timeAgo(new Date(ev.date).getTime())}</span>
                  </>
                )}
              </div>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
          </a>
        ))}
      </div>
      <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} />
    </FeedCard>
  )
}

// Trending Now feed with pagination (numbered with impact badges)
function TrendingFeedCard({ loading, events }: { loading: boolean; events: GDELTEvent[] }) {
  const [page, setPage] = useState(0)
  const pageSize = 5
  const totalPages = Math.ceil(events.length / pageSize)
  const pageItems = events.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <FeedCard
      title="Trending Now"
      subtitle="Top stories across all categories"
      icon={<Activity className="h-5 w-5 text-primary" />}
      loading={loading}
      empty={events.length === 0}
    >
      <div className="space-y-2.5">
        {pageItems.map((e, i) => {
          const rank = page * pageSize + i + 1
          return (
            <a
              key={page * pageSize + i}
              href={e.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {e.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-medium truncate max-w-[120px]">{e.source}</span>
                    <span>·</span>
                    <span>{timeAgo(parseGDELTDate(e.publishedAt))}</span>
                    {e.tone !== null && e.tone < -5 && (
                      <span className="ml-auto px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[10px] font-semibold">
                        HIGH IMPACT
                      </span>
                    )}
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>
      <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} />
    </FeedCard>
  )
}

function MoverRow({ mover, positive = false }: { mover: MarketMover; positive?: boolean }) {
  const up = mover.changePercent >= 0
  const color = up ? 'text-green-500' : 'text-red-500'
  return (
    <div className="flex items-center justify-between px-2.5 py-2 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-bold truncate">{mover.symbol}</p>
        <p className="text-[10px] text-muted-foreground truncate">{mover.name}</p>
      </div>
      <div className={`text-right shrink-0 ml-2 ${color}`}>
        <div className="flex items-center gap-0.5 text-sm font-bold tabular-nums">
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? '+' : ''}{mover.changePercent.toFixed(2)}%
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">${mover.price.toFixed(2)}</p>
      </div>
    </div>
  )
}
