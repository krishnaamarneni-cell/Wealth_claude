// ============================================
// Telegram Bot Service
// ============================================

import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';
import { Agent } from '@/types/database';
import { generatePostForAgent, discoverTrends } from './content-engine';
import { publishPost } from './buffer';
import { runSchedulerCycle } from './scheduler';

// ============================================
// Types
// ============================================

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
    }>;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

// ============================================
// Telegram API Helpers
// ============================================

export async function getTelegramToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('user_id', userId)
    .eq('key_name', 'telegram_bot_token')
    .is('agent_id', null)
    .single();

  return data ? decryptApiKey(data.key_value) : null;
}

export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    replyMarkup?: any;
  }
): Promise<TelegramResponse> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: options?.replyMarkup,
    }),
  });

  return response.json();
}

export async function sendPhoto(
  token: string,
  chatId: number,
  photoUrl: string,
  caption?: string
): Promise<TelegramResponse> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
    }),
  });

  return response.json();
}

export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string
): Promise<TelegramResponse> {
  const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });

  return response.json();
}

export async function editMessageText(
  token: string,
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: any
): Promise<TelegramResponse> {
  const response = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });

  return response.json();
}

// ============================================
// Command Handlers
// ============================================

export async function handleCommand(
  userId: string,
  token: string,
  chatId: number,
  command: string,
  args: string[]
): Promise<void> {
  const supabase = await createClient();

  switch (command) {
    case '/start':
    case '/help': {
      await sendMessage(token, chatId, `
🤖 <b>WealthClaude Agent Bot</b>

<b>Commands:</b>
/status - View agent status
/agents - List all agents
/trends - Discover trending topics
/generate [agent] [topic] - Generate post
/post [agent] - Auto-generate and post
/queue - View post queue
/run - Run scheduler cycle
/help - Show this message

<b>Quick Actions:</b>
Just send me a topic and I'll generate content for it!
      `);
      break;
    }

    case '/status': {
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId);

      const { data: posts } = await supabase
        .from('posts')
        .select('status')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const activeAgents = agents?.filter(a => a.status === 'active').length || 0;
      const postsToday = posts?.length || 0;
      const postedToday = posts?.filter(p => p.status === 'posted').length || 0;

      await sendMessage(token, chatId, `
📊 <b>Status Overview</b>

🤖 Agents: ${activeAgents} active / ${agents?.length || 0} total
📝 Posts today: ${postedToday} posted / ${postsToday} total
⏰ Last check: Just now
      `);
      break;
    }

    case '/agents': {
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (!agents || agents.length === 0) {
        await sendMessage(token, chatId, '❌ No agents found. Create one in the dashboard.');
        return;
      }

      const agentList = agents.map(a => {
        const status = a.status === 'active' ? '🟢' : a.status === 'paused' ? '🟡' : '⚪';
        return `${status} <b>${a.name}</b>\n   ${a.niche || 'No niche'} • ${a.posting_frequency_minutes}m interval`;
      }).join('\n\n');

      await sendMessage(token, chatId, `🤖 <b>Your Agents</b>\n\n${agentList}`);
      break;
    }

    case '/trends': {
      const agentName = args[0];

      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!agents || agents.length === 0) {
        await sendMessage(token, chatId, '❌ No active agents found.');
        return;
      }

      const agent = agentName
        ? agents.find(a => a.name.toLowerCase().includes(agentName.toLowerCase()))
        : agents[0];

      if (!agent) {
        await sendMessage(token, chatId, `❌ Agent "${agentName}" not found.`);
        return;
      }

      await sendMessage(token, chatId, `🔍 Discovering trends for <b>${agent.name}</b>...`);

      try {
        const trends = await discoverTrends(userId, agent);

        const buttons = trends.slice(0, 5).map((trend, i) => ([{
          text: `📝 ${trend.slice(0, 30)}${trend.length > 30 ? '...' : ''}`,
          callback_data: `gen:${agent.id}:${i}`,
        }]));

        // Store trends in session for callback
        await supabase.from('telegram_sessions').upsert({
          user_id: userId,
          chat_id: chatId,
          session_data: { trends, agent_id: agent.id },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,chat_id' });

        await sendMessage(token, chatId,
          `📈 <b>Trending for ${agent.name}</b>\n\n${trends.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nTap to generate:`,
          { replyMarkup: { inline_keyboard: buttons } }
        );
      } catch (error: any) {
        await sendMessage(token, chatId, `❌ Error: ${error.message}`);
      }
      break;
    }

    case '/generate': {
      const [agentName, ...topicParts] = args;
      const topic = topicParts.join(' ');

      if (!agentName || !topic) {
        await sendMessage(token, chatId, '❌ Usage: /generate [agent name] [topic]');
        return;
      }

      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${agentName}%`)
        .single();

      if (!agent) {
        await sendMessage(token, chatId, `❌ Agent "${agentName}" not found.`);
        return;
      }

      await sendMessage(token, chatId, `⏳ Generating content for <b>${agent.name}</b>...\n\nTopic: ${topic}`);

      try {
        const result = await generatePostForAgent(userId, agent, topic);

        if (result.success && result.post) {
          const post = result.post;

          if (post.image_url) {
            await sendPhoto(token, chatId, post.image_url,
              `✅ <b>Post Generated!</b>\n\n<b>𝕏:</b> ${post.x_content?.slice(0, 100)}...`
            );
          }

          await sendMessage(token, chatId,
            `📝 <b>Full Content</b>\n\n<b>𝕏:</b>\n${post.x_content}\n\n<b>LinkedIn:</b>\n${post.linkedin_content?.slice(0, 300)}...`,
            {
              replyMarkup: {
                inline_keyboard: [
                  [
                    { text: '🚀 Publish Now', callback_data: `pub:${post.id}` },
                    { text: '❌ Cancel', callback_data: `del:${post.id}` },
                  ],
                ],
              },
            }
          );
        } else {
          await sendMessage(token, chatId, `❌ Generation failed: ${result.error}`);
        }
      } catch (error: any) {
        await sendMessage(token, chatId, `❌ Error: ${error.message}`);
      }
      break;
    }

    case '/queue': {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, agents(name)')
        .eq('user_id', userId)
        .in('status', ['draft', 'scheduled'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!posts || posts.length === 0) {
        await sendMessage(token, chatId, '📭 Post queue is empty.');
        return;
      }

      const queueList = posts.map(p => {
        const status = p.status === 'scheduled' ? '⏰' : '📝';
        const agent = (p.agents as any)?.name || 'Unknown';
        return `${status} <b>${p.topic?.slice(0, 40) || 'Untitled'}...</b>\n   ${agent} • ${p.status}`;
      }).join('\n\n');

      await sendMessage(token, chatId, `📋 <b>Post Queue</b>\n\n${queueList}`);
      break;
    }

    case '/run': {
      await sendMessage(token, chatId, '⏳ Running scheduler cycle...');

      try {
        const result = await runSchedulerCycle(userId);

        const newTrends = result.trends.reduce((sum, t) => sum + t.newTrends.length, 0);
        const postsCreated = result.autoPosts.filter(p => p.success).length;
        const scheduled = result.scheduledPosts.success;

        await sendMessage(token, chatId, `
✅ <b>Scheduler Complete</b>

📈 New trends: ${newTrends}
📝 Posts created: ${postsCreated}
📤 Scheduled published: ${scheduled}
        `);
      } catch (error: any) {
        await sendMessage(token, chatId, `❌ Error: ${error.message}`);
      }
      break;
    }

    default: {
      await sendMessage(token, chatId, `❓ Unknown command. Use /help for available commands.`);
    }
  }
}

// ============================================
// Callback Query Handler
// ============================================

export async function handleCallbackQuery(
  userId: string,
  token: string,
  callbackQuery: NonNullable<TelegramUpdate['callback_query']>
): Promise<void> {
  const supabase = await createClient();
  const { id, data, message } = callbackQuery;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  // Parse callback data
  const [action, ...params] = data.split(':');

  await answerCallbackQuery(token, id);

  switch (action) {
    case 'gen': {
      // Generate from trend: gen:agentId:trendIndex
      const [agentId, indexStr] = params;
      const index = parseInt(indexStr);

      // Get stored trends from session
      const { data: session } = await supabase
        .from('telegram_sessions')
        .select('session_data')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .single();

      const trends = session?.session_data?.trends as string[];
      const topic = trends?.[index];

      if (!topic) {
        await editMessageText(token, chatId, messageId, '❌ Trend expired. Use /trends again.');
        return;
      }

      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (!agent) {
        await editMessageText(token, chatId, messageId, '❌ Agent not found.');
        return;
      }

      await editMessageText(token, chatId, messageId, `⏳ Generating: ${topic}...`);

      try {
        const result = await generatePostForAgent(userId, agent, topic);

        if (result.success && result.post) {
          await editMessageText(token, chatId, messageId,
            `✅ Post generated!\n\n<b>Topic:</b> ${topic}\n\n<b>𝕏:</b> ${result.post.x_content}`,
            {
              inline_keyboard: [
                [
                  { text: '🚀 Publish', callback_data: `pub:${result.post.id}` },
                  { text: '🗑 Delete', callback_data: `del:${result.post.id}` },
                ],
              ],
            }
          );
        } else {
          await editMessageText(token, chatId, messageId, `❌ Failed: ${result.error}`);
        }
      } catch (error: any) {
        await editMessageText(token, chatId, messageId, `❌ Error: ${error.message}`);
      }
      break;
    }

    case 'pub': {
      // Publish post: pub:postId
      const [postId] = params;

      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', userId)
        .single();

      if (!post) {
        await editMessageText(token, chatId, messageId, '❌ Post not found.');
        return;
      }

      await editMessageText(token, chatId, messageId, '⏳ Publishing...');

      try {
        const result = await publishPost(userId, post, true);

        if (result.success) {
          await editMessageText(token, chatId, messageId,
            `✅ Published to ${result.results.filter(r => r.success).length} platform(s)!`
          );
        } else {
          await editMessageText(token, chatId, messageId,
            `⚠️ Partial publish. Errors:\n${result.results.filter(r => !r.success).map(r => r.error).join('\n')}`
          );
        }
      } catch (error: any) {
        await editMessageText(token, chatId, messageId, `❌ Error: ${error.message}`);
      }
      break;
    }

    case 'del': {
      // Delete post: del:postId
      const [postId] = params;

      await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      await editMessageText(token, chatId, messageId, '🗑 Post deleted.');
      break;
    }

    case 'approve': {
      // Approve trend: approve:trendId
      const [trendId] = params;

      await supabase
        .from('trends')
        .update({ user_approved: true })
        .eq('id', trendId);

      await editMessageText(token, chatId, messageId, '✅ Trend approved for posting.');
      break;
    }
  }
}

// ============================================
// Notification Sender
// ============================================

export async function sendTrendNotification(
  userId: string,
  agentName: string,
  trends: string[]
): Promise<void> {
  const supabase = await createClient();
  const token = await getTelegramToken(userId);

  if (!token) return;

  // Get user's chat ID from session
  const { data: session } = await supabase
    .from('telegram_sessions')
    .select('chat_id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!session?.chat_id) return;

  const trendList = trends.map((t, i) => `${i + 1}. ${t}`).join('\n');

  await sendMessage(token, session.chat_id, `
🔔 <b>New Trends Detected!</b>

<b>Agent:</b> ${agentName}

${trendList}

Open dashboard to review and generate posts.
  `);
}