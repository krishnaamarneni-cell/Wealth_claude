// ============================================
// Groq API - Content Generation
// lib/agents/groq.ts
// ============================================

import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// ============================================
// Get Groq API Key
// ============================================
export async function getGroqKey(userId: string, agentId?: string): Promise<string | null> {
  // Try environment variable first (most reliable)
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }

  // Fallback to database
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from('api_keys')
      .select('encrypted_value')
      .eq('user_id', userId)
      .eq('key_type', 'groq')
      .single();

    if (!data?.encrypted_value) return null;

    return decrypt(data.encrypted_value);
  } catch (error) {
    console.error('Failed to get Groq key:', error);
    return null;
  }
}

// ============================================
// Generate Platform-Specific Content
// ============================================
export interface GeneratedContent {
  x: string;
  linkedin: string;
  instagram: string;
}

export async function generateContent(
  apiKey: string,
  topic: string,
  research: string,
  postingStyle?: string,
  additionalInstructions?: string
): Promise<GeneratedContent> {
  const styleGuide = postingStyle || 'professional, engaging, and informative';

  const systemPrompt = `You are an expert social media content creator.
Writing style: ${styleGuide}
${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}

Create engaging content for each platform based on the research provided.

Rules:
- X (Twitter): Max 280 characters. Punchy, engaging, use relevant hashtags (2-3 max)
- LinkedIn: 150-300 words. Professional tone, thought leadership, encourage discussion
- Instagram: 150-200 words. Engaging caption, emoji-friendly, 5-10 relevant hashtags at end

Return ONLY valid JSON in this exact format:
{
  "x": "Your X/Twitter post here (max 280 chars)",
  "linkedin": "Your LinkedIn post here",
  "instagram": "Your Instagram caption here"
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create social media posts about: ${topic}\n\nResearch:\n${research}`
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
        content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        return {
          x: (parsed.x || parsed.twitter || '').substring(0, 280),
          linkedin: parsed.linkedin || '',
          instagram: parsed.instagram || '',
        };
      }
    } catch (parseError) {
      console.error('Failed to parse content JSON:', parseError);
    }

    // Fallback: return the raw content for all platforms
    return {
      x: content.substring(0, 280),
      linkedin: content,
      instagram: content,
    };

  } catch (error: any) {
    console.error('Content generation error:', error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

// ============================================
// Generate Image Prompt
// ============================================
export async function generateImagePrompt(
  apiKey: string,
  topic: string,
  imageStylePrompt?: string,
  context?: string
): Promise<string> {
  const styleGuide = imageStylePrompt || 'professional, modern, clean design';

  const systemPrompt = `You are an expert at creating prompts for AI image generators.
Style preference: ${styleGuide}

Create a detailed, visual prompt for an AI image generator. The image should be:
- Professional and suitable for social media
- Visually striking and engaging
- Relevant to the topic

Return ONLY the image prompt, nothing else. Keep it under 200 words.
Do NOT include any text overlays or words in the image description.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create an image prompt for: ${topic}${context ? `\n\nContext: ${context}` : ''}`
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content || '';

    return prompt.trim();

  } catch (error: any) {
    console.error('Image prompt generation error:', error);
    // Fallback to a basic prompt
    return `Professional, modern illustration representing ${topic}. Clean design, suitable for social media, high quality.`;
  }
}

// ============================================
// Intent Classification (for Telegram bot)
// ============================================
export interface IntentResult {
  intent: string;
  topic?: string;
  confidence: number;
}

export async function classifyIntent(
  apiKey: string,
  message: string
): Promise<IntentResult> {
  const systemPrompt = `You are an intent classifier. Classify the user's message into one of these intents:

- SEARCH: User wants information, news, prices, data
- CREATE_POST: User wants to create a social media post
- DISCOVER_TRENDS: User wants to see trending topics
- CHECK_STATUS: User wants system status
- VIEW_QUEUE: User wants to see pending posts
- PUBLISH: User wants to publish a post
- GREETING: User is greeting
- HELP: User needs help
- OTHER: Doesn't fit above categories

Respond with JSON only:
{"intent": "INTENT_NAME", "topic": "extracted topic if relevant", "confidence": 0.95}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Intent classification failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"intent": "OTHER"}';

    try {
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
      return {
        intent: parsed.intent || 'OTHER',
        topic: parsed.topic,
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      return { intent: 'OTHER', confidence: 0.5 };
    }

  } catch (error) {
    return { intent: 'OTHER', confidence: 0.5 };
  }
}

// ============================================
// Chat Response (for Telegram bot)
// ============================================
export async function generateChatResponse(
  apiKey: string,
  message: string,
  context?: string
): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for social media management. Be concise and friendly.${context ? `\n\nContext: ${context}` : ''}`
          },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat response failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I couldn\'t process that request.';

  } catch (error: any) {
    throw new Error(`Chat failed: ${error.message}`);
  }
}

// ============================================
// Improve/Rewrite Content
// ============================================
export async function improveContent(
  apiKey: string,
  content: string,
  platform: 'x' | 'linkedin' | 'instagram',
  instruction: string
): Promise<string> {
  const platformRules: Record<string, string> = {
    x: 'Max 280 characters. Punchy and engaging.',
    linkedin: '150-300 words. Professional tone.',
    instagram: '150-200 words. Emoji-friendly, hashtags at end.',
  };

  const systemPrompt = `You are a social media expert. Improve the given content.
Platform: ${platform}
Rules: ${platformRules[platform]}
Instruction: ${instruction}

Return ONLY the improved content, nothing else.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Improve this content:\n\n${content}` },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Content improvement failed');
    }

    const data = await response.json();
    let improved = data.choices?.[0]?.message?.content || content;

    // Enforce X character limit
    if (platform === 'x') {
      improved = improved.substring(0, 280);
    }

    return improved;

  } catch (error: any) {
    console.error('Content improvement error:', error);
    return content; // Return original on error
  }
}