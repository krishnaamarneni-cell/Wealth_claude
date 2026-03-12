// ============================================
// Telegram Bot - Full AI Assistant
// app/api/agents/telegram/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptApiKey } from '@/lib/encryption';

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

    const message = body.message || body.callback_query?.message;
    const callbackData = body.callback_query?.data;
    const chatId = message?.chat?.id;
    const text = message?.text || '';
    const fromUser = message?.from || body.callback_query?.from;

    if (!chatId) {
      console.log('No chat ID found');
      return NextResponse.json({ ok: true });
    }

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

    // Handle natural language with AI
    await handleAIMessage(botToken, chatId, text, fromUser);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

// ============================================
// AI Message Handler - Natural Language
// ============================================
async function handleAIMessage(botToken: string, chatId: number, text: string, from: any) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  // Get API keys
  const groqKey = await getApiKey('groq');
  const perplexityKey = await getApiKey('perplexity');

  if (!groqKey) {
    await sendMessage(botToken, chatId, '❌ Groq API key not configured. Add it in Settings.');
    return;
  }

  // Send typing indicator
  await sendChatAction(botToken, chatId, 'typing');

  try {
    // Step 1: Determine intent with Groq
    const intentResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier. Classify the user's message into one of these intents:
            
- SEARCH: User wants information, news, prices, data (e.g., "What is AMD stock price?", "Latest AI news")
- CREATE_POST: User wants to create a social media post (e.g., "Create a post about...", "Write about...")
- DISCOVER_TRENDS: User wants to see trending topics (e.g., "What's trending?", "Find trends")
- CHECK_STATUS: User wants system status (e.g., "status", "how are things")
- VIEW_QUEUE: User wants to see pending posts (e.g., "show queue", "pending posts")
- PUBLISH: User wants to publish a post (e.g., "publish", "post it", "send it")
- GREETING: User is greeting (e.g., "hi", "hello")
- HELP: User needs help
- OTHER: Doesn't fit above categories

Respond with JSON only: {"intent": "INTENT_NAME", "topic": "extracted topic if relevant"}`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    const intentData = await intentResponse.json();
    const intentText = intentData.choices?.[0]?.message?.content || '{"intent": "OTHER"}';

    let intent, topic;
    try {
      const parsed = JSON.parse(intentText.replace(/```json\n?|\n?```/g, '').trim());
      intent = parsed.intent;
      topic = parsed.topic;
    } catch {
      intent = 'OTHER';
      topic = text;
    }

    console.log(`Intent: ${intent}, Topic: ${topic}`);

    // Step 2: Handle based on intent
    switch (intent) {
      case 'SEARCH':
        await handleSearchQuery(botToken, chatId, text, perplexityKey, groqKey);
        break;

      case 'CREATE_POST':
        await handleGenerateCommand(botToken, chatId, topic || text);
        break;

      case 'DISCOVER_TRENDS':
        await handleDiscoverCommand(botToken, chatId);
        break;

      case 'CHECK_STATUS':
        await handleStatusCommand(botToken, chatId);
        break;

      case 'VIEW_QUEUE':
        await handleQueueCommand(botToken, chatId);
        break;

      case 'PUBLISH':
        await handlePublishCommand(botToken, chatId);
        break;

      case 'GREETING':
        await sendMessage(botToken, chatId,
          `👋 Hey! I'm your AI assistant.\n\n` +
          `I can:\n` +
          `• Answer questions (prices, news, research)\n` +
          `• Create social media posts\n` +
          `• Discover trends\n` +
          `• Publish to X & LinkedIn\n\n` +
          `Just ask me anything!`
        );
        break;

      case 'HELP':
        await handleHelpCommand(botToken, chatId);
        break;

      default:
        // General conversation - use AI to respond
        await handleGeneralQuery(botToken, chatId, text, groqKey, perplexityKey);
    }

  } catch (error: any) {
    console.error('AI message error:', error);
    await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
  }
}

