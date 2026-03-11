// ============================================
// API Routes: Agents Management
// /api/agents/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Agent, AgentInsert, AgentUpdate, PostingStyle } from '@/types/database';

// Default posting style
const DEFAULT_POSTING_STYLE: PostingStyle = {
  tone: 'professional',
  emoji_usage: 'moderate',
  hashtag_style: 'relevant',
  x_style: 'Short, punchy insights with hooks. Use relevant emojis. Include 1-2 hashtags.',
  linkedin_style: 'Professional, thoughtful analysis. Longer form with clear structure. No emojis.',
  instagram_style: 'Visual-first caption. Engaging opener. 5-10 relevant hashtags at the end.',
};

// ============================================
// GET /api/agents
// List all agents for the user
// ============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Build query
    let query = supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    // If stats requested, fetch additional data
    let agentsWithStats = agents;
    if (includeStats && agents && agents.length > 0) {
      const agentIds = agents.map(a => a.id);

      // Get post counts for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: postCounts } = await supabase
        .from('posts')
        .select('agent_id, id')
        .in('agent_id', agentIds)
        .gte('created_at', today.toISOString())
        .eq('status', 'posted');

      // Get scheduled post counts
      const { data: scheduledCounts } = await supabase
        .from('posts')
        .select('agent_id, id')
        .in('agent_id', agentIds)
        .eq('status', 'scheduled');

      // Get pending trends
      const { data: pendingTrends } = await supabase
        .from('trends')
        .select('agent_id, id')
        .in('agent_id', agentIds)
        .is('user_approved', null)
        .eq('notification_sent', true);

      // Merge stats into agents
      agentsWithStats = agents.map(agent => {
        const todayPosts = postCounts?.filter(p => p.agent_id === agent.id).length || 0;
        const scheduled = scheduledCounts?.filter(p => p.agent_id === agent.id).length || 0;
        const pending = pendingTrends?.filter(t => t.agent_id === agent.id).length || 0;

        return {
          ...agent,
          stats: {
            posts_today: todayPosts,
            scheduled_posts: scheduled,
            pending_trends: pending,
          },
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: agentsWithStats,
    });

  } catch (error) {
    console.error('Agents GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/agents
// Create a new agent
// ============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as AgentInsert;

    // Validate required fields
    if (!body.name || !body.topic_instructions) {
      return NextResponse.json(
        { error: 'name and topic_instructions are required' },
        { status: 400 }
      );
    }

    // Build agent object with defaults
    const agentData = {
      user_id: user.id,
      name: body.name,
      description: body.description || null,
      avatar_url: body.avatar_url || null,
      topic_instructions: body.topic_instructions,
      niche: body.niche || null,
      posting_style: body.posting_style || DEFAULT_POSTING_STYLE,
      image_style_prompt: body.image_style_prompt ||
        'Professional finance data visualization, clean minimal design, blue/white color scheme, modern chart style, data labels visible, white background',
      posting_frequency_minutes: body.posting_frequency_minutes || 120,
      min_posting_gap_minutes: body.min_posting_gap_minutes || 60,
      trend_sources: body.trend_sources || ['x_trending', 'perplexity', 'news_rss'],
      trend_keywords: body.trend_keywords || null,
      winning_content_folder_url: body.winning_content_folder_url || null,
      winning_content_folder_id: body.winning_content_folder_id || null,
      buffer_profile_ids: body.buffer_profile_ids || [],
      status: body.status || 'draft',
      is_auto_posting: body.is_auto_posting ?? true,
      notify_on_trend_change: body.notify_on_trend_change ?? true,
    };

    const { data, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      agent_id: data.id,
      action_type: 'agent_created',
      action_description: `Created agent: ${data.name}`,
      related_entity_type: 'agent',
      related_entity_id: data.id,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Agent created successfully',
    });

  } catch (error) {
    console.error('Agents POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT /api/agents
// Update an existing agent
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body as { id: string } & AgentUpdate;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('agents')
      .select('id, user_id, name, status')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Update agent
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }

    // Log status changes
    if (updates.status && updates.status !== existing.status) {
      const actionType = updates.status === 'paused' ? 'agent_paused' :
        updates.status === 'active' ? 'agent_resumed' : 'agent_updated';

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        agent_id: id,
        action_type: actionType,
        action_description: `Agent ${existing.name} status changed to ${updates.status}`,
        related_entity_type: 'agent',
        related_entity_id: id,
        status: 'success',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Agent updated successfully',
    });

  } catch (error) {
    console.error('Agents PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/agents
// Delete an agent
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('agents')
      .select('id, user_id, name')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Delete agent (cascade will handle related records)
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting agent:', error);
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Agent "${existing.name}" deleted successfully`,
    });

  } catch (error) {
    console.error('Agents DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
