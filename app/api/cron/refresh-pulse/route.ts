import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * CRON REFRESH — fetches Global Pulse data and saves to Supabase.
 *
 * Called by cron-job.org every 15-30 min. Must bypass rate limits because
 * it's the ONLY thing hitting external APIs now (user page reads from DB).
 *
 * URL: /api/cron/refresh-pulse?secret=CRON_SECRET
 *
 * Sources:
 * - GDELT (geopolitical news, categorized by keywords)
 * - USGS (earthquakes M4.5+ past 24h)
 * - NASA EONET (active natural events)
 */

export const maxDuration = 60 // allow up to 60s for this endpoint

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  return req.nextUrl.searchParams.get('secret') === secret
}

// ─── News Aggregator (RSS feeds instead of GDELT) ──────────────────────
// RSS feeds don't rate-limit like GDELT and provide higher quality sources.

interface RSSFeed {
  name: string
  url: string
  defaultCategory: string
}

const RSS_FEEDS: RSSFeed[] = [
  // Markets & Finance
  { name: 'CNBC Top', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', defaultCategory: 'markets' },
  { name: 'CNBC Markets', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20409666', defaultCategory: 'markets' },
  { name: 'CNBC Economy', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258', defaultCategory: 'geopolitics' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', defaultCategory: 'markets' },
  // Technology
  { name: 'BBC Tech', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', defaultCategory: 'technology' },
  { name: 'CNBC Tech', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910', defaultCategory: 'technology' },
  // World + Wars
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', defaultCategory: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', defaultCategory: 'world' },
  { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', defaultCategory: 'geopolitics' },
  // Crypto
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', defaultCategory: 'markets' },
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  wars: ['airstrike', 'ceasefire', 'military', 'war ', 'strikes', 'conflict', 'troops', 'missile', 'drone', 'hostage', 'combat', 'invasion', 'soldier', 'gaza', 'ukraine', 'russia invade', 'iran israel', 'hamas', 'hezbollah', 'nato'],
  technology: ['ai ', 'a.i.', 'artificial intelligence', 'semiconductor', 'chip ', 'chips', 'nvidia', 'apple ', 'microsoft', 'google', 'openai', 'meta ', 'software', 'cloud', 'data center', 'cyber', 'robot', 'chatgpt', 'llm', 'gpu'],
  commodities: ['oil price', 'brent', 'crude', 'gold price', 'copper', 'natural gas', 'lng', 'wheat', 'corn', 'lithium', 'commodity', 'commodities', 'silver price', 'opec'],
  markets: ['stock', 'nasdaq', 's&p', 'dow ', 'crypto', 'bitcoin', 'ethereum', 'wall street', 'earnings', 'shares', 'equity', 'dividend', 'ipo', 'trading', 'bull market', 'bear market'],
  geopolitics: ['federal reserve', 'fed ', 'powell', 'inflation', 'sanctions', 'tariff', 'trade war', 'recession', 'election', 'central bank', 'ecb', 'boe', 'boj', 'economy', 'gdp', 'unemployment', 'trump', 'biden', 'white house'],
}

function categorize(title: string, fallback: string): string {
  const t = title.toLowerCase()
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => t.includes(kw))) return cat
  }
  return fallback
}

// Simple XML RSS parser — handles both RSS 2.0 and Atom feeds
function parseRSS(xml: string, feedName: string): any[] {
  const articles: any[] = []

  // Match <item>...</item> (RSS) or <entry>...</entry> (Atom)
  const itemRegex = /<(item|entry)[^>]*>([\s\S]*?)<\/\1>/gi
  const matches = [...xml.matchAll(itemRegex)]

  for (const match of matches.slice(0, 20)) {
    const body = match[2]

    // Title: handle CDATA
    const titleMatch = body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
    const title = titleMatch?.[1]?.trim().replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

    // Link: href attr or content
    const linkMatch = body.match(/<link[^>]*?href=["']([^"']+)["']/i) || body.match(/<link[^>]*>([^<]+)<\/link>/i)
    const link = linkMatch?.[1]?.trim()

    // Pub date
    const dateMatch = body.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i) || body.match(/<published[^>]*>([^<]+)<\/published>/i) || body.match(/<updated[^>]*>([^<]+)<\/updated>/i)
    const pubDate = dateMatch?.[1]?.trim()

    if (!title || !link) continue

    articles.push({
      title,
      url: link,
      source: feedName,
      publishedAt: pubDate || new Date().toISOString(),
      image: null,
      tone: null,
    })
  }

  return articles
}

