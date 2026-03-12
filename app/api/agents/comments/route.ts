// ============================================
// API Routes: Comments Management
// app/api/agents/comments/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  fetchAllComments,
  autoReplyToComments,
  generateAIReply,
  replyToLinkedInComment
} from '@/lib/agents/comments';

// Service role client
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// GET /api/agents/comments
// Get comments for the user
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
    const replied = searchParams.get('replied');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('comments')
      .select('*, posts(topic, x_content, linkedin_content)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postId) {
      query = query.eq('post_id', postId);
    }

    if (replied === 'true') {
      query = query.eq('replied', true);
    } else if (replied === 'false') {
      query = query.eq('replied', false);
    }

    const { data: comments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: comments });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// POST /api/agents/comments
// Fetch comments or auto-reply (for cron jobs)
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Check for service auth (Cron)
    const authHeader = request.headers.get('Authorization');
    const isServiceAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let userId: string;

    const body = await request.json();
    const { action } = body;

    if (isServiceAuth) {
      userId = body.user_id || process.env.AGENT_OWNER_USER_ID!;
      console.log('[Comments API] Service auth, userId:', userId);
    } else {
      const cookieStore = await cookies();
      const supabase = createServerSideClient(cookieStore);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    switch (action) {
      case 'fetch': {
        // Fetch new comments from platforms
        const count = await fetchAllComments(userId);
        return NextResponse.json({
          success: true,
          message: `Fetched ${count} comments`,
          count
        });
      }

      case 'auto_reply': {
        // Auto-reply to unreplied comments
        const count = await autoReplyToComments(userId);
        return NextResponse.json({
          success: true,
          message: `Replied to ${count} comments`,
          count
        });
      }

      case 'manual_reply': {
        // Manual reply to a specific comment
        const { comment_id, reply_text } = body;

        if (!comment_id) {
          return NextResponse.json({ error: 'comment_id required' }, { status: 400 });
        }

        // Get comment details
        const { data: comment } = await serviceSupabase
          .from('comments')
          .select('*, posts(linkedin_content)')
          .eq('id', comment_id)
          .eq('user_id', userId)
          .single();

        if (!comment) {
          return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Get account
        const { data: account } = await serviceSupabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', comment.platform)
          .eq('is_active', true)
          .single();

        if (!account) {
          return NextResponse.json({ error: 'No active account found' }, { status: 400 });
        }

        // Generate reply if not provided
        let finalReply = reply_text;
        if (!finalReply) {
          const post = comment.posts as any;
          finalReply = await generateAIReply(
            comment.content,
            post?.linkedin_content || '',
            'professional and helpful'
          );
        }

        // Post reply
        const authorUrn = `urn:li:person:${account.account_id}`;
        const result = await replyToLinkedInComment(
          account.access_token,
          comment.platform_post_id,
          comment.platform_comment_id,
          finalReply,
          authorUrn
        );

        if (result.success) {
          await serviceSupabase
            .from('comments')
            .update({
              replied: true,
              reply_content: finalReply,
              reply_platform_id: result.replyId,
              replied_at: new Date().toISOString(),
              auto_replied: false,
            })
            .eq('id', comment_id);

          return NextResponse.json({
            success: true,
            message: 'Reply posted',
            reply: finalReply
          });
        } else {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Comments API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}