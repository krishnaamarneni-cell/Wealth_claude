/**
 * Phase 6 — Steps 23 & 24: AI Chat Logger
 * 
 * Logs every AI chat request to the ai_chat_logs table.
 * Called from the main route.ts after each response.
 * Non-blocking — errors are caught and logged, never thrown.
 * 
 * Place this file at: lib/ai-chat/chat-logger.ts
 */

import { SupabaseClient } from '@supabase/supabase-js'

interface LogEntry {
  userId: string
  conversationId?: string
  message: string
  response: string
  category: string          // portfolio | market | mixed
  route: string             // groq | perplexity | perplexity+groq | mistral-fallback
  model?: string
  tokensUsed?: number
  responseTimeMs: number
  success: boolean
  errorMessage?: string
}

/**
 * Log an AI chat request to Supabase.
 * This is fire-and-forget — we don't await it in the main route
 * to avoid slowing down the response.
 */
export async function logChatRequest(
  supabase: SupabaseClient,
  entry: LogEntry
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_chat_logs')
      .insert({
        user_id: entry.userId,
        conversation_id: entry.conversationId || null,
        message: entry.message.substring(0, 2000),    // Truncate long messages
        response: entry.response.substring(0, 5000),   // Truncate long responses
        category: entry.category,
        route: entry.route,
        model: entry.model || getModelForRoute(entry.route),
        tokens_used: entry.tokensUsed || 0,
        response_time_ms: entry.responseTimeMs,
        success: entry.success,
        error_message: entry.errorMessage || null,
      })

    if (error) {
      console.error('[Chat Logger] Failed to log:', error.message)
    }
  } catch (err) {
    // Never throw — logging should not break the chat
    console.error('[Chat Logger] Error:', err)
  }
}

function getModelForRoute(route: string): string {
  switch (route) {
    case 'groq':
      return 'llama-3.3-70b-versatile'
    case 'perplexity':
      return 'sonar'
    case 'perplexity+groq':
      return 'sonar + llama-3.3-70b-versatile'
    case 'mistral-fallback':
      return 'mistral-large-latest'
    default:
      return 'unknown'
  }
}