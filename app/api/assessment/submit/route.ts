// =============================================================================
// API Route: /api/assessment/submit
// Handles assessment submission, scoring, and saving to Supabase
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateAssessment,
  generateFinancialPlan,
  UserResponse,
  TestId,
  GoalPath
} from '@/lib/assessment';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side
);

// =============================================================================
// Types
// =============================================================================

interface SubmitAssessmentRequest {
  userId: string;
  sessionId: string;
  responses: {
    questionId: string;
    answer: string | number;
    timeSpentSeconds?: number;
  }[];
  testsCompleted: TestId[];
  totalTimeSeconds: number;
  assessmentMode: 'quick' | 'full';
  
  // User profile info (for benchmarking)
  userAge: number;
  userIncomeRange: string; // e.g., 'd' for $5k-$7.5k
  
  // Optional: Goal selection for plan generation
  goalPath?: GoalPath;
  targetMonths?: number;
}

interface SubmitAssessmentResponse {
  success: boolean;
  assessmentId?: string;
  result?: {
    overallScore: number;
    personalityType: string;
    factorScores: any[];
    rankings: any;
    recommendedGoalPath: string;
  };
  error?: string;
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<SubmitAssessmentResponse>> {
  try {
    const body: SubmitAssessmentRequest = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.sessionId || !body.responses || body.responses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Update session status
    const { error: sessionError } = await supabase
      .from('assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        tests_completed: body.testsCompleted,
        total_time_seconds: body.totalTimeSeconds
      })
      .eq('id', body.sessionId);

    if (sessionError) {
      console.error('Session update error:', sessionError);
      // Continue anyway - don't fail the whole submission
    }

    // 2. Save individual responses
    const responseRecords = body.responses.map(r => ({
      session_id: body.sessionId,
      user_id: body.userId,
      question_id: r.questionId,
      test_id: getTestIdFromQuestionId(r.questionId),
      answer: String(r.answer),
      answer_value: typeof r.answer === 'number' ? r.answer : null,
      time_spent_seconds: r.timeSpentSeconds || 0,
      answered_at: new Date().toISOString()
    }));

    const { error: responsesError } = await supabase
      .from('assessment_responses')
      .insert(responseRecords);

    if (responsesError) {
      console.error('Responses insert error:', responsesError);
      // Continue anyway
    }

    // 3. Calculate assessment results
    const userResponses: UserResponse[] = body.responses.map(r => ({
      questionId: r.questionId,
      answer: r.answer,
      timestamp: new Date()
    }));

    const assessmentResult = calculateAssessment({
      userId: body.userId,
      responses: userResponses,
      testsCompleted: body.testsCompleted,
      userAge: body.userAge,
      userIncomeRange: body.userIncomeRange
    });

    // 4. Save assessment result to Supabase
    const { data: savedResult, error: resultError } = await supabase
      .from('assessment_results')
      .insert({
        id: assessmentResult.id,
        session_id: body.sessionId,
        user_id: body.userId,
        overall_score: assessmentResult.overallScore,
        factor_scores: assessmentResult.factorScores,
        personality_type: assessmentResult.personalityType,
        personality_traits: assessmentResult.personalityTraits,
        financial_metrics: assessmentResult.financialMetrics,
        rankings: assessmentResult.rankings,
        recommended_goal_path: assessmentResult.recommendedGoalPath,
        priority_factors: assessmentResult.priorityFactors,
        easy_wins: assessmentResult.easyWins,
        hard_changes: assessmentResult.hardChanges
      })
      .select()
      .single();

    if (resultError) {
      console.error('Result insert error:', resultError);
      return NextResponse.json(
        { success: false, error: 'Failed to save assessment result' },
        { status: 500 }
      );
    }

    // 5. Generate and save plan if goal was selected
    if (body.goalPath && body.targetMonths) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + body.targetMonths);

      const plan = generateFinancialPlan(
        assessmentResult,
        body.goalPath,
        targetDate
      );

      const { error: planError } = await supabase
        .from('financial_plans')
        .insert({
          id: plan.id,
          assessment_id: assessmentResult.id,
          user_id: body.userId,
          goal_path: plan.goalPath,
          goal_description: plan.goalDescription,
          target_date: plan.targetDate.toISOString(),
          timeline_validation: plan.timelineValidation,
          safe_path: plan.safePath,
          aggressive_path: plan.aggressivePath,
          chosen_path: plan.chosenPath,
          checkpoints: plan.checkpoints,
          contingency_plans: plan.contingencyPlans
        });

      if (planError) {
        console.error('Plan insert error:', planError);
        // Don't fail - plan can be generated later
      }
    }

    // 6. Return success response
    return NextResponse.json({
      success: true,
      assessmentId: assessmentResult.id,
      result: {
        overallScore: assessmentResult.overallScore,
        personalityType: assessmentResult.personalityType,
        factorScores: assessmentResult.factorScores,
        rankings: assessmentResult.rankings,
        recommendedGoalPath: assessmentResult.recommendedGoalPath
      }
    });

  } catch (error) {
    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getTestIdFromQuestionId(questionId: string): TestId {
  const prefix = questionId.split('_')[0];
  const mapping: Record<string, TestId> = {
    'fp': 'financial_personality',
    'fh': 'financial_health',
    'ip': 'investment_profile',
    'mm': 'money_mindset'
  };
  return mapping[prefix] || 'financial_personality';
}

// =============================================================================
// GET Handler - Fetch assessment result
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!assessmentId && !userId) {
      return NextResponse.json(
        { success: false, error: 'assessmentId or userId required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('assessment_results')
      .select(`
        *,
        financial_plans (*)
      `);

    if (assessmentId) {
      query = query.eq('id', assessmentId);
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment: data
    });

  } catch (error) {
    console.error('Fetch assessment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
