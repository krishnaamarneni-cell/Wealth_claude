import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = auth.supabase
      .from('video_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[video-queue] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[video-queue] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    // Determine source type from URL or explicit field
    let sourceType = body.source_type || 'instagram'
    const url = body.source_url || body.sourceUrl || ''
    if (url.includes('youtube.com') || url.includes('youtu.be')) sourceType = 'youtube'
    else if (url.includes('c-span.org')) sourceType = 'cspan'
    else if (url.includes('instagram.com')) sourceType = 'instagram'

    const { data, error } = await auth.supabase
      .from('video_queue')
      .insert({
        title: body.title || null,
        source_url: url || null,
        source_type: sourceType,
        platform: body.platform || (sourceType === 'youtube' ? 'youtube' : 'instagram'),
        status: body.status || 'pending',
        text_content: body.text_content || null,
        content_type: body.content_type || 'reel',
        platforms: body.platforms || [sourceType === 'youtube' ? 'youtube' : 'instagram'],
        scheduled_for: body.scheduled_for || null,
        media_url: body.media_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[video-queue] POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[video-queue] POST error:', error)
    return NextResponse.json({ error: 'Failed to add to queue' }, { status: 500 })
  }
}
