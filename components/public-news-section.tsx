"use client"

import { useEffect, useState } from "react"
import { Clock, ExternalLink, FileText, TrendingUp, Flame, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface NewsArticle {
  symbol: string
  publishedDate: string
  title: string
  image: string
  site: string
  text: string
  url: string
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return "Recently"
  }
}

function ArticleImage({ url, title }: { url: string; title: string }) {
  const [error, setError] = useState(false)
  if (!url || error) {
    return (
      <div className="w-full h-48 bg-secondary/50 rounded-t-2xl flex items-center justify-center">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className="w-full h-48 object-cover rounded-t-2xl group-hover:scale-[1.02] transition-transform duration-300"
      onError={() => setError(true)}
    />
  )
}

function MainArticleSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border overflow-hidden">
      <div className="h-48 bg-secondary" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-secondary rounded w-1/4" />
        <div className="h-5 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-full" />
        <div className="h-3 bg-secondary rounded w-2/3" />
      </div>
    </div>
  )
}

export function PublicNewsSection() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/news/market")
      .then((r) => r.json())
      .then((data) => { setNews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const mainArticles = news.slice(0, 10)
  const latestArticles = news.slice(0, 6)
  const trendingArticles = news.slice(6, 12)

  return (
    <div className="grid lg:grid-cols-3 gap-6">

      {/* ── Main Feed (left 2/3) ── */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Market News
        </h2>

        {loading
          ? [...Array(4)].map((_, i) => <MainArticleSkeleton key={i} />)
          : mainArticles.map((article, i) => (
            <a
              key={`${article.url}-${i}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-border bg-card hover:border-primary/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="overflow-hidden">
                <ArticleImage url={article.image} title={article.title} />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{article.site}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(article.publishedDate)}
                  </span>
                </div>
                <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors mb-2">
                  {article.title}
                </h3>
                {article.text && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.text}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  Read full article <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </a>
          ))}
      </div>

      {/* ── Sidebar (right 1/3) ── */}
      <div className="space-y-6">

        {/* Latest */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Latest
          </h3>
          {loading
            ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse mb-2" />
            ))
            : (
              <div className="space-y-1">
                {latestArticles.map((article, i) => (
                  <a
                    key={`latest-${i}`}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 hover:bg-secondary/50 rounded-lg p-2 transition-colors"
                  >
                    <span className="text-lg font-bold text-muted-foreground/30 shrink-0 w-5 text-center leading-tight mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(article.publishedDate)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
        </div>

        {/* Trending */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Trending
          </h3>
          {loading
            ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse mb-2" />
            ))
            : (
              <div className="space-y-1">
                {trendingArticles.map((article, i) => (
                  <a
                    key={`trending-${i}`}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 hover:bg-secondary/50 rounded-lg p-2 transition-colors"
                  >
                    <span className="text-lg font-bold text-orange-500/30 shrink-0 w-5 text-center leading-tight mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{article.site}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
        </div>

        {/* CTA Box */}
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-center space-y-3">
          <p className="font-bold text-base">Track Your Portfolio</p>
          <p className="text-sm text-muted-foreground">
            See how today's news affects YOUR stocks in real time
          </p>
          <Link
            href="/auth"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full"
          >
            Start Free — No Credit Card
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
