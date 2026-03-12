// ============================================
// Comments Service - Fetch & Reply
// lib/agents/comments.ts
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LINKEDIN_API_URL = 'https://api.linkedin.com';

export interface Comment {
  id: string;
  platform: 'x' | 'linkedin';
  platform_comment_id: string;
  platform_post_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url?: string;
  content: string;
  created_at: string;
}

export interface CommentReplyResult {
  success: boolean;
  replyId?: string;
  error?: string;
}

// ============================================
// Fetch LinkedIn Comments
// ============================================
export async function fetchLinkedInComments(
  accessToken: string,
  postUrn: string
): Promise<Comment[]> {
  try {
    console.log(`[Comments] Fetching LinkedIn comments for: ${postUrn}`);

    // LinkedIn API for fetching comments
    const response = await fetch(
      `${LINKEDIN_API_URL}/rest/socialActions/${encodeURIComponent(postUrn)}/comments?count=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202504',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Comments] LinkedIn API error:', error);
      return [];
    }

    const data = await response.json();
    const comments: Comment[] = [];

    for (const element of data.elements || []) {
      comments.push({
        id: element.$URN || element.commentUrn || '',
        platform: 'linkedin',
        platform_comment_id: element.$URN || element.commentUrn || '',
        platform_post_id: postUrn,
        author_id: element.actor || '',
        author_name: element.actorName || 'LinkedIn User',
        content: element.message?.text || element.comment || '',
        created_at: new Date(element.created?.time || Date.now()).toISOString(),
      });
    }

    console.log(`[Comments] Found ${comments.length} LinkedIn comments`);
    return comments;

  } catch (error: any) {
    console.error('[Comments] Fetch error:', error);
    return [];
  }
}

// ============================================
// Reply to LinkedIn Comment
// ============================================
export async function replyToLinkedInComment(
  accessToken: string,
  postUrn: string,
  commentUrn: string,
  replyText: string,
  authorUrn: string
): Promise<CommentReplyResult> {
  try {
    console.log(`[Comments] Replying to LinkedIn comment: ${commentUrn}`);

    const response = await fetch(
      `${LINKEDIN_API_URL}/rest/socialActions/${encodeURIComponent(postUrn)}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202504',
        },
        body: JSON.stringify({
          actor: authorUrn,
          message: {
            text: replyText,
          },
          parentComment: commentUrn,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Comments] Reply error:', error);
      return { success: false, error };
    }

    const replyId = response.headers.get('x-restli-id') || '';
    console.log(`[Comments] Reply posted: ${replyId}`);

    return { success: true, replyId };

  } catch (error: any) {
    console.error('[Comments] Reply error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Generate AI Reply using Groq
// ============================================
export async function generateAIReply(
  comment: string,
  postContent: string,
  replyStyle: string = 'professional and helpful'
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    throw new Error('Groq API key not configured');
  }

  try {
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
            content: `You are a social media manager replying to comments. 
Your reply style: ${replyStyle}

Rules:
- Keep replies concise (1-3 sentences)
- Be genuine and engaging
- Address the commenter's point
- Don't be overly promotional
- Match the tone of the original post
- Use emojis sparingly (0-1 per reply)
- Never be defensive or argumentative`
          },
          {
            role: 'user',
            content: `Original post: "${postContent}"

Comment to reply to: "${comment}"

Generate a reply:`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error('Groq API error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Thanks for your comment!';

  } catch (error: any) {
    console.error('[Comments] AI reply error:', error);
    return 'Thanks for your comment! 🙏';
  }
}

// ============================================
// Fetch and Store Comments for All Published Posts
// ============================================
export async function fetchAllComments(userId: string): Promise<number> {
  try {
    console.log(`[Comments] Fetching comments for user: ${userId}`);

    // Get published posts with LinkedIn post IDs
    const { data: posts } = await supabase
      .from('posts')
      .select('id, linkedin_post_id, linkedin_content, agents(social_account_ids)')
      .eq('user_id', userId)
      .eq('status', 'published')
      .not('linkedin_post_id', 'is', null);

    if (!posts || posts.length === 0) {
      console.log('[Comments] No published posts found');
      return 0;
    }

    // Get LinkedIn accounts
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'linkedin')
      .eq('is_active', true);

    if (!accounts || accounts.length === 0) {
      console.log('[Comments] No LinkedIn accounts found');
      return 0;
    }

    const account = accounts[0];
    let totalComments = 0;

    for (const post of posts) {
      if (!post.linkedin_post_id) continue;

      const comments = await fetchLinkedInComments(
        account.access_token,
        post.linkedin_post_id
      );

      // Store new comments
      for (const comment of comments) {
        const { error } = await supabase
          .from('comments')
          .upsert({
            user_id: userId,
            post_id: post.id,
            platform: 'linkedin',
            platform_comment_id: comment.platform_comment_id,
            platform_post_id: comment.platform_post_id,
            author_id: comment.author_id,
            author_name: comment.author_name,
            content: comment.content,
            fetched_at: new Date().toISOString(),
          }, {
            onConflict: 'platform,platform_comment_id',
          });

        if (!error) totalComments++;
      }
    }

    console.log(`[Comments] Stored ${totalComments} comments`);
    return totalComments;

  } catch (error: any) {
    console.error('[Comments] Fetch all error:', error);
    return 0;
  }
}

// ============================================
// Auto-Reply to Unreplied Comments
// ============================================
export async function autoReplyToComments(userId: string): Promise<number> {
  try {
    console.log(`[Comments] Auto-replying for user: ${userId}`);

    // Get agent settings
    const { data: agents } = await supabase
      .from('agents')
      .select('id, auto_reply_enabled, auto_reply_style, social_account_ids')
      .eq('user_id', userId)
      .eq('auto_reply_enabled', true);

    if (!agents || agents.length === 0) {
      console.log('[Comments] No agents with auto-reply enabled');
      return 0;
    }

    // Get unreplied comments
    const { data: comments } = await supabase
      .from('comments')
      .select('*, posts(linkedin_content, agent_id)')
      .eq('user_id', userId)
      .eq('replied', false)
      .eq('platform', 'linkedin')
      .limit(10); // Process 10 at a time

    if (!comments || comments.length === 0) {
      console.log('[Comments] No unreplied comments');
      return 0;
    }

    // Get LinkedIn account
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'linkedin')
      .eq('is_active', true);

    if (!accounts || accounts.length === 0) {
      console.log('[Comments] No LinkedIn accounts');
      return 0;
    }

    const account = accounts[0];
    const authorUrn = `urn:li:person:${account.account_id}`;
    let repliedCount = 0;

    for (const comment of comments) {
      const post = comment.posts as any;
      const agent = agents.find(a => a.id === post?.agent_id);

      if (!agent) continue;

      // Generate AI reply
      const replyText = await generateAIReply(
        comment.content,
        post?.linkedin_content || '',
        agent.auto_reply_style || 'professional and helpful'
      );

      // Post reply
      const result = await replyToLinkedInComment(
        account.access_token,
        comment.platform_post_id,
        comment.platform_comment_id,
        replyText,
        authorUrn
      );

      if (result.success) {
        // Update comment as replied
        await supabase
          .from('comments')
          .update({
            replied: true,
            reply_content: replyText,
            reply_platform_id: result.replyId,
            replied_at: new Date().toISOString(),
            auto_replied: true,
          })
          .eq('id', comment.id);

        repliedCount++;
      }

      // Rate limit: wait 2 seconds between replies
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`[Comments] Auto-replied to ${repliedCount} comments`);
    return repliedCount;

  } catch (error: any) {
    console.error('[Comments] Auto-reply error:', error);
    return 0;
  }
}