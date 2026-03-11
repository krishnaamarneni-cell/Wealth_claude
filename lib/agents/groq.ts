// ============================================
// Groq Service - AI Content Generation
// ============================================

import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { decryptApiKey } from '@/lib/encryption';
import { PostingStyle } from '@/types/database';

export interface GeneratedContent {
  x: string;
  linkedin: string;
  instagram: string;
  hashtags: {
    x: string[];
    linkedin: string[];
    instagram: string[];
  };
}

/**
 * Get Groq API key for user (global or agent-specific)
 */
export async function getGroqKey(userId: string, agentId?: string): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Try agent-specific key first
  if (agentId) {
    const { data: agentKey } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_name', 'groq')
      .eq('agent_id', agentId)
      .single();

    if (agentKey) {
      return decryptApiKey(agentKey.key_value);
    }
  }

  // Fall back to global key
  const { data: globalKey } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('user_id', userId)
    .eq('key_name', 'groq')
    .is('agent_id', null)
    .single();

  if (globalKey) {
    return decryptApiKey(globalKey.key_value);
  }

  return null;
}

/**
 * Generate platform-specific content from research
 */
export async function generateContent(
  apiKey: string,
  topic: string,
  research: string,
  postingStyle: PostingStyle,
  topicInstructions: string
): Promise<GeneratedContent> {
  const systemPrompt = `You are a social media content expert for finance/market topics. Generate engaging, platform-optimized posts.

TOPIC GUIDELINES:
${topicInstructions}

STYLE GUIDELINES:
- Tone: ${postingStyle.tone}
- Emoji usage: ${postingStyle.emoji_usage}
- Hashtag style: ${postingStyle.hashtag_style}

PLATFORM REQUIREMENTS:

X/TWITTER (max 280 chars):
${postingStyle.x_style}

LINKEDIN (professional, 1-3 paragraphs):
${postingStyle.linkedin_style}

INSTAGRAM (visual caption, story-driven):
${postingStyle.instagram_style}

IMPORTANT:
- Each post must be unique and platform-optimized
- Include specific data/numbers from the research
- Make content actionable and valuable
- X posts MUST be under 280 characters

Return your response in this exact JSON format:
{
  "x": "tweet text here",
  "linkedin": "linkedin post here",
  "instagram": "instagram caption here",
  "hashtags": {
    "x": ["tag1", "tag2"],
    "linkedin": ["tag1", "tag2", "tag3"],
    "instagram": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
}`;

  const userPrompt = `Create social media posts about: ${topic}

Research/Context:
${research}

Generate platform-specific content. Return only valid JSON.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content);
    return {
      x: parsed.x || '',
      linkedin: parsed.linkedin || '',
      instagram: parsed.instagram || '',
      hashtags: {
        x: parsed.hashtags?.x || [],
        linkedin: parsed.hashtags?.linkedin || [],
        instagram: parsed.hashtags?.instagram || [],
      },
    };
  } catch (e) {
    throw new Error('Failed to parse Groq response as JSON');
  }
}

/**
 * Generate image prompt from topic and style
 */
export async function generateImagePrompt(
  apiKey: string,
  topic: string,
  basePrompt: string,
  research?: string
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating prompts for AI image generation. Create a detailed, specific prompt for generating a professional finance/data visualization image.

Base style template: ${basePrompt}

Rules:
- Keep the base style elements
- Add topic-specific elements (relevant chart types, data labels, metrics)
- Be specific about composition and visual hierarchy
- Keep prompt under 200 words
- Do not include any text/words that should appear in the image`,
        },
        {
          role: 'user',
          content: `Create an image generation prompt for a visualization about: ${topic}
${research ? `\nContext: ${research.slice(0, 500)}` : ''}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || basePrompt;
}

/**
 * Analyze content for quality and compliance
 */
export async function analyzeContent(
  apiKey: string,
  content: GeneratedContent
): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a content quality analyst. Review social media posts for:
1. Character limits (X/Twitter must be under 280 chars)
2. Engagement potential
3. Professional tone
4. Accuracy and clarity
5. Platform appropriateness

Return JSON: { "isValid": boolean, "issues": ["..."], "suggestions": ["..."] }`,
        },
        {
          role: 'user',
          content: `Analyze these posts:
X (${content.x.length} chars): ${content.x}
LinkedIn: ${content.linkedin}
Instagram: ${content.instagram}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    return { isValid: true, issues: [], suggestions: [] };
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0]?.message?.content || '{}');
  } catch {
    return { isValid: true, issues: [], suggestions: [] };
  }
}
