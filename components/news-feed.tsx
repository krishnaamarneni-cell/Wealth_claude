"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, ExternalLink, Clock, TrendingUp } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

interface NewsArticle {
  symbol: string
  publishedDate: string
  title: string
  image: string
  site: string
  text: string
  url: string
}

interface NewsFeedProps {
  type: 'portfolio' | 'market'
  title?: string
  description?: string
}

export default function NewsFeed({ type, title, description }: NewsFeedProps) {
  const { holdings } = usePortfolio()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true)
      setError(null)

      try {
        let url = '/api/news/market'

        if (type === 'portfolio') {
          // Get symbols from holdings
          const symbols = holdings.map(h => h.symbol).join(',')

          if (!symbols) {
            setNews([])
            setIsLoading(false)
            return
          }

          url = `/api/news/portfolio?symbols=${symbols}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }

        const data = await response.json()
        setNews(data)

      } catch (err) {
        console.error('Error fetching news:', err)
        setError('Unable to load news')
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if we have holdings for portfolio type
    if (type === 'portfolio' && holdings.length === 0) {
      setNews([])
      setIsLoading(false)
      return
    }

    fetchNews()

    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)

  }, [type, holdings])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Check if user owns this stock
  const userOwns = (symbol: string) => {
    return holdings.some(h => h.symbol === symbol)
  }

  const defaultTitle = type === 'portfolio'
    ? 'Your Portfolio News'
    : 'Market News'

  const defaultDescription = type === 'portfolio'
    ? 'Latest news for stocks you own'
    : 'Trending stories and market updates'

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-500" />
              {title || defaultTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {description || defaultDescription}
            </p>
          </div>
          {type === 'market' && (
            <TrendingUp className="h-5 w-5 text-green-500" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-24 h-24 bg-secondary rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                  <div className="h-3 bg-secondary rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {!isLoading && !error && news.length === 0 && (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {type === 'portfolio'
                ? 'Add stocks to your portfolio to see relevant news'
                : 'No news available'}
            </p>
          </div>
        )}

        {!isLoading && !error && news.length > 0 && (
          <div className="space-y-4">
            {news.map((article, index) => (
              <a
                key={`${article.url}-${index}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                {/* Thumbnail */}
                {article.image && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {article.symbol && (
                      <Badge
                        variant="secondary"
                        className={userOwns(article.symbol) ? 'bg-blue-500/20 text-blue-500' : ''}
                      >
                        {article.symbol}
                        {userOwns(article.symbol) && ' ✓'}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(article.publishedDate)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-blue-500 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {article.text}
                  </p>

                  {/* Source */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {article.site}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* View All Button */}
        {!isLoading && news.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <a
                href={type === 'portfolio' ? '#' : 'https://finance.yahoo.com/news'}
                target="_blank"
                rel="noopener noreferrer"
              >
                View More News
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
