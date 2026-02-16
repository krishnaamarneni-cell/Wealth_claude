import { NextRequest, NextResponse } from 'next/server'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY

export async function GET(request: NextRequest) {
  try {
    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: 'FINNHUB_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Fetch general market news
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Finnhub API error:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch news from Finnhub' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return NextResponse.json([])
    }

    // Transform Finnhub format to our format
    const transformedNews = data.map((article: any) => ({
      symbol: article.related || 'MARKET',
      publishedDate: new Date(article.datetime * 1000).toISOString(), // Unix timestamp to ISO
      title: article.headline,
      image: article.image,
      site: article.source,
      text: article.summary || '',
      url: article.url,
      author: article.source,
    }))

    // Filter out articles without proper URLs or titles
    const validNews = transformedNews.filter((article: any) =>
      article.url && article.title && article.url.startsWith('http')
    )

    // Sort by date (most recent first)
    const sortedNews = validNews.sort((a: any, b: any) => {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    })

    // Remove duplicates by URL
    const uniqueNews = Array.from(
      new Map(sortedNews.map((item: any) => [item.url, item])).values()
    )

    return NextResponse.json(uniqueNews.slice(0, 20))

  } catch (error) {
    console.error('Error fetching market news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
