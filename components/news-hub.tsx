"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import {
  Search, Clock, FileText, ArrowRight, Zap,
  TrendingUp, Flame, X, ChevronRight, Bell,
  BarChart2, Globe, Sparkles
} from "lucide-react"
import Link from "next/link"

// ─── Types ───────────────────────────────────────────────────────────────────
interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  image_url: string
  tags: string[]
  published_at: string
}

interface ExternalArticle {
  title: string
  image: string
  site: string
  url: string
  publishedDate: string
  text?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  try {
    const date = new Date(d)
    const now = new Date()
    const mins = Math.floor((now.getTime() - date.getTime()) / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch { return "Recently" }
}

function readTime(text: string) {
  const words = text?.split(" ").length ?? 0
  return Math.max(1, Math.ceil(words / 200))
}

function PostImg({
  url, title, className
}: { url: string; title: string; className?: string }) {
  const [err, setErr] = useState(false)
  if (!url || err) return (
    <div className={`bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${className}`}>
      <BarChart2 className="h-12 w-12 text-primary/30" />
    </div>
  )
  return (
    <img src={url} alt={title}
      className={`object-cover ${className}`}
      onError={() => setErr(true)} />
  )
}

// ─── Breaking news ticker ─────────────────────────────────────────────────────
function BreakingTicker({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null
  const items = [...posts, ...posts] // duplicate for seamless loop

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden relative">
      <div className="flex items-center">
        <div className="shrink-0 flex items-center gap-2 px-4 bg-primary z-10 border-r border-primary-foreground/20 mr-4">
          <Zap className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">Live</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{ animation: "ticker 40s linear infinite" }}
          >
            {items.map((p, i) => (
              <Link key={i} href={`/blog/${p.slug}`}
                className="text-xs font-medium hover:text-primary-foreground/80 transition-colors shrink-0">
                {p.tags?.[0] && (
                  <span className="font-bold mr-2 opacity-70">[{p.tags[0].toUpperCase()}]</span>
                )}
                {p.title}
                <span className="mx-4 opacity-30">·</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ─── Hero post ────────────────────────────────────────────────────────────────
function HeroPost({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}
      className="group relative block rounded-3xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
      <div className="relative h-[420px] md:h-[500px]">
        <PostImg url={post.image_url} title={post.title}
          className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Badge */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
            <Sparkles className="h-3 w-3" />
            Featured Story
          </span>
          {post.tags?.[0] && (
            <span className="bg-black/50 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
              {post.tags[0]}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 group-hover:text-primary transition-colors">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-white/70 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-white/60 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(post.published_at)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {readTime(post.excerpt)} min read
            </span>
            <span className="flex items-center gap-1 text-primary font-semibold">
              Read now <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link href={`/blog/${post.slug}`}
      className="group block rounded-2xl border border-border bg-card hover:border-primary/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="overflow-hidden h-44 relative">
        <PostImg url={post.image_url} title={post.title}
          className="w-full h-full group-hover:scale-[1.04] transition-transform duration-500" />
        {post.tags?.[0] && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
            {post.tags[0]}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(post.published_at)}
          </span>
          <span>{readTime(post.excerpt)} min read</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Email capture ────────────────────────────────────────────────────────────
function EmailCapture() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })

        if (response.ok) {
          setSubmitted(true)
        } else {
          alert('Subscription failed. Try again.')
        }
      } catch (error) {
        alert('Subscription failed. Try again.')
      }
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Daily Brief</span>
        </div>
        <h3 className="text-2xl font-black mb-2">
          Market insights,<br />
          <span className="text-primary">delivered daily.</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Get our AI-powered market analysis every morning before the bell. Free forever.
        </p>

        {submitted ? (
          <div className="flex items-center gap-3 bg-primary/20 border border-primary/30 rounded-xl px-4 py-3">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary">You're in! First brief arrives tomorrow at 7 AM.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button type="submit"
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-2">
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          No spam. Unsubscribe anytime. Join 2,400+ investors.
        </p>
      </div>
    </div>
  )
}

// ─── Convert CTA sidebar card ─────────────────────────────────────────────────
function ConvertCTA() {
  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 space-y-4 sticky top-24">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <p className="font-black text-sm">Track what you read about</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Reading about NVDA? Add it to your portfolio tracker and monitor it in real time.
      </p>
      <ul className="space-y-2">
        {[
          "Portfolio tracking & analytics",
          "Real-time market heatmaps",
          "AI portfolio insights",
          "Dividend calendar & alerts",
          "Price alerts",
        ].map((f) => (
          <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/auth"
        className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-bold hover:bg-primary/90 transition-colors w-full">
        Start Free — No Card Needed
        <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="text-xs text-center text-muted-foreground">
        🎉 Early bird: $4.99/mo locked forever
      </p>
    </div>
  )
}

// ─── External news at bottom ──────────────────────────────────────────────────
function ExternalNewsRow({ articles }: { articles: ExternalArticle[] }) {
  if (articles.length === 0) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          From Around The Web
        </h3>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 8).map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
            className="group block rounded-xl border border-border bg-card hover:border-border/80 p-3 transition-all">
            <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-2">
              {a.title}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{a.site}</span>
              <span>{formatDate(a.publishedDate)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Main NewsHub component ───────────────────────────────────────────────────
export function NewsHub() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [externalNews, setExternalNews] = useState<ExternalArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fetch blog posts
    fetch("/api/blog-posts?limit=50&published=true")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.posts ?? [])
        setPosts(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch external news quietly
    fetch("/api/news/market")
      .then(r => r.json())
      .then(data => setExternalNews(Array.isArray(data) ? data : []))
      .catch(() => { })
  }, [])

  // All unique tags from posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    posts.forEach(p => p.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).slice(0, 12)
  }, [posts])

  // Filtered posts
  const filtered = useMemo(() => {
    let result = posts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    if (activeTag) {
      result = result.filter(p => p.tags?.includes(activeTag))
    }
    return result
  }, [posts, search, activeTag])

  const heroPost = filtered[0]
  const gridPosts = filtered.slice(1)
  const isFiltering = search || activeTag

  return (
    <div className="space-y-8">

      {/* Breaking ticker */}
      {posts.length > 0 && <BreakingTicker posts={posts.slice(0, 8)} />}

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
              AI-Powered Finance News
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Market Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time analysis powered by AI · Updated 3× daily
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stocks, topics, tickers..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Filter:</span>
          {allTags.map(tag => (
            <button key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${activeTag === tag
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}>
              {tag}
            </button>
          ))}
          {activeTag && (
            <button onClick={() => setActiveTag(null)}
              className="text-xs text-red-500 hover:underline flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Search results count */}
      {isFiltering && (
        <p className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "No posts found"
            : `${filtered.length} post${filtered.length !== 1 ? "s" : ""} found`
          }
        </p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-6">
          <div className="animate-pulse rounded-3xl bg-secondary h-[420px]" />
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border overflow-hidden">
                <div className="h-44 bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/4" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No posts */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <BarChart2 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-bold text-muted-foreground">
            {isFiltering ? "No posts match your search" : "First posts generating soon..."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isFiltering ? "Try a different search term or clear filters" : "Check back in a few minutes"}
          </p>
          {isFiltering && (
            <button onClick={() => { setSearch(""); setActiveTag(null) }}
              className="mt-4 text-primary text-sm hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      {!loading && filtered.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: posts (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero post */}
            {heroPost && !isFiltering && <HeroPost post={heroPost} />}

            {/* Email capture — between hero and grid */}
            {!isFiltering && <EmailCapture />}

            {/* Post grid */}
            {gridPosts.length > 0 && (
              <div>
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {isFiltering ? "Search Results" : "Latest Analysis"}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {(isFiltering ? filtered : gridPosts).map((post, i) => (
                    <PostCard key={post.id} post={post} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky sidebar (1/3 width) */}
          <div>
            <ConvertCTA />
          </div>
        </div>
      )}

      {/* Divider before external news */}
      <div className="border-t border-border pt-8">
        <ExternalNewsRow articles={externalNews} />
      </div>

    </div>
  )
}
