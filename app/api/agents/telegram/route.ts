// ============================================
// Telegram Bot Webhook - Fixed Version
// app/api/agents/telegram/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

// Use service role client for Telegram (no user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_API = 'https://api.telegram.org/bot';

// ============================================
// POST - Handle incoming Telegram messages
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Telegram webhook received:', JSON.stringify(body, null, 2));

    // Get message or callback query
    const message = body.message || body.callback_query?.message;
    const callbackData = body.callback_query?.data;
    const chatId = message?.chat?.id;
    const text = message?.text || '';
    const fromUser = message?.from || body.callback_query?.from;

    if (!chatId) {
      console.log('No chat ID found');
      return NextResponse.json({ ok: true });
    }

    // Get bot token from database
    const botToken = await getBotToken();
    if (!botToken) {
      console.error('No bot token configured');
      return NextResponse.json({ ok: true });
    }

    // Handle callback queries (button clicks)
    if (callbackData) {
      await handleCallback(botToken, chatId, callbackData, body.callback_query.id);
      return NextResponse.json({ ok: true });
    }

    // Handle commands
    if (text.startsWith('/')) {
      await handleCommand(botToken, chatId, text, fromUser);
      return NextResponse.json({ ok: true });
    }

    // Handle regular messages (conversational)
    await handleMessage(botToken, chatId, text, fromUser);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// ============================================
// Command Handler
// ============================================
async function handleCommand(botToken: string, chatId: number, text: string, from: any) {
  const command = text.split(' ')[0].toLowerCase().replace('@', '').split('@')[0];
  const args = text.split(' ').slice(1).join(' ');

  switch (command) {
    case '/start':
      await sendMessage(botToken, chatId,
        `👋 Welcome to WealthClaude AI Agent!\n\n` +
        `I can help you:\n` +
        `• 📊 Check trending topics\n` +
        `• ✍️ Generate social media posts\n` +
        `• 📤 Publish to X & LinkedIn\n` +
        `• 📬 View your post queue\n\n` +
        `Commands:\n` +
        `/status - Check agent status\n` +
        `/trends - View current trends\n` +
        `/generate - Create a new post\n` +
        `/queue - View queued posts\n` +
        `/publish - Publish next post\n` +
        `/help - Show this message\n\n` +
        `Or just type naturally and I'll help!`
      );
      break;

    case '/help':
      await sendMessage(botToken, chatId,
        `📚 *Available Commands*\n\n` +
        `/status - Check system status\n` +
        `/trends - Discover trending topics\n` +
        `/generate [topic] - Generate a post\n` +
        `/queue - View pending posts\n` +
        `/publish - Publish next queued post\n` +
        `/agents - List your agents\n\n` +
        `💡 *Tips:*\n` +
        `• You can also chat naturally\n` +
        `• Ask "What's trending?" or "Create a post about AI"`,
        { parse_mode: 'Markdown' }
      );
      break;

    case '/status':
      await handleStatusCommand(botToken, chatId);
      break;

    case '/trends':
      await handleTrendsCommand(botToken, chatId);
      break;

    case '/generate':
      await handleGenerateCommand(botToken, chatId, args);
      break;

    case '/queue':
      await handleQueueCommand(botToken, chatId);
      break;

    case '/publish':
      await handlePublishCommand(botToken, chatId);
      break;

    case '/agents':
      await handleAgentsCommand(botToken, chatId);
      break;

    default:
      await sendMessage(botToken, chatId,
        `❓ Unknown command: ${command}\n\nType /help to see available commands.`
      );
  }
}

