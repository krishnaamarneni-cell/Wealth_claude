import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Use service role client for auth.users count
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all stats in parallel
    const [
      subscribersResult,
      blogPostsResult,
      leadsResult,
      usersResult,
      videoQueueResult,
      videoPostedResult,
    ] = await Promise.all([
      supabase.from('subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      serviceSupabase.auth.admin.listUsers({ perPage: 1, page: 1 }),
      supabase.from('video_queue').select('*', { count: 'exact', head: true }),
      supabase.from('video_queue').select('*', { count: 'exact', head: true }).eq('status', 'posted'),
    ])

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
        users: (usersResult.data?.users?.length !== undefined)
          ? (usersResult as { data: { total?: number } }).data?.total || 0
          : 0,
        videosInQueue: videoQueueResult.count || 0,
        videosPosted: videoPostedResult.count || 0,
      },
      recentBlogs: recentBlogs || [],
      recentSubscribers: recentSubscribers || [],
    })
  } catch (error) {
    console.error('[admin-overview] error:', error)
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
