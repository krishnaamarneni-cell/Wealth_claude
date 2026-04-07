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
        max_tokens: 800,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch { return '' }
}

async function fetchPerplexityEnrichment() {
  const [geopolitical, marketIntel, techClimate] = await Promise.all([
    queryPerplexity(
      'What are the current active military conflicts globally as of today? Include Iran/Hormuz situation, any nuclear threats, major escalations, and specific deadlines. Be specific with numbers and dates.'
    ),
    queryPerplexity(
      'What are today\'s prices for: Brent crude oil, gold, natural gas, wheat, and Bitcoin? What are the strongest and weakest market sectors today? Any petrodollar or de-dollarization developments?'
    ),
    queryPerplexity(
      'What are the latest AI/AGI developments today? Any new model benchmarks or breakthroughs? Current major climate disasters or food security crises happening now? Any systemic risks emerging?'
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
function buildPromptTabs1to4(articles: string, enrichment: { geopolitical: string; marketIntel: string; techClimate: string }): string {
  return `You are a senior intelligence analyst at a global macro advisory firm. Process these raw news feeds and real-time intelligence to produce structured briefs.

TODAY'S RAW NEWS ARTICLES:
${articles}

REAL-TIME GEOPOLITICAL INTELLIGENCE:
${enrichment.geopolitical}

REAL-TIME MARKET INTELLIGENCE:
${enrichment.marketIntel}

REAL-TIME TECH/CLIMATE INTELLIGENCE:
${enrichment.techClimate}

Generate a JSON object with exactly these 4 keys. Use REAL data from the articles above. Do not invent data — if you don't have info for a field, give your best informed estimate based on the articles.

{
  "priority_index": [
    // Exactly 10 items. Rank by: how big is the gap between media noise and real long-term signal?
    {
      "rank": 1,
      "topic": "Short topic name (max 5 words)",
      "subtitle": "One-line context (max 10 words)",
      "status": "breaking|escalating|structural|watch|emerging|de-escalating|peak-risk|underdeveloped|20yr-signal",
      "noise": 1-5,  // How much media coverage (5=everywhere)
      "signal": 1-5,  // How much it actually matters for next 5 years (5=transformative)
      "trend": "up|down|flat",
      "summary": "2-sentence explanation of why this ranks here"
    }
  ],
  "war_room": {
    "stats": {
      "active_conflicts": <number>,
      "active_conflicts_label": "Major theaters",
      "key_deadline": "<specific deadline with date>",
      "key_deadline_label": "<what the deadline is about>",
      "commodity_price": "<Brent crude price like $110-114>",
      "commodity_label": "War premium",
      "doomsday_metric": "<specific metric value>",
      "doomsday_label": "<what it measures>"
    },
    "conflicts": [
      {
        "name": "Country/Region — description",
        "description": "2-3 sentences of latest situation",
        "escalation_pct": 0-100,
        "is_live": true/false
      }
    ],
    "escalation_heat": [
      { "region": "Region name", "heat_pct": 0-100 }
    ],
    "headlines": [
      {
        "text": "Full headline quote with source attribution",
        "source": "Source name",
        "time_ago": "Xhr ago"
      }
    ],
    "analysis": "Brief paragraph about overall situation",
    "action_links": [{ "label": "Link text" }]
  },
  "markets": {
    "commodities": [
      { "name": "Brent crude", "price": "$110", "change": "+68% since Feb 28", "change_color": "green|red|neutral" }
    ],
    "strong_buy": [
      { "ticker_or_label": "XLE/VDE (energy)", "reason": "Brief reason with specific data" }
    ],
    "watch": [
      { "ticker_or_label": "AI stocks", "reason": "Brief reason" }
    ],
    "avoid": [
      { "ticker_or_label": "Airlines, cruise lines", "reason": "Brief reason" }
    ],
    "petrodollar_erosion": {
      "title": "Petrodollar erosion",
      "text": "2-3 sentences with specific data points about dollar status, BRICS, mBridge etc."
    },
    "safe_haven": [
      { "asset": "XLE energy", "allocation_pct": 20 }
    ],
    "description": "Overall market summary paragraph",
    "action_links": [{ "label": "Track petrodollar" }]
  },
  "tech_ai": {
    "stats": [
      { "label": "AGI consensus", "value": "2031", "subtitle": "Was 2057 in 2023" },
      { "label": "Google AI capex", "value": "$75B", "subtitle": "2026 alone" }
    ],
    "sections": [
      {
        "title": "AI race — dual track",
        "badge": "Critical",
        "badge_color": "red",
        "content": "Overview paragraph",
        "subsections": [
          { "flag": "US", "label": "Software AI brain — US leads", "text": "Details..." },
          { "flag": "CN", "label": "Physical AI body — China leads", "text": "Details..." }
        ],
        "action_links": [{ "label": "AGI latest" }]
      }
    ],
    "description": "Overall tech summary"
  }
}

Return ONLY the JSON object. No preamble, no markdown code fences, no explanation.`
}

function buildPromptTabs5to7(articles: string, enrichment: { geopolitical: string; marketIntel: string; techClimate: string }): string {
  return `You are a senior intelligence analyst. Process these feeds to produce structured briefs for the remaining tabs.

TODAY'S RAW NEWS ARTICLES:
${articles}

REAL-TIME GEOPOLITICAL INTELLIGENCE:
${enrichment.geopolitical}

REAL-TIME MARKET INTELLIGENCE:
${enrichment.marketIntel}

REAL-TIME TECH/CLIMATE INTELLIGENCE:
${enrichment.techClimate}

Generate a JSON object with exactly these 3 keys:

{
  "food_climate": {
    "stats": [
      { "label": "Acute hunger Africa", "value": "87M", "subtitle": "E+S Africa now", "color": "red" },
      { "label": "Urea price spike", "value": "+50%", "subtitle": "Since Feb 28", "color": "orange" },
      { "label": "CO2 rise 2024", "value": "3.75ppm", "subtitle": "Largest on record", "color": "orange" },
      { "label": "US wildfires '26", "value": "13,658", "subtitle": "2x 10yr avg", "color": "red" }
    ],
    "climate_cascade": {
      "title": "Climate cascade — live",
      "badge": "Active",
      "events": [
        {
          "title": "Event title with arrow chain showing cascade",
          "description": "Specific details with numbers",
          "is_active": true
        }
      ]
    },
    "tipping_points": {
      "title": "Tipping point watch",
      "badge": "Critical",
      "points": [
        { "name": "Amazon 3-8% from deforestation tipping", "progress_pct": 75, "color": "red" },
        { "name": "Carbon sink effectiveness (-15% decade)", "progress_pct": 60, "color": "orange" }
      ]
    },
    "description": "Overall food/climate summary"
  },
  "threat_index": {
    "title": "GLOBAL THREAT COMPOSITE — 7 DIMENSIONS (100 = MAXIMUM)",
    "subtitle": "",
    "dimensions": [
      { "name": "Energy security", "score": 92, "color": "red" },
      { "name": "Military conflict", "score": 88, "color": "red" },
      { "name": "Climate emergency", "score": 78, "color": "orange" },
      { "name": "Food security", "score": 74, "color": "orange" },
      { "name": "AI governance gap", "score": 72, "color": "orange" },
      { "name": "Financial stability", "score": 65, "color": "yellow" },
      { "name": "Institutional breakdown", "score": 68, "color": "orange" }
    ],
    "scenario_watch": [
      {
        "scenario": "Scenario name with probability",
        "probability": "20%",
        "description": "2-3 sentences describing the scenario and its implications"
      }
    ],
    "contrarian": {
      "title": "Structural ungovernability",
      "badge": "Contrarian truth",
      "text": "A paragraph presenting a contrarian analysis that most people miss. Challenge conventional wisdom with data.",
      "tags": ["Tag 1", "Tag 2", "Tag 3", "Tag 4"]
    }
  },
  "signals": {
    "title": "Early warning — what to watch before it becomes a headline",
    "subtitle": "ranked by surprise potential",
    "items": [
      {
        "rank": 1,
        "signal": "Short signal name (max 8 words)",
        "description": "2-3 sentences explaining what to watch and why it matters. Include specific data points.",
        "timeline": "Today|Active now|Imminent|Monthly|Quarterly|2026-2027",
        "category": "geopolitics|markets|tech|climate|finance"
      }
    ],
    "action_links": [
      { "label": "This week brief" },
      { "label": "Automate my feed" },
      { "label": "What am I missing?" }
    ]
  }
}

Use REAL data from the articles. Scores should reflect actual current threat levels based on the news. Return ONLY the JSON object.`
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

    // 3. Enrich with Perplexity (3 parallel queries)
    console.log('[intelligence] Querying Perplexity...')
    const enrichment = await fetchPerplexityEnrichment()

    // 4. Process with Groq (2 sequential calls)
    console.log('[intelligence] Processing with Groq (tabs 1-4)...')
    const raw1 = await callGroq(buildPromptTabs1to4(articleSummary, enrichment), 4500)
    const tabs1to4 = extractJson(raw1)

    console.log('[intelligence] Processing with Groq (tabs 5-7)...')
    const raw2 = await callGroq(buildPromptTabs5to7(articleSummary, enrichment), 4000)
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
