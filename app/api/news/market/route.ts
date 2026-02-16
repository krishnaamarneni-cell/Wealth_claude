import { NextRequest, NextResponse } from 'next/server'

const FMP_API_KEY = process.env.FMP_API_KEY

export async function GET(request: NextRequest) {
  try {
    const limit = 20 // Top 20 market news articles

    // Fetch general stock market news
    const url = `https://financialmodelingprep.com/api/v3/stock_news?limit=${limit}&apikey=${FMP_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error('Failed to fetch market news')
    }

    const news = await response.json()

    return NextResponse.json(news)

  } catch (error) {
    console.error('Error fetching market news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
