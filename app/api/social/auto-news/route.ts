import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderNewsImage } from '@/lib/news-image-renderers'

/**
 * AUTO NEWS — Fetches top CNBC articles, generates news images, queues them.
 *
 * Flow:
 * 1. Vercel cron hits this endpoint daily
 * 2. Fetches CNBC RSS feed → picks top 3 articles
 * 3. Crawls each article → AI extracts structured data (Groq)
 * 4. Picks best template per article category
 * 5. Saves to news_image_posts with status='queued'
 * 6. Stores rendered HTML for local Playwright to screenshot
 * 7. Local script polls /api/social/news-queue → screenshots → Cloudinary → Make.com
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  // Support both: Authorization header OR ?secret= query param (for cron-job.org)
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const qSecret = req.nextUrl.searchParams.get('secret')
  if (qSecret === secret) return true
  return false
}

// CNBC RSS feeds by category
const CNBC_FEEDS = [
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', // Top News
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',  // World
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069',  // Economy
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',  // Finance
]

// Pick best template based on category
// Detects placeholder values that AI sometimes leaves in
const PLACEHOLDER_PATTERNS = [
  /\bX+\.X+\b/i,       // XX.XX, X.X
  /\bX+\%/i,           // X%, XX%
  /\bN\/A\b/i,
  /\bTBD\b/i,
  /\$X+/i,             // $X, $XX, $XXX
  /\bUNKNOWN\b/i,
]

function isPlaceholder(val: any): boolean {
  if (val == null) return true
  const s = String(val).trim()
  if (!s || s === '0' || s === '0%' || s === '$0' || s === '0.00') return true
  return PLACEHOLDER_PATTERNS.some(p => p.test(s))
}

/**
 * Clean extracted data — remove fields with placeholder values so the
 * image templates can hide those sections cleanly.
 */
function cleanExtractedData(data: any): any {
  const clean: any = { ...data }

  // Clean key_points: drop empty/trivial items
  if (Array.isArray(clean.key_points)) {
    clean.key_points = clean.key_points
      .filter((p: any) => typeof p === 'string' && p.trim().length > 15)
      .slice(0, 5)
  }

  // Clean market_impact: drop entries with placeholder change/price
  if (Array.isArray(clean.market_impact)) {
    clean.market_impact = clean.market_impact
      .filter((m: any) => m && m.name && !isPlaceholder(m.change))
      .map((m: any) => {
        const cleaned = { ...m }
        if (isPlaceholder(cleaned.price)) delete cleaned.price
        return cleaned
      })
  }

  // Clean big_stat: drop if number is a placeholder
  if (clean.big_stat && isPlaceholder(clean.big_stat.number)) {
    delete clean.big_stat
  }

  // Clean quote: drop if text is too short or placeholder
  if (clean.quote && (typeof clean.quote.text !== 'string' || clean.quote.text.trim().length < 15)) {
    delete clean.quote
  }

  // Clean timeline_events: must have real title and description
  if (Array.isArray(clean.timeline_events)) {
    clean.timeline_events = clean.timeline_events.filter(
      (e: any) => e && e.title && e.description && e.title.length > 3
    )
  }

  // Clean context_points
  if (Array.isArray(clean.context_points)) {
    clean.context_points = clean.context_points.filter(
      (p: any) => typeof p === 'string' && p.trim().length > 15
    )
  }

  return clean
}

/**
 * Quality gate — decide whether we have enough rich data to make a good image.
 * Returns ok=false with reason if the article should be skipped.
 */
function validateQuality(data: any): { ok: boolean; reason?: string } {
  if (!data.headline || data.headline.length < 10) {
    return { ok: false, reason: 'headline too short' }
  }
  const keyPoints = Array.isArray(data.key_points) ? data.key_points : []
  if (keyPoints.length < 3) {
    return { ok: false, reason: `only ${keyPoints.length} key points (need 3+)` }
  }

  // Count meaningful content fields to make sure there's enough to fill a card
  let signal = 0
  if (keyPoints.length >= 3) signal += 2
  if (keyPoints.length >= 4) signal += 1
  if (Array.isArray(data.market_impact) && data.market_impact.length >= 2) signal += 2
  if (data.big_stat?.number) signal += 1
  if (data.quote?.text) signal += 1
  if (Array.isArray(data.timeline_events) && data.timeline_events.length >= 2) signal += 1
  if (Array.isArray(data.context_points) && data.context_points.length >= 2) signal += 1

  if (signal < 4) {
    return { ok: false, reason: `signal score ${signal}/4 (not enough rich data)` }
  }

  return { ok: true }
}

/**
 * Pick the template based on what DATA we actually have, not just category.
 * This avoids showing empty sections.
 */
