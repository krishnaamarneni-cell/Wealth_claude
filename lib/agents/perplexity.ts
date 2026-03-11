// ============================================
// Perplexity Service - Web Research
// ============================================

import { createServerSideClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { decryptApiKey } from '@/lib/encryption';

export interface ResearchResult {
  summary: string;
  keyPoints: string[];
  sources: string[];
  rawResponse: string;
}

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Get Perplexity API key for user (global or agent-specific)
 */
export async function getPerplexityKey(userId: string, agentId?: string): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerSideClient(cookieStore);

  // Try agent-specific key first
  if (agentId) {
    const { data: agentKey } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_name', 'perplexity')
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
    .eq('key_name', 'perplexity')
    .is('agent_id', null)
    .single();

  if (globalKey) {
    return decryptApiKey(globalKey.key_value);
  }

  return null;
}

/**
 * Research a topic using Perplexity AI
 */
export async function researchTopic(
  apiKey: string,
  topic: string,
  context?: string
): Promise<ResearchResult> {
  const systemPrompt = `You are a financial research assistant. Provide accurate, up-to-date information about market news and trends.

When researching a topic:
1. Focus on the most recent and relevant information
2. Include specific data points, numbers, and statistics when available
3. Cite your sources
4. Highlight actionable insights

${context ? `Additional context: ${context}` : ''}

Format your response as:
SUMMARY: [2-3 sentence overview]
KEY_POINTS:
- [Point 1]
- [Point 2]
- [Point 3]
SOURCES: [List URLs or source names]`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Research the latest news and insights about: ${topic}` },
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
  const content = data.choices[0]?.message?.content || '';

  return parseResearchResponse(content);
}

/**
 * Get trending topics in a specific niche
 */
export async function getTrendingTopics(
  apiKey: string,
  niche: string,
  keywords?: string[]
): Promise<string[]> {
  const keywordContext = keywords?.length
    ? `Focus especially on topics related to: ${keywords.join(', ')}`
    : '';

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
          content: `You are a trend analyst. Identify the most important trending topics and breaking news in a given niche. Return only the topic names, one per line, no numbering or bullets. ${keywordContext}`,
        },
        {
          role: 'user',
          content: `What are the top 5 trending topics in ${niche} right now? Include any breaking news or market-moving events from the last 24 hours.`,
        },
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
  const content = data.choices[0]?.message?.content || '';

  // Parse topics from response
  const topics = content
    .split('\n')
    .map((line: string) => line.replace(/^[\d\-\*\.\)]+\s*/, '').trim())
    .filter((line: string) => line.length > 0 && line.length < 200);

  return topics.slice(0, 5);
}

/**
 * Parse research response into structured format
 */
function parseResearchResponse(content: string): ResearchResult {
  const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?=KEY_POINTS:|$)/s);
  const keyPointsMatch = content.match(/KEY_POINTS:\s*(.+?)(?=SOURCES:|$)/s);
  const sourcesMatch = content.match(/SOURCES:\s*(.+?)$/s);

  const summary = summaryMatch?.[1]?.trim() || content.slice(0, 500);

  const keyPoints = keyPointsMatch?.[1]
    ?.split('\n')
    .map(line => line.replace(/^[\-\*]\s*/, '').trim())
    .filter(line => line.length > 0) || [];

  const sources = sourcesMatch?.[1]
    ?.split('\n')
    .map(line => line.replace(/^[\-\*]\s*/, '').trim())
    .filter(line => line.length > 0) || [];

  return {
    summary,
    keyPoints,
    sources,
    rawResponse: content,
  };
}
