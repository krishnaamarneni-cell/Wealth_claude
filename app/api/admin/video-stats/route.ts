import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { count: pendingCount } = await supabase
      .from('video_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: approvedCount } = await supabase
      .from('video_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    const today = new Date().toISOString().split('T')[0]
    const { count: postedTodayCount } = await supabase
      .from('video_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'posted')
      .gte('created_at', `${today}T00:00:00`)

    const { count: totalPostedCount } = await supabase
      .from('video_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'posted')

    return NextResponse.json({
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      postedToday: postedTodayCount || 0,
      totalPosted: totalPostedCount || 0,
    })
  } catch (error) {
    console.error('[video-stats] error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
