import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called by the local Python script
// Auth via CRON_SECRET (same as other automation endpoints)

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

// GET — Fetch next approved video to process
// ?type=reel or ?type=youtube to filter by content type
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type')

  let query = supabase
    .from('video_queue')
    .select('*')
    .eq('status', 'approved')

  if (type === 'reel') {
    query = query.in('content_type', ['reel', 'video'])
  } else if (type === 'youtube') {
    query = query.eq('content_type', 'youtube')
  }

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ video: null, message: 'No approved videos' })
  }

  // Mark as "processing" so it's not picked up again
  await supabase
    .from('video_queue')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', data.id)

  return NextResponse.json({ video: data })
}
