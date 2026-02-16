"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, ExternalLink, Clock, TrendingUp, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import Image from "next/image"

interface NewsArticle {
  symbol: string
  publishedDate: string
  title: string
  image: string
  site: string
  text: string
  url: string
  source?: 'polygon' | 'finnhub'
}

interface NewsFeedProps {
  type: 'portfolio' | 'market'
  title?: string
  description?: string
}

const NEWS_PER_PAGE = 5

export default function NewsFeed({ type, title, description }: NewsFeedProps) {
  const { holdings, isLoading: portfolioLoading } = usePortfolio()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true)
      setError(null)

      try {
        let url = '/api/news/market'

        if (type === 'portfolio') {
          if (holdings.length === 0) {
            setNews([])
            setIsLoading(false)
            return
          }

          const symbols = holdings.map(h => h.symbol).filter(Boolean).join(',')

          if (!symbols) {
            setNews([])
            setIsLoading(false)
            return
          }

          url = `/api/news/portfolio?symbols=${symbols}`
        }

        console.log(`Fetching ${type} news from:`, url)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        console.log(`Received ${data.length} ${type} articles`)

        setNews(data)
        setCurrentPage(1) // Reset to page 1 on new data

      } catch (err) {
        console.error('Error fetching news:', err)
        setError(err instanceof Error ? err.message : 'Unable to load news')
      } finally {
        setIsLoading(false)
      }
    }

    if (type === 'portfolio' && portfolioLoading) {
      return
    }

    fetchNews()

    // Refresh every 1 HOUR (3600000 ms)
    const interval = setInterval(fetchNews, 60 * 60 * 1000)
    return () => clearInterval(interval)

  }, [type, holdings, portfolioLoading])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  const userOwns = (symbol: string) => {
    return holdings.some(h => h.symbol === symbol)
  }

  const defaultTitle = type === 'portfolio'
    ? 'Your Portfolio News'
    : 'Market News'

  const defaultDescription = type === 'portfolio'
    ? 'Latest news for stocks you own'
    : 'Trending stories and market updates'

  // Pagination
  const totalPages = Math.ceil(news.length / NEWS_PER_PAGE)
  const startIndex = (currentPage - 1) * NEWS_PER_PAGE
  const endIndex = startIndex + NEWS_PER_PAGE
  const currentNews = news.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

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
            {[...Array(NEWS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-24 h-24 bg-secondary rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                  <div className="h-3 bg-secondary rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 font-semibold mb-1">{error}</p>
            <p className="text-xs text-muted-foreground">
              Check console or try again later.
            </p>
          </div>
        )}

        {!isLoading && !error && news.length === 0 && (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground font-semibold mb-1">
              {type === 'portfolio'
                ? 'No news available for your holdings'
                : 'No news available'}
            </p>
            {type === 'portfolio' && holdings.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Tracking: {holdings.map(h => h.symbol).slice(0, 5).join(', ')}
                {holdings.length > 5 && ` +${holdings.length - 5} more`}
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && currentNews.length > 0 && (
          <>
            <div className="space-y-4">
              {currentNews.map((article, index) => (
                <a
                  key={`${article.url}-${index}`}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                >
                  {/* Thumbnail with Logo Fallback */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          // Replace with logo on error
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-blue-500/10">
                                <svg class="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                                </svg>
                              </div>
                            `
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500/10">
                        <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {article.symbol && article.symbol !== 'MARKET' && (
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

                    <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-blue-500 transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    {article.text && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.text}
                      </p>
                    )}

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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Article Count Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, news.length)} of {news.length} articles
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
