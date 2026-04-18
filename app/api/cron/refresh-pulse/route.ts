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

// ─── GDELT ──────────────────────────────────────────────────────────────
const MASTER_QUERY =
  '(federal reserve OR inflation OR sanctions OR tariff OR recession OR ' +
  '"artificial intelligence" OR semiconductor OR nvidia OR openai OR ' +
  'airstrike OR ceasefire OR "military operation" OR conflict OR ' +
  '"crude oil" OR "gold price" OR "natural gas" OR copper OR lithium OR ' +
  '"stock market" OR nasdaq OR bitcoin OR "wall street" OR earnings OR ' +
  '"breaking news") sourcelang:english'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  wars: ['airstrike', 'ceasefire', 'military', 'war ', 'strike', 'conflict', 'troops', 'missile', 'drone', 'hostage', 'combat', 'invasion', 'attack'],
  technology: ['ai ', 'a.i.', 'artificial intelligence', 'semiconductor', 'chip', 'nvidia', 'apple ', 'microsoft', 'google', 'openai', 'tech ', 'software', 'cloud', 'data center', 'cyber', 'robot'],
  commodities: ['oil', 'brent', 'crude', 'gold', 'copper', 'natural gas', 'lng', 'wheat', 'corn', 'lithium', 'commodity', 'metal', 'silver'],
  markets: ['stock', 'nasdaq', 's&p', 'dow', 'crypto', 'bitcoin', 'ethereum', 'wall street', 'earnings', 'shares', 'equity', 'dividend', 'ipo'],
  geopolitics: ['federal reserve', 'fed ', 'powell', 'inflation', 'sanctions', 'tariff', 'trade war', 'recession', 'election', 'central bank', 'ecb', 'boe', 'boj', 'economy'],
}

function categorize(title: string): string {
  const t = title.toLowerCase()
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => t.includes(kw))) return cat
  }
  return 'world'
}

async function fetchGDELT() {
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
  if (!res.ok) throw new Error(`GDELT ${res.status}`)
  const text = await res.text()
  if (!text.trim().startsWith('{')) throw new Error('GDELT rate-limited or non-JSON')

  const data = JSON.parse(text)
  const articles = data.articles || []

  const seen = new Set<string>()
  const normalized: any[] = []
  for (const a of articles) {
    const key = a.title.slice(0, 60).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push({
      title: a.title,
      url: a.url,
      source: a.domain,
      country: a.sourcecountry,
      publishedAt: a.seendate,
      image: a.socialimage || null,
      tone: a.tone ? parseFloat(a.tone) : null,
    })
  }

  const categorized: Record<string, any[]> = {
    wars: [], technology: [], commodities: [], markets: [], geopolitics: [], world: [],
  }
  for (const a of normalized) {
    const cat = categorize(a.title)
    if (categorized[cat].length < 10) categorized[cat].push(a)
  }
  // Fill empty categories from world as fallback
  for (const cat of Object.keys(categorized)) {
    if (cat === 'world') continue
    if (categorized[cat].length === 0 && categorized.world.length > 3) {
      categorized[cat] = categorized.world.slice(0, 3)
    }
  }

  return {
    events: normalized.slice(0, 20),
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