// ============================================
// Search Query Handler (Perplexity)
// ============================================
async function handleSearchQuery(
  botToken: string,
  chatId: number,
  query: string,
  perplexityKey: string | null,
  groqKey: string
) {
  if (!perplexityKey) {
    await sendMessage(botToken, chatId, '❌ Perplexity API key not configured for web search.');
    return;
  }

  await sendMessage(botToken, chatId, '🔍 Searching...');

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Provide concise, accurate answers. Include specific numbers, dates, and facts when available. Keep responses under 300 words.'
          },
          { role: 'user', content: query }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (answer) {
      // Format for Telegram (escape markdown)
      const formattedAnswer = answer.substring(0, 4000); // Telegram limit
      await sendMessage(botToken, chatId, `📊 ${formattedAnswer}`);
    } else {
      await sendMessage(botToken, chatId, '❌ Could not find an answer.');
    }

  } catch (error: any) {
    await sendMessage(botToken, chatId, `❌ Search failed: ${error.message}`);
  }
}

// ============================================
// General Query Handler
// ============================================
async function handleGeneralQuery(
  botToken: string,
  chatId: number,
  query: string,
  groqKey: string,
  perplexityKey: string | null
) {
  // Use Perplexity if available for better answers, otherwise Groq
  if (perplexityKey) {
    await handleSearchQuery(botToken, chatId, query, perplexityKey, groqKey);
  } else {
    // Fallback to Groq
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Be concise and friendly.'
            },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'I couldn\'t process that.';
      await sendMessage(botToken, chatId, answer);

    } catch (error: any) {
      await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
    }
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
        `👋 Welcome to WealthClaude AI!\n\n` +
        `I'm your intelligent assistant. I can:\n\n` +
        `🔍 *Answer Questions*\n` +
        `"What's AMD stock price?"\n` +
        `"Latest AI news"\n\n` +
        `✍️ *Create Posts*\n` +
        `"Create a post about Nvidia vs AMD"\n\n` +
        `📊 *Discover Trends*\n` +
        `/discover - Find trending topics\n\n` +
        `📤 *Publish*\n` +
        `/queue - View pending posts\n` +
        `/publish - Post to X & LinkedIn\n\n` +
        `Just chat naturally or use commands!`,
        { parse_mode: 'Markdown' }
      );
      break;

    case '/help':
      await handleHelpCommand(botToken, chatId);
      break;

    case '/discover':
      await handleDiscoverCommand(botToken, chatId);
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
        `❓ Unknown command. Type /help or just ask me anything!`
      );
  }
}

// ============================================
// Discover Trends Command (NEW!)
// ============================================
async function handleDiscoverCommand(botToken: string, chatId: number) {
  const perplexityKey = await getApiKey('perplexity');

  if (!perplexityKey) {
    await sendMessage(botToken, chatId, '❌ Perplexity API key needed for trend discovery.');
    return;
  }

  await sendMessage(botToken, chatId, '🔍 Discovering trending topics...');

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a trend analyst. Find the top 5 trending topics in AI, tech, and finance from today. For each topic, provide a brief 1-sentence description. Format as a numbered list.'
          },
          {
            role: 'user',
            content: 'What are the top 5 trending topics in AI, technology, and finance right now?'
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const trends = data.choices?.[0]?.message?.content;

    if (trends) {
      // Save trends to database
      const ownerId = process.env.AGENT_OWNER_USER_ID;

      await sendMessage(botToken, chatId,
        `📈 *Trending Now*\n\n${trends}\n\n` +
        `💡 Reply with "Create a post about [topic]" to generate content!`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await sendMessage(botToken, chatId, '❌ Could not discover trends.');
    }

  } catch (error: any) {
    await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
  }
}

// ============================================
// Help Command
// ============================================
async function handleHelpCommand(botToken: string, chatId: number) {
  await sendMessage(botToken, chatId,
    `📚 *WealthClaude AI Assistant*\n\n` +
    `*Commands:*\n` +
    `/discover - Find trending topics\n` +
    `/generate [topic] - Create a post\n` +
    `/queue - View pending posts\n` +
    `/publish - Publish next post\n` +
    `/status - System status\n` +
    `/agents - List agents\n\n` +
    `*Or just chat:*\n` +
    `• "What's Tesla stock price?"\n` +
    `• "Latest OpenAI news"\n` +
    `• "Create a post about AI trends"\n` +
    `• "What's trending?"\n` +
    `• "Show my queue"\n` +
    `• "Publish it"`,
    { parse_mode: 'Markdown' }
  );
}

// ============================================
// Status Command
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

