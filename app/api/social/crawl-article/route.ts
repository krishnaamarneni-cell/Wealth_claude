import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Crawl a news article URL and extract structured data using Groq AI.
 * Supports CNBC and other major news sites.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { url } = await request.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  // Use Claude (Anthropic) for social post data extraction - higher quality than Groq
  const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!claudeKey) {
    return NextResponse.json({ error: 'CLAUDE_API_KEY not configured' }, { status: 500 })
  }

  try {
    // Step 1: Fetch the article HTML
    const articleRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!articleRes.ok) {
      return NextResponse.json({ error: `Failed to fetch article: ${articleRes.status}` }, { status: 400 })
    }

    const html = await articleRes.text()

    // Step 2: Extract text content (strip HTML tags, keep meaningful text)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000) // Limit for Groq context

    if (textContent.length < 100) {
      return NextResponse.json({ error: 'Could not extract article content. The site may block automated access.' }, { status: 400 })
    }

    // Step 3: Use Claude to extract structured data (higher quality than Groq)
    const systemPrompt = `You are a financial news article analyzer for a social media automation system. Your job is to extract rich, accurate, structured data from news articles for Instagram/LinkedIn/X posts.

Return ONLY a valid JSON object with these fields (no markdown, no explanation):

{
  "headline": "Main headline - short, punchy, under 80 chars. Make it compelling.",
  "source": "News source name (CNBC, Reuters, etc.)",
  "category": "One of: MARKETS, GEOPOLITICS, ECONOMY, CRYPTO, TECHNOLOGY, ENERGY, COMMODITIES, HEALTHCARE, POLITICS, REAL_ESTATE",
  "date": "Publication date as: Month Day, Year",
  "key_points": ["4-5 specific, data-rich bullet points. Each must be a full sentence with concrete facts, numbers, or names. NO vague statements."],
  "quote": {"text": "Most impactful direct quote from the article", "attribution": "Speaker name + title"},
  "market_impact": [
    {"icon": "emoji", "name": "Asset name", "change": "+X.X% or -X.X% (real number from article)", "price": "$XX.XX if actually mentioned, else OMIT this field", "direction": "up or down"}
  ],
  "big_stat": {"number": "Most striking specific number from article (e.g. '$5.28 billion', '8.56%', '2,400 jobs')", "label": "What it represents", "color": "#EF4444 for negative, #4ADE80 for positive, #FBBF24 for neutral"},
  "timeline_events": [
    {"time": "Time/date reference (e.g. 'Last week', 'March 15', '9:00 AM ET')", "title": "Short event title", "description": "One sentence description", "color": "#EF4444 bad, #FBBF24 neutral, #4ADE80 good"}
  ],
  "context_points": ["3-4 context points that explain WHY this matters for investors"]
}

CRITICAL RULES:
- NEVER use placeholder values like "XX.XX", "X.X%", "$XXX", "N/A", or similar. If data is not in the article, OMIT the field entirely.
- Key points must be SPECIFIC with real numbers, company names, and facts from the article.
- Market impact entries MUST have real percentage changes from the article text — not made up.
- If the article doesn't mention a percentage for an asset, omit that asset.
- Use relevant emojis: 🛢️ oil, 💵 USD, 🌍 global, 📈📉 stocks, ₿ crypto, 🏠 real estate, 💊 pharma, 🇺🇸 US, 🇨🇳 China.
- Timeline events should be extracted from the article's chronology - don't invent them.
- Big stat should be a number that actually appears in the article.
- Keep content concise and scannable for mobile viewing.`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Extract structured data from this news article:\n\nURL: ${url}\n\n${textContent}`
          }
        ],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      return NextResponse.json({ error: `Claude API error: ${errText}` }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const aiResponse = claudeData.content?.[0]?.text || ''

    // Parse the JSON response
    let extracted
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: aiResponse }, { status: 500 })
    }

    return NextResponse.json({ data: extracted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to crawl article' }, { status: 500 })
  }
}
