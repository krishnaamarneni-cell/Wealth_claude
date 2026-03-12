// ============================================
// Perplexity API - Research & Trends
// lib/agents/perplexity.ts
// ============================================

import { createClient } from '@supabase/supabase-js';
import { decryptApiKey } from '@/lib/encryption';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// ============================================
// Get Perplexity API Key
// ============================================
export async function getPerplexityKey(userId: string, agentId?: string): Promise<string | null> {
  // Try environment variable first (most reliable)
  if (process.env.PERPLEXITY_API_KEY) {
    return process.env.PERPLEXITY_API_KEY;
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
      .eq('key_type', 'perplexity')
      .single();

    if (!data?.encrypted_value) return null;

    return decrypt(data.encrypted_value);
  } catch (error) {
    console.error('Failed to get Perplexity key:', error);
    return null;
  }
}

// ============================================
// Research a Topic
// ============================================
export interface ResearchResult {
  summary: string;
  keyPoints: string[];
  sources: string[];
}

export async function researchTopic(
  apiKey: string,
  topic: string,
  additionalInstructions?: string
): Promise<ResearchResult> {
  const systemPrompt = `You are a research assistant. Provide comprehensive, accurate research on the given topic.
${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}

Return your research in this exact JSON format:
{
  "summary": "A 2-3 paragraph summary of the topic",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "sources": ["Source 1", "Source 2", "Source 3"]
}`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Research this topic thoroughly: ${topic}` },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
        content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return {
          summary: parsed.summary || content,
          keyPoints: parsed.keyPoints || [],
          sources: parsed.sources || [],
        };
      }
    } catch {
      // If JSON parsing fails, return as plain text
    }

    return {
      summary: content,
      keyPoints: [],
      sources: [],
    };

  } catch (error: any) {
    console.error('Research error:', error);
    throw new Error(`Failed to research topic: ${error.message}`);
  }
}

// ============================================
// Get Trending Topics
// ============================================
export async function getTrendingTopics(
  apiKey: string,
  niche: string,
  keywords?: string[]
): Promise<string[]> {
  const keywordContext = keywords?.length
    ? `Focus on these areas: ${keywords.join(', ')}.`
    : '';

  const systemPrompt = `You are a trend analyst specializing in ${niche}. 
Find the top 5 most relevant trending topics for social media content.
${keywordContext}

Return ONLY a JSON array of strings, no other text:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `What are the top 5 trending topics in ${niche} right now that would make great social media content?` },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON array from response
    try {
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const topics = JSON.parse(jsonMatch[0]);
        if (Array.isArray(topics)) {
          return topics.slice(0, 5);
        }
      }
    } catch {
      // If parsing fails, extract topics manually
    }

    // Fallback: split by newlines or commas
    const lines = content.split(/[\n,]/)
      .map((line: string) => line.replace(/^[\d\.\-\*\s]+/, '').trim())
      .filter((line: string) => line.length > 10 && line.length < 200);

    return lines.slice(0, 5);

  } catch (error: any) {
    console.error('Trending topics error:', error);
    throw new Error(`Failed to get trending topics: ${error.message}`);
  }
}

// ============================================
// Quick Search (for Telegram bot)
// ============================================
export async function quickSearch(
  apiKey: string,
  query: string
): Promise<string> {
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Provide concise, accurate answers. Include specific numbers, dates, and facts when available. Keep responses under 300 words.'
          },
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No results found.';

  } catch (error: any) {
    throw new Error(`Search failed: ${error.message}`);
  }
}
