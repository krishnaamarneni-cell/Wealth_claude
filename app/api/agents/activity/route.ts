// ============================================
// API Routes: Activity Logs
// /api/agents/activity/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================
// GET /api/agents/activity
// Fetch activity logs with filters
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const actionType = searchParams.get('action_type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('activity_logs')
      .select('*, agents(name)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        total: count,
      },
    });

  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/agents/activity/stats
// Fetch activity statistics
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { period = '7d' } = body;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get activity counts by type
    const { data: activityCounts } = await supabase
      .from('activity_logs')
      .select('action_type, status')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Get post counts by status
    const { data: postCounts } = await supabase
      .from('posts')
      .select('status')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Get agent stats
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, status, last_post_at')
      .eq('user_id', user.id);

    // Calculate stats
    const stats = {
      period,
      activities: {
        total: activityCounts?.length || 0,
        success: activityCounts?.filter(a => a.status === 'success').length || 0,
        failed: activityCounts?.filter(a => a.status === 'failed').length || 0,
        byType: {} as Record<string, number>,
      },
      posts: {
        total: postCounts?.length || 0,
        draft: postCounts?.filter(p => p.status === 'draft').length || 0,
        scheduled: postCounts?.filter(p => p.status === 'scheduled').length || 0,
        posted: postCounts?.filter(p => p.status === 'posted').length || 0,
        failed: postCounts?.filter(p => p.status === 'failed').length || 0,
      },
      agents: {
        total: agents?.length || 0,
        active: agents?.filter(a => a.status === 'active').length || 0,
        paused: agents?.filter(a => a.status === 'paused').length || 0,
      },
    };

    // Count activities by type
    for (const activity of activityCounts || []) {
      stats.activities.byType[activity.action_type] =
        (stats.activities.byType[activity.action_type] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Activity stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}