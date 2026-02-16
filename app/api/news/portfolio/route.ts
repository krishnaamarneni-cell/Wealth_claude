import { NextRequest, NextResponse } from 'next/server'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbols = searchParams.get('symbols') // e.g., "AAPL,TSLA,MSFT"

    if (!symbols) {
      return NextResponse.json(
        { error: 'Symbols parameter required' },
        { status: 400 }
      )
    }

    if (!POLYGON_API_KEY) {
      return NextResponse.json(
        { error: 'POLYGON_API_KEY not configured' },
        { status: 500 }
      )
    }

    const symbolArray = symbols.split(',').slice(0, 5) // Max 5 symbols to stay under rate limit

    // Fetch news for multiple tickers at once
    const tickersParam = symbolArray.join(',')
    const url = `https://api.polygon.io/v2/reference/news?ticker=${tickersParam}&limit=20&apiKey=${POLYGON_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Polygon API error:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch news from Polygon' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      return NextResponse.json([])
    }

    // Transform Polygon format to our format
    const transformedNews = data.results.map((article: any) => ({
      symbol: article.tickers?.[0] || 'MARKET', // First ticker
      publishedDate: article.published_utc,
      title: article.title,
      image: article.image_url,
      site: article.publisher?.name || 'Unknown',
      text: article.description || '',
      url: article.article_url,
      author: article.author || '',
    }))

    // Sort by date (most recent first)
    const sortedNews = transformedNews.sort((a: any, b: any) => {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    })

    // Remove duplicates by URL
    const uniqueNews = Array.from(
      new Map(sortedNews.map((item: any) => [item.url, item])).values()
    )

    return NextResponse.json(uniqueNews.slice(0, 15))

  } catch (error) {
    console.error('Error fetching portfolio news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
