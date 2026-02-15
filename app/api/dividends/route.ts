import { NextRequest, NextResponse } from 'next/server'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface DividendData {
  date: string
  amount: number
  adjustedAmount: number
  declarationDate: string
  recordDate: string
  payDate: string
  currency: string
}

interface DividendResponse {
  symbol: string
  data: DividendData[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker')

    if (!ticker) {
      return NextResponse.json(
        { error: 'ticker parameter is required' },
        { status: 400 }
      )
    }

    if (!FINNHUB_API_KEY) {
      console.error('❌ FINNHUB_API_KEY is not set')
      // Return empty dividend data instead of error
      const result: DividendResponse = {
        symbol: ticker,
        data: [],
      }
      return NextResponse.json(result, { status: 200 })
    }

    // Calculate date range (last 5 years + next 1 year for upcoming)
    const to = new Date()
    to.setFullYear(to.getFullYear() + 1)
    const toDate = to.toISOString().split('T')[0]

    const from = new Date()
    from.setFullYear(from.getFullYear() - 5)
    const fromDate = from.toISOString().split('T')[0]

    // Fetch from Finnhub
    const url = `https://finnhub.io/api/v1/stock/dividend?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`

    console.log(`📡 Fetching dividend data for ${ticker}...`)
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`❌ Finnhub API error: ${response.status}`)
      return NextResponse.json(
        { error: `Finnhub API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    const result: DividendResponse = {
      symbol: ticker,
      data: data || [],
    }

    console.log(`✅ Fetched ${result.data.length} dividends for ${ticker}`)

    // Set cache headers
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION / 1000}, stale-while-revalidate=${CACHE_DURATION / 1000}`,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching dividends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
