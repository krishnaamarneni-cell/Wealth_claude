import { NextResponse } from 'next/server'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const serverCache = new Map<string, { data: unknown; expiresAt: number }>()

export async function GET() {
  const CACHE_KEY = 'economic-calendar'
  const cached = serverCache.get(CACHE_KEY)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ ...cached.data, fromCache: true })
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json({ error: 'API key not configured', events: [] }, { status: 500 })
  }

  const now = new Date()
  const from = now.toISOString().split('T')[0]
  const to = new Date(now.getTime() + 7 * 86400_000).toISOString().split('T')[0]

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error(`Finnhub ${res.status}`)

    const data = await res.json()
    const events = (data.economicCalendar ?? [])
      .filter((e: any) => e.country === 'US' && (e.impact === 'high' || e.impact === 'medium'))
      .map((e: any) => ({
        event: e.event ?? '',
        time: e.time ?? '',
        impact: e.impact ?? 'low',
        estimate: e.estimate ?? null,
        prev: e.prev ?? null,
        actual: e.actual ?? null,
        unit: e.unit ?? '',
      }))
      .slice(0, 12)

    const result = { events, timestamp: Date.now() }
    // Calendar data: cache for 12 hours (events rarely change intraday)
    serverCache.set(CACHE_KEY, { data: result, expiresAt: Date.now() + 12 * 3600_000 })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[economic-calendar]', err)
    return NextResponse.json({ error: 'Failed to fetch', events: [] }, { status: 500 })
  }
}
