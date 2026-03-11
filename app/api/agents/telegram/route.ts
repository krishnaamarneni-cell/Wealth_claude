// ============================================
// API Routes: Telegram Webhook
// /api/agents/telegram/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  TelegramUpdate,
  handleCommand,
  handleCallbackQuery,
  getTelegramToken,
  sendMessage,
} from '@/lib/agents/telegram';

// ============================================
// POST /api/agents/telegram
// Webhook endpoint for Telegram updates
// ============================================
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    // Get chat ID from message or callback
    const chatId = update.message?.chat.id || update.callback_query?.message.chat.id;
    const telegramUserId = update.message?.from.id || update.callback_query?.from.id;

    if (!chatId || !telegramUserId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();

    // Look up user by telegram session or create mapping
    const { data: session } = await supabase
      .from('telegram_sessions')
      .select('user_id')
      .eq('chat_id', chatId)
      .single();

    let userId = session?.user_id;

    // If no session, try to find user by matching telegram ID
    // In production, you'd want a proper linking flow
    if (!userId) {
      // For now, check if there's a user with telegram token configured
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_name', 'telegram_bot_token')
        .limit(1);

      if (apiKeys && apiKeys.length > 0) {
        userId = apiKeys[0].user_id;

        // Create session mapping
        await supabase.from('telegram_sessions').upsert({
          user_id: userId,
          chat_id: chatId,
          telegram_user_id: telegramUserId.toString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,chat_id' });
      }
    }

    if (!userId) {
      console.log('[Telegram] No user found for chat:', chatId);
      return NextResponse.json({ ok: true });
    }

    const token = await getTelegramToken(userId);
    if (!token) {
      console.log('[Telegram] No bot token for user:', userId);
      return NextResponse.json({ ok: true });
    }

    // Handle message
    if (update.message?.text) {
      const text = update.message.text.trim();

      // Check if it's a command
      if (text.startsWith('/')) {
        const parts = text.split(' ');
        const command = parts[0].toLowerCase().split('@')[0]; // Remove @botname
        const args = parts.slice(1);

        await handleCommand(userId, token, chatId, command, args);
      } else {
        // Treat as topic for quick generation
        // Find default/first active agent
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .single();

        if (agent) {
          await sendMessage(token, chatId, `📝 Got it! I'll generate content about:\n<b>${text}</b>\n\nUse /generate ${agent.name} ${text} to confirm.`);
        } else {
          await sendMessage(token, chatId, `💬 "${text}"\n\nUse /help to see available commands.`);
        }
      }
    }

    // Handle callback query (button press)
    if (update.callback_query) {
      await handleCallbackQuery(userId, token, update.callback_query);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action_type: 'telegram_command',
      action_description: `Telegram: ${update.message?.text?.slice(0, 50) || update.callback_query?.data || 'interaction'}`,
      status: 'success',
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[Telegram] Webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// ============================================
// GET /api/agents/telegram
// Setup webhook URL
// ============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const token = await getTelegramToken(user.id);
    if (!token) {
      return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 400 });
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/telegram`;

    switch (action) {
      case 'set': {
        // Set webhook
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ['message', 'callback_query'],
          }),
        });
        const result = await response.json();

        return NextResponse.json({
          success: result.ok,
          webhookUrl,
          result,
        });
      }

      case 'delete': {
        // Delete webhook
        const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
        const result = await response.json();

        return NextResponse.json({ success: result.ok, result });
      }

      case 'info':
      default: {
        // Get webhook info
        const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const result = await response.json();

        return NextResponse.json({
          success: true,
          expectedUrl: webhookUrl,
          info: result.result,
        });
      }
    }

  } catch (error: any) {
    console.error('[Telegram] Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}