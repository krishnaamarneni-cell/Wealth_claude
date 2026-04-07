import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 120

// ─── Auth ────────────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (process.env.NODE_ENV === 'development') return true
  return false
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── News Fetching (Polygon + Finnhub) ───────────────────────────────────────
interface RawArticle {
  title: string
  text: string
  url: string
  source: string
  publishedDate: string
}

async function fetchPolygonNews(): Promise<RawArticle[]> {
  const key = process.env.POLYGON_API_KEY
  if (!key) return []
  try {
    const res = await fetch(`https://api.polygon.io/v2/reference/news?limit=30&apiKey=${key}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((a: any) => ({
      title: a.title,
      text: a.description || '',
      url: a.article_url,
      source: a.publisher?.name || 'Polygon',
      publishedDate: a.published_utc,
    }))
  } catch { return [] }
}

async function fetchFinnhubNews(): Promise<RawArticle[]> {
  const key = process.env.FINNHUB_API_KEY
  if (!key) return []
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`)
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.slice(0, 30).map((a: any) => ({
      title: a.headline,
      text: a.summary || '',
      url: a.url,
      source: a.source || 'Finnhub',
      publishedDate: new Date(a.datetime * 1000).toISOString(),
    }))
  } catch { return [] }
}

// ─── Perplexity Enrichment ───────────────────────────────────────────────────
async function queryPerplexity(query: string): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return ''
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        max_tokens: 1200,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch { return '' }
}

// ─── Real-Time Price Fetching ────────────────────────────────────────────────
interface PriceQuote {
  name: string
  price: number | null
  change_pct: number | null
}

async function fetchFinnhubQuote(symbol: string): Promise<{ c: number; dp: number } | null> {
  const key = process.env.FINNHUB_API_KEY
  if (!key) return null
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.c || data.c === 0) return null
    return { c: data.c, dp: data.dp || 0 }
  } catch { return null }
}

async function fetchCryptoPrice(symbol: string): Promise<{ price: number; change_pct: number } | null> {
  try {
    // Use Finnhub crypto candle or a free API
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`)
    if (!res.ok) return null
    const data = await res.json()
    const coin = data[symbol]
    if (!coin) return null
    return { price: coin.usd, change_pct: coin.usd_24h_change || 0 }
  } catch { return null }
}

async function fetchLivePrices(): Promise<{ prices: PriceQuote[]; priceText: string }> {
  const [
    brent, wti, gold, silver, natgas, wheat,
    bitcoin, ethereum, spy, dxy
  ] = await Promise.all([
    fetchFinnhubQuote('BZ=F'),   // Brent — may not work on Finnhub, fallback below
    fetchFinnhubQuote('CL=F'),   // WTI crude — may not work
    fetchFinnhubQuote('GLD'),    // Gold ETF as proxy
    fetchFinnhubQuote('SLV'),    // Silver ETF
    fetchFinnhubQuote('UNG'),    // Natural gas ETF
    fetchFinnhubQuote('WEAT'),   // Wheat ETF
    fetchCryptoPrice('bitcoin'),
    fetchCryptoPrice('ethereum'),
    fetchFinnhubQuote('SPY'),    // S&P 500
    fetchFinnhubQuote('UUP'),    // Dollar index ETF
  ])

  const prices: PriceQuote[] = []
  const lines: string[] = []

  // Helper to format
  const add = (name: string, data: { c?: number; dp?: number; price?: number; change_pct?: number } | null, multiplier?: number) => {
    if (!data) return
    const price = 'price' in data ? data.price! : data.c! * (multiplier || 1)
    const change = 'change_pct' in data ? data.change_pct! : data.dp!
    prices.push({ name, price, change_pct: Math.round(change * 100) / 100 })
    lines.push(`${name}: $${price.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${change >= 0 ? '+' : ''}${change.toFixed(2)}% today)`)
  }

  // Gold ETF GLD tracks at ~1/10th of gold price
  if (gold) add('Gold', { c: gold.c * 10, dp: gold.dp })
  else add('Gold', gold)

  // Silver ETF SLV tracks at ~1x silver price roughly
  if (silver) add('Silver', { c: silver.c, dp: silver.dp })

  add('S&P 500 (SPY)', spy)
  add('Dollar (UUP)', dxy)
  add('Nat Gas (UNG)', natgas)
  add('Wheat (WEAT)', wheat)
  add('Bitcoin', bitcoin)
  add('Ethereum', ethereum)

  // Try Polygon for Brent/WTI if Finnhub didn't work
  const polygonKey = process.env.POLYGON_API_KEY
  if (polygonKey && !brent) {
    try {
      const res = await fetch(`https://api.polygon.io/v2/aggs/ticker/C:BCOUSD/prev?apiKey=${polygonKey}`)
      if (res.ok) {
        const data = await res.json()
        const result = data.results?.[0]
        if (result) {
          const changePct = result.o ? ((result.c - result.o) / result.o * 100) : 0
          prices.push({ name: 'Brent Crude', price: result.c, change_pct: Math.round(changePct * 100) / 100 })
          lines.push(`Brent Crude: $${result.c.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}% today)`)
        }
      }
    } catch {}
  }

  const priceText = lines.length > 0
    ? `VERIFIED LIVE PRICES (use these exact numbers, do NOT make up prices):\n${lines.join('\n')}`
    : 'No live price data available — use Perplexity market intel for prices.'

  return { prices, priceText }
}

