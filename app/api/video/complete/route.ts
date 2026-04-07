import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

// POST — Python script reports completion with Cloudinary URL and caption
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { video_id, cloudinary_url, caption, status, error: errorMsg } = await req.json()

    if (!video_id) {
      return NextResponse.json({ error: 'video_id required' }, { status: 400 })
    }

    if (status === 'error') {
      // Processing failed
      await supabase
        .from('video_queue')
        .update({
          status: 'pending', // reset to pending so admin can retry
          updated_at: new Date().toISOString(),
        })
        .eq('id', video_id)

      await supabase.from('video_activity_log').insert({
        video_id,
        status: 'error',
        title: errorMsg || 'Processing failed',
      })

      return NextResponse.json({ success: false, message: 'Error logged, reset to pending' })
    }

    // Success — update with Cloudinary URL and caption
    const updateData: Record<string, any> = {
      status: 'posted',
      posted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (cloudinary_url) updateData.media_url = cloudinary_url
    if (caption) updateData.text_content = caption

    const { error } = await supabase
      .from('video_queue')
      .update(updateData)
      .eq('id', video_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    const { data: video } = await supabase
      .from('video_queue')
      .select('title, platform')
      .eq('id', video_id)
      .single()

    await supabase.from('video_activity_log').insert({
      video_id,
      title: video?.title || 'Reel posted',
      status: 'posted',
      platform: video?.platform || 'instagram',
      url: cloudinary_url,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 })
  }
}
