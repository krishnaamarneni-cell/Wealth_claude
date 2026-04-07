import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const supabase = auth.supabase

    const [
      subscribersResult,
      blogPostsResult,
      leadsResult,
      videoQueueResult,
      videoPostedResult,
      profilesResult,
    ] = await Promise.all([
      supabase.from('subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('video_queue').select('*', { count: 'exact', head: true }),
      supabase.from('video_queue').select('*', { count: 'exact', head: true }).eq('status', 'posted'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: profileDates } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    const monthlyGrowth: { month: string; users: number }[] = []
    const monthMap = new Map<string, number>()

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthMap.set(key, 0)
      monthlyGrowth.push({ month: label, users: 0 })
    }

    if (profileDates) {
      for (const row of profileDates) {
        const d = new Date(row.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const idx = [...monthMap.keys()].indexOf(key)
        if (idx >= 0) {
          monthlyGrowth[idx].users += 1
        }
      }
    }

    const { data: recentBlogs } = await supabase
      .from('blog_posts')
      .select('id, title, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentSubscribers } = await supabase
      .from('subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      stats: {
        subscribers: subscribersResult.count || 0,
        blogPosts: blogPostsResult.count || 0,
        leads: leadsResult.count || 0,
        users: profilesResult.count || 0,
        videosInQueue: videoQueueResult.count || 0,
        videosPosted: videoPostedResult.count || 0,
      },
      userGrowth: monthlyGrowth,
      recentBlogs: recentBlogs || [],
      recentSubscribers: recentSubscribers || [],
    })
  } catch (error) {
    console.error('[admin-overview] error:', error)
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
