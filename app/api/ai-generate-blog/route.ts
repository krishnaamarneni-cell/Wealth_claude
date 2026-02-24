import { NextRequest, NextResponse } from 'next/server'

interface GenerateBlogRequest {
  topic: string
}

interface GenerateBlogResponse {
  title: string
  content: string
  excerpt: string
  tags: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateBlogRequest = await request.json()
    const { topic } = body

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `Generate a finance/investment blog post about: "${topic}"

Please provide the response in JSON format with these fields:
{
  "title": "SEO-optimized title (50-60 chars)",
  "content": "800-1000 word article in HTML format (use <p>, <h2>, <strong>, <em> tags)",
  "excerpt": "50-70 word summary",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Make sure:
- Title is catchy and SEO-friendly
- Content is informative and well-structured with HTML formatting
- Excerpt summarizes the main point
- Tags are relevant for finance/investment topics
- Valid JSON output only, no markdown code blocks`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] Perplexity API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate blog post' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Invalid JSON format in response' },
        { status: 500 }
      )
    }

    const blogData: GenerateBlogResponse = JSON.parse(jsonMatch[0])

    return NextResponse.json(blogData)
  } catch (error) {
    console.error('[v0] AI blog generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    )
  }
}
