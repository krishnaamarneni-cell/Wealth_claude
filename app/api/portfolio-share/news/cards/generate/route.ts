import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { downloadAndUpload } from '@/lib/upload-image'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawArticle {
  symbol: string
  publishedDate: string
  title: string
  image: string
  site: string
  text: string
  url: string
  source: 'polygon' | 'finnhub'
}

interface ClassifiedCard {
  title: string
  summary: string
  sentiment: 'bullish' | 'bearish' | 'watch'
  confidence: 'high' | 'medium' | 'low'
  category: 'markets' | 'geopolitics' | 'economy' | 'tech' | 'career' | 'personal-finance'
  source_count: number
  sources: { name: string; url: string }[]
  primary_url: string
  is_featured: boolean
  is_live: boolean
  event_date: string | null
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  // For local testing
  if (process.env.NODE_ENV === 'development') return true
  return false
}

// ─── Supabase client ──────────────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Fetch news directly from Polygon + Finnhub ───────────────────────────────
async function fetchRawNews(): Promise<RawArticle[]> {
  const articles: RawArticle[] = []

  // Fetch from Polygon
  const polygonKey = process.env.POLYGON_API_KEY
  if (polygonKey) {
    try {
      const res = await fetch(
        `https://api.polygon.io/v2/reference/news?limit=15&apiKey=${polygonKey}`,
        { next: { revalidate: 0 } }
      )
      if (res.ok) {
        const data = await res.json()
        const results = data.results || []
        for (const item of results) {
          articles.push({
            symbol: item.tickers?.[0] || '',
            publishedDate: item.published_utc || '',
            title: item.title || '',
            image: item.image_url || '',
            site: item.publisher?.name || 'Polygon',
            text: item.description || '',
            url: item.article_url || '',
            source: 'polygon'
          })
        }
        console.log(`[news-cards] Fetched ${results.length} from Polygon`)
      }
    } catch (err) {
      console.error('[news-cards] Polygon fetch error:', err)
    }
  }

  // Fetch from Finnhub
  const finnhubKey = process.env.FINNHUB_API_KEY
  if (finnhubKey) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`,
        { next: { revalidate: 0 } }
      )
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data.slice(0, 15) : []
        for (const item of items) {
          articles.push({
            symbol: item.related || '',
            publishedDate: item.datetime ? new Date(item.datetime * 1000).toISOString() : '',
            title: item.headline || '',
            image: item.image || '',
            site: item.source || 'Finnhub',
            text: item.summary || '',
            url: item.url || '',
            source: 'finnhub'
          })
        }
        console.log(`[news-cards] Fetched ${items.length} from Finnhub`)
      }
    } catch (err) {
      console.error('[news-cards] Finnhub fetch error:', err)
    }
  }

  console.log(`[news-cards] Total raw articles: ${articles.length}`)
  return articles
}

// ─── Deduplicate articles by similarity ───────────────────────────────────────
function deduplicateArticles(articles: RawArticle[]): RawArticle[][] {
  const groups: RawArticle[][] = []
  const used = new Set<number>()

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue

    const group = [articles[i]]
    used.add(i)

    // Find similar articles (same story from different sources)
    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue

      if (areSimilar(articles[i].title, articles[j].title)) {
        group.push(articles[j])
        used.add(j)
      }
    }

    groups.push(group)
  }

  return groups
}

function areSimilar(title1: string, title2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const t1 = normalize(title1)
  const t2 = normalize(title2)

  // Check for significant overlap
  const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  let overlap = 0
  for (const word of words1) {
    if (words2.has(word)) overlap++
  }

  const similarity = overlap / Math.min(words1.size, words2.size)
  return similarity > 0.5
}

// ─── Classify articles with Groq ──────────────────────────────────────────────
async function classifyArticles(
  articleGroups: RawArticle[][]
): Promise<ClassifiedCard[]> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    console.error('[news-cards] GROQ_API_KEY not set')
    return []
  }

  const cards: ClassifiedCard[] = []

  // Process in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < articleGroups.length; i += batchSize) {
    const batch = articleGroups.slice(i, i + batchSize)

    const batchPromises = batch.map(async (group, idx) => {
      const primaryArticle = group[0]
      const allTitles = group.map(a => a.title).join('\n')
      const allSummaries = group.map(a => a.text).join('\n')

      const prompt = `Analyze this financial news and classify it.

TITLES FROM MULTIPLE SOURCES:
${allTitles}

SUMMARIES:
${allSummaries.slice(0, 1000)}

Respond with ONLY valid JSON, no markdown:
{
  "title": "Clean, synthesized headline under 100 chars - combine the best elements from sources",
  "summary": "1-2 sentence synthesis of what happened and why it matters",
  "sentiment": "bullish" | "bearish" | "watch",
  "confidence": "high" | "medium" | "low",
  "category": "markets" | "geopolitics" | "economy" | "tech" | "career" | "personal-finance",
  "is_live": false,
  "event_date": null
}

SENTIMENT RULES:
- "bullish": Positive for markets/investors (rallies, beats, growth, deals)
- "bearish": Negative/risky (crashes, misses, layoffs, conflicts, inflation up)
- "watch": Uncertain/upcoming (Fed decisions, earnings coming, developing situations)

CATEGORY RULES:
- "markets": Stock moves, indices, earnings, IPOs, M&A
- "geopolitics": Wars, trade tensions, sanctions, elections, international relations
- "economy": GDP, jobs, inflation, Fed, interest rates, consumer spending
- "tech": AI, chips, software, hardware, tech companies (unless it's about stock price)
- "career": Jobs market, layoffs, hiring, skills, salaries
- "personal-finance": Tax, savings, retirement, budgeting, FIRE

If this is about an UPCOMING EVENT (Fed meeting, earnings date), set is_live: true and event_date to the date.`

      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
          }),
        })

        if (!res.ok) {
          console.warn(`[news-cards] Groq failed for article ${i + idx}:`, res.status)
          return null
        }

        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content ?? ''

        // Parse JSON
        const match = raw.match(/\{[\s\S]*\}/)
        if (!match) {
          console.warn('[news-cards] No JSON in Groq response')
          return null
        }

        const parsed = JSON.parse(match[0])

        return {
          title: parsed.title || primaryArticle.title,
          summary: parsed.summary || primaryArticle.text?.slice(0, 200),
          sentiment: parsed.sentiment || 'watch',
          confidence: parsed.confidence || 'medium',
          category: parsed.category || 'markets',
          source_count: group.length,
          sources: group.map(a => ({ name: a.site, url: a.url })),
          primary_url: primaryArticle.url,
          is_featured: false,
          is_live: parsed.is_live || false,
          event_date: parsed.event_date || null,
        } as ClassifiedCard

      } catch (err) {
        console.error('[news-cards] Error classifying article:', err)
        return null
      }
    })

    const results = await Promise.all(batchPromises)
    cards.push(...results.filter((c): c is ClassifiedCard => c !== null))

    // Small delay between batches to avoid rate limits
    if (i + batchSize < articleGroups.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return cards
}

// ─── Pick featured card ───────────────────────────────────────────────────────
function pickFeaturedCard(cards: ClassifiedCard[]): ClassifiedCard | null {
  // Priority: high confidence bullish with most sources
  const candidates = cards
    .filter(c => c.confidence === 'high' && c.category === 'markets')
    .sort((a, b) => b.source_count - a.source_count)

  if (candidates.length > 0) {
    candidates[0].is_featured = true
    return candidates[0]
  }

  // Fallback: highest source count
  const sorted = [...cards].sort((a, b) => b.source_count - a.source_count)
  if (sorted.length > 0) {
    sorted[0].is_featured = true
    return sorted[0]
  }

  return null
}

// ─── Generate full article for featured card ──────────────────────────────────
async function generateFeaturedArticle(
  card: ClassifiedCard,
  supabase: any
): Promise<{ article_id: string; slug: string } | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null

  const prompt = `You are a professional US finance journalist writing for American retail investors. Write a detailed blog post about: "${card.title}"

CONTEXT: ${card.summary}
SOURCES REPORTING THIS: ${card.sources.map(s => s.name).join(', ')}

CRITICAL FORMATTING RULES — follow exactly:
1. NEVER start with <h2>Introduction</h2>. That heading is forbidden.
2. ALWAYS start the content with a bold hook sentence: <p><strong>[compelling hook about the topic with specific number or fact]</strong> [2-3 more sentences expanding the hook with data.]</p>
3. Use <strong> tags to highlight specific prices, percentages, ticker symbols, and key terms inline throughout the article.
4. Section headings must be: <h2>What's Happening Right Now</h2>, <h2>Why It Matters for US Investors</h2>, <h2>What Analysts Are Saying</h2>
5. Use specific real numbers, prices, percentages throughout. Be data-driven.
6. Focus exclusively on US markets, US-listed stocks (NYSE/NASDAQ), and US investors.

Structure (in this exact order):
1. <p><strong>Bold hook opening sentence with data.</strong> Follow-up context sentences.</p>
2. <h2>What's Happening Right Now</h2> — specific prices, moves, data
3. <h2>Why It Matters for US Investors</h2> — analysis and implications
4. <h2>What Analysts Are Saying</h2> — expert views
5. <div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>point</li><li>point</li><li>point</li></ul></div>
6. <div class="faq"><h2>Frequently Asked Questions</h2><h3>Question?</h3><p>Answer.</p><h3>Question?</h3><p>Answer.</p><h3>Question?</h3><p>Answer.</p></div>

Respond ONLY with valid JSON, absolutely no markdown or code blocks:
{
  "title": "SEO title with specific data point (ticker, %, $price), 50-60 chars",
  "excerpt": "2-3 sentence compelling summary with specific data ~50 words",
  "content": "full HTML 900-1100 words using h2/p/strong/ul/li/div — NO <h2>Introduction</h2>",
  "tags": ["us-stocks", "investing", "market-analysis", "relevant-ticker", "relevant-tag"],
  "image_query": "3-4 word US finance photo search query"
}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!res.ok) {
      console.error('[news-cards] Failed to generate featured article:', res.status)
      return null
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null

    const parsed = JSON.parse(match[0])

    // Create slug
    const slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 80) + '-' + Date.now()

    // Fetch image
    let image_url = ''
    const pixabayKey = process.env.PIXABAY_API_KEY
    if (pixabayKey && parsed.image_query) {
      try {
        const imgRes = await fetch(
          `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(parsed.image_query)}&image_type=photo&orientation=horizontal&category=business&per_page=5&safesearch=true`
        )
        if (imgRes.ok) {
          const img = await imgRes.json()
          const hits = img.hits ?? []
          if (hits.length > 0) {
            image_url = hits[Math.floor(Math.random() * hits.length)]?.webformatURL ?? ''
          }
        }
      } catch (e) {
        console.warn('[news-cards] Pixabay fetch failed')
      }
    }

    // Insert into blog_posts
    const now = new Date().toISOString()
    const storedImageUrl = image_url
      ? await downloadAndUpload(supabase, image_url, slug)
      : null
    const { data: insertedPost, error } = await supabase
      .from('blog_posts')
      .insert([{
        slug,
        title: parsed.title,
        excerpt: parsed.excerpt,
        content: parsed.content,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        image_url: storedImageUrl,
        ai_model: 'llama-3.3-70b-versatile',
        post_type: 'featured-news',
        published: true,
        published_at: now,
        author_id: null,
      }])
      .select('id')
      .single()

    if (error) {
      console.error('[news-cards] Failed to insert featured article:', error.message)
      return null
    }

    console.log(`[news-cards] Generated featured article: ${slug}`)
    return { article_id: insertedPost.id, slug }

  } catch (err) {
    console.error('[news-cards] Error generating featured article:', err)
    return null
  }
}

