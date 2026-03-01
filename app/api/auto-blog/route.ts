import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
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

// ─── Fetch real market data via Perplexity ────────────────────────────────────
async function fetchMarketData(apiKey: string): Promise<{
  gainers: string[]
  losers: string[]
  premarket: string[]
  crypto: string[]
}> {
  const prompt = `You are a financial data assistant. Give me TODAY's real live market data right now.

Respond ONLY with this exact JSON, no explanation, no markdown, no code blocks:
{
  "gainers": ["TICKER +X.X% brief reason", "TICKER +X.X% brief reason", "TICKER +X.X% brief reason"],
  "losers": ["TICKER -X.X% brief reason", "TICKER -X.X% brief reason", "TICKER -X.X% brief reason"],
  "premarket": ["TICKER X.X% brief reason", "TICKER X.X% brief reason", "TICKER X.X% brief reason"],
  "crypto": ["BTC $XX,XXX +X.X% today", "ETH $X,XXX +X.X% today", "SOL $XXX +X.X% today"]
}

Use real current prices and percentages. Be specific.`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    }),
  })

  if (!res.ok) throw new Error(`Market data fetch failed: ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? '{}'

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in market data response')
    return JSON.parse(match[0])
  } catch {
    return { gainers: [], losers: [], premarket: [], crypto: [] }
  }
}

// ─── Build blog topics from market data ──────────────────────────────────────
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
]

function buildTopics(
  market: { gainers: string[]; losers: string[]; premarket: string[]; crypto: string[] },
  timeOfDay: string
): string[] {
  const topics: string[] = []

  // 1 market post per run — rotate through gainers/losers/crypto
  const hour = new Date().getUTCHours()
  if (hour <= 13 && market.gainers[0]) {
    topics.push(`Why is ${market.gainers[0]} — analysis and what investors should do now`)
  } else if (hour <= 17 && market.losers[0]) {
    topics.push(`${market.losers[0]} — buying opportunity or time to cut losses?`)
  } else if (market.crypto[0]) {
    topics.push(`${market.crypto[0]} — price analysis and what comes next`)
  } else if (market.gainers[0]) {
    topics.push(`Why is ${market.gainers[0]} — analysis and what investors should do now`)
  }

  // 1 education post per run — rotate daily
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const eduIndex = (dayOfYear + hour) % EDUCATION_TOPICS.length
  topics.push(EDUCATION_TOPICS[eduIndex])

  return topics
}

// ─── Duplicate check (same topic in last 24h) ─────────────────────────────────
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

// ─── Generate one full blog post ──────────────────────────────────────────────
async function generatePost(apiKey: string, topic: string): Promise<{
  title: string; slug: string; excerpt: string
  content: string; tags: string[]; image_url: string
} | null> {
  const prompt = `You are a professional finance journalist. Write a detailed blog post about: "${topic}"

Use real current market data, be specific with numbers. Write for retail investors who want to understand what's happening.

Structure:
1. Hook intro (1 paragraph)
2. What's happening right now (h2 + data)
3. Why it's moving (h2 + analysis)
4. What analysts are saying (h2)
5. Key Takeaways: <div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>point</li><li>point</li><li>point</li></ul></div>
6. FAQ: <div class="faq"><h2>Frequently Asked Questions</h2><h3>Question?</h3><p>Answer.</p><h3>Question?</h3><p>Answer.</p><h3>Question?</h3><p>Answer.</p></div>

Respond ONLY with valid JSON, absolutely no markdown or code blocks:
{
  "title": "SEO title with ticker symbol, 50-60 chars",
  "excerpt": "2-3 sentence compelling summary ~50 words",
  "content": "full HTML 900-1100 words using h2/p/strong/ul/li/div",
  "tags": ["ticker", "stocks", "investing", "market", "relevant-tag"],
  "image_query": "3-4 word finance photo search query"
}`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  })

  if (!res.ok) {
    console.error(`[auto-blog] Generation failed for "${topic}": ${res.status}`)
    return null
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? ''

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
    }
  } catch (err) {
    console.error(`[auto-blog] JSON parse failed for "${topic}"`, err)
    return null
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'PERPLEXITY_API_KEY not set' }, { status: 500 })
  }

  const utcHour = new Date().getUTCHours()
  const timeOfDay =
    utcHour <= 13 ? 'pre-market 7AM EST' :
      utcHour <= 18 ? 'midday 12PM EST' :
        'post-market 5PM EST'

  console.log(`[auto-blog] ─── Run started: ${timeOfDay} ───`)

  try {
    // Step 1 — Get real market data
    console.log('[auto-blog] Fetching live market data...')
    const marketData = await fetchMarketData(apiKey)
    console.log('[auto-blog] Market data received:', JSON.stringify(marketData))

    // Step 2 — Build topics from data
    const topics = buildTopics(marketData, timeOfDay)
    console.log(`[auto-blog] ${topics.length} topics built`)

    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const results = {
      published: 0,
      drafts: 0,
      failed: 0,
      skipped: 0,
      posts: [] as { title: string; status: string }[],
    }

    // Step 3 — Generate and save each post
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      console.log(`[auto-blog] Post ${i + 1}/${topics.length}: "${topic}"`)

      const post = await generatePost(apiKey, topic)
      if (!post) { results.failed++; continue }

      // Skip if similar post exists in last 24h
      const dup = await isDuplicate(supabase, post.title)
      if (dup) {
        console.log(`[auto-blog] Duplicate skipped: "${post.title}"`)
        results.skipped++
        continue
      }

      // All posts published
      const publish = true
      const now = new Date().toISOString()

      const { error } = await supabase.from('blog_posts').insert([{
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        image_url: post.image_url || null,
        published: publish,
        published_at: publish ? now : null,
        author_id: null,
      }])

      if (error) {
        console.error(`[auto-blog] DB insert failed:`, error.message)
        results.failed++
      } else {
        results.posts.push({ title: post.title, status: publish ? 'published' : 'draft' })
        publish ? results.published++ : results.drafts++
      }

      // Rate limit buffer between posts
      if (i < topics.length - 1) await new Promise(r => setTimeout(r, 3000))
    }

    console.log(`[auto-blog] ─── Done: ${results.published} published, ${results.drafts} drafts, ${results.failed} failed, ${results.skipped} skipped ───`)

    return NextResponse.json({
      success: true,
      timeOfDay,
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
  return POST(request)
}