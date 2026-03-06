import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// ─── Slug generator ───────────────────────────────────────────────────────────
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80)
}

// ─── Post type based on UTC hour ──────────────────────────────────────────────
type PostType = 'premarket' | 'market-analysis' | 'aftermarket' | 'geopolitical' | 'education'

function getPostType(utcHour: number): PostType {
  if (utcHour === 11) return 'premarket'         // 7am EST
  if (utcHour === 14) return 'market-analysis'   // 10am EST
  if (utcHour === 16) return 'market-analysis'   // 12pm EST
  if (utcHour === 21) return 'aftermarket'       // 5pm EST
  if (utcHour === 23) return 'geopolitical'      // 7pm EST
  if (utcHour === 2) return 'education'         // 10pm EST
  // fallback
  if (utcHour <= 13) return 'premarket'
  if (utcHour <= 18) return 'market-analysis'
  return 'aftermarket'
}

// ─── Education topics ─────────────────────────────────────────────────────────
const EDUCATION_TOPICS = [
  "How to build an emergency fund: the 3-6 month rule explained",
  "What is dollar-cost averaging and why it beats timing the market",
  "How to read a stock's P/E ratio and what it actually means",
  "The difference between ETFs and mutual funds for beginner investors",
  "How compound interest works and why starting early matters",
  "What is portfolio rebalancing and how often should you do it",
  "Understanding tax-loss harvesting and how to save on capital gains",
  "How to evaluate a dividend stock: yield, payout ratio and growth",
  "What is an index fund and why Warren Buffett recommends them",
  "How to set a personal investment goal based on your risk tolerance",
  "The basics of asset allocation: stocks, bonds and cash explained",
  "What is inflation and how does it affect your investments",
  "How to use a Roth IRA vs traditional IRA for retirement savings",
  "What are blue chip stocks and why they belong in every portfolio",
  "How to diversify your portfolio across sectors and asset classes",
  "What is a stock market correction and how should investors respond",
  "How to analyze a company earnings report as a retail investor",
  "What are options and why most retail investors should avoid them",
  "How to invest your first $1000 in the US stock market",
  "What is the difference between growth stocks and value stocks",
]

// ─── Geopolitical topics pool ─────────────────────────────────────────────────
const GEOPOLITICAL_TOPICS = [
  "How US-China trade tensions are affecting American tech stocks right now",
  "How Federal Reserve interest rate decisions impact your US stock portfolio",
  "How Middle East instability is driving oil prices and US energy stocks",
  "How the US dollar strength is affecting S&P 500 multinational companies",
  "How European recession fears are spilling into US markets today",
  "How US tariff policy changes are hitting American manufacturing stocks",
  "How global supply chain disruptions are affecting US consumer stocks",
  "How OPEC oil production cuts are impacting US energy sector stocks",
  "How US inflation data is shaping Federal Reserve policy and markets",
  "How geopolitical risk in Asia is affecting US semiconductor stocks",
]

