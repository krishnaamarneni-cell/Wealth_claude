import { NextRequest, NextResponse } from 'next/server'

const FMP_API_KEY = process.env.FMP_API_KEY

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

    const symbolArray = symbols.split(',').slice(0, 10) // Max 10 symbols
    const limit = 5 // News articles per symbol

    // Fetch news for each symbol
    const newsPromises = symbolArray.map(async (symbol) => {
      const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=${limit}&apikey=${FMP_API_KEY}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`Failed to fetch news for ${symbol}`)
        return []
      }

      return response.json()
    })

    const allNewsArrays = await Promise.all(newsPromises)

    // Flatten and combine all news
    const allNews = allNewsArrays.flat()

    // Sort by publishedDate (most recent first)
    const sortedNews = allNews.sort((a, b) => {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    })

    // Remove duplicates by URL
    const uniqueNews = Array.from(
      new Map(sortedNews.map(item => [item.url, item])).values()
    )

    // Return top 15 articles
    return NextResponse.json(uniqueNews.slice(0, 15))

  } catch (error) {
    console.error('Error fetching portfolio news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
