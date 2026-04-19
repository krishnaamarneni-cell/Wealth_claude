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

  // Use Groq (free) for social post data extraction
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
    const systemPrompt = `You are a financial news article analyzer. Extract structured data and return ONLY valid JSON (no markdown):
{
  "headline": "Short punchy headline under 80 chars",
  "source": "CNBC",
  "category": "One of: MARKETS, GEOPOLITICS, ECONOMY, CRYPTO, TECHNOLOGY, ENERGY, COMMODITIES, HEALTHCARE, POLITICS, REAL_ESTATE",
  "date": "Month Day, Year",
  "key_points": ["4-5 specific bullet points with real numbers and facts"],
  "quote": {"text": "Most impactful direct quote", "attribution": "Who said it"},
  "market_impact": [{"icon": "emoji", "name": "Asset", "change": "+X.X%", "direction": "up or down"}],
  "big_stat": {"number": "Striking number like '$5.28B' or '8.5%'", "label": "What it represents", "color": "#EF4444 negative, #4ADE80 positive"},
  "timeline_events": [{"time": "Time", "title": "Event", "description": "Brief desc", "color": "#EF4444/#FBBF24/#4ADE80"}],
  "context_points": ["3-4 context points"]
}
Use emojis: 🛢️ oil, 💵 USD, 🌍 global, 📈📉 stocks, ₿ crypto. NEVER use placeholders like XX.XX or X.X% — omit fields instead. Return ONLY JSON.`

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
