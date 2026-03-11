// ============================================
// Comments API Routes
// app/api/agents/comments/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { fetchCommentsForUser, generateReply, postReply, processAutoReplies } from '@/lib/agents/comments';

// ============================================
// GET /api/agents/comments - List comments
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
    const postId = searchParams.get('post_id');
    const platform = searchParams.get('platform');
    const replied = searchParams.get('replied');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('comments')
      .select('*, posts(topic, agents(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postId) query = query.eq('post_id', postId);
    if (platform) query = query.eq('platform', platform);
    if (replied === 'true') query = query.eq('replied', true);
    if (replied === 'false') query = query.eq('replied', false);

    const { data: comments, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: comments,
    });

  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/agents/comments - Actions
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
    const { action, comment_id, reply_text } = body;

    switch (action) {
      case 'fetch': {
        // Fetch new comments from platforms
        const result = await fetchCommentsForUser(user.id);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Fetched ${result.fetched} comments, ${result.newComments} new`,
        });
      }

      case 'generate_reply': {
        if (!comment_id) {
          return NextResponse.json({ error: 'comment_id required' }, { status: 400 });
        }
        const result = await generateReply(user.id, comment_id);
        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          data: { reply: result.reply },
        });
      }

      case 'reply': {
        if (!comment_id || !reply_text) {
          return NextResponse.json({ error: 'comment_id and reply_text required' }, { status: 400 });
        }
        const result = await postReply(user.id, comment_id, reply_text);
        return NextResponse.json({
          success: result.success,
          error: result.error,
          message: result.success ? 'Reply posted!' : result.error,
        });
      }

      case 'auto_reply': {
        // Process auto-replies for agents with it enabled
        const result = await processAutoReplies(user.id);
        return NextResponse.json({
          success: true,
          data: result,
          message: `Processed ${result.processed}, replied to ${result.replied}`,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}