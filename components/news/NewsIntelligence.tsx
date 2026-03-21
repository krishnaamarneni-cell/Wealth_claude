"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, Clock, AlertCircle, ExternalLink,
  ChevronRight, Bell, ArrowRight, Zap, Globe, RefreshCw,
  BarChart2, Shield, Briefcase, Cpu, Wallet, Users
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsCard {
  id: string
  title: string
  summary: string
  sentiment: "bullish" | "bearish" | "watch"
  confidence: "high" | "medium" | "low"
  category: string
  source_count: number
  sources: { name: string; url: string }[]
  primary_url: string
  is_featured: boolean
  is_live: boolean
  event_date: string | null
  article_slug: string | null
  created_at: string
  consensus_pct: number
  time_ago: string
}

interface NewsBatch {
  id: string
  created_at: string
  overall_mood_pct: number
  category_sentiment: Record<string, number>
  updated_ago: string
}

interface NewsData {
  batch: NewsBatch | null
  cards: {
    featured: NewsCard | null
    bullish: NewsCard[]
    bearish: NewsCard[]
    watch: NewsCard[]
  }
  stats: {
    bullish_count: number
    bearish_count: number
    watch_count: number
    total: number
  }
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  image_url: string | null
  published_at: string
  tags: string[]
}

// ─── Category icons ───────────────────────────────────────────────────────────
const categoryIcons: Record<string, React.ReactNode> = {
  markets: <BarChart2 className="h-3 w-3" />,
  geopolitics: <Globe className="h-3 w-3" />,
  economy: <TrendingUp className="h-3 w-3" />,
  tech: <Cpu className="h-3 w-3" />,
  career: <Briefcase className="h-3 w-3" />,
  "personal-finance": <Wallet className="h-3 w-3" />,
}

// ─── Sentiment config ─────────────────────────────────────────────────────────
const sentimentConfig = {
  bullish: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Bullish", icon: TrendingUp },
  bearish: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Risk", icon: TrendingDown },
  watch: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Watch", icon: AlertCircle },
}

// ─── Pulse Bar ────────────────────────────────────────────────────────────────
function PulseBar({ batch, stats }: { batch: NewsBatch | null; stats: NewsData["stats"] }) {
  if (!batch) return null

  const categories = ["markets", "geopolitics", "economy", "tech", "career"]
  const categoryLabels: Record<string, string> = {
    markets: "Markets",
    geopolitics: "Geopolitics",
    economy: "Economy",
    tech: "Tech",
    career: "Career",
  }

  const getMoodLabel = (pct: number) => {
    if (pct >= 70) return { label: "Bullish", color: "#10b981" }
    if (pct >= 55) return { label: "Positive", color: "#10b981" }
    if (pct >= 45) return { label: "Mixed", color: "#f59e0b" }
    if (pct >= 30) return { label: "Cautious", color: "#f59e0b" }
    return { label: "Bearish", color: "#ef4444" }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-secondary/50 rounded-xl mb-6 overflow-x-auto">
      {/* Live indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Live</span>
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Overall mood */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">Overall</span>
        <span className="text-sm font-semibold" style={{ color: getMoodLabel(batch.overall_mood_pct).color }}>
          {batch.overall_mood_pct}%
        </span>
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Category sentiment */}
      {categories.map((cat) => {
        const pct = batch.category_sentiment?.[cat] ?? 50
        const mood = getMoodLabel(pct)
        return (
          <div key={cat} className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">{categoryLabels[cat]}</span>
            <span className="text-xs font-medium" style={{ color: mood.color }}>
              {pct}%
            </span>
          </div>
        )
      })}

      <div className="ml-auto shrink-0">
        <span className="text-[10px] text-muted-foreground">Updated {batch.updated_ago}</span>
      </div>
    </div>
  )
}

