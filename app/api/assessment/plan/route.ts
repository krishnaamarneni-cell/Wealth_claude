// =============================================================================
// API Route: /api/assessment/plan
// Manages financial plans - create, update path selection, get
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { generateFinancialPlan, GoalPath } from '@/lib/assessment';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// Types
// =============================================================================

interface CreatePlanRequest {
  assessmentId: string;
  userId: string;
  goalPath: GoalPath;
  targetMonths: number;
}

interface SelectPathRequest {
  planId: string;
  chosenPath: 'safe_steady' | 'aggressive';
}

interface UpdatePlanRequest {
  planId: string;
  chosenPath?: 'safe_steady' | 'aggressive';
  targetMonths?: number;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
}

// =============================================================================
// POST - Create new plan or generate plan options
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreatePlanRequest = await request.json();

    if (!body.assessmentId || !body.userId || !body.goalPath) {
      return NextResponse.json(
        { success: false, error: 'assessmentId, userId, and goalPath required' },
        { status: 400 }
      );
    }

    // Fetch assessment result
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('id', body.assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Calculate target date
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + (body.targetMonths || 12));

    // Generate plan using scoring engine
    const assessmentResult = {
      id: assessment.id,
      sessionId: assessment.session_id,
      userId: assessment.user_id,
      overallScore: assessment.overall_score,
      factorScores: assessment.factor_scores,
      personalityType: assessment.personality_type,
      personalityTraits: assessment.personality_traits,
      financialMetrics: assessment.financial_metrics,
      rankings: assessment.rankings,
      recommendedGoalPath: assessment.recommended_goal_path,
      priorityFactors: assessment.priority_factors,
      easyWins: assessment.easy_wins,
      hardChanges: assessment.hard_changes,
      completedAt: new Date(assessment.created_at)
    };

    const plan = generateFinancialPlan(
      assessmentResult,
      body.goalPath,
      targetDate
    );

    // Save plan to database
    const { data: savedPlan, error: planError } = await supabase
      .from('financial_plans')
      .insert({
        id: plan.id,
        assessment_id: body.assessmentId,
        user_id: body.userId,
        goal_path: plan.goalPath,
        goal_description: plan.goalDescription,
        target_date: plan.targetDate.toISOString(),
        timeline_validation: plan.timelineValidation,
        safe_path: plan.safePath,
        aggressive_path: plan.aggressivePath,
        chosen_path: null, // Not selected yet
        checkpoints: plan.checkpoints,
        contingency_plans: plan.contingencyPlans,
        status: 'pending_selection'
      })
      .select()
      .single();

    if (planError) {
      console.error('Plan create error:', planError);
      return NextResponse.json(
        { success: false, error: 'Failed to create plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      paths: {
        safe: plan.safePath,
        aggressive: plan.aggressivePath
      },
      timelineValidation: plan.timelineValidation
    });

  } catch (error) {
    console.error('Plan POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get plan by ID or user's latest
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');
    const assessmentId = searchParams.get('assessmentId');
    const userId = searchParams.get('userId');

    let query = supabase
      .from('financial_plans')
      .select(`
        *,
        assessment_results (
          overall_score,
          personality_type,
          factor_scores
        )
      `);

    if (planId) {
      query = query.eq('id', planId);
    } else if (assessmentId) {
      query = query.eq('assessment_id', assessmentId);
    } else if (userId) {
      query = query
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      return NextResponse.json(
        { success: false, error: 'id, assessmentId, or userId required' },
        { status: 400 }
      );
    }

    const { data: plan, error } = await query.single();

    if (error || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Plan GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update plan (select path, update status, etc.)
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdatePlanRequest = await request.json();

    if (!body.planId) {
      return NextResponse.json(
        { success: false, error: 'planId required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.chosenPath) {
      updates.chosen_path = body.chosenPath;
      updates.status = 'active';
      updates.path_selected_at = new Date().toISOString();
    }

    if (body.status) {
      updates.status = body.status;
    }

    // If target months changed, recalculate timeline
    if (body.targetMonths) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + body.targetMonths);
      updates.target_date = targetDate.toISOString();
      
      // Note: Full recalculation would require fetching assessment
      // and regenerating the plan - simplified here
    }

    const { data: updatedPlan, error } = await supabase
      .from('financial_plans')
      .update(updates)
      .eq('id', body.planId)
      .select()
      .single();

    if (error) {
      console.error('Plan update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    // If path was selected, create initial progress entry
    if (body.chosenPath) {
      await supabase
        .from('plan_progress')
        .insert({
          id: randomUUID(),
          plan_id: body.planId,
          user_id: updatedPlan.user_id,
          month_number: 0,
          checkpoint_date: new Date().toISOString(),
          status: 'on_track',
          notes: 'Plan started - path selected',
          metrics: {
            starting_point: true,
            chosen_path: body.chosenPath
          }
        });
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: body.chosenPath 
        ? `${body.chosenPath === 'safe_steady' ? 'Safe & Steady' : 'Fast & Aggressive'} path selected!`
        : 'Plan updated'
    });

  } catch (error) {
    console.error('Plan PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Quick path selection endpoint
// =============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SelectPathRequest = await request.json();

    if (!body.planId || !body.chosenPath) {
      return NextResponse.json(
        { success: false, error: 'planId and chosenPath required' },
        { status: 400 }
      );
    }

    if (!['safe_steady', 'aggressive'].includes(body.chosenPath)) {
      return NextResponse.json(
        { success: false, error: 'chosenPath must be "safe_steady" or "aggressive"' },
        { status: 400 }
      );
    }

    // Update plan with selected path
    const { data: plan, error } = await supabase
      .from('financial_plans')
      .update({
        chosen_path: body.chosenPath,
        status: 'active',
        path_selected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.planId)
      .select(`
        *,
        assessment_results (
          overall_score,
          personality_type
        )
      `)
      .single();

    if (error || !plan) {
      console.error('Path selection error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to select path' },
        { status: 500 }
      );
    }

    // Get the selected path details
    const selectedPath = body.chosenPath === 'safe_steady' 
      ? plan.safe_path 
      : plan.aggressive_path;

    // Create initial progress tracking entry
    await supabase
      .from('plan_progress')
      .insert({
        id: randomUUID(),
        plan_id: body.planId,
        user_id: plan.user_id,
        month_number: 0,
        checkpoint_date: new Date().toISOString(),
        status: 'on_track',
        notes: `Started ${body.chosenPath === 'safe_steady' ? 'Safe & Steady' : 'Fast & Aggressive'} path`,
        metrics: {
          monthly_payment: selectedPath.monthlyPayment,
          timeline_months: selectedPath.timelineMonths
        }
      });

    return NextResponse.json({
      success: true,
      plan,
      selectedPath,
      message: `You've chosen the ${body.chosenPath === 'safe_steady' ? 'Safe & Steady 🛡️' : 'Fast & Aggressive ⚡'} path!`,
      nextSteps: [
        'Set up your first automatic payment',
        'Review your monthly milestones',
        'Download your PDF report for reference'
      ]
    });

  } catch (error) {
    console.error('Path selection PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
