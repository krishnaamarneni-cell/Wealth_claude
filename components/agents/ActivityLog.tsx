'use client';

// ============================================
// Activity Log Component - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  Send,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Clock,
  RefreshCw,
  Loader2,
  Filter,
  ChevronDown,
  MessageCircle,
  Zap,
  Calendar,
} from 'lucide-react';

interface ActivityLog {
  id: string;
  agent_id: string | null;
  action_type: string;
  action_description: string;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  metadata: any;
  created_at: string;
  agents?: {
    name: string;
  };
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  post_created: { icon: <Send className="w-4 h-4" />, color: 'text-blue-400', label: 'Post Created' },
  post_published: { icon: <Check className="w-4 h-4" />, color: 'text-emerald-400', label: 'Published' },
  post_scheduled: { icon: <Calendar className="w-4 h-4" />, color: 'text-amber-400', label: 'Scheduled' },
  post_failed: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-400', label: 'Failed' },
  post_cancelled: { icon: <X className="w-4 h-4" />, color: 'text-zinc-400', label: 'Cancelled' },
  post_edited: { icon: <Activity className="w-4 h-4" />, color: 'text-purple-400', label: 'Edited' },
  trend_detected: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-cyan-400', label: 'Trend' },
  agent_created: { icon: <Bot className="w-4 h-4" />, color: 'text-emerald-400', label: 'Agent Created' },
  agent_updated: { icon: <Bot className="w-4 h-4" />, color: 'text-blue-400', label: 'Agent Updated' },
  buffer_connected: { icon: <Zap className="w-4 h-4" />, color: 'text-amber-400', label: 'Buffer Connected' },
  telegram_command: { icon: <MessageCircle className="w-4 h-4" />, color: 'text-sky-400', label: 'Telegram' },
  scheduler_run: { icon: <Clock className="w-4 h-4" />, color: 'text-violet-400', label: 'Scheduler' },
};

interface ActivityLogProps {
  agentId?: string;
  limit?: number;
  compact?: boolean;
}

export default function ActivityLog({ agentId, limit = 20, compact = false }: ActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [agentId, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (agentId) params.set('agent_id', agentId);
      if (filter !== 'all') params.set('status', filter);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/agents/activity?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Activity Log</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${showFilters ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchLogs}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
          {['all', 'success', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${filter === f
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {logs.length === 0 && (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
          <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No activity yet</p>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2">
        {logs.map(log => {
          const config = ACTION_CONFIG[log.action_type] || {
            icon: <Activity className="w-4 h-4" />,
            color: 'text-zinc-400',
            label: log.action_type,
          };

          return (
            <div
              key={log.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-zinc-800/50 ${compact ? 'bg-transparent' : 'bg-zinc-900/30'
                }`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg bg-zinc-800 ${config.color}`}>
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {log.agents?.name && (
                    <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                      {log.agents.name}
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${log.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : log.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 truncate mt-0.5">
                  {log.action_description}
                </p>
                {log.error_message && (
                  <p className="text-xs text-red-400 mt-1">
                    {log.error_message}
                  </p>
                )}
              </div>

              {/* Time */}
              <span className="text-xs text-zinc-600 whitespace-nowrap">
                {formatTime(log.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
