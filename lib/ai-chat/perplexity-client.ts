/**
 * Phase 4 — Step 16: Perplexity Client
 * 
 * Handles real-time market questions via Perplexity's Sonar API.
 * Returns concise, sourced market data that can be:
 *   - Returned directly for "market" questions
 *   - Fed into Groq as context for "mixed" questions
 * 
 * Place this file at: lib/ai-chat/perplexity-client.ts
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'
const PERPLEXITY_MODEL = 'sonar'  // Perplexity's search-grounded model

interface PerplexityResponse {
  content: string
  citations: string[]
  success: boolean
  error?: string
}

/**
 * Query Perplexity for real-time market data.
 * Returns a concise, factual response with sources.
 */
export async function queryPerplexity(
  userMessage: string,
  searchQuery: string
): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY

  if (!apiKey) {
    console.error('[Perplexity] PERPLEXITY_API_KEY is not set')
    return {
      content: '',
      citations: [],
      success: false,
      error: 'Perplexity API key is not configured',
    }
  }

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a financial market research assistant. Provide concise, factual, up-to-date market information.

RULES:
- Focus on facts: prices, percentages, dates, analyst ratings.
- Include specific numbers whenever available.
- Do NOT give investment advice or say "should buy/sell".
- State facts and let the user decide.
- Bold all **dollar amounts**, **percentages**, and **ticker symbols**.

FORMAT — adapt to the question:
- **Price check** ("what is X price"): One sentence with the price + change. No table needed.
- **Stock research** ("tell me about X", "X earnings"): Bold summary → metrics table → 2-3 bullet points of news.
- **Market overview** ("market today", "how are markets"): Bold summary → bullet points for major indices → key driver.
- **Why question** ("why did X drop"): Bold answer → 2-3 bullet points explaining reasons.
- Keep responses 100-300 words. Match length to question complexity.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.1,        // Low temp for factual responses
        max_tokens: 512,
        return_citations: true,
        search_recency_filter: 'week',  // Prioritize recent data
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Perplexity] API error:', response.status, errorText)

      if (response.status === 429) {
        return {
          content: '',
          citations: [],
          success: false,
          error: 'Rate limited — too many market data requests',
        }
      }

      return {
        content: '',
        citations: [],
        success: false,
        error: `Perplexity API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const citations = data.citations ?? []

    return {
      content,
      citations,
      success: true,
    }
  } catch (error) {
    console.error('[Perplexity] Error:', error)
    return {
      content: '',
      citations: [],
      success: false,
      error: 'Failed to fetch market data',
    }
  }
}

/**
 * Format Perplexity response for direct display to user.
 * Used for pure "market" questions.
 */
export function formatMarketResponse(perplexityResult: PerplexityResponse): string {
  if (!perplexityResult.success || !perplexityResult.content) {
    return "I couldn't fetch the latest market data right now. Please try again in a moment."
  }

  let response = perplexityResult.content

  // Add source links if available
  if (perplexityResult.citations.length > 0) {
    response += '\n\n📰 **Sources:**\n'
    perplexityResult.citations.slice(0, 3).forEach((url, i) => {
      // Extract domain name for cleaner display
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        response += `${i + 1}. [${domain}](${url})\n`
      } catch {
        response += `${i + 1}. ${url}\n`
      }
    })
  }

  response += '\n\n*Market data is sourced from the web and may be slightly delayed. This is not financial advice.*'

  return response
}

/**
 * Format Perplexity response as context for Groq (mixed questions).
 * This is injected into the Groq system prompt so it can reason over both.
 */
export function formatAsGroqContext(perplexityResult: PerplexityResponse): string {
  if (!perplexityResult.success || !perplexityResult.content) {
    return '=== MARKET DATA ===\nReal-time market data is temporarily unavailable.\n\n'
  }

  let context = '=== REAL-TIME MARKET DATA (from web search) ===\n'
  context += perplexityResult.content
  context += '\n'

  if (perplexityResult.citations.length > 0) {
    context += '\nSources: ' + perplexityResult.citations.slice(0, 3).join(', ')
  }

  context += '\n\n'

  return context
}