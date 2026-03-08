/**
 * Phase 5 — Step 18: Mistral Fallback
 * 
 * When Groq returns 429 (rate limited), automatically retry with Mistral.
 * Uses Mistral's API which is compatible with OpenAI-style requests.
 * 
 * Place this file at: lib/ai-chat/mistral-client.ts
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const MISTRAL_MODEL = 'mistral-large-latest'

interface MistralResponse {
  content: string
  success: boolean
  error?: string
}

export async function callMistral(
  systemPrompt: string,
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<MistralResponse> {
  const apiKey = process.env.MISTRAL_API_KEY

  if (!apiKey) {
    console.error('[Mistral] MISTRAL_API_KEY is not set')
    return {
      content: '',
      success: false,
      error: 'Mistral API key is not configured',
    }
  }

  try {
    const recentHistory = chatHistory.slice(-10)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ]

    console.log('[Mistral] Calling Mistral as fallback...')

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Mistral] API error:', response.status, errorText)
      return {
        content: '',
        success: false,
        error: `Mistral API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    console.log('[Mistral] Fallback response received successfully')

    return {
      content,
      success: true,
    }
  } catch (error) {
    console.error('[Mistral] Error:', error)
    return {
      content: '',
      success: false,
      error: 'Failed to call Mistral',
    }
  }
}