// ============================================
// Message Handler (Conversational)
// ============================================
async function handleMessage(botToken: string, chatId: number, text: string, from: any) {
  const lowerText = text.toLowerCase();

  // Simple intent detection
  if (lowerText.includes('trend') || lowerText.includes('what\'s hot') || lowerText.includes('trending')) {
    await handleTrendsCommand(botToken, chatId);
  } else if (lowerText.includes('status') || lowerText.includes('how are')) {
    await handleStatusCommand(botToken, chatId);
  } else if (lowerText.includes('queue') || lowerText.includes('pending')) {
    await handleQueueCommand(botToken, chatId);
  } else if (lowerText.includes('generate') || lowerText.includes('create') || lowerText.includes('write') || lowerText.includes('post about')) {
    // Extract topic from message
    const topic = text.replace(/generate|create|write|post about|a post|make/gi, '').trim();
    await handleGenerateCommand(botToken, chatId, topic || '');
  } else if (lowerText.includes('publish') || lowerText.includes('send') || lowerText.includes('post it')) {
    await handlePublishCommand(botToken, chatId);
  } else if (lowerText.includes('agent')) {
    await handleAgentsCommand(botToken, chatId);
  } else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
    await sendMessage(botToken, chatId,
      `👋 Hey! I'm your AI social media assistant.\n\n` +
      `What would you like to do?\n` +
      `• Check trends\n` +
      `• Generate a post\n` +
      `• View your queue\n\n` +
      `Just ask or use /help for commands.`
    );
  } else {
    await sendMessage(botToken, chatId,
      `🤔 I'm not sure what you mean.\n\n` +
      `Try:\n` +
      `• "What's trending?"\n` +
      `• "Create a post about AI"\n` +
      `• "Show my queue"\n\n` +
      `Or type /help for commands.`
    );
  }
}

// ============================================
// Callback Handler (Button clicks)
// ============================================
async function handleCallback(botToken: string, chatId: number, data: string, callbackId: string) {
  // Answer callback to remove loading state
  await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });

  const [action, ...params] = data.split(':');

  switch (action) {
    case 'publish':
      const postId = params[0];
      await publishPost(botToken, chatId, postId);
      break;
    case 'cancel':
      await sendMessage(botToken, chatId, '❌ Action cancelled.');
      break;
    default:
      await sendMessage(botToken, chatId, 'Unknown action.');
  }
}

// ============================================
// Command Implementations
// ============================================

async function handleStatusCommand(botToken: string, chatId: number) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, status')
    .eq('user_id', ownerId);

  const { count: queueCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', ownerId)
    .in('status', ['draft', 'scheduled']);

  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('platform, account_name, is_active')
    .eq('user_id', ownerId);

  const activeAgents = agents?.filter(a => a.status === 'active').length || 0;
  const xAccounts = socialAccounts?.filter(a => a.platform === 'x' && a.is_active).length || 0;
  const linkedinAccounts = socialAccounts?.filter(a => a.platform === 'linkedin' && a.is_active).length || 0;

  await sendMessage(botToken, chatId,
    `📊 *System Status*\n\n` +
    `🤖 Agents: ${activeAgents}/${agents?.length || 0} active\n` +
    `📝 Queue: ${queueCount || 0} posts pending\n` +
    `𝕏 X Accounts: ${xAccounts} connected\n` +
    `💼 LinkedIn: ${linkedinAccounts} connected\n\n` +
    `✅ System operational`,
    { parse_mode: 'Markdown' }
  );
}

async function handleTrendsCommand(botToken: string, chatId: number) {
  await sendMessage(botToken, chatId, '🔍 Checking trends...');

  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data: trends } = await supabase
    .from('trends')
    .select('topic, relevance_score, source')
    .eq('user_id', ownerId)
    .order('relevance_score', { ascending: false })
    .limit(5);

  if (!trends || trends.length === 0) {
    await sendMessage(botToken, chatId,
      `📊 No trends found.\n\nVisit the dashboard to discover trends.`
    );
    return;
  }

  let message = `📈 *Top Trends*\n\n`;
  trends.forEach((t, i) => {
    message += `${i + 1}. ${t.topic}\n   Score: ${t.relevance_score}/100\n\n`;
  });
  message += `\n💡 Reply with /generate [topic] to create a post`;

  await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });
}

