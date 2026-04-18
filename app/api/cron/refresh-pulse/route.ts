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
  const matches = Array.from(xml.matchAll(itemRegex))

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

// ─── Crypto (CoinGecko - free, no key) ──────────────────────────────────
async function fetchCrypto() {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h',
    { cache: 'no-store', headers: { 'User-Agent': 'WealthClaude/1.0' } }
  )
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const data = await res.json()
  const coins = (data || []).map((c: any) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    marketCap: c.market_cap,
    image: c.image,
  }))
  return { coins, timestamp: Date.now() }
}

// ─── Market Overview (S&P, sectors, global markets) ───────────────────
async function fetchMarketOverview() {
  const finnhubKey = process.env.FINNHUB_API_KEY
  if (!finnhubKey) throw new Error('FINNHUB_API_KEY not set')

  const TICKER_SYMS = ['SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'USO', 'UNG', 'CPER', 'AGG', 'UUP']
  const SECTOR_SYMS = ['XLK', 'XLE', 'XLC', 'XLY', 'XLF', 'XLI', 'XLB', 'XLRE', 'XLV', 'XLP', 'XLU']
  const GLOBAL_SYMS = ['SPY', 'EWG', 'EWU', 'EWJ', 'MCHI', 'EWZ', 'INDA']
  const all = Array.from(new Set([...TICKER_SYMS, ...SECTOR_SYMS, ...GLOBAL_SYMS, 'BINANCE:BTCUSDT']))

  // Batch in 5s groups to respect Finnhub burst limit
  const results: Record<string, any> = {}
  for (let i = 0; i < all.length; i += 5) {
    const batch = all.slice(i, i + 5)
    const res = await Promise.all(batch.map(async (sym) => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${finnhubKey}`, { cache: 'no-store' })
        if (!r.ok) return { sym, data: null }
        const d = await r.json()
        return { sym, data: d.c > 0 ? d : null }
      } catch { return { sym, data: null } }
    }))
    res.forEach(({ sym, data }) => { results[sym] = data })
    if (i + 5 < all.length) await new Promise(r => setTimeout(r, 150))
  }

  const toItem = (s: string) => results[s] ? { price: results[s].c, change: results[s].d, changePercent: results[s].dp } : null
  const BTC = results['BINANCE:BTCUSDT']

  return {
    ticker: {
      sp500: toItem('SPY'),
      nasdaq: toItem('QQQ'),
      dow: toItem('DIA'),
      russell2000: toItem('IWM'),
      gold: toItem('GLD'),
      silver: toItem('SLV'),
      oil: toItem('USO'),
      natgas: toItem('UNG'),
      copper: toItem('CPER'),
      bonds: toItem('AGG'),
      usdDollar: toItem('UUP'),
      bitcoin: BTC ? { price: BTC.c, change: BTC.d, changePercent: BTC.dp } : null,
    },
    sectors: SECTOR_SYMS
      .map(s => ({ name: s, symbol: s, price: results[s]?.c ?? 0, change: results[s]?.d ?? 0, changePercent: results[s]?.dp ?? 0 }))
      .filter(s => s.price > 0),
    globalMarkets: GLOBAL_SYMS
      .map(s => ({ symbol: s, price: results[s]?.c ?? 0, change: results[s]?.d ?? 0, changePercent: results[s]?.dp ?? 0 }))
      .filter(g => g.price > 0),
    timestamp: Date.now(),
  }
}

// ─── Market Movers (top S&P gainers/losers via Finnhub) ────────────────
const SP500_WATCHLIST = [
  'AAPL','MSFT','GOOGL','AMZN','META','NVDA','TSLA','BRK.B','JPM','V','UNH','XOM','JNJ',
  'WMT','PG','MA','HD','BAC','AVGO','CVX','LLY','ABBV','KO','PEP','TMO','COST','MRK',
  'ADBE','CRM','NFLX','AMD','DIS','CSCO','PFE','INTC','VZ','CMCSA','MRVL','SHW','KLAC',
  'GILD','ADBE','CME','CVX','NFLX','VZ','MU','ICE',
]

async function fetchMarketMovers() {
  const finnhubKey = process.env.FINNHUB_API_KEY
  if (!finnhubKey) throw new Error('FINNHUB_API_KEY not set')

  const symbols = Array.from(new Set(SP500_WATCHLIST))
  const quotes: { symbol: string; price: number; change: number; changePercent: number; name?: string }[] = []

  // Batch in 5s groups
  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5)
    const res = await Promise.all(batch.map(async (sym) => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${finnhubKey}`, { cache: 'no-store' })
        if (!r.ok) return null
        const d = await r.json()
        if (d.c <= 0) return null
        return { symbol: sym, price: d.c, change: d.d, changePercent: d.dp }
      } catch { return null }
    }))
    res.forEach(q => q && quotes.push(q))
    if (i + 5 < symbols.length) await new Promise(r => setTimeout(r, 150))
  }

  // Sort
  const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent)
  const gainers = sorted.slice(0, 8)
  const losers = sorted.slice(-8).reverse()

  return {
    sp500: { gainers, losers },
    timestamp: Date.now(),
  }
}