function pickTemplate(category: string, data?: any): 'a' | 'c' | 'd' | 'e' | 'f' {
  const cat = (category || '').toUpperCase()

  // Check what rich data is available
  const hasMarket = data && Array.isArray(data.market_impact) && data.market_impact.length >= 2
  const hasBigStat = data && data.big_stat?.number
  const hasQuote = data && data.quote?.text
  const hasTimeline = data && Array.isArray(data.timeline_events) && data.timeline_events.length >= 3
  const hasContext = data && Array.isArray(data.context_points) && data.context_points.length >= 2

  // Template D: Ticker Dashboard — needs market_impact + big_stat
  if (hasMarket && hasBigStat && (cat.includes('MARKET') || cat.includes('STOCK') || cat.includes('CRYPTO'))) return 'd'

  // Template E: Timeline — needs timeline_events
  if (hasTimeline) return 'e'

  // Template F: Split Stat + Context — needs big_stat + context_points
  if (hasBigStat && hasContext) return 'f'

  // Template C: Editorial + Data — needs big_stat + quote
  if (hasBigStat && hasQuote) return 'c'

  // Template A: Breaking Alert — always works with just key_points
  return 'a'
}

async function fetchCNBCArticles(count: number = 3): Promise<string[]> {
  const urls: string[] = []

  for (const feedUrl of CNBC_FEEDS) {
    if (urls.length >= count) break
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WealthClaude/1.0)' },
      })
      if (!res.ok) continue
      const xml = await res.text()

      // Only match ARTICLE URLs (must contain /YYYY/MM/DD/ date pattern)
      // Excludes landing pages like /us-top-news-and-analysis/
      const linkMatches = xml.matchAll(/<link>(https:\/\/www\.cnbc\.com\/\d{4}\/\d{2}\/\d{2}\/[^<]+)<\/link>/g)
      for (const match of linkMatches) {
        const articleUrl = match[1]
        // Skip non-article URLs
        if (articleUrl.includes('/video/') || articleUrl.includes('/select/')) continue
        if (!urls.includes(articleUrl)) {
          urls.push(articleUrl)
          if (urls.length >= count) break
        }
      }
    } catch (e) {
      console.error(`Failed to fetch feed: ${feedUrl}`, e)
    }
  }

  return urls.slice(0, count)
}

// Last crawl error for debugging
let lastCrawlError: string = ''
export function getLastCrawlError() { return lastCrawlError }

