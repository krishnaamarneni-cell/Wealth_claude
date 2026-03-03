import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = req.headers.get('authorization')
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results: Record<number, number> = {}
    const baseUrl = req.nextUrl.origin
    const shipsBearerToken = `Bearer ${process.env.CRON_SECRET}`

    // Loop through all 12 regions (0-11)
    for (let region = 0; region < 12; region++) {
      try {
        const response = await fetch(
          `${baseUrl}/api/cron/ships?region=${region}`,
          {
            method: 'POST',
            headers: {
              'Authorization': shipsBearerToken,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          console.error(`[v0] Region ${region} failed with status ${response.status}`)
          results[region] = 0
          continue
        }

        const data = await response.json()
        results[region] = data.shipsCount || data.count || 0
        console.log(`[v0] Region ${region}: ${results[region]} ships saved`)
      } catch (error) {
        console.error(`[v0] Error processing region ${region}:`, error)
        results[region] = 0
      }
    }

    // Calculate summary
    const totalShips = Object.values(results).reduce((sum, count) => sum + count, 0)
    const regionsProcessed = Object.keys(results).length

    return NextResponse.json({
      success: true,
      message: `Seeded ships across all regions`,
      totalShips,
      regionsProcessed,
      shipsPerRegion: results,
    })
  } catch (error) {
    console.error('[v0] Seed ships error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