async function fetchPerplexityEnrichment() {
  const [geopolitical, marketIntel, techClimate] = await Promise.all([
    queryPerplexity(
      'Give me a detailed status of ALL active military conflicts globally as of today. For each conflict include: countries involved, casualty estimates, displacement numbers, escalation level (1-10), and latest developments. Specifically cover: Russia-Ukraine, Israel-Palestine/Gaza, Sudan civil war, Myanmar, Iran/Hormuz tensions, Yemen/Houthis, and any others. Include any upcoming diplomatic deadlines, UN votes, or ceasefire negotiations with exact dates. What is the current Doomsday Clock setting?'
    ),
    queryPerplexity(
      'Give me exact current prices for: Brent crude, WTI crude, Gold per oz, Silver, Natural gas (Henry Hub), Wheat (CBOT), Corn, Bitcoin, and the DXY dollar index. For each include the % change today and % change this month. What sectors are outperforming and underperforming in the S&P 500 today? What are the latest de-dollarization developments — any BRICS payment system updates, yuan settlement volumes, central bank gold buying? Give specific numbers.'
    ),
    queryPerplexity(
      'What are the most significant AI/tech developments this week? Include: latest model releases (GPT, Claude, Gemini, Llama), benchmark scores, major AI company announcements, AI regulation updates (EU AI Act, US executive orders), and notable AI investments/acquisitions with dollar amounts. Also cover: current climate disasters (wildfires, floods, droughts, storms) happening NOW with locations and severity, global food security situation (crop yields, food price index, hunger statistics), and any emerging pandemic or biotech developments. Be specific with numbers and dates.'
    ),
  ])
  return { geopolitical, marketIntel, techClimate }
}

