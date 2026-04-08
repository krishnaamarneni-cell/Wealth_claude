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

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
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

    // Step 3: Use Groq to extract structured data
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
            content: `You are a news article analyzer. Extract structured data from the article text and return ONLY a valid JSON object with these fields:

{
  "headline": "The main headline (short, punchy, under 80 chars)",
  "source": "News source name (e.g., CNBC, Reuters)",
  "category": "One of: MARKETS, GEOPOLITICS, ECONOMY, CRYPTO, TECHNOLOGY, ENERGY, COMMODITIES, HEALTHCARE, POLITICS, REAL_ESTATE",
  "date": "Publication date in format: Month Day, Year",
  "key_points": ["4-5 key bullet points summarizing the article"],
  "quote": {"text": "Most impactful quote from the article", "attribution": "Who said it"},
  "market_impact": [
    {"icon": "emoji", "name": "Asset name", "change": "+X.X% or -X.X%", "price": "$XX.XX if mentioned", "direction": "up or down"}
  ],
  "big_stat": {"number": "The most striking number/stat from the article", "label": "What it represents", "color": "#EF4444 for negative, #4ADE80 for positive"},
  "timeline_events": [
    {"time": "Time", "title": "Event title", "description": "Brief description", "color": "#EF4444 for bad, #FBBF24 for neutral, #4ADE80 for good"}
  ],
  "context_points": ["3-4 important context points for understanding the story"]
}

For market_impact, use relevant emojis: 🛢️ for oil, 💵 for USD, 🌍 for global markets, 📈📉 for stocks, ₿ for crypto, 🏠 for real estate, 💊 for pharma.
If timeline events aren't relevant to the article type, still generate 3-5 chronological events from the article.
Return ONLY the JSON, no markdown, no explanation.`
          },
          {
            role: 'user',
            content: `Extract structured data from this news article:\n\nURL: ${url}\n\n${textContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      return NextResponse.json({ error: `Groq API error: ${errText}` }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const aiResponse = groqData.choices?.[0]?.message?.content || ''

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
