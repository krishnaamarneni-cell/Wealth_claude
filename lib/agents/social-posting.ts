// ============================================
// Social Posting Service - Updated
// Supports LinkedIn Personal + Company Pages
// lib/agents/social-posting.ts
// ============================================

import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { Post } from '@/types/database';
import { postTweet, uploadXMedia, getValidXToken } from './x';
import { postToLinkedIn, getValidLinkedInToken, LinkedInAuthorType } from './linkedin';

export interface PostResult {
  platform: 'x' | 'linkedin';
  success: boolean;
  postId?: string;
  accountName?: string;
  error?: string;
}

export interface PublishResults {
  success: boolean;
  results: PostResult[];
  postedAt?: string;
}

/**
 * Publish post to all connected platforms
 */
export async function publishPost(
  userId: string,
  post: Post,
  accountIds: string[]
): Promise<PublishResults> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);
  const results: PostResult[] = [];

  // Get accounts with account_type
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .in('id', accountIds)
    .eq('is_active', true);

  if (!accounts || accounts.length === 0) {
    return {
      success: false,
      results: [{
        platform: 'x',
        success: false,
        error: 'No connected accounts found',
      }],
    };
  }

  // Post to each platform
  for (const account of accounts) {
    try {
      if (account.platform === 'x') {
        const result = await postToX(userId, account.id, post);
        result.accountName = account.account_name;
        results.push(result);
      } else if (account.platform === 'linkedin') {
        const result = await postToLinkedInPlatform(
          userId,
          account.id,
          post,
          account.account_type as LinkedInAuthorType || 'person'
        );
        result.accountName = account.account_name;
        results.push(result);
      }
    } catch (error: any) {
      results.push({
        platform: account.platform,
        success: false,
        accountName: account.account_name,
        error: error.message,
      });
    }
  }

  const allSuccess = results.every(r => r.success);
  const anySuccess = results.some(r => r.success);
  const postedAt = anySuccess ? new Date().toISOString() : undefined;

  // Update post record
  const updateData: any = {
    status: allSuccess ? 'posted' : (anySuccess ? 'posted' : 'failed'),
    posted_at: postedAt,
    platforms_posted: results.filter(r => r.success).map(r => r.platform),
  };

  // Store platform post IDs
  for (const result of results) {
    if (result.success && result.postId) {
      if (result.platform === 'x') {
        updateData.x_post_id = result.postId;
      } else if (result.platform === 'linkedin') {
        updateData.linkedin_post_id = result.postId;
      }
    }
  }

  await supabase
    .from('posts')
    .update(updateData)
    .eq('id', post.id);

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    agent_id: post.agent_id,
    action_type: allSuccess ? 'post_published' : 'post_failed',
    action_description: allSuccess
      ? `Published to: ${results.filter(r => r.success).map(r => r.accountName).join(', ')}`
      : `Failed: ${results.filter(r => !r.success).map(r => `${r.accountName}: ${r.error}`).join(', ')}`,
    related_entity_type: 'post',
    related_entity_id: post.id,
    status: allSuccess ? 'success' : 'failed',
    metadata: { results },
  });

  return {
    success: allSuccess,
    results,
    postedAt,
  };
}

/**
 * Post to X/Twitter
 */
async function postToX(
  userId: string,
  accountId: string,
  post: Post
): Promise<PostResult> {
  const accessToken = await getValidXToken(userId, accountId);

  if (!accessToken) {
    return {
      platform: 'x',
      success: false,
      error: 'X token expired or invalid',
    };
  }

  const content = post.x_content;
  if (!content) {
    return {
      platform: 'x',
      success: false,
      error: 'No X content provided',
    };
  }

  try {
    // Upload media if image exists
    let mediaId: string | undefined;
    if (post.image_url) {
      try {
        mediaId = await uploadXMedia(accessToken, post.image_url);
      } catch (e) {
        console.error('X media upload failed:', e);
      }
    }

    const tweet = await postTweet(accessToken, content, mediaId);

    return {
      platform: 'x',
      success: true,
      postId: tweet.id,
    };
  } catch (error: any) {
    return {
      platform: 'x',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Post to LinkedIn (Personal or Company Page)
 */
async function postToLinkedInPlatform(
  userId: string,
  accountId: string,
  post: Post,
  authorType: LinkedInAuthorType = 'person'
): Promise<PostResult> {
  const tokenData = await getValidLinkedInToken(userId, accountId);

  if (!tokenData) {
    return {
      platform: 'linkedin',
      success: false,
      error: 'LinkedIn token expired or invalid',
    };
  }

  const content = post.linkedin_content;
  if (!content) {
    return {
      platform: 'linkedin',
      success: false,
      error: 'No LinkedIn content provided',
    };
  }

  try {
    const linkedInPost = await postToLinkedIn(
      tokenData.token,
      tokenData.authorId,
      content,
      post.image_url || undefined,
      tokenData.authorType // Use the account type from DB
    );

    return {
      platform: 'linkedin',
      success: true,
      postId: linkedInPost.id,
    };
  } catch (error: any) {
    return {
      platform: 'linkedin',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user's connected social account IDs
 */
export async function getUserSocialAccountIds(userId: string): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);

  return accounts?.map(a => a.id) || [];
}

/**
 * Get agent's social account IDs
 */
export async function getAgentSocialAccountIds(
  userId: string,
  agentId: string
): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  const { data: agent } = await supabase
    .from('agents')
    .select('social_account_ids')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single();

  return agent?.social_account_ids || [];
}