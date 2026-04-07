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
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let query = supabase
      .from('video_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`)
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[video-activity] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[video-activity] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const body = await request.json()

    const { data, error } = await supabase
      .from('video_activity_log')
      .insert({
        video_id: body.video_id || null,
        title: body.title || null,
        status: body.status,
        platform: body.platform || null,
        url: body.url || null,
        views: body.views || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[video-activity] POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[video-activity] POST error:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}
