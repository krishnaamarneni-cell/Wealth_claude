// =============================================================================
// API Route: /api/admin/assessments
// Fetches assessments with search, filtering, and stats for admin dashboard
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// Types
// =============================================================================

interface QueryParams {
  search?: string;
  date?: 'all' | 'week' | 'month';
  score?: 'all' | 'high' | 'medium' | 'low';
  sort?: 'date' | 'score' | 'name';
  direction?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authorization (implement your auth check)
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params: QueryParams = {
      search: searchParams.get('search') || undefined,
      date: (searchParams.get('date') as QueryParams['date']) || 'all',
      score: (searchParams.get('score') as QueryParams['score']) || 'all',
      sort: (searchParams.get('sort') as QueryParams['sort']) || 'date',
      direction: (searchParams.get('direction') as QueryParams['direction']) || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    };

    // Build query
    let query = supabase
      .from('assessment_results')
      .select(`
        *,
        user_profiles!inner (
          id,
          email,
          full_name,
          created_at
        ),
        financial_plans (
          id,
          goal_path,
          chosen_path,
          created_at
        )
      `);

    // Apply search filter
    if (params.search) {
      query = query.or(
        `user_profiles.full_name.ilike.%${params.search}%,user_profiles.email.ilike.%${params.search}%`
      );
    }

    // Apply date filter
    if (params.date === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (params.date === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }

    // Apply score filter
    if (params.score === 'high') {
      query = query.gte('overall_score', 70);
    } else if (params.score === 'medium') {
      query = query.gte('overall_score', 50).lt('overall_score', 70);
    } else if (params.score === 'low') {
      query = query.lt('overall_score', 50);
    }

    // Apply sorting
    const sortColumn = params.sort === 'score' 
      ? 'overall_score' 
      : params.sort === 'name'
        ? 'user_profiles.full_name'
        : 'created_at';
    
    query = query.order(sortColumn === 'user_profiles.full_name' ? 'created_at' : sortColumn, { 
      ascending: params.direction === 'asc' 
    });

    // Apply pagination
    const offset = (params.page! - 1) * params.limit!;
    query = query.range(offset, offset + params.limit! - 1);

    // Execute query
    const { data: assessments, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedAssessments = (assessments || []).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      overall_score: a.overall_score,
      personality_type: a.personality_type,
      factor_scores: a.factor_scores || [],
      rankings: a.rankings || { overallPercentile: 50, vsAgeGroup: 50, vsIncomeGroup: 50 },
      created_at: a.created_at,
      user: a.user_profiles ? {
        id: a.user_profiles.id,
        email: a.user_profiles.email,
        full_name: a.user_profiles.full_name,
        created_at: a.user_profiles.created_at
      } : null,
      financial_plans: a.financial_plans || []
    }));

    // Fetch stats
    const stats = await fetchDashboardStats();

    return NextResponse.json({
      success: true,
      assessments: transformedAssessments,
      stats,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: transformedAssessments.length // Would need separate count query for accurate total
      }
    });

  } catch (error) {
    console.error('Admin assessments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper: Fetch Dashboard Stats
// =============================================================================

async function fetchDashboardStats() {
  try {
    // Total assessments
    const { count: totalAssessments } = await supabase
      .from('assessment_results')
      .select('*', { count: 'exact', head: true });

    // Assessments this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: assessmentsThisWeek } = await supabase
      .from('assessment_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Average score (current and previous week for change calculation)
    const { data: avgData } = await supabase
      .from('assessment_results')
      .select('overall_score, created_at');

    let averageScore = 0;
    let scoreChange = 0;

    if (avgData && avgData.length > 0) {
      const allScores = avgData.map(a => a.overall_score);
      averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

      // Calculate change vs previous week
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const thisWeekScores = avgData
        .filter(a => new Date(a.created_at) >= weekAgo)
        .map(a => a.overall_score);
      
      const lastWeekScores = avgData
        .filter(a => {
          const date = new Date(a.created_at);
          return date >= twoWeeksAgo && date < weekAgo;
        })
        .map(a => a.overall_score);

      if (thisWeekScores.length > 0 && lastWeekScores.length > 0) {
        const thisWeekAvg = thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length;
        const lastWeekAvg = lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length;
        scoreChange = Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100);
      }
    }

    // Completion rate (sessions completed / sessions started)
    const { count: completedSessions } = await supabase
      .from('assessment_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: totalSessions } = await supabase
      .from('assessment_sessions')
      .select('*', { count: 'exact', head: true });

    const completionRate = totalSessions && totalSessions > 0
      ? Math.round((completedSessions || 0) / totalSessions * 100)
      : 0;

    return {
      totalAssessments: totalAssessments || 0,
      assessmentsThisWeek: assessmentsThisWeek || 0,
      averageScore,
      scoreChange,
      completionRate
    };
  } catch (error) {
    console.error('Stats fetch error:', error);
    return {
      totalAssessments: 0,
      assessmentsThisWeek: 0,
      averageScore: 0,
      scoreChange: 0,
      completionRate: 0
    };
  }
}

// =============================================================================
// POST Handler - Bulk actions (optional)
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, assessmentIds } = body;

    if (!action || !assessmentIds || !Array.isArray(assessmentIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'delete':
        // Delete assessments (admin only)
        const { error: deleteError } = await supabase
          .from('assessment_results')
          .delete()
          .in('id', assessmentIds);

        if (deleteError) {
          return NextResponse.json(
            { success: false, error: 'Delete failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: `Deleted ${assessmentIds.length} assessments` 
        });

      case 'export':
        // Export assessments as CSV
        const { data: exportData } = await supabase
          .from('assessment_results')
          .select(`
            id,
            overall_score,
            personality_type,
            created_at,
            user_profiles (full_name, email)
          `)
          .in('id', assessmentIds);

        if (!exportData) {
          return NextResponse.json(
            { success: false, error: 'Export failed' },
            { status: 500 }
          );
        }

        // Convert to CSV
        const csvRows = [
          ['ID', 'Name', 'Email', 'Score', 'Personality', 'Date'].join(','),
          ...exportData.map((row: any) => [
            row.id,
            row.user_profiles?.full_name || '',
            row.user_profiles?.email || '',
            row.overall_score,
            row.personality_type,
            row.created_at
          ].join(','))
        ];

        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="assessments_export.csv"'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
