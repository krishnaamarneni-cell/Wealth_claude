// ============================================
// Comment Automation Service
// lib/agents/comments.ts
// ============================================

import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { getTweetReplies, replyToTweet, getValidXToken } from './x';
import { getLinkedInComments, replyToLinkedInComment, getValidLinkedInToken } from './linkedin';
import { getGroqKey } from './groq';

// ============================================
// Fetch Comments
// ============================================

/**
 * Fetch comments for all recent posts
 */
export async function fetchCommentsForUser(userId: string): Promise<{
  fetched: number;
  newComments: number;
}> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Get recent posts with platform IDs
  const { data: posts } = await supabase
    .from('posts')
    .select('id, agent_id, x_post_id, linkedin_post_id')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!posts || posts.length === 0) {
    return { fetched: 0, newComments: 0 };
  }

  let fetched = 0;
  let newComments = 0;

  // Get social accounts
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  const xAccount = accounts?.find(a => a.platform === 'x');
  const linkedinAccount = accounts?.find(a => a.platform === 'linkedin');

  for (const post of posts) {
    // Fetch X comments
    if (post.x_post_id && xAccount) {
      const xToken = await getValidXToken(userId, xAccount.id);
      if (xToken) {
        try {
          const replies = await getTweetReplies(xToken, post.x_post_id);
          fetched += replies.length;

          for (const reply of replies) {
            const { data: existing } = await supabase
              .from('comments')
              .select('id')
              .eq('platform_comment_id', reply.id)
              .single();

            if (!existing) {
              await supabase.from('comments').insert({
                user_id: userId,
                post_id: post.id,
                platform: 'x',
                platform_comment_id: reply.id,
                platform_post_id: post.x_post_id,
                author_id: reply.author_id,
                content: reply.text,
              });
              newComments++;
            }
          }
        } catch (e) {
          console.error('Failed to fetch X comments:', e);
        }
      }
    }

    // Fetch LinkedIn comments
    if (post.linkedin_post_id && linkedinAccount) {
      const linkedinData = await getValidLinkedInToken(userId, linkedinAccount.id);
      if (linkedinData) {
        try {
          const comments = await getLinkedInComments(linkedinData.token, post.linkedin_post_id);
          fetched += comments.length;

          for (const comment of comments) {
            const { data: existing } = await supabase
              .from('comments')
              .select('id')
              .eq('platform_comment_id', comment.id)
              .single();

            if (!existing) {
              await supabase.from('comments').insert({
                user_id: userId,
                post_id: post.id,
                platform: 'linkedin',
                platform_comment_id: comment.id,
                platform_post_id: post.linkedin_post_id,
                author_id: comment.author,
                content: comment.text,
              });
              newComments++;
            }
          }
        } catch (e) {
          console.error('Failed to fetch LinkedIn comments:', e);
        }
      }
    }
  }

  return { fetched, newComments };
}

// ============================================
// Generate Reply
// ============================================

/**
 * Generate AI reply for a comment
 */
export async function generateReply(
  userId: string,
  commentId: string
): Promise<{ reply: string } | { error: string }> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Get comment with post context
  const { data: comment } = await supabase
    .from('comments')
    .select('*, posts(topic, x_content, linkedin_content, agents(name, posting_style))')
    .eq('id', commentId)
    .eq('user_id', userId)
    .single();

  if (!comment) {
    return { error: 'Comment not found' };
  }

  const groqKey = await getGroqKey(userId);
  if (!groqKey) {
    return { error: 'Groq API key not configured' };
  }

  const post = comment.posts;
  const agent = post?.agents;
  const postContent = comment.platform === 'x' ? post?.x_content : post?.linkedin_content;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a helpful social media manager. Generate a friendly, professional reply to a comment on a social media post.

Style: ${agent?.posting_style?.tone || 'professional'}
Platform: ${comment.platform === 'x' ? 'Twitter/X (keep under 280 chars)' : 'LinkedIn'}

Rules:
- Be genuine and engaging
- Address the commenter's point
- Keep it concise
- No hashtags in replies
- Sound human, not robotic`,
        },
        {
          role: 'user',
          content: `Original post: "${postContent}"

Comment to reply to: "${comment.content}"

Generate a reply:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    return { error: 'Failed to generate reply' };
  }

  const data = await response.json();
  const reply = data.choices[0]?.message?.content?.trim() || '';

  return { reply };
}

// ============================================
// Post Reply
// ============================================

/**
 * Post a reply to a comment
 */
export async function postReply(
  userId: string,
  commentId: string,
  replyText: string,
  autoReplied = false
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Get comment
  const { data: comment } = await supabase
    .from('comments')
    .select('*')
    .eq('id', commentId)
    .eq('user_id', userId)
    .single();

  if (!comment) {
    return { success: false, error: 'Comment not found' };
  }

  // Get social account
  const { data: account } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', comment.platform)
    .eq('is_active', true)
    .single();

  if (!account) {
    return { success: false, error: 'No connected account for this platform' };
  }

  try {
    let replyPlatformId: string;

    if (comment.platform === 'x') {
      const token = await getValidXToken(userId, account.id);
      if (!token) {
        return { success: false, error: 'X token expired' };
      }
      const result = await replyToTweet(token, comment.platform_comment_id, replyText);
      replyPlatformId = result.id;
    } else {
      const tokenData = await getValidLinkedInToken(userId, account.id);
      if (!tokenData) {
        return { success: false, error: 'LinkedIn token expired' };
      }
      const result = await replyToLinkedInComment(
        tokenData.token,
        comment.platform_post_id,
        comment.platform_comment_id,
        replyText,
        tokenData.authorId
      );
      replyPlatformId = result.id;
    }

    // Update comment record
    await supabase
      .from('comments')
      .update({
        replied: true,
        reply_content: replyText,
        reply_platform_id: replyPlatformId,
        replied_at: new Date().toISOString(),
        auto_replied: autoReplied,
      })
      .eq('id', commentId);

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action_type: 'comment_replied',
      action_description: `Replied to ${comment.platform} comment`,
      status: 'success',
    });

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Auto-Reply Job
// ============================================

/**
 * Process pending comments and auto-reply
 */
export async function processAutoReplies(userId: string): Promise<{
  processed: number;
  replied: number;
}> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Get agents with auto-reply enabled
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .eq('auto_reply_enabled', true);

  if (!agents || agents.length === 0) {
    return { processed: 0, replied: 0 };
  }

  const agentIds = agents.map(a => a.id);

  // Get unreplied comments for these agents
  const { data: comments } = await supabase
    .from('comments')
    .select('*, posts!inner(agent_id)')
    .eq('user_id', userId)
    .eq('replied', false)
    .in('posts.agent_id', agentIds)
    .order('created_at', { ascending: true })
    .limit(10);

  if (!comments || comments.length === 0) {
    return { processed: 0, replied: 0 };
  }

  let replied = 0;

  for (const comment of comments) {
    // Generate reply
    const replyResult = await generateReply(userId, comment.id);

    if ('error' in replyResult) {
      console.error('Failed to generate reply:', replyResult.error);
      continue;
    }

    // Post reply
    const postResult = await postReply(userId, comment.id, replyResult.reply, true);

    if (postResult.success) {
      replied++;
    }

    // Small delay between replies
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { processed: comments.length, replied };
}