// ─── Calculate overall mood ──────────────────────────────────────────────────
function calculateMood(cards: ClassifiedCard[]): number {
  if (cards.length === 0) return 50

  let score = 0
  for (const card of cards) {
    if (card.sentiment === 'bullish') score += 1
    else if (card.sentiment === 'bearish') score -= 1
    // 'watch' is neutral
  }

  // Normalize to 0-100 scale
  const normalized = (score / cards.length + 1) / 2 * 100
  return Math.round(Math.min(100, Math.max(0, normalized)))
}

// ─── Calculate category sentiment ────────────────────────────────────────────
function calculateCategorySentiment(cards: ClassifiedCard[]): Record<string, number> {
  const categories: Record<string, { bullish: number; bearish: number; total: number }> = {}

  for (const card of cards) {
    if (!categories[card.category]) {
      categories[card.category] = { bullish: 0, bearish: 0, total: 0 }
    }
    categories[card.category].total++
    if (card.sentiment === 'bullish') categories[card.category].bullish++
    if (card.sentiment === 'bearish') categories[card.category].bearish++
  }

  const result: Record<string, number> = {}
  for (const [cat, data] of Object.entries(categories)) {
    if (data.total === 0) {
      result[cat] = 50
    } else {
      const score = (data.bullish - data.bearish) / data.total
      result[cat] = Math.round((score + 1) / 2 * 100)
    }
  }

  return result
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[news-cards] ─── Starting news card generation ───')

  try {
    const supabase = getSupabase()

    // Step 1: Fetch raw news DIRECTLY from APIs (not via internal endpoint)
    console.log('[news-cards] Fetching raw news from Polygon + Finnhub...')
    const rawArticles = await fetchRawNews()
    console.log(`[news-cards] Fetched ${rawArticles.length} raw articles`)

    if (rawArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No raw news articles fetched - check POLYGON_API_KEY and FINNHUB_API_KEY'
      }, { status: 500 })
    }

    // Step 2: Deduplicate
    console.log('[news-cards] Deduplicating articles...')
    const articleGroups = deduplicateArticles(rawArticles)
    console.log(`[news-cards] Merged into ${articleGroups.length} unique stories`)

    // Step 3: Classify with Groq
    console.log('[news-cards] Classifying articles with Groq...')
    const classifiedCards = await classifyArticles(articleGroups.slice(0, 20)) // Limit to 20 cards
    console.log(`[news-cards] Classified ${classifiedCards.length} cards`)

    if (classifiedCards.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to classify any articles'
      }, { status: 500 })
    }

    // Step 4: Pick featured card
    const featuredCard = pickFeaturedCard(classifiedCards)

    // Step 5: Generate full article for featured card
    let featuredArticle: { article_id: string; slug: string } | null = null
    if (featuredCard) {
      console.log('[news-cards] Generating full article for featured card...')
      featuredArticle = await generateFeaturedArticle(featuredCard, supabase)
    }

    // Step 6: Calculate batch stats
    const bullishCount = classifiedCards.filter(c => c.sentiment === 'bullish').length
    const bearishCount = classifiedCards.filter(c => c.sentiment === 'bearish').length
    const watchCount = classifiedCards.filter(c => c.sentiment === 'watch').length
    const overallMood = calculateMood(classifiedCards)
    const categorySentiment = calculateCategorySentiment(classifiedCards)

    // Step 7: Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('news_batches')
      .insert([{
        bullish_count: bullishCount,
        bearish_count: bearishCount,
        watch_count: watchCount,
        total_cards: classifiedCards.length,
        overall_mood_pct: overallMood,
        category_sentiment: categorySentiment,
      }])
      .select('id')
      .single()

    if (batchError) {
      console.error('[news-cards] Failed to create batch:', batchError.message)
      return NextResponse.json({
        success: false,
        error: 'Failed to create batch: ' + batchError.message
      }, { status: 500 })
    }

    // Step 8: Insert cards
    const cardsToInsert = classifiedCards.map(card => ({
      batch_id: batch.id,
      title: card.title,
      summary: card.summary,
      sentiment: card.sentiment,
      confidence: card.confidence,
      category: card.category,
      source_count: card.source_count,
      sources: card.sources,
      primary_url: card.primary_url,
      is_featured: card.is_featured,
      is_live: card.is_live,
      event_date: card.event_date,
      article_id: card.is_featured && featuredArticle ? featuredArticle.article_id : null,
      article_slug: card.is_featured && featuredArticle ? featuredArticle.slug : null,
    }))

    const { error: cardsError } = await supabase
      .from('news_cards')
      .insert(cardsToInsert)

    if (cardsError) {
      console.error('[news-cards] Failed to insert cards:', cardsError.message)
      return NextResponse.json({
        success: false,
        error: 'Failed to insert cards: ' + cardsError.message
      }, { status: 500 })
    }

    // Step 9: Cleanup old cards
    await supabase.rpc('cleanup_old_news_cards').catch(() => {
      console.warn('[news-cards] Cleanup function not available, skipping')
    })

    console.log(`[news-cards] ─── Done: ${classifiedCards.length} cards created ───`)

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      total_cards: classifiedCards.length,
      bullish_count: bullishCount,
      bearish_count: bearishCount,
      watch_count: watchCount,
      overall_mood_pct: overallMood,
      category_sentiment: categorySentiment,
      featured_article: featuredArticle ? {
        slug: featuredArticle.slug,
        url: `/blog/${featuredArticle.slug}`
      } : null,
    })

  } catch (err: any) {
    console.error('[news-cards] Fatal error:', err)
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}

// GET for manual trigger
export async function GET(request: NextRequest) {
  return POST(request)
}