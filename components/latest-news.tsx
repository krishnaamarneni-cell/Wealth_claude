"use client"
import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NewsArticle {
  publishedDate: string
  title: string
  url: string
}

function formatDate(dateString: string) {
  const diffMins = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000)
  const diffHours = Math.floor(diffMins / 60)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function LatestNews() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/news/market")
      .then(r => r.json())
      .then(data => { setNews(data.slice(0, 6)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Latest
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse mb-2" />)
        ) : (
          <div className="space-y-1">
            {news.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 hover:bg-secondary/50 rounded-lg p-2 transition-colors"
              >
                <span className="text-base font-bold text-muted-foreground/30 shrink-0 w-5 text-center leading-tight mt-0.5">
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
      </CardContent>
    </Card>
  )
}