async function crawlArticle(url: string): Promise<any | null> {
  // Use Groq (free) for social post data extraction
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) { lastCrawlError = 'no-groq-key'; return null }

  try {
    // Fetch article
    const articleRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!articleRes.ok) { lastCrawlError = `cnbc-${articleRes.status}`; return null }

    const html = await articleRes.text()
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000)

    if (textContent.length < 200) { lastCrawlError = `short-content-${textContent.length}`; return null }

    // AI extraction via Groq
    const systemPrompt = `You are a financial news analyzer extracting data for Instagram-style info cards. Return ONLY valid JSON (no markdown).

{
  "headline": "Compelling headline under 80 chars",
  "source": "CNBC",
  "category": "MARKETS | GEOPOLITICS | ECONOMY | CRYPTO | TECHNOLOGY | ENERGY | COMMODITIES | HEALTHCARE | POLITICS",
  "date": "Month Day, Year",
  "key_points": [
    "MUST have AT LEAST 4 rich bullet points (full sentences, 15+ words each)",
    "Each must contain a specific FACT: number, name, event, or quote from the article",
    "Example: 'Nvidia shares fell 3.2% to $128.50 after Q3 earnings missed analyst estimates'"
  ],
  "quote": {"text": "Actual direct quote (20+ chars) with quotation marks in the article", "attribution": "Name + title of who said it"},
  "market_impact": [
    {"icon": "📈", "name": "S&P 500", "change": "+1.2%", "direction": "up"},
    {"icon": "🛢️", "name": "Oil WTI", "change": "-2.5%", "direction": "down"}
  ],
  "big_stat": {"number": "Real number from article ('$5.28B', '8.5%', '2,400 jobs')", "label": "What it represents", "color": "#EF4444 if negative, #4ADE80 if positive, #FBBF24 if neutral"},
  "timeline_events": [
    {"time": "Date/phase from article (e.g. 'March 15', 'Q4 2025')", "title": "Event name", "description": "One-sentence description", "color": "#EF4444/#FBBF24/#4ADE80"}
  ],
  "context_points": ["Explain WHY the investor cares — what this means for markets, jobs, spending, etc."]
}

STRICT RULES:
1. NEVER use placeholder text like "XX.XX", "X.X%", "$XXX", "N/A", "TBD", "0.00". If you can't find real data, OMIT that field entirely (don't include an empty or placeholder value).
2. key_points REQUIRES at least 4 rich items. If the article is too thin to produce 4 substantive points, return {"insufficient_data": true} instead.
3. market_impact entries MUST have a real percentage change from the article. Don't invent ones. If no market data is mentioned, return an empty array.
4. Emojis: 🛢️ oil, 🥇 gold, 💵 USD, 🌍 global markets, 📈 stocks up, 📉 stocks down, ₿ bitcoin, 💊 pharma, 🇺🇸 US, 🇨🇳 China, 🇯🇵 Japan.
5. big_stat must be an exact number that appears in the article text — no rounding placeholders.
6. Return ONLY JSON — no markdown fences, no explanation.`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract from:\n\nURL: ${url}\n\n${textContent}` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      lastCrawlError = `groq-${groqRes.status}: ${errText.slice(0, 150)}`
      console.error(`Groq API error: ${groqRes.status}`, errText)
      return null
    }
    const groqData = await groqRes.json()
    const aiResponse = groqData.choices?.[0]?.message?.content || ''
    if (!aiResponse) { lastCrawlError = 'groq-empty-response'; return null }
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) { lastCrawlError = 'no-json-in-response'; return null }
    try {
      const parsed = JSON.parse(jsonMatch[0])
      // AI explicitly signaled the article doesn't have enough data
      if (parsed.insufficient_data) {
        lastCrawlError = 'insufficient-data'
        return null
      }
      return parsed
    } catch (e: any) {
      lastCrawlError = `json-parse: ${e.message}`
      return null
    }
  } catch (e: any) {
    lastCrawlError = `exception: ${e?.message || 'unknown'}`
    console.error(`Failed to crawl: ${url}`, e)
    return null
  }
}

// GET — Called by Vercel cron
export async function GET(req: NextRequest) {
  return handleAutoNews(req)
}

// POST — Called manually or by local script
export async function POST(req: NextRequest) {
  return handleAutoNews(req)
}

async function handleAutoNews(req: NextRequest) {
  if (!isAuthorized(req)) {
    const hasEnvSecret = !!process.env.CRON_SECRET
    const gotHeader = req.headers.get('authorization') || 'none'
    const gotParam = req.nextUrl.searchParams.get('secret') ? 'present' : 'missing'
    return NextResponse.json({
      error: 'Unauthorized',
      debug: { env_secret_set: hasEnvSecret, auth_header: gotHeader.slice(0, 15) + '...', query_param: gotParam }
    }, { status: 401 })
  }

  const count = parseInt(req.nextUrl.searchParams.get('count') || '3')
  const manualUrl = req.nextUrl.searchParams.get('url')
  const force = req.nextUrl.searchParams.get('force') === 'true'
  const results: any[] = []

  try {
    // 1. Fetch articles — manual URL or CNBC RSS
    const articleUrls = manualUrl ? [manualUrl] : await fetchCNBCArticles(count)
    if (articleUrls.length === 0) {
      return NextResponse.json({ error: 'No CNBC articles found' }, { status: 404 })
    }

    const errors: string[] = []

    // 2. Process each article
    for (const url of articleUrls) {
      try {
        // Check if already processed (skip duplicate check if force=true)
        if (!force) {
          const { data: existing } = await supabase
            .from('news_image_posts')
            .select('id')
            .eq('source_url', url)
            .maybeSingle()

          if (existing) {
            console.log(`Skipping duplicate: ${url}`)
            errors.push(`duplicate: ${url}`)
            continue
          }
        }

        // Crawl and extract
        const rawData = await crawlArticle(url)
        if (!rawData) {
          console.log(`Failed to crawl: ${url}`)
          errors.push(`crawl failed [${getLastCrawlError()}]: ${url}`)
          continue
        }

        // Clean placeholder values and validate quality
        const data = cleanExtractedData(rawData)
        const quality = validateQuality(data)
        if (!quality.ok) {
          console.log(`Low quality article skipped: ${url} - ${quality.reason}`)
          errors.push(`low quality [${quality.reason}]: ${url}`)
          continue
        }

        // Pick template based on what data we actually have (not just category)
        const template = pickTemplate(data.category, data)

        // Generate HTML for the local processor to screenshot
        const html = renderNewsImage(template, {
          headline: data.headline,
          source: data.source || 'CNBC',
          category: data.category,
          date: data.date,
          key_points: data.key_points,
          quote: data.quote,
          market_impact: data.market_impact,
          big_stat: data.big_stat,
          timeline_events: data.timeline_events,
          context_points: data.context_points,
        })

        // Wrap in full HTML page with fonts
        const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
</head><body style="width:420px;height:525px;overflow:hidden;">
${html}
</body></html>`

        // Save to Supabase with status='queued'
        const { data: post, error } = await supabase
          .from('news_image_posts')
          .insert({
            template_type: template,
            headline: data.headline,
            source: data.source || 'CNBC',
            source_url: url,
            category: data.category || 'MARKETS',
            date: data.date,
            key_points: data.key_points || [],
            quote: data.quote || {},
            market_impact: data.market_impact || [],
            big_stat: data.big_stat || {},
            timeline_events: data.timeline_events || [],
            context_points: data.context_points || [],
            status: 'queued',
          })
          .select()
          .single()

        if (error) {
          console.error(`DB insert error: ${error.message}`)
          errors.push(`db insert: ${error.message}`)
          continue
        }

        results.push({
          id: post.id,
          headline: data.headline,
          template,
          url,
          html_length: fullHtml.length,
        })
      } catch (e: any) {
        console.error(`Error processing ${url}:`, e)
        errors.push(`exception: ${e?.message || 'unknown'} for ${url}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      articles: results,
      urls_attempted: articleUrls.length,
      errors: errors.length > 0 ? errors : undefined,
      env: {
        groq: !!process.env.GROQ_API_KEY,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
