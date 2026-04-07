import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const ALLOWED_VIDEO_FIELDS = new Set([
  'title', 'source_url', 'source_type', 'source_title', 'platform', 'status',
  'text_content', 'content_type', 'platforms', 'scheduled_for',
  'media_url', 'posted_at', 'processed_at', 'approved_at',
  'processed_video_url', 'video_type', 'duration_seconds',
  'ai_title', 'ai_description', 'ai_tags', 'ai_hook',
  'youtube_video_id', 'error_message', 'retry_count',
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_VIDEO_FIELDS.has(key)) updateData[key] = value
    }

    if (body.status === 'posted') {
      updateData.posted_at = new Date().toISOString()
    }

    const { data, error } = await auth.supabase
      .from('video_queue')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[video-queue] PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[video-queue] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { id } = await params

    const { error } = await auth.supabase
      .from('video_queue')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[video-queue] DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[video-queue] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
