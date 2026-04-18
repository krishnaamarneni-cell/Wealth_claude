import { NextResponse } from 'next/server'

/**
 * GDELT DOC API — real-time global events grouped by category.
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 *
 * Public domain, no API key needed. Cached 15 min.
 */

interface GDELTArticle {
  url: string
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

const cache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_MS = 15 * 60 * 1000

// Category queries — each hits GDELT once
const CATEGORIES: { key: string; query: string; label: string }[] = [
  {
    key: 'geopolitics',
    label: 'Geopolitics & Economy',
    query: '(federal reserve OR "central bank" OR inflation OR sanctions OR election OR recession OR tariff OR "trade war") sourcelang:english',
  },
  {
    key: 'wars',
    label: 'Wars & Conflicts',
    query: '(airstrike OR ceasefire OR "military operation" OR "armed forces" OR drone strike OR hostage OR insurgent OR "war crime") sourcelang:english',
  },
  {
    key: 'technology',
    label: 'Technology',
    query: '(artificial intelligence OR semiconductor OR "data center" OR cloud computing OR nvidia OR apple OR microsoft OR google OR openai OR "tech stock") sourcelang:english',
  },
  {
    key: 'commodities',
    label: 'Commodities',
    query: '(crude oil OR brent OR gold price OR copper price OR natural gas OR wheat futures OR lithium OR commodity prices) sourcelang:english',
  },
  {
    key: 'world',
    label: 'World News',
    query: '(breaking news OR world news OR global) sourcelang:english',
  },
  {
    key: 'markets',
    label: 'Markets & Finance',
    query: '(stock market OR nasdaq OR "s&p 500" OR dow jones OR crypto OR bitcoin OR wall street OR earnings) sourcelang:english',
  },
]

async function fetchCategory(query: string): Promise<any[]> {
  try {
    const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc')
    url.searchParams.set('query', query)
    url.searchParams.set('mode', 'ArtList')
    url.searchParams.set('maxrecords', '15')
    url.searchParams.set('format', 'json')
    url.searchParams.set('sort', 'DateDesc')
    url.searchParams.set('timespan', '24h')

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'User-Agent': 'WealthClaude/1.0' },
    })

    if (!res.ok) return []
    const text = await res.text()
    if (!text.trim().startsWith('{')) return []

    const data: GDELTResponse = JSON.parse(text)
    const articles = data.articles || []

    // Dedupe by domain+title prefix
    const seen = new Set<string>()
    return articles
      .filter(a => {
        const key = `${a.domain}:${a.title.slice(0, 50)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 8)
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.domain,
        country: a.sourcecountry,
        publishedAt: a.seendate,
        image: a.socialimage || null,
        tone: a.tone ? parseFloat(a.tone) : null,
      }))
  } catch {
    return []
  }
}

export async function GET() {
  const now = Date.now()
  const cached = cache.get('all-events')
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({ ...(cached.data as object), fromCache: true })
  }

  try {
    // Fetch all 6 categories in parallel (GDELT handles concurrent requests well)
    const results = await Promise.all(
      CATEGORIES.map(c => fetchCategory(c.query).then(events => ({ key: c.key, label: c.label, events })))
    )

    // Build flat map: { geopolitics: [...], wars: [...], ... }
    const categorized: Record<string, any[]> = {}
    results.forEach(({ key, events }) => { categorized[key] = events })

    // Legacy flat events array (all combined, deduped by title) — for backwards compat
    const allSeen = new Set<string>()
    const events = results
      .flatMap(r => r.events)
      .filter(e => {
        const k = e.title.slice(0, 60)
        if (allSeen.has(k)) return false
        allSeen.add(k)
        return true
      })
      .slice(0, 20)

    const result = {
      events,                 // backwards compat
      categories: categorized, // new: { geopolitics, wars, technology, commodities, world, markets }
      timestamp: now,
    }
    cache.set('all-events', { data: result, expiresAt: now + CACHE_MS })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ events: [], categories: {}, error: err.message }, { status: 200 })
  }
}
