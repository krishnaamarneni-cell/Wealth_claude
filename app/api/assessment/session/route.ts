// =============================================================================
// API Route: /api/assessment/session
// Manages assessment sessions - create, update, get
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

interface CreateSessionRequest {
  userId: string;
  assessmentMode: 'quick' | 'full';
  goalPath?: string;
}

interface UpdateSessionRequest {
  sessionId: string;
  status?: 'in_progress' | 'paused' | 'completed' | 'abandoned';
  currentTestId?: string;
  currentQuestionIndex?: number;
  testsCompleted?: string[];
  totalTimeSeconds?: number;
}

// =============================================================================
// POST - Create new session
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateSessionRequest = await request.json();

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      );
    }

    // Check for existing in-progress session
    const { data: existingSession } = await supabase
      .from('assessment_sessions')
      .select('id, status, current_test_id, current_question_index, created_at')
      .eq('user_id', body.userId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If there's an existing session less than 24 hours old, return it
    if (existingSession) {
      const sessionAge = Date.now() - new Date(existingSession.created_at).getTime();
      const hoursOld = sessionAge / (1000 * 60 * 60);

      if (hoursOld < 24) {
        return NextResponse.json({
          success: true,
          session: existingSession,
          resumed: true,
          message: 'Resuming existing session'
        });
      } else {
        // Mark old session as abandoned
        await supabase
          .from('assessment_sessions')
          .update({ status: 'abandoned' })
          .eq('id', existingSession.id);
      }
    }

    // Create new session
    const sessionId = randomUUID();
    const { data: newSession, error } = await supabase
      .from('assessment_sessions')
      .insert({
        id: sessionId,
        user_id: body.userId,
        status: 'in_progress',
        assessment_mode: body.assessmentMode,
        goal_path: body.goalPath || null,
        current_test_id: 'financial_personality',
        current_question_index: 0,
        tests_completed: [],
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Session create error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: newSession,
      resumed: false,
      message: 'New session created'
    });

  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get session by ID or user's latest
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { success: false, error: 'id or userId required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('assessment_sessions')
      .select(`
        *,
        assessment_results (
          id,
          overall_score,
          personality_type
        )
      `);

    if (sessionId) {
      query = query.eq('id', sessionId);
    } else if (userId) {
      query = query
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data: session, error } = await query.single();

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update session (progress, pause, etc.)
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdateSessionRequest = await request.json();

    if (!body.sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.status) {
      updates.status = body.status;
      if (body.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (body.currentTestId !== undefined) {
      updates.current_test_id = body.currentTestId;
    }

    if (body.currentQuestionIndex !== undefined) {
      updates.current_question_index = body.currentQuestionIndex;
    }

    if (body.testsCompleted) {
      updates.tests_completed = body.testsCompleted;
    }

    if (body.totalTimeSeconds !== undefined) {
      updates.total_time_seconds = body.totalTimeSeconds;
    }

    const { data: updatedSession, error } = await supabase
      .from('assessment_sessions')
      .update(updates)
      .eq('id', body.sessionId)
      .select()
      .single();

    if (error) {
      console.error('Session update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('Session PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Abandon/delete session
// =============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'id required' },
        { status: 400 }
      );
    }

    // Mark as abandoned rather than hard delete
    const { error } = await supabase
      .from('assessment_sessions')
      .update({ 
        status: 'abandoned',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Session delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to abandon session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session abandoned'
    });

  } catch (error) {
    console.error('Session DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