async function handleGenerateCommand(botToken: string, chatId: number, topic: string) {
  if (!topic) {
    await sendMessage(botToken, chatId,
      `✍️ *Generate a Post*\n\n` +
      `Please provide a topic:\n` +
      `/generate AI investment trends\n\n` +
      `Or just tell me what to write about!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await sendMessage(botToken, chatId, `⏳ Generating post about: "${topic}"...`);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        user_id: process.env.AGENT_OWNER_USER_ID,
        source: 'telegram',
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      const post = data.data;
      await sendMessage(botToken, chatId,
        `✅ *Post Generated!*\n\n` +
        `📝 *X/Twitter:*\n${post.x_content || 'N/A'}\n\n` +
        `💼 *LinkedIn:*\n${post.linkedin_content?.substring(0, 200) || 'N/A'}...\n\n` +
        `🖼 Image: ${post.image_url ? 'Generated' : 'None'}\n\n` +
        `Use /queue to view or /publish to post now.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await sendMessage(botToken, chatId, `❌ Generation failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
  }
}

async function handleQueueCommand(botToken: string, chatId: number) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data: posts } = await supabase
    .from('posts')
    .select('id, topic, status, x_content, created_at')
    .eq('user_id', ownerId)
    .in('status', ['draft', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (!posts || posts.length === 0) {
    await sendMessage(botToken, chatId, `📭 Your queue is empty.\n\nUse /generate to create a post.`);
    return;
  }

  let message = `📋 *Post Queue* (${posts.length})\n\n`;
  posts.forEach((p, i) => {
    const preview = p.x_content?.substring(0, 50) || p.topic || 'No content';
    message += `${i + 1}. [${p.status}] ${preview}...\n`;
  });
  message += `\n💡 Use /publish to post the next one`;

  await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });
}

async function handlePublishCommand(botToken: string, chatId: number) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  // Get first queued post
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', ownerId)
    .in('status', ['draft', 'scheduled'])
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!post) {
    await sendMessage(botToken, chatId, `📭 No posts to publish.\n\nUse /generate to create one.`);
    return;
  }

  await sendMessage(botToken, chatId,
    `📤 *Ready to Publish:*\n\n` +
    `${post.x_content?.substring(0, 100)}...\n\n` +
    `Publishing...`
  );

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/posts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post.id,
        action: 'publish_now',
        user_id: ownerId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const results = data.data?.results || [];
      let resultMsg = `✅ *Published!*\n\n`;
      results.forEach((r: any) => {
        resultMsg += `${r.platform === 'x' ? '𝕏' : '💼'} ${r.platform}: ${r.success ? '✓ Success' : '✗ ' + r.error}\n`;
      });
      await sendMessage(botToken, chatId, resultMsg, { parse_mode: 'Markdown' });
    } else {
      await sendMessage(botToken, chatId, `❌ Failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
  }
}

async function handleAgentsCommand(botToken: string, chatId: number) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data: agents } = await supabase
    .from('agents')
    .select('name, niche, status')
    .eq('user_id', ownerId);

  if (!agents || agents.length === 0) {
    await sendMessage(botToken, chatId, `🤖 No agents configured.\n\nVisit the dashboard to create one.`);
    return;
  }

  let message = `🤖 *Your Agents*\n\n`;
  agents.forEach((a, i) => {
    const statusEmoji = a.status === 'active' ? '🟢' : '⚪';
    message += `${statusEmoji} *${a.name}*\n   ${a.niche || 'No niche'}\n\n`;
  });

  await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });
}

async function publishPost(botToken: string, chatId: number, postId: string) {
  await sendMessage(botToken, chatId, '📤 Publishing...');

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/posts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: postId,
        action: 'publish_now',
        user_id: process.env.AGENT_OWNER_USER_ID,
      }),
    });

    const data = await response.json();

    if (data.success) {
      await sendMessage(botToken, chatId, `✅ Published successfully!`);
    } else {
      await sendMessage(botToken, chatId, `❌ Failed: ${data.error}`);
    }
  } catch (error: any) {
    await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
  }
}

// ============================================
// Helper Functions
// ============================================

async function getBotToken(): Promise<string | null> {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data } = await supabase
    .from('api_keys')
    .select('encrypted_value')
    .eq('user_id', ownerId)
    .eq('key_type', 'telegram_bot_token')
    .single();

  if (!data?.encrypted_value) return null;

  try {
    return decrypt(data.encrypted_value);
  } catch {
    return null;
  }
}

async function sendMessage(
  botToken: string,
  chatId: number,
  text: string,
  options?: { parse_mode?: string; reply_markup?: any }
) {
  try {
    const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode,
        reply_markup: options?.reply_markup,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram sendMessage error:', result);
    }
    return result;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// ============================================
// GET - Webhook setup endpoint
// ============================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'setup') {
    const botToken = await getBotToken();
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/telegram`;

    const response = await fetch(`${TELEGRAM_API}${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  }

  if (action === 'info') {
    const botToken = await getBotToken();
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
    }

    const response = await fetch(`${TELEGRAM_API}${botToken}/getWebhookInfo`);
    const result = await response.json();
    return NextResponse.json(result);
  }

  return NextResponse.json({
    status: 'Telegram webhook endpoint',
    setup: '/api/agents/telegram?action=setup',
    info: '/api/agents/telegram?action=info',
  });
}