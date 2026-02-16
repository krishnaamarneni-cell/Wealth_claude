import { NextRequest, NextResponse } from 'next/server'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbols = searchParams.get('symbols')

    console.log('Portfolio API called with symbols:', symbols)

    if (!symbols) {
      console.error('No symbols provided')
      return NextResponse.json(
        { error: 'Symbols parameter required' },
        { status: 400 }
      )
    }

    if (!POLYGON_API_KEY) {
      console.error('POLYGON_API_KEY not set')
      return NextResponse.json(
        { error: 'POLYGON_API_KEY not configured' },
        { status: 500 }
      )
    }

    const symbolArray = symbols.split(',').filter(Boolean).slice(0, 5)
    console.log('Processing symbols:', symbolArray)

    if (symbolArray.length === 0) {
      return NextResponse.json([])
    }

    const tickersParam = symbolArray.join(',')
    const url = `https://api.polygon.io/v2/reference/news?ticker=${tickersParam}&limit=20&apiKey=${POLYGON_API_KEY}`

    console.log('Calling Polygon API...')

    const response = await fetch(url, {
      next: { revalidate: 300 }
    })

    console.log('Polygon response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Polygon API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Polygon API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Polygon data:', data)

    if (!data.results || !Array.isArray(data.results)) {
      console.log('No results from Polygon')
      return NextResponse.json([])
    }

    console.log('Found', data.results.length, 'news articles')

    const transformedNews = data.results.map((article: any) => ({
      symbol: article.tickers?.[0] || 'MARKET',
      publishedDate: article.published_utc,
      title: article.title,
      image: article.image_url,
      site: article.publisher?.name || 'Unknown',
      text: article.description || '',
      url: article.article_url,
    }))

    const sortedNews = transformedNews.sort((a: any, b: any) => {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    })

    const uniqueNews = Array.from(
      new Map(sortedNews.map((item: any) => [item.url, item])).values()
    )

    const finalNews = uniqueNews.slice(0, 15)
    console.log('Returning', finalNews.length, 'articles')

    return NextResponse.json(finalNews)

  } catch (error) {
    console.error('Portfolio news API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
