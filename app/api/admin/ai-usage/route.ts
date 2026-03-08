/**
 * Phase 7 — Step 25: Admin AI Usage API
 * 
 * Returns aggregated AI usage stats for the admin dashboard.
 * Only accessible by admin users (checked against admin_users table).
 * 
 * GET /api/admin/ai-usage              → Usage summary + recent logs
 * GET /api/admin/ai-usage?period=7d    → Last 7 days
 * GET /api/admin/ai-usage?period=30d   → Last 30 days
 * 
 * Place this file at: app/api/admin/ai-usage/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin via email env var
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const isAdmin = adminEmail ? user.email === adminEmail : false

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
    }

    // Parse period filter
    const period = req.nextUrl.searchParams.get('period') || '7d'
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch all logs for the period
    const { data: logs, error: logsError } = await supabase
      .from('ai_chat_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('[Admin] Logs fetch error:', logsError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    const allLogs = logs || []

    // ── Aggregate stats ──────────────────────────────────────────────────

    const totalRequests = allLogs.length
    const successCount = allLogs.filter((l) => l.success).length
    const failCount = totalRequests - successCount
    const avgResponseTime = totalRequests > 0
      ? Math.round(allLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / totalRequests)
      : 0

    // By category
    const byCategory: Record<string, number> = {}
    allLogs.forEach((l) => {
      byCategory[l.category] = (byCategory[l.category] || 0) + 1
    })

    // By route (which LLM handled it)
    const byRoute: Record<string, number> = {}
    allLogs.forEach((l) => {
      byRoute[l.route] = (byRoute[l.route] || 0) + 1
    })

    // By day (for chart)
    const byDay: Record<string, number> = {}
    allLogs.forEach((l) => {
      const day = l.created_at.substring(0, 10) // YYYY-MM-DD
      byDay[day] = (byDay[day] || 0) + 1
    })

    // Unique users
    const uniqueUsers = new Set(allLogs.map((l) => l.user_id)).size

    // Top questions (most common first words)
    const questionCounts: Record<string, number> = {}
    allLogs.forEach((l) => {
      const key = l.message.substring(0, 80).toLowerCase()
      questionCounts[key] = (questionCounts[key] || 0) + 1
    })
    const topQuestions = Object.entries(questionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }))

    // Estimated cost (rough estimates per model)
    const costPerRequest: Record<string, number> = {
      'groq': 0.0003,              // ~free tier
      'perplexity': 0.005,         // ~$5 per 1000 requests
      'perplexity+groq': 0.0053,
      'mistral-fallback': 0.002,
      'market-fallback': 0.0003,
    }
    const estimatedCost = allLogs.reduce((sum, l) => {
      return sum + (costPerRequest[l.route] || 0.001)
    }, 0)

    // Recent logs (last 50)
    const recentLogs = allLogs.slice(0, 50).map((l) => ({
      id: l.id,
      message: l.message.substring(0, 100),
      category: l.category,
      route: l.route,
      model: l.model,
      responseTimeMs: l.response_time_ms,
      success: l.success,
      errorMessage: l.error_message,
      createdAt: l.created_at,
    }))

    return NextResponse.json({
      success: true,
      period: `${days}d`,
      summary: {
        totalRequests,
        successCount,
        failCount,
        successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0,
        avgResponseTimeMs: avgResponseTime,
        uniqueUsers,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
      },
      byCategory,
      byRoute,
      byDay,
      topQuestions,
      recentLogs,
    })
  } catch (error) {
    console.error('[Admin] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
