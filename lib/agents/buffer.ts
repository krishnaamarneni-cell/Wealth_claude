// ============================================
// Buffer Service - Social Media Publishing
// ============================================

import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';
import { Post, Platform } from '@/types/database';

export interface BufferPublishResult {
  success: boolean;
  platform: Platform;
  bufferId?: string;
  error?: string;
}

export interface PublishResults {
  success: boolean;
  results: BufferPublishResult[];
  postedAt?: string;
}

/**
 * Get Buffer API key for user
 */
export async function getBufferKey(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('user_id', userId)
    .eq('key_name', 'buffer')
    .is('agent_id', null)
    .single();

  if (data) {
    return decryptApiKey(data.key_value);
  }

  return null;
}

/**
 * Get Buffer profile IDs for an agent
 */
export async function getAgentBufferProfiles(
  userId: string,
  agentId: string
): Promise<string[]> {
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from('agents')
    .select('buffer_profile_ids')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single();

  return agent?.buffer_profile_ids || [];
}

/**
 * Get platform for a Buffer profile ID
 */
export async function getProfilePlatform(
  userId: string,
  profileId: string
): Promise<Platform | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('buffer_accounts')
    .select('platform')
    .eq('user_id', userId)
    .eq('buffer_profile_id', profileId)
    .single();

  return data?.platform || null;
}

/**
 * Publish a single post to Buffer
 */
async function publishToBuffer(
  apiKey: string,
  profileId: string,
  text: string,
  imageUrl?: string,
  scheduledAt?: Date
): Promise<{ success: boolean; id?: string; error?: string }> {
  const body: any = {
    profile_ids: [profileId],
    text,
    now: !scheduledAt,
  };

  // Add media if provided
  if (imageUrl) {
    body.media = {
      photo: imageUrl,
    };
  }

  // Add schedule if provided
  if (scheduledAt) {
    body.scheduled_at = scheduledAt.toISOString();
  }

  const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const data = await response.json();

  if (!data.success) {
    return { success: false, error: data.message || 'Buffer API error' };
  }

  return {
    success: true,
    id: data.updates?.[0]?.id || data.update?.id
  };
}

/**
 * Publish post to all configured platforms
 */
export async function publishPost(
  userId: string,
  post: Post,
  immediate = false
): Promise<PublishResults> {
  const supabase = await createClient();
  const results: BufferPublishResult[] = [];

  // Get Buffer API key
  const bufferKey = await getBufferKey(userId);
  if (!bufferKey) {
    return {
      success: false,
      results: [{
        success: false,
        platform: 'x',
        error: 'Buffer API key not found',
      }],
    };
  }

  // Get agent's Buffer profiles
  const profileIds = await getAgentBufferProfiles(userId, post.agent_id);
  if (profileIds.length === 0) {
    return {
      success: false,
      results: [{
        success: false,
        platform: 'x',
        error: 'No Buffer accounts configured for this agent',
      }],
    };
  }

  // Get profile-to-platform mapping
  const { data: accounts } = await supabase
    .from('buffer_accounts')
    .select('buffer_profile_id, platform')
    .eq('user_id', userId)
    .in('buffer_profile_id', profileIds);

  const profilePlatformMap: Record<string, Platform> = {};
  for (const account of accounts || []) {
    profilePlatformMap[account.buffer_profile_id] = account.platform;
  }

  // Publish to each profile
  for (const profileId of profileIds) {
    const platform = profilePlatformMap[profileId];
    if (!platform) continue;

    // Get platform-specific content
    let content = '';
    switch (platform) {
      case 'x':
        content = post.x_content || '';
        break;
      case 'linkedin':
        content = post.linkedin_content || '';
        break;
      case 'instagram':
        content = post.instagram_content || '';
        break;
    }

    if (!content) {
      results.push({
        success: false,
        platform,
        error: `No content for ${platform}`,
      });
      continue;
    }

    // Determine schedule time
    const scheduleTime = immediate ? undefined :
      (post.scheduled_for ? new Date(post.scheduled_for) : undefined);

    try {
      const result = await publishToBuffer(
        bufferKey,
        profileId,
        content,
        post.image_url || undefined,
        scheduleTime
      );

      results.push({
        success: result.success,
        platform,
        bufferId: result.id,
        error: result.error,
      });
    } catch (error: any) {
      results.push({
        success: false,
        platform,
        error: error.message,
      });
    }
  }

  const allSuccess = results.every(r => r.success);
  const anySuccess = results.some(r => r.success);
  const postedAt = anySuccess ? new Date().toISOString() : undefined;

  // Update post record
  const bufferPostIds: Record<string, string> = {};
  const postingErrors: Record<string, string> = {};

  for (const result of results) {
    if (result.bufferId) {
      bufferPostIds[result.platform] = result.bufferId;
    }
    if (result.error) {
      postingErrors[result.platform] = result.error;
    }
  }

  await supabase
    .from('posts')
    .update({
      status: allSuccess ? 'posted' : (anySuccess ? 'posted' : 'failed'),
      posted_at: postedAt,
      buffer_post_ids: bufferPostIds,
      posting_errors: Object.keys(postingErrors).length > 0 ? postingErrors : null,
    })
    .eq('id', post.id);

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    agent_id: post.agent_id,
    action_type: allSuccess ? 'post_published' : 'post_failed',
    action_description: allSuccess
      ? `Published post to ${results.length} platform(s)`
      : `Failed to publish: ${results.filter(r => !r.success).map(r => r.error).join(', ')}`,
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
 * Schedule a post for later
 */
export async function schedulePost(
  userId: string,
  postId: string,
  scheduledFor: Date
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('posts')
    .update({
      status: 'scheduled',
      scheduled_for: scheduledFor.toISOString(),
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action_type: 'post_scheduled',
    action_description: `Post scheduled for ${scheduledFor.toLocaleString()}`,
    related_entity_type: 'post',
    related_entity_id: postId,
    status: 'success',
  });

  return { success: true };
}

/**
 * Cancel a scheduled post
 */
export async function cancelPost(
  userId: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('posts')
    .update({
      status: 'cancelled',
      scheduled_for: null,
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action_type: 'post_cancelled',
    action_description: 'Post cancelled',
    related_entity_type: 'post',
    related_entity_id: postId,
    status: 'success',
  });

  return { success: true };
}