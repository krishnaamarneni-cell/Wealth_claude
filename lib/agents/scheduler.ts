// ============================================
// Scheduler Service - Automated Tasks
// ============================================

import { createClient } from '@/lib/supabase/server';
import { Agent, Post, Trend } from '@/types/database';
import { generatePostForAgent, discoverTrends } from './content-engine';
import { publishPost } from './buffer';
import { getPerplexityKey, getTrendingTopics } from './perplexity';

// ============================================
// Trend Monitor - Check for new trends
// ============================================

export interface TrendCheckResult {
  agentId: string;
  agentName: string;
  newTrends: string[];
  notificationSent: boolean;
}

/**
 * Check for new trending topics for an agent
 */
export async function checkTrendsForAgent(
  userId: string,
  agent: Agent
): Promise<TrendCheckResult> {
  const supabase = await createClient();

  try {
    // Discover current trends
    const currentTrends = await discoverTrends(userId, agent);

    // Get existing trends from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingTrends } = await supabase
      .from('trends')
      .select('topic')
      .eq('agent_id', agent.id)
      .gte('created_at', oneDayAgo);

    const existingTopics = new Set(existingTrends?.map(t => t.topic.toLowerCase()) || []);

    // Find new trends
    const newTrends = currentTrends.filter(
      trend => !existingTopics.has(trend.toLowerCase())
    );

    // Store new trends
    for (const topic of newTrends) {
      await supabase.from('trends').insert({
        agent_id: agent.id,
        topic,
        source: 'perplexity',
        is_new: true,
        notification_sent: false,
      });
    }

    // Update agent's last trend check time
    await supabase
      .from('agents')
      .update({ last_trend_check_at: new Date().toISOString() })
      .eq('id', agent.id);

    return {
      agentId: agent.id,
      agentName: agent.name,
      newTrends,
      notificationSent: false,
    };

  } catch (error: any) {
    console.error(`[Scheduler] Trend check failed for ${agent.name}:`, error);
    return {
      agentId: agent.id,
      agentName: agent.name,
      newTrends: [],
      notificationSent: false,
    };
  }
}

/**
 * Check trends for all active agents
 */
export async function checkAllAgentTrends(userId: string): Promise<TrendCheckResult[]> {
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!agents || agents.length === 0) {
    return [];
  }

  const results: TrendCheckResult[] = [];
  for (const agent of agents) {
    const result = await checkTrendsForAgent(userId, agent);
    results.push(result);

    // Small delay between agents
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// ============================================
// Auto-Posting - Generate and post content
// ============================================

export interface AutoPostResult {
  agentId: string;
  agentName: string;
  topic: string;
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Check if agent should post (based on frequency and last post time)
 */
export function shouldAgentPost(agent: Agent): boolean {
  if (agent.status !== 'active' || !agent.is_auto_posting) {
    return false;
  }

  if (!agent.last_post_at) {
    return true; // Never posted, should post
  }

  const lastPostTime = new Date(agent.last_post_at).getTime();
  const now = Date.now();
  const intervalMs = agent.posting_frequency_minutes * 60 * 1000;

  return (now - lastPostTime) >= intervalMs;
}

/**
 * Auto-generate and post for an agent
 */
export async function autoPostForAgent(
  userId: string,
  agent: Agent
): Promise<AutoPostResult> {
  const supabase = await createClient();

  try {
    // Get pending approved trend or discover new one
    let topic: string;

    // Check for approved trends first
    const { data: approvedTrend } = await supabase
      .from('trends')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('user_approved', true)
      .eq('post_created', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (approvedTrend) {
      topic = approvedTrend.topic;

      // Mark trend as used
      await supabase
        .from('trends')
        .update({ post_created: true })
        .eq('id', approvedTrend.id);
    } else {
      // Discover new trending topic
      const trends = await discoverTrends(userId, agent);
      if (trends.length === 0) {
        return {
          agentId: agent.id,
          agentName: agent.name,
          topic: '',
          success: false,
          error: 'No trending topics found',
        };
      }
      topic = trends[0];
    }

    // Generate content
    const result = await generatePostForAgent(userId, agent, topic);

    if (!result.success || !result.post) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        topic,
        success: false,
        error: result.error || 'Failed to generate content',
      };
    }

    // Publish immediately if auto-posting enabled
    if (agent.is_auto_posting) {
      const publishResult = await publishPost(userId, result.post, true);

      if (!publishResult.success) {
        return {
          agentId: agent.id,
          agentName: agent.name,
          topic,
          success: false,
          postId: result.post.id,
          error: 'Generated but failed to publish',
        };
      }
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      topic,
      success: true,
      postId: result.post.id,
    };

  } catch (error: any) {
    console.error(`[Scheduler] Auto-post failed for ${agent.name}:`, error);
    return {
      agentId: agent.id,
      agentName: agent.name,
      topic: '',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run auto-posting for all eligible agents
 */
export async function runAutoPosting(userId: string): Promise<AutoPostResult[]> {
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('is_auto_posting', true);

  if (!agents || agents.length === 0) {
    return [];
  }

  const results: AutoPostResult[] = [];

  for (const agent of agents) {
    if (shouldAgentPost(agent)) {
      console.log(`[Scheduler] Auto-posting for agent: ${agent.name}`);
      const result = await autoPostForAgent(userId, agent);
      results.push(result);

      // Delay between posts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

// ============================================
// Scheduled Posts - Process pending scheduled posts
// ============================================

/**
 * Process posts that are due to be published
 */
export async function processScheduledPosts(userId: string): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  const supabase = await createClient();

  // Get posts scheduled for now or earlier
  const { data: duePosts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString());

  if (!duePosts || duePosts.length === 0) {
    return { processed: 0, success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const post of duePosts) {
    const result = await publishPost(userId, post, true);

    if (result.success) {
      success++;
    } else {
      failed++;
    }

    // Small delay between posts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    processed: duePosts.length,
    success,
    failed,
  };
}

// ============================================
// Main Scheduler Runner
// ============================================

export interface SchedulerRunResult {
  timestamp: string;
  trends: TrendCheckResult[];
  autoPosts: AutoPostResult[];
  scheduledPosts: {
    processed: number;
    success: number;
    failed: number;
  };
}

/**
 * Run full scheduler cycle
 */
export async function runSchedulerCycle(userId: string): Promise<SchedulerRunResult> {
  console.log(`[Scheduler] Starting cycle at ${new Date().toISOString()}`);

  // 1. Check for new trends
  const trends = await checkAllAgentTrends(userId);

  // 2. Process scheduled posts
  const scheduledPosts = await processScheduledPosts(userId);

  // 3. Run auto-posting
  const autoPosts = await runAutoPosting(userId);

  const result: SchedulerRunResult = {
    timestamp: new Date().toISOString(),
    trends,
    autoPosts,
    scheduledPosts,
  };

  console.log(`[Scheduler] Cycle complete:`, {
    newTrends: trends.reduce((sum, t) => sum + t.newTrends.length, 0),
    postsPublished: scheduledPosts.success + autoPosts.filter(p => p.success).length,
  });

  return result;
}