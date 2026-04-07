import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const supabase = auth.supabase

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
