import { NextResponse } from 'next/server'

/**
 * GDELT DOC API — real-time global events
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 *
 * Public domain, no API key needed.
 * Returns articles/events from the last 24 hours matching our filter.
 */

interface GDELTArticle {
  url: string
  url_mobile?: string
  title: string
  seendate: string
  socialimage?: string
  domain: string
  language: string
  sourcecountry: string
  tone?: string
}

interface GDELTResponse {
  articles?: GDELTArticle[]
}

// Cache for 15 min — GDELT updates every 15 min
const cache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_MS = 15 * 60 * 1000

// High-impact queries filtered for financial/geopolitical relevance
const QUERY = '(market OR economy OR federal reserve OR central bank OR inflation OR sanctions OR conflict OR election OR oil OR commodity OR crypto OR bitcoin OR trade war OR tariff OR recession) sourcelang:english'

export async function GET() {
  const now = Date.now()
  const cached = cache.get('events')
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({ ...(cached.data as object), fromCache: true })
  }

  try {
    const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc')
    url.searchParams.set('query', QUERY)
    url.searchParams.set('mode', 'ArtList')
    url.searchParams.set('maxrecords', '25')
    url.searchParams.set('format', 'json')
    url.searchParams.set('sort', 'DateDesc')
    url.searchParams.set('timespan', '24h') // last 24 hours

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'User-Agent': 'WealthClaude/1.0' },
    })

    if (!res.ok) {
      return NextResponse.json({ events: [], error: `GDELT returned ${res.status}` }, { status: 200 })
    }

    const text = await res.text()
    // GDELT sometimes returns HTML on error — check it's JSON
    if (!text.trim().startsWith('{')) {
      return NextResponse.json({ events: [], error: 'GDELT returned non-JSON' }, { status: 200 })
    }

    const data: GDELTResponse = JSON.parse(text)
    const articles = data.articles || []

    // Normalize + dedupe by domain+title prefix
    const seen = new Set<string>()
    const events = articles
      .filter(a => {
        const key = `${a.domain}:${a.title.slice(0, 50)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 15)
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.domain,
        country: a.sourcecountry,
        publishedAt: a.seendate, // YYYYMMDDTHHMMSSZ format
        image: a.socialimage || null,
        tone: a.tone ? parseFloat(a.tone) : null,
      }))

    const result = { events, timestamp: now }
    cache.set('events', { data: result, expiresAt: now + CACHE_MS })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err.message || 'Failed to fetch events' }, { status: 200 })
  }
}
