"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react"

const FALLBACK_POSTS = [
  {
    slug: "how-to-track-dividend-stocks",
    tag: "Dividends",
    title: "How to Track Dividend Stocks for Free in 2026",
    excerpt: "Learn how to monitor your dividend income, yield on cost, and payout schedules — all without paying for expensive software.",
    readTime: "5 min read",
    image_url: null as string | null,
  },
  {
    slug: "sp500-heatmap-explained",
    tag: "Market Analysis",
    title: "How to Read a Stock Market Heatmap",
    excerpt: "Green, red, big tiles, small tiles — here's exactly what every element of a market heatmap is telling you about where money is flowing.",
    readTime: "4 min read",
    image_url: null as string | null,
  },
  {
    slug: "nasdaq-vs-sp500",
    tag: "Investing",
    title: "NASDAQ 100 vs S&P 500 — What's the Difference?",
    excerpt: "Both are major US indices but they track very different things. Here's how to decide which one matters more for your portfolio.",
    readTime: "6 min read",
    image_url: null as string | null,
  },
  {
    slug: "portfolio-diversification",
    tag: "Strategy",
    title: "How to Diversify Your Portfolio Across Markets",
    excerpt: "True diversification goes beyond picking different stocks. Here's how to spread risk across sectors, geographies, and asset classes.",
    readTime: "7 min read",
    image_url: null as string | null,
  },
  {
    slug: "dividend-yield-vs-growth",
    tag: "Dividends",
    title: "Dividend Yield vs Dividend Growth: Which Matters More?",
    excerpt: "A high yield looks attractive but dividend growth is what builds long-term wealth. Understanding the difference can transform your strategy.",
    readTime: "5 min read",
    image_url: null as string | null,
  },
  {
    slug: "reading-global-markets",
    tag: "Global Markets",
    title: "How to Follow Global Stock Markets Without Being Overwhelmed",
    excerpt: "From the Nikkei to the FTSE to emerging markets — here's a simple framework for keeping tabs on what's happening around the world.",
    readTime: "6 min read",
    image_url: null as string | null,
  },
]

interface Post {
  slug: string
  tag: string
  title: string
  excerpt: string
  readTime: string
  image_url: string | null
}

export function BlogSection() {
  const [posts, setPosts] = useState<Post[]>(FALLBACK_POSTS)
  const [page, setPage] = useState(0)          // which group of 3 is showing
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("left")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/blog-posts")
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.length > 0) setPosts(data) })
      .catch(() => { })
  }, [])

  const totalPages = Math.ceil(posts.length / 3)

  const goTo = (nextPage: number, dir: "left" | "right") => {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setPage((nextPage + totalPages) % totalPages)
      setAnimating(false)
    }, 320)
  }

  const next = () => goTo(page + 1, "left")
  const prev = () => goTo(page - 1, "right")

  // Auto-advance every 3 seconds
  useEffect(() => {
    timerRef.current = setInterval(next, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [page, posts.length, animating])

  const pauseTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }
  const resumeTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 3000)
  }

  const visible = posts.slice(page * 3, page * 3 + 3)

  // Slide transform based on direction + animating state
  const slideStyle: React.CSSProperties = {
    transform: animating
      ? direction === "left" ? "translateX(-8%)" : "translateX(8%)"
      : "translateX(0)",
    opacity: animating ? 0 : 1,
    transition: "transform 320ms cubic-bezier(0.4,0,0.2,1), opacity 320ms ease",
  }

  return (
    <section
      className="py-20 px-4 bg-secondary/20"
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      <div className="container mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Learn While You Track
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Practical investing guides written for real investors — not finance professors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Prev / Next */}
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Button asChild variant="outline">
              <Link href="/news">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Cards with slide animation */}
        <div className="overflow-hidden">
          <div className="grid md:grid-cols-3 gap-6" style={slideStyle}>
            {visible.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col"
              >
                {post.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-3">
                    <span className="text-xs font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">
                      {post.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > page ? "left" : "right")}
              className={`rounded-full transition-all duration-300 ${i === page
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-border hover:bg-primary/40"
                }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