// ============================================
// Trends Command (from DB)
// ============================================
async function handleTrendsCommand(botToken: string, chatId: number) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data: trends } = await supabase
    .from('trends')
    .select('topic, relevance_score, source')
    .eq('user_id', ownerId)
    .order('relevance_score', { ascending: false })
    .limit(5);

  if (!trends || trends.length === 0) {
    await sendMessage(botToken, chatId,
      `📊 No saved trends.\n\nUse /discover to find new trends!`
    );
    return;
  }

  let message = `📈 *Saved Trends*\n\n`;
  trends.forEach((t, i) => {
    message += `${i + 1}. ${t.topic}\n   Score: ${t.relevance_score}/100\n\n`;
  });
  message += `\n💡 "Create a post about [topic]" to generate content`;

  await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });
}

// ============================================
// Generate Command
// ============================================
async function handleGenerateCommand(botToken: string, chatId: number, topic: string) {
  if (!topic) {
    await sendMessage(botToken, chatId,
      `✍️ *Generate a Post*\n\n` +
      `Tell me what to write about:\n` +
      `• "Create a post about AI investments"\n` +
      `• /generate Nvidia vs AMD comparison\n\n` +
      `Or use /discover to find trending topics!`,
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
        `*𝕏 Twitter:*\n${post.x_content || 'N/A'}\n\n` +
        `*💼 LinkedIn:*\n${post.linkedin_content?.substring(0, 300) || 'N/A'}...\n\n` +
        `🖼 Image: ${post.image_url ? '✓ Generated' : '✗ None'}\n\n` +
        `Use /publish to post now or /queue to view all.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await sendMessage(botToken, chatId, `❌ Generation failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    await sendMessage(botToken, chatId, `❌ Error: ${error.message}`);
  }
}

// ============================================
// Queue Command
// ============================================
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
    await sendMessage(botToken, chatId,
      `📭 Your queue is empty.\n\n` +
      `Use /discover to find trends, then create a post!`
    );
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

// ============================================
// Publish Command
// ============================================
async function handlePublishCommand(botToken: string, chatId: number) {
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', ownerId)
    .in('status', ['draft', 'scheduled'])
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!post) {
    await sendMessage(botToken, chatId, `📭 No posts to publish.\n\nCreate one with /generate or ask me!`);
    return;
  }

  await sendMessage(botToken, chatId,
    `📤 *Publishing:*\n\n${post.x_content?.substring(0, 100)}...\n\n⏳ Sending...`
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

// ============================================
// Agents Command
// ============================================
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
  agents.forEach((a) => {
    const statusEmoji = a.status === 'active' ? '🟢' : '⚪';
    message += `${statusEmoji} *${a.name}*\n   ${a.niche || 'No niche'}\n\n`;
  });

  await sendMessage(botToken, chatId, message, { parse_mode: 'Markdown' });
}

// ============================================
// Callback Handler
// ============================================
async function handleCallback(botToken: string, chatId: number, data: string, callbackId: string) {
  await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });

  const [action, ...params] = data.split(':');

  switch (action) {
    case 'publish':
      await handlePublishCommand(botToken, chatId);
      break;
    case 'cancel':
      await sendMessage(botToken, chatId, '❌ Action cancelled.');
      break;
    default:
      await sendMessage(botToken, chatId, 'Unknown action.');
  }
}

// ============================================
// Helper Functions
// ============================================

async function getBotToken(): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

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

async function getApiKey(keyType: string): Promise<string | null> {
  // Try environment variables first (most reliable)
  const envKeyMap: Record<string, string | undefined> = {
    'groq': process.env.GROQ_API_KEY,
    'perplexity': process.env.PERPLEXITY_API_KEY,
    'fal_ai': process.env.FAL_AI_API_KEY,
  };

  if (envKeyMap[keyType]) {
    return envKeyMap[keyType]!;
  }

  // Fallback to database
  const ownerId = process.env.AGENT_OWNER_USER_ID;

  const { data } = await supabase
    .from('api_keys')
    .select('encrypted_value')
    .eq('user_id', ownerId)
    .eq('key_type', keyType)
    .single();

  if (!data?.encrypted_value) return null;

  try {
    return decrypt(data.encrypted_value);
  } catch (e) {
    console.error(`Failed to decrypt ${keyType}:`, e);
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

async function sendChatAction(botToken: string, chatId: number, action: string) {
  try {
    await fetch(`${TELEGRAM_API}${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action,
      }),
    });
  } catch (error) {
    console.error('Failed to send chat action:', error);
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
    status: 'Telegram AI Assistant webhook',
    setup: '/api/agents/telegram?action=setup',
    info: '/api/agents/telegram?action=info',
  });
}
