import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'PERPLEXITY_API_KEY not set' }, { status: 500 })
    }

    // ─── Prompt ───────────────────────────────────────────────────────────
    const prompt = `You are a finance blog writer. Generate a blog post about: "${topic}"

Respond with ONLY a valid JSON object — no markdown, no code blocks, no explanation. Just the raw JSON:

{
  "title": "SEO-optimized title, 50-60 characters",
  "excerpt": "2-3 sentence summary, around 50 words",
  "content": "800-1000 word article using HTML tags: <h2>, <p>, <strong>, <ul>, <li>. No <html>, <body>, or <head> tags.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "image_query": "3-4 word Unsplash search query for a relevant finance/business photo"
}`

    let rawContent = ''
    let usedModel = 'unknown'

    // ── Try Gemini models first (free) ──────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY
    const geminiModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ]

    if (geminiKey) {
      for (const model of geminiModels) {
        if (rawContent) break
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
              rawContent = candidate
              usedModel = model
              console.log(`[blog-gen] Used ${model} ✅`)
            }
          } else {
            console.warn(`[blog-gen] ${model} failed (${geminiRes.status}), trying next...`)
          }
        } catch (e) {
          console.warn(`[blog-gen] ${model} threw error, trying next...`, e)
        }
      }
    }

    // ── Fallback to Perplexity sonar-pro ────────────────────────────────
    if (!rawContent) {
      console.warn('[blog-gen] All Gemini models failed, falling back to Perplexity sonar-pro...')
      const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      })
      if (!perplexityRes.ok) {
        const err = await perplexityRes.text()
        console.error('[blog-gen] All models failed:', err)
        return NextResponse.json({ error: 'All AI models failed' }, { status: 502 })
      }
      const perplexityData = await perplexityRes.json()
      rawContent = perplexityData.choices?.[0]?.message?.content ?? ''
      usedModel = 'perplexity-sonar-pro'
      console.log('[blog-gen] Used Perplexity sonar-pro as fallback ✅')
    }

    // ─── Parse JSON ───────────────────────────────────────────────────────
    let blogData: {
      title: string
      excerpt: string
      content: string
      tags: string[]
      image_query: string
    }

    try {
      const cleaned = rawContent
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON object found')
      blogData = JSON.parse(match[0])
    } catch (e) {
      console.error('[blog-gen] JSON parse failed:', rawContent)
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 })
    }

    // ─── Fetch Unsplash image ─────────────────────────────────────────────
    let image_url = ''
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

    if (unsplashKey && blogData.image_query) {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(blogData.image_query)}&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } }
        )
        if (unsplashRes.ok) {
          const img = await unsplashRes.json()
          image_url = img.urls?.regular ?? ''
        }
      } catch (e) {
        console.warn('[blog-gen] Unsplash fetch failed, continuing without image')
      }
    }

    return NextResponse.json({
      title: blogData.title,
      excerpt: blogData.excerpt,
      content: blogData.content,
      tags: Array.isArray(blogData.tags) ? blogData.tags : [],
      image_url,
      ai_model: usedModel,
    })

  } catch (error) {
    console.error('[blog-gen] Unexpected error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