// ─── Hero Story ───────────────────────────────────────────────────────────────
function HeroStory({ card }: { card: NewsCard }) {
  const config = sentimentConfig[card.sentiment]

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-6"
      style={{ background: `linear-gradient(135deg, ${config.bg} 0%, transparent 100%)` }}
    >
      <div className="p-6 border rounded-2xl" style={{ borderColor: `${config.color}30` }}>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
            style={{ background: config.color, color: "white" }}
          >
            {config.label}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded bg-secondary text-muted-foreground">
            {card.category.replace("-", " ")}
          </span>
          {card.is_live && (
            <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded bg-amber-500/20 text-amber-600 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Live
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold leading-tight mb-3">
          {card.title}
        </h2>

        {/* Summary */}
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
          {card.summary}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" style={{ color: config.color }}>
            {card.source_count} sources agree
          </span>
          <span>•</span>
          <span style={{ color: config.color }}>{card.consensus_pct}% consensus</span>
          <span>•</span>
          <span>{card.time_ago}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5">
          {card.article_slug ? (
            <Link
              href={`/blog/${card.article_slug}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: config.color }}
            >
              Read full analysis <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={card.primary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
            >
              View sources <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Clickable Quick Stats Row ────────────────────────────────────────────────
function QuickStats({
  stats,
  activeSentiment,
  onSentimentClick
}: {
  stats: NewsData["stats"]
  activeSentiment: string | null
  onSentimentClick: (sentiment: string | null) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <button
        onClick={() => onSentimentClick(null)}
        className={`bg-secondary/50 rounded-xl p-3 text-center transition-all hover:bg-secondary ${activeSentiment === null ? 'ring-2 ring-primary' : ''
          }`}
      >
        <div className="text-xs text-muted-foreground mb-1">Total Stories</div>
        <div className="text-lg font-semibold">{stats.total}</div>
      </button>
      <button
        onClick={() => onSentimentClick('bullish')}
        className={`bg-emerald-500/10 rounded-xl p-3 text-center transition-all hover:bg-emerald-500/20 cursor-pointer ${activeSentiment === 'bullish' ? 'ring-2 ring-emerald-500' : ''
          }`}
      >
        <div className="text-xs text-muted-foreground mb-1">Bullish</div>
        <div className="text-lg font-semibold text-emerald-500">{stats.bullish_count}</div>
      </button>
      <button
        onClick={() => onSentimentClick('bearish')}
        className={`bg-red-500/10 rounded-xl p-3 text-center transition-all hover:bg-red-500/20 cursor-pointer ${activeSentiment === 'bearish' ? 'ring-2 ring-red-500' : ''
          }`}
      >
        <div className="text-xs text-muted-foreground mb-1">Bearish</div>
        <div className="text-lg font-semibold text-red-500">{stats.bearish_count}</div>
      </button>
      <button
        onClick={() => onSentimentClick('watch')}
        className={`bg-amber-500/10 rounded-xl p-3 text-center transition-all hover:bg-amber-500/20 cursor-pointer ${activeSentiment === 'watch' ? 'ring-2 ring-amber-500' : ''
          }`}
      >
        <div className="text-xs text-muted-foreground mb-1">Watch</div>
        <div className="text-lg font-semibold text-amber-500">{stats.watch_count}</div>
      </button>
    </div>
  )
}

// ─── News Card Row ────────────────────────────────────────────────────────────
function NewsCardRow({ card }: { card: NewsCard }) {
  const config = sentimentConfig[card.sentiment]

  return (
    <div
      className="flex items-start gap-3 p-4 bg-card border rounded-xl hover:border-primary/30 transition-colors cursor-pointer group"
      style={{ borderLeftWidth: "3px", borderLeftColor: config.color }}
      onClick={() => {
        if (card.article_slug) {
          window.location.href = `/blog/${card.article_slug}`
        } else if (card.primary_url) {
          window.open(card.primary_url, "_blank")
        }
      }}
    >
      <div className="flex-1 min-w-0">
        {/* Category + Time */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-medium uppercase px-2 py-0.5 rounded flex items-center gap-1"
            style={{ background: config.bg, color: config.color }}
          >
            {categoryIcons[card.category]}
            {card.category.replace("-", " ")}
          </span>
          {card.is_live && (
            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-600">
              Live
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
          {card.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {card.summary}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span style={{ color: config.color }}>{card.source_count} sources</span>
          <span>•</span>
          <span>{card.confidence} confidence</span>
        </div>
      </div>

      {/* Time */}
      <div className="text-right shrink-0">
        <div className="text-[10px] text-muted-foreground">{card.time_ago}</div>
      </div>
    </div>
  )
}

// ─── Sentiment Section ────────────────────────────────────────────────────────
function SentimentSection({
  sentiment,
  cards,
}: {
  sentiment: "bullish" | "bearish" | "watch"
  cards: NewsCard[]
}) {
  const config = sentimentConfig[sentiment]
  const labels = {
    bullish: "Positive signals",
    bearish: "Risk signals",
    watch: "Watch today",
  }

  if (cards.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-1 h-4 rounded"
          style={{ background: config.color }}
        />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labels[sentiment]}
        </span>
        <span className="text-xs text-muted-foreground">({cards.length})</span>
      </div>
      <div className="space-y-2">
        {cards.map((card) => (
          <NewsCardRow key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar: Categories ──────────────────────────────────────────────────────
function SidebarCategories({
  categorySentiment,
  activeCategory,
  onCategoryChange,
}: {
  categorySentiment: Record<string, number>
  activeCategory: string | null
  onCategoryChange: (cat: string | null) => void
}) {
  const categories = [
    { key: null, label: "All Stories" },
    { key: "markets", label: "Markets" },
    { key: "economy", label: "Economy" },
    { key: "geopolitics", label: "Geopolitics" },
    { key: "tech", label: "Tech" },
    { key: "career", label: "Career" },
    { key: "personal-finance", label: "Personal Finance" },
  ]

  return (
    <div className="bg-card border rounded-xl p-4 mb-4">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
        Categories
      </div>
      <div className="space-y-1">
        {categories.map((cat) => (
          <button
            key={cat.key ?? "all"}
            onClick={() => onCategoryChange(cat.key)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat.key
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            <span>{cat.label}</span>
            {cat.key && categorySentiment?.[cat.key] !== undefined && (
              <span className="text-xs opacity-70">{categorySentiment[cat.key]}%</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar: Newsletter CTA ──────────────────────────────────────────────────
function SidebarNewsletter() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSubmitted(true)
    } catch { }
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wide">Daily Brief</span>
      </div>
      <div className="text-sm font-semibold mb-1">AI market insights</div>
      <p className="text-xs text-muted-foreground mb-3">
        Delivered every morning at 7 AM. Free forever.
      </p>

      {submitted ? (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Zap className="h-3 w-3" />
          You're in! First brief arrives tomorrow.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Subscribe free
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Sidebar: CTA Card ────────────────────────────────────────────────────────
function SidebarCTA() {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Track what you read</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Add stocks to your portfolio and get personalized alerts.
      </p>
      <ul className="space-y-1.5 mb-4">
        {["Portfolio tracking", "Real-time heatmaps", "AI insights", "Price alerts"].map((f) => (
          <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/auth"
        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-primary/90"
      >
        Start free <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="text-[10px] text-center text-muted-foreground mt-2">
        Early bird: $4.99/mo locked forever
      </p>
    </div>
  )
}

// ─── Blog Post Card ───────────────────────────────────────────────────────────
function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-card border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      {post.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {post.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
}

// ─── Latest Blog Posts Section ────────────────────────────────────────────────
function LatestBlogPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Latest Analysis</h2>
          <p className="text-sm text-muted-foreground">Deep dives and market insights</p>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 bg-secondary/50 rounded-xl" />
      <div className="h-48 bg-secondary/50 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-secondary/50 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-secondary/50 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function NewsIntelligence() {
  const [data, setData] = useState<NewsData | null>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeSentiment, setActiveSentiment] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      // Build URL with filters
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      if (activeSentiment) params.set('sentiment', activeSentiment)
      params.set('limit', '50') // Increased limit

      const url = `/api/news/cards?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch news")

      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchBlogPosts = async () => {
    try {
      const res = await fetch("/api/blog-posts?limit=6")
      if (res.ok) {
        const json = await res.json()
        setBlogPosts(json.posts || json || [])
      }
    } catch (err) {
      console.error("Failed to fetch blog posts:", err)
    }
  }

  useEffect(() => {
    fetchData()
    fetchBlogPosts()
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activeCategory, activeSentiment])

  // Handle sentiment filter click
  const handleSentimentClick = (sentiment: string | null) => {
    setActiveSentiment(sentiment)
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load news. Please try again.</p>
        <button
          onClick={fetchData}
          className="mt-4 text-primary text-sm hover:underline flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    )
  }

  const { batch, cards, stats } = data

  // Empty state
  if (stats.total === 0) {
    return (
      <div className="text-center py-20">
        <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Generating intelligence...</p>
        <p className="text-sm text-muted-foreground mt-1">Check back in a few minutes.</p>
      </div>
    )
  }

  // Get all cards for display based on active sentiment filter
  const getDisplayCards = () => {
    if (activeSentiment === 'bullish') {
      return { bullish: [cards.featured, ...cards.bullish].filter(Boolean) as NewsCard[], bearish: [], watch: [] }
    }
    if (activeSentiment === 'bearish') {
      return { bullish: [], bearish: cards.bearish, watch: [] }
    }
    if (activeSentiment === 'watch') {
      return { bullish: [], bearish: [], watch: cards.watch }
    }
    return { bullish: cards.bullish, bearish: cards.bearish, watch: cards.watch }
  }

  const displayCards = getDisplayCards()

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            AI-Powered Intelligence
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">Today's Market Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {stats.total} stories synthesized from multiple sources • Updated {batch?.updated_ago}
        </p>
      </div>

      {/* Pulse Bar */}
      <PulseBar batch={batch} stats={stats} />

      {/* Main Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="lg:col-span-2">
          {/* Featured Story */}
          {cards.featured && !activeCategory && !activeSentiment && (
            <HeroStory card={cards.featured} />
          )}

          {/* Quick Stats - Now clickable */}
          <QuickStats
            stats={stats}
            activeSentiment={activeSentiment}
            onSentimentClick={handleSentimentClick}
          />

          {/* Active filter indicator */}
          {activeSentiment && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Showing:</span>
              <span
                className="text-sm font-medium px-2 py-1 rounded"
                style={{
                  background: sentimentConfig[activeSentiment as keyof typeof sentimentConfig]?.bg,
                  color: sentimentConfig[activeSentiment as keyof typeof sentimentConfig]?.color
                }}
              >
                {activeSentiment.charAt(0).toUpperCase() + activeSentiment.slice(1)} only
              </span>
              <button
                onClick={() => setActiveSentiment(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Sentiment Sections */}
          <SentimentSection sentiment="bullish" cards={displayCards.bullish} />
          <SentimentSection sentiment="bearish" cards={displayCards.bearish} />
          <SentimentSection sentiment="watch" cards={displayCards.watch} />
        </div>

        {/* Right: Sidebar */}
        <div>
          <div className="sticky top-24 space-y-4">
            <SidebarCategories
              categorySentiment={batch?.category_sentiment ?? {}}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <SidebarNewsletter />
            <SidebarCTA />
          </div>
        </div>
      </div>

      {/* Latest Blog Posts Section */}
      <LatestBlogPosts posts={blogPosts} />
    </div>
  )
}