// ─── Groq AI Processing ─────────────────────────────────────────────────────
async function callGroq(prompt: string, maxTokens: number = 4000): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function extractJson(raw: string): any {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

// ─── Prompt Templates ────────────────────────────────────────────────────────
function buildPromptTabs1to4(articles: string, enrichment: { geopolitical: string; marketIntel: string; techClimate: string }, livePrices: string): string {
  return `You are a senior intelligence analyst at a global macro advisory firm writing a daily brief for sophisticated investors. Process these raw news feeds and real-time intelligence to produce DETAILED structured briefs. Be SPECIFIC with numbers, dates, prices, percentages. Never say "N/A" — use your best estimate.

TODAY'S RAW NEWS ARTICLES:
${articles}

${livePrices}

REAL-TIME GEOPOLITICAL INTELLIGENCE:
${enrichment.geopolitical}

REAL-TIME MARKET INTELLIGENCE:
${enrichment.marketIntel}

REAL-TIME TECH/CLIMATE INTELLIGENCE:
${enrichment.techClimate}

Generate a JSON object with exactly these 4 keys. CRITICAL RULES:
- Use REAL data from articles and enrichment above
- Every array must have the MINIMUM number of items specified
- Every text field must have substantive content (2+ sentences for descriptions)
- Include specific numbers, prices, percentages, dates — never vague language

{
  "priority_index": [
    // EXACTLY 10 items. Rank by noise-vs-signal gap. Cover: geopolitics, markets, tech, climate, finance, energy
    {
      "rank": 1,
      "topic": "Short topic name (max 5 words)",
      "subtitle": "One-line context with a specific number or date",
      "status": "breaking|escalating|structural|watch|emerging|de-escalating|peak-risk|underdeveloped|20yr-signal",
      "noise": 1-5,
      "signal": 1-5,
      "trend": "up|down|flat",
      "summary": "2-3 sentence explanation with specific data points. Include WHY this ranks here and what investors should know."
    }
  ],
  "war_room": {
    "stats": {
      "active_conflicts": <number of active military conflicts globally, minimum 5>,
      "active_conflicts_label": "Major theaters",
      "key_deadline": "<specific upcoming deadline with exact date>",
      "key_deadline_label": "<2-3 word label for the deadline>",
      "commodity_price": "<Brent crude price range like $108-112>",
      "commodity_label": "War premium",
      "doomsday_metric": "<specific metric like 90 seconds or specific risk score>",
      "doomsday_label": "<Doomsday Clock or similar metric name>"
    },
    "conflicts": [
      // MINIMUM 5 conflicts. Include: Ukraine-Russia, Israel-Palestine, Sudan, Myanmar, and others
      {
        "name": "Country/Region — Type of conflict",
        "description": "3-4 sentences with latest developments, casualty figures, displacement numbers, and escalation triggers.",
        "escalation_pct": 0-100,
        "is_live": true
      }
    ],
    "escalation_heat": [
      // MINIMUM 6 regions: Middle East, Eastern Europe, East Asia, South Asia, Africa, Latin America
      { "region": "Region name", "heat_pct": 0-100 }
    ],
    "headlines": [
      // MINIMUM 5 headlines from the news articles
      {
        "text": "Full headline text — Source Name",
        "source": "Reuters|AP|Bloomberg|etc",
        "time_ago": "Xhr ago"
      }
    ],
    "analysis": "Detailed 4-5 sentence paragraph analyzing the overall global security landscape. Connect the dots between conflicts. Identify the biggest escalation risk.",
    "action_links": [{ "label": "Track Iran situation" }, { "label": "Ukraine latest" }, { "label": "Conflict map" }]
  },
  "markets": {
    "commodities": [
      // MINIMUM 6 commodities: Brent crude, WTI crude, Gold, Natural gas, Wheat, Bitcoin
      { "name": "Brent crude", "price": "$XXX", "change": "+X.X% today", "change_color": "green|red|neutral" }
    ],
    "strong_buy": [
      // MINIMUM 3 items with specific tickers/sectors
      { "ticker_or_label": "Specific ticker or sector (e.g. XLE, GLD, UNG)", "reason": "2-3 sentences with specific data. Why now? What's the catalyst?" }
    ],
    "watch": [
      // MINIMUM 3 items
      { "ticker_or_label": "Specific ticker or sector", "reason": "2-3 sentences. What trigger would move this to buy or avoid?" }
    ],
    "avoid": [
      // MINIMUM 3 items
      { "ticker_or_label": "Specific ticker or sector", "reason": "2-3 sentences. What's the specific downside risk? By how much could it drop?" }
    ],
    "petrodollar_erosion": {
      "title": "Petrodollar erosion",
      "text": "3-4 sentences with SPECIFIC data: BRICS payment volumes, mBridge status, yuan oil trade %, gold reserve changes. Include dates and numbers."
    },
    "safe_haven": [
      // MINIMUM 5 items that add up to approximately 100%
      { "asset": "Gold (GLD)", "allocation_pct": 25 },
      { "asset": "Energy (XLE)", "allocation_pct": 20 },
      { "asset": "Defense (ITA)", "allocation_pct": 15 },
      { "asset": "Short-term Treasuries", "allocation_pct": 25 },
      { "asset": "Cash", "allocation_pct": 15 }
    ],
    "description": "3-4 sentence overall market summary connecting geopolitics to market moves. What's the dominant narrative? Where is smart money flowing?",
    "action_links": [{ "label": "Track commodities" }, { "label": "Portfolio hedge calculator" }, { "label": "De-dollarization tracker" }]
  },
  "tech_ai": {
    "stats": [
      // MINIMUM 4 stats
      { "label": "AGI consensus", "value": "20XX", "subtitle": "Was 2057 in 2023" },
      { "label": "Google AI capex", "value": "$XXB", "subtitle": "2026 alone" },
      { "label": "AI model releases this month", "value": "X", "subtitle": "GPT, Claude, Gemini etc" },
      { "label": "AI regulation bills", "value": "XX+", "subtitle": "Globally pending" }
    ],
    "sections": [
      // MINIMUM 4 sections covering: AI Race, Regulation, Space/Defense Tech, Biotech
      {
        "title": "AI race — dual track",
        "badge": "Critical",
        "badge_color": "#ef4444",
        "content": "3-4 sentence overview of the current state of the AI race with specific company names and model releases.",
        "subsections": [
          { "flag": "🇺🇸", "label": "Software AI brain — US leads", "text": "2-3 sentences with specific companies, models, benchmarks." },
          { "flag": "🇨🇳", "label": "Physical AI body — China leads", "text": "2-3 sentences with specific developments." }
        ],
        "action_links": [{ "label": "Track AI developments" }]
      },
      {
        "title": "AI regulation & governance",
        "badge": "Evolving",
        "badge_color": "#f59e0b",
        "content": "3-4 sentences about current regulatory landscape. EU AI Act status, US executive orders, China regulations.",
        "subsections": [
          { "flag": "🇪🇺", "label": "EU AI Act", "text": "Current implementation status and timeline." },
          { "flag": "🇺🇸", "label": "US approach", "text": "Executive orders and congressional activity." }
        ]
      },
      {
        "title": "Space & defense technology",
        "badge": "Strategic",
        "badge_color": "#6366f1",
        "content": "2-3 sentences about latest space and defense tech developments.",
        "subsections": []
      },
      {
        "title": "Biotech & health tech",
        "badge": "Emerging",
        "badge_color": "#10b981",
        "content": "2-3 sentences about notable biotech/health developments.",
        "subsections": []
      }
    ],
    "description": "3-4 sentence summary of the tech landscape. What are the investment implications? What should investors watch?"
  }
}

Return ONLY the JSON object. No preamble, no markdown code fences, no explanation.`
}

function buildPromptTabs5to7(articles: string, enrichment: { geopolitical: string; marketIntel: string; techClimate: string }): string {
  return `You are a senior intelligence analyst writing a daily brief for sophisticated investors. Be SPECIFIC with numbers, dates, percentages. Never say "N/A" — always provide your best informed estimate.

TODAY'S RAW NEWS ARTICLES:
${articles}

REAL-TIME GEOPOLITICAL INTELLIGENCE:
${enrichment.geopolitical}

REAL-TIME MARKET INTELLIGENCE:
${enrichment.marketIntel}

REAL-TIME TECH/CLIMATE INTELLIGENCE:
${enrichment.techClimate}

Generate a JSON object with exactly these 3 keys. CRITICAL: Every array must have AT LEAST the minimum items specified. Every description must be 2-3 substantive sentences with specific data.

{
  "food_climate": {
    "stats": [
      // EXACTLY 4 stats with real data — never use "N/A"
      { "label": "Acute hunger globally", "value": "XXM", "subtitle": "Specific region or context", "color": "#ef4444" },
      { "label": "Fertilizer/food price", "value": "+XX%", "subtitle": "Compared to what baseline", "color": "#f59e0b" },
      { "label": "CO2/temperature metric", "value": "X.XXppm", "subtitle": "Context vs historical", "color": "#f59e0b" },
      { "label": "Active climate disaster", "value": "Specific number", "subtitle": "Type and comparison", "color": "#ef4444" }
    ],
    "climate_cascade": {
      "title": "Climate cascade — live",
      "badge": "Active",
      "events": [
        // MINIMUM 4 cascade events showing chain reactions
        // Format: "Trigger → Impact 1 → Impact 2" in the title
        {
          "title": "Iran tensions → Hormuz risk → Oil shock → Fertilizer spike → Food price surge",
          "description": "3 sentences explaining the cascade chain with specific numbers. How does one event trigger the next? What's the timeline?",
          "is_active": true
        },
        {
          "title": "El Niño/La Niña → Crop failure → Export bans → Import-dependent nations at risk",
          "description": "3 sentences with specific countries affected, crop yield impacts, and price changes.",
          "is_active": true
        },
        {
          "title": "Deforestation → Carbon sink loss → Accelerated warming → Extreme weather",
          "description": "3 sentences with latest deforestation data and projected impacts.",
          "is_active": true
        },
        {
          "title": "Water stress → Agricultural collapse → Migration → Political instability",
          "description": "3 sentences with regions affected and scale of impact.",
          "is_active": false
        }
      ]
    },
    "tipping_points": {
      "title": "Tipping point watch",
      "badge": "Critical",
      "points": [
        // MINIMUM 5 tipping points with progress percentages
        { "name": "Amazon rainforest — X% from deforestation tipping point", "progress_pct": 75, "color": "#ef4444" },
        { "name": "Arctic sea ice — summer ice-free by 20XX", "progress_pct": 70, "color": "#ef4444" },
        { "name": "Atlantic thermohaline circulation (AMOC) weakening", "progress_pct": 55, "color": "#f59e0b" },
        { "name": "Permafrost methane release — XX Gt at risk", "progress_pct": 50, "color": "#f59e0b" },
        { "name": "Global carbon sink effectiveness declining", "progress_pct": 60, "color": "#f59e0b" }
      ]
    },
    "description": "4-5 sentence summary connecting food security, climate events, and investor implications. What should people actually prepare for? Include specific price impacts on agriculture commodities."
  },
  "threat_index": {
    "title": "GLOBAL THREAT COMPOSITE",
    "subtitle": "7 dimensions scored 0-100 based on current intelligence",
    "dimensions": [
      // EXACTLY 7 dimensions — scores should reflect TODAY's actual threat based on the news articles
      // Use colors: #ef4444 for >75, #f59e0b for 50-75, #eab308 for 30-50, #10b981 for <30
      { "name": "Energy security", "score": XX, "color": "#ef4444" },
      { "name": "Military escalation", "score": XX, "color": "#ef4444" },
      { "name": "Climate emergency", "score": XX, "color": "#f59e0b" },
      { "name": "Food security", "score": XX, "color": "#f59e0b" },
      { "name": "AI governance gap", "score": XX, "color": "#f59e0b" },
      { "name": "Financial system stress", "score": XX, "color": "#eab308" },
      { "name": "Institutional trust", "score": XX, "color": "#f59e0b" }
    ],
    "scenario_watch": [
      // MINIMUM 4 scenarios with realistic probabilities
      {
        "scenario": "Strait of Hormuz partial closure",
        "probability": "XX%",
        "description": "3 sentences: What triggers it? What happens to oil/shipping? What's the economic impact?"
      },
      {
        "scenario": "AI-driven market flash crash",
        "probability": "XX%",
        "description": "3 sentences: What could trigger it? How fast? What's the recovery timeline?"
      },
      {
        "scenario": "Major cyber attack on financial infrastructure",
        "probability": "XX%",
        "description": "3 sentences with specifics."
      },
      {
        "scenario": "Simultaneous crop failures in 3+ breadbasket regions",
        "probability": "XX%",
        "description": "3 sentences with specifics."
      }
    ],
    "contrarian": {
      "title": "What the consensus is missing",
      "badge": "Contrarian insight",
      "text": "A substantive 4-5 sentence paragraph presenting a contrarian analysis that sophisticated investors should consider. Challenge the dominant narrative with specific data. What is everyone ignoring? What structural risk is being underpriced?",
      "tags": ["Specific tag 1", "Specific tag 2", "Specific tag 3", "Specific tag 4", "Specific tag 5"]
    }
  },
  "signals": {
    "title": "Early warning — what to watch before it becomes a headline",
    "subtitle": "ranked by surprise potential",
    "items": [
      // MINIMUM 8 signals covering different categories
      {
        "rank": 1,
        "signal": "Short signal name (max 8 words)",
        "description": "3 sentences: What's happening beneath the surface? Why should you care? What's the specific trigger to watch?",
        "timeline": "Active now|Imminent|This week|This month|This quarter|2026-2027",
        "category": "geopolitics|markets|tech|climate|finance"
      }
    ],
    "action_links": [
      { "label": "This week's brief" },
      { "label": "Automate my feed" },
      { "label": "What am I missing?" }
    ]
  }
}

Use REAL data from the articles and enrichment. Never use placeholder text. Return ONLY the JSON object. No preamble, no code fences.`
}

// ─── Main Handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = getSupabase()

  // 1. Create brief row with status='generating'
  const { data: brief, error: insertError } = await supabase
    .from('intelligence_briefs')
    .insert({ status: 'generating' })
    .select('id')
    .single()

  if (insertError || !brief) {
    console.error('[intelligence] Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
  }

  const briefId = brief.id

  try {
    // 2. Fetch raw news from Polygon + Finnhub
    console.log('[intelligence] Fetching news...')
    const [polygonNews, finnhubNews] = await Promise.all([
      fetchPolygonNews(),
      fetchFinnhubNews(),
    ])

    const allArticles = [...polygonNews, ...finnhubNews]
    console.log(`[intelligence] Got ${allArticles.length} articles`)

    // Deduplicate by title similarity
    const seen = new Set<string>()
    const unique = allArticles.filter(a => {
      const key = a.title.toLowerCase().substring(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Build article summary for prompts (trim to ~3000 tokens)
    const articleSummary = unique
      .slice(0, 40)
      .map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   ${a.text.substring(0, 150)}`)
      .join('\n')

    // 3. Fetch live prices + Perplexity enrichment in parallel
    console.log('[intelligence] Fetching live prices + Perplexity...')
    const [livePriceData, enrichment] = await Promise.all([
      fetchLivePrices(),
      fetchPerplexityEnrichment(),
    ])
    console.log(`[intelligence] Got ${livePriceData.prices.length} live prices`)

    // 4. Process with Groq (2 sequential calls)
    console.log('[intelligence] Processing with Groq (tabs 1-4)...')
    const raw1 = await callGroq(buildPromptTabs1to4(articleSummary, enrichment, livePriceData.priceText), 8000)
    const tabs1to4 = extractJson(raw1)

    console.log('[intelligence] Processing with Groq (tabs 5-7)...')
    const raw2 = await callGroq(buildPromptTabs5to7(articleSummary, enrichment), 8000)
    const tabs5to7 = extractJson(raw2)

    // 5. Store in database
    const generationTime = Date.now() - startTime
    console.log(`[intelligence] Storing brief (${generationTime}ms)...`)

    const { error: updateError } = await supabase
      .from('intelligence_briefs')
      .update({
        priority_index: tabs1to4.priority_index || [],
        war_room: tabs1to4.war_room || {},
        markets: tabs1to4.markets || {},
        tech_ai: tabs1to4.tech_ai || {},
        food_climate: tabs5to7.food_climate || {},
        threat_index: tabs5to7.threat_index || {},
        signals: tabs5to7.signals || {},
        source_count: unique.length,
        status: 'complete',
      })
      .eq('id', briefId)

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`)
    }

    // 6. Cleanup old briefs (keep last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    await supabase
      .from('intelligence_briefs')
      .delete()
      .lt('created_at', weekAgo.toISOString())

    console.log(`[intelligence] Brief ${briefId} complete in ${generationTime}ms`)

    return NextResponse.json({
      success: true,
      brief_id: briefId,
      source_count: unique.length,
      generation_time_ms: generationTime,
    })
  } catch (err: any) {
    console.error('[intelligence] Generation failed:', err)

    // Mark as failed
    await supabase
      .from('intelligence_briefs')
      .update({ status: 'failed' })
      .eq('id', briefId)

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
