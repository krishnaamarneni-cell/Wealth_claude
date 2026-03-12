// ============================================
// Content Engine - Main Orchestrator
// ============================================

import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Agent, Post, PostInsert } from '@/types/database';
import { getPerplexityKey, researchTopic, getTrendingTopics } from './perplexity';
import { getGroqKey, generateContent, generateImagePrompt } from './groq';
import { generateImage } from './image-generator';
import { getCloudinaryCredentials } from './fal';

export interface ContentGenerationResult {
  success: boolean;
  post?: Post;
  error?: string;
}

export interface ContentPipeline {
  topic: string;
  research: string;
  content: {
    x: string;
    linkedin: string;
    instagram: string;
  };
  imageUrl: string;
}

/**
 * Main content generation pipeline
 * Research → Generate Content → Generate Image → Create Post
 */
export async function generatePostForAgent(
  userId: string,
  agent: Agent,
  topic: string
): Promise<ContentGenerationResult> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  try {
    // Step 1: Get API keys
    const [perplexityKey, groqKey] = await Promise.all([
      getPerplexityKey(userId, agent.id),
      getGroqKey(userId, agent.id),
    ]);

    if (!perplexityKey || !groqKey) {
      return {
        success: false,
        error: 'Missing required API keys (Perplexity or Groq)',
      };
    }

    // Step 2: Research the topic
    console.log(`[ContentEngine] Researching: ${topic}`);
    const research = await researchTopic(perplexityKey, topic, agent.topic_instructions);

    // Step 3: Generate platform-specific content
    console.log(`[ContentEngine] Generating content...`);
    const content = await generateContent(
      groqKey,
      topic,
      research.summary + '\n\nKey Points:\n' + research.keyPoints.join('\n'),
      agent.posting_style,
      agent.topic_instructions
    );

    // Step 4: Generate image prompt and image
    console.log(`[ContentEngine] Generating image...`);
    const imagePrompt = await generateImagePrompt(
      groqKey,
      topic,
      agent.image_style_prompt,
      research.summary
    );

    const imageResult = await generateImage(userId, imagePrompt);

    // Step 5: Upload image to Cloudinary
    let finalImageUrl = imageResult.imageUrl;
    const cloudinaryCredentials = await getCloudinaryCredentials(userId);

    if (cloudinaryCredentials) {
      console.log(`[ContentEngine] Uploading to Cloudinary...`);
      finalImageUrl = await uploadToCloudinary(
        imageResult.imageUrl,
        cloudinaryCredentials.cloudName,
        cloudinaryCredentials.apiKey,
        cloudinaryCredentials.apiSecret,
        `wealthclaude/agents/${agent.id}`
      );
    }

    // Step 6: Create post in database
    const postData: PostInsert = {
      agent_id: agent.id,
      topic,
      research_summary: research.summary,
      x_content: content.x,
      linkedin_content: content.linkedin,
      instagram_content: content.instagram,
      image_prompt: imagePrompt,
      image_url: finalImageUrl,
      status: 'draft',
      platforms: ['x', 'linkedin', 'instagram'],
    };

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({ ...postData, user_id: userId })
      .select()
      .single();

    if (postError) {
      throw new Error(`Failed to create post: ${postError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      agent_id: agent.id,
      action_type: 'post_created',
      action_description: `Generated post about: ${topic}`,
      related_entity_type: 'post',
      related_entity_id: post.id,
      status: 'success',
      metadata: {
        topic,
        has_image: !!finalImageUrl,
        research_sources: research.sources.length,
      },
    });

    console.log(`[ContentEngine] Post created: ${post.id}`);
    return { success: true, post };

  } catch (error: any) {
    console.error('[ContentEngine] Error:', error);

    // Log error
    await supabase.from('activity_logs').insert({
      user_id: userId,
      agent_id: agent.id,
      action_type: 'post_created',
      action_description: `Failed to generate post about: ${topic}`,
      status: 'failed',
      error_message: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Discover trending topics for an agent
 */
export async function discoverTrends(
  userId: string,
  agent: Agent
): Promise<string[]> {
  const perplexityKey = await getPerplexityKey(userId, agent.id);

  if (!perplexityKey) {
    throw new Error('Perplexity API key not found');
  }

  const niche = agent.niche || 'finance and stock market';
  const keywords = agent.trend_keywords || undefined;

  return getTrendingTopics(perplexityKey, niche, keywords);
}

/**
 * Generate multiple posts from trending topics
 */
export async function generateBatchPosts(
  userId: string,
  agent: Agent,
  topics: string[],
  limit = 3
): Promise<ContentGenerationResult[]> {
  const results: ContentGenerationResult[] = [];
  const topicsToProcess = topics.slice(0, limit);

  for (const topic of topicsToProcess) {
    const result = await generatePostForAgent(userId, agent, topic);
    results.push(result);

    // Small delay between generations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Regenerate content for an existing post
 */
export async function regeneratePostContent(
  userId: string,
  postId: string
): Promise<ContentGenerationResult> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Get existing post and agent
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*, agents(*)')
    .eq('id', postId)
    .eq('user_id', userId)
    .single();

  if (postError || !post) {
    return { success: false, error: 'Post not found' };
  }

  const agent = post.agents as Agent;
  if (!post.topic) {
    return { success: false, error: 'Post has no topic' };
  }

  // Regenerate
  return generatePostForAgent(userId, agent, post.topic);
}