// ─── Macro indicators (VIX, via Finnhub) ────────────────────────────────
async function fetchMacro() {
  const finnhubKey = process.env.FINNHUB_API_KEY
  if (!finnhubKey) throw new Error('FINNHUB_API_KEY not set')

  // VIX proxy via VIXY ETF, Treasury 10Y yield, sector performance
  const symbols = ['VIXY', 'TLT', 'SHY'] // VIXY=VIX proxy, TLT=20Y Treasury, SHY=short-term Treasury

  const results = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${finnhubKey}`, { cache: 'no-store' })
        if (!r.ok) return null
        const d = await r.json()
        return d.c > 0 ? { symbol: sym, price: d.c, change: d.d, changePct: d.dp } : null
      } catch { return null }
    })
  )

  const [vixy, tlt, shy] = results
  return {
    vixy,
    tlt,
    shy,
    timestamp: Date.now(),
  }
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

  // Fetch all sources — each hits a DIFFERENT external API so no rate conflict between them
  // (but Finnhub-based ones run sequentially to avoid burst limit)
  const [gdeltRes, quakesRes, naturalRes, cryptoRes] = await Promise.allSettled([
    fetchGDELT(),
    fetchEarthquakes(),
    fetchNatural(),
    fetchCrypto(),
  ])

  // Finnhub-based fetches — sequential to avoid rate limits
  const marketOverviewRes = await Promise.allSettled([fetchMarketOverview()]).then(r => r[0])
  const marketMoversRes = await Promise.allSettled([fetchMarketMovers()]).then(r => r[0])
  const macroRes = await Promise.allSettled([fetchMacro()]).then(r => r[0])

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

  if (cryptoRes.status === 'fulfilled') {
    try {
      await saveToCache('crypto', cryptoRes.value)
      results.crypto = { count: cryptoRes.value.coins.length }
    } catch (e: any) {
      errors.crypto = `save failed: ${e.message}`
    }
  } else {
    errors.crypto = cryptoRes.reason?.message || 'fetch failed'
  }

  if (macroRes.status === 'fulfilled') {
    try {
      await saveToCache('macro', macroRes.value)
      results.macro = { ok: true }
    } catch (e: any) {
      errors.macro = `save failed: ${e.message}`
    }
  } else {
    errors.macro = macroRes.reason?.message || 'fetch failed'
  }

  if (marketOverviewRes.status === 'fulfilled') {
    try {
      await saveToCache('market-overview', marketOverviewRes.value)
      results.marketOverview = { sectors: marketOverviewRes.value.sectors.length, global: marketOverviewRes.value.globalMarkets.length }
    } catch (e: any) {
      errors.marketOverview = `save failed: ${e.message}`
    }
  } else {
    errors.marketOverview = marketOverviewRes.reason?.message || 'fetch failed'
  }

  if (marketMoversRes.status === 'fulfilled') {
    try {
      await saveToCache('market-movers', marketMoversRes.value)
      results.marketMovers = {
        gainers: marketMoversRes.value.sp500.gainers.length,
        losers: marketMoversRes.value.sp500.losers.length,
      }
    } catch (e: any) {
      errors.marketMovers = `save failed: ${e.message}`
    }
  } else {
    errors.marketMovers = marketMoversRes.reason?.message || 'fetch failed'
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
