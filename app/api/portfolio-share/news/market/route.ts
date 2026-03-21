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

// Fetch from Polygon (general market news)
async function fetchPolygonMarketNews(): Promise<NewsArticle[]> {
  if (!POLYGON_API_KEY) {
    console.log('Polygon API key not configured')
    return []
  }

  try {
    // Get general market news (no ticker filter)
    const url = `https://api.polygon.io/v2/reference/news?limit=30&apiKey=${POLYGON_API_KEY}`

    console.log('Calling Polygon market news API')

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      console.error('Polygon market API error:', response.status)
      return []
    }

    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      console.log('No results from Polygon market news')
      return []
    }

    console.log(`Polygon market returned ${data.results.length} articles`)

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
    console.error('Polygon market fetch error:', error)
    return []
  }
}

// Fetch from Finnhub (general market news)
async function fetchFinnhubMarketNews(): Promise<NewsArticle[]> {
  if (!FINNHUB_API_KEY) {
    console.log('Finnhub API key not configured')
    return []
  }

  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`

    console.log('Calling Finnhub market news API')

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      console.error('Finnhub market API error:', response.status)
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      console.log('No results from Finnhub market news')
      return []
    }

    console.log(`Finnhub market returned ${data.length} articles`)

    return data.map((article: any) => ({
      symbol: article.related || 'MARKET',
      publishedDate: new Date(article.datetime * 1000).toISOString(),
      title: article.headline,
      image: article.image || '',
      site: article.source || 'Unknown',
      text: article.summary || '',
      url: article.url,
      source: 'finnhub' as const
    }))
  } catch (error) {
    console.error('Finnhub market fetch error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Market news requested')

    // Try both APIs in parallel
    const [polygonNews, finnhubNews] = await Promise.all([
      fetchPolygonMarketNews(),
      fetchFinnhubMarketNews()
    ])

    // Combine both sources
    const allNews = [...polygonNews, ...finnhubNews]

    console.log(`Total market articles before dedup: ${allNews.length}`)

    if (allNews.length === 0) {
      console.log('No market news found from either API')
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

    console.log(`Final market articles after dedup: ${uniqueNews.length}`)

    // Return top 25 articles
    return NextResponse.json(uniqueNews.slice(0, 25))

  } catch (error) {
    console.error('Market news API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
