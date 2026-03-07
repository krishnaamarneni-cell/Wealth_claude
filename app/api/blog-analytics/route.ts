import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

const POST_TYPES = ['premarket', 'market-analysis', 'aftermarket', 'geopolitical', 'education'] as const

interface AnalyticsResult {
  post_type: string
  total_views: number
  post_count: number
  avg_views_per_post: number
  performance_score: number
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Get posts from last 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('post_type, view_count')
      .eq('published', true)
      .gte('created_at', fourteenDaysAgo)
      .not('post_type', 'is', null)

    if (error) throw error

    // Aggregate by post_type
    const aggregated: Record<string, { views: number; count: number }> = {}
    
    for (const type of POST_TYPES) {
      aggregated[type] = { views: 0, count: 0 }
    }

    for (const post of posts ?? []) {
      const type = post.post_type as string
      if (aggregated[type]) {
        aggregated[type].views += post.view_count ?? 0
        aggregated[type].count += 1
      }
    }

    // Calculate normalized scores
    const results: AnalyticsResult[] = []
    let maxAvg = 0

    for (const [type, data] of Object.entries(aggregated)) {
      const avg = data.count > 0 ? data.views / data.count : 0
      if (avg > maxAvg) maxAvg = avg
      
      results.push({
        post_type: type,
        total_views: data.views,
        post_count: data.count,
        avg_views_per_post: Math.round(avg * 100) / 100,
        performance_score: 0, // Will calculate after
      })
    }

    // Normalize scores (0-100 scale, relative to best performer)
    for (const result of results) {
      result.performance_score = maxAvg > 0 
        ? Math.round((result.avg_views_per_post / maxAvg) * 100) 
        : 0
    }

    // Sort by performance
    results.sort((a, b) => b.performance_score - a.performance_score)

    // Calculate recommended distribution for 5 daily posts
    // Minimum: 1 of each core type (premarket, market-analysis, aftermarket) = 3
    // Bonus slots: 2 — allocated to top performers
    const minimums: Record<string, number> = {
      'premarket': 1,
      'market-analysis': 1,
      'aftermarket': 1,
      'geopolitical': 0,
      'education': 0,
    }

    const bonusSlots = 2
    const topPerformers = results.filter(r => r.performance_score >= 50).slice(0, 2)
    
    const distribution: Record<string, number> = { ...minimums }
    
    if (topPerformers.length > 0) {
      // Give bonus slots to top performers proportionally
      const totalScore = topPerformers.reduce((sum, r) => sum + r.performance_score, 0)
      let slotsAssigned = 0
      
      for (const performer of topPerformers) {
        if (slotsAssigned >= bonusSlots) break
        const share = Math.round((performer.performance_score / totalScore) * bonusSlots)
        const slots = Math.min(share, bonusSlots - slotsAssigned)
        distribution[performer.post_type] = (distribution[performer.post_type] || 0) + slots
        slotsAssigned += slots
      }
      
      // If rounding left a slot, give to #1
      if (slotsAssigned < bonusSlots) {
        distribution[topPerformers[0].post_type] += bonusSlots - slotsAssigned
      }
    } else {
      // No clear winner — default extra to market-analysis
      distribution['market-analysis'] += bonusSlots
    }

    return NextResponse.json({
      success: true,
      period_days: 14,
      analytics: results,
      recommended_distribution: distribution,
      total_posts_analyzed: posts?.length ?? 0,
    })

  } catch (err: any) {
    console.error('[blog-analytics] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
