import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Use service role client for auth admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all stats in parallel
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

    // Get user growth data - monthly signups from profiles table (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: profileDates } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group by month
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

    // Get recent blog posts
    const { data: recentBlogs } = await supabase
      .from('blog_posts')
      .select('id, title, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent subscribers
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
