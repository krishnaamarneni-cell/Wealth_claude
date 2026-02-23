"use client"

import { useEffect, useState } from "react"
import { Flame, Clock, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NewsArticle {
  publishedDate: string
  title: string
  image: string
  site: string
  url: string
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
    const diffHours = Math.floor(diffMins / 60)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch { return "Recently" }
}

function ThumbImage({ url, title }: { url: string; title: string }) {
  const [error, setError] = useState(false)
  if (!url || error) {
    return (
      <div className="w-14 h-14 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-muted-foreground/30" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className="w-14 h-14 rounded-lg object-cover shrink-0"
      onError={() => setError(true)}
    />
  )
}

export function TrendingNews() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/news/market")
      .then((r) => r.json())
      .then((data) => { setNews(data.slice(0, 6)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading
          ? [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 mb-3 animate-pulse">
              <div className="w-14 h-14 bg-secondary rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary rounded w-full" />
                <div className="h-3 bg-secondary rounded w-2/3" />
              </div>
            </div>
          ))
          : (
            <div className="space-y-3">
              {news.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 hover:bg-secondary/50 rounded-lg p-1.5 transition-colors"
                >
                  <ThumbImage url={article.image} title={article.title} />
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
          )
        }
      </CardContent>
    </Card>
  )
}
