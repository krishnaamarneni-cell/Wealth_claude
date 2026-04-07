import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const supabase = getServiceClient();

  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [
      totalAssessmentsResult,
      assessmentsThisWeekResult,
      totalUsersResult,
      newUsersThisWeekResult,
      scoresResult,
      completionResult,
      recentAssessmentsResult,
      topPerformersResult,
      needsAttentionResult
    ] = await Promise.all([
      supabase
        .from('assessment_results')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('assessment_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      supabase
        .from('assessment_results')
        .select('overall_score, created_at'),
      Promise.all([
        supabase.from('assessment_sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('assessment_sessions').select('*', { count: 'exact', head: true })
      ]),
      supabase
        .from('assessment_results')
        .select(`
          id,
          overall_score,
          personality_type,
          created_at,
          user_profiles (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('assessment_results')
        .select(`
          id,
          overall_score,
          user_profiles (full_name)
        `)
        .order('overall_score', { ascending: false })
        .limit(3),
      supabase
        .from('assessment_results')
        .select(`
          id,
          overall_score,
          user_profiles (full_name)
        `)
        .lt('overall_score', 50)
        .order('overall_score', { ascending: true })
        .limit(3)
    ]);

    let averageScore = 0;
    let scoreChange = 0;

    if (scoresResult.data && scoresResult.data.length > 0) {
      const allScores = scoresResult.data.map(a => a.overall_score);
      averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

      const thisWeekScores = scoresResult.data
        .filter(a => new Date(a.created_at) >= weekAgo)
        .map(a => a.overall_score);

      const lastWeekScores = scoresResult.data
        .filter(a => {
          const date = new Date(a.created_at);
          return date >= twoWeeksAgo && date < weekAgo;
        })
        .map(a => a.overall_score);

      if (thisWeekScores.length > 0 && lastWeekScores.length > 0) {
        const thisWeekAvg = thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length;
        const lastWeekAvg = lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length;
        scoreChange = Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 * 10) / 10;
      }
    }

    const [completedResult, totalSessionsResult] = completionResult;
    const completionRate = totalSessionsResult.count && totalSessionsResult.count > 0
      ? Math.round((completedResult.count || 0) / totalSessionsResult.count * 100)
      : 0;

    const recentAssessments = (recentAssessmentsResult.data || []).map((a: any) => ({
      id: a.id,
      user_name: a.user_profiles?.full_name || 'Unknown',
      user_email: a.user_profiles?.email || '',
      overall_score: a.overall_score,
      personality_type: a.personality_type,
      created_at: a.created_at
    }));

    const topPerformers = (topPerformersResult.data || []).map((a: any) => ({
      id: a.id,
      user_name: a.user_profiles?.full_name || 'Unknown',
      overall_score: a.overall_score
    }));

    const needsAttention = (needsAttentionResult.data || []).map((a: any) => ({
      id: a.id,
      user_name: a.user_profiles?.full_name || 'Unknown',
      overall_score: a.overall_score
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalAssessments: totalAssessmentsResult.count || 0,
          assessmentsThisWeek: assessmentsThisWeekResult.count || 0,
          totalUsers: totalUsersResult.count || 0,
          newUsersThisWeek: newUsersThisWeekResult.count || 0,
          averageScore,
          scoreChange,
          completionRate
        },
        recentAssessments,
        topPerformers,
        needsAttention
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
