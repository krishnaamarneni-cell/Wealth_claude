// ============================================
// API Routes: Scheduler Cron Job
// /api/agents/cron/route.ts
//
// This endpoint is designed to be called by:
// 1. Vercel Cron (vercel.json configuration)
// 2. External cron service (cron-job.org, etc.)
// 3. Manual trigger from dashboard
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  runSchedulerCycle,
  checkAllAgentTrends,
  runAutoPosting,
  processScheduledPosts
} from '@/lib/agents/scheduler';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow (for development)
  if (!cronSecret) {
    console.warn('[Cron] No CRON_SECRET configured - allowing request');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================
// GET /api/agents/cron
// Run scheduled tasks (called by cron)
// ============================================
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const task = searchParams.get('task') || 'full';
  const userId = searchParams.get('user_id');

  // For multi-user support, we need to run for all users
  // In single-user mode, you can hardcode the user_id
  if (!userId) {
    return NextResponse.json(
      { error: 'user_id is required' },
      { status: 400 }
    );
  }

  try {
    let result: any;

    switch (task) {
      case 'trends':
        // Only check trends
        result = await checkAllAgentTrends(userId);
        break;

      case 'scheduled':
        // Only process scheduled posts
        result = await processScheduledPosts(userId);
        break;

      case 'autopost':
        // Only run auto-posting
        result = await runAutoPosting(userId);
        break;

      case 'full':
      default:
        // Run full scheduler cycle
        result = await runSchedulerCycle(userId);
        break;
    }

    return NextResponse.json({
      success: true,
      task,
      result,
    });

  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Scheduler error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/agents/cron
// Manual trigger from dashboard
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task = 'full', agent_id } = body;

    let result: any;

    switch (task) {
      case 'trends':
        result = await checkAllAgentTrends(user.id);
        break;

      case 'scheduled':
        result = await processScheduledPosts(user.id);
        break;

      case 'autopost':
        result = await runAutoPosting(user.id);
        break;

      case 'full':
      default:
        result = await runSchedulerCycle(user.id);
        break;
    }

    // Log the manual trigger
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      agent_id: agent_id || null,
      action_type: 'telegram_command',
      action_description: `Manual scheduler trigger: ${task}`,
      status: 'success',
      metadata: { task, result_summary: summarizeResult(result) },
    });

    return NextResponse.json({
      success: true,
      task,
      result,
    });

  } catch (error: any) {
    console.error('[Cron] Manual trigger error:', error);
    return NextResponse.json(
      { error: error.message || 'Scheduler error' },
      { status: 500 }
    );
  }
}

// Helper to summarize results for logging
function summarizeResult(result: any): any {
  if (!result) return null;

  if (result.timestamp) {
    // Full cycle result
    return {
      newTrends: result.trends?.reduce((sum: number, t: any) => sum + (t.newTrends?.length || 0), 0) || 0,
      autoPostsSuccess: result.autoPosts?.filter((p: any) => p.success).length || 0,
      scheduledSuccess: result.scheduledPosts?.success || 0,
    };
  }

  if (Array.isArray(result)) {
    return { count: result.length };
  }

  return result;
}