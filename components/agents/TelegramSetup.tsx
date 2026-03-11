'use client';

// ============================================
// Telegram Setup Panel - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Link2,
  Unlink,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface WebhookInfo {
  url?: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
}

export default function TelegramSetup() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [expectedUrl, setExpectedUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWebhookInfo();
  }, []);

  const fetchWebhookInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/agents/telegram?action=info');
      const data = await response.json();

      if (data.success) {
        setWebhookInfo(data.info);
        setExpectedUrl(data.expectedUrl);
      } else {
        setError(data.error || 'Failed to fetch webhook info');
      }
    } catch (err) {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const setWebhook = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch('/api/agents/telegram?action=set');
      const data = await response.json();

      if (data.success) {
        await fetchWebhookInfo();
      } else {
        setError(data.error || 'Failed to set webhook');
      }
    } catch (err) {
      setError('Failed to set webhook');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteWebhook = async () => {
    if (!confirm('Disconnect Telegram bot?')) return;

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch('/api/agents/telegram?action=delete');
      const data = await response.json();

      if (data.success) {
        await fetchWebhookInfo();
      } else {
        setError(data.error || 'Failed to delete webhook');
      }
    } catch (err) {
      setError('Failed to delete webhook');
    } finally {
      setActionLoading(false);
    }
  };

  const copyBotCommands = () => {
    const commands = `/start - Start the bot
/help - Show available commands
/status - View agent status
/agents - List all agents
/trends - Discover trending topics
/generate [agent] [topic] - Generate post
/queue - View post queue
/run - Run scheduler cycle`;

    navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = webhookInfo?.url === expectedUrl;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#0088cc] rounded-xl">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Telegram Bot</h3>
          <p className="text-sm text-zinc-500">Control your agents via Telegram</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isConnected
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-zinc-800 text-zinc-400'
          }`}>
          {isConnected ? (
            <>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Connected
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-zinc-500 rounded-full" />
              Not Connected
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Webhook URL</span>
          <button
            onClick={fetchWebhookInfo}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <code className="text-sm text-zinc-300 break-all">
            {webhookInfo?.url || 'No webhook set'}
          </code>
        </div>

        {webhookInfo?.last_error_message && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 font-medium mb-1">Last Error</p>
            <p className="text-sm text-red-300">{webhookInfo.last_error_message}</p>
          </div>
        )}

        <div className="flex gap-3">
          {isConnected ? (
            <button
              onClick={deleteWebhook}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              Disconnect
            </button>
          ) : (
            <button
              onClick={setWebhook}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect Webhook
            </button>
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
        <h4 className="font-medium text-white">Setup Instructions</h4>

        <ol className="space-y-3 text-sm text-zinc-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-white text-xs flex items-center justify-center">1</span>
            <span>Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">@BotFather</a> on Telegram</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-white text-xs flex items-center justify-center">2</span>
            <span>Copy the bot token and add it to API Connections</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-white text-xs flex items-center justify-center">3</span>
            <span>Click "Connect Webhook" above</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-white text-xs flex items-center justify-center">4</span>
            <span>Send /start to your bot to begin</span>
          </li>
        </ol>
      </div>

      {/* Commands Reference */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">Bot Commands</h4>
          <button
            onClick={copyBotCommands}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy for BotFather'}
          </button>
        </div>

        <div className="grid gap-2 text-sm">
          <CommandRow cmd="/status" desc="View agent status overview" />
          <CommandRow cmd="/agents" desc="List all your agents" />
          <CommandRow cmd="/trends" desc="Discover trending topics" />
          <CommandRow cmd="/generate" desc="Generate post from topic" />
          <CommandRow cmd="/queue" desc="View pending posts" />
          <CommandRow cmd="/run" desc="Run scheduler manually" />
        </div>
      </div>
    </div>
  );
}

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
      <code className="text-emerald-400 font-mono text-sm min-w-[100px]">{cmd}</code>
      <span className="text-zinc-500">{desc}</span>
    </div>
  );
}
