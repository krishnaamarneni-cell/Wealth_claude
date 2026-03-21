import { NextRequest, NextResponse } from 'next/server'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY

interface NewsArticle {
  symbol: string
  publishedDate: string
  title: string
  image: string
  site: string
  text: string
  url: string
  source: 'polygon' | 'finnhub'
}

// Fetch from Polygon
async function fetchPolygonNews(symbols: string[]): Promise<NewsArticle[]> {
  if (!POLYGON_API_KEY) {
    console.log('Polygon API key not configured')
    return []
  }

  try {
    const tickersParam = symbols.slice(0, 5).join(',') // Max 5 to stay under rate limit
    const url = `https://api.polygon.io/v2/reference/news?ticker=${tickersParam}&limit=20&apiKey=${POLYGON_API_KEY}`

    console.log('Calling Polygon API for:', tickersParam)

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      console.error('Polygon API error:', response.status)
      return []
    }

    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      console.log('No results from Polygon')
      return []
    }

    console.log(`Polygon returned ${data.results.length} articles`)

    return data.results.map((article: any) => ({
      symbol: article.tickers?.[0] || 'MARKET',
      publishedDate: article.published_utc,
      title: article.title,
      image: article.image_url || '',
      site: article.publisher?.name || 'Unknown',
      text: article.description || '',
      url: article.article_url,
      source: 'polygon' as const
    }))
  } catch (error) {
    console.error('Polygon fetch error:', error)
    return []
  }
}

// Fetch from Finnhub (fallback)
async function fetchFinnhubNews(symbols: string[]): Promise<NewsArticle[]> {
  if (!FINNHUB_API_KEY) {
    console.log('Finnhub API key not configured')
    return []
  }

  try {
    // Fetch news for each symbol (Finnhub requires individual calls)
    const newsPromises = symbols.slice(0, 10).map(async (symbol) => {
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const from = lastWeek.toISOString().split('T')[0]
      const to = today.toISOString().split('T')[0]

      const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`

      const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
      })

      if (!response.ok) {
        console.error(`Finnhub error for ${symbol}:`, response.status)
        return []
      }

      const data = await response.json()

      if (!Array.isArray(data)) return []

      // Take top 3 per symbol
      return data.slice(0, 3).map((article: any) => ({
        symbol: symbol,
        publishedDate: new Date(article.datetime * 1000).toISOString(),
        title: article.headline,
        image: article.image || '',
        site: article.source || 'Unknown',
        text: article.summary || '',
        url: article.url,
        source: 'finnhub' as const
      }))
    })

    const allNews = await Promise.all(newsPromises)
    const flatNews = allNews.flat()

    console.log(`Finnhub returned ${flatNews.length} articles`)

    return flatNews
  } catch (error) {
    console.error('Finnhub fetch error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbolsParam = searchParams.get('symbols')

    console.log('Portfolio news requested for:', symbolsParam)

    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Symbols parameter required' },
        { status: 400 }
      )
    }

    const symbols = symbolsParam.split(',').filter(Boolean)

    if (symbols.length === 0) {
      return NextResponse.json([])
    }

    console.log(`Fetching news for ${symbols.length} symbols`)

    // Try both APIs in parallel
    const [polygonNews, finnhubNews] = await Promise.all([
      fetchPolygonNews(symbols),
      fetchFinnhubNews(symbols)
    ])

    // Combine both sources
    const allNews = [...polygonNews, ...finnhubNews]

    console.log(`Total articles before dedup: ${allNews.length}`)

    if (allNews.length === 0) {
      console.log('No news found from either API')
      return NextResponse.json([])
    }

    // Sort by date (most recent first)
    const sortedNews = allNews.sort((a, b) => {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    })

    // Remove duplicates by URL
    const uniqueNews = Array.from(
      new Map(sortedNews.map(item => [item.url, item])).values()
    )

    // Also remove duplicates by similar titles (90% match)
    const deduplicatedNews = uniqueNews.filter((article, index, self) => {
      return index === self.findIndex(a => {
        const similarity = getSimilarity(a.title, article.title)
        return similarity > 0.9 && a.url !== article.url
      }) === false || index === self.findIndex(a => a.url === article.url)
    })

    console.log(`Final articles after dedup: ${deduplicatedNews.length}`)

    // Return top 20 articles
    return NextResponse.json(deduplicatedNews.slice(0, 20))

  } catch (error) {
    console.error('Portfolio news API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// Helper: Calculate title similarity (simple Levenshtein distance)
function getSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
