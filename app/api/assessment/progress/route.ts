// =============================================================================
// API Route: /api/assessment/progress
// Tracks user progress on their financial plan
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// Types
// =============================================================================

interface CreateProgressRequest {
  planId: string;
  userId: string;
  monthNumber: number;
  status: 'on_track' | 'ahead' | 'behind' | 'at_risk';
  actualPayment?: number;
  notes?: string;
  metrics?: Record<string, any>;
}

interface UpdateProgressRequest {
  progressId: string;
  status?: 'on_track' | 'ahead' | 'behind' | 'at_risk';
  actualPayment?: number;
  notes?: string;
  metrics?: Record<string, any>;
}

// =============================================================================
// POST - Log new progress checkpoint
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateProgressRequest = await request.json();

    if (!body.planId || !body.userId || body.monthNumber === undefined) {
      return NextResponse.json(
        { success: false, error: 'planId, userId, and monthNumber required' },
        { status: 400 }
      );
    }

    // Fetch the plan to get expected values
    const { data: plan, error: planError } = await supabase
      .from('financial_plans')
      .select('chosen_path, safe_path, aggressive_path, checkpoints')
      .eq('id', body.planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Get expected payment from chosen path
    const chosenPath = plan.chosen_path === 'safe_steady' 
      ? plan.safe_path 
      : plan.aggressive_path;
    
    const expectedPayment = chosenPath?.monthlyPayment || 0;

    // Calculate status if not provided
    let status = body.status;
    if (!status && body.actualPayment !== undefined) {
      const paymentRatio = body.actualPayment / expectedPayment;
      if (paymentRatio >= 1.1) status = 'ahead';
      else if (paymentRatio >= 0.9) status = 'on_track';
      else if (paymentRatio >= 0.5) status = 'behind';
      else status = 'at_risk';
    }

    // Create progress entry
    const { data: progress, error } = await supabase
      .from('plan_progress')
      .insert({
        id: randomUUID(),
        plan_id: body.planId,
        user_id: body.userId,
        month_number: body.monthNumber,
        checkpoint_date: new Date().toISOString(),
        status: status || 'on_track',
        expected_payment: expectedPayment,
        actual_payment: body.actualPayment || 0,
        notes: body.notes || null,
        metrics: body.metrics || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Progress create error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to log progress' },
        { status: 500 }
      );
    }

    // Get milestone for this month if exists
    const milestone = (plan.checkpoints || []).find(
      (c: any) => c.month === body.monthNumber
    );

    return NextResponse.json({
      success: true,
      progress,
      milestone: milestone || null,
      feedback: getProgressFeedback(status || 'on_track', body.monthNumber)
    });

  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get progress history for a plan
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const userId = searchParams.get('userId');
    const progressId = searchParams.get('id');

    if (!planId && !userId && !progressId) {
      return NextResponse.json(
        { success: false, error: 'planId, userId, or id required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('plan_progress')
      .select('*')
      .order('month_number', { ascending: true });

    if (progressId) {
      query = query.eq('id', progressId);
    } else if (planId) {
      query = query.eq('plan_id', planId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: progress, error } = progressId 
      ? await query.single()
      : await query;

    if (error) {
      console.error('Progress fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Calculate summary stats if fetching multiple
    let summary = null;
    if (Array.isArray(progress) && progress.length > 0) {
      const totalExpected = progress.reduce((sum, p) => sum + (p.expected_payment || 0), 0);
      const totalActual = progress.reduce((sum, p) => sum + (p.actual_payment || 0), 0);
      const onTrackCount = progress.filter(p => p.status === 'on_track' || p.status === 'ahead').length;

      summary = {
        totalMonths: progress.length,
        totalExpected,
        totalActual,
        difference: totalActual - totalExpected,
        onTrackPercentage: Math.round((onTrackCount / progress.length) * 100),
        currentStreak: calculateStreak(progress),
        latestStatus: progress[progress.length - 1]?.status || 'unknown'
      };
    }

    return NextResponse.json({
      success: true,
      progress,
      summary
    });

  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update progress entry
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdateProgressRequest = await request.json();

    if (!body.progressId) {
      return NextResponse.json(
        { success: false, error: 'progressId required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.status) updates.status = body.status;
    if (body.actualPayment !== undefined) updates.actual_payment = body.actualPayment;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.metrics) updates.metrics = body.metrics;

    const { data: progress, error } = await supabase
      .from('plan_progress')
      .update(updates)
      .eq('id', body.progressId)
      .select()
      .single();

    if (error) {
      console.error('Progress update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Progress PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helpers
// =============================================================================

function getProgressFeedback(status: string, month: number): string {
  const messages = {
    ahead: [
      "🚀 You're crushing it! Ahead of schedule!",
      "⭐ Outstanding progress! Keep this momentum!",
      "🎯 Exceeding expectations - you're a financial rockstar!"
    ],
    on_track: [
      "✅ Right on track! Great consistency!",
      "👍 Steady progress - exactly where you should be!",
      "💪 You're doing great! Keep it up!"
    ],
    behind: [
      "📊 A little behind, but you can catch up!",
      "💡 Consider reducing one discretionary expense this month",
      "🔄 Small adjustments can get you back on track"
    ],
    at_risk: [
      "⚠️ Let's review your plan together",
      "🤝 Consider reaching out to discuss options",
      "📞 It might be time to adjust your timeline"
    ]
  };

  const options = messages[status as keyof typeof messages] || messages.on_track;
  return options[Math.floor(Math.random() * options.length)];
}

function calculateStreak(progress: any[]): number {
  let streak = 0;
  for (let i = progress.length - 1; i >= 0; i--) {
    if (progress[i].status === 'on_track' || progress[i].status === 'ahead') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