// ─── Fetch real US market data via Perplexity ─────────────────────────────────
async function fetchMarketData(apiKey: string): Promise<{
  gainers: string[]
  losers: string[]
  premarket: string[]
  crypto: string[]
  geopolitical: string
}> {
  const prompt = `You are a US financial data assistant. Give me TODAY's real live US stock market data right now. Focus ONLY on US-listed stocks (NYSE, NASDAQ). Do NOT include Indian, European or other foreign stocks.

Respond ONLY with this exact JSON, no explanation, no markdown, no code blocks:
{
  "gainers": ["TICKER +X.X% brief reason", "TICKER +X.X% brief reason", "TICKER +X.X% brief reason"],
  "losers": ["TICKER -X.X% brief reason", "TICKER -X.X% brief reason", "TICKER -X.X% brief reason"],
  "premarket": ["TICKER X.X% brief reason", "TICKER X.X% brief reason", "TICKER X.X% brief reason"],
  "crypto": ["BTC $XX,XXX +X.X% today", "ETH $X,XXX +X.X% today", "SOL $XXX +X.X% today"],
  "geopolitical": "One sentence describing the biggest world news event affecting US markets today"
}

Only include US stocks like AAPL, NVDA, TSLA, AMZN, MSFT, META etc. Use real current prices and percentages.`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
    }),
  })

  if (!res.ok) throw new Error(`Market data fetch failed: ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? '{}'

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in market data response')
    const cleaned = match[0].replace(/\[\d+\]/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { gainers: [], losers: [], premarket: [], crypto: [], geopolitical: '' }
  }
}

// ─── Build single topic based on post type ────────────────────────────────────
function buildTopic(
  postType: PostType,
  market: { gainers: string[]; losers: string[]; premarket: string[]; crypto: string[]; geopolitical: string },
  utcHour: number
): string {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24))

  switch (postType) {
    case 'premarket': {
      const stock = market.premarket[0] || market.gainers[0] || 'S&P 500 futures'
      return `US Pre-Market Preview: ${stock} — what traders need to watch before the bell opens today`
    }

    case 'market-analysis': {
      // Alternate between gainers and losers for the two midday posts
      if (utcHour === 14 && market.gainers[0]) {
        return `Why ${market.gainers[0]} is surging today — US market analysis and what investors should do`
      } else if (market.losers[0]) {
        return `${market.losers[0]} — US market analysis: buying opportunity or time to cut losses?`
      } else if (market.gainers[0]) {
        return `Why ${market.gainers[0]} is moving today — analysis for US investors`
      }
      return `US Stock Market Midday Analysis: What is moving and why right now`
    }

    case 'aftermarket': {
      const stock = market.losers[0] || market.gainers[0] || 'US markets'
      return `US After-Market Recap: ${stock} — what happened today and what to watch tomorrow`
    }

    case 'geopolitical': {
      // Use live geopolitical data if available, else rotate from pool
      if (market.geopolitical) {
        return `How ${market.geopolitical} is affecting US stocks and what investors need to know`
      }
      const geoIndex = dayOfYear % GEOPOLITICAL_TOPICS.length
      return GEOPOLITICAL_TOPICS[geoIndex]
    }

    case 'education': {
      const eduIndex = dayOfYear % EDUCATION_TOPICS.length
      return EDUCATION_TOPICS[eduIndex]
    }
  }
}

// ─── Duplicate check ──────────────────────────────────────────────────────────
async function isDuplicate(supabase: any, title: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const keyword = title.split(' ').slice(0, 3).join(' ')
  const { data } = await supabase
    .from('blog_posts')
    .select('id')
    .gte('created_at', since)
    .ilike('title', `%${keyword}%`)
    .limit(1)
  return (data?.length ?? 0) > 0
}

// ─── Generate one full blog post via Gemini (free) ────────────────────────────
async function generatePost(apiKey: string, topic: string, postType: PostType): Promise<{
  title: string; slug: string; excerpt: string
  content: string; tags: string[]; image_url: string; ai_model: string
} | null> {



  const typeInstructions: Record<PostType, string> = {
    'premarket': `This is a PRE-MARKET preview post. Focus on: US futures, what catalysts to watch before market opens, key earnings or economic data due today, overnight news affecting US stocks. Write for US traders preparing for the trading day.`,
    'market-analysis': `This is a MIDDAY MARKET ANALYSIS post. Focus on: what is moving right now in US markets, specific US stock prices and percentages, why it is happening, what US retail investors should consider doing.`,
    'aftermarket': `This is an AFTER-MARKET RECAP post. Focus on: what happened in US markets today, biggest US winners and losers, after-hours earnings reactions, what to watch for tomorrow in US markets.`,
    'geopolitical': `This is a GEOPOLITICAL IMPACT post. Focus on: how this world event is specifically affecting US stocks and the S&P 500, which US sectors and companies are most impacted, what US investors should do in response.`,
    'education': `This is an EDUCATION post about personal finance and investing. Focus on: clear explanations for beginner to intermediate US investors, practical actionable advice, real examples using US stocks or financial products.`,
  }

  const prompt = `You are a professional US finance journalist writing for American retail investors. Write a detailed blog post about: "${topic}"

${typeInstructions[postType]}

IMPORTANT: Focus exclusively on US markets, US-listed stocks (NYSE/NASDAQ), and US investors. Do not mention Indian, European or other non-US stocks unless explaining their impact on US markets.

Use specific numbers and data. 

Structure:
1. Hook intro (1 paragraph)
2. What's happening right now (h2 + data)
3. Why it matters for US investors (h2 + analysis)
4. What analysts are saying (h2)
5. Key Takeaways: <div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>point</li><li>point</li><li>point</li></ul></div>
6. FAQ: <div class="faq"><h2>Frequently Asked Questions</h2><h3>Question?</h3><p>Answer.</p><h3>Question?</h3><p>Answer.</p><h3>Question?</h3><p>Answer.</p></div>

Respond ONLY with valid JSON, absolutely no markdown or code blocks:
{
  "title": "SEO title focused on US market, 50-60 chars",
  "excerpt": "2-3 sentence compelling summary ~50 words",
  "content": "full HTML 900-1100 words using h2/p/strong/ul/li/div",
  "tags": ["us-stocks", "investing", "market-analysis", "relevant-ticker", "relevant-tag"],
  "image_query": "3-4 word US finance photo search query"
}`

  let raw = ''
  let usedModel = 'unknown'

  // ── Try Gemini models in order (all free) ────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY
  const geminiModels = [
    'gemini-2.0-flash',      // stable fallback
    'gemini-2.0-flash-lite', // lightweight fallback
  ]

  if (geminiKey) {
    for (const model of geminiModels) {
      if (raw) break
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
            }),
          }
        )
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const candidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
          if (candidate) {
            raw = candidate
            usedModel = model
            console.log(`[auto-blog] Used ${model} ✅`)
          }

        } else {
          console.warn(`[auto-blog] ${model} failed (${geminiRes.status}), trying next...`)
        }
      } catch (e) {
        console.warn(`[auto-blog] ${model} threw error, trying next...`, e)
      }
    }
  }

  // ── Final fallback: Perplexity sonar ─────────────────────────────────────
  if (!raw) {
    console.warn('[auto-blog] All Gemini models failed, falling back to Perplexity sonar...')
    const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })
    if (!perplexityRes.ok) {
      console.error(`[auto-blog] All models failed for "${topic}": ${perplexityRes.status}`)
      return null
    }
    const perplexityData = await perplexityRes.json()
    raw = perplexityData.choices?.[0]?.message?.content ?? ''
    usedModel = 'perplexity-sonar'
    console.log('[auto-blog] Used Perplexity sonar as final fallback ✅')
  }



  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])

    // Fetch Unsplash image
    let image_url = ''
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
    if (unsplashKey && parsed.image_query) {
      try {
        const imgRes = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(parsed.image_query)}&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } }
        )
        if (imgRes.ok) {
          const img = await imgRes.json()
          image_url = img.urls?.regular ?? ''
        }
      } catch { /* no image — that's ok */ }
    }

    return {
      title: parsed.title ?? topic,
      slug: titleToSlug(parsed.title ?? topic) + '-' + Date.now(),
      excerpt: parsed.excerpt ?? '',
      content: parsed.content ?? '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      image_url,
      ai_model: usedModel,
    }
  } catch (err) {
    console.error(`[auto-blog] Gemini JSON parse failed for "${topic}"`, err)
    return null
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'PERPLEXITY_API_KEY not set' }, { status: 500 })
  }

  const utcHour = new Date().getUTCHours()
  const postType = getPostType(utcHour)

  console.log(`[auto-blog] ─── Run started: ${postType} (UTC ${utcHour}) ───`)

  try {
    // Step 1 — Get real US market data
    console.log('[auto-blog] Fetching live US market data...')
    const marketData = await fetchMarketData(apiKey)
    console.log('[auto-blog] Market data received:', JSON.stringify(marketData))

    // Step 2 — Build single topic for this run
    const topic = buildTopic(postType, marketData, utcHour)
    console.log(`[auto-blog] Topic: "${topic}"`)

    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const results = {
      published: 0,
      drafts: 0,
      failed: 0,
      skipped: 0,
      posts: [] as { title: string; status: string }[],
    }

    // Step 3 — Generate and save the post
    const post = await generatePost(apiKey, topic, postType)
    if (!post) {
      results.failed++
    } else {
      const dup = await isDuplicate(supabase, post.title)
      if (dup) {
        console.log(`[auto-blog] Duplicate skipped: "${post.title}"`)
        results.skipped++
      } else {
        const now = new Date().toISOString()
        const { error } = await supabase.from('blog_posts').insert([{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          tags: post.tags,
          image_url: post.image_url || null,
          ai_model: post.ai_model || null,
          published: true,
          published_at: now,
          author_id: null,
        }])


        if (error) {
          console.error(`[auto-blog] DB insert failed:`, error.message)
          results.failed++
        } else {
          results.posts.push({ title: post.title, status: 'published' })
          results.published++
        }
      }
    }

    console.log(`[auto-blog] ─── Done: ${results.published} published, ${results.failed} failed, ${results.skipped} skipped ───`)

    return NextResponse.json({
      success: true,
      postType,
      utcHour,
      topic,
      marketData,
      ...results,
    })

  } catch (err: any) {
    console.error('[auto-blog] Fatal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET for manual test trigger
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return POST(request)
}
