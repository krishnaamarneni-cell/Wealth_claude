import { NextResponse } from 'next/server'

/**
 * GDELT DOC API — one big query, categorize results server-side.
 *
 * GDELT rate-limits to 1 request per 5 seconds. We fire a single broad query,
 * get up to 75 articles, then bucket them into categories by keyword matching.
 * Much more efficient than 6 separate queries.
 *
 * Public domain, no API key needed. Cached 20 min.
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

interface CategorizedArticle {
  title: string
  url: string
  source: string
  country: string
  publishedAt: string
  image: string | null
  tone: number | null
}

const cache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_MS = 20 * 60 * 1000

// One broad query — covers all our categories
const MASTER_QUERY =
  '(federal reserve OR inflation OR sanctions OR tariff OR recession OR ' +
  '"artificial intelligence" OR semiconductor OR nvidia OR openai OR ' +
  'airstrike OR ceasefire OR "military operation" OR conflict OR ' +
  '"crude oil" OR "gold price" OR "natural gas" OR copper OR lithium OR ' +
  '"stock market" OR nasdaq OR bitcoin OR "wall street" OR earnings OR ' +
  '"breaking news") sourcelang:english'

// Category keyword matchers (lowercase title search)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  wars: ['airstrike', 'ceasefire', 'military', 'war', 'strike', 'conflict', 'troops', 'missile', 'drone', 'hostage', 'insurgent', 'combat', 'invasion', 'attack'],
  technology: ['ai ', 'a.i.', 'artificial intelligence', 'semiconductor', 'chip', 'nvidia', 'apple ', 'microsoft', 'google', 'openai', 'tech ', 'software', 'cloud', 'data center', 'cyber', 'robot'],
  commodities: ['oil', 'brent', 'crude', 'gold', 'copper', 'natural gas', 'lng', 'wheat', 'corn', 'lithium', 'commodity', 'commodities', 'metal', 'silver'],
  markets: ['stock', 'nasdaq', 's&p', 'dow', 'crypto', 'bitcoin', 'ethereum', 'wall street', 'earnings', 'shares', 'equity', 'dividend', 'ipo'],
  geopolitics: ['federal reserve', 'fed ', 'powell', 'inflation', 'sanctions', 'tariff', 'trade war', 'recession', 'election', 'central bank', 'ecb', 'boe', 'boj', 'economy'],
}

function categorize(article: CategorizedArticle): string {
  const title = article.title.toLowerCase()
  // Check in priority order (wars > tech > commodities > markets > geopolitics > world)
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => title.includes(kw))) return cat
  }
  return 'world'
}

export async function GET() {
  const now = Date.now()
  const cached = cache.get('all-events')
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({ ...(cached.data as object), fromCache: true })
  }

  try {
    const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc')
    url.searchParams.set('query', MASTER_QUERY)
    url.searchParams.set('mode', 'ArtList')
    url.searchParams.set('maxrecords', '75')
    url.searchParams.set('format', 'json')
    url.searchParams.set('sort', 'DateDesc')
    url.searchParams.set('timespan', '24h')

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'User-Agent': 'WealthClaude/1.0 (https://wealthclaude.com)' },
    })

    if (!res.ok) {
      return NextResponse.json({ categories: {}, events: [], error: `GDELT ${res.status}` }, { status: 200 })
    }

    const text = await res.text()

    // GDELT returns rate-limit message as plain text
    if (!text.trim().startsWith('{')) {
      // Serve stale cache if available
      if (cached) {
        return NextResponse.json({ ...(cached.data as object), fromCache: true, stale: true })
      }
      return NextResponse.json({ categories: {}, events: [], error: 'rate-limited' }, { status: 200 })
    }

    const data = JSON.parse(text)
    const articles: GDELTArticle[] = data.articles || []

    // Dedupe and normalize
    const seen = new Set<string>()
    const normalized: CategorizedArticle[] = articles
      .filter(a => {
        const key = a.title.slice(0, 60).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.domain,
        country: a.sourcecountry,
        publishedAt: a.seendate,
        image: a.socialimage || null,
        tone: a.tone ? parseFloat(a.tone) : null,
      }))

    // Bucket into categories
    const categorized: Record<string, CategorizedArticle[]> = {
      wars: [],
      technology: [],
      commodities: [],
      markets: [],
      geopolitics: [],
      world: [],
    }

    for (const article of normalized) {
      const cat = categorize(article)
      if (categorized[cat].length < 10) {
        categorized[cat].push(article)
      }
    }

    // Fallback: if a category has 0, fill from world
    for (const cat of Object.keys(categorized)) {
      if (cat === 'world') continue
      if (categorized[cat].length === 0 && categorized.world.length > 3) {
        categorized[cat] = categorized.world.slice(0, 3)
      }
    }

    const result = {
      events: normalized.slice(0, 20), // backwards compat
      categories: categorized,
      timestamp: now,
    }
    cache.set('all-events', { data: result, expiresAt: now + CACHE_MS })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ categories: {}, events: [], error: err.message }, { status: 200 })
  }
}
