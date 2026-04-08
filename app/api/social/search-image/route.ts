import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  if (!PIXABAY_API_KEY) {
    return NextResponse.json({ error: 'PIXABAY_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { query, page = 1 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: query,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: 'true',
      per_page: '12',
      page: String(page),
    })

    const res = await fetch(`https://pixabay.com/api/?${params}`)

    if (!res.ok) {
      return NextResponse.json({ error: `Pixabay API error: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()

    const images = data.hits.map((hit: any) => ({
      id: hit.id,
      preview: hit.webformatURL,
      full: hit.largeImageURL,
      width: hit.imageWidth,
      height: hit.imageHeight,
      tags: hit.tags,
      user: hit.user,
    }))

    return NextResponse.json({
      images,
      total: data.totalHits,
      page,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to search images' }, { status: 500 })
  }
}
