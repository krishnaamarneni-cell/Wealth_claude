import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role — reads all posts regardless of auth
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()

    // Get view counts grouped by post_type for the last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('post_type, view_count')
      .eq('published', true)
      .gte('published_at', since)
      .not('post_type', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggregate view counts by post_type
    const totals: Record<string, { total_views: number; post_count: number; avg_views: number }> = {}

    for (const post of posts ?? []) {
      const type = post.post_type ?? 'unknown'
      if (!totals[type]) totals[type] = { total_views: 0, post_count: 0, avg_views: 0 }
      totals[type].total_views += post.view_count ?? 0
      totals[type].post_count += 1
    }

    // Calculate averages
    for (const type of Object.keys(totals)) {
      totals[type].avg_views = totals[type].post_count > 0
        ? Math.round(totals[type].total_views / totals[type].post_count)
        : 0
    }

    // Sort by avg_views descending
    const ranked = Object.entries(totals)
      .map(([post_type, stats]) => ({ post_type, ...stats }))
      .sort((a, b) => b.avg_views - a.avg_views)

    // Self-learning recommendation:
    // Base: each type gets 1 post/day minimum
    // Bonus: top performer gets +2 extra posts if it outperforms the average by 3x
    const allTypes = ['premarket', 'market-analysis', 'aftermarket', 'geopolitical', 'education']
    const overallAvg = ranked.length > 0
      ? ranked.reduce((sum, r) => sum + r.avg_views, 0) / ranked.length
      : 0

    const recommendations: Record<string, number> = {}
    for (const type of allTypes) {
      recommendations[type] = 1 // baseline
    }

    if (ranked.length > 0 && overallAvg > 0) {
      const topType = ranked[0].post_type
      if (ranked[0].avg_views >= overallAvg * 3) {
        recommendations[topType] = Math.min((recommendations[topType] ?? 1) + 2, 5)
      } else if (ranked[0].avg_views >= overallAvg * 2) {
        recommendations[topType] = Math.min((recommendations[topType] ?? 1) + 1, 3)
      }
    }

    return NextResponse.json({
      success: true,
      period_days: 30,
      overall_avg_views: Math.round(overallAvg),
      by_type: ranked,
      recommendations,
      top_performer: ranked[0]?.post_type ?? null,
    })
  } catch (err: any) {
    console.error('[blog-analytics] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
