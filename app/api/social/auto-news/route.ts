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
function pickTemplate(category: string): 'a' | 'c' | 'd' | 'e' | 'f' {
  const cat = (category || '').toUpperCase()
  if (cat.includes('BREAKING') || cat.includes('POLITIC') || cat.includes('GEOPOL')) return 'a'
  if (cat.includes('MARKET') || cat.includes('STOCK') || cat.includes('CRYPTO')) return 'd'
  if (cat.includes('ENERGY') || cat.includes('COMMODIT') || cat.includes('OIL')) return 'f'
  if (cat.includes('ECONOMY') || cat.includes('FED') || cat.includes('RATE')) return 'c'
  // Random pick for others
  const templates: Array<'a' | 'c' | 'd' | 'e' | 'f'> = ['a', 'c', 'd', 'e', 'f']
  return templates[Math.floor(Math.random() * templates.length)]
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

      // Extract article URLs from RSS
      const linkMatches = xml.matchAll(/<link>(https:\/\/www\.cnbc\.com\/[^<]+)<\/link>/g)
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

async function crawlArticle(url: string): Promise<any | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null

  try {
    // Fetch article
    const articleRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!articleRes.ok) return null

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

    if (textContent.length < 100) return null

    // AI extraction via Groq
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a news article analyzer. Extract structured data and return ONLY valid JSON:
{
  "headline": "Short punchy headline under 80 chars",
  "source": "CNBC",
  "category": "One of: MARKETS, GEOPOLITICS, ECONOMY, CRYPTO, TECHNOLOGY, ENERGY, COMMODITIES, HEALTHCARE, POLITICS",
  "date": "Month Day, Year",
  "key_points": ["4-5 key bullet points"],
  "quote": {"text": "Most impactful quote", "attribution": "Who said it"},
  "market_impact": [{"icon": "emoji", "name": "Asset", "change": "+X.X%", "price": "$XX.XX", "direction": "up or down"}],
  "big_stat": {"number": "Striking number", "label": "What it represents", "color": "#EF4444 for negative, #4ADE80 for positive"},
  "timeline_events": [{"time": "Time", "title": "Event", "description": "Brief desc", "color": "#EF4444/#FBBF24/#4ADE80"}],
  "context_points": ["3-4 context points"]
}
Use emojis: 🛢️ oil, 💵 USD, 🌍 global, 📈📉 stocks, ₿ crypto. Return ONLY JSON.`
          },
          { role: 'user', content: `Extract from:\n\nURL: ${url}\n\n${textContent}` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!groqRes.ok) return null
    const groqData = await groqRes.json()
    const aiResponse = groqData.choices?.[0]?.message?.content || ''
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch (e) {
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
  const results: any[] = []

  try {
    // 1. Fetch articles — manual URL or CNBC RSS
    const articleUrls = manualUrl ? [manualUrl] : await fetchCNBCArticles(count)
    if (articleUrls.length === 0) {
      return NextResponse.json({ error: 'No CNBC articles found' }, { status: 404 })
    }

    // 2. Process each article
    for (const url of articleUrls) {
      try {
        // Check if already processed (avoid duplicates)
        const { data: existing } = await supabase
          .from('news_image_posts')
          .select('id')
          .eq('source_url', url)
          .maybeSingle()

        if (existing) {
          console.log(`Skipping duplicate: ${url}`)
          continue
        }

        // Crawl and extract
        const data = await crawlArticle(url)
        if (!data) {
          console.log(`Failed to crawl: ${url}`)
          continue
        }

        // Pick template
        const template = pickTemplate(data.category)

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
          continue
        }

        results.push({
          id: post.id,
          headline: data.headline,
          template,
          url,
          html_length: fullHtml.length,
        })
      } catch (e) {
        console.error(`Error processing ${url}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      articles: results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
