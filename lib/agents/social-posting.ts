// ============================================
// Social Posting Service - Unified X + LinkedIn
// lib/agents/social-posting.ts
// ============================================

import { createClient } from '@supabase/supabase-js';
import { Post, Agent, SocialAccount } from '@/types/database';
import { postToX, postToXWithMedia } from './x';
import { postToLinkedIn, postToLinkedInWithImage } from './linkedin';

// Service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PublishResult {
  platform: 'x' | 'linkedin';
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface PublishAllResult {
  success: boolean;
  results: PublishResult[];
  error?: string;
}

/**
 * Publish a post to all configured platforms
 */
export async function publishPost(
  postId: string,
  userId: string
): Promise<PublishAllResult> {
  try {
    console.log(`[SocialPosting] Publishing post ${postId} for user ${userId}`);

    // Get the post with agent info
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, agents(*)')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (postError || !post) {
      console.error('[SocialPosting] Post not found:', postError);
      return { success: false, results: [], error: 'Post not found' };
    }

    const agent = post.agents as Agent;
    if (!agent) {
      console.error('[SocialPosting] No agent found for post');
      return { success: false, results: [], error: 'No agent associated with this post' };
    }

    console.log(`[SocialPosting] Agent: ${agent.name}, social_account_ids:`, agent.social_account_ids);

    // Get social accounts linked to this agent
    if (!agent.social_account_ids || agent.social_account_ids.length === 0) {
      console.error('[SocialPosting] No social_account_ids on agent');
      return { success: false, results: [], error: 'No social accounts configured for this agent' };
    }

    // Query accounts using .in() for array of IDs
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .in('id', agent.social_account_ids)
      .eq('is_active', true);

    if (accountsError) {
      console.error('[SocialPosting] Error fetching accounts:', accountsError);
      return { success: false, results: [], error: 'Failed to fetch social accounts' };
    }

    if (!accounts || accounts.length === 0) {
      console.error('[SocialPosting] No active accounts found for IDs:', agent.social_account_ids);
      return { success: false, results: [], error: 'No active social accounts found' };
    }

    console.log(`[SocialPosting] Found ${accounts.length} active accounts`);

    const results: PublishResult[] = [];

    // Publish to each platform
    for (const account of accounts) {
      console.log(`[SocialPosting] Publishing to ${account.platform} (${account.account_name})`);

      try {
        if (account.platform === 'x') {
          const result = await publishToX(post, account);
          results.push(result);

          // Update post with X post ID
          if (result.success && result.postId) {
            await supabase
              .from('posts')
              .update({
                x_post_id: result.postId,
                platforms_posted: supabase.rpc('array_append_unique', {
                  arr: post.platforms_posted || [],
                  elem: 'x'
                })
              })
              .eq('id', postId);
          }
        } else if (account.platform === 'linkedin') {
          const result = await publishToLinkedIn(post, account);
          results.push(result);

          // Update post with LinkedIn post ID
          if (result.success && result.postId) {
            await supabase
              .from('posts')
              .update({
                linkedin_post_id: result.postId,
                platforms_posted: supabase.rpc('array_append_unique', {
                  arr: post.platforms_posted || [],
                  elem: 'linkedin'
                })
              })
              .eq('id', postId);
          }
        }
      } catch (err: any) {
        console.error(`[SocialPosting] Error posting to ${account.platform}:`, err);
        results.push({
          platform: account.platform as 'x' | 'linkedin',
          success: false,
          error: err.message || 'Unknown error',
        });
      }
    }

    // Update post status
    const allSuccess = results.every(r => r.success);
    const anySuccess = results.some(r => r.success);

    await supabase
      .from('posts')
      .update({
        status: anySuccess ? 'published' : 'failed',
        published_at: anySuccess ? new Date().toISOString() : null,
      })
      .eq('id', postId);

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      agent_id: agent.id,
      action_type: 'post_published',
      action_description: `Published to ${results.filter(r => r.success).map(r => r.platform).join(', ')}`,
      related_entity_type: 'post',
      related_entity_id: postId,
      status: anySuccess ? 'success' : 'failed',
      metadata: { results },
    });

    return {
      success: anySuccess,
      results,
    };

  } catch (error: any) {
    console.error('[SocialPosting] Error:', error);
    return {
      success: false,
      results: [],
      error: error.message || 'Failed to publish post',
    };
  }
}

/**
 * Publish to X/Twitter
 */
async function publishToX(post: Post, account: SocialAccount): Promise<PublishResult> {
  try {
    if (!account.access_token) {
      return { platform: 'x', success: false, error: 'No access token' };
    }

    const content = post.x_content || post.topic || '';

    let result;
    if (post.image_url) {
      // Post with image
      result = await postToXWithMedia(
        account.access_token,
        account.refresh_token || '',
        content,
        post.image_url
      );
    } else {
      // Text only
      result = await postToX(
        account.access_token,
        account.refresh_token || '',
        content
      );
    }

    if (result.success) {
      return {
        platform: 'x',
        success: true,
        postId: result.id,
        postUrl: result.url,
      };
    } else {
      return {
        platform: 'x',
        success: false,
        error: result.error || 'Failed to post to X',
      };
    }
  } catch (error: any) {
    return {
      platform: 'x',
      success: false,
      error: error.message || 'X posting error',
    };
  }
}

/**
 * Publish to LinkedIn
 */
async function publishToLinkedIn(post: Post, account: SocialAccount): Promise<PublishResult> {
  try {
    if (!account.access_token) {
      return { platform: 'linkedin', success: false, error: 'No access token' };
    }

    const content = post.linkedin_content || post.topic || '';
    const accountType = account.account_type || 'person';

    let result;
    if (post.image_url) {
      // Post with image
      result = await postToLinkedInWithImage(
        account.access_token,
        account.platform_user_id || '',
        content,
        post.image_url,
        accountType as 'person' | 'organization'
      );
    } else {
      // Text only
      result = await postToLinkedIn(
        account.access_token,
        account.platform_user_id || '',
        content,
        accountType as 'person' | 'organization'
      );
    }

    if (result.success) {
      return {
        platform: 'linkedin',
        success: true,
        postId: result.id,
        postUrl: result.url,
      };
    } else {
      return {
        platform: 'linkedin',
        success: false,
        error: result.error || 'Failed to post to LinkedIn',
      };
    }
  } catch (error: any) {
    return {
      platform: 'linkedin',
      success: false,
      error: error.message || 'LinkedIn posting error',
    };
  }
}

/**
 * Publish to a single platform
 */
export async function publishToSinglePlatform(
  postId: string,
  userId: string,
  platform: 'x' | 'linkedin'
): Promise<PublishResult> {
  try {
    // Get post with agent
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, agents(*)')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (postError || !post) {
      return { platform, success: false, error: 'Post not found' };
    }

    const agent = post.agents as Agent;
    if (!agent?.social_account_ids?.length) {
      return { platform, success: false, error: 'No social accounts configured' };
    }

    // Find account for this platform
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .in('id', agent.social_account_ids)
      .eq('platform', platform)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!accounts) {
      return { platform, success: false, error: `No ${platform} account configured` };
    }

    if (platform === 'x') {
      return publishToX(post, accounts);
    } else {
      return publishToLinkedIn(post, accounts);
    }

  } catch (error: any) {
    return { platform, success: false, error: error.message };
  }
}