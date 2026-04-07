import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerSideClient(cookieStore)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
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
  try {
    const supabase = await getSupabase()
    const body = await request.json()

    const { data, error } = await supabase
      .from('video_queue')
      .insert({
        title: body.title || null,
        source_url: body.source_url || body.sourceUrl,
        source_type: body.source_type || body.content_type || 'instagram',
        platform: body.platform || 'instagram',
        status: body.status || 'pending',
        text_content: body.text_content || null,
        content_type: body.content_type || 'reel',
        platforms: body.platforms || ['instagram'],
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
