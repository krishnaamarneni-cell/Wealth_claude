// ============================================
// API Routes: Content Generation
// app/api/agents/generate/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generatePostForAgent, discoverTrends, generateBatchPosts } from '@/lib/agents/content-engine';

// Service role client for Telegram/Cron calls
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// POST /api/agents/generate
// Generate content for an agent
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Check for service auth (Telegram, Cron)
    const authHeader = request.headers.get('Authorization');
    const isServiceAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let userId: string;
    let supabase: any;

    const body = await request.json();

    if (isServiceAuth) {
      // Service call - use provided user_id and service role client
      userId = body.user_id || process.env.AGENT_OWNER_USER_ID;
      supabase = serviceSupabase;

      if (!userId) {
        return NextResponse.json(
          { error: 'user_id required for service auth' },
          { status: 400 }
        );
      }
      console.log('[Generate] Service auth accepted, userId:', userId);
    } else {
      // Normal user call - check session
      const cookieStore = await cookies();
      supabase = createServerSideClient(cookieStore);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const { agent_id, topic, action, source, includeImage = true } = body as {
      agent_id?: string;
      topic?: string;
      action?: 'generate' | 'discover_trends' | 'batch_generate';
      source?: string;
      includeImage?: boolean;
    };

    // Get agent - either by ID or get the first active agent
    let agent;

    if (agent_id) {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      agent = data;
    } else {
      // No agent_id provided - get first active agent (for Telegram)
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error || !data) {
        // Try getting any agent if no active ones
        const { data: anyAgent, error: anyError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (anyError || !anyAgent) {
          return NextResponse.json({
            error: 'No agent configured. Please create an agent first.'
          }, { status: 404 });
        }
        agent = anyAgent;
      } else {
        agent = data;
      }
    }

    // Handle different actions
    const currentAction = action || 'generate';

    switch (currentAction) {
      case 'discover_trends': {
        const trends = await discoverTrends(userId, agent);
        return NextResponse.json({
          success: true,
          data: { trends },
        });
      }

      case 'batch_generate': {
        const trends = await discoverTrends(userId, agent);
        const results = await generateBatchPosts(userId, agent, trends, 3, { includeImage });
        return NextResponse.json({
          success: true,
          data: {
            trends,
            posts: results.filter(r => r.success).map(r => r.post),
            errors: results.filter(r => !r.success).map(r => r.error),
          },
        });
      }

      case 'generate':
      default: {
        if (!topic) {
          return NextResponse.json({
            error: 'topic is required for generation'
          }, { status: 400 });
        }

        console.log(`[Generate] Creating post for topic: "${topic}", source: ${source || 'web'}, includeImage: ${includeImage}`);

        const result = await generatePostForAgent(userId, agent, topic, { includeImage });

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: result.post,
        });
      }
    }

  } catch (error: any) {
    console.error('Generate API error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}