// ============================================
// API Routes: Posts Management (Updated)
// app/api/agents/posts/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { publishPost, getAgentSocialAccountIds } from '@/lib/agents/social-posting';

// ============================================
// GET /api/agents/posts - List posts
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

    let query = supabase
      .from('posts')
      .select('*, agents(name, niche)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (status) {
      if (status === 'queue') {
        query = query.in('status', ['scheduled', 'draft']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: posts, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { limit, offset, total: count },
    });

  } catch (error) {
    console.error('Posts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT /api/agents/posts - Update/Publish post
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

    // Get existing post
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Handle actions
    switch (action) {
      case 'publish_now': {
        // Get account IDs from agent or use provided ones
        let accountIds = updates.account_ids;

        if (!accountIds || accountIds.length === 0) {
          accountIds = await getAgentSocialAccountIds(user.id, post.agent_id);
        }

        if (!accountIds || accountIds.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No social accounts configured for this agent',
          }, { status: 400 });
        }

        console.log('[v0] Publishing post:', { postId: id, accountIds });

        try {
          const result = await publishPost(user.id, post, accountIds);
          console.log('[v0] Publish result:', result);

          return NextResponse.json({
            success: result.success,
            data: result,
            message: result.success ? 'Post published!' : result.error || 'Failed to publish',
            error: result.error,
          });
        } catch (publishError: any) {
          console.error('[v0] Publish error:', publishError);
          return NextResponse.json({
            success: false,
            error: publishError.message || 'Failed to publish post',
          }, { status: 500 });
        }
      }

      case 'schedule': {
        if (!updates.scheduled_for) {
          return NextResponse.json({ error: 'scheduled_for required' }, { status: 400 });
        }

        await supabase
          .from('posts')
          .update({
            status: 'scheduled',
            scheduled_for: updates.scheduled_for,
          })
          .eq('id', id);

        return NextResponse.json({
          success: true,
          message: 'Post scheduled!',
        });
      }

      case 'cancel': {
        await supabase
          .from('posts')
          .update({
            status: 'cancelled',
            scheduled_for: null,
          })
          .eq('id', id);

        return NextResponse.json({
          success: true,
          message: 'Post cancelled',
        });
      }

      default: {
        // Regular update
        const allowedUpdates: Record<string, any> = {};

        if (updates.x_content !== undefined) allowedUpdates.x_content = updates.x_content;
        if (updates.linkedin_content !== undefined) allowedUpdates.linkedin_content = updates.linkedin_content;
        if (updates.image_url !== undefined) allowedUpdates.image_url = updates.image_url;
        if (updates.scheduled_for !== undefined) allowedUpdates.scheduled_for = updates.scheduled_for;

        const { data, error } = await supabase
          .from('posts')
          .update(allowedUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
        }

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
// DELETE /api/agents/posts - Delete post
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

    await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
    });

  } catch (error) {
    console.error('Posts DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
