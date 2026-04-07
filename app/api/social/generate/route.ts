import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })
  }

  try {
    const { type, prompt } = await request.json()

    const systemPrompt = type === 'reel_caption'
      ? `You are a social media expert writing Instagram reel captions. Write engaging, hook-driven captions (150-200 words). Include relevant hashtags (8-12). Use line breaks for readability. Start with a strong hook. End with a CTA.`
      : `You are a social media expert writing Instagram post captions. Write engaging captions (100-150 words). Include relevant hashtags (5-8). Be concise and punchy.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write a caption about: ${prompt}` },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error?.message || 'Groq API error' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''

    return NextResponse.json({ text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate' }, { status: 500 })
  }
}
