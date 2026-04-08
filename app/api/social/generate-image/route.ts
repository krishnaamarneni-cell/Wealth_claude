import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const FAL_API_KEY = process.env.FAL_API_KEY || process.env.FAL_AI_API_KEY

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  if (!FAL_API_KEY) {
    return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      return NextResponse.json({ error: `FAL API error: ${res.status} ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const imageUrl = data?.images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }

    return NextResponse.json({ image_url: imageUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate image' }, { status: 500 })
  }
}
