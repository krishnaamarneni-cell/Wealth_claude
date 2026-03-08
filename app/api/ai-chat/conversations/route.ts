/**
 * Phase 6 — Steps 21 & 22: Save & Load Conversations
 * 
 * API route for managing saved AI chat conversations.
 * 
 * POST /api/ai-chat/conversations         → Save/update a conversation
 * GET  /api/ai-chat/conversations         → List user's conversations
 * GET  /api/ai-chat/conversations?id=xxx  → Load a specific conversation
 * DELETE /api/ai-chat/conversations?id=xxx → Delete a conversation
 * 
 * Place this file at: app/api/ai-chat/conversations/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

// ── POST: Save or update a conversation ────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      conversationId,
      title,
      messages,
    }: {
      conversationId?: string
      title?: string
      messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>
    } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Auto-generate title from first user message if not provided
    const autoTitle = title || generateTitle(messages)

    if (conversationId) {
      // Update existing conversation
      const { data, error } = await supabase
        .from('ai_conversations')
        .update({
          title: autoTitle,
          messages: JSON.stringify(messages),
          message_count: messages.length,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('[Conversations] Update error:', error)
        return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
      }

      return NextResponse.json({ success: true, conversation: data })
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: autoTitle,
          messages: JSON.stringify(messages),
          message_count: messages.length,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('[Conversations] Insert error:', error)
        return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 })
      }

      return NextResponse.json({ success: true, conversation: data })
    }
  } catch (error) {
    console.error('[Conversations] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET: List conversations or load a specific one ─────────────────────

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const conversationId = searchParams.get('id')

    if (conversationId) {
      // Load specific conversation
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Parse messages if stored as string
      const messages = typeof data.messages === 'string'
        ? JSON.parse(data.messages)
        : data.messages

      return NextResponse.json({
        success: true,
        conversation: { ...data, messages },
      })
    } else {
      // List all conversations (most recent first)
      const limit = parseInt(searchParams.get('limit') || '20')

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, title, message_count, last_message_at, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[Conversations] List error:', error)
        return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        conversations: data || [],
      })
    }
  } catch (error) {
    console.error('[Conversations] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE: Delete a conversation ──────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = req.nextUrl.searchParams.get('id')
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Conversations] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Conversations] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function generateTitle(messages: Array<{ role: string; content: string }>): string {
  const firstUserMsg = messages.find((m) => m.role === 'user')
  if (!firstUserMsg) return 'New Conversation'

  // Take first 50 chars of the first user message
  const title = firstUserMsg.content.substring(0, 50).trim()
  return title.length < firstUserMsg.content.length ? `${title}...` : title
}