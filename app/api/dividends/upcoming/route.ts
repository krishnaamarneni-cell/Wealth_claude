import { NextRequest, NextResponse } from 'next/server'

// Server-side only - use private environment variables
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const POLYGON_API_KEY = process.env.POLYGON_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const source = searchParams.get('source') || 'both'

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
  }

  if (!FINNHUB_API_KEY || !POLYGON_API_KEY) {
    // Return empty data instead of error when keys are missing
    return NextResponse.json({ source: 'none', data: [] })
  }

  try {
    const today = new Date()
    const oneYearAhead = new Date(today)
    oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1)

    const fromDate = today.toISOString().split('T')[0]
    const toDate = oneYearAhead.toISOString().split('T')[0]

    // Try Finnhub first
    if (source === 'finnhub' || source === 'both') {
      try {
        const finnhubUrl = `https://finnhub.io/api/v1/stock/dividend?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
        const finnhubRes = await fetch(finnhubUrl)

        if (finnhubRes.ok) {
          const data = await finnhubRes.json()
          return NextResponse.json({ source: 'finnhub', data: data || [] })
        }
      } catch (error) {
        console.error('Finnhub API error:', error)
      }
    }

    // Try Polygon if Finnhub failed or requested
    if (source === 'polygon' || source === 'both') {
      try {
        const polygonUrl = `https://api.polygon.io/v3/reference/dividends?ticker=${symbol}&ex_dividend_date.gte=${fromDate}&ex_dividend_date.lte=${toDate}&apiKey=${POLYGON_API_KEY}`
        const polygonRes = await fetch(polygonUrl)

        if (polygonRes.ok) {
          const data = await polygonRes.json()
          return NextResponse.json({
            source: 'polygon',
            data: data.results || [],
          })
        }
      } catch (error) {
        console.error('Polygon API error:', error)
      }
    }

    // Return empty if all sources failed
    return NextResponse.json({ source: 'none', data: [] })
  } catch (error) {
    console.error('Dividend API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dividend data' },
      { status: 500 }
    )
  }
}