async function fetchFeed(feed: RSSFeed): Promise<any[]> {
  try {
    const res = await fetch(feed.url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WealthClaude/1.0; +https://wealthclaude.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const articles = parseRSS(xml, feed.name)
    // Tag each article with its feed's default category
    return articles.map(a => ({ ...a, _defaultCategory: feed.defaultCategory }))
  } catch {
    return []
  }
}

async function fetchGDELT() {
  // Fetch all RSS feeds in parallel (different hosts, so no rate limit issues)
  const feedResults = await Promise.all(RSS_FEEDS.map(fetchFeed))
  const allArticles = feedResults.flat()

  // Dedupe by title prefix
  const seen = new Set<string>()
  const normalized: any[] = []
  for (const a of allArticles) {
    const key = a.title.slice(0, 60).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push({
      title: a.title,
      url: a.url,
      source: a.source,
      country: '',
      publishedAt: a.publishedAt,
      image: a.image,
      tone: a.tone,
      _defaultCategory: a._defaultCategory,
    })
  }

  // Categorize
  const categorized: Record<string, any[]> = {
    wars: [], technology: [], commodities: [], markets: [], geopolitics: [], world: [],
  }
  for (const a of normalized) {
    const cat = categorize(a.title, a._defaultCategory)
    if (categorized[cat].length < 15) {
      // Strip internal field before storing
      const { _defaultCategory, ...clean } = a
      categorized[cat].push(clean)
    }
  }

  // Fill empty categories from world
  for (const cat of Object.keys(categorized)) {
    if (cat === 'world') continue
    if (categorized[cat].length === 0 && categorized.world.length > 3) {
      categorized[cat] = categorized.world.slice(0, 3)
    }
  }

  return {
    events: normalized.slice(0, 20).map(a => { const { _defaultCategory, ...clean } = a; return clean }),
    categories: categorized,
    timestamp: Date.now(),
  }
}

// ─── USGS ───────────────────────────────────────────────────────────────
async function fetchEarthquakes() {
  const res = await fetch(
    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`USGS ${res.status}`)
  const data = await res.json()
  const features = data.features || []

  const earthquakes = features
    .sort((a: any, b: any) => b.properties.time - a.properties.time)
    .slice(0, 15)
    .map((f: any) => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      url: f.properties.url,
      tsunami: f.properties.tsunami === 1,
      felt: f.properties.felt,
      coordinates: {
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depth: f.geometry.coordinates[2],
      },
    }))

  return { earthquakes, timestamp: Date.now() }
}

// ─── NASA EONET ─────────────────────────────────────────────────────────
const CATEGORY_ICON: Record<string, string> = {
  'Wildfires': '🔥', 'Severe Storms': '🌀', 'Volcanoes': '🌋',
  'Sea and Lake Ice': '🧊', 'Drought': '🌵', 'Floods': '🌊',
  'Landslides': '⛰️', 'Earthquakes': '🌐', 'Dust and Haze': '💨',
  'Snow': '❄️', 'Temperature Extremes': '🌡️', 'Manmade': '🏭',
}

async function fetchNatural() {
  const res = await fetch(
    'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20',
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`EONET ${res.status}`)
  const data = await res.json()
  const raw = data.events || []

  const events = raw.slice(0, 12).map((e: any) => {
    const category = e.categories[0]?.title || 'Unknown'
    const latestGeo = e.geometry[e.geometry.length - 1]
    let coords = null
    if (latestGeo?.coordinates && typeof latestGeo.coordinates[0] === 'number') {
      coords = { lon: latestGeo.coordinates[0], lat: latestGeo.coordinates[1] }
    }
    return {
      id: e.id,
      title: e.title,
      category,
      icon: CATEGORY_ICON[category] || '📍',
      link: e.link,
      source: e.sources[0]?.url || e.link,
      date: latestGeo?.date || null,
      coordinates: coords,
    }
  })

  return { events, timestamp: Date.now() }
}

// ─── Save to Supabase ──────────────────────────────────────────────────
async function saveToCache(key: string, data: any) {
  const { error } = await supabase
    .from('global_pulse_cache')
    .upsert({ key, data, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Handler ───────────────────────────────────────────────────────────
async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}
  const errors: Record<string, string> = {}

  // Fetch all 3 sources in parallel — each hits a DIFFERENT external API so no rate conflict
  const [gdeltRes, quakesRes, naturalRes] = await Promise.allSettled([
    fetchGDELT(),
    fetchEarthquakes(),
    fetchNatural(),
  ])

  if (gdeltRes.status === 'fulfilled') {
    try {
      await saveToCache('gdelt-events', gdeltRes.value)
      results.gdelt = { categories: Object.keys(gdeltRes.value.categories).length, total: gdeltRes.value.events.length }
    } catch (e: any) {
      errors.gdelt = `save failed: ${e.message}`
    }
  } else {
    errors.gdelt = gdeltRes.reason?.message || 'fetch failed'
  }

  if (quakesRes.status === 'fulfilled') {
    try {
      await saveToCache('earthquakes', quakesRes.value)
      results.earthquakes = { count: quakesRes.value.earthquakes.length }
    } catch (e: any) {
      errors.earthquakes = `save failed: ${e.message}`
    }
  } else {
    errors.earthquakes = quakesRes.reason?.message || 'fetch failed'
  }

  if (naturalRes.status === 'fulfilled') {
    try {
      await saveToCache('natural', naturalRes.value)
      results.natural = { count: naturalRes.value.events.length }
    } catch (e: any) {
      errors.natural = `save failed: ${e.message}`
    }
  } else {
    errors.natural = naturalRes.reason?.message || 'fetch failed'
  }

  return NextResponse.json({
    success: Object.keys(results).length > 0,
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  })
}

export async function GET(req: NextRequest) { return handler(req) }
export async function POST(req: NextRequest) { return handler(req) }
