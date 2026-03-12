// ============================================
// API Routes: Posts Management
// app/api/agents/posts/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { publishPost } from '@/lib/agents/social-posting';

// Service role client for Telegram/Cron calls
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// GET /api/agents/posts
// Get all posts for the user
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
    const status = searchParams.get('status');
    const agentId = searchParams.get('agent_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('posts')
      .select('*, agents(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: posts });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// POST /api/agents/posts
// Create a new post
// ============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const postData = {
      user_id: user.id,
      agent_id: body.agent_id,
      topic: body.topic,
      x_content: body.x_content,
      linkedin_content: body.linkedin_content,
      instagram_content: body.instagram_content,
      image_url: body.image_url,
      image_prompt: body.image_prompt,
      research_summary: body.research_summary,
      status: body.status || 'draft',
      platforms: body.platforms || ['x', 'linkedin'],
      scheduled_for: body.scheduled_for,
    };

    const { data: post, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: post });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// PUT /api/agents/posts
// Update a post or publish it
// ============================================
export async function PUT(request: NextRequest) {
  try {
    // Check for service auth (Telegram, Cron)
    const authHeader = request.headers.get('Authorization');
    const isServiceAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let userId: string;
    let supabase: any;

    const body = await request.json();

    if (isServiceAuth) {
      // Service call - use service role client
      supabase = serviceSupabase;
      userId = body.user_id || process.env.AGENT_OWNER_USER_ID!;
      console.log('[Posts PUT] Service auth accepted, userId:', userId);
    } else {
      // Normal user call
      const cookieStore = await cookies();
      supabase = createServerSideClient(cookieStore);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Handle publish action
    if (action === 'publish_now') {
      console.log(`[Posts PUT] Publishing post ${id} for user ${userId}`);

      // First verify the post exists and belongs to this user
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*, agents(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (postError || !post) {
        console.error('[Posts PUT] Post not found:', postError);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      console.log(`[Posts PUT] Found post: ${post.topic}`);

      // Publish the post
      const result = await publishPost(id, userId);

      return NextResponse.json({
        success: result.success,
        data: result,
        error: result.error,
      });
    }

    // Handle schedule action
    if (action === 'schedule') {
      const { data: post, error } = await supabase
        .from('posts')
        .update({
          status: 'scheduled',
          scheduled_for: updateData.scheduled_for,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: post });
    }

    // Regular update
    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: post });

  } catch (error: any) {
    console.error('[Posts PUT] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}