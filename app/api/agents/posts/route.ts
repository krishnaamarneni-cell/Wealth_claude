// ============================================
// API Routes: Posts Management
// /api/agents/posts/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { publishPost, schedulePost, cancelPost } from '@/lib/agents/buffer';

// ============================================
// GET /api/agents/posts
// List posts (queue, history, etc.)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('posts')
      .select('*, agents(name, niche)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (status) {
      if (status === 'queue') {
        // Queue = scheduled + draft
        query = query.in('status', ['scheduled', 'draft']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        limit,
        offset,
        total: count,
      },
    });

  } catch (error) {
    console.error('Posts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT /api/agents/posts
// Update post (edit content, schedule, status)
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
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Handle special actions
    switch (action) {
      case 'publish_now': {
        const result = await publishPost(user.id, existing, true);
        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.success ? 'Post published!' : 'Failed to publish',
        });
      }

      case 'schedule': {
        if (!updates.scheduled_for) {
          return NextResponse.json({ error: 'scheduled_for is required' }, { status: 400 });
        }
        const result = await schedulePost(user.id, id, new Date(updates.scheduled_for));
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Post scheduled!' : result.error,
        });
      }

      case 'cancel': {
        const result = await cancelPost(user.id, id);
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Post cancelled' : result.error,
        });
      }

      default: {
        // Regular update (edit content)
        const allowedUpdates: Record<string, any> = {};

        if (updates.x_content !== undefined) allowedUpdates.x_content = updates.x_content;
        if (updates.linkedin_content !== undefined) allowedUpdates.linkedin_content = updates.linkedin_content;
        if (updates.instagram_content !== undefined) allowedUpdates.instagram_content = updates.instagram_content;
        if (updates.image_url !== undefined) allowedUpdates.image_url = updates.image_url;
        if (updates.scheduled_for !== undefined) allowedUpdates.scheduled_for = updates.scheduled_for;
        if (updates.platforms !== undefined) allowedUpdates.platforms = updates.platforms;

        const { data, error } = await supabase
          .from('posts')
          .update(allowedUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
        }

        // Log edit
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          agent_id: existing.agent_id,
          action_type: 'post_edited',
          action_description: 'Post content edited',
          related_entity_type: 'post',
          related_entity_id: id,
          status: 'success',
        });

        return NextResponse.json({
          success: true,
          data,
          message: 'Post updated',
        });
      }
    }

  } catch (error) {
    console.error('Posts PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/agents/posts
// Delete a post
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

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
    });

  } catch (error) {
    console.error('Posts DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
