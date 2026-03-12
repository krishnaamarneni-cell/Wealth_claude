// ============================================
// API Routes: Content Generation
// /api/agents/generate/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { generatePostForAgent, discoverTrends, generateBatchPosts } from '@/lib/agents/content-engine';

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

    const body = await request.json();

    if (isServiceAuth) {
      // Service call - use provided user_id
      userId = body.user_id || process.env.AGENT_OWNER_USER_ID;
      if (!userId) {
        return NextResponse.json(
          { error: 'user_id required for service auth' },
          { status: 400 }
        );
      }
      console.log('[v0] Service auth accepted, userId:', userId);
    } else {
      // Normal user call - check session
      const cookieStore = await cookies();
      const supabase = createServerSideClient(cookieStore);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const { agent_id, topic, action } = body as {
      agent_id: string;
      topic?: string;
      action?: 'generate' | 'discover_trends' | 'batch_generate';
    };

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }

    // Get Supabase client for database queries
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .eq('user_id', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'discover_trends': {
        const trends = await discoverTrends(user.id, agent);
        return NextResponse.json({
          success: true,
          data: { trends },
        });
      }

      case 'batch_generate': {
        const trends = await discoverTrends(user.id, agent);
        const results = await generateBatchPosts(user.id, agent, trends, 3);
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
          return NextResponse.json({ error: 'topic is required for generation' }, { status: 400 });
        }

        const result = await generatePostForAgent(user.id, agent, topic);

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: { post: result.post },
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
